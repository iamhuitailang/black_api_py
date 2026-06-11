from typing import Dict, Any, List, Optional
from datetime import datetime
from app.model.meeting import ActionItemModel, MeetingModel, ProjectModel


class ActionItemBusiness:
    def __init__(self):
        self.model = ActionItemModel()
        self.meeting_model = MeetingModel()
        self.project_model = ProjectModel()

    def get_list(self, completed: bool = None, overdue: bool = None,
                 project_id: int = None) -> Dict[str, Any]:
        items = self.model.get_all(completed=completed, overdue=overdue)

        if project_id is not None:
            meeting_ids = set()
            meetings = self.meeting_model.get_by_project(project_id)
            for m in meetings:
                meeting_ids.add(m['id'])
            items = [item for item in items if item['meeting_id'] in meeting_ids]

        today = datetime.now().strftime('%Y-%m-%d')
        for item in items:
            item = self._enrich_action_item(item, today)

        return {
            'code': 0,
            'message': 'success',
            'data': items
        }

    def _enrich_action_item(self, item: Dict[str, Any], today: str) -> Dict[str, Any]:
        due_date = item.get('due_date', '')
        if due_date and not item.get('completed'):
            try:
                due = datetime.strptime(due_date, '%Y-%m-%d')
                today_dt = datetime.strptime(today, '%Y-%m-%d')
                days_left = (due - today_dt).days

                if days_left < 0:
                    item['status'] = 'overdue'
                    item['days_left'] = days_left
                elif days_left <= 3:
                    item['status'] = 'urgent'
                    item['days_left'] = days_left
                else:
                    item['status'] = 'normal'
                    item['days_left'] = days_left
            except (ValueError, TypeError):
                item['status'] = 'normal'
                item['days_left'] = None
        elif item.get('completed'):
            item['status'] = 'completed'
            item['days_left'] = None
        else:
            item['status'] = 'normal'
            item['days_left'] = None

        meeting = self.meeting_model.get_by_id(item['meeting_id'])
        if meeting:
            item['meeting_title'] = meeting.get('title', '')
            item['project_id'] = meeting.get('project_id', 0)
            project = self.project_model.get_by_id(meeting.get('project_id', 0))
            if project:
                item['project_name'] = project.get('name', '')
            else:
                item['project_name'] = ''
        else:
            item['meeting_title'] = ''
            item['project_id'] = 0
            item['project_name'] = ''

        return item

    def update_status(self, action_id: int, completed: bool) -> Dict[str, Any]:
        existing = self.model.get_by_id(action_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Action item not found',
                'data': None
            }

        affected = self.model.update(action_id, completed=completed)
        if affected > 0:
            record = self.model.get_by_id(action_id)
            return {
                'code': 0,
                'message': 'update success',
                'data': record
            }
        return {
            'code': 1,
            'message': 'update failed',
            'data': None
        }

    def create(self, meeting_id: int, content: str, assignee: str = '',
               due_date: str = '', completed: bool = False) -> Dict[str, Any]:
        if not content or not content.strip():
            return {
                'code': 1,
                'message': 'Action item content cannot be empty',
                'data': None
            }

        new_id = self.model.create(meeting_id, content.strip(), assignee, due_date, completed)
        record = self.model.get_by_id(new_id)
        return {
            'code': 0,
            'message': 'create success',
            'data': record
        }

    def update(self, action_id: int, content: str = None, assignee: str = None,
               due_date: str = None) -> Dict[str, Any]:
        existing = self.model.get_by_id(action_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Action item not found',
                'data': None
            }

        if content is not None and not content.strip():
            return {
                'code': 1,
                'message': 'Action item content cannot be empty',
                'data': None
            }

        update_data = {}
        if content is not None:
            update_data['content'] = content.strip()
        if assignee is not None:
            update_data['assignee'] = assignee
        if due_date is not None:
            update_data['due_date'] = due_date

        if not update_data:
            return {
                'code': 1,
                'message': 'No fields to update',
                'data': None
            }

        affected = self.model.update(action_id, **update_data)
        if affected > 0:
            record = self.model.get_by_id(action_id)
            return {
                'code': 0,
                'message': 'update success',
                'data': record
            }
        return {
            'code': 1,
            'message': 'update failed',
            'data': None
        }

    def delete(self, action_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(action_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Action item not found',
                'data': None
            }

        affected = self.model.delete(action_id)
        if affected > 0:
            return {
                'code': 0,
                'message': 'delete success',
                'data': None
            }
        return {
            'code': 1,
            'message': 'delete failed',
            'data': None
        }

    def get_project_stats(self) -> Dict[str, Any]:
        projects = self.project_model.get_all()
        stats = []

        for project in projects:
            project_id = project['id']
            meeting_count = self.meeting_model.count_by_project(project_id)
            action_stats = self.model.get_stats_by_project(project_id)
            attendee_stats = self.model.get_attendee_stats_by_project(project_id)

            stats.append({
                'project_id': project_id,
                'project_name': project['name'],
                'project_description': project.get('description', ''),
                'meeting_count': meeting_count,
                'action_total': action_stats['total'],
                'action_completed': action_stats['completed'],
                'completion_rate': action_stats['completion_rate'],
                'top_assignees': attendee_stats[:5]
            })

        return {
            'code': 0,
            'message': 'success',
            'data': stats
        }
