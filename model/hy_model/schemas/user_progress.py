from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class UserProgressBase(BaseModel):
    user_id: int
    current_depth: Optional[float] = 0.0
    deepest_reached: Optional[float] = 0.0
    total_coins_earned: Optional[int] = 0
    total_creatures_caught: Optional[int] = 0
    total_treasures_found: Optional[int] = 0
    total_ruins_explored: Optional[int] = 0
    unlocked_submarines: Optional[str] = "1"
    unlocked_equipment: Optional[str] = ""
    unlocked_music: Optional[str] = "1"
    discovered_ruins: Optional[str] = ""
    current_music_id: Optional[int] = 1
    game_state: Optional[str] = "{}"


class UserProgressCreate(UserProgressBase):
    pass


class UserProgressUpdate(BaseModel):
    current_depth: Optional[float] = None
    deepest_reached: Optional[float] = None
    total_coins_earned: Optional[int] = None
    total_creatures_caught: Optional[int] = None
    total_treasures_found: Optional[int] = None
    total_ruins_explored: Optional[int] = None
    unlocked_submarines: Optional[str] = None
    unlocked_equipment: Optional[str] = None
    unlocked_music: Optional[str] = None
    discovered_ruins: Optional[str] = None
    current_music_id: Optional[int] = None
    game_state: Optional[str] = None


class UserProgressResponse(UserProgressBase):
    id: int
    last_save_time: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
