from __future__ import annotations

import time
from collections.abc import Callable

from fastapi import APIRouter, Request

from api.access_control import AccessControl


def create_system_router(
    *,
    app_started_at: float,
    utc_now: Callable[[], str],
    access_control: AccessControl,
    workspace_id_from_request: Callable[[Request], str],
) -> APIRouter:
    router = APIRouter()

    @router.get("/api/health")
    async def health():
        return {
            "status": "ok",
            "product": "Urban Heat Democratization",
            "uptimeSec": round(time.time() - app_started_at, 2),
        }

    @router.get("/api/v1/health")
    async def health_v1():
        return {
            "status": "ok",
            "product": "Urban Heat Democratization",
            "timestamp": utc_now(),
            "uptimeSec": round(time.time() - app_started_at, 2),
            "apiVersion": "v1",
            "authEnforced": access_control.enforce_auth,
        }

    @router.get("/api/v1/auth/session")
    async def auth_session(request: Request):
        workspace_id = workspace_id_from_request(request)
        session = access_control.ensure_access(request, minimum_role="viewer", workspace_id=workspace_id)
        return {
            "userId": session.user_id,
            "displayName": session.display_name,
            "authEnforced": access_control.enforce_auth,
            "activeWorkspaceId": workspace_id,
            "memberships": access_control.list_workspaces(session),
        }

    @router.get("/api/v1/workspaces")
    async def list_workspaces(request: Request):
        workspace_id = workspace_id_from_request(request)
        session = access_control.ensure_access(request, minimum_role="viewer", workspace_id=workspace_id)
        return access_control.list_workspaces(session)

    return router
