from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field
from app.business.zhuiju import DramaBusiness, ReminderBusiness


class DramaCreateRequest(BaseModel):
    name: str = Field(..., description="剧名")
    cover: Optional[str] = Field(default='', description="封面emoji或图片")
    genre: Optional[str] = Field(default='', description="类型")
    seasons: Optional[int] = Field(default=1, description="季数")
    total_episodes: Optional[int] = Field(default=0, description="总集数")
    watched_episodes: Optional[int] = Field(default=0, description="已看集数")
    episode_duration: Optional[int] = Field(default=45, description="每集时长(分钟)")
    status: Optional[str] = Field(default='want', description="状态: want/watching/finished/dropped")
    rating: Optional[int] = Field(default=0, description="评分 0-5")
    review: Optional[str] = Field(default='', description="短评")
    tags: Optional[str] = Field(default='', description="标签(逗号分隔)")
    is_rewatch: Optional[int] = Field(default=0, description="是否二刷")
    year: Optional[int] = Field(default=0, description="年份")
    note: Optional[str] = Field(default='', description="备注")


class DramaUpdateRequest(BaseModel):
    id: int = Field(..., description="剧集ID")
    name: Optional[str] = Field(default=None, description="剧名")
    cover: Optional[str] = Field(default=None, description="封面emoji或图片")
    genre: Optional[str] = Field(default=None, description="类型")
    seasons: Optional[int] = Field(default=None, description="季数")
    total_episodes: Optional[int] = Field(default=None, description="总集数")
    watched_episodes: Optional[int] = Field(default=None, description="已看集数")
    episode_duration: Optional[int] = Field(default=None, description="每集时长(分钟)")
    status: Optional[str] = Field(default=None, description="状态")
    rating: Optional[int] = Field(default=None, description="评分 0-5")
    review: Optional[str] = Field(default=None, description="短评")
    tags: Optional[str] = Field(default=None, description="标签")
    is_rewatch: Optional[int] = Field(default=None, description="是否二刷")
    year: Optional[int] = Field(default=None, description="年份")
    note: Optional[str] = Field(default=None, description="备注")


class StatusChangeRequest(BaseModel):
    id: int = Field(..., description="剧集ID")
    status: str = Field(..., description="状态")


class IncrementRequest(BaseModel):
    id: int = Field(..., description="剧集ID")
    delta: Optional[int] = Field(default=1, description="增量")


class ProgressSetRequest(BaseModel):
    id: int = Field(..., description="剧集ID")
    watched_episodes: int = Field(..., description="已看集数")


class RatingRequest(BaseModel):
    id: int = Field(..., description="剧集ID")
    rating: int = Field(..., description="评分 0-5")
    review: Optional[str] = Field(default='', description="短评")
    tags: Optional[str] = Field(default='', description="标签")
    is_rewatch: Optional[int] = Field(default=0, description="二刷标记")


class BatchStatusRequest(BaseModel):
    ids: List[int] = Field(..., description="剧集ID列表")
    status: str = Field(..., description="状态")


class ImportRequest(BaseModel):
    items: List[Dict[str, Any]] = Field(..., description="剧集数据")
    mode: Optional[str] = Field(default='merge', description="merge或replace")


class ReminderAddRequest(BaseModel):
    drama_id: Optional[int] = Field(default=0)
    rtype: Optional[str] = Field(default='update')
    message: Optional[str] = Field(default='')
    remind_at: Optional[str] = Field(default='')
    extra: Optional[str] = Field(default='')


class ZhuijuController:
    def __init__(self):
        self.drama_biz = DramaBusiness()
        self.reminder_biz = ReminderBusiness()

    def ActionZhuijuListGet(self, request: Request,
                            status: Optional[str] = Query(default=None, description="状态"),
                            genre: Optional[str] = Query(default=None, description="类型"),
                            year: Optional[int] = Query(default=None, description="年份"),
                            keyword: Optional[str] = Query(default=None, description="关键字"),
                            sort_by: Optional[str] = Query(default='updated_at', description="排序字段"),
                            order: Optional[str] = Query(default='desc', description="排序顺序")):
        """
        获取剧集列表
        GET /api/zhuiju/list/get
        """
        return self.drama_biz.list_dramas(status=status, genre=genre, year=year,
                                          keyword=keyword, sort_by=sort_by, order=order)

    def ActionZhuijuDetailGet(self, request: Request,
                              id: int = Query(..., ge=1, description="剧集ID")):
        """
        获取剧集详情
        GET /api/zhuiju/detail/get
        """
        return self.drama_biz.get_drama(id)

    def ActionZhuijuAddPost(self, request: Request, body: DramaCreateRequest):
        """
        添加剧集
        POST /api/zhuiju/add
        """
        data = body.model_dump()
        return self.drama_biz.create_drama(data)

    def ActionZhuijuUpdatePost(self, request: Request, body: DramaUpdateRequest):
        """
        更新剧集
        POST /api/zhuiju/update
        """
        data = body.model_dump(exclude_unset=True)
        drama_id = data.pop('id')
        return self.drama_biz.update_drama(drama_id, data)

    def ActionZhuijuDelete(self, request: Request,
                           id: int = Query(..., ge=1, description="剧集ID")):
        """
        删除剧集
        DELETE /api/zhuiju/delete
        """
        return self.drama_biz.delete_drama(id)

    def ActionZhuijuStatusSetPost(self, request: Request, body: StatusChangeRequest):
        """
        切换状态
        POST /api/zhuiju/status/set
        """
        return self.drama_biz.change_status(body.id, body.status)

    def ActionZhuijuEpisodeAddPost(self, request: Request, body: IncrementRequest):
        """
        +1 集或自定义增量
        POST /api/zhuiju/episode/add
        """
        return self.drama_biz.increment_episode(body.id, body.delta or 1)

    def ActionZhuijuProgressSetPost(self, request: Request, body: ProgressSetRequest):
        """
        手动设置进度
        POST /api/zhuiju/progress/set
        """
        return self.drama_biz.set_progress(body.id, body.watched_episodes)

    def ActionZhuijuRatingSetPost(self, request: Request, body: RatingRequest):
        """
        设置评分与评价
        POST /api/zhuiju/rating/set
        """
        return self.drama_biz.set_rating(body.id, body.rating, body.review, body.tags, body.is_rewatch)

    def ActionZhuijuBatchStatusSetPost(self, request: Request, body: BatchStatusRequest):
        """
        批量更新状态
        POST /api/zhuiju/batch/status/set
        """
        return self.drama_biz.batch_set_status(body.ids, body.status)

    def ActionZhuijuStatisticsGet(self, request: Request):
        """
        统计面板
        GET /api/zhuiju/statistics/get
        """
        return self.drama_biz.statistics()

    def ActionZhuijuFiltersGet(self, request: Request):
        """
        筛选项(类型/年份等)
        GET /api/zhuiju/filters/get
        """
        return self.drama_biz.filters()

    def ActionZhuijuExportGet(self, request: Request):
        """
        导出数据
        GET /api/zhuiju/export/get
        """
        return self.drama_biz.export_all()

    def ActionZhuijuImportPost(self, request: Request, body: ImportRequest):
        """
        导入数据
        POST /api/zhuiju/import
        """
        return self.drama_biz.import_all(body.items, body.mode or 'merge')

    def ActionZhuijuClearAllPost(self, request: Request):
        """
        一键清空所有
        POST /api/zhuiju/clear/all
        """
        return self.drama_biz.clear_all()

    def ActionZhuijuResetDefaultPost(self, request: Request):
        """
        重置为默认20部剧
        POST /api/zhuiju/reset/default
        """
        return self.drama_biz.reset_default()

    def ActionZhuijuAnnualGet(self, request: Request,
                              year: Optional[int] = Query(default=None, description="年份")):
        """
        年度总结
        GET /api/zhuiju/annual/get
        """
        return self.drama_biz.annual_summary(year)

    def ActionZhuijuRecommendGet(self, request: Request,
                                 id: int = Query(..., ge=1, description="剧集ID")):
        """
        安利卡片
        GET /api/zhuiju/recommend/get
        """
        return self.drama_biz.recommend_card(id)

    def ActionZhuijuReminderListGet(self, request: Request,
                                    is_read: Optional[int] = Query(default=None, description="是否已读")):
        """
        提醒列表
        GET /api/zhuiju/reminder/list/get
        """
        return self.reminder_biz.list_reminders(is_read)

    def ActionZhuijuReminderAddPost(self, request: Request, body: ReminderAddRequest):
        """
        添加提醒
        POST /api/zhuiju/reminder/add
        """
        return self.reminder_biz.add_reminder(body.drama_id, body.rtype, body.message, body.remind_at, body.extra)

    def ActionZhuijuReminderReadPost(self, request: Request,
                                     id: int = Query(..., ge=1, description="提醒ID")):
        """
        标记已读
        POST /api/zhuiju/reminder/read
        """
        return self.reminder_biz.mark_read(id)

    def ActionZhuijuReminderReadAllPost(self, request: Request):
        """
        全部标记已读
        POST /api/zhuiju/reminder/read/all
        """
        return self.reminder_biz.mark_all_read()

    def ActionZhuijuReminderDelete(self, request: Request,
                                   id: int = Query(..., ge=1, description="提醒ID")):
        """
        删除提醒
        DELETE /api/zhuiju/reminder/delete
        """
        return self.reminder_biz.delete_reminder(id)

    def ActionZhuijuReminderPendingGet(self, request: Request):
        """
        久未更新的剧集列表
        GET /api/zhuiju/reminder/pending/get
        """
        return self.reminder_biz.check_pending_reminders()
