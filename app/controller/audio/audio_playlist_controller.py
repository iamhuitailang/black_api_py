from typing import Optional, List
from fastapi import Request, Query
from pydantic import BaseModel, Field


class CreatePlaylistRequest(BaseModel):
    name: str = Field(..., description="歌单名称")
    cover: Optional[str] = Field('', description="歌单封面")
    description: Optional[str] = Field('', description="歌单描述")


class UpdatePlaylistRequest(BaseModel):
    name: Optional[str] = Field(None, description="歌单名称")
    cover: Optional[str] = Field(None, description="歌单封面")
    description: Optional[str] = Field(None, description="歌单描述")


class AddSongsRequest(BaseModel):
    song_ids: List[int] = Field(..., description="歌曲ID列表")


class ReorderRequest(BaseModel):
    order_list: List[int] = Field(..., description="排序后的歌曲ID列表")


class AudioPlaylistController:
    def __init__(self):
        from app.business.audio.playlist_business import AudioPlaylistBusiness
        self.playlist_business = AudioPlaylistBusiness()

    def ActionAudioPlaylistListGet(self, request: Request,
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(50, description="每页数量")):
        """
        获取歌单列表接口
        GET /api/audio/playlist/list/get
        获取所有用户歌单
        """
        return self.playlist_business.get_list(page=page, page_size=page_size)

    def ActionAudioPlaylistDetailGet(self, request: Request,
                                      playlist_id: int = Query(..., description="歌单ID")):
        """
        获取歌单详情接口
        GET /api/audio/playlist/detail/get
        获取歌单详情及歌曲列表
        """
        return self.playlist_business.get_detail(playlist_id=playlist_id)

    def ActionAudioPlaylistCreatePost(self, request: Request, body: CreatePlaylistRequest):
        """
        创建歌单接口
        POST /api/audio/playlist/create
        创建新的歌单，最多50个
        """
        return self.playlist_business.create(
            name=body.name,
            cover=body.cover or '',
            description=body.description or ''
        )

    def ActionAudioPlaylistUpdatePost(self, request: Request,
                                       playlist_id: int = Query(..., description="歌单ID"),
                                       body: UpdatePlaylistRequest = None):
        """
        更新歌单接口
        POST /api/audio/playlist/update
        修改歌单名称、封面、描述
        """
        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.cover is not None:
            data['cover'] = body.cover
        if body.description is not None:
            data['description'] = body.description
        return self.playlist_business.update(playlist_id=playlist_id, data=data)

    def ActionAudioPlaylistDeletePost(self, request: Request,
                                       playlist_id: int = Query(..., description="歌单ID")):
        """
        删除歌单接口
        POST /api/audio/playlist/delete
        删除整个歌单及其包含的歌曲关联
        """
        return self.playlist_business.delete(playlist_id=playlist_id)

    def ActionAudioPlaylistAddsongPost(self, request: Request,
                                        playlist_id: int = Query(..., description="歌单ID"),
                                        body: AddSongsRequest = None):
        """
        添加歌曲到歌单接口
        POST /api/audio/playlist/addsong
        批量添加歌曲到歌单
        """
        return self.playlist_business.add_songs(
            playlist_id=playlist_id,
            song_ids=body.song_ids
        )

    def ActionAudioPlaylistRemovesongPost(self, request: Request,
                                           playlist_id: int = Query(..., description="歌单ID"),
                                           song_id: int = Query(..., description="歌曲ID")):
        """
        从歌单移除歌曲接口
        POST /api/audio/playlist/removesong
        从歌单中移除指定歌曲
        """
        return self.playlist_business.remove_song(
            playlist_id=playlist_id,
            song_id=song_id
        )

    def ActionAudioPlaylistReorderPost(self, request: Request,
                                        playlist_id: int = Query(..., description="歌单ID"),
                                        body: ReorderRequest = None):
        """
        歌单歌曲排序接口
        POST /api/audio/playlist/reorder
        拖拽调整歌单内歌曲顺序
        """
        return self.playlist_business.reorder_songs(
            playlist_id=playlist_id,
            order_list=body.order_list
        )

    def ActionAudioPlaylistStatsGet(self, request: Request):
        """
        获取歌单统计接口
        GET /api/audio/playlist/stats/get
        获取歌单总数和最大限制
        """
        return self.playlist_business.get_stats()