from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateLevelRequest(BaseModel):
    name: str = Field(..., description="关卡名称")
    description: Optional[str] = Field('', description="关卡描述")
    difficulty: Optional[str] = Field('normal', description="难度")
    background: Optional[str] = Field('', description="背景")
    layout_data: Optional[str] = Field('', description="布局数据")
    item_positions: Optional[str] = Field('', description="道具位置")
    ball_count: Optional[int] = Field(3, description="球数")
    gravity: Optional[float] = Field(0.3, description="重力")
    friction: Optional[float] = Field(0.99, description="摩擦力")
    bumper_score: Optional[int] = Field(100, description="弹射器分数")
    target_score: Optional[int] = Field(1000, description="目标分数")
    status: Optional[int] = Field(0, description="状态")


class UpdateLevelRequest(BaseModel):
    name: Optional[str] = Field(None, description="关卡名称")
    description: Optional[str] = Field(None, description="关卡描述")
    difficulty: Optional[str] = Field(None, description="难度")
    background: Optional[str] = Field(None, description="背景")
    layout_data: Optional[str] = Field(None, description="布局数据")
    item_positions: Optional[str] = Field(None, description="道具位置")
    ball_count: Optional[int] = Field(None, description="球数")
    gravity: Optional[float] = Field(None, description="重力")
    friction: Optional[float] = Field(None, description="摩擦力")
    bumper_score: Optional[int] = Field(None, description="弹射器分数")
    target_score: Optional[int] = Field(None, description="目标分数")
    status: Optional[int] = Field(None, description="状态")


class DanzhuLevelController:
    def __init__(self):
        from app.business.danzhu import DanzhuLevelBusiness
        self.level_business = DanzhuLevelBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str):
        from app.business.danzhu import DanzhuAuthBusiness
        auth_business = DanzhuAuthBusiness()
        return auth_business.verify_admin_token(token)

    def ActionDanzhuLevelListGet(self, request: Request,
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  status: Optional[int] = Query(None, description="状态"),
                                  difficulty: Optional[str] = Query(None, description="难度"),
                                  keyword: Optional[str] = Query(None, description="关键词"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取关卡列表接口
        GET /api/danzhu/level/list/get
        管理员获取所有关卡列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.level_business.get_level_list(page, page_size, status, difficulty, keyword)

    def ActionDanzhuLevelPublishedGet(self, request: Request):
        """
        获取已发布关卡接口
        GET /api/danzhu/level/published/get
        获取所有已发布的关卡
        """
        return self.level_business.get_published_levels()

    def ActionDanzhuLevelDetailGet(self, request: Request, level_id: int = Query(..., description="关卡ID")):
        """
        获取关卡详情接口
        GET /api/danzhu/level/detail/get
        获取指定关卡的详细信息
        """
        return self.level_business.get_level_detail(level_id)

    def ActionDanzhuLevelCreatePost(self, request: Request, body: CreateLevelRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建关卡接口
        POST /api/danzhu/level/create
        管理员创建新关卡
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.level_business.create_level(
            name=body.name,
            description=body.description,
            difficulty=body.difficulty,
            background=body.background,
            layout_data=body.layout_data,
            item_positions=body.item_positions,
            ball_count=body.ball_count,
            gravity=body.gravity,
            friction=body.friction,
            bumper_score=body.bumper_score,
            target_score=body.target_score,
            status=body.status
        )

    def ActionDanzhuLevelUpdatePost(self, request: Request, body: UpdateLevelRequest,
                                     level_id: int = Query(..., description="关卡ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        更新关卡接口
        POST /api/danzhu/level/update
        管理员更新关卡信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.difficulty is not None:
            data['difficulty'] = body.difficulty
        if body.background is not None:
            data['background'] = body.background
        if body.layout_data is not None:
            data['layout_data'] = body.layout_data
        if body.item_positions is not None:
            data['item_positions'] = body.item_positions
        if body.ball_count is not None:
            data['ball_count'] = body.ball_count
        if body.gravity is not None:
            data['gravity'] = body.gravity
        if body.friction is not None:
            data['friction'] = body.friction
        if body.bumper_score is not None:
            data['bumper_score'] = body.bumper_score
        if body.target_score is not None:
            data['target_score'] = body.target_score
        if body.status is not None:
            data['status'] = body.status

        return self.level_business.update_level(level_id, data)

    def ActionDanzhuLevelDeletePost(self, request: Request,
                                     level_id: int = Query(..., description="关卡ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        删除关卡接口
        POST /api/danzhu/level/delete
        管理员删除关卡
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.level_business.delete_level(level_id)
