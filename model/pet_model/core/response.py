from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, Field

T = TypeVar("T")


def model_to_dict(model) -> dict:
    if model is None:
        return None
    if hasattr(model, '__dict__'):
        return {k: v for k, v in model.__dict__.items() if not k.startswith('_')}
    return model


def list_to_dict(list_data) -> list:
    return [model_to_dict(item) for item in list_data]


class ResponseModel(BaseModel, Generic[T]):
    model_config = {"arbitrary_types_allowed": True}
    code: int = Field(default=200, description="响应状态码")
    message: str = Field(default="success", description="响应消息")
    data: Any = Field(default=None, description="响应数据")


class PageResult(BaseModel, Generic[T]):
    list: List[Any]
    total: int
    page: int
    page_size: int


def success(data: Any = None, message: str = "success") -> ResponseModel:
    if isinstance(data, list):
        data = list_to_dict(data)
    elif data is not None and hasattr(data, '__dict__'):
        data = model_to_dict(data)
    return ResponseModel(code=200, message=message, data=data)


def error(message: str = "error", code: int = 400) -> ResponseModel:
    return ResponseModel(code=code, message=message, data=None)


def page_result(list_data: List, total: int, page: int, page_size: int) -> ResponseModel:
    return success(PageResult(list=list_to_dict(list_data), total=total, page=page, page_size=page_size))
