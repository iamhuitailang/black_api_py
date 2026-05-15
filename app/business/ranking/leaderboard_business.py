from typing import Dict, Any, List, Optional
from app.model.ranking import LeaderboardConfigModel, ScoreRecordModel


class LeaderboardBusiness:
    def __init__(self):
        self.config_model = LeaderboardConfigModel()
        self.score_model = ScoreRecordModel()

    def get_leaderboards_by_game(self, game_type: str) -> Dict[str, Any]:
        leaderboards = self.config_model.get_by_game_type(game_type)
        return {
            'code': 0,
            'msg': 'success',
            'data': leaderboards
        }

    def get_leaderboard_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.config_model.get_all(page, page_size)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def create_leaderboard(self, game_type: str, name: str, period: str,
                           reset_time: str = '00:00:00', sort_order: str = 'desc') -> Dict[str, Any]:
        valid_periods = ['daily', 'weekly', 'monthly', 'all']
        if period not in valid_periods:
            return {
                'code': 1,
                'msg': '无效的周期类型',
                'data': None
            }

        if sort_order not in ['desc', 'asc']:
            return {
                'code': 1,
                'msg': '无效的排序方式',
                'data': None
            }

        existing = self.config_model.get_by_game_and_period(game_type, period)
        if existing:
            return {
                'code': 1,
                'msg': '该游戏类型的对应周期排行榜已存在',
                'data': None
            }

        record_id = self.config_model.create(game_type, name, period, reset_time, sort_order)
        if record_id > 0:
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.config_model.get_by_id(record_id)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_leaderboard(self, record_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        leaderboard = self.config_model.get_by_id(record_id)
        if not leaderboard:
            return {
                'code': 1,
                'msg': '排行榜不存在',
                'data': None
            }

        affected = self.config_model.update(record_id, data)
        if affected >= 0:
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.config_model.get_by_id(record_id)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_leaderboard(self, record_id: int) -> Dict[str, Any]:
        leaderboard = self.config_model.get_by_id(record_id)
        if not leaderboard:
            return {
                'code': 1,
                'msg': '排行榜不存在',
                'data': None
            }

        affected = self.config_model.delete(record_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }
