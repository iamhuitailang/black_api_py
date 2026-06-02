import json
from typing import Dict, Any, List
from app.model.huangjin_model import HuangjinUserModel, GameRecordModel, OreModel


class GameBusiness:
    def __init__(self):
        self.user_model = HuangjinUserModel()
        self.game_record_model = GameRecordModel()
        self.ore_model = OreModel()

    def start_game(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if user.get('status') == self.user_model.STATUS_BANNED:
            return {
                'code': 1,
                'msg': '账号已被封号',
                'data': None
            }

        ores = self.ore_model.get_enabled()
        ore_list = [self.ore_model.to_dict(ore) for ore in ores]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'ores': ore_list,
                'duration': 60,
                'user': self.user_model.to_public_dict(user)
            }
        }

    def submit_game(self, user_id: int, score: int, duration: int = 60,
                    ores_collected: List[Dict] = None) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        ores_json = json.dumps(ores_collected or [], ensure_ascii=False)
        ore_count = len(ores_collected) if ores_collected else 0

        record_id = self.game_record_model.create(
            user_id=user_id,
            score=score,
            duration=duration,
            ores_collected=ores_json,
            ore_count=ore_count
        )

        if record_id > 0:
            self.user_model.update_score(user_id, score)

            from app.business.huangjin_model.achievement_business import AchievementBusiness
            achievement_business = AchievementBusiness()
            new_achievements = achievement_business.check_achievements(
                user_id, score, ore_count
            )

            updated_user = self.user_model.get_by_id(user_id)
            record = self.game_record_model.get_by_id(record_id)

            return {
                'code': 0,
                'msg': '游戏结束',
                'data': {
                    'record': self.game_record_model.to_dict(record),
                    'user': self.user_model.to_public_dict(updated_user),
                    'new_achievements': new_achievements
                }
            }

        return {
            'code': 1,
            'msg': '提交游戏记录失败',
            'data': None
        }

    def get_game_records(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.game_record_model.get_by_user(user_id, page, page_size)
        items = [self.game_record_model.to_dict(item) for item in result.get('items', [])]
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

    def get_all_records(self, page: int = 1, page_size: int = 10,
                        user_id: int = None) -> Dict[str, Any]:
        result = self.game_record_model.get_all(page, page_size, user_id)
        items = [self.game_record_model.to_dict(item) for item in result.get('items', [])]
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

    def get_leaderboard(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.user_model.get_leaderboard(page, page_size)
        items = []
        for idx, item in enumerate(result.get('items', [])):
            rank = (page - 1) * page_size + idx + 1
            item_data = {
                'rank': rank,
                'id': item.get('id'),
                'username': item.get('username'),
                'nickname': item.get('nickname'),
                'avatar': item.get('avatar'),
                'total_score': item.get('total_score'),
                'best_score': item.get('best_score'),
                'total_games': item.get('total_games')
            }
            items.append(item_data)

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
