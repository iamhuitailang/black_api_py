from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class CreateMovieRequest(BaseModel):
    title: str = Field(..., description="影片标题")
    poster: Optional[str] = Field(None, description="海报URL")
    description: Optional[str] = Field(None, description="影片描述")
    duration: Optional[int] = Field(0, description="时长(分钟)")
    genre: Optional[str] = Field(None, description="类型")
    director: Optional[str] = Field(None, description="导演")
    actors: Optional[str] = Field(None, description="演员")
    language: Optional[str] = Field(None, description="语言")
    rating: Optional[float] = Field(0, description="评分")
    trailer_url: Optional[str] = Field(None, description="预告片URL")
    status: Optional[int] = Field(0, description="状态")
    release_date: Optional[str] = Field(None, description="上映日期")


class UpdateMovieRequest(BaseModel):
    title: Optional[str] = Field(None, description="影片标题")
    poster: Optional[str] = Field(None, description="海报URL")
    description: Optional[str] = Field(None, description="影片描述")
    duration: Optional[int] = Field(None, description="时长(分钟)")
    genre: Optional[str] = Field(None, description="类型")
    director: Optional[str] = Field(None, description="导演")
    actors: Optional[str] = Field(None, description="演员")
    language: Optional[str] = Field(None, description="语言")
    rating: Optional[float] = Field(None, description="评分")
    trailer_url: Optional[str] = Field(None, description="预告片URL")
    status: Optional[int] = Field(None, description="状态")
    release_date: Optional[str] = Field(None, description="上映日期")


class CreateShowtimeRequest(BaseModel):
    movie_id: int = Field(..., description="影片ID")
    hall_name: str = Field(..., description="影厅名称")
    show_date: str = Field(..., description="放映日期")
    show_time: str = Field(..., description="放映时间")
    price: float = Field(..., description="票价")
    total_seats: Optional[int] = Field(80, description="总座位数")
    seat_layout: Optional[str] = Field(None, description="座位布局")


class UpdateShowtimeRequest(BaseModel):
    movie_id: Optional[int] = Field(None, description="影片ID")
    hall_name: Optional[str] = Field(None, description="影厅名称")
    show_date: Optional[str] = Field(None, description="放映日期")
    show_time: Optional[str] = Field(None, description="放映时间")
    price: Optional[float] = Field(None, description="票价")
    total_seats: Optional[int] = Field(None, description="总座位数")
    seat_layout: Optional[str] = Field(None, description="座位布局")
    status: Optional[int] = Field(None, description="状态")


class MovieAdminController:
    def __init__(self):
        from app.business.movie.auth_business import MovieAuthBusiness
        from app.business.movie.movie_business import MovieBusiness
        from app.business.movie.showtime_business import ShowtimeBusiness
        from app.business.movie.order_business import OrderBusiness
        from app.business.movie.admin_business import MovieAdminBusiness
        self.auth_business = MovieAuthBusiness()
        self.movie_business = MovieBusiness()
        self.showtime_business = ShowtimeBusiness()
        self.order_business = OrderBusiness()
        self.admin_business = MovieAdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        user = self.auth_business.verify_token(token)
        if user and user.get('role') == 'admin':
            return user
        return None

    def ActionMovieAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录接口
        POST /api/movie/admin/login
        """
        return self.auth_business.admin_login(
            username=body.username,
            password=body.password
        )

    def ActionMovieAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        管理员登出接口
        POST /api/movie/admin/logout
        """
        token = self._get_token_from_header(request, authorization)
        return self.auth_business.logout(token)

    def ActionMovieAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前管理员信息接口
        GET /api/movie/admin/current/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.auth_business.get_current_user(token)

    def ActionMovieAdminStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取数据统计接口
        GET /api/movie/admin/statistics/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.admin_business.get_statistics()

    def ActionMovieAdminMovieCreatePost(self, request: Request, body: CreateMovieRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        创建影片接口
        POST /api/movie/admin/movie/create
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.movie_business.create_movie(
            title=body.title,
            poster=body.poster or '',
            description=body.description or '',
            duration=body.duration or 0,
            genre=body.genre or '',
            director=body.director or '',
            actors=body.actors or '',
            language=body.language or '',
            rating=body.rating or 0,
            trailer_url=body.trailer_url or '',
            status=body.status or 0,
            release_date=body.release_date or ''
        )

    def ActionMovieAdminMovieUpdatePost(self, request: Request, body: UpdateMovieRequest,
                                         movie_id: int = Query(..., description="影片ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        更新影片接口
        POST /api/movie/admin/movie/update
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.poster is not None:
            data['poster'] = body.poster
        if body.description is not None:
            data['description'] = body.description
        if body.duration is not None:
            data['duration'] = body.duration
        if body.genre is not None:
            data['genre'] = body.genre
        if body.director is not None:
            data['director'] = body.director
        if body.actors is not None:
            data['actors'] = body.actors
        if body.language is not None:
            data['language'] = body.language
        if body.rating is not None:
            data['rating'] = body.rating
        if body.trailer_url is not None:
            data['trailer_url'] = body.trailer_url
        if body.status is not None:
            data['status'] = body.status
        if body.release_date is not None:
            data['release_date'] = body.release_date

        return self.movie_business.update_movie(movie_id=movie_id, data=data)

    def ActionMovieAdminMovieDeletePost(self, request: Request, movie_id: int = Query(..., description="影片ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        删除影片接口
        POST /api/movie/admin/movie/delete
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.movie_business.delete_movie(movie_id=movie_id)

    def ActionMovieAdminMovieListGet(self, request: Request,
                                      page: int = Query(1, ge=1, description="页码"),
                                      page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                      status: Optional[int] = Query(None, description="影片状态"),
                                      keyword: Optional[str] = Query(None, description="搜索关键词"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取影片列表接口（管理员）
        GET /api/movie/admin/movie/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.movie_business.get_movie_list(
            page=page, page_size=page_size, status=status, keyword=keyword
        )

    def ActionMovieAdminShowtimeCreatePost(self, request: Request, body: CreateShowtimeRequest,
                                            authorization: Optional[str] = Header(None)):
        """
        创建场次接口
        POST /api/movie/admin/showtime/create
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.showtime_business.create_showtime(
            movie_id=body.movie_id,
            hall_name=body.hall_name,
            show_date=body.show_date,
            show_time=body.show_time,
            price=body.price,
            total_seats=body.total_seats or 80,
            seat_layout=body.seat_layout or ''
        )

    def ActionMovieAdminShowtimeUpdatePost(self, request: Request, body: UpdateShowtimeRequest,
                                            showtime_id: int = Query(..., description="场次ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        更新场次接口
        POST /api/movie/admin/showtime/update
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        data = {}
        if body.movie_id is not None:
            data['movie_id'] = body.movie_id
        if body.hall_name is not None:
            data['hall_name'] = body.hall_name
        if body.show_date is not None:
            data['show_date'] = body.show_date
        if body.show_time is not None:
            data['show_time'] = body.show_time
        if body.price is not None:
            data['price'] = body.price
        if body.total_seats is not None:
            data['total_seats'] = body.total_seats
        if body.seat_layout is not None:
            data['seat_layout'] = body.seat_layout
        if body.status is not None:
            data['status'] = body.status

        return self.showtime_business.update_showtime(showtime_id=showtime_id, data=data)

    def ActionMovieAdminShowtimeDeletePost(self, request: Request, showtime_id: int = Query(..., description="场次ID"),
                                            authorization: Optional[str] = Header(None)):
        """
        删除场次接口
        POST /api/movie/admin/showtime/delete
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.showtime_business.delete_showtime(showtime_id=showtime_id)

    def ActionMovieAdminShowtimeListGet(self, request: Request,
                                         page: int = Query(1, ge=1, description="页码"),
                                         page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                         movie_id: Optional[int] = Query(None, description="影片ID"),
                                         show_date: Optional[str] = Query(None, description="放映日期"),
                                         status: Optional[int] = Query(None, description="状态"),
                                         authorization: Optional[str] = Header(None)):
        """
        获取场次列表接口（管理员）
        GET /api/movie/admin/showtime/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.showtime_business.get_showtime_list(
            page=page, page_size=page_size, movie_id=movie_id,
            show_date=show_date, status=status
        )

    def ActionMovieAdminOrderListGet(self, request: Request,
                                      page: int = Query(1, ge=1, description="页码"),
                                      page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                      status: Optional[int] = Query(None, description="订单状态"),
                                      keyword: Optional[str] = Query(None, description="搜索关键词"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取所有订单列表接口
        GET /api/movie/admin/order/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.get_all_orders(
            page=page, page_size=page_size, status=status, keyword=keyword
        )

    def ActionMovieAdminOrderDetailGet(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        获取订单详情接口（管理员）
        GET /api/movie/admin/order/detail/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.get_order_detail(order_id=order_id)

    def ActionMovieAdminOrderVerifyPost(self, request: Request, order_id: int = Query(..., description="订单ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        核销订单接口
        POST /api/movie/admin/order/verify
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.verify_order(order_id=order_id)

    def ActionMovieAdminOrderSearchGet(self, request: Request, order_no: str = Query(..., description="订单号"),
                                        authorization: Optional[str] = Header(None)):
        """
        根据订单号搜索接口
        GET /api/movie/admin/order/search/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.get_order_by_no(order_no=order_no)

    def ActionMovieAdminUserListGet(self, request: Request,
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                     role: Optional[str] = Query(None, description="角色"),
                                     status: Optional[int] = Query(None, description="用户状态"),
                                     keyword: Optional[str] = Query(None, description="搜索关键词"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/movie/admin/user/list/get
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.admin_business.get_user_list(
            page=page, page_size=page_size, role=role, status=status, keyword=keyword
        )

    def ActionMovieAdminUserBanPost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        封禁用户接口
        POST /api/movie/admin/user/ban
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.admin_business.ban_user(user_id=user_id)

    def ActionMovieAdminUserUnbanPost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        解封用户接口
        POST /api/movie/admin/user/unban
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.admin_business.unban_user(user_id=user_id)