from typing import Dict, Any
from app.model.lianliankan077 import LlkGameRecordModel, LlkUserModel


class LlkGameBusiness:
    def __init__(self):
        self.record_model = LlkGameRecordModel()
        self.user_model = LlkUserModel()

    def save_record(self, user_id: int, theme_id: int, score: int = 0, duration: int = 0,
                    combo: int = 0, max_combo: int = 0, pairs_cleared: int = 0,
                    hints_used: int = 0, props_used: int = 0, is_completed: int = 0) -> Dict[str, Any]:
        record_id = self.record_model.create(
            user_id=user_id,
            theme_id=theme_id,
            score=score,
            duration=duration,
            combo=combo,
            max_combo=max_combo,
            pairs_cleared=pairs_cleared,
            hints_used=hints_used,
            props_used=props_used,
            is_completed=is_completed
        )

        if record_id > 0:
            self.user_model.update_score(user_id, score)

            record = self.record_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '保存成功',
                'data': self.record_model.to_dict(record)
            }

        return {
            'code': 1,
            'msg': '保存失败',
            'data': None
        }

    def get_user_records(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.record_model.get_user_records(user_id, page, page_size)
        items = [self.record_model.to_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_leaderboard(self, theme_id: int = None, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        records = self.record_model.get_leaderboard(theme_id, page, page_size)

        return {
            'code': 0,
            'msg': 'success',
            'data': records
        }

    def get_score_leaderboard(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.user_model.get_leaderboard(page, page_size)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': result.get('items', []),
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_statistics(self) -> Dict[str, Any]:
        stats = self.record_model.get_statistics()

        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }
