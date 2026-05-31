from typing import Dict, Any, Optional
from app.model.jaoyou_077 import AdminModel, AdminTokenModel, UserModel, MatchModel, DateModel, ComplaintModel, HeartModel


class JaoyouAdminBusiness:
    def __init__(self):
        self.admin_model = AdminModel()
        self.admin_token_model = AdminTokenModel()
        self.user_model = UserModel()
        self.heart_model = HeartModel()
        self.match_model = MatchModel()
        self.date_model = DateModel()
        self.complaint_model = ComplaintModel()

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not username or not password:
            return {
                'code': 1,
                'msg': '用户名和密码不能为空',
                'data': None
            }

        admin = self.admin_model.verify_password(username, password)
        if admin is None:
            return {
                'code': 1,
                'msg': '用户名或密码错误',
                'data': None
            }

        self.admin_token_model.delete_by_admin_id(admin.get('id'))
        token = self.admin_token_model.create_token(admin.get('id'), hours=24)

        admin_full = self.admin_model.get_by_id(admin.get('id'))
        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'admin': self.admin_model.to_public_dict(admin_full),
                'token': token
            }
        }

    def logout(self, token: str) -> Dict[str, Any]:
        if not token:
            return {
                'code': 0,
                'msg': 'success',
                'data': None
            }

        self.admin_token_model.delete_token(token)
        return {
            'code': 0,
            'msg': '退出成功',
            'data': None
        }

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.admin_token_model.get_admin_by_token(token)

    def get_current_admin(self, token: str) -> Dict[str, Any]:
        admin = self.admin_token_model.get_admin_by_token(token)
        if admin:
            return {
                'code': 0,
                'msg': 'success',
                'data': admin
            }

        return {
            'code': 1,
            'msg': 'token无效或已过期',
            'data': None
        }

    def review_user(self, user_id: int, status: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.update_status(user_id, status)
        if affected > 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '审核成功',
                'data': self.user_model.to_public_dict(updated_user)
            }

        return {
            'code': 1,
            'msg': '审核失败',
            'data': None
        }

    def ban_user(self, user_id: int) -> Dict[str, Any]:
        return self.review_user(user_id, self.user_model.STATUS_BANNED)

    def unban_user(self, user_id: int) -> Dict[str, Any]:
        return self.review_user(user_id, self.user_model.STATUS_ACTIVE)

    def get_statistics(self) -> Dict[str, Any]:
        total_users = self.user_model.count_users()
        pending_users = self.user_model.count_users(self.user_model.STATUS_PENDING)
        active_users = self.user_model.count_users(self.user_model.STATUS_ACTIVE)
        male_users = self.user_model.count_users(gender=1)
        female_users = self.user_model.count_users(gender=2)
        total_matches = self.match_model.count_matches(self.match_model.STATUS_ACTIVE)
        total_dates = self.date_model.count_dates()
        total_hearts = self.heart_model.count_hearts()
        pending_complaints = self.complaint_model.count_pending()

        pending_user_list = self.user_model.get_all(1, 5, self.user_model.STATUS_PENDING)
        pending_user_items = [self.user_model.to_public_dict(item) for item in pending_user_list.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'statistics': {
                    'total_users': total_users,
                    'pending_users': pending_users,
                    'active_users': active_users,
                    'male_users': male_users,
                    'female_users': female_users,
                    'total_matches': total_matches,
                    'total_dates': total_dates,
                    'total_hearts': total_hearts,
                    'pending_complaints': pending_complaints
                },
                'pending_users': pending_user_items
            }
        }
