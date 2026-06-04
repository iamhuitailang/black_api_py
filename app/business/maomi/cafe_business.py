from typing import Dict, Any, List, Optional
import random
from app.model.maomi_model import CafeModel, UserProfileModel


class CafeBusiness:
    def __init__(self):
        self.model = CafeModel()
        self.user_profile_model = UserProfileModel()

    def get_cafe(self, user_id: int) -> Dict[str, Any]:
        cafe = self.model.get_by_user_id(user_id)
        if cafe:
            return {
                'code': 0,
                'message': 'success',
                'data': cafe
            }
        return {
            'code': 1,
            'message': '咖啡馆不存在',
            'data': None
        }

    def create_cafe(self, user_id: int, name: str = '温馨猫咪咖啡馆') -> Dict[str, Any]:
        existing = self.model.get_by_user_id(user_id)
        if existing:
            return {
                'code': 1,
                'message': '咖啡馆已存在',
                'data': None
            }
        try:
            cafe_id = self.model.create(user_id=user_id, name=name)
            return self.get_cafe(user_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def toggle_open(self, user_id: int) -> Dict[str, Any]:
        cafe = self.model.toggle_open(user_id)
        if cafe:
            return {
                'code': 0,
                'message': 'success',
                'data': cafe
            }
        return {
            'code': 1,
            'message': '操作失败',
            'data': None
        }

    def update_weather(self, user_id: int) -> Dict[str, Any]:
        weathers = ['sunny', 'cloudy', 'rainy', 'windy']
        weather_weights = [0.5, 0.3, 0.15, 0.05]
        weather = random.choices(weathers, weights=weather_weights, k=1)[0]

        cafe = self.model.update_weather(user_id, weather)
        if cafe:
            return {
                'code': 0,
                'message': 'success',
                'data': cafe
            }
        return {
            'code': 1,
            'message': '操作失败',
            'data': None
        }

    def upgrade_cafe(self, user_id: int) -> Dict[str, Any]:
        cafe = self.model.get_by_user_id(user_id)
        if not cafe:
            return {
                'code': 1,
                'message': '咖啡馆不存在',
                'data': None
            }

        profile = self.user_profile_model.get_by_user_id(user_id)
        if not profile:
            return {
                'code': 1,
                'message': '用户档案不存在',
                'data': None
            }

        current_level = cafe.get('level', 1)
        upgrade_cost = current_level * 500

        if profile.get('coins', 0) < upgrade_cost:
            return {
                'code': 1,
                'message': f'金币不足，升级需要{upgrade_cost}金币',
                'data': None
            }

        if profile.get('level', 1) < current_level + 1:
            return {
                'code': 1,
                'message': f'店长等级不足，需要{current_level + 1}级才能升级咖啡馆',
                'data': None
            }

        try:
            self.user_profile_model.add_coins(user_id, -upgrade_cost)
            cafe = self.model.upgrade_cafe(user_id)
            if cafe:
                return {
                    'code': 0,
                    'message': '升级成功',
                    'data': cafe
                }
            return {
                'code': 1,
                'message': '升级失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def clean_cafe(self, user_id: int) -> Dict[str, Any]:
        cafe = self.model.get_by_user_id(user_id)
        if not cafe:
            return {
                'code': 1,
                'message': '咖啡馆不存在',
                'data': None
            }
        try:
            self.model.update(cafe.get('id'), cleanliness=100)
            return self.get_cafe(user_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_cafe(self, user_id: int, name: str = None, open_time: str = None,
                    close_time: str = None, background_image: str = None) -> Dict[str, Any]:
        cafe = self.model.get_by_user_id(user_id)
        if not cafe:
            return {
                'code': 1,
                'message': '咖啡馆不存在',
                'data': None
            }
        try:
            self.model.update(cafe.get('id'), name=name, open_time=open_time,
                              close_time=close_time, background_image=background_image)
            return self.get_cafe(user_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def add_customer(self, user_id: int) -> Dict[str, Any]:
        cafe = self.model.add_customer(user_id)
        if cafe:
            return {
                'code': 0,
                'message': 'success',
                'data': cafe
            }
        return {
            'code': 1,
            'message': '咖啡馆已满或不存在',
            'data': None
        }

    def remove_customer(self, user_id: int) -> Dict[str, Any]:
        cafe = self.model.remove_customer(user_id)
        if cafe:
            return {
                'code': 0,
                'message': 'success',
                'data': cafe
            }
        return {
            'code': 1,
            'message': '操作失败',
            'data': None
        }

    def add_decoration(self, user_id: int, atmosphere_bonus: int) -> Dict[str, Any]:
        cafe = self.model.get_by_user_id(user_id)
        if not cafe:
            return {
                'code': 1,
                'message': '咖啡馆不存在',
                'data': None
            }
        try:
            new_atmosphere = min(100, cafe.get('atmosphere', 50) + atmosphere_bonus)
            new_decoration_level = cafe.get('decoration_level', 1) + 1
            self.model.update(cafe.get('id'), atmosphere=new_atmosphere, decoration_level=new_decoration_level)
            return self.get_cafe(user_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
