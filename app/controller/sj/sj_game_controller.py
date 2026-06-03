from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class BattleActionRequest(BaseModel):
    character_id: int = Field(..., description="角色ID")
    action: str = Field(..., description="动作: attack/defend/flee")
    skill_name: Optional[str] = Field('', description="技能名")
    time_ability: Optional[str] = Field('', description="时间能力名")


class EventChoiceRequest(BaseModel):
    character_id: int = Field(..., description="角色ID")
    event_id: str = Field(..., description="事件ID")
    choice_index: int = Field(..., description="选择索引")


class ReviveRequest(BaseModel):
    character_id: int = Field(..., description="角色ID")


class SjGameController:
    def __init__(self):
        from app.business.sj.game_business import SjGameBusiness
        self.game_business = SjGameBusiness()
        from app.business.sj.user_business import SjUserBusiness
        self.user_business = SjUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionSjGameEnterFloorPost(self, request: Request, character_id: int = Query(..., description="角色ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        进入下一层
        POST /api/sj/game/enter/floor
        """
        return self.game_business.enter_floor(character_id)

    def ActionSjGameBattleActionPost(self, request: Request, body: BattleActionRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        战斗动作
        POST /api/sj/game/battle/action
        """
        return self.game_business.battle_action(
            character_id=body.character_id,
            action=body.action,
            skill_name=body.skill_name or '',
            use_time_ability=body.time_ability or ''
        )

    def ActionSjGameEventGet(self, request: Request):
        """
        获取随机事件
        GET /api/sj/game/event/get
        """
        return self.game_business.get_random_event()

    def ActionSjGameEventChoicePost(self, request: Request, body: EventChoiceRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        处理事件选择
        POST /api/sj/game/event/choice
        """
        return self.game_business.handle_event(
            character_id=body.character_id,
            event_id=body.event_id,
            choice_index=body.choice_index
        )

    def ActionSjGameRestPost(self, request: Request, character_id: int = Query(..., description="角色ID"),
                              authorization: Optional[str] = Header(None)):
        """
        休息层恢复
        POST /api/sj/game/rest
        """
        return self.game_business.rest_floor(character_id)

    def ActionSjGameRevivePost(self, request: Request, body: ReviveRequest,
                                authorization: Optional[str] = Header(None)):
        """
        复活角色
        POST /api/sj/game/revive
        """
        return self.game_business.revive_character(body.character_id)

    def ActionSjGameEndingGet(self, request: Request, character_id: int = Query(..., description="角色ID"),
                               authorization: Optional[str] = Header(None)):
        """
        获取结局
        GET /api/sj/game/ending/get
        """
        return self.game_business.get_ending(character_id)
