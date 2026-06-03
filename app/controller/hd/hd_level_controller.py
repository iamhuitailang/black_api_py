from typing import Optional, Dict, Any
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class StartLevelRequest(BaseModel):
    level_id: int = Field(..., description="关卡ID")


class CompleteLevelRequest(BaseModel):
    level_id: int = Field(..., description="关卡ID")
    score: int = Field(..., description="得分")
    time: int = Field(..., description="用时(秒)")


class LevelDetailRequest(BaseModel):
    level_id: int = Field(..., description="关卡ID")


class CreateLevelRequest(BaseModel):
    name: str = Field(..., description="关卡名称")
    description: str = Field(..., description="关卡描述")
    type: int = Field(..., description="关卡类型")
    difficulty: int = Field(..., description="难度等级")
    unlock_level: int = Field(..., description="解锁等级")
    reward_exp: int = Field(..., description="奖励经验")
    reward_gold: int = Field(..., description="奖励金币")
    enemy_count: int = Field(..., description="敌人数量")
    time_limit: int = Field(..., description="时间限制(秒)")
    map_data: str = Field(..., description="地图数据")


class UpdateLevelRequest(BaseModel):
    level_id: int = Field(..., description="关卡ID")
    name: Optional[str] = Field(None, description="关卡名称")
    description: Optional[str] = Field(None, description="关卡描述")
    type: Optional[int] = Field(None, description="关卡类型")
    difficulty: Optional[int] = Field(None, description="难度等级")
    unlock_level: Optional[int] = Field(None, description="解锁等级")
    reward_exp: Optional[int] = Field(None, description="奖励经验")
    reward_gold: Optional[int] = Field(None, description="奖励金币")
    enemy_count: Optional[int] = Field(None, description="敌人数量")
    time_limit: Optional[int] = Field(None, description="时间限制(秒)")
    map_data: Optional[str] = Field(None, description="地图数据")


class DeleteLevelRequest(BaseModel):
    level_id: int = Field(..., description="关卡ID")


class HdLevelController:
    def __init__(self):
        from app.business.hd.level_business import HdLevelBusiness
        from app.business.hd.user_business import HdUserBusiness
        self.level_business = HdLevelBusiness()
        self.user_business = HdUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[Dict[str, Any]]:
        return self.user_business.verify_token(token)

    def ActionHdLevelListGet(self, request: Request,
                              difficulty: Optional[int] = Query(None, description="难度等级"),
                              page: int = Query(1, description="页码"),
                              page_size: int = Query(10, description="每页数量")):
        """
        获取所有关卡
        GET /api/hd/level/list/get
        """
        return self.level_business.get_all_levels(
            difficulty=difficulty,
            page=page,
            page_size=page_size
        )

    def ActionHdLevelUserGet(self, request: Request,
                              authorization: Optional[str] = Header(None)):
        """
        获取用户关卡进度
        GET /api/hd/level/user/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.level_business.get_user_levels(user.get('id'))

    def ActionHdLevelStartPost(self, request: Request, body: StartLevelRequest,
                                authorization: Optional[str] = Header(None)):
        """
        开始关卡
        POST /api/hd/level/start
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.level_business.start_level(
            user_id=user.get('id'),
            level_id=body.level_id
        )

    def ActionHdLevelCompletePost(self, request: Request, body: CompleteLevelRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        完成关卡
        POST /api/hd/level/complete
        """
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
            level_id=body.level_id,
            score=body.score,
            time=body.time
        )

    def ActionHdLevelDetailGet(self, request: Request,
                                level_id: int = Query(..., description="关卡ID")):
        """
        获取关卡详情
        GET /api/hd/level/detail/get
        """
        return self.level_business.get_level_detail(level_id)

    def ActionHdLevelCreatePost(self, request: Request, body: CreateLevelRequest):
        """
        管理员创建关卡
        POST /api/hd/level/create
        """
        data = {
            'name': body.name,
            'description': body.description,
            'type': body.type,
            'difficulty': body.difficulty,
            'unlock_level': body.unlock_level,
            'reward_exp': body.reward_exp,
            'reward_gold': body.reward_gold,
            'enemy_count': body.enemy_count,
            'time_limit': body.time_limit,
            'map_data': body.map_data
        }
        return self.level_business.create_level(data)

    def ActionHdLevelUpdatePost(self, request: Request, body: UpdateLevelRequest):
        """
        管理员更新关卡
        POST /api/hd/level/update
        """
        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.type is not None:
            data['level_type'] = body.type
        if body.difficulty is not None:
            data['difficulty'] = body.difficulty
        if body.unlock_level is not None:
            data['unlock_level'] = body.unlock_level
        if body.reward_exp is not None:
            data['reward_exp'] = body.reward_exp
        if body.reward_gold is not None:
            data['reward_gold'] = body.reward_gold
        if body.enemy_count is not None:
            data['enemy_count'] = body.enemy_count
        if body.time_limit is not None:
            data['time_limit'] = body.time_limit
        if body.map_data is not None:
            data['map_data'] = body.map_data

        return self.level_business.update_level(
            level_id=body.level_id,
            data=data
        )

    def ActionHdLevelDeletePost(self, request: Request, body: DeleteLevelRequest):
        """
        管理员删除关卡
        POST /api/hd/level/delete
        """
        return self.level_business.delete_level(body.level_id)
