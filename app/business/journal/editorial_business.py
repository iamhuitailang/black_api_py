from typing import Dict, Any
from app.model.journal import (
    ManuscriptModel, ManuscriptStatus, UserProfileModel, UserRole
)


class EditorialBusiness:
    def __init__(self):
        self.manuscript_model = ManuscriptModel()
        self.profile_model = UserProfileModel()

    def _check_editor_permission(self, user_id: int) -> bool:
        return self.profile_model.is_editor_or_admin(user_id)

    def get_all_manuscripts(self, user_id: int, status: str = None,
                            page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        if not self._check_editor_permission(user_id):
            return {'code': 1, 'message': '无权限查看', 'data': None}

        if status:
            result = self.manuscript_model.paginate_by_status(status, page, page_size)
        else:
            result = self.manuscript_model.paginate_all(page, page_size)

        items = []
        for item in result['items']:
            s = item.get('status', ManuscriptStatus.DRAFT)
            items.append({
                **item,
                'status_label': ManuscriptStatus.STATUS_MAP.get(s, s),
                'current_step': ManuscriptStatus.STEP_MAP.get(s, 1)
            })
        result['items'] = items

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_manuscripts_by_status(self, user_id: int, status: str,
                                  page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.get_all_manuscripts(user_id, status, page, page_size)

    def make_editor_decision(self, manuscript_id: int, user_id: int,
                             decision: str, comment: str = '') -> Dict[str, Any]:
        if not self._check_editor_permission(user_id):
            return {'code': 1, 'message': '无权限操作', 'data': None}

        manuscript = self.manuscript_model.get_by_id(manuscript_id)
        if not manuscript:
            return {'code': 1, 'message': '稿件不存在', 'data': None}

        valid_decisions = [
            ManuscriptStatus.ACCEPTED,
            ManuscriptStatus.REVISION_REQUIRED,
            ManuscriptStatus.REJECTED
        ]
        if decision not in valid_decisions:
            return {'code': 1, 'message': '无效的编辑决定', 'data': None}

        if decision != ManuscriptStatus.REJECTED:
            if not comment or not comment.strip():
                return {'code': 1, 'message': '请填写编辑意见', 'data': None}

        affected = self.manuscript_model.set_editor_decision(manuscript_id, decision, comment)
        if affected > 0:
            return {
                'code': 0,
                'message': '编辑决定已发布',
                'data': None
            }
        return {'code': 1, 'message': '操作失败', 'data': None}

    def mark_as_published(self, manuscript_id: int, user_id: int) -> Dict[str, Any]:
        if not self._check_editor_permission(user_id):
            return {'code': 1, 'message': '无权限操作', 'data': None}

        manuscript = self.manuscript_model.get_by_id(manuscript_id)
        if not manuscript:
            return {'code': 1, 'message': '稿件不存在', 'data': None}

        if manuscript['status'] not in [ManuscriptStatus.ACCEPTED, ManuscriptStatus.REVISION_REQUIRED]:
            return {'code': 1, 'message': '当前状态无法标记为已发表', 'data': None}

        affected = self.manuscript_model.update_status(manuscript_id, ManuscriptStatus.PUBLISHED)
        if affected > 0:
            return {'code': 0, 'message': '已标记为发表', 'data': None}
        return {'code': 1, 'message': '操作失败', 'data': None}

    def request_revision(self, manuscript_id: int, user_id: int) -> Dict[str, Any]:
        if not self._check_editor_permission(user_id):
            return {'code': 1, 'message': '无权限操作', 'data': None}

        manuscript = self.manuscript_model.get_by_id(manuscript_id)
        if not manuscript:
            return {'code': 1, 'message': '稿件不存在', 'data': None}

        if manuscript['status'] != ManuscriptStatus.REVISION_REQUIRED:
            return {'code': 1, 'message': '当前状态无法退回修改', 'data': None}

        affected = self.manuscript_model.update_status(manuscript_id, ManuscriptStatus.DRAFT)
        if affected > 0:
            return {'code': 0, 'message': '已退回作者修改', 'data': None}
        return {'code': 1, 'message': '操作失败', 'data': None}

    def get_dashboard_stats(self, user_id: int) -> Dict[str, Any]:
        if not self._check_editor_permission(user_id):
            return {'code': 1, 'message': '无权限查看', 'data': None}

        all_statuses = [
            ManuscriptStatus.DRAFT,
            ManuscriptStatus.SUBMITTED,
            ManuscriptStatus.UNDER_REVIEW,
            ManuscriptStatus.REVIEW_COMPLETED,
            ManuscriptStatus.ACCEPTED,
            ManuscriptStatus.REVISION_REQUIRED,
            ManuscriptStatus.REJECTED,
            ManuscriptStatus.PUBLISHED
        ]

        stats = {}
        for s in all_statuses:
            count = self.manuscript_model.query.count({'status': s})
            stats[s] = {
                'count': count,
                'label': ManuscriptStatus.STATUS_MAP.get(s, s)
            }

        stats['total'] = sum(s['count'] for s in stats.values())

        return {
            'code': 0,
            'message': 'success',
            'data': stats
        }
