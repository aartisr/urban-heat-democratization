import geopandas as gpd
import rasterio
from shapely.geometry import box
import os

def check_overlay_alignment(overlay_path, city_boundary_path, buffer_m=0):
    # Load city boundary
    city = gpd.read_file(city_boundary_path)
    # Get overlay bounds
    with rasterio.open(overlay_path) as src:
        bounds = src.bounds
        overlay_crs = src.crs
    # Create a GeoDataFrame for overlay bounds
    overlay_gdf = gpd.GeoDataFrame(geometry=[box(*bounds)], crs=overlay_crs)
    # Reproject overlay to city CRS if needed
    if overlay_gdf.crs != city.crs:
        overlay_gdf = overlay_gdf.to_crs(city.crs)
    # Optionally buffer city boundary
    city_union = city.unary_union.buffer(buffer_m)
    # Check intersection and containment
    intersects = overlay_gdf.intersects(city_union)[0]
    within = overlay_gdf.within(city_union)[0]
    print(f"Overlay intersects city boundary: {intersects}")
    print(f"Overlay is fully within city boundary (buffer {buffer_m}m): {within}")
    return intersects, within

if __name__ == "__main__":
    # Example usage: python check_overlay_alignment.py overlay.tif boston_boundary.geojson
    import sys
    if len(sys.argv) < 3:
        print("Usage: python check_overlay_alignment.py <overlay.tif> <city_boundary.geojson> [buffer_m]")
        sys.exit(1)
    overlay_path = sys.argv[1]
    city_boundary_path = sys.argv[2]
    buffer_m = float(sys.argv[3]) if len(sys.argv) > 3 else 0
    check_overlay_alignment(overlay_path, city_boundary_path, buffer_m)
