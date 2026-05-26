from fastapi import Request, Query
from pydantic import BaseModel, Field


class SearchHistoryRecordRequest(BaseModel):
    keyword: str = Field(..., description="搜索关键词")
    search_type: str = Field('song', description="搜索类型")


class SearchHistoryDeleteRequest(BaseModel):
    keyword: str = Field(..., description="搜索关键词")
    search_type: str = Field('song', description="搜索类型")


class AudioSearchHistoryController:
    def __init__(self):
        from app.business.audio.search_history_business import AudioSearchHistoryBusiness
        self.history_business = AudioSearchHistoryBusiness()

    def ActionAudioSearchhistoryListGet(self, request: Request):
        """
        获取搜索历史接口
        GET /api/audio/searchhistory/list/get
        获取最近10条搜索历史记录
        """
        return self.history_business.get_list()

    def ActionAudioSearchhistoryRecordPost(self, request: Request, body: SearchHistoryRecordRequest):
        """
        记录搜索历史接口
        POST /api/audio/searchhistory/record
        记录用户搜索关键词
        """
        return self.history_business.add(keyword=body.keyword, search_type=body.search_type)

    def ActionAudioSearchhistoryDeletePost(self, request: Request, body: SearchHistoryDeleteRequest):
        """
        删除搜索历史接口
        POST /api/audio/searchhistory/delete
        删除指定搜索历史记录
        """
        return self.history_business.delete(keyword=body.keyword, search_type=body.search_type)

    def ActionAudioSearchhistoryClearPost(self, request: Request):
        """
        清空搜索历史接口
        POST /api/audio/searchhistory/clear
        清空所有搜索历史记录
        """
        return self.history_business.clear()