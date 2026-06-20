from typing import Dict, Any, List, Optional
from app.model.journal import UserProfileModel, UserRole


class UserProfileBusiness:
    def __init__(self):
        self.profile_model = UserProfileModel()

    def get_profile(self, user_id: int) -> Dict[str, Any]:
        profile = self.profile_model.get_by_user_id(user_id)
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

    def update_profile(self, user_id: int, real_name: str = None, email: str = None,
                       phone: str = None, affiliation: str = None,
                       research_fields: str = None) -> Dict[str, Any]:
        affected = self.profile_model.update(
            user_id=user_id,
            real_name=real_name,
            email=email,
            phone=phone,
            affiliation=affiliation,
            research_fields=research_fields
        )
        if affected > 0:
            return {
                'code': 0,
                'message': '更新成功',
                'data': self.profile_model.get_by_user_id(user_id)
            }
        return {
            'code': 1,
            'message': '更新失败',
            'data': None
        }

    def get_reviewer_list(self) -> Dict[str, Any]:
        reviewers = self.profile_model.get_all_reviewers()
        return {
            'code': 0,
            'message': 'success',
            'data': reviewers
        }

    def get_role_info(self, user_id: int) -> Dict[str, Any]:
        profile = self.profile_model.get_by_user_id(user_id)
        if not profile:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'role': UserRole.AUTHOR,
                    'role_label': UserRole.LABEL_MAP[UserRole.AUTHOR],
                    'is_author': True,
                    'is_reviewer': False,
                    'is_editor': False,
                    'is_admin': False
                }
            }
        role = profile.get('role', UserRole.AUTHOR)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'role': role,
                'role_label': UserRole.LABEL_MAP.get(role, '作者'),
                'is_author': role == UserRole.AUTHOR,
                'is_reviewer': role == UserRole.REVIEWER,
                'is_editor': role == UserRole.EDITOR or role == UserRole.ADMIN,
                'is_admin': role == UserRole.ADMIN,
                'real_name': profile.get('real_name', ''),
                'email': profile.get('email', ''),
                'affiliation': profile.get('affiliation', '')
            }
        }

    def get_user_list_by_role(self, role: str) -> Dict[str, Any]:
        users = self.profile_model.get_by_role(role)
        return {
            'code': 0,
            'message': 'success',
            'data': users
        }

    def ensure_profile(self, user_id: int, username: str) -> Dict[str, Any]:
        profile = self.profile_model.get_by_user_id(user_id)
        if not profile:
            self.profile_model.create(user_id=user_id, username=username)
            profile = self.profile_model.get_by_user_id(user_id)
        return {
            'code': 0,
            'message': 'success',
            'data': profile
        }
