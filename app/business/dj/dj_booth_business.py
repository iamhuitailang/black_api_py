from typing import Dict, Any, List, Optional
from app.model.dj import BoothModel, MarketModel


class DjBoothBusiness:
    def __init__(self):
        self.booth_model = BoothModel()
        self.market_model = MarketModel()

    def create_booth(self, data: Dict[str, Any]) -> Dict[str, Any]:
        market_id = data.get('market_id')
        if not market_id:
            return {
                'code': 1,
                'msg': '请选择所属集市',
                'data': None
            }

        market = self.market_model.get_by_id(market_id)
        if not market:
            return {
                'code': 1,
                'msg': '集市不存在',
                'data': None
            }

        booth_id = self.booth_model.create(data)
        if booth_id > 0:
            return {
                'code': 0,
                'msg': '创建成功',
                'data': {'id': booth_id}
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def apply_vendor(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        market_id = data.get('market_id')
        if not market_id:
            return {
                'code': 1,
                'msg': '请选择所属集市',
                'data': None
            }

        market = self.market_model.get_by_id(market_id)
        if not market:
            return {
                'code': 1,
                'msg': '集市不存在',
                'data': None
            }

        booth_data = {
            'market_id': market_id,
            'vendor_name': data.get('vendor_name'),
            'phone': data.get('phone'),
            'wechat': data.get('wechat'),
            'location_desc': data.get('location_desc'),
            'categories': data.get('categories'),
            'description': data.get('description'),
            'images': data.get('images'),
            'user_id': user_id,
            'apply_status': 0,
            'status': 1
        }

        booth_id = self.booth_model.create(booth_data)
        if booth_id > 0:
            return {
                'code': 0,
                'msg': '申请已提交，请等待审核',
                'data': {'id': booth_id}
            }

        return {
            'code': 1,
            'msg': '申请失败',
            'data': None
        }

    def get_booth_detail(self, booth_id: int) -> Dict[str, Any]:
        booth = self.booth_model.get_by_id(booth_id)
        if not booth:
            return {
                'code': 1,
                'msg': '摊位不存在',
                'data': None
            }

        market = self.market_model.get_by_id(booth.get('market_id'))

        phone = booth.get('phone', '')
        if phone and len(phone) == 11:
            phone_masked = phone[:3] + '****' + phone[-4:]
        else:
            phone_masked = phone

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'id': booth.get('id'),
                'market_id': booth.get('market_id'),
                'market_name': market.get('name') if market else None,
                'vendor_name': booth.get('vendor_name'),
                'phone': phone_masked,
                'phone_raw': booth.get('phone'),
                'wechat': booth.get('wechat'),
                'location_desc': booth.get('location_desc'),
                'categories': booth.get('categories'),
                'description': booth.get('description'),
                'images': booth.get('images'),
                'rating': booth.get('rating'),
                'rating_count': booth.get('rating_count'),
                'status': booth.get('status'),
                'is_verified': booth.get('is_verified'),
                'apply_status': booth.get('apply_status'),
                'created_at': booth.get('created_at')
            }
        }

    def get_booth_list(self, page: int = 1, page_size: int = 10, market_id: int = None, status: int = None, apply_status: int = None) -> Dict[str, Any]:
        conditions = {}
        if market_id is not None:
            conditions['market_id'] = market_id
        if status is not None:
            conditions['status'] = status
        if apply_status is not None:
            conditions['apply_status'] = apply_status

        result = self.booth_model.paginate(page, page_size, conditions)

        booths = []
        for item in result.get('items', []):
            market = self.market_model.get_by_id(item.get('market_id'))
            phone = item.get('phone', '')
            if phone and len(phone) == 11:
                phone_masked = phone[:3] + '****' + phone[-4:]
            else:
                phone_masked = phone

            booths.append({
                'id': item.get('id'),
                'market_id': item.get('market_id'),
                'market_name': market.get('name') if market else None,
                'vendor_name': item.get('vendor_name'),
                'phone': phone_masked,
                'location_desc': item.get('location_desc'),
                'categories': item.get('categories'),
                'rating': item.get('rating'),
                'rating_count': item.get('rating_count'),
                'status': item.get('status'),
                'is_verified': item.get('is_verified'),
                'apply_status': item.get('apply_status')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': booths,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_user_booths(self, user_id: int) -> Dict[str, Any]:
        items = self.booth_model.get_by_user_id(user_id)

        booths = []
        for item in items:
            market = self.market_model.get_by_id(item.get('market_id'))
            booths.append({
                'id': item.get('id'),
                'market_id': item.get('market_id'),
                'market_name': market.get('name') if market else None,
                'vendor_name': item.get('vendor_name'),
                'location_desc': item.get('location_desc'),
                'categories': item.get('categories'),
                'rating': item.get('rating'),
                'status': item.get('status'),
                'is_verified': item.get('is_verified'),
                'apply_status': item.get('apply_status')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': booths
        }

    def get_pending_applications(self) -> Dict[str, Any]:
        items = self.booth_model.get_pending_applications()

        booths = []
        for item in items:
            market = self.market_model.get_by_id(item.get('market_id'))
            booths.append({
                'id': item.get('id'),
                'market_id': item.get('market_id'),
                'market_name': market.get('name') if market else None,
                'vendor_name': item.get('vendor_name'),
                'phone': item.get('phone'),
                'wechat': item.get('wechat'),
                'location_desc': item.get('location_desc'),
                'categories': item.get('categories'),
                'description': item.get('description'),
                'images': item.get('images'),
                'user_id': item.get('user_id'),
                'created_at': item.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': booths
        }

    def update_booth(self, booth_id: int, data: Dict[str, Any], user_id: int = None) -> Dict[str, Any]:
        booth = self.booth_model.get_by_id(booth_id)
        if not booth:
            return {
                'code': 1,
                'msg': '摊位不存在',
                'data': None
            }

        if user_id is not None and booth.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限修改此摊位',
                'data': None
            }

        allowed_fields = ['vendor_name', 'phone', 'wechat', 'location_desc', 'categories', 'description', 'images']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        affected = self.booth_model.update(booth_id, update_data)
        if affected > 0:
            return {
                'code': 0,
                'msg': '更新成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def verify_booth(self, booth_id: int, is_verified: int) -> Dict[str, Any]:
        booth = self.booth_model.get_by_id(booth_id)
        if not booth:
            return {
                'code': 1,
                'msg': '摊位不存在',
                'data': None
            }

        affected = self.booth_model.verify_booth(booth_id, is_verified)
        if affected > 0:
            return {
                'code': 0,
                'msg': '审核成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '审核失败',
            'data': None
        }

    def update_status(self, booth_id: int, status: int) -> Dict[str, Any]:
        booth = self.booth_model.get_by_id(booth_id)
        if not booth:
            return {
                'code': 1,
                'msg': '摊位不存在',
                'data': None
            }

        affected = self.booth_model.update_status(booth_id, status)
        if affected > 0:
            return {
                'code': 0,
                'msg': '更新成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_booth(self, booth_id: int) -> Dict[str, Any]:
        affected = self.booth_model.delete(booth_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }

    def get_statistics(self) -> Dict[str, Any]:
        total = self.booth_model.count()
        active = self.booth_model.count({'status': 1})
        verified = self.booth_model.count({'is_verified': 1})
        pending = self.booth_model.count({'apply_status': 0})

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_booths': total,
                'active_booths': active,
                'verified_booths': verified,
                'pending_applications': pending
            }
        }
