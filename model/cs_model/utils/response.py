from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar('T')

class ResponseModel(BaseModel, Generic[T]):
    code: int
    message: str
    data: Optional[T] = None

def success_response(data: T = None, message: str = "success") -> ResponseModel[T]:
    return ResponseModel(code=200, message=message, data=data)

def error_response(code: int = 400, message: str = "error") -> ResponseModel[None]:
    return ResponseModel(code=code, message=message, data=None)
