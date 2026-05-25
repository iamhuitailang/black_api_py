from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.model.zhuiju import ReminderModel, DramaModel


class ReminderBusiness:
    def __init__(self):
        self.model = ReminderModel()
        self.drama_model = DramaModel()

    def list_reminders(self, is_read: int = None) -> Dict[str, Any]:
        conditions = {}
        if is_read is not None:
            conditions['is_read'] = is_read
        items = self.model.get_all(conditions=conditions, order_by='id DESC')
        return {
            'code': 0,
            'message': 'success',
            'data': {'items': items, 'total': len(items)}
        }

    def add_reminder(self, drama_id: int = 0, rtype: str = 'update', message: str = '',
                     remind_at: str = '', extra: str = '') -> Dict[str, Any]:
        new_id = self.model.create(drama_id=drama_id, rtype=rtype, message=message,
                                   remind_at=remind_at, extra=extra)
        item = self.model.get_by_id(new_id)
        return {'code': 0, 'message': 'success', 'data': item}

    def mark_read(self, reminder_id: int) -> Dict[str, Any]:
        item = self.model.get_by_id(reminder_id)
        if not item:
            return {'code': 1, 'message': '提醒不存在', 'data': None}
        self.model.update(reminder_id, {'is_read': 1})
        return {'code': 0, 'message': 'success', 'data': None}

    def mark_all_read(self) -> Dict[str, Any]:
        self.model.mark_all_read()
        return {'code': 0, 'message': 'success', 'data': None}

    def delete_reminder(self, reminder_id: int) -> Dict[str, Any]:
        item = self.model.get_by_id(reminder_id)
        if not item:
            return {'code': 1, 'message': '提醒不存在', 'data': None}
        self.model.delete(reminder_id)
        return {'code': 0, 'message': 'success', 'data': None}

    def unread_count(self) -> Dict[str, Any]:
        return {'code': 0, 'message': 'success', 'data': {'count': self.model.count_unread()}}

    def check_pending_reminders(self) -> Dict[str, Any]:
        now = datetime.now()
        watching = self.drama_model.get_all(conditions={'status': 'watching'}, order_by='updated_at ASC')
        pending = []
        for d in watching:
            updated = d.get('updated_at')
            if updated:
                try:
                    dt = datetime.fromisoformat(updated)
                    if (now - dt).days >= 3:
                        pending.append({
                            'drama_id': d['id'],
                            'name': d['name'],
                            'last_updated': updated,
                            'days_since': (now - dt).days,
                        })
                except Exception:
                    pass
        return {'code': 0, 'message': 'success', 'data': {'items': pending, 'total': len(pending)}}
