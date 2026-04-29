from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateSkillRequest(BaseModel):
    name: str = Field(..., description="技能名称")
    category: str = Field(..., description="技能分类编码")
    skill_type: str = Field(..., description="技能类型：offer/need")
    level: Optional[str] = Field('初级', description="技能级别：初级/中级/高级")
    description: Optional[str] = Field('', description="技能描述")


class UpdateSkillRequest(BaseModel):
    name: Optional[str] = Field(None, description="技能名称")
    category: Optional[str] = Field(None, description="技能分类编码")
    level: Optional[str] = Field(None, description="技能级别")
    description: Optional[str] = Field(None, description="技能描述")


class JnSkillController:
    def __init__(self):
        from app.business.jn.skill_business import JnSkillBusiness
        from app.business.jn.user_business import JnUserBusiness
        self.skill_business = JnSkillBusiness()
        self.user_business = JnUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionJnSkillCreatePost(self, request: Request, body: CreateSkillRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        创建技能接口
        POST /api/jn/skill/create
        用户发布技能（提供或需求）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.create_skill(
            user_id=user.get('id'),
            name=body.name,
            category=body.category,
            skill_type=body.skill_type,
            level=body.level or '初级',
            description=body.description or ''
        )

    def ActionJnSkillUpdatePost(self, request: Request, body: UpdateSkillRequest,
                                 skill_id: int = Query(..., description="技能ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        更新技能接口
        POST /api/jn/skill/update
        用户更新自己的技能信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.category is not None:
            data['category'] = body.category
        if body.level is not None:
            data['level'] = body.level
        if body.description is not None:
            data['description'] = body.description

        return self.skill_business.update_skill(
            user_id=user.get('id'),
            skill_id=skill_id,
            data=data
        )

    def ActionJnSkillDeletePost(self, request: Request,
                                 skill_id: int = Query(..., description="技能ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        删除技能接口
        POST /api/jn/skill/delete
        用户删除自己的技能
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.delete_skill(
            user_id=user.get('id'),
            skill_id=skill_id
        )

    def ActionJnSkillMyGet(self, request: Request,
                            skill_type: Optional[str] = Query(None, description="技能类型：offer/need"),
                            authorization: Optional[str] = Header(None)):
        """
        获取我的技能列表接口
        GET /api/jn/skill/my/get
        获取当前用户的技能列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.get_user_skills(
            user_id=user.get('id'),
            skill_type=skill_type
        )

    def ActionJnSkillUserGet(self, request: Request,
                              user_id: int = Query(..., description="用户ID"),
                              skill_type: Optional[str] = Query(None, description="技能类型"),
                              authorization: Optional[str] = Header(None)):
        """
        获取用户技能列表接口
        GET /api/jn/skill/user/get
        获取指定用户的技能列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.get_user_skills(
            user_id=user_id,
            skill_type=skill_type
        )

    def ActionJnSkillDetailGet(self, request: Request,
                                skill_id: int = Query(..., description="技能ID"),
                                authorization: Optional[str] = Header(None)):
        """
        获取技能详情接口
        GET /api/jn/skill/detail/get
        根据技能ID获取详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.get_skill_detail(skill_id)

    def ActionJnSkillSearchGet(self, request: Request,
                                keyword: Optional[str] = Query('', description="搜索关键词"),
                                skill_type: Optional[str] = Query(None, description="技能类型"),
                                category: Optional[str] = Query(None, description="分类编码"),
                                page: int = Query(1, description="页码"),
                                page_size: int = Query(10, description="每页数量"),
                                authorization: Optional[str] = Header(None)):
        """
        搜索技能接口
        GET /api/jn/skill/search/get
        按关键词、类型、分类搜索技能
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.search_skills(
            keyword=keyword or '',
            skill_type=skill_type,
            category=category,
            page=page,
            page_size=page_size
        )
