from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    nickname: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserChangePassword(BaseModel):
    old_password: str
    new_password: str


class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    avatar: Optional[str] = None


class UserResponse(UserBase):
    id: int
    avatar: Optional[str] = None
    total_games: int = 0
    total_wins: int = 0
    total_score: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class IdiomBase(BaseModel):
    word: str
    pinyin: Optional[str] = None
    explanation: Optional[str] = None
    example: Optional[str] = None
    difficulty: int = 1


class IdiomCreate(IdiomBase):
    pass


class IdiomResponse(IdiomBase):
    id: int
    first_char: str
    last_char: str
    first_pinyin: str
    last_pinyin: str
    created_at: datetime

    class Config:
        from_attributes = True


class GameBase(BaseModel):
    game_type: str
    mode: str = "single"
    time_limit: int = 60


class GameCreate(GameBase):
    user_id: int


class GameUpdate(BaseModel):
    current_idiom: Optional[str] = None
    used_idioms: Optional[str] = None
    score: Optional[int] = None
    combo: Optional[int] = None
    max_combo: Optional[int] = None
    time_used: Optional[int] = None
    status: Optional[str] = None


class GameResponse(GameBase):
    id: int
    user_id: int
    status: str
    current_idiom: Optional[str] = None
    used_idioms: Optional[str] = None
    score: int
    combo: int
    max_combo: int
    time_used: int
    start_time: datetime
    end_time: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ScoreBase(BaseModel):
    game_type: str
    score: int = 0
    combo: int = 0
    correct_count: int = 0
    wrong_count: int = 0
    time_used: int = 0
    is_win: bool = False


class ScoreCreate(ScoreBase):
    user_id: int
    game_id: int


class ScoreResponse(ScoreBase):
    id: int
    user_id: int
    game_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AchievementBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    condition_type: str
    condition_value: int = 0
    points: int = 10


class AchievementCreate(AchievementBase):
    pass


class AchievementResponse(AchievementBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserAchievementResponse(BaseModel):
    id: int
    user_id: int
    achievement_id: int
    achievement: AchievementResponse
    unlocked_at: datetime

    class Config:
        from_attributes = True


class LeaderboardItem(BaseModel):
    rank: int
    user_id: int
    username: str
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    total_score: int
    total_wins: int
    total_games: int


class GamePlayRequest(BaseModel):
    game_id: int
    idiom: str


class GamePlayResponse(BaseModel):
    success: bool
    message: str
    score: int
    combo: int
    next_idiom: Optional[str] = None
    game_over: bool = False
