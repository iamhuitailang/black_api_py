from typing import Dict, Any
from app.model.chongwu09 import PetModel


class PetBusiness:
    def __init__(self):
        self.pet_model = PetModel()

    def create_pet(self, user_id: int, name: str, pet_type: str, breed: str = '',
                   age: str = '', weight: str = '', gender: str = '', photo: str = '',
                   health_info: str = '', vaccine_status: int = 0) -> Dict[str, Any]:
        if not name:
            return {'code': 1, 'msg': '宠物名称不能为空', 'data': None}
        if not pet_type:
            return {'code': 1, 'msg': '宠物类型不能为空', 'data': None}
        pet_id = self.pet_model.create(
            user_id, name, pet_type, breed, age, weight, gender,
            photo, health_info, vaccine_status
        )
        if pet_id > 0:
            pet = self.pet_model.get_by_id(pet_id)
            return {'code': 0, 'msg': '添加成功', 'data': self.pet_model.to_dict(pet)}
        return {'code': 1, 'msg': '添加失败', 'data': None}

    def get_pet(self, pet_id: int) -> Dict[str, Any]:
        pet = self.pet_model.get_by_id(pet_id)
        if not pet:
            return {'code': 1, 'msg': '宠物不存在', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.pet_model.to_dict(pet)}

    def update_pet(self, pet_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        pet = self.pet_model.get_by_id(pet_id)
        if not pet:
            return {'code': 1, 'msg': '宠物不存在', 'data': None}
        if pet.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}
        affected = self.pet_model.update(pet_id, data)
        if affected >= 0:
            updated_pet = self.pet_model.get_by_id(pet_id)
            return {'code': 0, 'msg': '更新成功', 'data': self.pet_model.to_dict(updated_pet)}
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_pet(self, pet_id: int, user_id: int) -> Dict[str, Any]:
        pet = self.pet_model.get_by_id(pet_id)
        if not pet:
            return {'code': 1, 'msg': '宠物不存在', 'data': None}
        if pet.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}
        affected = self.pet_model.delete(pet_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def get_my_pets(self, user_id: int) -> Dict[str, Any]:
        pets = self.pet_model.get_by_user(user_id)
        items = [self.pet_model.to_dict(pet) for pet in pets]
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_pet_list(self, page: int = 1, page_size: int = 10,
                     pet_type: str = None, keyword: str = None,
                     user_id: int = None) -> Dict[str, Any]:
        result = self.pet_model.get_all(page, page_size, pet_type, keyword, user_id)
        items = [self.pet_model.to_dict(item) for item in result.get('items', [])]
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

    def get_pet_types(self) -> Dict[str, Any]:
        return {'code': 0, 'msg': 'success', 'data': PetModel.PET_TYPES}

    def admin_update_pet(self, pet_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        pet = self.pet_model.get_by_id(pet_id)
        if not pet:
            return {'code': 1, 'msg': '宠物不存在', 'data': None}
        affected = self.pet_model.update(pet_id, data)
        if affected >= 0:
            updated_pet = self.pet_model.get_by_id(pet_id)
            return {'code': 0, 'msg': '更新成功', 'data': self.pet_model.to_dict(updated_pet)}
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def admin_delete_pet(self, pet_id: int) -> Dict[str, Any]:
        pet = self.pet_model.get_by_id(pet_id)
        if not pet:
            return {'code': 1, 'msg': '宠物不存在', 'data': None}
        affected = self.pet_model.delete(pet_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}
