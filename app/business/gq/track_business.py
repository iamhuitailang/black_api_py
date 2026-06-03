from typing import Dict, Any
from app.model.gq_model import GqTrackModel, GqUserProgressModel, GqUserModel


class GqTrackBusiness:
    def __init__(self):
        self.track_model = GqTrackModel()
        self.user_progress_model = GqUserProgressModel()
        self.user_model = GqUserModel()

    def get_track_list(self, page: int = 1, page_size: int = 10,
                       difficulty: int = None, category: str = None,
                       keyword: str = None) -> Dict[str, Any]:
        result = self.track_model.get_all(page, page_size, difficulty, category, keyword)
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

    def get_track_detail(self, track_id: int) -> Dict[str, Any]:
        track = self.track_model.get_by_id(track_id)
        if not track:
            return {
                'code': 1,
                'msg': '曲目不存在',
                'data': None
            }
        return {
            'code': 0,
            'msg': 'success',
            'data': track
        }

    def get_user_tracks(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        tracks = self.track_model.get_all(page=1, page_size=9999)
        track_list = tracks.get('items', [])
        user_progress_list = self.user_progress_model.get_user_progress(user_id)
        progress_map = {p['track_id']: p for p in user_progress_list}

        merged = []
        for track in track_list:
            item = dict(track)
            progress = progress_map.get(track['id'])
            if progress:
                item['is_unlocked'] = progress.get('is_unlocked', 0)
                item['best_score'] = progress.get('best_score', 0)
                item['best_stars'] = progress.get('best_stars', 0)
                item['play_count'] = progress.get('play_count', 0)
            else:
                item['is_unlocked'] = 0
                item['best_score'] = 0
                item['best_stars'] = 0
                item['play_count'] = 0
            merged.append(item)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': merged,
                'total': len(merged)
            }
        }

    def unlock_track(self, user_id: int, track_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        track = self.track_model.get_by_id(track_id)
        if not track:
            return {
                'code': 1,
                'msg': '曲目不存在',
                'data': None
            }

        existing = self.user_progress_model.get_by_user_and_track(user_id, track_id)
        if existing and existing.get('is_unlocked') == 1:
            return {
                'code': 1,
                'msg': '曲目已解锁',
                'data': None
            }

        if user.get('level', 1) < track.get('unlock_level', 1):
            return {
                'code': 1,
                'msg': f'等级不足，需要等级{track.get("unlock_level")}',
                'data': None
            }

        unlock_coins = track.get('unlock_coins', 0)
        if unlock_coins > 0 and user.get('coins', 0) < unlock_coins:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': None
            }

        if unlock_coins > 0:
            self.user_model.update_currency(user_id, -unlock_coins, 0)

        if existing:
            self.user_progress_model.unlock_track(user_id, track_id)
        else:
            self.user_progress_model.create(user_id, track_id, is_unlocked=1)

        updated_user = self.user_model.get_by_id(user_id)
        return {
            'code': 0,
            'msg': '解锁成功',
            'data': {
                'track_id': track_id,
                'user': self.user_model.to_public_dict(updated_user)
            }
        }

    def create_track(self, title: str, description: str = '', difficulty: int = 1,
                     notes: str = '[]', bpm: int = 120, duration: int = 0,
                     unlock_level: int = 1, unlock_coins: int = 0,
                     cover: str = '', category: str = 'classic') -> Dict[str, Any]:
        if not title:
            return {
                'code': 1,
                'msg': '曲目名称不能为空',
                'data': None
            }

        track_id = self.track_model.create(
            title=title, description=description, difficulty=difficulty,
            notes=notes, bpm=bpm, duration=duration,
            unlock_level=unlock_level, unlock_coins=unlock_coins,
            cover=cover, category=category
        )
        if track_id > 0:
            track = self.track_model.get_by_id(track_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': track
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_track(self, track_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        track = self.track_model.get_by_id(track_id)
        if not track:
            return {
                'code': 1,
                'msg': '曲目不存在',
                'data': None
            }

        affected = self.track_model.update(track_id, data)
        if affected >= 0:
            updated_track = self.track_model.get_by_id(track_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': updated_track
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }
