from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateWaveRequest(BaseModel):
    wave_number: Optional[int] = Field(None, description="关卡编号")
    enemy_count: Optional[int] = Field(None, description="敌人数量")
    enemy_types: Optional[str] = Field(None, description="敌人类型")
    boss_id: Optional[int] = Field(None, description="BOSSID")
    reward: Optional[str] = Field(None, description="奖励")
    description: Optional[str] = Field(None, description="描述")


class UpdateWaveRequest(BaseModel):
    wave_number: Optional[int] = Field(None, description="关卡编号")
    enemy_count: Optional[int] = Field(None, description="敌人数量")
    enemy_types: Optional[str] = Field(None, description="敌人类型")
    boss_id: Optional[int] = Field(None, description="BOSSID")
    reward: Optional[str] = Field(None, description="奖励")
    description: Optional[str] = Field(None, description="描述")


class DafeijiWaveController:
    def __init__(self):
        from app.business.dafeiji.wave_business import DafeijiWaveBusiness
        from app.business.dafeiji.user_business import DafeijiUserBusiness
        self.wave_business = DafeijiWaveBusiness()
        self.user_business = DafeijiUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionDafeijiWaveListGet(self, request: Request,
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        return self.wave_business.get_list(
            page=page,
            page_size=page_size
        )

    def ActionDafeijiWaveAllGet(self, request: Request):
        return self.wave_business.get_all()

    def ActionDafeijiWaveDetailGet(self, request: Request,
                                    wave_id: int = Query(..., description="关卡ID")):
        return self.wave_business.get_by_id(wave_id=wave_id)

    def ActionDafeijiWaveNumberGet(self, request: Request,
                                    wave_number: int = Query(..., description="关卡编号")):
        return self.wave_business.get_by_wave_number(wave_number=wave_number)

    def ActionDafeijiWaveCreatePost(self, request: Request, body: CreateWaveRequest,
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        data = {k: v for k, v in body.__dict__.items() if not k.startswith('_') and v is not None}
        return self.wave_business.create(data=data)

    def ActionDafeijiWaveUpdatePost(self, request: Request,
                                     wave_id: int = Query(..., description="关卡ID"),
                                     body: UpdateWaveRequest = None,
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        data = {k: v for k, v in body.__dict__.items() if not k.startswith('_') and v is not None}
        return self.wave_business.update(
            wave_id=wave_id,
            data=data
        )

    def ActionDafeijiWaveDeletePost(self, request: Request,
                                     wave_id: int = Query(..., description="关卡ID"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') != 'admin':
            return {
                'code': 1,
                'msg': '需要管理员权限',
                'data': None
            }

        return self.wave_business.delete(wave_id=wave_id)
