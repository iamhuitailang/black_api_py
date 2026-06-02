from typing import Dict, Any, List, Optional
from app.model.saiche_model import TrackModel


class SaicheTrackBusiness:
    def __init__(self):
        self.track_model = TrackModel()

    def get_track_list(self, page: int = 1, page_size: int = 10,
                       difficulty: int = None, is_active: int = 1) -> Dict[str, Any]:
        result = self.track_model.get_all(page, page_size, is_active, difficulty)
        items = [self.track_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_track_detail(self, track_id: int) -> Dict[str, Any]:
        track = self.track_model.get_by_id(track_id)
        if not track:
            return {
                'code': 1,
                'msg': '赛道不存在',
                'data': None
            }

        track_dict = self.track_model.to_public_dict(track)
        best_records = self.track_model.get_best_records(track_id, 10)
        track_dict['best_records'] = best_records

        return {
            'code': 0,
            'msg': 'success',
            'data': track_dict
        }

    def add_track(self, data: Dict[str, Any]) -> Dict[str, Any]:
        required_fields = ['name', 'track_data']
        for field in required_fields:
            if field not in data:
                return {
                    'code': 1,
                    'msg': f'缺少必填字段: {field}',
                    'data': None
                }

        track_id = self.track_model.create(data)
        if track_id > 0:
            track = self.track_model.get_by_id(track_id)
            return {
                'code': 0,
                'msg': '添加成功',
                'data': self.track_model.to_public_dict(track)
            }

        return {
            'code': 1,
            'msg': '添加失败',
            'data': None
        }

    def update_track(self, track_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        track = self.track_model.get_by_id(track_id)
        if not track:
            return {
                'code': 1,
                'msg': '赛道不存在',
                'data': None
            }

        affected = self.track_model.update(track_id, data)
        if affected > 0:
            updated_track = self.track_model.get_by_id(track_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.track_model.to_public_dict(updated_track)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_track(self, track_id: int) -> Dict[str, Any]:
        track = self.track_model.get_by_id(track_id)
        if not track:
            return {
                'code': 1,
                'msg': '赛道不存在',
                'data': None
            }

        affected = self.track_model.delete(track_id)
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

    def get_best_records(self, track_id: int, limit: int = 10) -> Dict[str, Any]:
        records = self.track_model.get_best_records(track_id, limit)
        return {
            'code': 0,
            'msg': 'success',
            'data': records
        }
