from typing import Dict, Any, List, Optional
from app.model.campus import OrganizerModel


class OrganizerBusiness:
    def __init__(self):
        self.model = OrganizerModel()

    def get_list(self) -> Dict[str, Any]:
        items = self.model.get_all()
        for item in items:
            item['is_banned'] = self.model.is_banned(item['id'])
        return {
            'code': 0,
            'message': 'success',
            'data': items
        }

    def ban_organizer(self, organizer_id: int, days: int = 7) -> Dict[str, Any]:
        org = self.model.get_by_id(organizer_id)
        if not org:
            return {'code': 1, 'message': '主办方不存在', 'data': None}
        self.model.ban_days(organizer_id, days)
        return {'code': 0, 'message': f'已禁止主办方{days}天内申报活动', 'data': None}
