from typing import Dict, Any, List
from app.model.tousu_model import (
    UserModel, AnnouncementModel, NotificationModel,
    LogModel, EvaluationModel, ComplaintModel
)


class TousuAdminBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.announcement_model = AnnouncementModel()
        self.notification_model = NotificationModel()
        self.log_model = LogModel()
        self.evaluation_model = EvaluationModel()
        self.complaint_model = ComplaintModel()

    def create_user(self, username: str, phone: str, password: str,
                    role: str = 'student', nickname: str = '',
                    department_id: int = 0) -> Dict[str, Any]:
        if not username or not phone or not password:
            return {
                'code': 1,
                'msg': '用户名、手机号和密码不能为空',
                'data': None
            }

        existing = self.user_model.get_by_username(username)
        if existing:
            return {
                'code': 1,
                'msg': '用户名已存在',
                'data': None
            }

        existing_phone = self.user_model.get_by_phone(phone)
        if existing_phone:
            return {
                'code': 1,
                'msg': '手机号已存在',
                'data': None
            }

        user_id = self.user_model.create(username, phone, password, role, nickname, department_id)
        if user_id > 0:
            self.log_model.create(
                user_id=0,
                action=LogModel.TYPE_CREATE,
                target_type='user',
                target_id=user_id,
                description=f'创建用户: {username}'
            )
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.user_model.to_public_dict(self.user_model.get_by_id(user_id))
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_user(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.update_profile(user_id, data)
        if 'status' in data:
            self.user_model.update_status(user_id, data['status'])

        self.log_model.create(
            user_id=0,
            action=LogModel.TYPE_UPDATE,
            target_type='user',
            target_id=user_id,
            description='更新用户信息'
        )

        return {
            'code': 0,
            'msg': '更新成功',
            'data': self.user_model.to_public_dict(self.user_model.get_by_id(user_id))
        }

    def delete_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.delete(user_id)
        if affected > 0:
            self.log_model.create(
                user_id=0,
                action=LogModel.TYPE_DELETE,
                target_type='user',
                target_id=user_id,
                description=f'删除用户: {user.get("username", "")}'
            )
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

    def get_user_list(self, page: int = 1, page_size: int = 10,
                      role: str = None, status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.user_model.get_all(page, page_size, role, status, keyword)
        items = [self.user_model.to_public_dict(item) for item in result.get('items', [])]

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

    def create_announcement(self, title: str, content: str, publisher_id: int) -> Dict[str, Any]:
        if not title or not content:
            return {
                'code': 1,
                'msg': '标题和内容不能为空',
                'data': None
            }

        announcement_id = self.announcement_model.create(title, content, publisher_id)
        if announcement_id > 0:
            self.log_model.create(
                user_id=publisher_id,
                action=LogModel.TYPE_CREATE,
                target_type='announcement',
                target_id=announcement_id,
                description=f'创建公告: {title}'
            )
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.announcement_model.to_dict(self.announcement_model.get_by_id(announcement_id))
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_announcement(self, announcement_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        announcement = self.announcement_model.get_by_id(announcement_id)
        if not announcement:
            return {
                'code': 1,
                'msg': '公告不存在',
                'data': None
            }

        affected = self.announcement_model.update(announcement_id, data)
        if affected >= 0:
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.announcement_model.to_dict(self.announcement_model.get_by_id(announcement_id))
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def publish_announcement(self, announcement_id: int) -> Dict[str, Any]:
        announcement = self.announcement_model.get_by_id(announcement_id)
        if not announcement:
            return {
                'code': 1,
                'msg': '公告不存在',
                'data': None
            }

        affected = self.announcement_model.publish(announcement_id)
        if affected > 0:
            self.log_model.create(
                user_id=announcement.get('publisher_id', 0),
                action=LogModel.TYPE_UPDATE,
                target_type='announcement',
                target_id=announcement_id,
                description='发布公告'
            )
            return {
                'code': 0,
                'msg': '发布成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '发布失败',
            'data': None
        }

    def delete_announcement(self, announcement_id: int) -> Dict[str, Any]:
        announcement = self.announcement_model.get_by_id(announcement_id)
        if not announcement:
            return {
                'code': 1,
                'msg': '公告不存在',
                'data': None
            }

        affected = self.announcement_model.delete(announcement_id)
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

    def get_announcement_list(self, page: int = 1, page_size: int = 10,
                              status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.announcement_model.get_all(page, page_size, status, keyword)
        items = [self.announcement_model.to_dict(item) for item in result.get('items', [])]

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

    def get_published_announcements(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.announcement_model.get_published(page, page_size)
        items = [self.announcement_model.to_dict(item) for item in result.get('items', [])]

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

    def get_notifications(self, user_id: int, page: int = 1, page_size: int = 10,
                          is_read: int = None, notification_type: str = None) -> Dict[str, Any]:
        result = self.notification_model.get_by_user(user_id, page, page_size, is_read, notification_type)
        items = [self.notification_model.to_dict(item) for item in result.get('items', [])]

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

    def mark_notification_read(self, notification_id: int) -> Dict[str, Any]:
        affected = self.notification_model.mark_as_read(notification_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '标记成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '标记失败',
            'data': None
        }

    def mark_all_notifications_read(self, user_id: int) -> Dict[str, Any]:
        affected = self.notification_model.mark_all_as_read(user_id)
        return {
            'code': 0,
            'msg': f'已标记{affected}条通知为已读',
            'data': {'count': affected}
        }

    def get_unread_count(self, user_id: int) -> Dict[str, Any]:
        count = self.notification_model.get_unread_count(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {'count': count}
        }

    def get_logs(self, page: int = 1, page_size: int = 20,
                 user_id: int = None, action: str = None, keyword: str = None) -> Dict[str, Any]:
        result = self.log_model.get_all(page, page_size, user_id, action, keyword)
        items = [self.log_model.to_dict(item) for item in result.get('items', [])]

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

    def get_statistics(self, department_id: int = None) -> Dict[str, Any]:
        stats = self.complaint_model.get_statistics()
        eval_stats = self.evaluation_model.get_statistics(department_id)

        sql = f"SELECT role, COUNT(*) as count FROM tb_tousu_model_users GROUP BY role"
        user_stats = self.user_model.query.query_raw(sql)

        stats['evaluation'] = eval_stats
        stats['user_stats'] = user_stats

        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }