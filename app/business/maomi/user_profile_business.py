from typing import Dict, Any, List, Optional
from app.model.maomi_model import UserProfileModel


class UserProfileBusiness:
    def __init__(self):
        self.model = UserProfileModel()

    def get_profile(self, user_id: int) -> Dict[str, Any]:
        profile = self.model.get_by_user_id(user_id)
        if profile:
            return {
                'code': 0,
                'message': 'success',
                'data': profile
            }
        return {
            'code': 1,
            'message': '用户档案不存在',
            'data': None
        }

    def create_profile(self, user_id: int, nickname: str = '猫咪店长') -> Dict[str, Any]:
        existing = self.model.get_by_user_id(user_id)
        if existing:
            return {
                'code': 1,
                'message': '用户档案已存在',
                'data': None
            }
        try:
            profile_id = self.model.create(user_id=user_id, nickname=nickname)
            return self.get_profile(user_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_profile(self, user_id: int, nickname: str = None, avatar: str = None,
                       cafe_name: str = None) -> Dict[str, Any]:
        profile = self.model.get_by_user_id(user_id)
        if not profile:
            return {
                'code': 1,
                'message': '用户档案不存在',
                'data': None
            }
        try:
            self.model.update(profile.get('id'), nickname=nickname, avatar=avatar, cafe_name=cafe_name)
            return self.get_profile(user_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
    def add_coins(self, user_id: int, amount: int) -> Dict[str, Any]:
        profile = self.model.get_by_user_id(user_id)
        if not profile:
            return {
                'code': 1,
                'message': '用户档案不存在',
                'data': None
            }
        try:
            self.model.add_coins(user_id, amount)
            return self.get_profile(user_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def add_experience(self, user_id: int, amount: int) -> Dict[str, Any]:
        profile = self.model.get_by_user_id(user_id)
        if not profile:
            return {
                'code': 1,
                'message': '用户档案不存在',
                'data': None
            }
        try:
            self.model.add_experience(user_id, amount)
            return self.get_profile(user_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_leaderboard(self) -> Dict[str, Any]:
        try:
            profiles = self.model.get_all()
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': profiles[:20]
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
