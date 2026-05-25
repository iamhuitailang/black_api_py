from typing import Dict, Any, Optional
from app.model.tucao import LikeModel


class TucaoLikeBusiness:
    def __init__(self):
        self.like_model = LikeModel()

    def check_liked(self, target_id: int, target_type: str,
                    user_id: int = 0, ip_address: str = '',
                    device_id: str = '') -> Dict[str, Any]:
        is_liked = self.like_model.check_liked(
            target_id=target_id,
            target_type=target_type,
            user_id=user_id,
            ip_address=ip_address,
            device_id=device_id
        )
        return {
            'code': 0,
            'msg': 'success',
            'data': {'liked': is_liked}
        }

    def get_like_count(self, target_id: int, target_type: str) -> Dict[str, Any]:
        count = self.like_model.get_count(target_id, target_type)
        return {
            'code': 0,
            'msg': 'success',
            'data': {'count': count}
        }
