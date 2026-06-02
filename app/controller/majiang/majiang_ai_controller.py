from typing import Dict, Any, Optional
from fastapi import Request, Query, Header, Body
from pydantic import BaseModel
from app.business.majiang import MajiangAiBusiness
from app.business.majiang import MajiangAdminBusiness


class CreateAiRequest(BaseModel):
    name: str
    difficulty: int
    description: str = ''
    avatar: str = ''
    think_time: int = 1000
    risk_tolerance: float = 0.5


class UpdateAiRequest(BaseModel):
    name: Optional[str] = None
    difficulty: Optional[int] = None
    description: Optional[str] = None
    avatar: Optional[str] = None
    think_time: Optional[int] = None
    risk_tolerance: Optional[float] = None
    status: Optional[int] = None


class MajiangAiController:
    def __init__(self):
        self.ai_business = MajiangAiBusiness()
        self.admin_business = MajiangAdminBusiness()

    def _verify_admin(self, authorization: str) -> Optional[Dict[str, Any]]:
        if not authorization or not authorization.startswith('Bearer '):
            return None
        token = authorization.replace('Bearer ', '')
        result = self.admin_business.verify_admin_token(token)
        if result.get('code') == 0:
            return result.get('data')
        return None

    def ActionMajiangAiListGet(self, request: Request,
                                page: int = Query(1, description='页码'),
                                page_size: int = Query(10, description='每页数量'),
                                difficulty: Optional[int] = Query(None, description='难度筛选'),
                                status: Optional[int] = Query(None, description='状态筛选')):
        return self.ai_business.get_ai_list(page, page_size, difficulty, status)

    def ActionMajiangAiAllGet(self, request: Request):
        return self.ai_business.get_all_active_ai()

    def ActionMajiangAiDetailGet(self, request: Request,
                                  ai_id: int = Query(..., description='AI ID')):
        return self.ai_business.get_ai_by_id(ai_id)

    def ActionMajiangAiDifficultyGet(self, request: Request,
                                      difficulty: int = Query(..., description='难度值')):
        return self.ai_business.get_ai_by_difficulty(difficulty)

    def ActionMajiangAiCreatePost(self, request: Request,
                                   body: CreateAiRequest,
                                   authorization: Optional[str] = Header(None)):
        admin = self._verify_admin(authorization)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员未登录或权限不足',
                'data': None
            }

        return self.ai_business.create_ai(
            name=body.name,
            difficulty=body.difficulty,
            description=body.description,
            avatar=body.avatar,
            think_time=body.think_time,
            risk_tolerance=body.risk_tolerance
        )

    def ActionMajiangAiUpdatePost(self, request: Request,
                                   ai_id: int = Query(..., description='AI ID'),
                                   body: UpdateAiRequest = Body(...),
                                   authorization: Optional[str] = Header(None)):
        admin = self._verify_admin(authorization)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员未登录或权限不足',
                'data': None
            }

        data = {k: v for k, v in body.dict().items() if v is not None}
        return self.ai_business.update_ai(ai_id, data)

    def ActionMajiangAiDeletePost(self, request: Request,
                                   ai_id: int = Query(..., description='AI ID'),
                                   authorization: Optional[str] = Header(None)):
        admin = self._verify_admin(authorization)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员未登录或权限不足',
                'data': None
            }

        return self.ai_business.delete_ai(ai_id)

    def ActionMajiangAiEnablePost(self, request: Request,
                                   ai_id: int = Query(..., description='AI ID'),
                                   authorization: Optional[str] = Header(None)):
        admin = self._verify_admin(authorization)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员未登录或权限不足',
                'data': None
            }

        return self.ai_business.enable_ai(ai_id)

    def ActionMajiangAiDisablePost(self, request: Request,
                                    ai_id: int = Query(..., description='AI ID'),
                                    authorization: Optional[str] = Header(None)):
        admin = self._verify_admin(authorization)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员未登录或权限不足',
                'data': None
            }

        return self.ai_business.disable_ai(ai_id)
