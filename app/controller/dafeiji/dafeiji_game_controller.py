from fastapi import Request, Header
from typing import Optional
from app.business.dafeiji import GameBusiness, DafeijiAuthBusiness


class DafeijiGameController:
    def __init__(self):
        self.game_business = GameBusiness()
        self.auth_business = DafeijiAuthBusiness()

    async def ActionDafeijiGamePlanes(self):
        """获取飞机列表"""
        return self.game_business.get_planes()

    async def ActionDafeijiGameWaves(self):
        """获取所有波次配置"""
        return self.game_business.get_waves()

    async def ActionDafeijiGameWave(self, wave: int = 1):
        """获取指定波次配置"""
        return self.game_business.get_wave(wave)

    async def ActionDafeijiGameStateSavePost(self, request: Request, authorization: Optional[str] = Header(None)):
        """保存游戏状态"""
        user_info = self._verify_auth(authorization)
        if not user_info:
            return {'code': 1, 'message': '请先登录', 'data': None}

        body = await request.json()
        plane_id = body.get('plane_id', '')
        state_data = body.get('state_data', {})
        score = body.get('score', 0)
        wave = body.get('wave', 1)
        is_paused = body.get('is_paused', False)

        return self.game_business.save_game_state(
            user_id=user_info['user_id'],
            plane_id=plane_id,
            state_data=state_data,
            score=score,
            wave=wave,
            is_paused=is_paused
        )

    async def ActionDafeijiGameStateLoad(self, authorization: Optional[str] = Header(None)):
        """加载游戏状态"""
        user_info = self._verify_auth(authorization)
        if not user_info:
            return {'code': 1, 'message': '请先登录', 'data': None}

        return self.game_business.load_game_state(user_info['user_id'])

    async def ActionDafeijiGameEndPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """游戏结束，提交分数"""
        user_info = self._verify_auth(authorization)
        if not user_info:
            return {'code': 1, 'message': '请先登录', 'data': None}

        body = await request.json()
        state_id = body.get('state_id', 0)
        score = body.get('score', 0)
        wave = body.get('wave', 1)
        kills = body.get('kills', 0)
        play_time = body.get('play_time', 0)
        plane_id = body.get('plane_id', '')
        collected_items = body.get('collected_items', [])
        used_planes = body.get('used_planes', [])
        perfect_waves = body.get('perfect_waves', 0)

        return self.game_business.end_game(
            user_id=user_info['user_id'],
            state_id=state_id,
            score=score,
            wave=wave,
            kills=kills,
            play_time=play_time,
            plane_id=plane_id,
            collected_items=collected_items,
            used_planes=used_planes,
            perfect_waves=perfect_waves
        )

    async def ActionDafeijiGameLeaderboard(self, type: str = 'daily', limit: int = 50):
        """获取排行榜"""
        return self.game_business.get_leaderboard(type, limit)

    async def ActionDafeijiGameAchievements(self, authorization: Optional[str] = Header(None)):
        """获取成就列表"""
        user_info = self._verify_auth(authorization)
        user_id = user_info['user_id'] if user_info else None
        return self.game_business.get_achievements(user_id)

    async def ActionDafeijiGameUserStats(self, authorization: Optional[str] = Header(None)):
        """获取用户统计数据"""
        user_info = self._verify_auth(authorization)
        if not user_info:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.game_business.get_user_stats(user_info['user_id'])

    async def ActionDafeijiGameBossKillPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """记录Boss击杀"""
        user_info = self._verify_auth(authorization)
        if not user_info:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.game_business.check_boss_first_kill(user_info['user_id'])

    def _verify_auth(self, authorization: Optional[str]) -> Optional[dict]:
        if not authorization:
            return None
        token = authorization[7:] if authorization.startswith('Bearer ') else authorization
        return self.auth_business.verify_token(token)
