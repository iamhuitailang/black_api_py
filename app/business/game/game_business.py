from typing import Dict, Any, Optional, List
from app.model.game import LevelModel, KnifeSkinModel, PlayerProgressModel
from app.business.auth import AuthBusiness


class GameBusiness:
    def __init__(self):
        self.level_model = LevelModel()
        self.skin_model = KnifeSkinModel()
        self.progress_model = PlayerProgressModel()
        self.auth_business = AuthBusiness()

    def _get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.auth_business.verify_token(token)

    def get_level_config(self, level_num: int, token: str = '') -> Dict[str, Any]:
        if token:
            user = self._get_user_from_token(token)
            if user:
                progress = self.progress_model.get_or_create(user.get('id'))
                current_level = progress.get('current_level', 1)
                if level_num > current_level:
                    return {
                        'code': 1,
                        'message': f'关卡未解锁，当前最高可玩关卡为 {current_level}',
                        'data': None
                    }

        level = self.level_model.get_by_level(level_num)
        if not level:
            return {
                'code': 1,
                'message': '关卡不存在',
                'data': None
            }

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'level_num': level.get('level_num'),
                'target_speed': level.get('target_speed'),
                'target_radius': level.get('target_radius'),
                'knife_count': level.get('knife_count'),
                'direction_change': level.get('direction_change') == 1
            }
        }

    def get_all_levels(self) -> Dict[str, Any]:
        levels = self.level_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': [
                {
                    'level_num': l.get('level_num'),
                    'target_speed': l.get('target_speed'),
                    'target_radius': l.get('target_radius'),
                    'knife_count': l.get('knife_count'),
                    'direction_change': l.get('direction_change') == 1
                }
                for l in levels
            ]
        }

    def get_player_progress(self, token: str) -> Dict[str, Any]:
        user = self._get_user_from_token(token)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }

        progress = self.progress_model.get_or_create(user.get('id'))
        unlocked_skins = self.skin_model.get_unlocked_skins(progress.get('max_unlocked_level', 1))
        current_skin = self.skin_model.get_by_key(progress.get('current_skin', 'default'))

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'current_level': progress.get('current_level'),
                'max_unlocked_level': progress.get('max_unlocked_level'),
                'total_knives_thrown': progress.get('total_knives_thrown'),
                'total_success': progress.get('total_success'),
                'current_skin': current_skin,
                'unlocked_skins': unlocked_skins
            }
        }

    def complete_level(self, token: str, level_num: int) -> Dict[str, Any]:
        user = self._get_user_from_token(token)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }

        user_id = user.get('id')
        progress = self.progress_model.get_or_create(user_id)
        current_max = progress.get('max_unlocked_level', 1)

        if level_num >= current_max:
            new_level = level_num + 1
            self.progress_model.level_up(user_id, new_level)
        else:
            self.progress_model.update_by_user_id(user_id, {'current_level': level_num + 1})

        self.progress_model.increment_stats(user_id, True)

        new_progress = self.progress_model.get_by_user_id(user_id)
        newly_unlocked_skins = []
        if level_num + 1 > current_max:
            all_skins = self.skin_model.get_all()
            for skin in all_skins:
                unlock_level = skin.get('unlock_level', 1)
                if current_max < unlock_level <= level_num + 1:
                    newly_unlocked_skins.append(skin)

        return {
            'code': 0,
            'message': '关卡完成',
            'data': {
                'next_level': new_progress.get('current_level'),
                'max_unlocked_level': new_progress.get('max_unlocked_level'),
                'newly_unlocked_skins': newly_unlocked_skins
            }
        }

    def fail_level(self, token: str) -> Dict[str, Any]:
        user = self._get_user_from_token(token)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }

        self.progress_model.increment_stats(user.get('id'), False)
        return {
            'code': 0,
            'message': '已记录',
            'data': None
        }

    def get_all_skins(self, token: str = '') -> Dict[str, Any]:
        skins = self.skin_model.get_all()
        result = []
        max_unlocked = 1

        if token:
            user = self._get_user_from_token(token)
            if user:
                progress = self.progress_model.get_or_create(user.get('id'))
                max_unlocked = progress.get('max_unlocked_level', 1)

        for skin in skins:
            skin_data = {
                'skin_key': skin.get('skin_key'),
                'skin_name': skin.get('skin_name'),
                'description': skin.get('description'),
                'unlock_level': skin.get('unlock_level'),
                'color_primary': skin.get('color_primary'),
                'color_secondary': skin.get('color_secondary'),
                'effect_type': skin.get('effect_type'),
                'unlocked': max_unlocked >= skin.get('unlock_level', 1)
            }
            result.append(skin_data)

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def select_skin(self, token: str, skin_key: str) -> Dict[str, Any]:
        user = self._get_user_from_token(token)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }

        skin = self.skin_model.get_by_key(skin_key)
        if not skin:
            return {
                'code': 1,
                'message': '皮肤不存在',
                'data': None
            }

        progress = self.progress_model.get_or_create(user.get('id'))
        max_level = progress.get('max_unlocked_level', 1)
        if max_level < skin.get('unlock_level', 1):
            return {
                'code': 1,
                'message': f'皮肤未解锁，需要通关第 {skin.get("unlock_level")} 关',
                'data': None
            }

        self.progress_model.change_skin(user.get('id'), skin_key)
        return {
            'code': 0,
            'message': '皮肤切换成功',
            'data': skin
        }

    def select_level(self, token: str, level_num: int) -> Dict[str, Any]:
        user = self._get_user_from_token(token)
        if not user:
            return {
                'code': 1,
                'message': '请先登录',
                'data': None
            }

        progress = self.progress_model.get_or_create(user.get('id'))
        max_level = progress.get('max_unlocked_level', 1)
        if level_num > max_level:
            return {
                'code': 1,
                'message': f'关卡未解锁，当前最高可玩关卡为 {max_level}',
                'data': None
            }

        self.progress_model.update_by_user_id(user.get('id'), {'current_level': level_num})
        return self.get_level_config(level_num, token)
