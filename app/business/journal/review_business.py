from typing import Dict, Any, List
from app.model.journal import (
    ManuscriptModel, ManuscriptStatus, ReviewAssignmentModel,
    ReviewAssignmentStatus, ReviewModel, ReviewRecommendation,
    UserProfileModel, UserRole
)


class ReviewBusiness:
    def __init__(self):
        self.manuscript_model = ManuscriptModel()
        self.assignment_model = ReviewAssignmentModel()
        self.review_model = ReviewModel()
        self.profile_model = UserProfileModel()

    def assign_reviewer(self, manuscript_id: int, reviewer_user_id: int,
                        assigned_by: int) -> Dict[str, Any]:
        if not self.profile_model.is_editor_or_admin(assigned_by):
            return {'code': 1, 'message': '无权限分配审稿人', 'data': None}

        manuscript = self.manuscript_model.get_by_id(manuscript_id)
        if not manuscript:
            return {'code': 1, 'message': '稿件不存在', 'data': None}

        if manuscript['author_user_id'] == reviewer_user_id:
            return {'code': 1, 'message': '不能分配给稿件作者', 'data': None}

        if self.assignment_model.exists(manuscript_id, reviewer_user_id):
            return {'code': 1, 'message': '该审稿人已被分配此稿件', 'data': None}

        reviewer_profile = self.profile_model.get_by_user_id(reviewer_user_id)
        reviewer_name = reviewer_profile.get('real_name', '') if reviewer_profile else ''

        assignment_id = self.assignment_model.create(
            manuscript_id=manuscript_id,
            reviewer_user_id=reviewer_user_id,
            reviewer_name=reviewer_name
        )

        current_status = manuscript.get('status', ManuscriptStatus.SUBMITTED)
        if current_status in [ManuscriptStatus.SUBMITTED]:
            self.manuscript_model.update_status(manuscript_id, ManuscriptStatus.UNDER_REVIEW)

        return {
            'code': 0,
            'message': '分配成功',
            'data': {'assignment_id': assignment_id}
        }

    def remove_assignment(self, assignment_id: int, operator_id: int) -> Dict[str, Any]:
        if not self.profile_model.is_editor_or_admin(operator_id):
            return {'code': 1, 'message': '无权限操作', 'data': None}

        assignment = self.assignment_model.get_by_id(assignment_id)
        if not assignment:
            return {'code': 1, 'message': '分配记录不存在', 'data': None}

        if assignment.get('status') == ReviewAssignmentStatus.COMPLETED:
            return {'code': 1, 'message': '已完成审稿的分配无法撤销', 'data': None}

        affected = self.assignment_model.delete(assignment_id)
        if affected > 0:
            return {'code': 0, 'message': '撤销成功', 'data': None}
        return {'code': 1, 'message': '撤销失败', 'data': None}

    def accept_assignment(self, assignment_id: int, reviewer_user_id: int) -> Dict[str, Any]:
        assignment = self.assignment_model.get_by_id(assignment_id)
        if not assignment:
            return {'code': 1, 'message': '分配记录不存在', 'data': None}
        if assignment['reviewer_user_id'] != reviewer_user_id:
            return {'code': 1, 'message': '无权限操作', 'data': None}
        if assignment['status'] != ReviewAssignmentStatus.PENDING:
            return {'code': 1, 'message': '当前状态无法接受', 'data': None}

        affected = self.assignment_model.update_status(assignment_id, ReviewAssignmentStatus.ACCEPTED)
        if affected > 0:
            return {'code': 0, 'message': '已接受审稿任务', 'data': None}
        return {'code': 1, 'message': '操作失败', 'data': None}

    def decline_assignment(self, assignment_id: int, reviewer_user_id: int) -> Dict[str, Any]:
        assignment = self.assignment_model.get_by_id(assignment_id)
        if not assignment:
            return {'code': 1, 'message': '分配记录不存在', 'data': None}
        if assignment['reviewer_user_id'] != reviewer_user_id:
            return {'code': 1, 'message': '无权限操作', 'data': None}
        if assignment['status'] not in [ReviewAssignmentStatus.PENDING, ReviewAssignmentStatus.ACCEPTED]:
            return {'code': 1, 'message': '当前状态无法拒绝', 'data': None}

        affected = self.assignment_model.update_status(assignment_id, ReviewAssignmentStatus.DECLINED)
        if affected > 0:
            return {'code': 0, 'message': '已拒绝审稿任务', 'data': None}
        return {'code': 1, 'message': '操作失败', 'data': None}

    def submit_review(self, assignment_id: int, reviewer_user_id: int,
                      recommendation: str, originality_score: int,
                      scientific_score: int, language_score: int,
                      overall_score: int, comment_to_author: str = '',
                      comment_to_editor: str = '') -> Dict[str, Any]:
        assignment = self.assignment_model.get_by_id(assignment_id)
        if not assignment:
            return {'code': 1, 'message': '分配记录不存在', 'data': None}
        if assignment['reviewer_user_id'] != reviewer_user_id:
            return {'code': 1, 'message': '无权限操作', 'data': None}
        if assignment['status'] not in [ReviewAssignmentStatus.PENDING, ReviewAssignmentStatus.ACCEPTED]:
            return {'code': 1, 'message': '当前状态无法提交审稿意见', 'data': None}

        valid_recommendations = [
            ReviewRecommendation.ACCEPT,
            ReviewRecommendation.MINOR_REVISION,
            ReviewRecommendation.MAJOR_REVISION,
            ReviewRecommendation.REJECT
        ]
        if recommendation not in valid_recommendations:
            return {'code': 1, 'message': '无效的审稿建议', 'data': None}

        for score_name, score in [
            ('原创性', originality_score),
            ('科学性', scientific_score),
            ('语言', language_score),
            ('综合', overall_score)
        ]:
            if not (1 <= score <= 10):
                return {'code': 1, 'message': f'{score_name}评分必须在1-10之间', 'data': None}

        if not comment_to_author or not comment_to_author.strip():
            return {'code': 1, 'message': '请填写给作者的审稿意见', 'data': None}

        manuscript_id = assignment['manuscript_id']
        reviewer_profile = self.profile_model.get_by_user_id(reviewer_user_id)
        reviewer_name = reviewer_profile.get('real_name', '') if reviewer_profile else ''

        if self.review_model.exists_by_assignment(assignment_id):
            review = self.review_model.get_by_assignment(assignment_id)
            self.review_model.update(
                record_id=review['id'],
                recommendation=recommendation,
                originality_score=originality_score,
                scientific_score=scientific_score,
                language_score=language_score,
                overall_score=overall_score,
                comment_to_author=comment_to_author,
                comment_to_editor=comment_to_editor
            )
            review_id = review['id']
        else:
            review_id = self.review_model.create(
                manuscript_id=manuscript_id,
                assignment_id=assignment_id,
                reviewer_user_id=reviewer_user_id,
                reviewer_name=reviewer_name,
                recommendation=recommendation,
                originality_score=originality_score,
                scientific_score=scientific_score,
                language_score=language_score,
                overall_score=overall_score,
                comment_to_author=comment_to_author,
                comment_to_editor=comment_to_editor
            )

        self.assignment_model.update_status(assignment_id, ReviewAssignmentStatus.COMPLETED)

        assignments = self.assignment_model.get_by_manuscript(manuscript_id)
        all_completed = all(
            a['status'] in [ReviewAssignmentStatus.COMPLETED, ReviewAssignmentStatus.DECLINED]
            for a in assignments
        )
        has_completed = any(a['status'] == ReviewAssignmentStatus.COMPLETED for a in assignments)

        if all_completed and has_completed:
            self.manuscript_model.update_status(manuscript_id, ManuscriptStatus.REVIEW_COMPLETED)

        return {
            'code': 0,
            'message': '审稿意见提交成功',
            'data': {'review_id': review_id}
        }

    def get_reviewer_tasks(self, reviewer_user_id: int, status: str = None,
                           page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        if status:
            assignments = self.assignment_model.get_by_reviewer_and_status(reviewer_user_id, status)
            total = len(assignments)
            start = (page - 1) * page_size
            assignments = assignments[start:start + page_size]
        else:
            result = self.assignment_model.paginate_by_reviewer(reviewer_user_id, page, page_size)
            assignments = result['items']
            total = result['total']

        items = []
        for assignment in assignments:
            manuscript = self.manuscript_model.get_by_id(assignment['manuscript_id'])
            if not manuscript:
                continue
            review = self.review_model.get_by_assignment(assignment['id'])
            items.append({
                'assignment': assignment,
                'assignment_status_label': self._get_assignment_status_label(assignment['status']),
                'manuscript': {
                    'id': manuscript['id'],
                    'title': manuscript['title'],
                    'abstract': manuscript['abstract'],
                    'keywords': manuscript['keywords'],
                    'author_name': manuscript['author_name'],
                    'file_path': manuscript['file_path'],
                    'file_name': manuscript['file_name'],
                    'status': manuscript['status'],
                    'status_label': ManuscriptStatus.STATUS_MAP.get(manuscript['status'], manuscript['status']),
                    'submitted_at': manuscript.get('submitted_at', '')
                },
                'review': review,
                'recommendation_label': ReviewRecommendation.LABEL_MAP.get(
                    review.get('recommendation', ''), ''
                ) if review else ''
            })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': items,
                'total': total,
                'page': page,
                'page_size': page_size
            }
        }

    def get_reviewer_task_stats(self, reviewer_user_id: int) -> Dict[str, Any]:
        pending = self.assignment_model.count_pending_by_reviewer(reviewer_user_id)
        active = self.assignment_model.count_active_by_reviewer(reviewer_user_id)
        total = self.assignment_model.query.count({'reviewer_user_id': reviewer_user_id})

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'pending': pending,
                'active': active,
                'total': total
            }
        }

    def _get_assignment_status_label(self, status: str) -> str:
        labels = {
            ReviewAssignmentStatus.PENDING: '待接受',
            ReviewAssignmentStatus.ACCEPTED: '已接受',
            ReviewAssignmentStatus.DECLINED: '已拒绝',
            ReviewAssignmentStatus.COMPLETED: '已完成'
        }
        return labels.get(status, status)

    def get_manuscript_assignments(self, manuscript_id: int, operator_id: int) -> Dict[str, Any]:
        if not self.profile_model.is_editor_or_admin(operator_id):
            return {'code': 1, 'message': '无权限查看', 'data': None}

        assignments = self.assignment_model.get_by_manuscript(manuscript_id)
        result = []
        for assignment in assignments:
            review = self.review_model.get_by_assignment(assignment['id'])
            result.append({
                **assignment,
                'status_label': self._get_assignment_status_label(assignment['status']),
                'review': review,
                'recommendation_label': ReviewRecommendation.LABEL_MAP.get(
                    review.get('recommendation', ''), ''
                ) if review else ''
            })

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_review_detail(self, review_id: int, operator_id: int) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {'code': 1, 'message': '审稿记录不存在', 'data': None}

        is_reviewer = review['reviewer_user_id'] == operator_id
        is_editor = self.profile_model.is_editor_or_admin(operator_id)
        manuscript = self.manuscript_model.get_by_id(review['manuscript_id'])
        is_author = manuscript and manuscript['author_user_id'] == operator_id

        if not (is_reviewer or is_editor or is_author):
            return {'code': 1, 'message': '无权限查看', 'data': None}

        data = {**review}
        if not is_editor and not is_reviewer:
            data.pop('comment_to_editor', None)
        data['recommendation_label'] = ReviewRecommendation.LABEL_MAP.get(
            review.get('recommendation', ''), ''
        )

        return {'code': 0, 'message': 'success', 'data': data}
