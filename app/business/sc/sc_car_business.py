from typing import Dict, Any, List, Optional
from app.model.sc import ScCarModel, ScCarPartModel, ScPartModel, ScUserPartModel


class ScCarBusiness:
    def __init__(self):
        self.car_model = ScCarModel()
        self.car_part_model = ScCarPartModel()
        self.part_model = ScPartModel()
        self.user_part_model = ScUserPartModel()

    def _validate_color_hex(self, color: str) -> bool:
        if not color:
            return False
        import re
        pattern = r'^#[0-9A-Fa-f]{6}$'
        return re.match(pattern, color) is not None

    def create_car(self, user_id: int, name: str, description: str = '',
                   primary_color: str = '#FF0000', secondary_color: str = '#000000',
                   accent_color: str = '#FFFFFF', body_style: str = 'sedan') -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        if not name or len(name.strip()) == 0:
            return {
                'code': 1,
                'msg': '车辆名称不能为空',
                'data': None
            }

        if len(name) > 50:
            return {
                'code': 1,
                'msg': '车辆名称不能超过50个字符',
                'data': None
            }

        if not self._validate_color_hex(primary_color):
            return {
                'code': 1,
                'msg': '主色调格式不正确，应为#RRGGBB格式',
                'data': None
            }

        if not self._validate_color_hex(secondary_color):
            return {
                'code': 1,
                'msg': '副色调格式不正确，应为#RRGGBB格式',
                'data': None
            }

        if not self._validate_color_hex(accent_color):
            return {
                'code': 1,
                'msg': '强调色格式不正确，应为#RRGGBB格式',
                'data': None
            }

        valid_body_styles = ['sedan', 'sports', 'suv', 'hatchback', 'coupe']
        if body_style not in valid_body_styles:
            return {
                'code': 1,
                'msg': f'车身样式无效，有效值为：{", ".join(valid_body_styles)}',
                'data': None
            }

        car_id = self.car_model.create(
            user_id=user_id,
            name=name.strip(),
            description=description,
            primary_color=primary_color,
            secondary_color=secondary_color,
            accent_color=accent_color,
            body_style=body_style
        )

        if car_id > 0:
            default_parts = self.part_model.get_default_parts()
            for part in default_parts:
                self.car_part_model.create(car_id, part['id'], part['type'])

            self.calculate_car_stats(car_id)
            car = self.car_model.get_by_id(car_id)
            return {
                'code': 0,
                'msg': '车辆创建成功',
                'data': car
            }

        return {
            'code': 1,
            'msg': '车辆创建失败',
            'data': None
        }

    def get_user_cars(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        result = self.car_model.get_by_user_id(user_id, page, page_size)
        cars = result.get('items', [])

        for car in cars:
            car_parts = self.car_part_model.get_by_car_id(car['id'])
            car['parts'] = car_parts

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': cars,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_car_detail(self, car_id: int, user_id: int) -> Dict[str, Any]:
        if not car_id or car_id <= 0:
            return {
                'code': 1,
                'msg': '车辆ID无效',
                'data': None
            }

        car = self.car_model.get_by_id(car_id)
        if not car:
            return {
                'code': 1,
                'msg': '车辆不存在',
                'data': None
            }

        if car.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权访问该车辆',
                'data': None
            }

        car_parts = self.car_part_model.get_by_car_id(car_id)
        parts_detail = []
        for car_part in car_parts:
            part = self.part_model.get_by_id(car_part['part_id'])
            if part:
                part_info = {
                    'car_part_id': car_part['id'],
                    'part_id': part['id'],
                    'name': part['name'],
                    'type': part['type'],
                    'tier': part['tier'],
                    'weight': part['weight'],
                    'power': part['power'],
                    'grip': part['grip'],
                    'aerodynamics': part['aerodynamics'],
                    'slot_type': car_part['slot_type'],
                    'installed_at': car_part['installed_at']
                }
                parts_detail.append(part_info)

        car['parts'] = parts_detail

        return {
            'code': 0,
            'msg': 'success',
            'data': car
        }

    def update_car(self, user_id: int, car_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not car_id or car_id <= 0:
            return {
                'code': 1,
                'msg': '车辆ID无效',
                'data': None
            }

        car = self.car_model.get_by_id(car_id)
        if not car:
            return {
                'code': 1,
                'msg': '车辆不存在',
                'data': None
            }

        if car.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权修改该车辆',
                'data': None
            }

        if 'name' in data and (not data['name'] or len(data['name'].strip()) == 0):
            return {
                'code': 1,
                'msg': '车辆名称不能为空',
                'data': None
            }

        if 'name' in data and len(data['name']) > 50:
            return {
                'code': 1,
                'msg': '车辆名称不能超过50个字符',
                'data': None
            }

        if 'primary_color' in data and not self._validate_color_hex(data['primary_color']):
            return {
                'code': 1,
                'msg': '主色调格式不正确，应为#RRGGBB格式',
                'data': None
            }

        if 'secondary_color' in data and not self._validate_color_hex(data['secondary_color']):
            return {
                'code': 1,
                'msg': '副色调格式不正确，应为#RRGGBB格式',
                'data': None
            }

        if 'accent_color' in data and not self._validate_color_hex(data['accent_color']):
            return {
                'code': 1,
                'msg': '强调色格式不正确，应为#RRGGBB格式',
                'data': None
            }

        if 'body_style' in data:
            valid_body_styles = ['sedan', 'sports', 'suv', 'hatchback', 'coupe']
            if data['body_style'] not in valid_body_styles:
                return {
                    'code': 1,
                    'msg': f'车身样式无效，有效值为：{", ".join(valid_body_styles)}',
                    'data': None
                }

        update_data = {}
        for key in ['name', 'description', 'primary_color', 'secondary_color', 'accent_color', 'body_style']:
            if key in data:
                update_data[key] = data[key]

        if len(update_data) == 0:
            return {
                'code': 1,
                'msg': '没有有效的更新字段',
                'data': None
            }

        affected = self.car_model.update(car_id, update_data)
        if affected >= 0:
            updated_car = self.car_model.get_by_id(car_id)
            return {
                'code': 0,
                'msg': '车辆更新成功',
                'data': updated_car
            }

        return {
            'code': 1,
            'msg': '车辆更新失败',
            'data': None
        }

    def delete_car(self, user_id: int, car_id: int) -> Dict[str, Any]:
        if not car_id or car_id <= 0:
            return {
                'code': 1,
                'msg': '车辆ID无效',
                'data': None
            }

        car = self.car_model.get_by_id(car_id)
        if not car:
            return {
                'code': 1,
                'msg': '车辆不存在',
                'data': None
            }

        if car.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权删除该车辆',
                'data': None
            }

        self.car_part_model.delete_by_car_id(car_id)

        affected = self.car_model.delete(car_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '车辆删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '车辆删除失败',
            'data': None
        }

    def set_active_car(self, user_id: int, car_id: int) -> Dict[str, Any]:
        if not car_id or car_id <= 0:
            return {
                'code': 1,
                'msg': '车辆ID无效',
                'data': None
            }

        car = self.car_model.get_by_id(car_id)
        if not car:
            return {
                'code': 1,
                'msg': '车辆不存在',
                'data': None
            }

        if car.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权设置该车辆为激活状态',
                'data': None
            }

        affected = self.car_model.set_active(car_id, user_id)
        if affected > 0:
            updated_car = self.car_model.get_by_id(car_id)
            return {
                'code': 0,
                'msg': '车辆已设为激活状态',
                'data': updated_car
            }

        return {
            'code': 1,
            'msg': '设置激活状态失败',
            'data': None
        }

    def install_part(self, user_id: int, car_id: int, part_id: int, slot_type: str) -> Dict[str, Any]:
        if not car_id or car_id <= 0:
            return {
                'code': 1,
                'msg': '车辆ID无效',
                'data': None
            }

        if not part_id or part_id <= 0:
            return {
                'code': 1,
                'msg': '零件ID无效',
                'data': None
            }

        car = self.car_model.get_by_id(car_id)
        if not car:
            return {
                'code': 1,
                'msg': '车辆不存在',
                'data': None
            }

        if car.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权修改该车辆',
                'data': None
            }

        part = self.part_model.get_by_id(part_id)
        if not part:
            return {
                'code': 1,
                'msg': '零件不存在',
                'data': None
            }

        if slot_type not in self.part_model.VALID_TYPES:
            return {
                'code': 1,
                'msg': f'槽位类型无效，有效值为：{", ".join(self.part_model.VALID_TYPES)}',
                'data': None
            }

        if part.get('type') != slot_type:
            return {
                'code': 1,
                'msg': f'零件类型不匹配，该零件为{part.get("type")}，不能安装到{slot_type}槽位',
                'data': None
            }

        user_part = self.user_part_model.get_by_user_and_part(user_id, part_id)
        if not user_part or user_part.get('quantity', 0) <= 0:
            return {
                'code': 1,
                'msg': '您没有该零件，无法安装',
                'data': None
            }

        existing_car_part = self.car_part_model.get_by_car_and_slot(car_id, slot_type)
        if existing_car_part:
            self.car_part_model.delete(existing_car_part['id'])

        car_part_id = self.car_part_model.create(car_id, part_id, slot_type)
        if car_part_id > 0:
            new_quantity = user_part['quantity'] - 1
            if new_quantity <= 0:
                self.user_part_model.delete(user_part['id'])
            else:
                self.user_part_model.update_quantity(user_part['id'], new_quantity)

            self.calculate_car_stats(car_id)
            stats = self._get_car_stats_dict(car_id)

            return {
                'code': 0,
                'msg': '零件安装成功',
                'data': {
                    'car_part_id': car_part_id,
                    'stats': stats
                }
            }

        return {
            'code': 1,
            'msg': '零件安装失败',
            'data': None
        }

    def uninstall_part(self, user_id: int, car_id: int, car_part_id: int) -> Dict[str, Any]:
        if not car_id or car_id <= 0:
            return {
                'code': 1,
                'msg': '车辆ID无效',
                'data': None
            }

        if not car_part_id or car_part_id <= 0:
            return {
                'code': 1,
                'msg': '车辆零件ID无效',
                'data': None
            }

        car = self.car_model.get_by_id(car_id)
        if not car:
            return {
                'code': 1,
                'msg': '车辆不存在',
                'data': None
            }

        if car.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权修改该车辆',
                'data': None
            }

        car_part = self.car_part_model.get_by_id(car_part_id)
        if not car_part:
            return {
                'code': 1,
                'msg': '车辆零件不存在',
                'data': None
            }

        if car_part.get('car_id') != car_id:
            return {
                'code': 1,
                'msg': '该零件不属于此车辆',
                'data': None
            }

        part_id = car_part.get('part_id')
        user_part = self.user_part_model.get_by_user_and_part(user_id, part_id)
        if user_part:
            self.user_part_model.update_quantity(user_part['id'], user_part['quantity'] + 1)
        else:
            self.user_part_model.create(user_id, part_id, 1)

        affected = self.car_part_model.delete(car_part_id)
        if affected > 0:
            self.calculate_car_stats(car_id)
            stats = self._get_car_stats_dict(car_id)

            return {
                'code': 0,
                'msg': '零件卸载成功',
                'data': {
                    'stats': stats
                }
            }

        return {
            'code': 1,
            'msg': '零件卸载失败',
            'data': None
        }

    def _get_car_stats_dict(self, car_id: int) -> Dict[str, Any]:
        car = self.car_model.get_by_id(car_id)
        if not car:
            return {}
        return {
            'total_weight': car.get('total_weight', 0),
            'total_power': car.get('total_power', 0),
            'total_grip': car.get('total_grip', 0),
            'total_aerodynamics': car.get('total_aerodynamics', 0)
        }

    def calculate_car_stats(self, car_id: int) -> Dict[str, Any]:
        if not car_id or car_id <= 0:
            return {
                'code': 1,
                'msg': '车辆ID无效',
                'data': None
            }

        car = self.car_model.get_by_id(car_id)
        if not car:
            return {
                'code': 1,
                'msg': '车辆不存在',
                'data': None
            }

        car_parts = self.car_part_model.get_by_car_id(car_id)

        total_weight = 0
        total_power = 0
        total_grip = 0
        total_aerodynamics = 0

        for car_part in car_parts:
            part = self.part_model.get_by_id(car_part['part_id'])
            if part:
                total_weight += part.get('weight', 0)
                total_power += part.get('power', 0)
                total_grip += part.get('grip', 0)
                total_aerodynamics += part.get('aerodynamics', 0)

        affected = self.car_model.update_stats(
            car_id,
            total_weight,
            total_power,
            total_grip,
            total_aerodynamics
        )

        if affected >= 0:
            return {
                'code': 0,
                'msg': '属性计算成功',
                'data': {
                    'total_weight': total_weight,
                    'total_power': total_power,
                    'total_grip': total_grip,
                    'total_aerodynamics': total_aerodynamics
                }
            }

        return {
            'code': 1,
            'msg': '属性计算失败',
            'data': None
        }
