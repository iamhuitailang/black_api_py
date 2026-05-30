from typing import Dict, Any, List
from app.model.chouchou_model import ThemeModel


class ThemeBusiness:
    def __init__(self):
        self.theme_model = ThemeModel()

    def get_user_themes(self, user_id: int) -> Dict[str, Any]:
        themes = self.theme_model.get_by_user(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.theme_model.to_dict(t) for t in themes]
        }

    def get_current_theme(self, user_id: int) -> Dict[str, Any]:
        theme = self.theme_model.get_current_theme(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': self.theme_model.to_dict(theme)
        }

    def set_current_theme(self, user_id: int, theme_code: str) -> Dict[str, Any]:
        if not self.theme_model.is_unlocked(user_id, theme_code):
            return {
                'code': 1,
                'msg': '主题未解锁',
                'data': None
            }

        success = self.theme_model.set_current_theme(user_id, theme_code)
        if success:
            theme = self.theme_model.get_current_theme(user_id)
            return {
                'code': 0,
                'msg': '切换成功',
                'data': self.theme_model.to_dict(theme)
            }

        return {
            'code': 1,
            'msg': '切换失败',
            'data': None
        }

    def unlock_theme(self, user_id: int, theme_code: str) -> Dict[str, Any]:
        affected = self.theme_model.unlock_theme(user_id, theme_code)
        if affected > 0:
            return {
                'code': 0,
                'msg': '解锁成功',
                'data': None
            }
        return {
            'code': 1,
            'msg': '解锁失败',
            'data': None
        }

    def get_all_themes(self) -> Dict[str, Any]:
        themes = self.theme_model.get_all_themes()
        return {
            'code': 0,
            'msg': 'success',
            'data': themes
        }

    def is_unlocked(self, user_id: int, theme_code: str) -> bool:
        return self.theme_model.is_unlocked(user_id, theme_code)
