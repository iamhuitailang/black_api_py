from app.model.zashua02 import RecordModel


class Zashua02RecordBusiness:
    def __init__(self):
        self.record_model = RecordModel()

    def add_record(self, user_id: int, **kwargs) -> dict:
        record_id = self.record_model.create(user_id, **kwargs)
        record = self.record_model.get_by_id(record_id)
        return {"code": 0, "msg": "添加成功", "data": {"record": record}}

    def get_user_records(self, user_id: int, page: int = 1, page_size: int = 20) -> dict:
        result = self.record_model.get_by_user(user_id, page, page_size)
        return {"code": 0, "msg": "获取成功", "data": result}

    def get_high_scores(self, limit: int = 10) -> dict:
        records = self.record_model.get_high_scores(limit)
        return {"code": 0, "msg": "获取成功", "data": {"records": records}}

    def delete_record(self, record_id: int) -> dict:
        success = self.record_model.delete(record_id)
        return {"code": 0 if success else 1, "msg": "删除成功" if success else "删除失败", "data": None}

    def list_records(self, page: int = 1, page_size: int = 20) -> dict:
        result = self.record_model.list_all(page, page_size)
        return {"code": 0, "msg": "获取成功", "data": result}
