from typing import Dict, Any, List, Optional
from app.model.xiaozu import TaskModel, TaskCommentModel, TaskLogModel, TeamMemberModel, NotificationModel


class XzTaskBusiness:
    def __init__(self):
        self.task_model = TaskModel()
        self.comment_model = TaskCommentModel()
        self.log_model = TaskLogModel()
        self.member_model = TeamMemberModel()
        self.notification_model = NotificationModel()

    def _check_team_member(self, team_id: int, user_id: int) -> bool:
        return self.member_model.is_member(team_id, user_id)

    def create_task(self, user_id: int, team_id: int, title: str, description: str,
                    priority: str, assignee_id: int, estimated_hours: float,
                    start_date: str, due_date: str) -> Dict[str, Any]:
        if not self._check_team_member(team_id, user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        if not title:
            return {'code': 1, 'msg': '任务标题不能为空', 'data': None}

        task_id = self.task_model.create(
            team_id, title, description, priority,
            assignee_id, estimated_hours, start_date, due_date, user_id
        )
        if task_id > 0:
            self.log_model.create(task_id, user_id, TaskLogModel.ACTION_CREATE, '', title)
            if assignee_id and assignee_id != user_id:
                self.notification_model.create(
                    assignee_id, NotificationModel.TYPE_TASK_ASSIGNED,
                    '新任务分配', f'您被分配了新任务：{title}', task_id
                )
            task = self.task_model.get_by_id(task_id)
            return {'code': 0, 'msg': '创建成功', 'data': task}

        return {'code': 1, 'msg': '创建失败', 'data': None}

    def get_task(self, task_id: int, user_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {'code': 1, 'msg': '任务不存在', 'data': None}

        if not self._check_team_member(task['team_id'], user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        return {'code': 0, 'msg': 'success', 'data': task}

    def update_task(self, task_id: int, user_id: int, **kwargs) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {'code': 1, 'msg': '任务不存在', 'data': None}

        if not self._check_team_member(task['team_id'], user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        valid_fields = ['title', 'description', 'priority', 'status',
                        'assignee_id', 'estimated_hours', 'start_date', 'due_date']
        update_data = {k: v for k, v in kwargs.items() if k in valid_fields and v is not None}

        if not update_data:
            return {'code': 1, 'msg': '无更新内容', 'data': None}

        if 'status' in update_data and update_data['status'] != task.get('status'):
            self.log_model.create(task_id, user_id, TaskLogModel.ACTION_STATUS_CHANGE,
                                   task.get('status', ''), update_data['status'])
            if update_data['status'] == TaskModel.STATUS_DONE:
                self.notification_model.create(
                    task['created_by'], NotificationModel.TYPE_TASK_COMPLETED,
                    '任务已完成', f'任务《{task["title"]}》已完成', task_id
                )

        if 'assignee_id' in update_data and update_data['assignee_id'] != task.get('assignee_id'):
            self.log_model.create(task_id, user_id, TaskLogModel.ACTION_ASSIGN,
                                   str(task.get('assignee_id', '')), str(update_data['assignee_id']))
            if update_data['assignee_id'] and update_data['assignee_id'] != user_id:
                self.notification_model.create(
                    update_data['assignee_id'], NotificationModel.TYPE_TASK_ASSIGNED,
                    '新任务分配', f'您被分配了新任务：{task["title"]}', task_id
                )

        self.task_model.update(task_id, update_data)
        task = self.task_model.get_by_id(task_id)
        return {'code': 0, 'msg': '更新成功', 'data': task}

    def update_task_status(self, task_id: int, user_id: int, status: str) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {'code': 1, 'msg': '任务不存在', 'data': None}

        if not self._check_team_member(task['team_id'], user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        if status not in [TaskModel.STATUS_TODO, TaskModel.STATUS_IN_PROGRESS, TaskModel.STATUS_DONE]:
            return {'code': 1, 'msg': '无效状态', 'data': None}

        self.task_model.update_status(task_id, status)
        self.log_model.create(task_id, user_id, TaskLogModel.ACTION_STATUS_CHANGE,
                               task.get('status', ''), status)

        if status == TaskModel.STATUS_DONE:
            self.notification_model.create(
                task['created_by'], NotificationModel.TYPE_TASK_COMPLETED,
                '任务已完成', f'任务《{task["title"]}》已完成', task_id
            )

        return {'code': 0, 'msg': '状态更新成功', 'data': None}

    def delete_task(self, task_id: int, user_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {'code': 1, 'msg': '任务不存在', 'data': None}

        if task['created_by'] != user_id:
            return {'code': 1, 'msg': '仅创建者可删除', 'data': None}

        self.task_model.delete(task_id)
        self.log_model.create(task_id, user_id, TaskLogModel.ACTION_DELETE, task['title'], '')
        return {'code': 0, 'msg': '删除成功', 'data': None}

    def get_team_tasks(self, team_id: int, user_id: int, page: int = 1,
                       page_size: int = 10, status: str = None, priority: str = None,
                       assignee_id: int = None, keyword: str = None) -> Dict[str, Any]:
        if not self._check_team_member(team_id, user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        result = self.task_model.get_all(page, page_size, team_id, status, priority, assignee_id, keyword)
        return {'code': 0, 'msg': 'success', 'data': result}

    def get_kanban(self, team_id: int, user_id: int) -> Dict[str, Any]:
        if not self._check_team_member(team_id, user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        kanban = self.task_model.get_kanban_data(team_id)
        return {'code': 0, 'msg': 'success', 'data': kanban}

    def get_my_tasks(self, team_id: int, user_id: int, status: str = None) -> Dict[str, Any]:
        conditions = {'team_id': team_id, 'assignee_id': user_id}
        if status:
            conditions['status'] = status
        tasks = self.task_model.query.find_all(conditions, order_by='id DESC')
        return {'code': 0, 'msg': 'success', 'data': tasks}

    def add_comment(self, task_id: int, user_id: int, content: str) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {'code': 1, 'msg': '任务不存在', 'data': None}

        if not content:
            return {'code': 1, 'msg': '评论内容不能为空', 'data': None}

        comment_id = self.comment_model.create(task_id, user_id, content)
        if comment_id > 0:
            self.log_model.create(task_id, user_id, TaskLogModel.ACTION_COMMENT, '', content[:50])
            if task['created_by'] != user_id:
                self.notification_model.create(
                    task['created_by'], NotificationModel.TYPE_TASK_COMMENTED,
                    '任务有新评论', f'任务《{task["title"]}》有新评论', task_id
                )
            return {'code': 0, 'msg': '评论成功', 'data': {'id': comment_id}}

        return {'code': 1, 'msg': '评论失败', 'data': None}

    def get_comments(self, task_id: int, user_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {'code': 1, 'msg': '任务不存在', 'data': None}

        if not self._check_team_member(task['team_id'], user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        comments = self.comment_model.get_by_task(task_id)
        return {'code': 0, 'msg': 'success', 'data': comments}

    def get_task_logs(self, task_id: int, user_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {'code': 1, 'msg': '任务不存在', 'data': None}

        if not self._check_team_member(task['team_id'], user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        logs = self.log_model.get_by_task(task_id)
        return {'code': 0, 'msg': 'success', 'data': logs}
