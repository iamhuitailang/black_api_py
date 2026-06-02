from typing import Dict, Any, List, Optional
from app.model.majiang_model import GameRecordModel, UserModel, AiModel


class MajiangStatisticsBusiness:
    def __init__(self):
        self.game_record_model = GameRecordModel()
        self.user_model = UserModel()
        self.ai_model = AiModel()

    def get_overall_statistics(self) -> Dict[str, Any]:
        user_stats = self.game_record_model.get_statistics()

        total_users = self.user_model.get_all(page_size=1).get('total', 0)
        active_users = self.user_model.get_all(status=0, page_size=1).get('total', 0)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'active_users': active_users,
                'total_games': user_stats.get('total_games', 0),
                'total_wins': user_stats.get('wins', 0),
                'total_losses': user_stats.get('losses', 0),
                'win_rate': user_stats.get('win_rate', 0),
                'max_fan': user_stats.get('max_fan', 0),
                'avg_fan': user_stats.get('avg_fan', 0)
            }
        }

    def get_user_statistics(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        game_stats = self.game_record_model.get_statistics(user_id)
        recent_games = self.game_record_model.get_user_recent_games(user_id, limit=10)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'user': {
                    'id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'username': user.get('username'),
                    'level': user.get('level'),
                    'coins': user.get('coins'),
                    'experience': user.get('experience')
                },
                'game_stats': game_stats,
                'recent_games': recent_games,
                'max_fan': user.get('max_fan', 0)
            }
        }

    def get_daily_statistics(self, days: int = 7) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_games,
                SUM(CASE WHEN winner_type = 'user' THEN 1 ELSE 0 END) as user_wins,
                AVG(fan) as avg_fan,
                MAX(fan) as max_fan
            FROM {self.game_record_model.TABLE_NAME}
            WHERE status = 1 AND created_at >= date('now', '-{days} days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        """
        records = self.game_record_model.db.fetch_all(sql)

        return {
            'code': 0,
            'msg': 'success',
            'data': records
        }

    def get_difficulty_distribution(self) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                difficulty,
                COUNT(*) as count,
                SUM(CASE WHEN winner_type = 'user' THEN 1 ELSE 0 END) as user_wins,
                ROUND(SUM(CASE WHEN winner_type = 'user' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as win_rate
            FROM {self.game_record_model.TABLE_NAME}
            WHERE status = 1
            GROUP BY difficulty
            ORDER BY difficulty
        """
        records = self.game_record_model.db.fetch_all(sql)

        for r in records:
            if r['difficulty'] == 1:
                r['difficulty_text'] = '简单'
            elif r['difficulty'] == 2:
                r['difficulty_text'] = '中等'
            elif r['difficulty'] == 3:
                r['difficulty_text'] = '困难'

        return {
            'code': 0,
            'msg': 'success',
            'data': records
        }

    def get_top_players_statistics(self, limit: int = 10) -> Dict[str, Any]:
        players = self.user_model.get_top_players(limit=limit)
        result = []
        for p in players:
            result.append({
                'rank': len(result) + 1,
                'user_id': p.get('id'),
                'nickname': p.get('nickname'),
                'username': p.get('username'),
                'level': p.get('level'),
                'coins': p.get('coins'),
                'wins': p.get('wins'),
                'total_games': p.get('total_games'),
                'max_fan': p.get('max_fan'),
                'win_rate': round(p.get('wins', 0) / max(1, p.get('total_games', 1)) * 100, 2)
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_ai_statistics(self) -> Dict[str, Any]:
        ais = self.ai_model.get_all_active()
        result = []
        for ai in ais:
            result.append({
                'ai_id': ai.get('id'),
                'name': ai.get('name'),
                'difficulty': ai.get('difficulty'),
                'difficulty_text': self.ai_model.get_difficulty_text(ai.get('difficulty')),
                'total_games': ai.get('total_games'),
                'win_rate': ai.get('win_rate')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }
