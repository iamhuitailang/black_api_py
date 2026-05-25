from typing import Dict, Any, Optional
from app.model.tucao import AdminModel, TucaoAdminTokenModel, PostModel, ReportModel, UserModel


class TucaoAdminBusiness:
    def __init__(self):
        self.admin_model = AdminModel()
        self.token_model = TucaoAdminTokenModel()
        self.post_model = PostModel()
        self.report_model = ReportModel()
        self.user_model = UserModel()

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not username:
            return {
                'code': 1,
                'msg': '用户名不能为空',
                'data': None
            }

        if not password:
            return {
                'code': 1,
                'msg': '密码不能为空',
                'data': None
            }

        admin = self.admin_model.verify_password(username, password)
        if admin is None:
            return {
                'code': 1,
                'msg': '用户名或密码错误',
                'data': None
            }

        if admin.get('status') == self.admin_model.STATUS_DISABLED:
            return {
                'code': 1,
                'msg': '账号已被禁用',
                'data': None
            }

        self.token_model.delete_by_admin_id(admin.get('id'))
        token = self.token_model.create_token(admin.get('id'), hours=24)

        admin_full = self.admin_model.get_by_id(admin.get('id'))
        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'admin': self.admin_model.to_dict(admin_full),
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

        self.token_model.delete_token(token)
        return {
            'code': 0,
            'msg': '退出成功',
            'data': None
        }

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.token_model.get_admin_by_token(token)

    def get_current_admin(self, token: str) -> Dict[str, Any]:
        admin = self.token_model.get_admin_by_token(token)
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

    def change_password(self, admin_id: int, old_password: str,
                        new_password: str) -> Dict[str, Any]:
        admin = self.admin_model.get_by_id(admin_id)
        if not admin:
            return {
                'code': 1,
                'msg': '管理员不存在',
                'data': None
            }

        username = admin.get('username', '')
        verify_result = self.admin_model.verify_password(username, old_password)
        if verify_result is None:
            return {
                'code': 1,
                'msg': '原密码错误',
                'data': None
            }

        if not new_password or len(new_password) < 6:
            return {
                'code': 1,
                'msg': '新密码长度至少6位',
                'data': None
            }

        affected = self.admin_model.update_password(admin_id, new_password)
        if affected > 0:
            self.token_model.delete_by_admin_id(admin_id)
            return {
                'code': 0,
                'msg': '密码修改成功，请重新登录',
                'data': None
            }

        return {
            'code': 1,
            'msg': '密码修改失败',
            'data': None
        }

    def get_report_list(self, page: int = 1, page_size: int = 10,
                        status: int = None) -> Dict[str, Any]:
        result = self.report_model.get_list(page, page_size, status)
        items = [self.report_model.to_dict(r) for r in result.get('items', [])]

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

    def handle_report(self, report_id: int, status: int) -> Dict[str, Any]:
        report = self.report_model.get_by_id(report_id)
        if not report:
            return {
                'code': 1,
                'msg': '举报不存在',
                'data': None
            }

        affected = self.report_model.update_status(report_id, status)
        if affected > 0:
            if status == self.report_model.STATUS_RESOLVED:
                if report.get('target_type') == self.report_model.TYPE_POST:
                    self.post_model.soft_delete(report.get('target_id'))

            return {
                'code': 0,
                'msg': '处理成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '处理失败',
            'data': None
        }

    def get_dashboard_stats(self) -> Dict[str, Any]:
        post_stats = self.post_model.get_statistics()

        today_reports = self.report_model.get_list(page=1, page_size=1)
        report_total = today_reports.get('total', 0)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'post_stats': post_stats,
                'report_total': report_total
            }
        }
