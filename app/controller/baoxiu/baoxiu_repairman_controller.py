from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class BaoxiuRepairmanController:
    def __init__(self):
        from app.business.baoxiu.repairman_business import BaoxiuRepairmanBusiness
        self.repairman_business = BaoxiuRepairmanBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def ActionBaoxiuRepairmanListGet(self, request: Request,
                                      page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      specialty: Optional[str] = Query(None, description="专长"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取维修工列表接口
        GET /api/baoxiu/repairman/list/get
        """
        return self.repairman_business.get_repairman_list(page, page_size, specialty, status)

    def ActionBaoxiuRepairmanAvailableGet(self, request: Request,
                                           authorization: Optional[str] = Header(None)):
        """
        获取可用维修工列表接口
        GET /api/baoxiu/repairman/available/get
        """
        return self.repairman_business.get_available_repairmen()

    def ActionBaoxiuStudentListGet(self, request: Request,
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(10, description="每页数量"),
                                    dormitory_id: Optional[int] = Query(None, description="宿舍楼ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取学生列表接口
        GET /api/baoxiu/student/list/get
        """
        return self.repairman_business.get_student_list(page, page_size, dormitory_id)

    def ActionBaoxiuRepairmanDetailGet(self, request: Request,
                                        user_id: int = Query(..., description="用户ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取人员详情接口
        GET /api/baoxiu/repairman/detail/get
        """
        return self.repairman_business.get_repairman_detail(user_id)

    def ActionBaoxiuRepairmanStatusUpdatePost(self, request: Request,
                                               user_id: int = Query(..., description="用户ID"),
                                               status: int = Query(..., description="状态"),
                                               authorization: Optional[str] = Header(None)):
        """
        更新维修工状态接口
        POST /api/baoxiu/repairman/status/update
        """
        return self.repairman_business.update_repairman_status(user_id, status)
