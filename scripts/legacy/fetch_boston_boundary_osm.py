import requests
import json
from pathlib import Path

def fetch_boston_boundary_osm(output_path="data/boston_boundary.geojson"):
    osm_url = "https://polygons.openstreetmap.fr/get_geojson.py?id=343025&type=relation"
    print("Fetching Boston boundary from polygons.openstreetmap.fr...")
    response = requests.get(osm_url, timeout=30)
    if response.status_code != 200:
        raise RuntimeError(f"Failed to fetch OSM boundary: {response.status_code}")
    geojson = response.json()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(geojson, f)
    print(f"Boston boundary saved to {output_path}")

if __name__ == "__main__":
    fetch_boston_boundary_osm()