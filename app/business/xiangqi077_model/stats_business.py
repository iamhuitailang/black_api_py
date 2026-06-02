from typing import Dict, Any
from app.model.xiangqi077_model import XiangqiGameModel, XiangqiUserModel, XiangqiChatModel, XiangqiSpectatorModel
from app.common.sqlite.db import get_db


class XiangqiStatsBusiness:
    def __init__(self):
        self.game_model = XiangqiGameModel()
        self.user_model = XiangqiUserModel()
        self.chat_model = XiangqiChatModel()
        self.spectator_model = XiangqiSpectatorModel()

    def get_dashboard_stats(self) -> Dict[str, Any]:
        db = get_db()
        total_users = db.fetch_one(f"SELECT COUNT(*) as total FROM {self.user_model.TABLE_NAME}")['total']
        active_users = db.fetch_one(f"SELECT COUNT(*) as total FROM {self.user_model.TABLE_NAME} WHERE status = 0")['total']
        total_games = db.fetch_one(f"SELECT COUNT(*) as total FROM {self.game_model.TABLE_NAME}")['total']
        playing_games = db.fetch_one(f"SELECT COUNT(*) as total FROM {self.game_model.TABLE_NAME} WHERE status = 1")['total']
        pve_games = db.fetch_one(f"SELECT COUNT(*) as total FROM {self.game_model.TABLE_NAME} WHERE game_type = 0")['total']
        pvp_games = db.fetch_one(f"SELECT COUNT(*) as total FROM {self.game_model.TABLE_NAME} WHERE game_type = 1")['total']
        red_wins = db.fetch_one(f"SELECT COUNT(*) as total FROM {self.game_model.TABLE_NAME} WHERE result = 1")['total']
        black_wins = db.fetch_one(f"SELECT COUNT(*) as total FROM {self.game_model.TABLE_NAME} WHERE result = 2")['total']
        draws = db.fetch_one(f"SELECT COUNT(*) as total FROM {self.game_model.TABLE_NAME} WHERE result = 3")['total']
        total_messages = db.fetch_one(f"SELECT COUNT(*) as total FROM {self.chat_model.TABLE_NAME}")['total']
        total_spectators = db.fetch_one(f"SELECT COUNT(*) as total FROM {self.spectator_model.TABLE_NAME} WHERE left_at IS NULL")['total']

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'active_users': active_users,
                'banned_users': total_users - active_users,
                'total_games': total_games,
                'playing_games': playing_games,
                'pve_games': pve_games,
                'pvp_games': pvp_games,
                'red_wins': red_wins,
                'black_wins': black_wins,
                'draws': draws,
                'total_messages': total_messages,
                'spectating_now': total_spectators
            }
        }

    def get_recent_games(self, limit: int = 10) -> Dict[str, Any]:
        db = get_db()
        sql = f"SELECT * FROM {self.game_model.TABLE_NAME} ORDER BY id DESC LIMIT {limit}"
        games = db.fetch_all(sql)
        items = [self.game_model.to_dict(g) for g in games]
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_top_players(self, limit: int = 10) -> Dict[str, Any]:
        users = self.user_model.get_rank_list(limit)
        items = [self.user_model.to_public_dict(u) for u in users]
        for i, item in enumerate(items):
            item['rank'] = i + 1
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_game_type_stats(self) -> Dict[str, Any]:
        db = get_db()
        pve = db.fetch_one(f"SELECT COUNT(*) as total FROM {self.game_model.TABLE_NAME} WHERE game_type = 0")['total']
        pvp = db.fetch_one(f"SELECT COUNT(*) as total FROM {self.game_model.TABLE_NAME} WHERE game_type = 1")['total']
        return {
            'code': 0,
            'msg': 'success',
            'data': [
                {'type': '人机对战', 'count': pve},
                {'type': '在线对战', 'count': pvp}
            ]
        }
