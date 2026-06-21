from typing import Dict, Any, List, Optional
from app.model.campus import VenueModel


class VenueBusiness:
    def __init__(self):
        self.model = VenueModel()

    def get_list(self) -> Dict[str, Any]:
        items = self.model.get_all(status=1)
        return {
            'code': 0,
            'message': 'success',
            'data': items
        }

    def get_detail(self, venue_id: int) -> Dict[str, Any]:
        item = self.model.get_by_id(venue_id)
        if not item:
            return {'code': 1, 'message': '场地不存在', 'data': None}
        return {'code': 0, 'message': 'success', 'data': item}
