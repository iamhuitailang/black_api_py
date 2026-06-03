from typing import Optional, Dict, Any
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class UpdateMusicRequest(BaseModel):
    music_id: int = Field(..., description="音乐ID")


class UpdateCharacterRequest(BaseModel):
    character_id: int = Field(..., description="角色ID")


class UpdateSettingsRequest(BaseModel):
    sound_volume: Optional[float] = Field(None, description="音效音量 0-1")
    music_volume: Optional[float] = Field(None, description="音乐音量 0-1")
    vibration: Optional[bool] = Field(None, description="是否开启震动")
    auto_play: Optional[bool] = Field(None, description="是否自动播放")
    difficulty: Optional[str] = Field(None, description="难度设置")


class YpGameController:
    def __init__(self):
        from app.business.yp.game_business import YpGameBusiness
        self.game_business = YpGameBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.yp.user_business import YpUserBusiness
        user_business = YpUserBusiness()
        return user_business.verify_token(token)

    def ActionYpGameStateGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取游戏状态
        GET /api/yp/game/state/get
        获取当前用户的游戏状态，包括当前角色、音乐、设置等
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_game_state(user.get('id'))

    def ActionYpGameMusicUpdatePost(self, request: Request, body: UpdateMusicRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        更新当前选择的音乐
        POST /api/yp/game/music/update
        切换当前游戏音乐
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.update_current_music(user.get('id'), body.music_id)

    def ActionYpGameCharacterUpdatePost(self, request: Request, body: UpdateCharacterRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        更新当前选择的角色
        POST /api/yp/game/character/update
        切换当前游戏角色
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.update_current_character(user.get('id'), body.character_id)

    def ActionYpGameSettingsUpdatePost(self, request: Request, body: UpdateSettingsRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        更新游戏设置
        POST /api/yp/game/settings/update
        更新音量、震动等游戏设置
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        settings: Dict[str, Any] = {}
        if body.sound_volume is not None:
            settings['sound_volume'] = body.sound_volume
        if body.music_volume is not None:
            settings['music_volume'] = body.music_volume
        if body.vibration is not None:
            settings['vibration'] = body.vibration
        if body.auto_play is not None:
            settings['auto_play'] = body.auto_play
        if body.difficulty is not None:
            settings['difficulty'] = body.difficulty

        return self.game_business.update_settings(user.get('id'), settings)

    def ActionYpGameBonusGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取游戏加成
        GET /api/yp/game/bonus/get
        获取当前用户的所有游戏加成（角色+技能）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_game_bonus(user.get('id'))

    def ActionYpGamePlaytimeUpdatePost(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """
        更新最后游戏时间
        POST /api/yp/game/playtime/update
        更新用户最后一次游戏时间
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.update_last_play_time(user.get('id'))
