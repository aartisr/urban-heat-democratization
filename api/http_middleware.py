from __future__ import annotations

import logging
import os
import time
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse


def build_api_logger() -> logging.Logger:
    logger = logging.getLogger("urban_heat_democratization.api")
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
        logger.addHandler(handler)
    logger.setLevel(getattr(logging, os.getenv("UHD_LOG_LEVEL", "INFO").upper(), logging.INFO))
    return logger


def install_http_middleware(app: FastAPI, logger: logging.Logger) -> None:
    app.add_middleware(GZipMiddleware, minimum_size=512)

    @app.middleware("http")
    async def request_tracing_middleware(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or uuid4().hex
        started_at = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - started_at) * 1000, 2)
            logger.exception(
                "request_failed request_id=%s method=%s path=%s elapsed_ms=%s error=%s",
                request_id,
                request.method,
                request.url.path,
                elapsed_ms,
                exc.__class__.__name__,
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "code": "internal_server_error",
                        "message": "Unexpected server error. Retry or contact support with the request ID.",
                        "requestId": request_id,
                    }
                },
                headers={"x-request-id": request_id},
            )

        elapsed_ms = round((time.perf_counter() - started_at) * 1000, 2)
        response.headers["x-request-id"] = request_id
        response.headers["x-content-type-options"] = "nosniff"
        response.headers["x-frame-options"] = "DENY"
        response.headers["referrer-policy"] = "strict-origin-when-cross-origin"
        response.headers["permissions-policy"] = "camera=(), microphone=(), geolocation=()"
        if "cache-control" not in response.headers:
            response.headers["cache-control"] = "no-store"
        logger.info(
            "request_complete request_id=%s method=%s path=%s status=%s elapsed_ms=%s",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
        return response
