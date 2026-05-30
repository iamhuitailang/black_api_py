from ..models import RecordModel


class RecordBusiness:
    @staticmethod
    def add_record(user_id, **kwargs):
        record = RecordModel.create(user_id, **kwargs)
        return {"code": 0, "msg": "添加成功", "data": {"record": record}}

    @staticmethod
    def get_user_records(user_id, page=1, page_size=20):
        result = RecordModel.get_by_user_id(user_id, page, page_size)
        return {"code": 0, "msg": "获取成功", "data": result}

    @staticmethod
    def get_high_scores(limit=10):
        records = RecordModel.get_high_scores(limit)
        return {"code": 0, "msg": "获取成功", "data": {"records": records}}

    @staticmethod
    def delete_record(record_id):
        success = RecordModel.delete(record_id)
        return {"code": 0 if success else 1, "msg": "删除成功" if success else "删除失败", "data": None}

    @staticmethod
    def list_records(page=1, page_size=20):
        result = RecordModel.list_all(page, page_size)
        return {"code": 0, "msg": "获取成功", "data": result}
