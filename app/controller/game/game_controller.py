from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field
from app.business.game import GameBusiness


class CompleteLevelRequest(BaseModel):
    level_num: int = Field(..., description="通关关卡号")


class SelectSkinRequest(BaseModel):
    skin_key: str = Field(..., description="皮肤标识")


class SelectLevelRequest(BaseModel):
    level_num: int = Field(..., description="选择的关卡号")


class GameController:
    def __init__(self):
        self.game_business = GameBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def ActionGameLevelGet(self, request: Request, level_num: int = Query(1, description="关卡号"), authorization: Optional[str] = Header(None)):
        """
        获取关卡配置
        GET /api/game/level/get
        """
        token = self._get_token_from_header(request, authorization)
        return self.game_business.get_level_config(level_num, token)

    def ActionGameLevelsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取所有关卡列表
        GET /api/game/levels/get
        """
        return self.game_business.get_all_levels()

    def ActionGameProgressGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取玩家进度
        GET /api/game/progress/get
        """
        token = self._get_token_from_header(request, authorization)
        return self.game_business.get_player_progress(token)

    def ActionGameLevelCompletePost(self, request: Request, body: CompleteLevelRequest, authorization: Optional[str] = Header(None)):
        """
        完成关卡
        POST /api/game/level/complete
        """
        token = self._get_token_from_header(request, authorization)
        return self.game_business.complete_level(token, body.level_num)

    def ActionGameLevelFailPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        关卡失败记录
        POST /api/game/level/fail
        """
        token = self._get_token_from_header(request, authorization)
        return self.game_business.fail_level(token)

    def ActionGameSkinsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取所有皮肤列表
        GET /api/game/skins/get
        """
        token = self._get_token_from_header(request, authorization)
        return self.game_business.get_all_skins(token)

    def ActionGameSkinSelectPost(self, request: Request, body: SelectSkinRequest, authorization: Optional[str] = Header(None)):
        """
        选择皮肤
        POST /api/game/skin/select
        """
        token = self._get_token_from_header(request, authorization)
        return self.game_business.select_skin(token, body.skin_key)

    def ActionGameLevelSelectPost(self, request: Request, body: SelectLevelRequest, authorization: Optional[str] = Header(None)):
        """
        选择关卡
        POST /api/game/level/select
        """
        token = self._get_token_from_header(request, authorization)
        return self.game_business.select_level(token, body.level_num)
