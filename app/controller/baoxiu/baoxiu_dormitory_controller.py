from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateDormitoryRequest(BaseModel):
    name: str = Field(..., description="宿舍楼名称")
    address: Optional[str] = Field('', description="地址")
    floors: Optional[int] = Field(6, description="楼层数")
    rooms_per_floor: Optional[int] = Field(10, description="每层房间数")


class UpdateDormitoryRequest(BaseModel):
    name: Optional[str] = Field(None, description="宿舍楼名称")
    address: Optional[str] = Field(None, description="地址")
    floors: Optional[int] = Field(None, description="楼层数")
    rooms_per_floor: Optional[int] = Field(None, description="每层房间数")
    status: Optional[int] = Field(None, description="状态")


class BaoxiuDormitoryController:
    def __init__(self):
        from app.business.baoxiu.dormitory_business import BaoxiuDormitoryBusiness
        from app.business.baoxiu.auth_business import BaoxiuAuthBusiness
        self.dormitory_business = BaoxiuDormitoryBusiness()
        self.auth_business = BaoxiuAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionBaoxiuDormitoryListGet(self, request: Request,
                                      page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      keyword: Optional[str] = Query(None, description="搜索关键词"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取宿舍楼列表接口
        GET /api/baoxiu/dormitory/list/get
        """
        return self.dormitory_business.get_dormitory_list(page, page_size, status, keyword)

    def ActionBaoxiuDormitoryDetailGet(self, request: Request,
                                        dormitory_id: int = Query(..., description="宿舍楼ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取宿舍楼详情接口
        GET /api/baoxiu/dormitory/detail/get
        """
        return self.dormitory_business.get_dormitory_by_id(dormitory_id)

    def ActionBaoxiuDormitoryCreatePost(self, request: Request, body: CreateDormitoryRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        创建宿舍楼接口
        POST /api/baoxiu/dormitory/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.dormitory_business.create_dormitory(
            name=body.name,
            address=body.address or '',
            floors=body.floors or 6,
            rooms_per_floor=body.rooms_per_floor or 10,
            operator_id=user.get('id')
        )

    def ActionBaoxiuDormitoryUpdatePost(self, request: Request, body: UpdateDormitoryRequest,
                                         dormitory_id: int = Query(..., description="宿舍楼ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        更新宿舍楼接口
        POST /api/baoxiu/dormitory/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.address is not None:
            data['address'] = body.address
        if body.floors is not None:
            data['floors'] = body.floors
        if body.rooms_per_floor is not None:
            data['rooms_per_floor'] = body.rooms_per_floor
        if body.status is not None:
            data['status'] = body.status

        return self.dormitory_business.update_dormitory(
            dormitory_id=dormitory_id,
            data=data,
            operator_id=user.get('id')
        )

    def ActionBaoxiuDormitoryStatusUpdatePost(self, request: Request,
                                               dormitory_id: int = Query(..., description="宿舍楼ID"),
                                               status: int = Query(..., description="状态"),
                                               authorization: Optional[str] = Header(None)):
        """
        更新宿舍楼状态接口
        POST /api/baoxiu/dormitory/status/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.dormitory_business.update_status(
            dormitory_id=dormitory_id,
            status=status,
            operator_id=user.get('id')
        )

    def ActionBaoxiuDormitoryDeletePost(self, request: Request,
                                         dormitory_id: int = Query(..., description="宿舍楼ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        删除宿舍楼接口
        POST /api/baoxiu/dormitory/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.dormitory_business.delete_dormitory(
            dormitory_id=dormitory_id,
            operator_id=user.get('id')
        )
