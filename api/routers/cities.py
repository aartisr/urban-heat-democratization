"""City router for HTTP endpoints.

Thin delegation layer that routes HTTP requests to service layer.
Responsible for:
- Request validation and transformation
- HTTP status codes and error responses
- Response serialization

Design:
- Router has ZERO business logic
- All logic delegated to CityService
- Independent of service implementation
- 100% testable by mocking service
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from api.services.city import CityService, CityDTO
from api.services.base import NotFoundError, ValidationError


class CityProfileResponse(BaseModel):
    """City profile response schema."""
    id: str
    name: str
    region: str
    population: str
    status: str = "Research"
    baselineTempC: float = Field(alias="baseline_temp_c")
    canopyCoverage: str = Field(alias="canopy_coverage")
    planningCostMultiplier: float = Field(alias="planning_cost_multiplier")
    description: str = ""

    model_config = {"populate_by_name": True}


def create_cities_router(service: CityService) -> APIRouter:
    """Create cities router with injected service.

    Args:
        service: CityService instance

    Returns:
        Configured APIRouter for cities endpoints
    """
    router = APIRouter()

    @router.get("/api/v1/cities", response_model=dict[str, list[CityProfileResponse]])
    async def list_cities() -> dict[str, list[CityProfileResponse]]:
        """List all cities.

        Returns:
            Dictionary with 'cities' key containing list of profiles
        """
        try:
            cities = await service.list_cities()
            return {
                "cities": [
                    CityProfileResponse(
                        id=c.id,
                        name=c.name,
                        region=c.region,
                        population=c.population,
                        status=c.status,
                        baseline_temp_c=c.baseline_temp_c,
                        canopy_coverage=c.canopy_coverage,
                        planning_cost_multiplier=c.planning_cost_multiplier,
                        description=c.description,
                    )
                    for c in cities
                ]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.get("/api/v1/cities/{city_id}", response_model=CityProfileResponse)
    async def get_city(city_id: str) -> CityProfileResponse:
        """Get city profile by ID.

        Args:
            city_id: City identifier

        Returns:
            City profile

        Raises:
            HTTPException: If city not found
        """
        try:
            city = await service.get_city(city_id)
            return CityProfileResponse(
                id=city.id,
                name=city.name,
                region=city.region,
                population=city.population,
                status=city.status,
                baseline_temp_c=city.baseline_temp_c,
                canopy_coverage=city.canopy_coverage,
                planning_cost_multiplier=city.planning_cost_multiplier,
                description=city.description,
            )
        except NotFoundError:
            raise HTTPException(status_code=404, detail=f"City '{city_id}' not found")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.post("/api/v1/cities", response_model=CityProfileResponse, status_code=201)
    async def create_city(request: dict) -> CityProfileResponse:
        """Create new city profile.

        Args:
            request: City data

        Returns:
            Created city profile

        Raises:
            HTTPException: If validation fails
        """
        try:
            city_dto = CityDTO(
                id=str(request.get("id", "")),
                name=str(request.get("name", "")),
                region=str(request.get("region", "")),
                population=str(request.get("population", "")),
                status=str(request.get("status", "Research")),
                baseline_temp_c=float(request.get("baseline_temp_c", 32.0)),
                canopy_coverage=str(request.get("canopy_coverage", "")),
                planning_cost_multiplier=float(request.get("planning_cost_multiplier", 1.0)),
                description=str(request.get("description", "")),
            )
            created = await service.create_city(city_dto)
            return CityProfileResponse(
                id=created.id,
                name=created.name,
                region=created.region,
                population=created.population,
                status=created.status,
                baseline_temp_c=created.baseline_temp_c,
                canopy_coverage=created.canopy_coverage,
                planning_cost_multiplier=created.planning_cost_multiplier,
                description=created.description,
            )
        except ValidationError as e:
            raise HTTPException(status_code=422, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return router
