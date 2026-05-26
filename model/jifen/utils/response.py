from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import Any, Optional
from datetime import datetime
import json


def default_serializer(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    if hasattr(obj, '__dict__'):
        return obj.__dict__
    return str(obj)


class ResponseUtil:

    @staticmethod
    def success(data: Any = None, message: str = "操作成功", code: int = 200) -> JSONResponse:
        result = {
            "code": code,
            "message": message,
            "data": data
        }
        try:
            encoded = jsonable_encoder(result, custom_encoder={
                datetime: lambda v: v.isoformat()
            })
            return JSONResponse(status_code=200, content=encoded)
        except Exception:
            content = json.dumps(result, default=default_serializer, ensure_ascii=False)
            return JSONResponse(status_code=200, content=json.loads(content))

    @staticmethod
    def error(message: str = "操作失败", code: int = 500, data: Any = None) -> JSONResponse:
        result = {
            "code": code,
            "message": message,
            "data": data
        }
        try:
            encoded = jsonable_encoder(result, custom_encoder={
                datetime: lambda v: v.isoformat()
            })
            return JSONResponse(status_code=200, content=encoded)
        except Exception:
            content = json.dumps(result, default=default_serializer, ensure_ascii=False)
            return JSONResponse(status_code=200, content=json.loads(content))

    @staticmethod
    def page(data: list, total: int, page: int = 1, page_size: int = 10,
             message: str = "查询成功") -> JSONResponse:
        result = {
            "code": 200,
            "message": message,
            "data": data,
            "total": total,
            "page": page,
            "page_size": page_size
        }
        try:
            encoded = jsonable_encoder(result, custom_encoder={
                datetime: lambda v: v.isoformat()
            })
            return JSONResponse(status_code=200, content=encoded)
        except Exception:
            content = json.dumps(result, default=default_serializer, ensure_ascii=False)
            return JSONResponse(status_code=200, content=json.loads(content))
