from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")


class ResponseModel(BaseModel, Generic[T]):
    code: int = 200
    message: str = "success"
    data: Optional[T] = None


def success_response(data: T = None, message: str = "success") -> ResponseModel[T]:
    return ResponseModel(code=200, message=message, data=data)


def error_response(code: int = 500, message: str = "error") -> ResponseModel:
    return ResponseModel(code=code, message=message, data=None)
