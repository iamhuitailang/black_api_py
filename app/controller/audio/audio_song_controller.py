from typing import Optional, List
from fastapi import Request, Query
from pydantic import BaseModel, Field


class CreateSongRequest(BaseModel):
    title: str = Field(..., description="歌曲名称")
    artist: str = Field(..., description="歌手")
    album: Optional[str] = Field('', description="专辑")
    duration: Optional[str] = Field('0:00', description="时长")
    genre: Optional[str] = Field('', description="风格")
    cover: Optional[str] = Field('', description="封面")
    popularity: Optional[int] = Field(3, description="热度 1-5")
    source_url: Optional[str] = Field('', description="音源链接")


class UpdateSongRequest(BaseModel):
    title: Optional[str] = Field(None, description="歌曲名称")
    artist: Optional[str] = Field(None, description="歌手")
    album: Optional[str] = Field(None, description="专辑")
    duration: Optional[str] = Field(None, description="时长")
    genre: Optional[str] = Field(None, description="风格")
    cover: Optional[str] = Field(None, description="封面")
    popularity: Optional[int] = Field(None, description="热度 1-5")
    source_url: Optional[str] = Field(None, description="音源链接")


class AudioSongController:
    def __init__(self):
        from app.business.audio.song_business import AudioSongBusiness
        self.song_business = AudioSongBusiness()

    def ActionAudioSongListGet(self, request: Request,
                              keyword: str = Query('', description="搜索关键词"),
                              genre: str = Query('', description="风格筛选"),
                              page: int = Query(1, description="页码"),
                              page_size: int = Query(50, description="每页数量")):
        """
        获取歌曲列表接口
        GET /api/audio/song/list/get
        获取音乐库歌曲列表，支持关键词搜索和风格筛选
        """
        return self.song_business.get_list(keyword=keyword, genre=genre,
                                          page=page, page_size=page_size)

    def ActionAudioSongSearchGet(self, request: Request,
                                 keyword: str = Query('', description="搜索关键词"),
                                 search_type: str = Query('song', description="搜索类型: song/artist/album"),
                                 page: int = Query(1, description="页码"),
                                 page_size: int = Query(50, description="每页数量")):
        """
        搜索歌曲接口
        GET /api/audio/song/search/get
        按歌曲名/歌手/专辑搜索
        """
        return self.song_business.search(keyword=keyword, search_type=search_type,
                                        page=page, page_size=page_size)

    def ActionAudioSongGenreGet(self, request: Request):
        """
        获取所有风格接口
        GET /api/audio/song/genre/get
        获取音乐库中所有歌曲风格分类
        """
        return self.song_business.get_genres()

    def ActionAudioSongHotsearchGet(self, request: Request):
        """
        获取热门搜索接口
        GET /api/audio/song/hotsearch/get
        获取热门搜索关键词列表
        """
        return self.song_business.get_hot_searches()

    def ActionAudioSongCreatePost(self, request: Request, body: CreateSongRequest):
        """
        添加歌曲接口
        POST /api/audio/song/create
        自定义添加歌曲到音乐库
        """
        return self.song_business.create(
            title=body.title,
            artist=body.artist,
            album=body.album or '',
            duration=body.duration or '0:00',
            genre=body.genre or '',
            cover=body.cover or '',
            popularity=body.popularity or 3,
            source_url=body.source_url or ''
        )

    def ActionAudioSongUpdatePost(self, request: Request,
                                   song_id: int = Query(..., description="歌曲ID"),
                                   body: UpdateSongRequest = None):
        """
        更新歌曲接口
        POST /api/audio/song/update
        更新歌曲信息
        """
        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.artist is not None:
            data['artist'] = body.artist
        if body.album is not None:
            data['album'] = body.album
        if body.duration is not None:
            data['duration'] = body.duration
        if body.genre is not None:
            data['genre'] = body.genre
        if body.cover is not None:
            data['cover'] = body.cover
        if body.popularity is not None:
            data['popularity'] = body.popularity
        if body.source_url is not None:
            data['source_url'] = body.source_url
        return self.song_business.update(song_id=song_id, data=data)

    def ActionAudioSongDeletePost(self, request: Request,
                                   song_id: int = Query(..., description="歌曲ID")):
        """
        删除歌曲接口
        POST /api/audio/song/delete
        删除自定义歌曲
        """
        return self.song_business.delete(song_id=song_id)

    def ActionAudioSongDetailGet(self, request: Request,
                                  song_id: int = Query(..., description="歌曲ID")):
        """
        获取歌曲详情接口
        GET /api/audio/song/detail/get
        根据ID获取歌曲详情
        """
        return self.song_business.get_by_id(song_id=song_id)

    def ActionAudioSongBatchGet(self, request: Request,
                                 ids: str = Query('', description="歌曲ID列表，逗号分隔")):
        """
        批量获取歌曲接口
        GET /api/audio/song/batch/get
        根据ID列表批量获取歌曲信息
        """
        id_list = [int(x) for x in ids.split(',') if x.strip().isdigit()]
        return self.song_business.get_by_ids(ids=id_list)