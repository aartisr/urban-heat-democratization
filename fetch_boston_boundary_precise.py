import requests
from pathlib import Path

url = "https://s3.amazonaws.com/og-production-open-data-bostonma-892364687672/resources/f72680e8-aa7a-4cbc-93d8-17de0d728164/city_of_boston_outline_boundary_water_included.geojson?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJJIENTAPKHZMIPXQ%2F20260217%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260217T015348Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=66ad02b822daa29fd16a10a03ee6ce44e4fd646f59956c2a901ec84f56d6a382"
out_path = Path("data/boston_boundary_precise.geojson")

resp = requests.get(url)
resp.raise_for_status()
out_path.parent.mkdir(exist_ok=True)
out_path.write_bytes(resp.content)
print(f"Downloaded to {out_path}")
