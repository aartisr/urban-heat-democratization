from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Literal

from fastapi import HTTPException, Request

Role = Literal["viewer", "editor", "admin"]
_ROLE_RANK: dict[Role, int] = {"viewer": 1, "editor": 2, "admin": 3}


@dataclass(frozen=True)
class WorkspaceMembership:
    workspace_id: str
    role: Role


@dataclass(frozen=True)
class UserSession:
    user_id: str
    display_name: str
    memberships: tuple[WorkspaceMembership, ...]

    def role_for(self, workspace_id: str) -> Role | None:
        for membership in self.memberships:
            if membership.workspace_id == workspace_id:
                return membership.role
        return None


class AccessControl:
    def __init__(self, enforce_auth: bool, token_map: dict[str, UserSession]) -> None:
        self.enforce_auth = enforce_auth
        self.token_map = token_map

    @classmethod
    def from_env(cls) -> "AccessControl":
        enforce_auth = os.getenv("UHD_ENFORCE_AUTH", "false").strip().lower() in {"1", "true", "yes", "on"}
        payload = os.getenv("UHD_ACCESS_TOKENS", "").strip()
        token_map = cls._default_token_map()
        if payload:
            try:
                parsed = json.loads(payload)
                if isinstance(parsed, dict):
                    token_map = cls._parse_token_map(parsed)
            except json.JSONDecodeError:
                pass
        return cls(enforce_auth=enforce_auth, token_map=token_map)

    @staticmethod
    def _default_token_map() -> dict[str, UserSession]:
        return {
            "demo-admin": UserSession(
                user_id="u-admin",
                display_name="Demo Admin",
                memberships=(
                    WorkspaceMembership(workspace_id="default", role="admin"),
                    WorkspaceMembership(workspace_id="boston-lab", role="admin"),
                ),
            ),
            "demo-editor": UserSession(
                user_id="u-editor",
                display_name="Demo Editor",
                memberships=(
                    WorkspaceMembership(workspace_id="default", role="editor"),
                    WorkspaceMembership(workspace_id="boston-lab", role="editor"),
                ),
            ),
            "demo-viewer": UserSession(
                user_id="u-viewer",
                display_name="Demo Viewer",
                memberships=(WorkspaceMembership(workspace_id="default", role="viewer"),),
            ),
        }

    @classmethod
    def _parse_token_map(cls, payload: dict[str, object]) -> dict[str, UserSession]:
        token_map: dict[str, UserSession] = {}
        for token, value in payload.items():
            if not isinstance(token, str) or not isinstance(value, dict):
                continue
            user_id = str(value.get("userId") or token)
            display_name = str(value.get("displayName") or user_id)
            workspace_payload = value.get("workspaces")
            memberships: list[WorkspaceMembership] = []
            if isinstance(workspace_payload, dict):
                for workspace_id, role in workspace_payload.items():
                    if not isinstance(workspace_id, str) or not isinstance(role, str):
                        continue
                    normalized_role = cls._normalize_role(role)
                    memberships.append(WorkspaceMembership(workspace_id=workspace_id, role=normalized_role))
            if not memberships:
                memberships.append(WorkspaceMembership(workspace_id="default", role="viewer"))
            token_map[token] = UserSession(
                user_id=user_id,
                display_name=display_name,
                memberships=tuple(memberships),
            )
        return token_map or cls._default_token_map()

    @staticmethod
    def _normalize_role(value: str) -> Role:
        if value == "admin":
            return "admin"
        if value == "editor":
            return "editor"
        return "viewer"

    @staticmethod
    def allows(actual_role: Role, minimum_role: Role) -> bool:
        return _ROLE_RANK[actual_role] >= _ROLE_RANK[minimum_role]

    def resolve_session(self, request: Request) -> UserSession | None:
        api_key = request.headers.get("x-api-key")
        if not api_key:
            return None
        return self.token_map.get(api_key)

    def ensure_access(self, request: Request, *, minimum_role: Role, workspace_id: str) -> UserSession:
        session = self.resolve_session(request)
        if session is None:
            if not self.enforce_auth:
                return UserSession(
                    user_id="guest",
                    display_name="Guest",
                    memberships=(WorkspaceMembership(workspace_id=workspace_id, role="admin"),),
                )
            raise HTTPException(status_code=401, detail="Missing or invalid x-api-key")

        role = session.role_for(workspace_id)
        if role is None:
            raise HTTPException(status_code=403, detail=f"No access to workspace '{workspace_id}'")
        if not self.allows(role, minimum_role):
            raise HTTPException(status_code=403, detail=f"Role '{role}' cannot perform this action")
        return session

    def list_workspaces(self, session: UserSession) -> list[dict[str, str]]:
        return [
            {"id": membership.workspace_id, "role": membership.role}
            for membership in session.memberships
        ]
