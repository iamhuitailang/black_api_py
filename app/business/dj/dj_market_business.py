from typing import Dict, Any, List, Optional
from app.model.dj import MarketModel, MarketItemModel


class DjMarketBusiness:
    def __init__(self):
        self.market_model = MarketModel()
        self.market_item_model = MarketItemModel()

    def create_market(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if not data.get('name'):
            return {
                'code': 1,
                'msg': '集市名称不能为空',
                'data': None
            }

        market_id = self.market_model.create(data)
        if market_id > 0:
            return {
                'code': 0,
                'msg': '创建成功',
                'data': {'id': market_id}
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_market(self, market_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        market = self.market_model.get_by_id(market_id)
        if not market:
            return {
                'code': 1,
                'msg': '集市不存在',
                'data': None
            }

        affected = self.market_model.update(market_id, data)
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

    def get_market_detail(self, market_id: int, increment_hot: bool = False) -> Dict[str, Any]:
        market = self.market_model.get_by_id(market_id)
        if not market:
            return {
                'code': 1,
                'msg': '集市不存在',
                'data': None
            }

        if increment_hot:
            self.market_model.increment_hot(market_id)
            market['hot'] = market.get('hot', 0) + 1

        items = self.market_item_model.get_by_market_id(market_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'id': market.get('id'),
                'name': market.get('name'),
                'location': market.get('location'),
                'lunar_dates': market.get('lunar_dates'),
                'solar_dates': market.get('solar_dates'),
                'open_time': market.get('open_time'),
                'close_time': market.get('close_time'),
                'scale': market.get('scale'),
                'hot': market.get('hot'),
                'booth_count': market.get('booth_count'),
                'rating': market.get('rating'),
                'rating_count': market.get('rating_count'),
                'admin_phone': market.get('admin_phone'),
                'description': market.get('description'),
                'images': market.get('images'),
                'status': market.get('status'),
                'created_at': market.get('created_at'),
                'items': items
            }
        }

    def get_market_list(self, page: int = 1, page_size: int = 10, status: int = None, keyword: str = None) -> Dict[str, Any]:
        if keyword:
            items = self.market_model.search_by_name(keyword, status)
            total = len(items)
            start = (page - 1) * page_size
            end = start + page_size
            paginated_items = items[start:end]
            total_pages = (total + page_size - 1) // page_size
        else:
            conditions = {}
            if status is not None:
                conditions['status'] = status

            result = self.market_model.paginate(page, page_size, conditions)
            paginated_items = result.get('items', [])
            total = result.get('total')
            total_pages = result.get('total_pages')

        markets = []
        for item in paginated_items:
            markets.append({
                'id': item.get('id'),
                'name': item.get('name'),
                'location': item.get('location'),
                'lunar_dates': item.get('lunar_dates'),
                'solar_dates': item.get('solar_dates'),
                'open_time': item.get('open_time'),
                'close_time': item.get('close_time'),
                'scale': item.get('scale'),
                'hot': item.get('hot'),
                'booth_count': item.get('booth_count'),
                'rating': item.get('rating'),
                'rating_count': item.get('rating_count'),
                'status': item.get('status')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': markets,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': total_pages
            }
        }

    def get_hot_markets(self, limit: int = 10) -> Dict[str, Any]:
        items = self.market_model.get_hot_markets(limit)

        markets = []
        for item in items:
            markets.append({
                'id': item.get('id'),
                'name': item.get('name'),
                'location': item.get('location'),
                'lunar_dates': item.get('lunar_dates'),
                'solar_dates': item.get('solar_dates'),
                'hot': item.get('hot'),
                'rating': item.get('rating')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': markets
        }

    def update_status(self, market_id: int, status: int) -> Dict[str, Any]:
        market = self.market_model.get_by_id(market_id)
        if not market:
            return {
                'code': 1,
                'msg': '集市不存在',
                'data': None
            }

        affected = self.market_model.update_status(market_id, status)
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

    def delete_market(self, market_id: int) -> Dict[str, Any]:
        market = self.market_model.get_by_id(market_id)
        if not market:
            return {
                'code': 1,
                'msg': '集市不存在',
                'data': None
            }

        self.market_item_model.delete_by_market_id(market_id)
        affected = self.market_model.delete(market_id)

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
        total = self.market_model.count()
        active = self.market_model.count({'status': 1})
        paused = self.market_model.count({'status': 2})
        closed = self.market_model.count({'status': 3})

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_markets': total,
                'active_markets': active,
                'paused_markets': paused,
                'closed_markets': closed
            }
        }

    def add_market_item(self, market_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        market = self.market_model.get_by_id(market_id)
        if not market:
            return {
                'code': 1,
                'msg': '集市不存在',
                'data': None
            }

        item_data = {
            'market_id': market_id,
            'category_id': data.get('category_id'),
            'category_name': data.get('category_name'),
            'area_desc': data.get('area_desc')
        }

        item_id = self.market_item_model.create(item_data)
        if item_id > 0:
            return {
                'code': 0,
                'msg': '添加成功',
                'data': {'id': item_id}
            }

        return {
            'code': 1,
            'msg': '添加失败',
            'data': None
        }

    def delete_market_item(self, item_id: int) -> Dict[str, Any]:
        affected = self.market_item_model.delete(item_id)
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
