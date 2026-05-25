from typing import Optional, List
from pydantic import BaseModel, Field


class NovelCreate(BaseModel):
    title: str = Field(..., max_length=200)
    author: str = Field(..., max_length=100)
    cover: Optional[str] = ""
    category_id: Optional[int] = None
    status: Optional[str] = "连载中"
    word_count: Optional[int] = 0
    rating: Optional[float] = 0.0
    description: Optional[str] = ""
    is_hot: Optional[bool] = False
    is_recommend: Optional[bool] = False
    is_finished: Optional[bool] = False


class NovelUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    cover: Optional[str] = None
    category_id: Optional[int] = None
    status: Optional[str] = None
    word_count: Optional[int] = None
    rating: Optional[float] = None
    description: Optional[str] = None
    is_hot: Optional[bool] = None
    is_recommend: Optional[bool] = None
    is_finished: Optional[bool] = None


class NovelQuery(BaseModel):
    keyword: Optional[str] = None
    category_id: Optional[int] = None
    status: Optional[str] = None
    is_hot: Optional[bool] = None
    is_recommend: Optional[bool] = None
    is_finished: Optional[bool] = None
    sort_by: Optional[str] = "updated_at"
    page: int = 1
    page_size: int = 20


class ChapterCreate(BaseModel):
    novel_id: int
    chapter_no: int
    title: str
    content: str = ""
    word_count: Optional[int] = 0


class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_cached: Optional[bool] = None


class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = "📚"
    sort: Optional[int] = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    sort: Optional[int] = None


class ShelfItemCreate(BaseModel):
    novel_id: int
    group_name: Optional[str] = "默认分组"


class ShelfItemUpdate(BaseModel):
    group_name: Optional[str] = None
    last_read_chapter_id: Optional[int] = None
    last_read_position: Optional[float] = None
    total_read_seconds: Optional[int] = None
    is_pinned: Optional[bool] = None


class ShelfQuery(BaseModel):
    group_name: Optional[str] = None
    sort_by: Optional[str] = "updated_at"
    page: int = 1
    page_size: int = 20


class ReadingRecordCreate(BaseModel):
    novel_id: int
    chapter_id: int
    position: float = 0.0
    scroll_position: int = 0
    read_seconds: int = 0


class BookmarkCreate(BaseModel):
    novel_id: int
    chapter_id: int
    title: str = ""
    position: float = 0.0


class CommentCreate(BaseModel):
    novel_id: int
    content: str
    rating: Optional[int] = 5
    user_name: Optional[str] = "匿名用户"


class BannerCreate(BaseModel):
    title: str
    image: str
    novel_id: Optional[int] = None
    link: Optional[str] = ""
    sort: Optional[int] = 0


class OfflineCacheCreate(BaseModel):
    novel_id: int
    chapter_id: int


class ShareCreate(BaseModel):
    novel_id: int
    share_type: Optional[str] = "novel"
