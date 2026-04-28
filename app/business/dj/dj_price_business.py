from typing import Dict, Any, List, Optional
from app.model.dj import PriceModel, MarketModel


class DjPriceBusiness:
    def __init__(self):
        self.price_model = PriceModel()
        self.market_model = MarketModel()

    def report_price(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        market_id = data.get('market_id')
        if not market_id:
            return {
                'code': 1,
                'msg': '请选择集市',
                'data': None
            }

        if not data.get('item_name'):
            return {
                'code': 1,
                'msg': '物品名称不能为空',
                'data': None
            }

        if data.get('min_price') is None or data.get('max_price') is None:
            return {
                'code': 1,
                'msg': '价格不能为空',
                'data': None
            }

        market = self.market_model.get_by_id(market_id)
        if not market:
            return {
                'code': 1,
                'msg': '集市不存在',
                'data': None
            }

        price_data = {
            'market_id': market_id,
            'item_name': data.get('item_name'),
            'category_id': data.get('category_id'),
            'category_name': data.get('category_name'),
            'min_price': data.get('min_price'),
            'max_price': data.get('max_price'),
            'unit': data.get('unit', '斤'),
            'user_id': user_id,
            'report_status': 0
        }

        price_id = self.price_model.create(price_data)
        if price_id > 0:
            return {
                'code': 0,
                'msg': '价格已上报，等待审核',
                'data': {'id': price_id}
            }

        return {
            'code': 1,
            'msg': '上报失败',
            'data': None
        }

    def get_price_detail(self, price_id: int) -> Dict[str, Any]:
        price = self.price_model.get_by_id(price_id)
        if not price:
            return {
                'code': 1,
                'msg': '价格记录不存在',
                'data': None
            }

        market = self.market_model.get_by_id(price.get('market_id'))

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'id': price.get('id'),
                'market_id': price.get('market_id'),
                'market_name': market.get('name') if market else None,
                'item_name': price.get('item_name'),
                'category_id': price.get('category_id'),
                'category_name': price.get('category_name'),
                'min_price': price.get('min_price'),
                'max_price': price.get('max_price'),
                'unit': price.get('unit'),
                'user_id': price.get('user_id'),
                'report_status': price.get('report_status'),
                'auditor_id': price.get('auditor_id'),
                'audit_time': price.get('audit_time'),
                'created_at': price.get('created_at')
            }
        }

    def get_price_list(self, page: int = 1, page_size: int = 10, market_id: int = None, report_status: int = None) -> Dict[str, Any]:
        conditions = {}
        if market_id is not None:
            conditions['market_id'] = market_id
        if report_status is not None:
            conditions['report_status'] = report_status

        result = self.price_model.paginate(page, page_size, conditions)

        prices = []
        for item in result.get('items', []):
            market = self.market_model.get_by_id(item.get('market_id'))
            prices.append({
                'id': item.get('id'),
                'market_id': item.get('market_id'),
                'market_name': market.get('name') if market else None,
                'item_name': item.get('item_name'),
                'category_name': item.get('category_name'),
                'min_price': item.get('min_price'),
                'max_price': item.get('max_price'),
                'unit': item.get('unit'),
                'report_status': item.get('report_status'),
                'created_at': item.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': prices,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_pending_reports(self) -> Dict[str, Any]:
        items = self.price_model.get_pending_reports()

        prices = []
        for item in items:
            market = self.market_model.get_by_id(item.get('market_id'))
            prices.append({
                'id': item.get('id'),
                'market_id': item.get('market_id'),
                'market_name': market.get('name') if market else None,
                'item_name': item.get('item_name'),
                'category_name': item.get('category_name'),
                'min_price': item.get('min_price'),
                'max_price': item.get('max_price'),
                'unit': item.get('unit'),
                'user_id': item.get('user_id'),
                'created_at': item.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': prices
        }

    def get_market_prices(self, market_id: int) -> Dict[str, Any]:
        items = self.price_model.get_by_market_id(market_id, report_status=1)

        prices = []
        for item in items:
            prices.append({
                'id': item.get('id'),
                'item_name': item.get('item_name'),
                'category_name': item.get('category_name'),
                'min_price': item.get('min_price'),
                'max_price': item.get('max_price'),
                'unit': item.get('unit'),
                'created_at': item.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': prices
        }

    def get_price_trend(self, market_id: int, item_name: str) -> Dict[str, Any]:
        if not item_name:
            return {
                'code': 1,
                'msg': '物品名称不能为空',
                'data': None
            }

        items = self.price_model.get_price_trend(market_id, item_name, limit=30)

        trend = []
        for item in items:
            trend.append({
                'min_price': item.get('min_price'),
                'max_price': item.get('max_price'),
                'unit': item.get('unit'),
                'date': item.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': trend
        }

    def audit_price(self, price_id: int, auditor_id: int, report_status: int) -> Dict[str, Any]:
        price = self.price_model.get_by_id(price_id)
        if not price:
            return {
                'code': 1,
                'msg': '价格记录不存在',
                'data': None
            }

        affected = self.price_model.audit_price(price_id, auditor_id, report_status)
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

    def delete_price(self, price_id: int) -> Dict[str, Any]:
        affected = self.price_model.delete(price_id)
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
        total = self.price_model.count()
        approved = self.price_model.count({'report_status': 1})
        pending = self.price_model.count({'report_status': 0})
        rejected = self.price_model.count({'report_status': 2})

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_reports': total,
                'approved_reports': approved,
                'pending_reports': pending,
                'rejected_reports': rejected
            }
        }
