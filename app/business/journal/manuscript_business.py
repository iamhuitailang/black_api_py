import os
import uuid
from typing import Dict, Any, Optional
from fastapi import UploadFile
from app.model.journal import (
    ManuscriptModel, ManuscriptStatus, ReviewAssignmentModel,
    ReviewAssignmentStatus, ReviewModel, UserProfileModel
)


class ManuscriptBusiness:
    def __init__(self):
        self.manuscript_model = ManuscriptModel()
        self.assignment_model = ReviewAssignmentModel()
        self.review_model = ReviewModel()
        self.profile_model = UserProfileModel()
        self.upload_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            'static', 'journal', 'uploads'
        )
        os.makedirs(self.upload_dir, exist_ok=True)

    def save_file(self, file: UploadFile, user_id: int) -> Dict[str, Any]:
        if not file or not file.filename:
            return {
                'code': 1,
                'message': '文件不能为空',
                'data': None
            }

        ext = os.path.splitext(file.filename)[1].lower()
        allowed_exts = ['.pdf', '.doc', '.docx', '.txt', '.tex', '.zip']
        if ext not in allowed_exts:
            return {
                'code': 1,
                'message': f'不支持的文件格式，仅支持: {", ".join(allowed_exts)}',
                'data': None
            }

        max_size = 50 * 1024 * 1024
        unique_name = f"{user_id}_{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(self.upload_dir, unique_name)

        try:
            content = file.file.read()
            if len(content) > max_size:
                return {
                    'code': 1,
                    'message': f'文件大小超过限制({max_size // 1024 // 1024}MB)',
                    'data': None
                }
            with open(file_path, 'wb') as f:
                f.write(content)
        except Exception as e:
            return {
                'code': 1,
                'message': f'文件保存失败: {str(e)}',
                'data': None
            }

        rel_path = f"/static/journal/uploads/{unique_name}"
        return {
            'code': 0,
            'message': '上传成功',
            'data': {
                'file_path': rel_path,
                'file_name': file.filename
            }
        }

    def create_manuscript(self, title: str, abstract: str, file_path: str,
                          file_name: str, keywords: str, section_id: int,
                          user_id: int, author_name: str = '', author_email: str = '',
                          author_phone: str = '', author_affiliation: str = '') -> Dict[str, Any]:
        if not title or not title.strip():
            return {'code': 1, 'message': '标题不能为空', 'data': None}
        if not section_id or section_id <= 0:
            return {'code': 1, 'message': '请选择栏目', 'data': None}
        if not file_path:
            return {'code': 1, 'message': '请上传正文文件', 'data': None}

        profile = self.profile_model.get_by_user_id(user_id)
        if profile:
            if not author_name:
                author_name = profile.get('real_name', '')
            if not author_email:
                author_email = profile.get('email', '')
            if not author_affiliation:
                author_affiliation = profile.get('affiliation', '')
            if not author_phone:
                author_phone = profile.get('phone', '')

        manuscript_id = self.manuscript_model.create(
            title=title.strip(),
            abstract=abstract,
            file_path=file_path,
            file_name=file_name,
            keywords=keywords,
            section_id=section_id,
            author_user_id=user_id,
            author_name=author_name,
            author_email=author_email,
            author_phone=author_phone,
            author_affiliation=author_affiliation
        )

        return {
            'code': 0,
            'message': '创建成功',
            'data': {'id': manuscript_id}
        }

    def submit_manuscript(self, manuscript_id: int, user_id: int) -> Dict[str, Any]:
        manuscript = self.manuscript_model.get_by_id(manuscript_id)
        if not manuscript:
            return {'code': 1, 'message': '稿件不存在', 'data': None}
        if manuscript['author_user_id'] != user_id:
            return {'code': 1, 'message': '无权限操作', 'data': None}
        if manuscript['status'] != ManuscriptStatus.DRAFT:
            return {'code': 1, 'message': '当前状态无法提交', 'data': None}

        if not manuscript.get('title'):
            return {'code': 1, 'message': '标题不能为空', 'data': None}
        if not manuscript.get('file_path'):
            return {'code': 1, 'message': '请上传正文文件', 'data': None}
        if not manuscript.get('section_id') or manuscript.get('section_id') <= 0:
            return {'code': 1, 'message': '请选择栏目', 'data': None}

        affected = self.manuscript_model.update_status(manuscript_id, ManuscriptStatus.SUBMITTED)
        if affected > 0:
            return {
                'code': 0,
                'message': '提交成功，等待编辑分配审稿人',
                'data': None
            }
        return {'code': 1, 'message': '提交失败', 'data': None}

    def get_manuscript_detail(self, manuscript_id: int, user_id: int = None) -> Dict[str, Any]:
        manuscript = self.manuscript_model.get_by_id(manuscript_id)
        if not manuscript:
            return {'code': 1, 'message': '稿件不存在', 'data': None}

        if user_id is not None:
            is_author = manuscript['author_user_id'] == user_id
            is_editor = self.profile_model.is_editor_or_admin(user_id)
            is_reviewer = self.assignment_model.query.exists({
                'manuscript_id': manuscript_id,
                'reviewer_user_id': user_id
            })
            if not (is_author or is_editor or is_reviewer):
                return {'code': 1, 'message': '无权限查看', 'data': None}

        status = manuscript.get('status', ManuscriptStatus.DRAFT)
        step = ManuscriptStatus.STEP_MAP.get(status, 1)
        status_label = ManuscriptStatus.STATUS_MAP.get(status, status)

        assignments = self.assignment_model.get_by_manuscript(manuscript_id)
        reviews = self.review_model.get_by_manuscript(manuscript_id)
        avg_score = self.review_model.get_average_score_by_manuscript(manuscript_id)

        reviews_data = []
        for review in reviews:
            assignment = next((a for a in assignments if a['id'] == review['assignment_id']), {})
            reviews_data.append({
                **review,
                'recommendation_label': self._get_recommendation_label(review.get('recommendation', '')),
                'assignment_status': assignment.get('status', '')
            })

        show_reviews_to_author = status in [
            ManuscriptStatus.REVIEW_COMPLETED,
            ManuscriptStatus.ACCEPTED,
            ManuscriptStatus.REVISION_REQUIRED,
            ManuscriptStatus.REJECTED,
            ManuscriptStatus.PUBLISHED
        ]

        author_visible_reviews = []
        if show_reviews_to_author:
            author_visible_reviews = [
                {k: v for k, v in r.items() if k != 'comment_to_editor'}
                for r in reviews_data
            ]

        result = {
            **manuscript,
            'status_label': status_label,
            'current_step': step,
            'total_steps': ManuscriptStatus.TOTAL_STEPS,
            'step_names': ManuscriptStatus.STEP_NAMES,
            'assignments': assignments if (self.profile_model.is_editor_or_admin(user_id) if user_id else True) else [],
            'reviews': reviews_data if (self.profile_model.is_editor_or_admin(user_id) if user_id else True) else author_visible_reviews,
            'avg_score': avg_score,
            'editor_decision_label': self._get_decision_label(manuscript.get('editor_decision', ''))
        }

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def _get_recommendation_label(self, recommendation: str) -> str:
        from app.model.journal import ReviewRecommendation
        return ReviewRecommendation.LABEL_MAP.get(recommendation, recommendation) if recommendation else ''

    def _get_decision_label(self, decision: str) -> str:
        return ManuscriptStatus.STATUS_MAP.get(decision, decision) if decision else ''

    def update_manuscript(self, manuscript_id: int, user_id: int, **kwargs) -> Dict[str, Any]:
        manuscript = self.manuscript_model.get_by_id(manuscript_id)
        if not manuscript:
            return {'code': 1, 'message': '稿件不存在', 'data': None}
        if manuscript['author_user_id'] != user_id:
            return {'code': 1, 'message': '无权限操作', 'data': None}
        if manuscript['status'] != ManuscriptStatus.DRAFT:
            return {'code': 1, 'message': '当前状态无法修改，如需修改请联系编辑', 'data': None}

        allowed_fields = ['title', 'abstract', 'file_path', 'file_name', 'keywords',
                          'section_id', 'author_name', 'author_email',
                          'author_phone', 'author_affiliation']
        update_data = {k: v for k, v in kwargs.items() if k in allowed_fields and v is not None}

        if not update_data:
            return {'code': 1, 'message': '没有需要更新的字段', 'data': None}

        affected = self.manuscript_model.update(manuscript_id, **update_data)
        if affected > 0:
            return {'code': 0, 'message': '更新成功', 'data': None}
        return {'code': 1, 'message': '更新失败', 'data': None}

    def get_author_submissions(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.manuscript_model.paginate_by_author(user_id, page, page_size)
        items = []
        for item in result['items']:
            status = item.get('status', ManuscriptStatus.DRAFT)
            items.append({
                **item,
                'status_label': ManuscriptStatus.STATUS_MAP.get(status, status),
                'current_step': ManuscriptStatus.STEP_MAP.get(status, 1)
            })
        result['items'] = items
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def delete_manuscript(self, manuscript_id: int, user_id: int) -> Dict[str, Any]:
        manuscript = self.manuscript_model.get_by_id(manuscript_id)
        if not manuscript:
            return {'code': 1, 'message': '稿件不存在', 'data': None}
        if manuscript['author_user_id'] != user_id:
            return {'code': 1, 'message': '无权限操作', 'data': None}
        if manuscript['status'] != ManuscriptStatus.DRAFT:
            return {'code': 1, 'message': '已提交的稿件无法删除', 'data': None}

        file_path = manuscript.get('file_path', '')
        if file_path and file_path.startswith('/static/'):
            abs_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                file_path.lstrip('/')
            )
            if os.path.exists(abs_path):
                try:
                    os.remove(abs_path)
                except:
                    pass

        affected = self.manuscript_model.delete(manuscript_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}
