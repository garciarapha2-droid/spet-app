"""
Response standardization middleware.

Wraps all /api/* JSON responses in a consistent format:
  Success: {"success": true, "data": {...}, "error": null}
  Error:   {"success": false, "data": null, "error": {"code": "...", "message": "..."}}
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import json
import logging

logger = logging.getLogger("response_middleware")

SKIP_PATHS = frozenset(["/api/health", "/api/webhook/stripe", "/api/ws"])

ERROR_CODES = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
    500: "INTERNAL_ERROR",
}


class StandardResponseMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        path = request.url.path

        if not path.startswith("/api/") or path in SKIP_PATHS:
            return await call_next(request)

        if request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        try:
            response = await call_next(request)
        except Exception as exc:
            logger.error(f"Unhandled exception in middleware: {exc}")
            return Response(
                content=json.dumps({
                    "success": False, "data": None,
                    "error": {"code": "INTERNAL_ERROR", "message": str(exc)},
                }),
                status_code=500,
                media_type="application/json",
            )

        ct = response.headers.get("content-type", "")
        if "application/json" not in ct:
            return response

        chunks = []
        async for chunk in response.body_iterator:
            chunks.append(chunk if isinstance(chunk, bytes) else chunk.encode())
        body = b"".join(chunks)

        try:
            data = json.loads(body)
        except (json.JSONDecodeError, ValueError):
            return Response(content=body, status_code=response.status_code, media_type=ct)

        if isinstance(data, dict) and "success" in data and "error" in data:
            return Response(content=body, status_code=response.status_code, media_type="application/json")

        if response.status_code < 400:
            wrapped = {"success": True, "data": data, "error": None}
        else:
            detail = data.get("detail", data) if isinstance(data, dict) else data
            if isinstance(detail, list):
                msg = "; ".join(
                    str(e.get("msg", e)) if isinstance(e, dict) else str(e)
                    for e in detail
                )
            elif isinstance(detail, dict):
                msg = detail.get("message", str(detail))
            else:
                msg = str(detail)

            code = ERROR_CODES.get(response.status_code, "ERROR")
            wrapped = {"success": False, "data": None, "error": {"code": code, "message": msg}}

        return Response(
            content=json.dumps(wrapped, default=str),
            status_code=response.status_code,
            media_type="application/json",
        )
