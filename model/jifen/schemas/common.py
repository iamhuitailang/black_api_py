from pydantic import BaseModel
from typing import Optional


class PageParams(BaseModel):
    page: int = 1
    page_size: int = 10
    keyword: Optional[str] = ""


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    nickname: str
    role: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
