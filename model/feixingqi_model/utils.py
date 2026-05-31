from typing import Any, Optional
from pydantic import BaseModel
import hashlib
import uuid
import random

class ResponseModel(BaseModel):
    code: int = 200
    message: str = "success"
    data: Optional[Any] = None

def success_response(data: Any = None, message: str = "success") -> ResponseModel:
    return ResponseModel(code=200, message=message, data=data)

def error_response(code: int = 400, message: str = "error") -> ResponseModel:
    return ResponseModel(code=code, message=message, data=None)

def hash_password(password: str) -> str:
    return hashlib.md5(password.encode()).hexdigest()

def generate_room_code() -> str:
    return ''.join(random.choices('0123456789', k=6))

def generate_uuid() -> str:
    return str(uuid.uuid4())

def roll_dice() -> int:
    return random.randint(1, 6)
