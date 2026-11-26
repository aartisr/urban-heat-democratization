# Urban Heat Democratization - API Documentation

## Base URL

```
http://localhost:8000
```

## Health Check

### GET /api/v1/health

Health check endpoint to verify application is running.

**Request**:
```bash
curl http://localhost:8000/api/v1/health
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

## Cities Endpoints

### GET /api/v1/cities

List all cities with pagination support.

**Query Parameters**:
- `offset` (integer, optional): Starting position (default: 0)
- `limit` (integer, optional): Maximum results per page (default: 10)

**Request**:
```bash
curl "http://localhost:8000/api/v1/cities?offset=0&limit=10"
```

**Response** (200 OK):
```json
{
  "cities": [
    {
      "id": "city_1",
      "name": "Boston",
      "latitude": 42.3601,
      "longitude": -71.0589,
      "population": 692600,
      "region": "Northeast"
    },
    {
      "id": "city_2",
      "name": "New York",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "population": 8398748,
      "region": "Northeast"
    }
  ],
  "total": 2,
  "offset": 0,
  "limit": 10
}
```

**Error Responses**:
- 400 Bad Request: Invalid offset or limit values
- 500 Internal Server Error: Database connection failed

### GET /api/v1/cities/{city_id}

Retrieve a specific city by ID.

**Path Parameters**:
- `city_id` (string, required): The unique city identifier

**Request**:
```bash
curl http://localhost:8000/api/v1/cities/city_1
```

**Response** (200 OK):
```json
{
  "id": "city_1",
  "name": "Boston",
  "latitude": 42.3601,
  "longitude": -71.0589,
  "population": 692600,
  "region": "Northeast",
  "climate_data": {
    "avg_temp": 10.5,
    "avg_humidity": 65,
    "annual_rainfall": 1150
  }
}
```

**Error Responses**:
- 404 Not Found: City does not exist
- 500 Internal Server Error: Database error

### POST /api/v1/cities

Create a new city.

**Request Body**:
```json
{
  "name": "Chicago",
  "latitude": 41.8781,
  "longitude": -87.6298,
  "population": 2716000,
  "region": "Midwest",
  "climate_data": {
    "avg_temp": 9.5,
    "avg_humidity": 60,
    "annual_rainfall": 920
  }
}
```

**Request**:
```bash
curl -X POST http://localhost:8000/api/v1/cities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chicago",
    "latitude": 41.8781,
    "longitude": -87.6298,
    "population": 2716000,
    "region": "Midwest"
  }'
```

**Response** (201 Created):
```json
{
  "id": "city_3",
  "name": "Chicago",
  "latitude": 41.8781,
  "longitude": -87.6298,
  "population": 2716000,
  "region": "Midwest"
}
```

**Error Responses**:
- 400 Bad Request: Invalid city data
- 409 Conflict: City already exists
- 500 Internal Server Error: Database error

## Runs Endpoints

### GET /api/v1/runs

List all simulation runs with optional filtering.

**Query Parameters**:
- `city_id` (string, optional): Filter runs by city
- `offset` (integer, optional): Starting position (default: 0)
- `limit` (integer, optional): Maximum results per page (default: 10)

**Request**:
```bash
curl "http://localhost:8000/api/v1/runs?city_id=city_1&offset=0&limit=10"
```

**Response** (200 OK):
```json
{
  "runs": [
    {
      "id": "run_1",
      "city_id": "city_1",
      "scenario": "baseline",
      "timestamp": "2024-01-15T10:30:00Z",
      "status": "completed",
      "duration_seconds": 120,
      "results": {
        "avg_temperature_increase": 2.5,
        "peak_heat_days": 15,
        "vulnerable_population_affected": 50000
      }
    }
  ],
  "total": 1,
  "offset": 0,
  "limit": 10
}
```

**Error Responses**:
- 400 Bad Request: Invalid city_id or pagination parameters
- 500 Internal Server Error: Database error

### GET /api/v1/runs/{run_id}

Retrieve a specific run by ID.

**Path Parameters**:
- `run_id` (string, required): The unique run identifier

**Request**:
```bash
curl http://localhost:8000/api/v1/runs/run_1
```

**Response** (200 OK):
```json
{
  "id": "run_1",
  "city_id": "city_1",
  "scenario": "baseline",
  "timestamp": "2024-01-15T10:30:00Z",
  "status": "completed",
  "duration_seconds": 120,
  "results": {
    "avg_temperature_increase": 2.5,
    "peak_heat_days": 15,
    "vulnerable_population_affected": 50000
  },
  "interventions": [
    {
      "name": "urban_greening",
      "coverage_percent": 20,
      "temperature_reduction": 1.2
    }
  ]
}
```

**Error Responses**:
- 404 Not Found: Run does not exist
- 500 Internal Server Error: Database error

### POST /api/v1/runs

Create a new simulation run.

**Request Body**:
```json
{
  "city_id": "city_1",
  "scenario": "cool_pavement",
  "interventions": [
    {
      "name": "cool_pavement",
      "coverage_percent": 30
    }
  ]
}
```

**Request**:
```bash
curl -X POST http://localhost:8000/api/v1/runs \
  -H "Content-Type: application/json" \
  -d '{
    "city_id": "city_1",
    "scenario": "cool_pavement",
    "interventions": [
      {
        "name": "cool_pavement",
        "coverage_percent": 30
      }
    ]
  }'
```

**Response** (201 Created):
```json
{
  "id": "run_2",
  "city_id": "city_1",
  "scenario": "cool_pavement",
  "timestamp": "2024-01-15T11:00:00Z",
  "status": "submitted",
  "duration_seconds": null
}
```

**Error Responses**:
- 400 Bad Request: Invalid run data or city not found
- 409 Conflict: Run configuration invalid
- 500 Internal Server Error: Simulation failed to start

## Response Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/POST/PUT request |
| 201 | Created | Successful POST creating new resource |
| 400 | Bad Request | Invalid parameters or malformed request |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource already exists or state conflict |
| 500 | Server Error | Unexpected server-side error |

## Error Response Format

All error responses follow a standard format:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "City with ID 'nonexistent' not found",
    "details": {
      "type": "City",
      "id": "nonexistent"
    }
  }
}
```

## Request/Response Format

- **Content-Type**: `application/json`
- **Character Encoding**: UTF-8
- **Date Format**: ISO 8601 (`2024-01-15T10:30:00Z`)

## Rate Limiting

No rate limiting currently implemented. For production:
- Implement token-based rate limiting (e.g., 100 requests/minute per user)
- Add request throttling for long-running simulation jobs

## Pagination

Paginated endpoints support:
- `offset`: Zero-based starting position
- `limit`: Maximum results per page (default 10, max 100)

Example:
```bash
# Get second page (10-20)
curl "http://localhost:8000/api/v1/cities?offset=10&limit=10"
```

## Filtering

Supported filters:
- Cities: `region`, `name` (partial match)
- Runs: `city_id`, `scenario`, `status`

Example:
```bash
# Filter runs by city and scenario
curl "http://localhost:8000/api/v1/runs?city_id=city_1&scenario=baseline"
```

## Versioning

API version is included in the URL path: `/api/v1/...`

Future versions (`/api/v2/...`) will maintain backward compatibility while adding new features.

## Examples

### Python

```python
import requests

# List cities
response = requests.get("http://localhost:8000/api/v1/cities")
cities = response.json()["cities"]

# Get specific city
response = requests.get(f"http://localhost:8000/api/v1/cities/{cities[0]['id']}")
city = response.json()

# Create run
run_data = {
    "city_id": city["id"],
    "scenario": "baseline"
}
response = requests.post("http://localhost:8000/api/v1/runs", json=run_data)
run = response.json()
```

### JavaScript (Fetch API)

```javascript
// List cities
const response = await fetch('http://localhost:8000/api/v1/cities');
const { cities } = await response.json();

// Get specific city
const city = await fetch(`http://localhost:8000/api/v1/cities/${cities[0].id}`)
  .then(r => r.json());

// Create run
const run = await fetch('http://localhost:8000/api/v1/runs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    city_id: city.id,
    scenario: 'baseline'
  })
}).then(r => r.json());
```

### cURL

```bash
# List cities
curl http://localhost:8000/api/v1/cities

# Get city
curl http://localhost:8000/api/v1/cities/city_1

# Create run
curl -X POST http://localhost:8000/api/v1/runs \
  -H "Content-Type: application/json" \
  -d '{"city_id":"city_1","scenario":"baseline"}'
```

## Support

For API issues or questions, refer to:
- API source: `api/routers/`
- Service implementations: `api/services/`
- Documentation: `docs/`
