from typing import Dict, Any, Optional
from app.model.baoxiu import DormitoryModel, LogModel


class BaoxiuDormitoryBusiness:
    def __init__(self):
        self.dormitory_model = DormitoryModel()
        self.log_model = LogModel()

    def get_dormitory_list(self, page: int = 1, page_size: int = 10,
                          status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.dormitory_model.get_all(page, page_size, status, keyword)
        items = []
        for item in result.get('items', []):
            item_dict = dict(item)
            item_dict['status_text'] = self.dormitory_model.get_status_text(item.get('status', 0))
            items.append(item_dict)

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

    def get_dormitory_by_id(self, dormitory_id: int) -> Dict[str, Any]:
        dormitory = self.dormitory_model.get_by_id(dormitory_id)
        if not dormitory:
            return {'code': 1, 'msg': '宿舍楼不存在', 'data': None}

        result = dict(dormitory)
        result['status_text'] = self.dormitory_model.get_status_text(dormitory.get('status', 0))

        return {'code': 0, 'msg': 'success', 'data': result}

    def create_dormitory(self, name: str, address: str = '',
                         floors: int = 6, rooms_per_floor: int = 10,
                         operator_id: int = 0) -> Dict[str, Any]:
        if not name:
            return {'code': 1, 'msg': '宿舍楼名称不能为空', 'data': None}

        existing = self.dormitory_model.get_by_name(name)
        if existing:
            return {'code': 1, 'msg': '该宿舍楼已存在', 'data': None}

        dormitory_id = self.dormitory_model.create(name, address, floors, rooms_per_floor)
        if dormitory_id > 0:
            self.log_model.create(operator_id, LogModel.ACTION_UPDATE_DORMITORY, 'dormitory', dormitory_id,
                                  f'创建宿舍楼: {name}')
            dormitory = self.dormitory_model.get_by_id(dormitory_id)
            return {'code': 0, 'msg': '创建成功', 'data': dormitory}

        return {'code': 1, 'msg': '创建失败', 'data': None}

    def update_dormitory(self, dormitory_id: int, data: Dict[str, Any],
                         operator_id: int = 0) -> Dict[str, Any]:
        dormitory = self.dormitory_model.get_by_id(dormitory_id)
        if not dormitory:
            return {'code': 1, 'msg': '宿舍楼不存在', 'data': None}

        affected = self.dormitory_model.update(dormitory_id, data)
        if affected > 0:
            self.log_model.create(operator_id, LogModel.ACTION_UPDATE_DORMITORY, 'dormitory', dormitory_id,
                                  f'更新宿舍楼: {dormitory.get("name")}')
            updated_dormitory = self.dormitory_model.get_by_id(dormitory_id)
            return {'code': 0, 'msg': '更新成功', 'data': updated_dormitory}

        return {'code': 1, 'msg': '更新失败', 'data': None}

    def update_status(self, dormitory_id: int, status: int,
                      operator_id: int = 0) -> Dict[str, Any]:
        dormitory = self.dormitory_model.get_by_id(dormitory_id)
        if not dormitory:
            return {'code': 1, 'msg': '宿舍楼不存在', 'data': None}

        affected = self.dormitory_model.update_status(dormitory_id, status)
        if affected > 0:
            self.log_model.create(operator_id, LogModel.ACTION_UPDATE_DORMITORY, 'dormitory', dormitory_id,
                                  f'更新宿舍楼状态: {self.dormitory_model.get_status_text(status)}')
            return {'code': 0, 'msg': '状态更新成功', 'data': None}

        return {'code': 1, 'msg': '状态更新失败', 'data': None}

    def delete_dormitory(self, dormitory_id: int,
                         operator_id: int = 0) -> Dict[str, Any]:
        dormitory = self.dormitory_model.get_by_id(dormitory_id)
        if not dormitory:
            return {'code': 1, 'msg': '宿舍楼不存在', 'data': None}

        affected = self.dormitory_model.delete(dormitory_id)
        if affected > 0:
            self.log_model.create(operator_id, LogModel.ACTION_UPDATE_DORMITORY, 'dormitory', dormitory_id,
                                  f'删除宿舍楼: {dormitory.get("name")}')
            return {'code': 0, 'msg': '删除成功', 'data': None}

        return {'code': 1, 'msg': '删除失败', 'data': None}
