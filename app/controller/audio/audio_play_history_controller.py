from fastapi import Request, Query


class AudioPlayHistoryController:
    def __init__(self):
        from app.business.audio.play_history_business import AudioPlayHistoryBusiness
        self.history_business = AudioPlayHistoryBusiness()

    def ActionAudioPlayhistoryListGet(self, request: Request,
                                       page: int = Query(1, description="页码"),
                                       page_size: int = Query(50, description="每页数量")):
        """
        获取播放历史接口
        GET /api/audio/playhistory/list/get
        获取最近播放的歌曲列表
        """
        return self.history_business.get_list(page=page, page_size=page_size)

    def ActionAudioPlayhistoryRecordPost(self, request: Request,
                                          song_id: int = Query(..., description="歌曲ID")):
        """
        记录播放历史接口
        POST /api/audio/playhistory/record
        记录用户播放的歌曲
        """
        return self.history_business.add(song_id=song_id)

    def ActionAudioPlayhistoryClearPost(self, request: Request):
        """
        清空播放历史接口
        POST /api/audio/playhistory/clear
        清空所有播放历史记录
        """
        return self.history_business.clear()

    def ActionAudioPlayhistoryCountGet(self, request: Request):
        """
        获取播放历史数量接口
        GET /api/audio/playhistory/count/get
        获取播放历史总数
        """
        return self.history_business.get_count()