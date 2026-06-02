from typing import Optional, Dict, Any
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field

from app.business.meng import MengLevelBusiness, MengUserBusiness


class CreateLevelRequest(BaseModel):
    dream_id: int = Field(..., description="梦境ID")
    name: str = Field(..., description="关卡名称")
    description: str = Field(..., description="关卡描述")
    level_type: str = Field(..., description="关卡类型")
    difficulty: int = Field(..., description="难度 1-5")
    target_x: float = Field(..., description="目标X坐标")
    target_y: float = Field(..., description="目标Y坐标")
    target_z: float = Field(..., description="目标Z坐标")
    reward: Optional[int] = Field(0, description="奖励碎片数量")
    data: Optional[Dict[str, Any]] = Field(None, description="关卡数据")


class UpdateLevelRequest(BaseModel):
    dream_id: int = Field(..., description="梦境ID")
    level_id: int = Field(..., description="关卡ID")
    name: Optional[str] = Field(None, description="关卡名称")
    description: Optional[str] = Field(None, description="关卡描述")
    level_type: Optional[str] = Field(None, description="关卡类型")
    difficulty: Optional[int] = Field(None, description="难度 1-5")
    target_x: Optional[float] = Field(None, description="目标X坐标")
    target_y: Optional[float] = Field(None, description="目标Y坐标")
    target_z: Optional[float] = Field(None, description="目标Z坐标")
    reward: Optional[int] = Field(None, description="奖励碎片数量")
    data: Optional[Dict[str, Any]] = Field(None, description="关卡数据")


class MengLevelController:
    def __init__(self):
        self.level_business = MengLevelBusiness()
        self.user_business = MengUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionMengLevelCreatePost(self, request: Request, body: CreateLevelRequest,
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.level_business.create_level(
            user_id=user.get('id'),
            dream_id=body.dream_id,
            name=body.name,
            description=body.description,
            level_type=body.level_type,
            difficulty=body.difficulty,
            target_x=body.target_x,
            target_y=body.target_y,
            target_z=body.target_z,
            reward=body.reward,
            data=body.data
        )

    def ActionMengLevelListGet(self, request: Request,
                                dream_id: int = Query(..., description="梦境ID"),
                                authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.level_business.get_dream_levels(dream_id=dream_id)

    def ActionMengLevelDetailGet(self, request: Request,
                                  level_id: int = Query(..., description="关卡ID"),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.level_business.get_level_detail(level_id=level_id)

    def ActionMengLevelUpdatePost(self, request: Request, body: UpdateLevelRequest,
                                   authorization: Optional[str] = Header(None)):
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
        if body.description is not None:
            data['description'] = body.description
        if body.level_type is not None:
            data['level_type'] = body.level_type
        if body.difficulty is not None:
            data['difficulty'] = body.difficulty
        if body.target_x is not None:
            data['target_x'] = body.target_x
        if body.target_y is not None:
            data['target_y'] = body.target_y
        if body.target_z is not None:
            data['target_z'] = body.target_z
        if body.reward is not None:
            data['reward'] = body.reward
        if body.data is not None:
            data['data'] = body.data

        return self.level_business.update_level(
            user_id=user.get('id'),
            dream_id=body.dream_id,
            level_id=body.level_id,
            data=data
        )

    def ActionMengLevelDeletePost(self, request: Request,
                                   dream_id: int = Query(..., description="梦境ID"),
                                   level_id: int = Query(..., description="关卡ID"),
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.level_business.delete_level(
            user_id=user.get('id'),
            dream_id=dream_id,
            level_id=level_id
        )

    def ActionMengLevelCompletePost(self, request: Request,
                                     level_id: int = Query(..., description="关卡ID"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.level_business.complete_level(
            user_id=user.get('id'),
            level_id=level_id
        )

    def ActionMengLevelCompletedGet(self, request: Request,
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.level_business.get_user_completed_levels(
            user_id=user.get('id')
        )
