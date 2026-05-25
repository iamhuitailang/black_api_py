from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class BaoxiuLogController:
    def __init__(self):
        from app.business.baoxiu.log_business import BaoxiuLogBusiness
        self.log_business = BaoxiuLogBusiness()

    def ActionBaoxiuLogListGet(self, request: Request,
                                page: int = Query(1, description="页码"),
                                page_size: int = Query(10, description="每页数量"),
                                user_id: Optional[int] = Query(None, description="用户ID"),
                                action: Optional[str] = Query(None, description="操作类型"),
                                target_type: Optional[str] = Query(None, description="目标类型"),
                                start_date: Optional[str] = Query(None, description="开始日期"),
                                end_date: Optional[str] = Query(None, description="结束日期"),
                                keyword: Optional[str] = Query(None, description="搜索关键词"),
                                authorization: Optional[str] = Header(None)):
        """
        获取系统日志列表接口
        GET /api/baoxiu/log/list/get
        """
        return self.log_business.get_logs(
            page=page, page_size=page_size,
            user_id=user_id, action=action,
            target_type=target_type, start_date=start_date,
            end_date=end_date, keyword=keyword
        )

    def ActionBaoxiuLogDeletePost(self, request: Request,
                                   log_id: int = Query(..., description="日志ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        删除系统日志接口
        POST /api/baoxiu/log/delete
        """
        return self.log_business.delete_log(log_id)

    def ActionBaoxiuLogCleanPost(self, request: Request,
                                  days: int = Query(90, description="清理天数"),
                                  authorization: Optional[str] = Header(None)):
        """
        清理旧日志接口
        POST /api/baoxiu/log/clean
        """
        return self.log_business.clean_old_logs(days)
