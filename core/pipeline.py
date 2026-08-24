from pathlib import Path
import time

import networkx as nx
import numpy as np

from .graph import build_weighted_grid
from .percolation import percolation_scan
from .raster import load_raster, normalize, valid_mask
from .reliability import reliability_to_sinks
from .spectra import lambda2_and_fiedler, sweep_conductance


class Results:
    """Container for pipeline results."""

    def __init__(self):
        self.lambda2_baseline = None
        self.lambda2_opt = None
        self.phi_baseline = None
        self.phi_opt = None
        self.reliab_baseline = None
        self.reliab_opt = None
        self.percolation_p = []
        self.percolation_baseline = []
        self.percolation_opt = []
        self.figures = []
        self.recommendations = []
        self.summary = ""
        self.outputs = {}


def _load_inputs(lst_path, ndvi_path=None, max_size=220):
    lst_data = load_raster(lst_path, max_size=max_size)
    ndvi = None
    if ndvi_path:
        ndvi_data = load_raster(ndvi_path, max_size=max_size)
        ndvi = ndvi_data.array
    return lst_data.array, ndvi, lst_data.transform, lst_data.crs


def _preprocess(lst, ndvi):
    lst01 = normalize(lst)
    nd01 = normalize(ndvi) if ndvi is not None else None
    if nd01 is not None and nd01.shape != lst01.shape:
        rows = min(lst01.shape[0], nd01.shape[0])
        cols = min(lst01.shape[1], nd01.shape[1])
        lst01 = lst01[:rows, :cols]
        nd01 = nd01[:rows, :cols]
    mask = valid_mask(lst01) if nd01 is None else valid_mask(lst01, nd01)
    lst01 = np.where(mask, lst01, np.nan)
    if nd01 is not None:
        nd01 = np.where(mask, nd01, np.nan)
    return lst01, nd01


def _sink_nodes(G, nd01, lst01):
    rc_to_node = {G.nodes[n]["rc"]: n for n in G.nodes()}
    if nd01 is not None:
        threshold = np.nanpercentile(nd01, 95)
        sinks_rc = np.argwhere(np.isfinite(nd01) & (nd01 >= threshold))
    else:
        threshold = np.nanpercentile(lst01, 5)
        sinks_rc = np.argwhere(np.isfinite(lst01) & (lst01 <= threshold))
    return {rc_to_node[(int(r), int(c))] for r, c in sinks_rc if (int(r), int(c)) in rc_to_node}


def _selection_mask(G, selected_nodes, shape):
    mask = np.zeros(shape, dtype=bool)
    for u in selected_nodes:
        if u in G:
            r, c = G.nodes[u]["rc"]
            mask[r, c] = True
    return mask


def _cut_boundary_mask(G, selected_nodes, shape, dilation=2):
    boundary = np.zeros(shape, dtype=bool)
    selected_nodes = set(selected_nodes)
    for u, v in G.edges():
        if (u in selected_nodes) == (v in selected_nodes):
            continue
        for node in (u, v):
            r, c = G.nodes[node]["rc"]
            boundary[r, c] = True

    if dilation <= 0 or not boundary.any():
        return boundary
    try:
        from scipy import ndimage

        return ndimage.binary_dilation(boundary, iterations=dilation)
    except Exception:
        rows, cols = np.where(boundary)
        expanded = boundary.copy()
        for row, col in zip(rows, cols):
            r0 = max(0, row - dilation)
            r1 = min(shape[0], row + dilation + 1)
            c0 = max(0, col - dilation)
            c1 = min(shape[1], col + dilation + 1)
            expanded[r0:r1, c0:c1] = True
        return expanded


def _distance_to_sinks(G, sinks, shape):
    """Return relative least-cost cooling access, scaled to [0, 1].

    Dijkstra distance is computed over ``cost = geometric_length / conductance``.
    The distance is inverted before normalization, so a value near one means
    easier modeled access to an inferred sink.  The legacy output filename
    ``resistance_proxy`` refers to the underlying least-cost construction, not
    to the direction of this returned score.
    """
    if not sinks:
        return np.full(shape, np.nan, dtype="float32")
    H = G.copy()
    super_sink = -1
    for sink in sinks:
        H.add_edge(super_sink, sink, cost=0.0, w=1.0)
    dist = nx.single_source_dijkstra_path_length(H, super_sink, weight="cost")
    dist_map = np.full(shape, np.nan, dtype="float32")
    for node, value in dist.items():
        if node == super_sink or node not in G:
            continue
        r, c = G.nodes[node]["rc"]
        dist_map[r, c] = value
    return normalize(-dist_map)


def _cheeger_priority(cheeger_mask, lst01, resistance):
    heat = np.nan_to_num(lst01, nan=0.0)
    poor_access = 1.0 - np.nan_to_num(resistance, nan=0.0)
    priority = (0.65 * heat) + (0.35 * poor_access)
    return np.where(cheeger_mask, np.clip(priority, 0, 1), 0).astype("float32")


def _component_labels(mask):
    try:
        from scipy import ndimage

        labels, count = ndimage.label(mask, structure=np.ones((3, 3), dtype=int))
        return labels, count
    except Exception:
        labels = np.zeros(mask.shape, dtype=int)
        count = 0
        current = 0
        for start in zip(*np.where(mask & (labels == 0))):
            current += 1
            stack = [start]
            labels[start] = current
            while stack:
                r, c = stack.pop()
                for dr in (-1, 0, 1):
                    for dc in (-1, 0, 1):
                        if dr == 0 and dc == 0:
                            continue
                        rr, cc = r + dr, c + dc
                        if 0 <= rr < mask.shape[0] and 0 <= cc < mask.shape[1] and mask[rr, cc] and labels[rr, cc] == 0:
                            labels[rr, cc] = current
                            stack.append((rr, cc))
        return labels, current


def _nearest_sink_location(G, sinks, center_row, center_col, transform):
    if not sinks:
        return None

    best = None
    best_dist = None
    for sink in sinks:
        if sink not in G:
            continue
        row, col = G.nodes[sink]["rc"]
        dist = float(np.hypot(row - center_row, col - center_col))
        if best_dist is None or dist < best_dist:
            lon, lat = transform * (col + 0.5, row + 0.5)
            best = {"latitude": float(lat), "longitude": float(lon), "pixel_distance": dist}
            best_dist = dist
    return best


def _priority_class(priority, heat, access):
    if priority >= 0.7 or (heat >= 0.65 and access < 0.45):
        return "High"
    if priority >= 0.45 or heat >= 0.55 or access < 0.55:
        return "Medium"
    return "Watch"


def _make_recommendations(cheeger_mask, priority, lst01, nd01, resistance, transform, G=None, sinks=None, max_items=5):
    labels, count = _component_labels(cheeger_mask)
    recs = []
    for label_id in range(1, count + 1):
        region = labels == label_id
        pixel_count = int(region.sum())
        if pixel_count == 0:
            continue
        rows, cols = np.where(region)
        center_row = float(rows.mean())
        center_col = float(cols.mean())
        lon, lat = transform * (center_col + 0.5, center_row + 0.5)
        mean_heat = float(np.nanmean(lst01[region]))
        mean_priority = float(np.nanmean(priority[region]))
        mean_access = float(np.nanmean(resistance[region]))
        mean_ndvi = float(np.nanmean(nd01[region])) if nd01 is not None else None
        nearest_sink = _nearest_sink_location(G, sinks or set(), center_row, center_col, transform) if G is not None else None
        priority_class = _priority_class(mean_priority, mean_heat, mean_access)

        actions = [
            "Create or reinforce a continuous shaded/vegetated corridor through this bottleneck.",
            "Prioritize interventions along streets, parcels, or open-space edges that connect this region to nearby high-NDVI cooling sinks.",
        ]
        if mean_ndvi is None or mean_ndvi < 0.35:
            actions.append("Add street trees, planting strips, pocket parks, and soil-volume improvements because vegetation is low here.")
        else:
            actions.append("Protect and connect existing vegetation; infill canopy gaps rather than treating the area as blank-slate planting.")
        if mean_heat >= 0.65:
            actions.append("Use cool pavement, shade structures, and high-albedo roofs on adjacent hardscape because local heat intensity is high.")
        if mean_access < 0.45:
            actions.append("Improve links toward cooling sinks first; the resistance proxy says cooling access is currently weak.")

        if nearest_sink is not None:
            street_level_guidance = (
                "Start with the street segments and public-realm edges around the priority coordinate, "
                "then extend shade/green infrastructure along the walking or street corridor toward the nearest inferred cooling sink."
            )
        else:
            street_level_guidance = (
                "Start with the street segments and public-realm edges around the priority coordinate, "
                "then connect the intervention to the nearest visible park, canopy corridor, waterfront edge, or other cooling asset."
            )

        recs.append(
            {
                "rank": 0,
                "latitude": float(lat),
                "longitude": float(lon),
                "map_url": f"https://www.google.com/maps/search/?api=1&query={float(lat):.6f},{float(lon):.6f}",
                "priority_class": priority_class,
                "pixel_count": pixel_count,
                "priority": mean_priority,
                "heat_intensity": mean_heat,
                "cooling_access": mean_access,
                "ndvi": mean_ndvi,
                "nearest_cooling_sink": nearest_sink,
                "street_level_guidance": street_level_guidance,
                "actions": actions,
            }
        )

    recs.sort(key=lambda item: (item["priority"], item["pixel_count"]), reverse=True)
    for idx, rec in enumerate(recs[:max_items], start=1):
        rec["rank"] = idx
    return recs[:max_items]


def _optimize_interventions(G, cheeger_set, sinks, boost=1.5, budget_fraction=0.04):
    """Greedy conductance boost over thermal bottleneck edges.

    The paper frames intervention selection as submodular optimization with
    certificates. This lightweight implementation uses the same monotone design
    idea for the demo: strengthen a bounded set of Cheeger-boundary/sink-adjacent
    conductances and report the resulting spectral/reliability changes.
    """
    G_opt = G.copy()
    if G_opt.number_of_edges() == 0:
        return G_opt, []

    boundary_edges = []
    for u, v, data in G.edges(data=True):
        crosses_cut = (u in cheeger_set) != (v in cheeger_set)
        touches_sink = u in sinks or v in sinks
        if crosses_cut or touches_sink:
            boundary_edges.append((u, v, data.get("w", 1.0)))
    if not boundary_edges:
        boundary_edges = [(u, v, d.get("w", 1.0)) for u, v, d in G.edges(data=True)]

    boundary_edges.sort(key=lambda item: item[2])
    budget = max(1, int(budget_fraction * len(boundary_edges)))
    chosen = boundary_edges[:budget]
    for u, v, _ in chosen:
        edge = G_opt[u][v]
        edge["w"] = float(edge.get("w", 1.0) * boost)
        edge["cost"] = float(edge.get("cost", 1.0) / boost)
    return G_opt, [(u, v) for u, v, _ in chosen]


def _save_geotiff(arr, transform, crs, path, dtype, nodata=0):
    try:
        import rasterio

        profile = {
            "driver": "GTiff",
            "height": arr.shape[0],
            "width": arr.shape[1],
            "count": 1,
            "dtype": dtype,
            "crs": crs,
            "transform": transform,
            "nodata": nodata,
            "compress": "lzw",
        }
        clean = np.nan_to_num(arr, nan=nodata)
        with rasterio.open(path, "w", **profile) as dst:
            dst.write(clean.astype(dtype), 1)
        return True
    except Exception as exc:
        print(f"[WARN] GeoTIFF export failed for {path}: {exc}")
        return False


def _save_cheeger_geojson(priority_arr, transform, crs, path, min_priority=1.0):
    try:
        import json
        from rasterio.features import shapes
        from shapely.geometry import shape, mapping
        from shapely.ops import transform as shapely_transform
        from pyproj import Transformer

        mask = np.isfinite(priority_arr) & (priority_arr >= min_priority)
        features = []
        transformer = None
        if crs and str(crs).upper() not in {"EPSG:4326", "OGC:CRS84"}:
            transformer = Transformer.from_crs(crs, "EPSG:4326", always_xy=True)

        for geom, value in shapes(priority_arr.astype("float32"), mask=mask, transform=transform):
            geom_obj = shape(geom)
            if geom_obj.is_empty:
                continue
            if transformer is not None:
                geom_obj = shapely_transform(transformer.transform, geom_obj)
            features.append(
                {
                    "type": "Feature",
                    "geometry": mapping(geom_obj),
                    "properties": {
                        "priority": float(value),
                        "priority_class": "High" if value >= 70 else "Medium" if value >= 40 else "Watch",
                    },
                }
            )

        payload = {
            "type": "FeatureCollection",
            "name": "Cheeger Bottleneck Priority",
            "features": features,
        }
        with open(path, "w") as f:
            json.dump(payload, f)
        return True
    except Exception as exc:
        print(f"[WARN] Cheeger GeoJSON export failed for {path}: {exc}")
        return False


def _save_resistance_zones_geojson(resistance_arr, transform, crs, path, max_access=35.0):
    try:
        import json
        from rasterio.features import shapes
        from shapely.geometry import shape, mapping
        from shapely.ops import transform as shapely_transform
        from pyproj import Transformer

        mask = np.isfinite(resistance_arr) & (resistance_arr > 0) & (resistance_arr <= max_access)
        features = []
        transformer = None
        if crs and str(crs).upper() not in {"EPSG:4326", "OGC:CRS84"}:
            transformer = Transformer.from_crs(crs, "EPSG:4326", always_xy=True)

        for geom, value in shapes(resistance_arr.astype("float32"), mask=mask, transform=transform):
            geom_obj = shape(geom)
            if geom_obj.is_empty:
                continue
            if transformer is not None:
                geom_obj = shapely_transform(transformer.transform, geom_obj)
            access = float(value)
            features.append(
                {
                    "type": "Feature",
                    "geometry": mapping(geom_obj),
                    "properties": {
                        "cooling_access": access,
                        "access_class": "Very Low" if access <= 20 else "Low",
                    },
                }
            )

        payload = {
            "type": "FeatureCollection",
            "name": "Low Cooling Access Zones",
            "features": features,
        }
        with open(path, "w") as f:
            json.dump(payload, f)
        return True
    except Exception as exc:
        print(f"[WARN] Resistance zones GeoJSON export failed for {path}: {exc}")
        return False


def _load_boundary_geometry(boundary_path, dst_crs):
    try:
        import json
        from shapely.geometry import shape
        from shapely.ops import transform as shapely_transform
        from pyproj import Transformer

        with open(boundary_path) as f:
            geojson = json.load(f)
        if geojson.get("type") == "FeatureCollection":
            geometries = [shape(feature["geometry"]) for feature in geojson["features"]]
        elif geojson.get("type") == "Feature":
            geometries = [shape(geojson["geometry"])]
        else:
            geometries = [shape(geojson)]

        if str(dst_crs).upper() not in {"EPSG:4326", "OGC:CRS84"}:
            transformer = Transformer.from_crs("EPSG:4326", dst_crs, always_xy=True)
            geometries = [shapely_transform(transformer.transform, geom) for geom in geometries]
        return [geom for geom in geometries if not geom.is_empty]
    except Exception as exc:
        print(f"[WARN] Could not load boundary geometry from {boundary_path}: {exc}")
        return []


def _mask_to_boundary(arr, transform, boundary_geometries, nodata=0):
    if not boundary_geometries:
        return arr
    try:
        from rasterio.features import geometry_mask

        inside = geometry_mask(
            [geom.__geo_interface__ for geom in boundary_geometries],
            out_shape=arr.shape,
            transform=transform,
            invert=True,
        )
        return np.where(inside, arr, nodata)
    except Exception as exc:
        print(f"[WARN] Boundary mask failed: {exc}")
        return arr


def _save_kml(tif_path, kml_path, name):
    try:
        import rasterio
        import simplekml

        with rasterio.open(str(tif_path)) as src:
            bounds = src.bounds
        kml = simplekml.Kml()
        kml.newgroundoverlay(
            name=name,
            icon=str(tif_path),
            latlonbox=simplekml.LatLonBox(
                north=bounds.top,
                south=bounds.bottom,
                east=bounds.right,
                west=bounds.left,
            ),
        )
        kml.save(str(kml_path))
        return True
    except Exception as exc:
        print(f"[WARN] KML export failed for {kml_path}: {exc}")
        return False


def _save_figures(out, lst01, nd01, cheeger_mask, cheeger_priority, resistance, p_vals, frac_base, frac_opt, lam2, lam2_opt, rel_base, rel_opt):
    import matplotlib.pyplot as plt

    figures = []

    fig1 = out / "fig1.png"
    plt.figure(figsize=(7, 5))
    plt.title("Pareto: Spectral Gap vs Cooling Reliability")
    plt.scatter([lam2], [rel_base], c="tab:blue", s=80, label="Baseline")
    plt.scatter([lam2_opt], [rel_opt], c="tab:orange", s=80, label="Intervention")
    plt.xlabel("Spectral gap lambda2")
    plt.ylabel("Sink connectivity reliability")
    plt.legend()
    plt.tight_layout()
    plt.savefig(fig1, dpi=160)
    plt.close()
    figures.append(fig1)

    fig2 = out / "fig2.png"
    plt.figure(figsize=(7, 5))
    plt.title("Bond Percolation Phase Scan")
    plt.plot(p_vals, frac_base, "-o", label="Baseline")
    plt.plot(p_vals, frac_opt, "-s", label="Intervention")
    plt.axhline(0.5, color="0.55", ls="--", lw=1)
    plt.xlabel("Bond retention probability p")
    plt.ylabel("Giant component fraction")
    plt.legend()
    plt.tight_layout()
    plt.savefig(fig2, dpi=160)
    plt.close()
    figures.append(fig2)

    fig3 = out / "fig3.png"
    plt.figure(figsize=(7, 6))
    plt.title("Cheeger Thermal Bottleneck Priority")
    plt.imshow(lst01, cmap="inferno")
    overlay = plt.imshow(np.ma.masked_where(~cheeger_mask, cheeger_priority), cmap="plasma", alpha=0.65, vmin=0, vmax=1)
    plt.colorbar(overlay, label="Bottleneck priority")
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(fig3, dpi=160)
    plt.close()
    figures.append(fig3)

    fig4 = out / "fig4.png"
    plt.figure(figsize=(7, 6))
    plt.title("Cooling Sink Resistance Proxy")
    plt.imshow(resistance, cmap="YlGnBu", vmin=0, vmax=1)
    plt.axis("off")
    plt.colorbar(label="Higher = easier cooling access")
    plt.tight_layout()
    plt.savefig(fig4, dpi=160)
    plt.close()
    figures.append(fig4)

    if nd01 is not None:
        fig5 = out / "fig_ndvi.png"
        plt.figure(figsize=(6, 5))
        plt.title("NDVI Cooling Sink Field")
        plt.imshow(nd01, cmap="Greens", vmin=0, vmax=1)
        plt.axis("off")
        plt.tight_layout()
        plt.savefig(fig5, dpi=140)
        plt.close()

    return figures


def run_pipeline(
    lst_path,
    ndvi_path=None,
    out_dir=".",
    progress_callback=None,
    connect8=True,
    alpha=3.0,
    beta=0.6,
    max_size=220,
    reliability_trials=64,
):
    t0 = time.time()
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    def progress(percent, message):
        if progress_callback:
            progress_callback(percent, message)

    progress(5, "Loading raster data...")
    lst, ndvi, transform, crs = _load_inputs(lst_path, ndvi_path, max_size=max_size)

    progress(12, "Preprocessing LST/NDVI fields...")
    lst01, nd01 = _preprocess(lst, ndvi)

    progress(22, "Building weighted urban conductance graph...")
    G, _ = build_weighted_grid(lst01, nd01, connect8=connect8, alpha=alpha, beta=beta)
    if G.number_of_nodes() < 2:
        raise ValueError("Input rasters did not produce at least two valid analysis cells.")
    if not nx.is_connected(G):
        raise ValueError("Input rasters produce a disconnected graph; mask gaps or analyze connected components separately.")

    progress(35, "Computing spectral gap and Cheeger bottleneck...")
    lam2, fiedler, nodes, deg = lambda2_and_fiedler(G)
    phi, cheeger_set = sweep_conductance(G, fiedler, nodes, deg)
    cheeger_mask = _cut_boundary_mask(G, cheeger_set, lst01.shape)

    progress(48, "Finding cooling sinks and resistance proxy...")
    sinks = _sink_nodes(G, nd01, lst01)
    resistance = _distance_to_sinks(G, sinks, lst01.shape)
    cheeger_priority = _cheeger_priority(cheeger_mask, lst01, resistance)
    recommendations = _make_recommendations(cheeger_mask, cheeger_priority, lst01, nd01, resistance, transform, G=G, sinks=sinks)

    progress(58, "Applying bottleneck intervention scenario...")
    G_opt, chosen_edges = _optimize_interventions(G, cheeger_set, sinks)
    lam2_opt, fiedler_opt, nodes_opt, deg_opt = lambda2_and_fiedler(G_opt)
    phi_opt, _ = sweep_conductance(G_opt, fiedler_opt, nodes_opt, deg_opt)

    progress(68, "Running percolation and reliability estimates...")
    p_vals = np.linspace(0.1, 1.0, 10)
    frac_base = percolation_scan(G, list(p_vals), rng=np.random.default_rng(42))
    frac_opt = percolation_scan(G_opt, list(p_vals), rng=np.random.default_rng(43))
    rel_base = reliability_to_sinks(G, sinks, p_keep=0.7, trials=reliability_trials, rng=np.random.default_rng(123))
    rel_opt = reliability_to_sinks(G_opt, sinks, p_keep=0.7, trials=reliability_trials, rng=np.random.default_rng(124))

    progress(82, "Saving figures and overlays...")
    figures = _save_figures(out, lst01, nd01, cheeger_mask, cheeger_priority, resistance, p_vals, frac_base, frac_opt, lam2, lam2_opt, rel_base, rel_opt)
    cheeger_tif = out / "cheeger_bottleneck.tif"
    resistance_tif = out / "resistance_proxy.tif"
    cheeger_geojson = out / "cheeger_bottleneck.geojson"
    resistance_zones_geojson = out / "low_cooling_access_zones.geojson"
    boundary_geometries = _load_boundary_geometry("data/boston_boundary_precise.geojson", crs)
    cheeger_export = _mask_to_boundary((100 * cheeger_priority).astype("float32"), transform, boundary_geometries, nodata=0)
    resistance_export = _mask_to_boundary((100 * resistance).astype("float32"), transform, boundary_geometries, nodata=0)
    _save_geotiff(cheeger_export, transform, crs, cheeger_tif, "float32", nodata=0)
    _save_cheeger_geojson(cheeger_export, transform, crs, cheeger_geojson)
    _save_geotiff(resistance_export, transform, crs, resistance_tif, "float32", nodata=0)
    _save_resistance_zones_geojson(resistance_export, transform, crs, resistance_zones_geojson)
    _save_kml(cheeger_tif, out / "cheeger_bottleneck.kml", "Cheeger Thermal Bottleneck")
    _save_kml(resistance_tif, out / "resistance_proxy.kml", "Cooling Sink Resistance Proxy")

    progress(92, "Generating analysis report...")
    top_recommendation = ""
    if recommendations:
        top = recommendations[0]
        top_recommendation = (
            f"Top mitigation priority: near {top['latitude']:.5f}, {top['longitude']:.5f}; "
            f"priority {top['priority']:.3f}; recommended action: {top['actions'][0]}\n"
        )

    summary = (
        f"Spectral gap lambda2 (baseline): {lam2:.6f}\n"
        f"Spectral gap lambda2 (intervention): {lam2_opt:.6f}\n"
        f"Conductance phi (baseline): {phi:.6f}\n"
        f"Conductance phi (intervention): {phi_opt:.6f}\n"
        f"Reliability to cooling sinks (baseline): {rel_base:.6f}\n"
        f"Reliability to cooling sinks (intervention): {rel_opt:.6f}\n"
        f"Intervention edges boosted: {len(chosen_edges)}\n"
        f"Priority bottleneck regions found: {len(recommendations)}\n"
        f"{top_recommendation}"
        "Implementation note: GMRF posterior fields, formal FPRAS certificates, "
        "and full submodular proof certificates are represented here by deterministic "
        "raster graph analysis plus Monte Carlo reliability/percolation proxies."
    )
    report_pdf = out / "Spectral_Urbanism_Analysis_Report.pdf"
    report_docx = out / "Spectral_Urbanism_Analysis_Report.docx"
    report_zip = out / "Spectral_Urbanism_Analysis_Package.zip"
    recommendations_json = out / "mitigation_recommendations.json"
    try:
        import json

        with open(recommendations_json, "w") as f:
            json.dump({"recommendations": recommendations}, f, indent=2)
    except Exception as exc:
        print(f"[WARN] Could not write mitigation recommendations: {exc}")
    try:
        from core import report

        report.generate_pdf(report_pdf, figures=figures, summary_text=summary)
        report.generate_docx(report_docx, figures=figures, summary_text=summary)
        report.generate_zip(report_zip, [report_pdf, report_docx, recommendations_json, cheeger_tif, cheeger_geojson, resistance_tif, resistance_zones_geojson, *figures])
    except Exception as exc:
        print(f"[WARN] Report generation failed: {exc}")

    res = Results()
    res.lambda2_baseline = lam2
    res.lambda2_opt = lam2_opt
    res.phi_baseline = phi
    res.phi_opt = phi_opt
    res.reliab_baseline = rel_base
    res.reliab_opt = rel_opt
    res.percolation_p = list(map(float, p_vals))
    res.percolation_baseline = list(map(float, frac_base))
    res.percolation_opt = list(map(float, frac_opt))
    res.figures = figures
    res.recommendations = recommendations
    res.summary = summary
    res.outputs = {
        "cheeger_tif": cheeger_tif,
        "cheeger_geojson": cheeger_geojson,
        "resistance_tif": resistance_tif,
        "resistance_zones_geojson": resistance_zones_geojson,
        "report_pdf": report_pdf,
        "report_docx": report_docx,
        "report_zip": report_zip,
        "recommendations_json": recommendations_json,
        "runtime_seconds": time.time() - t0,
    }
    progress(100, "Pipeline complete.")
    return res
