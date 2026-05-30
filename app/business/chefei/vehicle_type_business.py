from typing import Dict, Any, List, Optional
from app.model.chefei_model import VehicleTypeModel


class VehicleTypeBusiness:
    def __init__(self):
        self.model = VehicleTypeModel()

    def _format_result(self, item: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': item.get('id'),
            'name': item.get('name'),
            'code': item.get('code'),
            'rate_per_hour': item.get('rate_per_hour'),
            'free_minutes': item.get('free_minutes'),
            'daily_cap': item.get('daily_cap'),
            'icon': item.get('icon'),
            'description': item.get('description'),
            'sort_order': item.get('sort_order'),
            'is_active': item.get('is_active'),
            'created_at': item.get('created_at'),
            'updated_at': item.get('updated_at')
        }

    def get_vehicle_types(self) -> Dict[str, Any]:
        try:
            items = self.model.get_all()
            result = [self._format_result(item) for item in items]
            return {
                'code': 0,
                'message': 'success',
                'data': result
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_vehicle_type_by_id(self, record_id: int) -> Dict[str, Any]:
        try:
            item = self.model.get_by_id(record_id)
            if not item:
                return {
                    'code': 1,
                    'message': '车型不存在',
                    'data': None
                }
            return {
                'code': 0,
                'message': 'success',
                'data': self._format_result(item)
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def add_vehicle_type(self, name: str, code: str, rate_per_hour: float,
                         free_minutes: int, daily_cap: float, icon: str = '',
                         description: str = '', sort_order: int = 0) -> Dict[str, Any]:
        try:
            if not name or not name.strip():
                return {'code': 1, 'message': '车型名称不能为空', 'data': None}
            if not code or not code.strip():
                return {'code': 1, 'message': '车型编码不能为空', 'data': None}
            if rate_per_hour < 0:
                return {'code': 1, 'message': '费率不能为负数', 'data': None}
            if free_minutes < 0:
                return {'code': 1, 'message': '免费时长不能为负数', 'data': None}
            if daily_cap < 0:
                return {'code': 1, 'message': '单日封顶不能为负数', 'data': None}

            existing = self.model.get_by_code(code.strip())
            if existing:
                return {'code': 1, 'message': '车型编码已存在', 'data': None}

            new_id = self.model.create(
                name=name.strip(),
                code=code.strip(),
                rate_per_hour=rate_per_hour,
                free_minutes=free_minutes,
                daily_cap=daily_cap,
                icon=icon,
                description=description,
                sort_order=sort_order
            )

            return self.get_vehicle_type_by_id(new_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_vehicle_type(self, record_id: int, name: str = None, code: str = None,
                            rate_per_hour: float = None, free_minutes: int = None,
                            daily_cap: float = None, icon: str = None,
                            description: str = None, sort_order: int = None,
                            is_active: int = None) -> Dict[str, Any]:
        try:
            existing = self.model.get_by_id(record_id)
            if not existing:
                return {'code': 1, 'message': '车型不存在', 'data': None}

            if code and code.strip() and code.strip() != existing.get('code'):
                code_exists = self.model.get_by_code(code.strip())
                if code_exists:
                    return {'code': 1, 'message': '车型编码已存在', 'data': None}

            affected = self.model.update(
                record_id=record_id,
                name=name.strip() if name else None,
                code=code.strip() if code else None,
                rate_per_hour=rate_per_hour,
                free_minutes=free_minutes,
                daily_cap=daily_cap,
                icon=icon,
                description=description,
                sort_order=sort_order,
                is_active=is_active
            )

            if affected > 0:
                return self.get_vehicle_type_by_id(record_id)

            return {'code': 1, 'message': '更新失败', 'data': None}
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def delete_vehicle_type(self, record_id: int) -> Dict[str, Any]:
        try:
            existing = self.model.get_by_id(record_id)
            if not existing:
                return {'code': 1, 'message': '车型不存在', 'data': None}

            affected = self.model.delete(record_id)
            if affected > 0:
                return {'code': 0, 'message': '删除成功', 'data': None}

            return {'code': 1, 'message': '删除失败', 'data': None}
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
