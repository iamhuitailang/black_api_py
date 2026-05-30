from app.model.zashua02 import GameStateModel


class Zashua02GameBusiness:
    def __init__(self):
        self.game_model = GameStateModel()

    def create_state(self, user_id: int, **kwargs) -> dict:
        state_id = self.game_model.create(user_id, **kwargs)
        state = self.game_model.get_by_id(state_id)
        return {"code": 0, "msg": "创建成功", "data": {"state": state}}

    def get_state(self, user_id: int) -> dict:
        state = self.game_model.get_by_user(user_id)
        return {"code": 0, "msg": "获取成功", "data": {"state": state}}

    def save_state(self, user_id: int, **kwargs) -> dict:
        self.game_model.save_by_user(user_id, **kwargs)
        state = self.game_model.get_by_user(user_id)
        return {"code": 0, "msg": "保存成功", "data": {"state": state}}

    def delete_state(self, state_id: int) -> dict:
        success = self.game_model.delete(state_id)
        return {"code": 0 if success else 1, "msg": "删除成功" if success else "删除失败", "data": None}

    def list_states(self, page: int = 1, page_size: int = 20) -> dict:
        result = self.game_model.list_all(page, page_size)
        return {"code": 0, "msg": "获取成功", "data": result}
