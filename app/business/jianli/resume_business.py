from typing import Dict, Any, List, Optional
from app.model.jianli import (
    ResumeModel, ResumeEducationModel, ResumeWorkModel,
    ResumeProjectModel, ResumeSkillModel, TemplateModel, UserModel
)


class ResumeBusiness:
    def __init__(self):
        self.resume_model = ResumeModel()
        self.education_model = ResumeEducationModel()
        self.work_model = ResumeWorkModel()
        self.project_model = ResumeProjectModel()
        self.skill_model = ResumeSkillModel()
        self.template_model = TemplateModel()
        self.user_model = UserModel()

    def create(self, user_id: int, title: str, template_id: int = 0) -> Dict[str, Any]:
        if not title:
            return {
                'code': 1,
                'msg': '简历标题不能为空',
                'data': None
            }

        max_resume = 10
        count = self.resume_model.count_by_user_id(user_id)
        if count >= max_resume:
            return {
                'code': 1,
                'msg': f'最多只能创建{max_resume}份简历',
                'data': None
            }

        resume_id = self.resume_model.create(user_id, title, template_id)
        if resume_id > 0:
            if template_id > 0:
                self.template_model.increment_use_count(template_id)
            resume = self.resume_model.get_by_id(resume_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.resume_model.to_public_dict(resume)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update(self, user_id: int, resume_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        resume = self.resume_model.get_by_user_and_id(user_id, resume_id)
        if not resume:
            return {
                'code': 1,
                'msg': '简历不存在或无权限',
                'data': None
            }

        old_template_id = resume.get('template_id', 0)
        new_template_id = data.get('template_id', old_template_id)
        if new_template_id != old_template_id and new_template_id > 0:
            self.template_model.increment_use_count(new_template_id)

        affected = self.resume_model.update(resume_id, data)
        if affected >= 0:
            updated = self.resume_model.get_by_id(resume_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.resume_model.to_public_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete(self, user_id: int, resume_id: int) -> Dict[str, Any]:
        resume = self.resume_model.get_by_user_and_id(user_id, resume_id)
        if not resume:
            return {
                'code': 1,
                'msg': '简历不存在或无权限',
                'data': None
            }

        affected = self.resume_model.delete(resume_id)
        if affected > 0:
            self.education_model.delete_by_resume_id(resume_id)
            self.work_model.delete_by_resume_id(resume_id)
            self.project_model.delete_by_resume_id(resume_id)
            self.skill_model.delete_by_resume_id(resume_id)
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

    def get_detail(self, user_id: int, resume_id: int) -> Dict[str, Any]:
        resume = self.resume_model.get_by_user_and_id(user_id, resume_id)
        if not resume:
            return {
                'code': 1,
                'msg': '简历不存在或无权限',
                'data': None
            }

        educations = self.education_model.get_by_resume_id(resume_id)
        works = self.work_model.get_by_resume_id(resume_id)
        projects = self.project_model.get_by_resume_id(resume_id)
        skills = self.skill_model.get_by_resume_id(resume_id)

        basic_info = {
            'name': resume.get('name', ''),
            'gender': resume.get('gender', ''),
            'phone': resume.get('phone', ''),
            'email': resume.get('email', ''),
            'birthday': resume.get('birthday', ''),
            'address': resume.get('address', ''),
            'avatar': resume.get('avatar', ''),
            'job_intention': resume.get('job_intention', ''),
            'expected_salary': resume.get('expected_salary', ''),
            'work_years': resume.get('work_years', ''),
            'self_evaluation': resume.get('self_evaluation', '')
        }

        education_list = []
        for e in educations:
            edu = self.education_model.to_public_dict(e)
            education_list.append({
                'id': edu.get('id'),
                'school': edu.get('school_name', ''),
                'major': edu.get('major', ''),
                'degree': edu.get('degree', ''),
                'start_time': edu.get('start_date', ''),
                'end_time': edu.get('end_date', ''),
                'description': edu.get('description', ''),
                'sort_order': edu.get('sort_order', 0)
            })

        work_list = []
        for w in works:
            work = self.work_model.to_public_dict(w)
            work_list.append({
                'id': work.get('id'),
                'company': work.get('company_name', ''),
                'position': work.get('position', ''),
                'start_time': work.get('start_date', ''),
                'end_time': work.get('end_date', ''),
                'description': work.get('description', ''),
                'achievements': work.get('achievements', ''),
                'sort_order': work.get('sort_order', 0)
            })

        project_list = []
        for p in projects:
            proj = self.project_model.to_public_dict(p)
            project_list.append({
                'id': proj.get('id'),
                'name': proj.get('project_name', ''),
                'role': proj.get('role', ''),
                'start_time': proj.get('start_date', ''),
                'end_time': proj.get('end_date', ''),
                'description': proj.get('description', ''),
                'responsibilities': proj.get('responsibilities', ''),
                'technologies': proj.get('responsibilities', ''),
                'achievements': proj.get('achievements', ''),
                'sort_order': proj.get('sort_order', 0)
            })

        skill_list = []
        for s in skills:
            skill = self.skill_model.to_public_dict(s)
            skill_list.append({
                'id': skill.get('id'),
                'name': skill.get('skill_name', ''),
                'level': skill.get('skill_level', 0),
                'description': skill.get('description', ''),
                'sort_order': skill.get('sort_order', 0)
            })

        result = {
            'id': resume.get('id'),
            'user_id': resume.get('user_id'),
            'template_id': resume.get('template_id'),
            'title': resume.get('title'),
            'status': resume.get('status'),
            'status_text': resume.get('status_text'),
            'download_count': resume.get('download_count'),
            'last_edited_at': resume.get('last_edited_at'),
            'created_at': resume.get('created_at'),
            'basic_info': basic_info,
            'education_list': education_list,
            'work_list': work_list,
            'project_list': project_list,
            'skill_list': skill_list
        }

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_list(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.resume_model.get_by_user_id(user_id, page, page_size)
        items = [self.resume_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_all_list(self, page: int = 1, page_size: int = 10,
                     user_id: int = None, status: int = None,
                     keyword: str = None) -> Dict[str, Any]:
        result = self.resume_model.get_all(page, page_size, user_id, status, keyword)
        items = []
        for item in result.get('items', []):
            resume_dict = self.resume_model.to_public_dict(item)
            user = self.user_model.get_by_id(item.get('user_id', 0))
            if user:
                resume_dict['username'] = user.get('username', '')
                resume_dict['nickname'] = user.get('nickname', '')
            items.append(resume_dict)

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

    def delete_by_admin(self, resume_id: int) -> Dict[str, Any]:
        resume = self.resume_model.get_by_id(resume_id)
        if not resume:
            return {
                'code': 1,
                'msg': '简历不存在',
                'data': None
            }

        affected = self.resume_model.delete(resume_id)
        if affected > 0:
            self.education_model.delete_by_resume_id(resume_id)
            self.work_model.delete_by_resume_id(resume_id)
            self.project_model.delete_by_resume_id(resume_id)
            self.skill_model.delete_by_resume_id(resume_id)
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

    def increment_download_count(self, user_id: int, resume_id: int) -> Dict[str, Any]:
        resume = self.resume_model.get_by_user_and_id(user_id, resume_id)
        if not resume:
            return {
                'code': 1,
                'msg': '简历不存在或无权限',
                'data': None
            }

        self.resume_model.increment_download_count(resume_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': None
        }

    def add_education(self, user_id: int, resume_id: int, school_name: str,
                      major: str = '', degree: str = '', start_date: str = '',
                      end_date: str = '', description: str = '',
                      sort_order: int = 0) -> Dict[str, Any]:
        resume = self.resume_model.get_by_user_and_id(user_id, resume_id)
        if not resume:
            return {
                'code': 1,
                'msg': '简历不存在或无权限',
                'data': None
            }

        if not school_name:
            return {
                'code': 1,
                'msg': '学校名称不能为空',
                'data': None
            }

        record_id = self.education_model.create(
            resume_id, user_id, school_name, major, degree,
            start_date, end_date, description, sort_order
        )
        if record_id > 0:
            record = self.education_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '添加成功',
                'data': self.education_model.to_public_dict(record)
            }

        return {
            'code': 1,
            'msg': '添加失败',
            'data': None
        }

    def update_education(self, user_id: int, record_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        record = self.education_model.get_by_user_and_id(user_id, record_id)
        if not record:
            return {
                'code': 1,
                'msg': '记录不存在或无权限',
                'data': None
            }

        affected = self.education_model.update(record_id, data)
        if affected >= 0:
            updated = self.education_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.education_model.to_public_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_education(self, user_id: int, record_id: int) -> Dict[str, Any]:
        record = self.education_model.get_by_user_and_id(user_id, record_id)
        if not record:
            return {
                'code': 1,
                'msg': '记录不存在或无权限',
                'data': None
            }

        affected = self.education_model.delete(record_id)
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

    def add_work(self, user_id: int, resume_id: int, company_name: str,
                 position: str = '', start_date: str = '', end_date: str = '',
                 description: str = '', achievements: str = '',
                 sort_order: int = 0) -> Dict[str, Any]:
        resume = self.resume_model.get_by_user_and_id(user_id, resume_id)
        if not resume:
            return {
                'code': 1,
                'msg': '简历不存在或无权限',
                'data': None
            }

        if not company_name:
            return {
                'code': 1,
                'msg': '公司名称不能为空',
                'data': None
            }

        record_id = self.work_model.create(
            resume_id, user_id, company_name, position,
            start_date, end_date, description, achievements, sort_order
        )
        if record_id > 0:
            record = self.work_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '添加成功',
                'data': self.work_model.to_public_dict(record)
            }

        return {
            'code': 1,
            'msg': '添加失败',
            'data': None
        }

    def update_work(self, user_id: int, record_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        record = self.work_model.get_by_user_and_id(user_id, record_id)
        if not record:
            return {
                'code': 1,
                'msg': '记录不存在或无权限',
                'data': None
            }

        affected = self.work_model.update(record_id, data)
        if affected >= 0:
            updated = self.work_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.work_model.to_public_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_work(self, user_id: int, record_id: int) -> Dict[str, Any]:
        record = self.work_model.get_by_user_and_id(user_id, record_id)
        if not record:
            return {
                'code': 1,
                'msg': '记录不存在或无权限',
                'data': None
            }

        affected = self.work_model.delete(record_id)
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

    def add_project(self, user_id: int, resume_id: int, project_name: str,
                    role: str = '', start_date: str = '', end_date: str = '',
                    description: str = '', responsibilities: str = '',
                    achievements: str = '', sort_order: int = 0) -> Dict[str, Any]:
        resume = self.resume_model.get_by_user_and_id(user_id, resume_id)
        if not resume:
            return {
                'code': 1,
                'msg': '简历不存在或无权限',
                'data': None
            }

        if not project_name:
            return {
                'code': 1,
                'msg': '项目名称不能为空',
                'data': None
            }

        record_id = self.project_model.create(
            resume_id, user_id, project_name, role, start_date, end_date,
            description, responsibilities, achievements, sort_order
        )
        if record_id > 0:
            record = self.project_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '添加成功',
                'data': self.project_model.to_public_dict(record)
            }

        return {
            'code': 1,
            'msg': '添加失败',
            'data': None
        }

    def update_project(self, user_id: int, record_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        record = self.project_model.get_by_user_and_id(user_id, record_id)
        if not record:
            return {
                'code': 1,
                'msg': '记录不存在或无权限',
                'data': None
            }

        affected = self.project_model.update(record_id, data)
        if affected >= 0:
            updated = self.project_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.project_model.to_public_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_project(self, user_id: int, record_id: int) -> Dict[str, Any]:
        record = self.project_model.get_by_user_and_id(user_id, record_id)
        if not record:
            return {
                'code': 1,
                'msg': '记录不存在或无权限',
                'data': None
            }

        affected = self.project_model.delete(record_id)
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

    def add_skill(self, user_id: int, resume_id: int, skill_name: str,
                  skill_level: int = 0, description: str = '',
                  sort_order: int = 0) -> Dict[str, Any]:
        resume = self.resume_model.get_by_user_and_id(user_id, resume_id)
        if not resume:
            return {
                'code': 1,
                'msg': '简历不存在或无权限',
                'data': None
            }

        if not skill_name:
            return {
                'code': 1,
                'msg': '技能名称不能为空',
                'data': None
            }

        record_id = self.skill_model.create(
            resume_id, user_id, skill_name, skill_level, description, sort_order
        )
        if record_id > 0:
            record = self.skill_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '添加成功',
                'data': self.skill_model.to_public_dict(record)
            }

        return {
            'code': 1,
            'msg': '添加失败',
            'data': None
        }

    def update_skill(self, user_id: int, record_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        record = self.skill_model.get_by_user_and_id(user_id, record_id)
        if not record:
            return {
                'code': 1,
                'msg': '记录不存在或无权限',
                'data': None
            }

        affected = self.skill_model.update(record_id, data)
        if affected >= 0:
            updated = self.skill_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.skill_model.to_public_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_skill(self, user_id: int, record_id: int) -> Dict[str, Any]:
        record = self.skill_model.get_by_user_and_id(user_id, record_id)
        if not record:
            return {
                'code': 1,
                'msg': '记录不存在或无权限',
                'data': None
            }

        affected = self.skill_model.delete(record_id)
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
