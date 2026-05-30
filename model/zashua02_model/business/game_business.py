import json
from ..models import GameStateModel


class GameBusiness:
    @staticmethod
    def create_state(user_id, **kwargs):
        state = GameStateModel.create(user_id, **kwargs)
        return {"code": 0, "msg": "创建成功", "data": {"state": state}}

    @staticmethod
    def get_state(user_id):
        state = GameStateModel.get_by_user_id(user_id)
        return {"code": 0, "msg": "获取成功", "data": {"state": state}}

    @staticmethod
    def save_state(state_id, **kwargs):
        if "props_data" in kwargs and isinstance(kwargs["props_data"], dict):
            kwargs["props_data"] = json.dumps(kwargs["props_data"], ensure_ascii=False)
        if "teammates_data" in kwargs and isinstance(kwargs["teammates_data"], dict):
            kwargs["teammates_data"] = json.dumps(kwargs["teammates_data"], ensure_ascii=False)
        state = GameStateModel.update(state_id, **kwargs)
        return {"code": 0, "msg": "保存成功", "data": {"state": state}}

    @staticmethod
    def save_state_by_user(user_id, **kwargs):
        state = GameStateModel.get_by_user_id(user_id)
        if state:
            return GameBusiness.save_state(state["id"], **kwargs)
        else:
            return GameBusiness.create_state(user_id, **kwargs)

    @staticmethod
    def delete_state(state_id):
        success = GameStateModel.delete(state_id)
        return {"code": 0 if success else 1, "msg": "删除成功" if success else "删除失败", "data": None}

    @staticmethod
    def list_states(page=1, page_size=20):
        result = GameStateModel.list_all(page, page_size)
        return {"code": 0, "msg": "获取成功", "data": result}
