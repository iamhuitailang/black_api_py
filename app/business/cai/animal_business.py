from typing import Dict, Any, Optional
from app.model.cai import AnimalModel


class CaiAnimalBusiness:
    def __init__(self):
        self.animal_model = AnimalModel()

    def init_data(self) -> Dict[str, Any]:
        self.animal_model.init_default_data()
        return {
            'code': 0,
            'msg': '初始化成功',
            'data': None
        }

    def create_animal(self, name: str, level: int, description: str = '') -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '动物名称不能为空',
                'data': None
            }

        existing = self.animal_model.get_by_name(name)
        if existing:
            return {
                'code': 1,
                'msg': '该动物已存在',
                'data': None
            }

        animal_id = self.animal_model.create(name, level, description)
        if animal_id > 0:
            animal = self.animal_model.get_by_id(animal_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.animal_model.to_dict(animal)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def get_animal_by_id(self, animal_id: int) -> Dict[str, Any]:
        animal = self.animal_model.get_by_id(animal_id)
        if not animal:
            return {
                'code': 1,
                'msg': '动物不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.animal_model.to_dict(animal)
        }

    def get_animal_by_name(self, name: str) -> Dict[str, Any]:
        animal = self.animal_model.get_by_name(name)
        if not animal:
            return {
                'code': 1,
                'msg': '动物不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.animal_model.to_dict(animal)
        }

    def get_animals_by_level(self, level: int) -> Dict[str, Any]:
        animals = self.animal_model.get_by_level(level)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.animal_model.to_dict(a) for a in animals]
        }

    def get_random_animal(self, level: int = None, exclude_ids: list = None) -> Dict[str, Any]:
        if level:
            animal = self.animal_model.get_random_by_level(level, exclude_ids)
        else:
            animal = self.animal_model.get_random(exclude_ids)

        if not animal:
            return {
                'code': 1,
                'msg': '没有可用的动物',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.animal_model.to_dict(animal)
        }

    def update_animal(self, animal_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        animal = self.animal_model.get_by_id(animal_id)
        if not animal:
            return {
                'code': 1,
                'msg': '动物不存在',
                'data': None
            }

        affected = self.animal_model.update(animal_id, data)
        if affected >= 0:
            updated_animal = self.animal_model.get_by_id(animal_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.animal_model.to_dict(updated_animal)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_animal(self, animal_id: int) -> Dict[str, Any]:
        animal = self.animal_model.get_by_id(animal_id)
        if not animal:
            return {
                'code': 1,
                'msg': '动物不存在',
                'data': None
            }

        affected = self.animal_model.delete(animal_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }

    def get_animal_list(self, page: int = 1, page_size: int = 10, level: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.animal_model.get_list(page, page_size, level, keyword)
        items = [self.animal_model.to_dict(item) for item in result.get('items', [])]

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

    def get_all_animals(self) -> Dict[str, Any]:
        animals = self.animal_model.get_all()
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.animal_model.to_dict(a) for a in animals]
        }
