from typing import Dict, Any, List, Optional
from app.model.meeting import MeetingModel, ActionItemModel, ProjectModel


class MeetingBusiness:
    def __init__(self):
        self.model = MeetingModel()
        self.action_item_model = ActionItemModel()
        self.project_model = ProjectModel()

    def get_list(self, keyword: str = None, start_date: str = None, end_date: str = None,
                 attendee: str = None, project_id: int = None,
                 page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.model.search(keyword, start_date, end_date, attendee, project_id, page, page_size)

        projects = {p['id']: p for p in self.project_model.get_all()}

        meeting_ids = [m['id'] for m in result['items']]
        action_counts = {}
        if meeting_ids:
            from app.common.sqlite.db import get_db
            db = get_db()
            placeholders = ','.join(['?' for _ in meeting_ids])
            sql = f"""
                SELECT meeting_id, COUNT(*) as count,
                       SUM(CASE WHEN completed = 0 AND due_date != '' AND due_date < date('now') THEN 1 ELSE 0 END) as overdue_count
                FROM action_items
                WHERE meeting_id IN ({placeholders})
                GROUP BY meeting_id
            """
            rows = db.fetch_all(sql, tuple(meeting_ids))
            action_counts = {row['meeting_id']: row for row in rows}

        for item in result['items']:
            project = projects.get(item.get('project_id', 0))
            item['project_name'] = project['name'] if project else ''

            ac = action_counts.get(item['id'], {'count': 0, 'overdue_count': 0})
            item['action_count'] = ac['count']
            item['overdue_count'] = ac['overdue_count']

            if ac['count'] > 0:
                from app.common.sqlite.db import get_db
                db = get_db()
                sql = "SELECT * FROM action_items WHERE meeting_id = ? ORDER BY id ASC LIMIT 3"
                actions = db.fetch_all(sql, (item['id'],))
                item['action_items'] = [
                    {
                        'id': a['id'],
                        'content': a['content'],
                        'due_date': a['due_date'],
                        'completed': bool(a['completed'])
                    }
                    for a in actions
                ]
            else:
                item['action_items'] = []

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_by_id(self, meeting_id: int) -> Dict[str, Any]:
        record = self.model.get_by_id(meeting_id)
        if not record:
            return {
                'code': 1,
                'message': 'Meeting not found',
                'data': None
            }

        action_items = self.action_item_model.get_by_meeting(meeting_id)
        record['action_items'] = action_items

        return {
            'code': 0,
            'message': 'success',
            'data': record
        }

    def create(self, project_id: int = 0, title: str = '', date: str = '',
               attendees: list = None, content: str = '',
               action_items: list = None) -> Dict[str, Any]:
        if not title or not title.strip():
            return {
                'code': 1,
                'message': 'Meeting title cannot be empty',
                'data': None
            }

        if not date:
            return {
                'code': 1,
                'message': 'Meeting date cannot be empty',
                'data': None
            }

        new_id = self.model.create(
            project_id=project_id or 0,
            title=title.strip(),
            date=date,
            attendees=attendees or [],
            content=content or ''
        )

        if action_items:
            for item in action_items:
                self.action_item_model.create(
                    meeting_id=new_id,
                    content=item.get('content', ''),
                    assignee=item.get('assignee', ''),
                    due_date=item.get('due_date', ''),
                    completed=item.get('completed', False),
                    reminder_time=item.get('reminder_time', ''),
                    reminder_email=item.get('reminder_email', '')
                )

        return self.get_by_id(new_id)

    def update(self, meeting_id: int, project_id: int = None, title: str = None,
               date: str = None, attendees: list = None, content: str = None,
               action_items: list = None) -> Dict[str, Any]:
        existing = self.model.get_by_id(meeting_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Meeting not found',
                'data': None
            }

        update_data = {}
        if project_id is not None:
            update_data['project_id'] = project_id
        if title is not None:
            if not title.strip():
                return {
                    'code': 1,
                    'message': 'Meeting title cannot be empty',
                    'data': None
                }
            update_data['title'] = title.strip()
        if date is not None:
            update_data['date'] = date
        if attendees is not None:
            update_data['attendees'] = attendees
        if content is not None:
            update_data['content'] = content

        if update_data:
            self.model.update(meeting_id, **update_data)

        if action_items is not None:
            old_items = {a['id']: a for a in self.action_item_model.get_by_meeting(meeting_id)}
            self.action_item_model.delete_by_meeting(meeting_id)
            for item in action_items:
                old_id = item.get('id')
                old_item = old_items.get(old_id) if old_id else None
                reminder_time = item.get('reminder_time', '')
                reminder_email = item.get('reminder_email', '')
                if old_item and not reminder_time and not reminder_email:
                    reminder_time = old_item.get('reminder_time', '')
                    reminder_email = old_item.get('reminder_email', '')
                self.action_item_model.create(
                    meeting_id=meeting_id,
                    content=item.get('content', ''),
                    assignee=item.get('assignee', ''),
                    due_date=item.get('due_date', ''),
                    completed=item.get('completed', False),
                    reminder_time=reminder_time,
                    reminder_email=reminder_email
                )

        return self.get_by_id(meeting_id)

    def delete(self, meeting_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(meeting_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Meeting not found',
                'data': None
            }

        self.action_item_model.delete_by_meeting(meeting_id)
        affected = self.model.delete(meeting_id)

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

    def search(self, keyword: str, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.get_list(keyword=keyword, page=page, page_size=page_size)

    def get_attendees(self) -> Dict[str, Any]:
        attendees = self.model.get_distinct_attendees()
        return {
            'code': 0,
            'message': 'success',
            'data': attendees
        }
