from typing import Dict, Any
from app.model.yp_model import (
    GameStateModel, UserModel, UserCharacterModel,
    UserSkillModel, MusicModel
)


class YpGameBusiness:
    def __init__(self):
        self.game_state_model = GameStateModel()
        self.user_model = UserModel()
        self.user_character_model = UserCharacterModel()
        self.user_skill_model = UserSkillModel()
        self.music_model = MusicModel()

    def get_game_state(self, user_id: int) -> Dict[str, Any]:
        state = self.game_state_model.get_by_user_id(user_id)
        if not state:
            self.game_state_model.create(user_id)
            state = self.game_state_model.get_by_user_id(user_id)

        if not state:
            return {
                'code': 1,
                'msg': '获取状态失败',
                'data': None
            }

        state_dict = self.game_state_model.to_public_dict(state)

        using_char = self.user_character_model.get_using_character(user_id)
        if using_char:
            state_dict['current_character'] = self.user_character_model.to_public_dict(using_char)

        current_music_id = state.get('current_music_id', 0)
        if current_music_id > 0:
            music = self.music_model.get_by_id(current_music_id)
            if music:
                state_dict['current_music'] = self.music_model.to_public_dict(music)

        skill_effects = self.user_skill_model.get_skill_effects(user_id)
        state_dict['skill_effects'] = skill_effects

        return {
            'code': 0,
            'msg': 'success',
            'data': state_dict
        }

    def update_current_music(self, user_id: int, music_id: int) -> Dict[str, Any]:
        music = self.music_model.get_by_id(music_id)
        if not music or music.get('is_active') == 0:
            return {
                'code': 1,
                'msg': '音乐不存在或已下架',
                'data': None
            }

        affected = self.game_state_model.update_music(user_id, music_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '更新成功',
                'data': {'music_id': music_id}
            }
        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def update_current_character(self, user_id: int, character_id: int) -> Dict[str, Any]:
        if not self.user_character_model.owns_character(user_id, character_id):
            return {
                'code': 1,
                'msg': '尚未拥有该角色',
                'data': None
            }

        affected = self.game_state_model.update_character(user_id, character_id)
        if affected > 0:
            self.user_character_model.set_using_character(user_id, character_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': {'character_id': character_id}
            }
        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def update_settings(self, user_id: int, settings: Dict[str, Any]) -> Dict[str, Any]:
        valid_settings = {
            'sound_volume', 'music_volume', 'vibration',
            'auto_play', 'difficulty'
        }
        filtered_settings = {k: v for k, v in settings.items() if k in valid_settings}

        affected = self.game_state_model.update_settings(user_id, filtered_settings)
        if affected > 0:
            state = self.game_state_model.get_by_user_id(user_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.game_state_model.to_public_dict(state) if state else None
            }
        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def get_game_bonus(self, user_id: int) -> Dict[str, Any]:
        using_char = self.user_character_model.get_using_character(user_id)
        skill_effects = self.user_skill_model.get_skill_effects(user_id)

        speed_multiplier = 1.0
        jump_multiplier = 1.0
        score_multiplier = 1.0
        magnet_range = 0
        beat_window_bonus = 0
        shield_duration = 0
        revive_count = 0

        if using_char:
            speed_multiplier *= using_char.get('speed_bonus', 1.0)
            jump_multiplier *= using_char.get('jump_bonus', 1.0)
            score_multiplier *= using_char.get('score_bonus', 1.0)

        speed_multiplier *= (1 + skill_effects.get('speed_multiplier', 0))
        jump_multiplier *= (1 + skill_effects.get('jump_multiplier', 0))
        score_multiplier *= (1 + skill_effects.get('score_multiplier', 0))
        magnet_range = skill_effects.get('magnet_range', 0)
        beat_window_bonus = skill_effects.get('beat_window', 0)
        shield_duration = skill_effects.get('shield_duration', 0)
        revive_count = int(skill_effects.get('revive_count', 0))

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'speed_multiplier': round(speed_multiplier, 3),
                'jump_multiplier': round(jump_multiplier, 3),
                'score_multiplier': round(score_multiplier, 3),
                'magnet_range': int(magnet_range),
                'beat_window_bonus': round(beat_window_bonus, 3),
                'shield_duration': int(shield_duration),
                'revive_count': revive_count
            }
        }

    def update_last_play_time(self, user_id: int) -> Dict[str, Any]:
        affected = self.game_state_model.update_last_play_time(user_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': 'success',
                'data': None
            }
        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }
