from typing import Dict, Any, List, Optional
from app.model.xiaozu import TaskModel, TeamMemberModel, WorkHourModel, TaskLogModel, NotificationModel


class XzStatisticsBusiness:
    def __init__(self):
        self.task_model = TaskModel()
        self.member_model = TeamMemberModel()
        self.workhour_model = WorkHourModel()
        self.log_model = TaskLogModel()
        self.notification_model = NotificationModel()

    def get_dashboard(self, team_id: int, user_id: int) -> Dict[str, Any]:
        if not self.member_model.is_member(team_id, user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        stats = self.task_model.get_statistics(team_id)

        my_tasks = self.task_model.query.find_all(
            {'team_id': team_id, 'assignee_id': user_id, 'status': TaskModel.STATUS_TODO},
            order_by='priority DESC, id DESC',
            limit=10
        )

        upcoming = self.task_model.get_upcoming_due(team_id, days=3)

        recent_logs = self.log_model.get_by_team_recent(team_id, limit=10)

        completion_rate = 0
        if stats['total'] > 0:
            completion_rate = round(stats['done'] / stats['total'] * 100, 1)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'statistics': stats,
                'my_tasks': my_tasks,
                'upcoming_due': upcoming,
                'recent_logs': recent_logs,
                'completion_rate': completion_rate
            }
        }

    def get_workload_stats(self, team_id: int, user_id: int) -> Dict[str, Any]:
        if not self.member_model.is_member(team_id, user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        work_hours = self.workhour_model.get_team_work_hours_summary(team_id)

        task_counts_sql = """
            SELECT assignee_id, COUNT(*) as task_count
            FROM tb_xiaozu_tasks
            WHERE team_id = ? AND assignee_id IS NOT NULL
            GROUP BY assignee_id
        """
        task_counts = self.workhour_model.db.fetch_all(task_counts_sql, (team_id,))
        task_count_map = {r['assignee_id']: r['task_count'] for r in task_counts}

        members = self.member_model.get_members_by_team(team_id)
        workload = []
        for m in members:
            uid = m['user_id']
            wh = next((w for w in work_hours if w['user_id'] == uid), None)
            workload.append({
                'user_id': uid,
                'username': m['username'],
                'avatar': m.get('avatar', ''),
                'role': m['role'],
                'task_count': task_count_map.get(uid, 0),
                'total_hours': wh['total_hours'] if wh else 0
            })

        return {'code': 0, 'msg': 'success', 'data': workload}

    def get_completion_trend(self, team_id: int, user_id: int, days: int = 7) -> Dict[str, Any]:
        if not self.member_model.is_member(team_id, user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        daily = self.workhour_model.get_daily_completion(team_id, days)
        return {'code': 0, 'msg': 'success', 'data': daily}

    def get_priority_distribution(self, team_id: int, user_id: int) -> Dict[str, Any]:
        if not self.member_model.is_member(team_id, user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        stats = self.task_model.get_statistics(team_id)
        return {'code': 0, 'msg': 'success', 'data': stats.get('priority_distribution', {})}

    def get_burndown(self, team_id: int, user_id: int) -> Dict[str, Any]:
        if not self.member_model.is_member(team_id, user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        sql = """
            SELECT
                date(completed_at) as date,
                COUNT(*) as completed,
                (SELECT COUNT(*) FROM tb_xiaozu_tasks t2 WHERE t2.team_id = ? AND t2.status != 'done'
                 AND (t2.completed_at IS NULL OR date(t2.completed_at) > date(t1.completed_at))) as remaining
            FROM tb_xiaozu_tasks t1
            WHERE t1.team_id = ? AND t1.status = 'done' AND t1.completed_at >= date('now', '-14 days')
            GROUP BY date(completed_at) ORDER BY date ASC
        """
        data = self.workhour_model.db.fetch_all(sql, (team_id, team_id))
        return {'code': 0, 'msg': 'success', 'data': data}

    def export_csv(self, team_id: int, user_id: int) -> Dict[str, Any]:
        if not self.member_model.is_member(team_id, user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        tasks = self.task_model.get_by_team(team_id)
        headers = ['ID', '标题', '描述', '优先级', '状态', '负责人ID',
                   '预计工时', '实际工时', '开始日期', '截止日期', '完成时间', '创建者ID', '创建时间']

        rows = []
        for t in tasks:
            rows.append([
                t['id'], t['title'], t.get('description', ''),
                t.get('priority', ''), t.get('status', ''),
                t.get('assignee_id', ''), t.get('estimated_hours', 0),
                t.get('actual_hours', 0), t.get('start_date', ''),
                t.get('due_date', ''), t.get('completed_at', ''),
                t.get('created_by', ''), t.get('created_at', '')
            ])

        csv_content = ','.join(headers) + '\n'
        for row in rows:
            csv_content += ','.join(str(v).replace(',', '，') for v in row) + '\n'

        return {'code': 0, 'msg': 'success', 'data': {'content': csv_content, 'filename': 'tasks.csv'}}

    def get_notifications(self, user_id: int) -> Dict[str, Any]:
        notifications = self.notification_model.get_by_user(user_id)
        unread = self.notification_model.get_unread_count(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {'notifications': notifications, 'unread_count': unread}
        }

    def mark_notification_read(self, user_id: int, notification_id: int) -> Dict[str, Any]:
        notification = self.notification_model.get_by_id(notification_id)
        if not notification or notification['user_id'] != user_id:
            return {'code': 1, 'msg': '通知不存在', 'data': None}

        self.notification_model.mark_as_read(notification_id)
        return {'code': 0, 'msg': '已标记为已读', 'data': None}

    def mark_all_notifications_read(self, user_id: int) -> Dict[str, Any]:
        self.notification_model.mark_all_as_read(user_id)
        return {'code': 0, 'msg': '已全部标记为已读', 'data': None}

    def log_work_hour(self, task_id: int, user_id: int, hours: float,
                       date: str, description: str = '') -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {'code': 1, 'msg': '任务不存在', 'data': None}

        if not self.member_model.is_member(task['team_id'], user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        if not hours or hours <= 0:
            return {'code': 1, 'msg': '工时必须大于0', 'data': None}

        if not date:
            return {'code': 1, 'msg': '日期不能为空', 'data': None}

        record_id = self.workhour_model.create(task_id, user_id, hours, date, description)
        if record_id > 0:
            current_actual = task.get('actual_hours', 0) or 0
            self.task_model.update(task_id, {'actual_hours': current_actual + hours})
            return {'code': 0, 'msg': '登记成功', 'data': {'id': record_id}}

        return {'code': 1, 'msg': '登记失败', 'data': None}

    def get_work_hours(self, task_id: int, user_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {'code': 1, 'msg': '任务不存在', 'data': None}

        if not self.member_model.is_member(task['team_id'], user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        records = self.workhour_model.get_by_task(task_id)
        return {'code': 0, 'msg': 'success', 'data': records}
