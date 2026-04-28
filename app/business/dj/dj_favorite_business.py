from typing import Dict, Any, List, Optional
from app.model.dj import FavoriteModel, CheckinModel, MarketModel


class DjFavoriteBusiness:
    def __init__(self):
        self.favorite_model = FavoriteModel()
        self.market_model = MarketModel()

    def toggle_favorite(self, user_id: int, market_id: int) -> Dict[str, Any]:
        market = self.market_model.get_by_id(market_id)
        if not market:
            return {
                'code': 1,
                'msg': '集市不存在',
                'data': None
            }

        is_favorited = self.favorite_model.toggle(user_id, market_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'is_favorited': is_favorited
            }
        }

    def get_user_favorites(self, user_id: int) -> Dict[str, Any]:
        favorites = self.favorite_model.get_by_user_id(user_id)

        result = []
        for fav in favorites:
            market = self.market_model.get_by_id(fav.get('market_id'))
            if market:
                result.append({
                    'favorite_id': fav.get('id'),
                    'market_id': market.get('id'),
                    'name': market.get('name'),
                    'location': market.get('location'),
                    'lunar_dates': market.get('lunar_dates'),
                    'solar_dates': market.get('solar_dates'),
                    'hot': market.get('hot'),
                    'rating': market.get('rating'),
                    'favorite_time': fav.get('created_at')
                })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def is_favorited(self, user_id: int, market_id: int) -> Dict[str, Any]:
        result = self.favorite_model.is_favorited(user_id, market_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'is_favorited': result
            }
        }

    def remove_favorite(self, user_id: int, market_id: int) -> Dict[str, Any]:
        affected = self.favorite_model.delete_by_user_and_market(user_id, market_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '取消收藏成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '取消收藏失败',
            'data': None
        }


class DjCheckinBusiness:
    def __init__(self):
        self.checkin_model = CheckinModel()
        self.market_model = MarketModel()

    def checkin(self, user_id: int, market_id: int) -> Dict[str, Any]:
        market = self.market_model.get_by_id(market_id)
        if not market:
            return {
                'code': 1,
                'msg': '集市不存在',
                'data': None
            }

        if self.checkin_model.has_checked_in_today(user_id, market_id):
            return {
                'code': 1,
                'msg': '今天已在该集市打卡',
                'data': None
            }

        checkin_id = self.checkin_model.create(user_id, market_id)
        if checkin_id > 0:
            total_count = self.checkin_model.get_user_checkin_count(user_id)
            return {
                'code': 0,
                'msg': '打卡成功',
                'data': {
                    'checkin_id': checkin_id,
                    'total_checkins': total_count
                }
            }

        return {
            'code': 1,
            'msg': '打卡失败',
            'data': None
        }

    def get_user_checkins(self, user_id: int, limit: int = 20) -> Dict[str, Any]:
        checkins = self.checkin_model.get_by_user_id(user_id, limit=limit)

        result = []
        for checkin in checkins:
            market = self.market_model.get_by_id(checkin.get('market_id'))
            if market:
                result.append({
                    'checkin_id': checkin.get('id'),
                    'market_id': market.get('id'),
                    'name': market.get('name'),
                    'location': market.get('location'),
                    'checkin_date': checkin.get('checkin_date'),
                    'checkin_time': checkin.get('created_at')
                })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_checkin_statistics(self, user_id: int) -> Dict[str, Any]:
        total_count = self.checkin_model.get_user_checkin_count(user_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_checkins': total_count
            }
        }

    def has_checked_in_today(self, user_id: int, market_id: int) -> Dict[str, Any]:
        result = self.checkin_model.has_checked_in_today(user_id, market_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'has_checked_in': result
            }
        }
