from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SaveGameResultRequest(BaseModel):
    level_id: int = Field(0, description="关卡ID")
    score: int = Field(..., description="得分")
    combo_max: int = Field(0, description="最大连击")
    combo_count: int = Field(0, description="连击次数")
    balls_used: int = Field(0, description="使用球数")
    play_duration: int = Field(0, description="游戏时长(秒)")
    hit_count: int = Field(0, description="碰撞次数")
    hit_details: Optional[List] = Field(None, description="碰撞详情")
    item_hits: Optional[dict] = Field(None, description="道具碰撞统计")


class DanzhuGameController:
    def __init__(self):
        from app.business.danzhu import DanzhuGameBusiness
        self.game_business = DanzhuGameBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def ActionDanzhuGameConfigGet(self, request: Request, level_id: int = Query(0, description="关卡ID")):
        """
        获取关卡配置接口
        GET /api/danzhu/game/config/get
        获取指定或默认关卡的配置信息
        """
        return self.game_business.get_level_config(level_id)

    def ActionDanzhuGameLevelsGet(self, request: Request):
        """
        获取关卡列表接口
        GET /api/danzhu/game/levels/get
        获取所有已发布的关卡列表
        """
        return self.game_business.get_level_list()

    def ActionDanzhuGameResultSavePost(self, request: Request, body: SaveGameResultRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        保存游戏结果接口
        POST /api/danzhu/game/result/save
        保存游戏得分和相关数据
        """
        from app.business.danzhu import DanzhuUserBusiness
        user_business = DanzhuUserBusiness()

        token = self._get_token_from_header(request, authorization)
        user = user_business.verify_token(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.save_game_result(
            user_id=user.get('id'),
            level_id=body.level_id,
            score=body.score,
            combo_max=body.combo_max,
            combo_count=body.combo_count,
            balls_used=body.balls_used,
            play_duration=body.play_duration,
            hit_count=body.hit_count,
            hit_details=body.hit_details,
            item_hits=body.item_hits
        )

    def ActionDanzhuGameHistoryGet(self, request: Request,
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(10, description="每页数量"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取游戏历史接口
        GET /api/danzhu/game/history/get
        获取当前用户的游戏历史记录
        """
        from app.business.danzhu import DanzhuUserBusiness
        user_business = DanzhuUserBusiness()

        token = self._get_token_from_header(request, authorization)
        user = user_business.verify_token(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_user_game_history(user.get('id'), page, page_size)
