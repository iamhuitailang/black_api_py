from typing import Optional
from fastapi import Request, Query
from pydantic import BaseModel, Field


class CreateSongRequest(BaseModel):
    title: str = Field(..., description="歌曲标题")
    artist: str = Field(..., description="艺术家")
    cover: str = Field("", description="封面URL")
    bpm: int = Field(120, description="BPM")
    duration: int = Field(0, description="时长(秒)")
    difficulty_easy: float = Field(1.0, description="简单难度")
    difficulty_normal: float = Field(3.0, description="普通难度")
    difficulty_hard: float = Field(5.0, description="困难难度")
    genre: str = Field("pop", description="流派")
    note_data: str = Field("", description="音符数据")
    status: int = Field(0, description="状态 0/1")


class UpdateSongRequest(BaseModel):
    song_id: int = Field(..., description="歌曲ID")
    title: Optional[str] = Field(None, description="歌曲标题")
    artist: Optional[str] = Field(None, description="艺术家")
    cover: Optional[str] = Field(None, description="封面URL")
    bpm: Optional[int] = Field(None, description="BPM")
    duration: Optional[int] = Field(None, description="时长(秒)")
    difficulty_easy: Optional[float] = Field(None, description="简单难度")
    difficulty_normal: Optional[float] = Field(None, description="普通难度")
    difficulty_hard: Optional[float] = Field(None, description="困难难度")
    genre: Optional[str] = Field(None, description="流派")
    note_data: Optional[str] = Field(None, description="音符数据")
    status: Optional[int] = Field(None, description="状态 0/1")


class JinwutuanSongController:
    def __init__(self):
        from app.business.jinwutuan.song_business import JinwutuanSongBusiness
        self.song_business = JinwutuanSongBusiness()

    def ActionJinwutuanSongCreatePost(self, request: Request, body: CreateSongRequest):
        data = {
            'title': body.title,
            'artist': body.artist,
            'cover': body.cover,
            'bpm': body.bpm,
            'duration': body.duration,
            'difficulty_easy': body.difficulty_easy,
            'difficulty_normal': body.difficulty_normal,
            'difficulty_hard': body.difficulty_hard,
            'genre': body.genre,
            'note_data': body.note_data,
            'status': body.status
        }
        return self.song_business.create_song(data=data)

    def ActionJinwutuanSongUpdatePut(self, request: Request, body: UpdateSongRequest):
        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.artist is not None:
            data['artist'] = body.artist
        if body.cover is not None:
            data['cover'] = body.cover
        if body.bpm is not None:
            data['bpm'] = body.bpm
        if body.duration is not None:
            data['duration'] = body.duration
        if body.difficulty_easy is not None:
            data['difficulty_easy'] = body.difficulty_easy
        if body.difficulty_normal is not None:
            data['difficulty_normal'] = body.difficulty_normal
        if body.difficulty_hard is not None:
            data['difficulty_hard'] = body.difficulty_hard
        if body.genre is not None:
            data['genre'] = body.genre
        if body.note_data is not None:
            data['note_data'] = body.note_data
        if body.status is not None:
            data['status'] = body.status

        return self.song_business.update_song(
            song_id=body.song_id,
            data=data
        )

    def ActionJinwutuanSongDeleteDelete(self, request: Request, song_id: int = Query(..., description="歌曲ID")):
        return self.song_business.delete_song(song_id=song_id)

    def ActionJinwutuanSongDetailGet(self, request: Request, song_id: int = Query(..., description="歌曲ID")):
        return self.song_business.get_song(song_id=song_id)

    def ActionJinwutuanSongListGet(self, request: Request,
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                    genre: Optional[str] = Query(None, description="流派"),
                                    difficulty: Optional[str] = Query(None, description="难度"),
                                    status: Optional[int] = Query(None, description="状态"),
                                    keyword: Optional[str] = Query(None, description="搜索关键词")):
        return self.song_business.get_song_list(
            page=page,
            page_size=page_size,
            genre=genre,
            difficulty=difficulty,
            status=status,
            keyword=keyword
        )

    def ActionJinwutuanSongEnabledGet(self, request: Request):
        return self.song_business.get_enabled_songs()
