from ..models import ThemeModel


class ThemeBusiness:
    @staticmethod
    def get_all_themes():
        themes = ThemeModel.get_all()
        return {"code": 0, "msg": "获取成功", "data": {"themes": themes}}

    @staticmethod
    def get_theme(type):
        theme = ThemeModel.get_by_type(type)
        if not theme:
            return {"code": 1, "msg": "主题不存在", "data": None}
        return {"code": 0, "msg": "获取成功", "data": {"theme": theme}}

    @staticmethod
    def create_theme(name, type, bg_color="", accent_color="", text_color="", config=""):
        existing = ThemeModel.get_by_type(type)
        if existing:
            return {"code": 1, "msg": "主题类型已存在", "data": None}
        theme = ThemeModel.create(name, type, bg_color, accent_color, text_color, config)
        return {"code": 0, "msg": "创建成功", "data": {"theme": theme}}

    @staticmethod
    def update_theme(theme_id, **kwargs):
        theme = ThemeModel.update(theme_id, **kwargs)
        if not theme:
            return {"code": 1, "msg": "更新失败", "data": None}
        return {"code": 0, "msg": "更新成功", "data": {"theme": theme}}

    @staticmethod
    def delete_theme(theme_id):
        success = ThemeModel.delete(theme_id)
        return {"code": 0 if success else 1, "msg": "删除成功" if success else "删除失败", "data": None}
