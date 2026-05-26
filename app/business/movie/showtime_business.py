from typing import Dict, Any, Optional, List
from app.model.movie import ShowtimeModel, MovieModel


class ShowtimeBusiness:
    def __init__(self):
        self.showtime_model = ShowtimeModel()
        self.movie_model = MovieModel()

    def _enrich_showtime(self, showtime: Dict[str, Any]) -> Dict[str, Any]:
        showtime['status_text'] = self.showtime_model.get_status_text(showtime.get('status', 0))
        movie_id = showtime.get('movie_id')
        if movie_id:
            movie = self.movie_model.get_by_id(movie_id)
            if movie:
                showtime['movie_title'] = movie.get('title', '')
                showtime['movie_poster'] = movie.get('poster', '')
        return showtime

    def create_showtime(self, movie_id: int, hall_name: str, show_date: str,
                        show_time: str, price: float, total_seats: int = 80,
                        seat_layout: str = '') -> Dict[str, Any]:
        movie = self.movie_model.get_by_id(movie_id)
        if not movie:
            return {'code': 1, 'msg': '影片不存在', 'data': None}

        if not hall_name:
            return {'code': 1, 'msg': '影厅名称不能为空', 'data': None}

        if not show_date or not show_time:
            return {'code': 1, 'msg': '放映日期和时间不能为空', 'data': None}

        if price <= 0:
            return {'code': 1, 'msg': '票价必须大于0', 'data': None}

        showtime_id = self.showtime_model.create(
            movie_id=movie_id, hall_name=hall_name,
            show_date=show_date, show_time=show_time,
            price=price, total_seats=total_seats,
            seat_layout=seat_layout
        )
        if showtime_id > 0:
            showtime = self.showtime_model.get_by_id(showtime_id)
            return {'code': 0, 'msg': '创建成功', 'data': self._enrich_showtime(showtime)}

        return {'code': 1, 'msg': '创建失败', 'data': None}

    def update_showtime(self, showtime_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        showtime = self.showtime_model.get_by_id(showtime_id)
        if not showtime:
            return {'code': 1, 'msg': '场次不存在', 'data': None}

        affected = self.showtime_model.update(showtime_id, data)
        if affected >= 0:
            updated = self.showtime_model.get_by_id(showtime_id)
            return {'code': 0, 'msg': '更新成功', 'data': self._enrich_showtime(updated)}

        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_showtime(self, showtime_id: int) -> Dict[str, Any]:
        showtime = self.showtime_model.get_by_id(showtime_id)
        if not showtime:
            return {'code': 1, 'msg': '场次不存在', 'data': None}

        affected = self.showtime_model.delete(showtime_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}

        return {'code': 1, 'msg': '删除失败', 'data': None}

    def get_showtime_detail(self, showtime_id: int) -> Dict[str, Any]:
        showtime = self.showtime_model.get_by_id(showtime_id)
        if not showtime:
            return {'code': 1, 'msg': '场次不存在', 'data': None}

        enriched = self._enrich_showtime(showtime)
        from app.model.movie import OrderModel
        order_model = OrderModel()
        enriched['sold_seats'] = order_model.get_sold_seats(showtime_id)

        return {'code': 0, 'msg': 'success', 'data': enriched}

    def get_showtimes_by_movie(self, movie_id: int, show_date: str = None) -> Dict[str, Any]:
        movie = self.movie_model.get_by_id(movie_id)
        if not movie:
            return {'code': 1, 'msg': '影片不存在', 'data': None}

        showtimes = self.showtime_model.get_by_movie_id(movie_id, show_date)
        items = [self._enrich_showtime(item) for item in showtimes]

        return {'code': 0, 'msg': 'success', 'data': items}

    def get_showtime_list(self, page: int = 1, page_size: int = 10,
                          movie_id: int = None, show_date: str = None,
                          status: int = None) -> Dict[str, Any]:
        result = self.showtime_model.get_all(page, page_size, movie_id, show_date, status)
        items = [self._enrich_showtime(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def update_showtime_status(self, showtime_id: int, status: int) -> Dict[str, Any]:
        showtime = self.showtime_model.get_by_id(showtime_id)
        if not showtime:
            return {'code': 1, 'msg': '场次不存在', 'data': None}

        affected = self.showtime_model.update_status(showtime_id, status)
        if affected > 0:
            return {'code': 0, 'msg': '状态更新成功', 'data': None}

        return {'code': 1, 'msg': '状态更新失败', 'data': None}