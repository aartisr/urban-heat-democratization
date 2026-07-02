import requests
import zipfile
import io
import json
from pathlib import Path

def fetch_boston_boundary_massgis(output_path="data/boston_boundary.geojson"):
    # MassGIS municipal boundaries (ZIP)
    url_https = "https://download.massgis.digital.mass.gov/arcgis/rest/services/Boundary/Community_Boundaries/MapServer/0/query?where=NAME='BOSTON'&outFields=*&f=geojson"
    url_http = "http://download.massgis.digital.mass.gov/arcgis/rest/services/Boundary/Community_Boundaries/MapServer/0/query?where=NAME='BOSTON'&outFields=*&f=geojson"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; fetch-script/1.0)"}
    print(f"Fetching Boston boundary from MassGIS: {url_https}")
    try:
        response = requests.get(url_https, headers=headers, timeout=10)
    except requests.exceptions.SSLError:
        print("SSL error on HTTPS, trying HTTP fallback...")
        response = requests.get(url_http, headers=headers, timeout=10)
    if response.status_code != 200:
        raise RuntimeError(f"Failed to fetch boundary: {response.status_code}")
    geojson = response.json()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(geojson, f)
    print(f"Boston boundary saved to {output_path}")

if __name__ == "__main__":
    fetch_boston_boundary_massgis()
