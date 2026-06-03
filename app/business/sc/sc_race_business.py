from typing import Dict, Any, List, Optional
import random
from datetime import datetime
from app.model.sc import ScRaceModel, ScRaceEntryModel, ScRaceResultModel, ScCarModel, ScUserModel


class ScRaceBusiness:
    def __init__(self):
        self.race_model = ScRaceModel()
        self.race_entry_model = ScRaceEntryModel()
        self.race_result_model = ScRaceResultModel()
        self.car_model = ScCarModel()
        self.user_model = ScUserModel()
        self.BASE_RACE_TIME = 120.0

    def _get_prize_distribution(self, position: int, total_participants: int, prize_pool: int) -> int:
        if position == 1:
            return int(prize_pool * 0.5)
        elif position == 2:
            return int(prize_pool * 0.3)
        elif position == 3:
            return int(prize_pool * 0.15)
        elif position <= 5:
            return int(prize_pool * 0.025)
        else:
            return 0

    def _get_points_distribution(self, position: int, total_participants: int) -> int:
        base_points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
        if position - 1 < len(base_points):
            return base_points[position - 1]
        return 0

    def _calculate_finish_time(self, car: Dict[str, Any], base_time: float) -> float:
        weight = car.get('total_weight', 1000)
        power = car.get('total_power', 500)
        grip = car.get('total_grip', 500)
        aerodynamics = car.get('total_aerodynamics', 500)

        power_ratio = weight / max(power, 1)
        grip_factor = 1 - (grip / 2000) * 0.1
        aero_factor = 1 - (aerodynamics / 2000) * 0.1

        random_factor = random.uniform(-0.05, 0.1)

        finish_time = base_time * (1 + (power_ratio - 0.5) * 0.3 + random_factor) * grip_factor * aero_factor

        return round(finish_time, 3)

    def get_upcoming_races(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 10

        result = self.race_model.get_upcoming(page, page_size)
        races = result.get('items', [])

        for race in races:
            entries = self.race_entry_model.get_by_race_id(race['id'])
            race['entry_count'] = len(entries)
            race['track_type_text'] = self.race_model.get_track_type_text(race.get('track_type', ''))
            race['status_text'] = self.race_model.get_status_text(race.get('status', ''))

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': races,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_race_detail(self, race_id: int) -> Dict[str, Any]:
        if not race_id or race_id <= 0:
            return {
                'code': 1,
                'msg': '比赛ID无效',
                'data': None
            }

        race = self.race_model.get_by_id(race_id)
        if not race:
            return {
                'code': 1,
                'msg': '比赛不存在',
                'data': None
            }

        race['track_type_text'] = self.race_model.get_track_type_text(race.get('track_type', ''))
        race['status_text'] = self.race_model.get_status_text(race.get('status', ''))

        entries = self.race_entry_model.get_by_race_id(race_id)
        entries_detail = []
        for entry in entries:
            user = self.user_model.get_by_id(entry['user_id'])
            car = self.car_model.get_by_id(entry['car_id'])
            if user and car:
                entry_info = {
                    'id': entry['id'],
                    'user_id': entry['user_id'],
                    'username': user.get('username'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar'),
                    'car_id': entry['car_id'],
                    'car_name': car.get('name'),
                    'entry_time': entry['entry_time'],
                    'is_qualified': entry.get('is_qualified', 0),
                    'qualifying_time': entry.get('qualifying_time')
                }
                entries_detail.append(entry_info)

        race['entries'] = entries_detail
        race['entry_count'] = len(entries_detail)

        if race.get('status') == self.race_model.STATUS_COMPLETED:
            results = self.race_result_model.get_by_race_id(race_id)
            results_detail = []
            for result in results:
                user = self.user_model.get_by_id(result['user_id'])
                car = self.car_model.get_by_id(result['car_id'])
                if user and car:
                    result_info = {
                        'id': result['id'],
                        'position': result['position'],
                        'user_id': result['user_id'],
                        'username': user.get('username'),
                        'nickname': user.get('nickname'),
                        'avatar': user.get('avatar'),
                        'car_id': result['car_id'],
                        'car_name': car.get('name'),
                        'finish_time': result['finish_time'],
                        'best_lap': result.get('best_lap'),
                        'points_earned': result.get('points_earned', 0),
                        'coins_earned': result.get('coins_earned', 0)
                    }
                    results_detail.append(result_info)
            race['results'] = results_detail

        return {
            'code': 0,
            'msg': 'success',
            'data': race
        }

    def enter_race(self, user_id: int, race_id: int, car_id: int) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        if not race_id or race_id <= 0:
            return {
                'code': 1,
                'msg': '比赛ID无效',
                'data': None
            }

        if not car_id or car_id <= 0:
            return {
                'code': 1,
                'msg': '车辆ID无效',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        race = self.race_model.get_by_id(race_id)
        if not race:
            return {
                'code': 1,
                'msg': '比赛不存在',
                'data': None
            }

        if race.get('status') != self.race_model.STATUS_UPCOMING:
            return {
                'code': 1,
                'msg': '比赛已开始或已结束，无法报名',
                'data': None
            }

        if user.get('level', 1) < race.get('min_level', 1):
            return {
                'code': 1,
                'msg': f'等级不足，该比赛需要等级 {race.get("min_level", 1)} 及以上',
                'data': None
            }

        entry_fee = race.get('entry_fee', 0)
        if user.get('coins', 0) < entry_fee:
            return {
                'code': 1,
                'msg': f'金币不足，报名费需要 {entry_fee} 金币',
                'data': None
            }

        car = self.car_model.get_by_id(car_id)
        if not car:
            return {
                'code': 1,
                'msg': '车辆不存在',
                'data': None
            }

        if car.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '您无权使用该车辆',
                'data': None
            }

        existing_entry = self.race_entry_model.get_by_race_and_user(race_id, user_id)
        if existing_entry:
            return {
                'code': 1,
                'msg': '您已报名该比赛',
                'data': None
            }

        current_entries = self.race_entry_model.get_by_race_id(race_id)
        if len(current_entries) >= race.get('max_participants', 20):
            return {
                'code': 1,
                'msg': '参赛人数已达上限',
                'data': None
            }

        self.user_model.update_coins(user_id, -entry_fee)

        from app.model.sc import ScTeamMemberModel
        team_member_model = ScTeamMemberModel()
        user_teams = team_member_model.get_by_user_id(user_id)
        team_id = user_teams[0]['team_id'] if user_teams and len(user_teams) > 0 else None

        entry_id = self.race_entry_model.create(race_id, user_id, car_id, team_id)
        if entry_id > 0:
            entry = self.race_entry_model.get_by_id(entry_id)
            return {
                'code': 0,
                'msg': '报名成功',
                'data': entry
            }

        self.user_model.update_coins(user_id, entry_fee)
        return {
            'code': 1,
            'msg': '报名失败',
            'data': None
        }

    def get_race_entries(self, race_id: int) -> Dict[str, Any]:
        if not race_id or race_id <= 0:
            return {
                'code': 1,
                'msg': '比赛ID无效',
                'data': None
            }

        race = self.race_model.get_by_id(race_id)
        if not race:
            return {
                'code': 1,
                'msg': '比赛不存在',
                'data': None
            }

        entries = self.race_entry_model.get_by_race_id(race_id)
        entries_detail = []
        for entry in entries:
            user = self.user_model.get_by_id(entry['user_id'])
            car = self.car_model.get_by_id(entry['car_id'])
            if user and car:
                entry_info = {
                    'id': entry['id'],
                    'user_id': entry['user_id'],
                    'username': user.get('username'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar'),
                    'level': user.get('level', 1),
                    'car_id': entry['car_id'],
                    'car_name': car.get('name'),
                    'car_power': car.get('total_power', 0),
                    'car_weight': car.get('total_weight', 0),
                    'entry_time': entry['entry_time']
                }
                entries_detail.append(entry_info)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': entries_detail,
                'total': len(entries_detail)
            }
        }

    def get_user_races(self, user_id: int) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        entries = self.race_entry_model.get_by_user_id(user_id)
        races = []
        for entry in entries:
            race = self.race_model.get_by_id(entry['race_id'])
            if race:
                car = self.car_model.get_by_id(entry['car_id'])
                result = None
                if race.get('status') == self.race_model.STATUS_COMPLETED:
                    race_results = self.race_result_model.get_by_race_id(race['id'])
                    for r in race_results:
                        if r.get('user_id') == user_id:
                            result = {
                                'position': r.get('position'),
                                'finish_time': r.get('finish_time'),
                                'points_earned': r.get('points_earned', 0),
                                'coins_earned': r.get('coins_earned', 0)
                            }
                            break

                race_info = {
                    'race_id': race['id'],
                    'name': race['name'],
                    'track_type': race.get('track_type', ''),
                    'track_type_text': self.race_model.get_track_type_text(race.get('track_type', '')),
                    'difficulty': race.get('difficulty', 1),
                    'status': race.get('status', ''),
                    'status_text': self.race_model.get_status_text(race.get('status', '')),
                    'race_date': race.get('race_date'),
                    'car_name': car.get('name') if car else '',
                    'entry_time': entry['entry_time'],
                    'result': result
                }
                races.append(race_info)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': races,
                'total': len(races)
            }
        }

    def simulate_race(self, race_id: int) -> Dict[str, Any]:
        if not race_id or race_id <= 0:
            return {
                'code': 1,
                'msg': '比赛ID无效',
                'data': None
            }

        race = self.race_model.get_by_id(race_id)
        if not race:
            return {
                'code': 1,
                'msg': '比赛不存在',
                'data': None
            }

        if race.get('status') == self.race_model.STATUS_COMPLETED:
            return {
                'code': 1,
                'msg': '比赛已结束',
                'data': None
            }

        entries = self.race_entry_model.get_by_race_id(race_id)
        if len(entries) < 2:
            return {
                'code': 1,
                'msg': '参赛人数不足，至少需要2人才能开始比赛',
                'data': None
            }

        self.race_model.update_status(race_id, self.race_model.STATUS_ONGOING)

        base_time = self.BASE_RACE_TIME * (1 + (race.get('difficulty', 1) - 1) * 0.1)

        race_results = []
        for entry in entries:
            car = self.car_model.get_by_id(entry['car_id'])
            if not car:
                continue

            finish_time = self._calculate_finish_time(car, base_time)
            best_lap = round(finish_time * random.uniform(0.9, 0.98), 3)

            race_results.append({
                'entry': entry,
                'car': car,
                'finish_time': finish_time,
                'best_lap': best_lap
            })

        race_results.sort(key=lambda x: x['finish_time'])

        prize_pool = race.get('prize_pool', 0)
        total_participants = len(race_results)

        created_results = []
        for idx, result in enumerate(race_results):
            position = idx + 1
            entry = result['entry']
            car = result['car']

            coins_earned = self._get_prize_distribution(position, total_participants, prize_pool)
            points_earned = self._get_points_distribution(position, total_participants)

            result_id = self.race_result_model.create(
                race_id=race_id,
                user_id=entry['user_id'],
                car_id=entry['car_id'],
                team_id=entry.get('team_id'),
                position=position,
                finish_time=result['finish_time'],
                best_lap=result['best_lap'],
                points_earned=points_earned,
                coins_earned=coins_earned,
                race_date=datetime.now().isoformat()
            )

            if result_id > 0:
                self.user_model.update_coins(entry['user_id'], coins_earned)
                self.user_model.update_experience(entry['user_id'], points_earned * 10)

                created_result = self.race_result_model.get_by_id(result_id)
                user = self.user_model.get_by_id(entry['user_id'])
                if created_result and user:
                    created_result['username'] = user.get('username')
                    created_result['nickname'] = user.get('nickname')
                    created_result['car_name'] = car.get('name')
                    created_results.append(created_result)

        self.race_model.update_status(race_id, self.race_model.STATUS_COMPLETED)

        return {
            'code': 0,
            'msg': '比赛模拟完成',
            'data': {
                'race_id': race_id,
                'race_name': race['name'],
                'total_participants': total_participants,
                'results': created_results
            }
        }

    def get_race_results(self, race_id: int) -> Dict[str, Any]:
        if not race_id or race_id <= 0:
            return {
                'code': 1,
                'msg': '比赛ID无效',
                'data': None
            }

        race = self.race_model.get_by_id(race_id)
        if not race:
            return {
                'code': 1,
                'msg': '比赛不存在',
                'data': None
            }

        results = self.race_result_model.get_by_race_id(race_id)
        results_detail = []
        for result in results:
            user = self.user_model.get_by_id(result['user_id'])
            car = self.car_model.get_by_id(result['car_id'])
            if user and car:
                result_info = {
                    'id': result['id'],
                    'position': result['position'],
                    'user_id': result['user_id'],
                    'username': user.get('username'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar'),
                    'level': user.get('level', 1),
                    'car_id': result['car_id'],
                    'car_name': car.get('name'),
                    'finish_time': result['finish_time'],
                    'best_lap': result.get('best_lap'),
                    'points_earned': result.get('points_earned', 0),
                    'coins_earned': result.get('coins_earned', 0)
                }
                results_detail.append(result_info)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': results_detail,
                'total': len(results_detail),
                'race_name': race.get('name'),
                'track_type': race.get('track_type'),
                'track_type_text': self.race_model.get_track_type_text(race.get('track_type', '')),
                'difficulty': race.get('difficulty', 1)
            }
        }

    def get_user_results(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 10

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        all_results = self.race_result_model.get_by_user_id(user_id)

        total = len(all_results)
        total_pages = (total + page_size - 1) // page_size
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_results = all_results[start_idx:end_idx]

        results_detail = []
        for result in paginated_results:
            race = self.race_model.get_by_id(result['race_id'])
            car = self.car_model.get_by_id(result['car_id'])
            if race and car:
                result_info = {
                    'id': result['id'],
                    'race_id': result['race_id'],
                    'race_name': race.get('name'),
                    'track_type': race.get('track_type'),
                    'track_type_text': self.race_model.get_track_type_text(race.get('track_type', '')),
                    'difficulty': race.get('difficulty', 1),
                    'position': result['position'],
                    'car_id': result['car_id'],
                    'car_name': car.get('name'),
                    'finish_time': result['finish_time'],
                    'best_lap': result.get('best_lap'),
                    'points_earned': result.get('points_earned', 0),
                    'coins_earned': result.get('coins_earned', 0),
                    'race_date': result.get('race_date')
                }
                results_detail.append(result_info)

        total_points = sum(r.get('points_earned', 0) for r in all_results)
        total_coins = sum(r.get('coins_earned', 0) for r in all_results)
        wins = sum(1 for r in all_results if r.get('position') == 1)
        podiums = sum(1 for r in all_results if r.get('position', 0) <= 3)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': results_detail,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': total_pages,
                'stats': {
                    'total_races': total,
                    'total_points': total_points,
                    'total_coins': total_coins,
                    'wins': wins,
                    'podiums': podiums,
                    'win_rate': round(wins / total * 100, 2) if total > 0 else 0,
                    'podium_rate': round(podiums / total * 100, 2) if total > 0 else 0
                }
            }
        }
