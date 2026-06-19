from typing import Dict, Any, Optional
from app.model.express import UserProfileModel


class UserProfileBusiness:
    def __init__(self):
        self.profile_model = UserProfileModel()
    
    def get_profile(self, user_id: int) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'message': '用户ID无效',
                'data': None
            }
        
        profile = self.profile_model.get_or_create_profile(user_id)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'user_id': profile.get('user_id'),
                'nickname': profile.get('nickname'),
                'avatar': profile.get('avatar'),
                'reputation': profile.get('reputation'),
                'total_orders': profile.get('total_orders'),
                'completed_orders': profile.get('completed_orders'),
                'balance': profile.get('balance')
            }
        }
    
    def update_profile(self, user_id: int, nickname: str = None, avatar: str = None) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'message': '用户ID无效',
                'data': None
            }
        
        if nickname is not None:
            nickname = nickname.strip()
            if not nickname:
                return {
                    'code': 1,
                    'message': '昵称不能为空',
                    'data': None
                }
            if len(nickname) > 20:
                return {
                    'code': 1,
                    'message': '昵称长度不能超过20个字符',
                    'data': None
                }
        
        affected = self.profile_model.update_profile(user_id, nickname, avatar)
        if affected > 0:
            return self.get_profile(user_id)
        
        return {
            'code': 1,
            'message': '更新失败',
            'data': None
        }
    
    def get_rank_list(self, limit: int = 20) -> Dict[str, Any]:
        if limit <= 0 or limit > 100:
            limit = 20
        
        rank_list = self.profile_model.get_rank_list(limit)
        
        result = []
        for idx, item in enumerate(rank_list):
            result.append({
                'rank': idx + 1,
                'user_id': item.get('user_id'),
                'nickname': item.get('nickname'),
                'avatar': item.get('avatar'),
                'reputation': item.get('reputation'),
                'completed_orders': item.get('completed_orders')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }
