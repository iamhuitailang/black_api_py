from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, ConfigDict

T = TypeVar('T')


class ResponseModel(BaseModel, Generic[T]):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    code: int = 200
    message: str = "success"
    data: Optional[Any] = None


def _to_dict(obj):
    if obj is None:
        return None
    if isinstance(obj, list):
        return [_to_dict(item) for item in obj]
    if hasattr(obj, '__table__'):
        result = {}
        for column in obj.__table__.columns:
            value = getattr(obj, column.name, None)
            result[column.name] = _to_dict(value)
        return result
    if isinstance(obj, dict):
        return {k: _to_dict(v) for k, v in obj.items()}
    if isinstance(obj, (int, float, str, bool)):
        return obj
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    return obj


def success_response(data=None, message: str = "success") -> ResponseModel:
    return ResponseModel(code=200, message=message, data=_to_dict(data))


def error_response(code: int = 400, message: str = "error") -> ResponseModel:
    return ResponseModel(code=code, message=message, data=None)
