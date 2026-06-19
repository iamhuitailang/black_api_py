from typing import Dict, Any, List
from app.model.game import GameRecordModel


class GameBusiness:
    def __init__(self):
        self.game_record_model = GameRecordModel()

    def submit_record(self, player_name: str, clear_time: float, specimen_count: int = 0, area_cleared: int = 0) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 400,
                'message': '玩家名称不能为空',
                'data': None
            }
        if clear_time <= 0:
            return {
                'code': 400,
                'message': '通关时间必须大于0',
                'data': None
            }

        record_id = self.game_record_model.create(
            player_name=player_name.strip(),
            clear_time=clear_time,
            specimen_count=specimen_count,
            area_cleared=area_cleared
        )

        return {
            'code': 0,
            'message': '记录提交成功',
            'data': {
                'id': record_id,
                'player_name': player_name.strip(),
                'clear_time': clear_time,
                'specimen_count': specimen_count,
                'area_cleared': area_cleared
            }
        }

    def get_leaderboard_time(self, limit: int = 10) -> Dict[str, Any]:
        records = self.game_record_model.get_fastest(limit=limit)
        return {
            'code': 0,
            'message': 'success',
            'data': records
        }

    def get_leaderboard_specimens(self, limit: int = 10) -> Dict[str, Any]:
        records = self.game_record_model.get_most_specimens(limit=limit)
        return {
            'code': 0,
            'message': 'success',
            'data': records
        }

    def get_all_records(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.game_record_model.paginate(page=page, page_size=page_size, order_by='clear_time ASC')
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_record(self, record_id: int) -> Dict[str, Any]:
        record = self.game_record_model.get_by_id(record_id)
        if not record:
            return {
                'code': 404,
                'message': '记录不存在',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': record
        }
