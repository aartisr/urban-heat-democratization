import requests
import json
from pathlib import Path

def fetch_boston_boundary(output_path="data/boston_boundary.geojson"):
    # Correct OSM relation ID for Boston, MA
    osm_relation_id = 29589
    url = f"https://polygons.openstreetmap.fr/get_geojson.py?id={osm_relation_id}&type=relation"
    print(f"Fetching Boston boundary from {url}")
    response = requests.get(url)
    if response.status_code != 200:
        raise RuntimeError(f"Failed to fetch boundary: {response.status_code}")
    geojson = response.json()
    # Save to file
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(geojson, f)
    print(f"Boston boundary saved to {output_path}")

if __name__ == "__main__":
    fetch_boston_boundary()
