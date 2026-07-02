
import requests
import json
from pathlib import Path

def fetch_boston_boundary_from_dataport(output_path="data/boston_boundary.geojson"):
    url = "https://data.boston.gov/dataset/city-of-boston-boundary/resource/7b2b2b2b-7b2b-7b2b-7b2b-7b2b7b2b7b2b/download/city_of_boston_boundary.geojson"
    print(f"Fetching Boston boundary from {url}")
    response = requests.get(url)
    if response.status_code != 200:
        raise RuntimeError(f"Failed to fetch boundary: {response.status_code}")
    geojson = response.json()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(geojson, f)
    print(f"Boston boundary saved to {output_path}")

if __name__ == "__main__":
    fetch_boston_boundary_from_dataport()
