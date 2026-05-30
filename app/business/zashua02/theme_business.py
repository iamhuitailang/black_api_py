from app.model.zashua02 import ThemeModel


class Zashua02ThemeBusiness:
    def __init__(self):
        self.theme_model = ThemeModel()

    def get_all_themes(self) -> dict:
        themes = self.theme_model.get_all()
        return {"code": 0, "msg": "获取成功", "data": {"themes": themes}}

    def get_theme(self, type: str) -> dict:
        theme = self.theme_model.get_by_type(type)
        if not theme:
            return {"code": 1, "msg": "主题不存在", "data": None}
        return {"code": 0, "msg": "获取成功", "data": {"theme": theme}}

    def create_theme(self, name: str, type: str, bg_color: str = "", accent_color: str = "", text_color: str = "", config: str = "") -> dict:
        existing = self.theme_model.get_by_type(type)
        if existing:
            return {"code": 1, "msg": "主题类型已存在", "data": None}
        theme_id = self.theme_model.create(name, type, bg_color, accent_color, text_color, config)
        theme = self.theme_model.get_by_id(theme_id)
        return {"code": 0, "msg": "创建成功", "data": {"theme": theme}}

    def update_theme(self, theme_id: int, **kwargs) -> dict:
        rows = self.theme_model.update(theme_id, **kwargs)
        if rows == 0:
            return {"code": 1, "msg": "更新失败", "data": None}
        theme = self.theme_model.get_by_id(theme_id)
        return {"code": 0, "msg": "更新成功", "data": {"theme": theme}}

    def delete_theme(self, theme_id: int) -> dict:
        success = self.theme_model.delete(theme_id)
        return {"code": 0 if success else 1, "msg": "删除成功" if success else "删除失败", "data": None}
