from typing import Optional, Dict, Any
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class UpdateMissionProgressRequest(BaseModel):
    mission_type: str = Field(..., description="任务类型")
    value: int = Field(1, description="进度值")


class ClaimMissionRequest(BaseModel):
    user_mission_id: int = Field(..., description="用户任务ID")


class CreateMissionRequest(BaseModel):
    name: str = Field(..., description="任务名称")
    description: str = Field(..., description="任务描述")
    type: int = Field(..., description="任务类型")
    target_type: str = Field(..., description="目标类型")
    target_value: int = Field(..., description="目标值")
    reward_exp: int = Field(..., description="奖励经验")
    reward_gold: int = Field(..., description="奖励金币")
    is_daily: int = Field(..., description="是否每日任务")


class UpdateMissionRequest(BaseModel):
    mission_id: int = Field(..., description="任务ID")
    name: Optional[str] = Field(None, description="任务名称")
    description: Optional[str] = Field(None, description="任务描述")
    type: Optional[int] = Field(None, description="任务类型")
    target_type: Optional[str] = Field(None, description="目标类型")
    target_value: Optional[int] = Field(None, description="目标值")
    reward_exp: Optional[int] = Field(None, description="奖励经验")
    reward_gold: Optional[int] = Field(None, description="奖励金币")
    is_daily: Optional[int] = Field(None, description="是否每日任务")


class DeleteMissionRequest(BaseModel):
    mission_id: int = Field(..., description="任务ID")


class HdMissionController:
    def __init__(self):
        from app.business.hd.mission_business import HdMissionBusiness
        from app.business.hd.user_business import HdUserBusiness
        self.mission_business = HdMissionBusiness()
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

    def ActionHdMissionListGet(self, request: Request,
                                type: Optional[int] = Query(None, description="任务类型"),
                                page: int = Query(1, description="页码"),
                                page_size: int = Query(10, description="每页数量")):
        """
        获取所有任务
        GET /api/hd/mission/list/get
        """
        return self.mission_business.get_all_missions(
            mission_type=type,
            page=page,
            page_size=page_size
        )

    def ActionHdMissionUserGet(self, request: Request,
                                authorization: Optional[str] = Header(None)):
        """
        获取用户任务列表及进度
        GET /api/hd/mission/user/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.mission_business.get_user_missions(user.get('id'))

    def ActionHdMissionProgressUpdatePost(self, request: Request, body: UpdateMissionProgressRequest,
                                           authorization: Optional[str] = Header(None)):
        """
        更新任务进度
        POST /api/hd/mission/progress/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.mission_business.update_mission_progress(
            user_id=user.get('id'),
            mission_type=body.mission_type,
            value=body.value
        )

    def ActionHdMissionClaimPost(self, request: Request, body: ClaimMissionRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        领取任务奖励
        POST /api/hd/mission/claim
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.mission_business.claim_reward(
            user_id=user.get('id'),
            user_mission_id=body.user_mission_id
        )

    def ActionHdMissionRefreshPost(self, request: Request,
                                    authorization: Optional[str] = Header(None)):
        """
        刷新每日任务
        POST /api/hd/mission/refresh
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.mission_business.refresh_daily_missions(user.get('id'))

    def ActionHdMissionCreatePost(self, request: Request, body: CreateMissionRequest):
        """
        管理员创建任务
        POST /api/hd/mission/create
        """
        data = {
            'name': body.name,
            'description': body.description,
            'type': body.type,
            'target_type': body.target_type,
            'target_value': body.target_value,
            'reward_exp': body.reward_exp,
            'reward_gold': body.reward_gold,
            'is_daily': body.is_daily
        }
        return self.mission_business.create_mission(data)

    def ActionHdMissionUpdatePost(self, request: Request, body: UpdateMissionRequest):
        """
        管理员更新任务
        POST /api/hd/mission/update
        """
        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.type is not None:
            data['mission_type'] = body.type
        if body.target_type is not None:
            data['target_type'] = body.target_type
        if body.target_value is not None:
            data['target_value'] = body.target_value
        if body.reward_exp is not None:
            data['reward_exp'] = body.reward_exp
        if body.reward_gold is not None:
            data['reward_gold'] = body.reward_gold
        if body.is_daily is not None:
            data['is_daily'] = body.is_daily

        return self.mission_business.update_mission(
            mission_id=body.mission_id,
            data=data
        )

    def ActionHdMissionDeletePost(self, request: Request, body: DeleteMissionRequest):
        """
        管理员删除任务
        POST /api/hd/mission/delete
        """
        return self.mission_business.delete_mission(body.mission_id)
