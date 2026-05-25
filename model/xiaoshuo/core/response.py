from typing import Any, Optional

from pydantic import BaseModel


class ApiResponse(BaseModel):
    code: int = 200
    message: str = "success"
    data: Optional[Any] = None


def ok(data: Any = None, message: str = "success") -> dict:
    return {"code": 200, "message": message, "data": data}


def fail(code: int = 500, message: str = "error", data: Any = None) -> dict:
    return {"code": code, "message": message, "data": data}


def page_ok(items: list, total: int, page: int, page_size: int) -> dict:
    return ok(
        {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    )
