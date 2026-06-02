from typing import Dict, Any, List, Optional
from app.model.saiche_model import RaceRecordModel, TrackModel, UserModel, UserCarModel
from app.business.saiche.achievement_business import SaicheAchievementBusiness


class SaicheRaceBusiness:
    def __init__(self):
        self.race_record_model = RaceRecordModel()
        self.track_model = TrackModel()
        self.user_model = UserModel()
        self.user_car_model = UserCarModel()
        self.achievement_business = SaicheAchievementBusiness()

    def start_race(self, user_id: int, track_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user or user.get('status') == self.user_model.STATUS_BANNED:
            return {
                'code': 1,
                'msg': '用户不存在或已被封禁',
                'data': None
            }

        track = self.track_model.get_by_id(track_id)
        if not track or track.get('is_active') != 1:
            return {
                'code': 1,
                'msg': '赛道不存在或未启用',
                'data': None
            }

        active_car = self.user_car_model.get_active_car(user_id)
        if not active_car:
            return {
                'code': 1,
                'msg': '请先选择一辆赛车',
                'data': None
            }

        return {
            'code': 0,
            'msg': '可以开始比赛',
            'data': {
                'track': self.track_model.to_public_dict(track),
                'car': self.user_car_model.to_public_dict(active_car)
            }
        }

    def finish_race(self, user_id: int, track_id: int, car_id: int,
                    finish_time: float, best_lap: float, rank: int = 1,
                    used_items: List[Dict[str, Any]] = None) -> Dict[str, Any]:
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
                'msg': '赛道不存在',
                'data': None
            }

        user_car = self.user_car_model.get_by_user_and_car(user_id, car_id)
        if not user_car:
            return {
                'code': 1,
                'msg': '用户没有该赛车',
                'data': None
            }

        is_winner = 1 if rank == 1 else 0
        reward_coins = track.get('reward_coins', 100) if is_winner else int(track.get('reward_coins', 100) * 0.5)
        reward_exp = track.get('reward_exp', 50) if is_winner else int(track.get('reward_exp', 50) * 0.5)

        if best_lap <= 0:
            best_lap = finish_time / max(1, track.get('laps', 3))

        record_id = self.race_record_model.create(
            user_id=user_id,
            track_id=track_id,
            car_id=car_id,
            finish_time=finish_time,
            best_lap=best_lap,
            rank=rank,
            is_winner=is_winner,
            reward_coins=reward_coins,
            reward_exp=reward_exp,
            used_items=used_items
        )

        if record_id > 0:
            self.user_model.update_coins(user_id, reward_coins)
            self.user_model.update_exp(user_id, reward_exp)

            achievement_result = self.achievement_business.check_and_unlock_achievements(user_id)

            record = self.race_record_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '比赛完成',
                'data': {
                    'record': self.race_record_model.to_public_dict(record),
                    'reward_coins': reward_coins,
                    'reward_exp': reward_exp,
                    'is_winner': is_winner,
                    'new_achievements': achievement_result.get('data', {}).get('newly_unlocked', [])
                }
            }

        return {
            'code': 1,
            'msg': '保存比赛记录失败',
            'data': None
        }

    def get_race_record(self, record_id: int) -> Dict[str, Any]:
        record = self.race_record_model.get_by_id(record_id)
        if not record:
            return {
                'code': 1,
                'msg': '记录不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.race_record_model.to_public_dict(record)
        }

    def get_user_race_records(self, user_id: int, page: int = 1,
                              page_size: int = 10, track_id: int = None) -> Dict[str, Any]:
        result = self.race_record_model.get_user_records(user_id, page, page_size, track_id)
        items = [self.race_record_model.to_public_dict(item) for item in result.get('items', [])]

        for item in items:
            track = self.track_model.get_by_id(item.get('track_id'))
            if track:
                item['track_name'] = track.get('name')

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

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        stats = self.race_record_model.get_user_stats(user_id)
        consecutive_wins = self.race_record_model.get_consecutive_wins(user_id)
        total_coins_earned = self.race_record_model.get_total_coins_earned(user_id)

        stats['consecutive_wins'] = consecutive_wins
        stats['total_coins_earned'] = total_coins_earned

        if stats.get('total_races', 0) > 0:
            stats['win_rate'] = round(stats.get('win_count', 0) / stats.get('total_races', 1) * 100, 2)
        else:
            stats['win_rate'] = 0

        if stats.get('avg_time', 0) > 0:
            stats['avg_time'] = round(stats.get('avg_time', 0), 2)
        if stats.get('best_time', 0) > 0:
            stats['best_time'] = round(stats.get('best_time', 0), 2)

        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }

    def get_rank_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.user_model.get_rank_list(page, page_size)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_track_best_records(self, track_id: int, limit: int = 10) -> Dict[str, Any]:
        records = self.race_record_model.get_track_best_records(track_id, limit)
        items = [self.race_record_model.to_public_dict(r) for r in records]
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_user_best_record(self, user_id: int, track_id: int) -> Dict[str, Any]:
        record = self.race_record_model.get_best_record(user_id, track_id)
        if not record:
            return {
                'code': 1,
                'msg': '暂无记录',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.race_record_model.to_public_dict(record)
        }
