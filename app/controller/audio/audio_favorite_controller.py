from fastapi import Request, Query


class AudioFavoriteController:
    def __init__(self):
        from app.business.audio.favorite_business import AudioFavoriteBusiness
        self.favorite_business = AudioFavoriteBusiness()

    def ActionAudioFavoriteListGet(self, request: Request,
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(50, description="每页数量")):
        """
        获取喜欢歌曲列表接口
        GET /api/audio/favorite/list/get
        获取所有已喜欢的歌曲
        """
        return self.favorite_business.get_list(page=page, page_size=page_size)

    def ActionAudioFavoriteTogglePost(self, request: Request,
                                       song_id: int = Query(..., description="歌曲ID")):
        """
        切换喜欢状态接口
        POST /api/audio/favorite/toggle
        切换歌曲的喜欢/取消喜欢状态
        """
        return self.favorite_business.toggle(song_id=song_id)

    def ActionAudioFavoriteCheckGet(self, request: Request,
                                     song_id: int = Query(..., description="歌曲ID")):
        """
        检查喜欢状态接口
        GET /api/audio/favorite/check/get
        检查歌曲是否已喜欢
        """
        return self.favorite_business.check(song_id=song_id)

    def ActionAudioFavoriteIdsGet(self, request: Request):
        """
        获取喜欢的歌曲ID列表接口
        GET /api/audio/favorite/ids/get
        获取所有已喜欢歌曲的ID列表
        """
        return self.favorite_business.get_all_ids()

    def ActionAudioFavoriteCountGet(self, request: Request):
        """
        获取喜欢歌曲数量接口
        GET /api/audio/favorite/count/get
        获取已喜欢的歌曲总数
        """
        return self.favorite_business.get_count()