from typing import Dict, Any, List, Optional
from app.model.chongwu import (
    PetModel, HealthModel, DiaryModel, ReminderModel,
    PhotoModel, MedicalModel, VaccineModel, WeightModel,
)


class ChongwuBusiness:
    def __init__(self):
        self.pet_model = PetModel()
        self.health_model = HealthModel()
        self.diary_model = DiaryModel()
        self.reminder_model = ReminderModel()
        self.photo_model = PhotoModel()
        self.medical_model = MedicalModel()
        self.vaccine_model = VaccineModel()
        self.weight_model = WeightModel()

    def _check_pet_exists(self, pet_id: int) -> Optional[Dict[str, Any]]:
        pet = self.pet_model.get_by_id(pet_id)
        return pet

    def create_pet(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if not data.get('nickname'):
            return {'code': 1, 'msg': '宠物昵称不能为空', 'data': None}

        if not data.get('species'):
            data['species'] = 'other'

        if isinstance(data.get('personality_tags'), list):
            data['personality_tags'] = ','.join(data['personality_tags'])

        pet_id = self.pet_model.create(data)
        if pet_id > 0:
            pet = self.pet_model.get_by_id(pet_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.pet_model.to_dict(pet)
            }
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def get_pet(self, pet_id: int) -> Dict[str, Any]:
        pet = self.pet_model.get_by_id(pet_id)
        if not pet:
            return {'code': 1, 'msg': '宠物不存在', 'data': None}
        return {
            'code': 0,
            'msg': 'success',
            'data': self.pet_model.to_dict(pet)
        }

    def update_pet(self, pet_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        pet = self._check_pet_exists(pet_id)
        if not pet:
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        if isinstance(data.get('personality_tags'), list):
            data['personality_tags'] = ','.join(data['personality_tags'])

        affected = self.pet_model.update(pet_id, data)
        if affected >= 0:
            updated = self.pet_model.get_by_id(pet_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.pet_model.to_dict(updated)
            }
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_pet(self, pet_id: int) -> Dict[str, Any]:
        pet = self._check_pet_exists(pet_id)
        if not pet:
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        affected = self.pet_model.delete(pet_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def get_pet_list(self, page: int = 1, page_size: int = 10,
                     species: str = None, keyword: str = None) -> Dict[str, Any]:
        result = self.pet_model.get_all(page=page, page_size=page_size,
                                        species=species, keyword=keyword)
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

    def create_health(self, pet_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        if isinstance(data.get('vaccines'), list):
            data['vaccines'] = ','.join(data['vaccines'])
        if isinstance(data.get('deworming'), list):
            data['deworming'] = ','.join(data['deworming'])

        data['pet_id'] = pet_id
        record_id = self.health_model.create(data)
        if record_id > 0:
            record = self.health_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.health_model.to_dict(record)
            }
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def get_health(self, record_id: int) -> Dict[str, Any]:
        record = self.health_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '记录不存在', 'data': None}
        return {
            'code': 0,
            'msg': 'success',
            'data': self.health_model.to_dict(record)
        }

    def get_health_by_pet(self, pet_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        result = self.health_model.get_all_by_pet_id(pet_id, page=page, page_size=page_size)
        items = [self.health_model.to_dict(item) for item in result.get('items', [])]

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

    def update_health(self, record_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        record = self.health_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '记录不存在', 'data': None}

        if isinstance(data.get('vaccines'), list):
            data['vaccines'] = ','.join(data['vaccines'])
        if isinstance(data.get('deworming'), list):
            data['deworming'] = ','.join(data['deworming'])

        affected = self.health_model.update(record_id, data)
        if affected >= 0:
            updated = self.health_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.health_model.to_dict(updated)
            }
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_health(self, record_id: int) -> Dict[str, Any]:
        record = self.health_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '记录不存在', 'data': None}

        affected = self.health_model.delete(record_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def create_diary(self, pet_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        if not data.get('diary_date'):
            return {'code': 1, 'msg': '日记日期不能为空', 'data': None}

        data['pet_id'] = pet_id
        record_id = self.diary_model.create(data)
        if record_id > 0:
            record = self.diary_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.diary_model.to_dict(record)
            }
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def get_diary(self, record_id: int) -> Dict[str, Any]:
        record = self.diary_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '日记不存在', 'data': None}
        return {
            'code': 0,
            'msg': 'success',
            'data': self.diary_model.to_dict(record)
        }

    def get_diary_by_pet(self, pet_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        result = self.diary_model.get_all_by_pet_id(pet_id, page=page, page_size=page_size)
        items = [self.diary_model.to_dict(item) for item in result.get('items', [])]

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

    def update_diary(self, record_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        record = self.diary_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '日记不存在', 'data': None}

        affected = self.diary_model.update(record_id, data)
        if affected >= 0:
            updated = self.diary_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.diary_model.to_dict(updated)
            }
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_diary(self, record_id: int) -> Dict[str, Any]:
        record = self.diary_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '日记不存在', 'data': None}

        affected = self.diary_model.delete(record_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def create_reminder(self, pet_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        if not data.get('title'):
            return {'code': 1, 'msg': '提醒事项不能为空', 'data': None}
        if not data.get('reminder_time'):
            return {'code': 1, 'msg': '提醒时间不能为空', 'data': None}

        data['pet_id'] = pet_id
        record_id = self.reminder_model.create(data)
        if record_id > 0:
            record = self.reminder_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.reminder_model.to_dict(record)
            }
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def get_reminder(self, record_id: int) -> Dict[str, Any]:
        record = self.reminder_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '提醒不存在', 'data': None}
        return {
            'code': 0,
            'msg': 'success',
            'data': self.reminder_model.to_dict(record)
        }

    def get_reminder_by_pet(self, pet_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        result = self.reminder_model.get_all_by_pet_id(pet_id, page=page, page_size=page_size)
        items = [self.reminder_model.to_dict(item) for item in result.get('items', [])]

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

    def get_reminder_all(self, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        result = self.reminder_model.get_all(page=page, page_size=page_size)
        items = [self.reminder_model.to_dict(item) for item in result.get('items', [])]

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

    def update_reminder(self, record_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        record = self.reminder_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '提醒不存在', 'data': None}

        affected = self.reminder_model.update(record_id, data)
        if affected >= 0:
            updated = self.reminder_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.reminder_model.to_dict(updated)
            }
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_reminder(self, record_id: int) -> Dict[str, Any]:
        record = self.reminder_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '提醒不存在', 'data': None}

        affected = self.reminder_model.delete(record_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def create_photo(self, pet_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        if not data.get('photo_url'):
            return {'code': 1, 'msg': '照片不能为空', 'data': None}

        data['pet_id'] = pet_id
        record_id = self.photo_model.create(data)
        if record_id > 0:
            record = self.photo_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.photo_model.to_dict(record)
            }
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def get_photo(self, record_id: int) -> Dict[str, Any]:
        record = self.photo_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '照片不存在', 'data': None}
        return {
            'code': 0,
            'msg': 'success',
            'data': self.photo_model.to_dict(record)
        }

    def get_photo_by_pet(self, pet_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        result = self.photo_model.get_all_by_pet_id(pet_id, page=page, page_size=page_size)
        items = [self.photo_model.to_dict(item) for item in result.get('items', [])]

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

    def get_photo_all(self, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        result = self.photo_model.get_all(page=page, page_size=page_size)
        items = [self.photo_model.to_dict(item) for item in result.get('items', [])]

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

    def update_photo(self, record_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        record = self.photo_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '照片不存在', 'data': None}

        affected = self.photo_model.update(record_id, data)
        if affected >= 0:
            updated = self.photo_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.photo_model.to_dict(updated)
            }
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_photo(self, record_id: int) -> Dict[str, Any]:
        record = self.photo_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '照片不存在', 'data': None}

        affected = self.photo_model.delete(record_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def create_medical(self, pet_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        if not data.get('visit_date'):
            return {'code': 1, 'msg': '就医日期不能为空', 'data': None}

        data['pet_id'] = pet_id
        record_id = self.medical_model.create(data)
        if record_id > 0:
            record = self.medical_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.medical_model.to_dict(record)
            }
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def get_medical(self, record_id: int) -> Dict[str, Any]:
        record = self.medical_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '记录不存在', 'data': None}
        return {
            'code': 0,
            'msg': 'success',
            'data': self.medical_model.to_dict(record)
        }

    def get_medical_by_pet(self, pet_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        result = self.medical_model.get_all_by_pet_id(pet_id, page=page, page_size=page_size)
        items = [self.medical_model.to_dict(item) for item in result.get('items', [])]

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

    def update_medical(self, record_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        record = self.medical_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '记录不存在', 'data': None}

        affected = self.medical_model.update(record_id, data)
        if affected >= 0:
            updated = self.medical_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.medical_model.to_dict(updated)
            }
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_medical(self, record_id: int) -> Dict[str, Any]:
        record = self.medical_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '记录不存在', 'data': None}

        affected = self.medical_model.delete(record_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def create_vaccine(self, pet_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        if not data.get('vaccine_name'):
            return {'code': 1, 'msg': '疫苗名称不能为空', 'data': None}
        if not data.get('vaccine_date'):
            return {'code': 1, 'msg': '疫苗日期不能为空', 'data': None}

        data['pet_id'] = pet_id
        record_id = self.vaccine_model.create(data)
        if record_id > 0:
            record = self.vaccine_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.vaccine_model.to_dict(record)
            }
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def get_vaccine(self, record_id: int) -> Dict[str, Any]:
        record = self.vaccine_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '记录不存在', 'data': None}
        return {
            'code': 0,
            'msg': 'success',
            'data': self.vaccine_model.to_dict(record)
        }

    def get_vaccine_by_pet(self, pet_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        result = self.vaccine_model.get_all_by_pet_id(pet_id, page=page, page_size=page_size)
        items = [self.vaccine_model.to_dict(item) for item in result.get('items', [])]

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

    def update_vaccine(self, record_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        record = self.vaccine_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '记录不存在', 'data': None}

        affected = self.vaccine_model.update(record_id, data)
        if affected >= 0:
            updated = self.vaccine_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.vaccine_model.to_dict(updated)
            }
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_vaccine(self, record_id: int) -> Dict[str, Any]:
        record = self.vaccine_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '记录不存在', 'data': None}

        affected = self.vaccine_model.delete(record_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def create_weight(self, pet_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        if data.get('weight') is None:
            return {'code': 1, 'msg': '体重不能为空', 'data': None}
        if not data.get('record_date'):
            return {'code': 1, 'msg': '记录日期不能为空', 'data': None}

        data['pet_id'] = pet_id
        record_id = self.weight_model.create(data)
        if record_id > 0:
            record = self.weight_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.weight_model.to_dict(record)
            }
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def get_weight(self, record_id: int) -> Dict[str, Any]:
        record = self.weight_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '记录不存在', 'data': None}
        return {
            'code': 0,
            'msg': 'success',
            'data': self.weight_model.to_dict(record)
        }

    def get_weight_by_pet(self, pet_id: int, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        result = self.weight_model.get_all_by_pet_id(pet_id, page=page, page_size=page_size)
        items = [self.weight_model.to_dict(item) for item in result.get('items', [])]

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

    def get_weight_chart(self, pet_id: int) -> Dict[str, Any]:
        if not self._check_pet_exists(pet_id):
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        records = self.weight_model.get_recent_by_pet_id(pet_id, limit=30)
        chart_data = []
        for r in records:
            chart_data.append({
                'date': r.get('record_date', ''),
                'weight': r.get('weight', 0),
                'unit': r.get('weight_unit', 'kg'),
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': chart_data
        }

    def update_weight(self, record_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        record = self.weight_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '记录不存在', 'data': None}

        affected = self.weight_model.update(record_id, data)
        if affected >= 0:
            updated = self.weight_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.weight_model.to_dict(updated)
            }
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_weight(self, record_id: int) -> Dict[str, Any]:
        record = self.weight_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '记录不存在', 'data': None}

        affected = self.weight_model.delete(record_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def get_pet_full_profile(self, pet_id: int) -> Dict[str, Any]:
        pet = self._check_pet_exists(pet_id)
        if not pet:
            return {'code': 1, 'msg': '宠物不存在', 'data': None}

        health_result = self.health_model.get_all_by_pet_id(pet_id, page=1, page_size=1)
        health_items = [self.health_model.to_dict(item) for item in health_result.get('items', [])]

        diary_result = self.diary_model.get_all_by_pet_id(pet_id, page=1, page_size=5)
        diary_items = [self.diary_model.to_dict(item) for item in diary_result.get('items', [])]

        reminder_result = self.reminder_model.get_all_by_pet_id(pet_id, page=1, page_size=10)
        reminder_items = [self.reminder_model.to_dict(item) for item in reminder_result.get('items', [])]

        photo_result = self.photo_model.get_all_by_pet_id(pet_id, page=1, page_size=9)
        photo_items = [self.photo_model.to_dict(item) for item in photo_result.get('items', [])]

        vaccine_result = self.vaccine_model.get_all_by_pet_id(pet_id, page=1, page_size=20)
        vaccine_items = [self.vaccine_model.to_dict(item) for item in vaccine_result.get('items', [])]

        medical_result = self.medical_model.get_all_by_pet_id(pet_id, page=1, page_size=20)
        medical_items = [self.medical_model.to_dict(item) for item in medical_result.get('items', [])]

        weight_result = self.weight_model.get_all_by_pet_id(pet_id, page=1, page_size=50)
        weight_items = [self.weight_model.to_dict(item) for item in weight_result.get('items', [])]

        weight_chart = self.weight_model.get_recent_by_pet_id(pet_id, limit=30)
        chart_data = [{
            'date': r.get('record_date', ''),
            'weight': r.get('weight', 0),
            'unit': r.get('weight_unit', 'kg'),
        } for r in weight_chart]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'pet': self.pet_model.to_dict(pet),
                'health': health_items[0] if health_items else None,
                'diaries': diary_items,
                'reminders': reminder_items,
                'photos': photo_items,
                'vaccines': vaccine_items,
                'medical': medical_items,
                'weights': weight_items,
                'weight_chart': chart_data,
            }
        }