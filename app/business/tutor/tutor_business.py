from typing import Dict, Any, List, Optional
from app.model.auth import UserModel
from app.model.auth.token import TokenModel
from app.model.tutor import TutorUserProfileModel, DemandModel, CourseModel


class TutorBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.token_model = TokenModel()
        self.profile_model = TutorUserProfileModel()
        self.demand_model = DemandModel()
        self.course_model = CourseModel()

    def _get_user_info(self, user_id: int) -> Optional[Dict[str, Any]]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return None
        profile = self.profile_model.get_by_user_id(user_id)
        return {
            'id': user.get('id'),
            'username': user.get('username'),
            'status': user.get('status'),
            'profile': profile
        }

    def register(self, username: str, password: str, role: str, **kwargs) -> Dict[str, Any]:
        if not username or not username.strip():
            return {'code': 1, 'message': '用户名不能为空', 'data': None}
        if not password or len(password) < 6:
            return {'code': 1, 'message': '密码长度至少6位', 'data': None}
        if role not in [TutorUserProfileModel.ROLE_PARENT, TutorUserProfileModel.ROLE_TEACHER]:
            return {'code': 1, 'message': '角色类型无效', 'data': None}

        existing = self.user_model.get_by_username(username.strip())
        if existing:
            return {'code': 1, 'message': '用户名已存在', 'data': None}

        try:
            user_id = self.user_model.create(username.strip(), password)
            self.profile_model.create(user_id, role, **kwargs)
            token = self.token_model.create_token(user_id, hours=24)
            user_info = self._get_user_info(user_id)
            return {
                'code': 0,
                'message': '注册成功',
                'data': {'user': user_info, 'token': token}
            }
        except Exception as e:
            return {'code': 1, 'message': f'注册失败: {str(e)}', 'data': None}

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not username or not username.strip():
            return {'code': 1, 'message': '用户名不能为空', 'data': None}
        if not password:
            return {'code': 1, 'message': '密码不能为空', 'data': None}

        user = self.user_model.verify_password(username.strip(), password)
        if user is None:
            return {'code': 1, 'message': '用户名或密码错误', 'data': None}
        if user.get('status') != 1:
            return {'code': 1, 'message': '用户已被禁用', 'data': None}

        self.token_model.delete_by_user_id(user.get('id'))
        token = self.token_model.create_token(user.get('id'), hours=24)
        user_info = self._get_user_info(user.get('id'))

        return {
            'code': 0,
            'message': '登录成功',
            'data': {'user': user_info, 'token': token}
        }

    def get_profile(self, user_id: int) -> Dict[str, Any]:
        profile = self.profile_model.get_by_user_id(user_id)
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'message': '用户不存在', 'data': None}
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': user.get('id'),
                'username': user.get('username'),
                'profile': profile
            }
        }

    def update_profile(self, user_id: int, **kwargs) -> Dict[str, Any]:
        affected = self.profile_model.update(user_id, **kwargs)
        if affected > 0:
            profile = self.profile_model.get_by_user_id(user_id)
            return {'code': 0, 'message': '更新成功', 'data': profile}
        return {'code': 1, 'message': '更新失败', 'data': None}

    def create_demand(self, parent_id: int, subject: str, grade: str, **kwargs) -> Dict[str, Any]:
        if not subject or not subject.strip():
            return {'code': 1, 'message': '科目不能为空', 'data': None}
        if not grade or not grade.strip():
            return {'code': 1, 'message': '年级不能为空', 'data': None}

        profile = self.profile_model.get_by_user_id(parent_id)
        if not profile or profile.get('role') != TutorUserProfileModel.ROLE_PARENT:
            return {'code': 1, 'message': '只有家长可以发布需求', 'data': None}

        demand_id = self.demand_model.create(parent_id, subject.strip(), grade.strip(), **kwargs)
        demand = self.demand_model.get_by_id(demand_id)
        return {'code': 0, 'message': '发布成功', 'data': demand}

    def list_my_demands(self, parent_id: int) -> Dict[str, Any]:
        demands = self.demand_model.get_by_parent_id(parent_id)
        return {'code': 0, 'message': 'success', 'data': demands}

    def list_active_demands(self) -> Dict[str, Any]:
        demands = self.demand_model.list_active()
        result = []
        for d in demands:
            parent = self.profile_model.get_by_user_id(d.get('parent_id', 0))
            parent_user = self.user_model.get_by_id(d.get('parent_id', 0))
            result.append({
                **d,
                'parent_name': parent.get('real_name') if parent else '',
                'parent_username': parent_user.get('username') if parent_user else '',
                'parent_location': parent.get('location') if parent else ''
            })
        return {'code': 0, 'message': 'success', 'data': result}

    def update_demand(self, demand_id: int, parent_id: int, **kwargs) -> Dict[str, Any]:
        demand = self.demand_model.get_by_id(demand_id)
        if not demand:
            return {'code': 1, 'message': '需求不存在', 'data': None}
        if demand.get('parent_id') != parent_id:
            return {'code': 1, 'message': '无权修改此需求', 'data': None}
        affected = self.demand_model.update(demand_id, **kwargs)
        if affected > 0:
            return {'code': 0, 'message': '更新成功', 'data': self.demand_model.get_by_id(demand_id)}
        return {'code': 1, 'message': '更新失败', 'data': None}

    def delete_demand(self, demand_id: int, parent_id: int) -> Dict[str, Any]:
        demand = self.demand_model.get_by_id(demand_id)
        if not demand:
            return {'code': 1, 'message': '需求不存在', 'data': None}
        if demand.get('parent_id') != parent_id:
            return {'code': 1, 'message': '无权删除此需求', 'data': None}
        self.demand_model.delete(demand_id)
        return {'code': 0, 'message': '删除成功', 'data': None}

    def list_teachers(self) -> Dict[str, Any]:
        teachers = self.profile_model.list_teachers()
        result = []
        for t in teachers:
            user = self.user_model.get_by_id(t.get('user_id', 0))
            result.append({
                **t,
                'username': user.get('username') if user else ''
            })
        return {'code': 0, 'message': 'success', 'data': result}

    def _calculate_match_score(self, demand: Dict[str, Any], teacher: Dict[str, Any]) -> int:
        score = 0
        subject = demand.get('subject', '')
        teacher_subjects = teacher.get('subjects_list', [])
        if subject in teacher_subjects:
            score += 50

        pref_times = demand.get('preferred_times_list', [])
        avail_times = teacher.get('available_times_list', [])
        overlap = set(pref_times) & set(avail_times)
        if overlap:
            score += min(len(overlap) * 10, 30)

        d_min = demand.get('budget_min', 0)
        d_max = demand.get('budget_max', 0)
        t_min = teacher.get('budget_min', 0)
        t_max = teacher.get('budget_max', 0)
        if d_max > 0 and t_min > 0 and d_max >= t_min:
            score += 20
        elif d_max == 0 or t_max == 0:
            score += 10

        return score

    def match_teachers_for_demand(self, demand_id: int) -> Dict[str, Any]:
        demand = self.demand_model.get_by_id(demand_id)
        if not demand:
            return {'code': 1, 'message': '需求不存在', 'data': None}

        teachers = self.profile_model.list_teachers()
        results = []
        for t in teachers:
            user = self.user_model.get_by_id(t.get('user_id', 0))
            score = self._calculate_match_score(demand, t)
            if score > 0:
                results.append({
                    'teacher': {
                        **t,
                        'username': user.get('username') if user else ''
                    },
                    'match_score': score
                })

        results.sort(key=lambda x: x['match_score'], reverse=True)
        return {'code': 0, 'message': 'success', 'data': results}

    def match_demands_for_teacher(self, teacher_id: int) -> Dict[str, Any]:
        teacher = self.profile_model.get_by_user_id(teacher_id)
        if not teacher or teacher.get('role') != TutorUserProfileModel.ROLE_TEACHER:
            return {'code': 1, 'message': '用户不是教师', 'data': None}

        demands = self.demand_model.list_active()
        results = []
        for d in demands:
            parent = self.profile_model.get_by_user_id(d.get('parent_id', 0))
            parent_user = self.user_model.get_by_id(d.get('parent_id', 0))
            score = self._calculate_match_score(d, teacher)
            if score > 0:
                results.append({
                    'demand': {
                        **d,
                        'parent_name': parent.get('real_name') if parent else '',
                        'parent_username': parent_user.get('username') if parent_user else '',
                        'parent_location': parent.get('location') if parent else ''
                    },
                    'match_score': score
                })

        results.sort(key=lambda x: x['match_score'], reverse=True)
        return {'code': 0, 'message': 'success', 'data': results}

    def create_course(self, current_user_id: int, parent_id: int, teacher_id: int,
                      subject: str, course_date: str, start_time: str, end_time: str, **kwargs) -> Dict[str, Any]:
        if current_user_id != parent_id and current_user_id != teacher_id:
            return {'code': 1, 'message': '无权创建课程', 'data': None}
        if not course_date or not start_time or not end_time:
            return {'code': 1, 'message': '日期和时间不能为空', 'data': None}

        if self.course_model.has_conflict(parent_id, 'parent', course_date, start_time, end_time):
            return {'code': 1, 'message': '家长该时段已有课程安排', 'data': None}
        if self.course_model.has_conflict(teacher_id, 'teacher', course_date, start_time, end_time):
            return {'code': 1, 'message': '教师该时段已有课程安排', 'data': None}

        course_id = self.course_model.create(parent_id, teacher_id, subject, course_date, start_time, end_time, **kwargs)
        course = self.course_model.get_by_id(course_id)
        return {'code': 0, 'message': '课程创建成功', 'data': course}

    def list_my_courses(self, user_id: int, role: str) -> Dict[str, Any]:
        if role == TutorUserProfileModel.ROLE_PARENT:
            courses = self.course_model.get_by_parent_id(user_id)
        else:
            courses = self.course_model.get_by_teacher_id(user_id)

        result = []
        for c in courses:
            parent = self.profile_model.get_by_user_id(c.get('parent_id', 0))
            teacher = self.profile_model.get_by_user_id(c.get('teacher_id', 0))
            parent_user = self.user_model.get_by_id(c.get('parent_id', 0))
            teacher_user = self.user_model.get_by_id(c.get('teacher_id', 0))
            result.append({
                **c,
                'parent_name': parent.get('real_name') if parent else '',
                'parent_username': parent_user.get('username') if parent_user else '',
                'teacher_name': teacher.get('real_name') if teacher else '',
                'teacher_username': teacher_user.get('username') if teacher_user else ''
            })
        return {'code': 0, 'message': 'success', 'data': result}

    def list_courses_by_week(self, user_id: int, role: str, week_start: str, week_end: str) -> Dict[str, Any]:
        courses = self.course_model.get_by_date_range(user_id, role, week_start, week_end)
        result = []
        for c in courses:
            parent = self.profile_model.get_by_user_id(c.get('parent_id', 0))
            teacher = self.profile_model.get_by_user_id(c.get('teacher_id', 0))
            parent_user = self.user_model.get_by_id(c.get('parent_id', 0))
            teacher_user = self.user_model.get_by_id(c.get('teacher_id', 0))
            result.append({
                **c,
                'parent_name': parent.get('real_name') if parent else '',
                'parent_username': parent_user.get('username') if parent_user else '',
                'teacher_name': teacher.get('real_name') if teacher else '',
                'teacher_username': teacher_user.get('username') if teacher_user else ''
            })
        return {'code': 0, 'message': 'success', 'data': result}

    def confirm_course(self, course_id: int, user_id: int) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {'code': 1, 'message': '课程不存在', 'data': None}
        if course.get('parent_id') != user_id and course.get('teacher_id') != user_id:
            return {'code': 1, 'message': '无权操作此课程', 'data': None}
        if course.get('status') != CourseModel.STATUS_PENDING:
            return {'code': 1, 'message': '课程状态不允许确认', 'data': None}

        affected = self.course_model.update_status(course_id, CourseModel.STATUS_CONFIRMED)
        if affected > 0:
            demand_id = course.get('demand_id')
            if demand_id:
                self.demand_model.update_status(demand_id, DemandModel.STATUS_MATCHED)
            return {'code': 0, 'message': '课程确认成功', 'data': self.course_model.get_by_id(course_id)}
        return {'code': 1, 'message': '操作失败', 'data': None}

    def cancel_course(self, course_id: int, user_id: int) -> Dict[str, Any]:
        course = self.course_model.get_by_id(course_id)
        if not course:
            return {'code': 1, 'message': '课程不存在', 'data': None}
        if course.get('parent_id') != user_id and course.get('teacher_id') != user_id:
            return {'code': 1, 'message': '无权操作此课程', 'data': None}

        affected = self.course_model.update_status(course_id, CourseModel.STATUS_CANCELLED)
        if affected > 0:
            return {'code': 0, 'message': '课程已取消', 'data': self.course_model.get_by_id(course_id)}
        return {'code': 1, 'message': '操作失败', 'data': None}

    def get_teacher_detail(self, teacher_user_id: int) -> Dict[str, Any]:
        teacher = self.profile_model.get_by_user_id(teacher_user_id)
        if not teacher or teacher.get('role') != TutorUserProfileModel.ROLE_TEACHER:
            return {'code': 1, 'message': '教师不存在', 'data': None}
        user = self.user_model.get_by_id(teacher_user_id)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                **teacher,
                'username': user.get('username') if user else ''
            }
        }
