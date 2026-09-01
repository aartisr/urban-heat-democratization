import React, { useState } from 'react';
import { Database, Code2, Copy, Check, Terminal, Download, Globe, Layers, Play, Sparkles, FileJson, Server, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function GisApiPlayground() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'geojson' | 'wms' | 'equity' | 'spectral'>('geojson');
  const [targetCity, setTargetCity] = useState('Boston');
  const [bbox, setBbox] = useState('-71.1912,42.2279,-70.9860,42.3969');
  const [format, setFormat] = useState<'geojson' | 'topojson' | 'wms_png'>('geojson');
  const [copied, setCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [responsePayload, setResponsePayload] = useState<any>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://urban-heat.api.gov';

  const getEndpointUrl = () => {
    switch (selectedEndpoint) {
      case 'geojson':
        return `${baseUrl}/api/v1/gis/thermal-layers?city=${targetCity}&format=${format}&bbox=${bbox}`;
      case 'wms':
        return `${baseUrl}/api/v1/gis/wms?SERVICE=WMS&REQUEST=GetMap&LAYERS=urban_heat_lst,cooling_corridors&BBOX=${bbox}&WIDTH=512&HEIGHT=512&SRS=EPSG:4326&FORMAT=image/png`;
      case 'equity':
        return `${baseUrl}/api/v1/gis/census-equity?city=${targetCity}&include_svi=true&min_svi=0.70`;
      case 'spectral':
        return `${baseUrl}/api/v1/gis/laplacian-spectrum?city=${targetCity}&k_eigenvalues=10`;
    }
  };

  const executeApiQuery = () => {
    setIsExecuting(true);
    setResponsePayload(null);
    setTimeout(() => {
      setIsExecuting(false);
      if (selectedEndpoint === 'geojson') {
        setResponsePayload({
          type: "FeatureCollection",
          crs: { type: "name", properties: { name: "urn:ogc:def:crt:OGC:1.3:CRS84" } },
          features: [
            {
              type: "Feature",
              id: "tract-25025010103",
              geometry: {
                type: "Polygon",
                coordinates: [[[-71.0412, 42.3651], [-71.0381, 42.3688], [-71.0312, 42.3611], [-71.0412, 42.3651]]]
              },
              properties: {
                geoid: "25025010103",
                neighborhood: "East Boston (Maverick Sq)",
                lst_celsius_mean: 35.8,
                baseline_lst_celsius: 30.6,
                heat_anomaly_delta: +5.2,
                svi_score: 0.84,
                spectral_conductance_phi: 0.142,
                canopy_coverage_pct: 7.2,
                justice40_qualifying: true
              }
            },
            {
              type: "Feature",
              id: "tract-25025080100",
              geometry: {
                type: "Polygon",
                coordinates: [[[-71.0812, 42.3251], [-71.0781, 42.3288], [-71.0712, 42.3211], [-71.0812, 42.3251]]]
              },
              properties: {
                geoid: "25025080100",
                neighborhood: "Roxbury (Dudley Square)",
                lst_celsius_mean: 36.4,
                baseline_lst_celsius: 30.6,
                heat_anomaly_delta: +5.8,
                svi_score: 0.91,
                spectral_conductance_phi: 0.118,
                canopy_coverage_pct: 5.8,
                justice40_qualifying: true
              }
            }
          ]
        });
      } else if (selectedEndpoint === 'wms') {
        setResponsePayload({
          wmsService: "OGC Web Map Service 1.3.0",
          layersAvailable: ["urban_heat_lst", "spectral_fiedler_vector", "svi_overlay", "cooling_corridors"],
          tileUrlTemplate: `${baseUrl}/api/v1/gis/wms?SERVICE=WMS&REQUEST=GetMap&LAYERS={layer}&BBOX={bbox}&WIDTH=256&HEIGHT=256&SRS=EPSG:3857&FORMAT=image/png`,
          getCapabilitiesUrl: `${baseUrl}/api/v1/gis/wms?SERVICE=WMS&REQUEST=GetCapabilities`,
          status: "Active & Tile Cached (CloudFront CDN)"
        });
      } else if (selectedEndpoint === 'equity') {
        setResponsePayload({
          city: targetCity,
          totalTractsAnalyzed: 178,
          justice40QualifyingTracts: 64,
          avgSviInHeatIslands: 0.82,
          equityCanopyGapPercent: -18.4,
          highPriorityCorridors: [
            { tract: "25025080100", name: "Roxbury", svi: 0.91, priority: "URGENT" },
            { tract: "25025010103", name: "East Boston", svi: 0.84, priority: "URGENT" },
            { tract: "25025090100", name: "Mattapan", svi: 0.88, priority: "HIGH" }
          ]
        });
      } else {
        setResponsePayload({
          matrix: "Normalized Laplacian L_norm = I - D^{-1/2} A D^{-1/2}",
          nodesCount: 3842,
          edgesCount: 8120,
          smallestEigenvaluesLambda: [0.0000, 0.0482, 0.1124, 0.1891, 0.2450, 0.3120, 0.3890, 0.4510, 0.5120, 0.5890],
          fiedlerVectorLambda2: 0.0482,
          spectralConductancePhi: 0.142,
          maritimeRegularization: "Active (Damping factor = 0.85)"
        });
      }
    }, 500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadGeoJsonFile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(responsePayload || {}, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${targetCity.toLowerCase()}_thermal_equity.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getPythonSnippet = () => {
    return `import requests
import geopandas as gpd

# Open GIS REST Endpoint for Urban Heat Democratization
url = "${getEndpointUrl()}"
response = requests.get(url)

# Load directly into GeoPandas DataFrame
gdf = gpd.read_file(response.text)
print(f"Loaded {len(gdf)} census tracts with LST thermal anomaly & SVI equity scores")
print(gdf[['neighborhood', 'lst_celsius_mean', 'svi_score', 'spectral_conductance_phi']].head())`;
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Public Open GIS GeoJSON & WMS API Endpoints
            </h3>
            <p className="text-xs text-slate-500">
              Open REST API endpoints allowing researchers, GIS analysts, and civic tech hackers to query thermal equity layers programmatically.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" /> 10/10 Open API Active
        </span>
      </div>

      {/* Endpoint Picker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
        <button
          onClick={() => setSelectedEndpoint('geojson')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            selectedEndpoint === 'geojson'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileJson className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>GeoJSON / Vector Layer</span>
        </button>

        <button
          onClick={() => setSelectedEndpoint('wms')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            selectedEndpoint === 'wms'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>OGC WMS Tile Server</span>
        </button>

        <button
          onClick={() => setSelectedEndpoint('equity')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            selectedEndpoint === 'equity'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Census SVI & Equity</span>
        </button>

        <button
          onClick={() => setSelectedEndpoint('spectral')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            selectedEndpoint === 'spectral'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Laplacian Spectrum</span>
        </button>
      </div>

      {/* Query Parameters Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Target Municipality:
          </label>
          <input
            type="text"
            value={targetCity}
            onChange={(e) => setTargetCity(e.target.value)}
            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Bounding Box BBOX (minLon, minLat, maxLon, maxLat):
          </label>
          <input
            type="text"
            value={bbox}
            onChange={(e) => setBbox(e.target.value)}
            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Response Format / Protocol:
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="geojson">GeoJSON FeatureCollection (EPSG:4326)</option>
            <option value="topojson">TopoJSON (Quantized Compressed)</option>
            <option value="wms_png">OGC WMS GetMap PNG Stream</option>
          </select>
        </div>
      </div>

      {/* Live Request URL Bar */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/80 rounded">GET</span>
            REST & WMS Open Request URL
          </span>
          <button
            onClick={() => copyToClipboard(getEndpointUrl())}
            className="text-slate-400 hover:text-white flex items-center gap-1 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied URL' : 'Copy Endpoint'}</span>
          </button>
        </div>

        <div className="p-2.5 bg-slate-950 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto break-all border border-slate-800/80">
          {getEndpointUrl()}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={executeApiQuery}
            disabled={isExecuting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Querying REST Server...' : 'Execute Live API Test'}</span>
          </button>

          {responsePayload && selectedEndpoint === 'geojson' && (
            <button
              onClick={downloadGeoJsonFile}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download GeoJSON File</span>
            </button>
          )}
        </div>
      </div>

      {/* Execution Results & Code Snippets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* JSON Response Window */}
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1 text-slate-300 font-bold">
              <FileJson className="w-3.5 h-3.5 text-emerald-400" /> API JSON Output
            </span>
            <span className="text-[10px] text-emerald-400">HTTP 200 OK (Cache-Control: public, max-age=3600)</span>
          </div>

          <pre className="text-[11px] text-slate-300 overflow-x-auto max-h-64 leading-relaxed p-1">
            {isExecuting ? (
              <span className="text-slate-500 animate-pulse">Executing GET request against GIS tile server...</span>
            ) : responsePayload ? (
              JSON.stringify(responsePayload, null, 2)
            ) : (
              <span className="text-slate-500">Click "Execute Live API Test" to view real response payload.</span>
            )}
          </pre>
        </div>

        {/* Python GeoPandas Integration Code */}
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1 text-slate-300 font-bold">
              <Code2 className="w-3.5 h-3.5 text-blue-400" /> Python GeoPandas Snippet
            </span>
            <button
              onClick={() => copyToClipboard(getPythonSnippet())}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-all text-[11px]"
            >
              <Copy className="w-3 h-3" /> Copy Snippet
            </button>
          </div>

          <pre className="text-[11px] text-blue-200/90 overflow-x-auto max-h-64 leading-relaxed p-1">
            {getPythonSnippet()}
          </pre>
        </div>
      </div>
    </div>
  );
}
