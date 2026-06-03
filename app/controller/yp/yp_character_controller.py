from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class PurchaseCharacterRequest(BaseModel):
    character_id: int = Field(..., description="角色ID")


class SetCharacterRequest(BaseModel):
    character_id: int = Field(..., description="角色ID")


class CreateCharacterRequest(BaseModel):
    name: str = Field(..., description="角色名称")
    description: Optional[str] = Field(None, description="角色描述")
    avatar: Optional[str] = Field(None, description="头像标识")
    rarity: Optional[int] = Field(1, description="稀有度")
    price: Optional[int] = Field(0, description="价格")
    speed_bonus: Optional[float] = Field(1.0, description="速度加成")
    jump_bonus: Optional[float] = Field(1.0, description="跳跃加成")
    score_bonus: Optional[float] = Field(1.0, description="得分加成")
    is_default: Optional[int] = Field(0, description="是否默认角色")


class YpCharacterController:
    def __init__(self):
        from app.business.yp.character_business import YpCharacterBusiness
        self.character_business = YpCharacterBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.yp.user_business import YpUserBusiness
        user_business = YpUserBusiness()
        return user_business.verify_token(token)

    def ActionYpCharacterListGet(self, request: Request):
        """
        获取所有角色列表
        GET /api/yp/character/list/get
        获取所有可用角色列表
        """
        return self.character_business.get_all_characters()

    def ActionYpCharacterMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我的角色列表
        GET /api/yp/character/my/get
        获取当前用户已拥有的角色列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.character_business.get_user_characters(user.get('id'))

    def ActionYpCharacterUsingGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前使用的角色
        GET /api/yp/character/using/get
        获取当前用户正在使用的角色
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.character_business.get_using_character(user.get('id'))

    def ActionYpCharacterSetPost(self, request: Request, body: SetCharacterRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        设置使用的角色
        POST /api/yp/character/set
        切换当前使用的角色
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.character_business.set_using_character(user.get('id'), body.character_id)

    def ActionYpCharacterPurchasePost(self, request: Request, body: PurchaseCharacterRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        购买角色
        POST /api/yp/character/purchase
        使用金币购买新角色
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.character_business.purchase_character(user.get('id'), body.character_id)

    def ActionYpCharacterCreatePost(self, request: Request, body: CreateCharacterRequest):
        """
        创建角色（管理员）
        POST /api/yp/character/create
        创建新角色
        """
        data = {
            'name': body.name,
            'description': body.description or '',
            'avatar': body.avatar or '',
            'rarity': body.rarity or 1,
            'price': body.price or 0,
            'speed_bonus': body.speed_bonus or 1.0,
            'jump_bonus': body.jump_bonus or 1.0,
            'score_bonus': body.score_bonus or 1.0,
            'is_default': body.is_default or 0
        }
        return self.character_business.create_character(data)

    def ActionYpCharacterDeletePost(self, request: Request, character_id: int = Query(..., description="角色ID")):
        """
        删除角色（管理员）
        POST /api/yp/character/delete
        删除指定角色
        """
        return self.character_business.delete_character(character_id)
