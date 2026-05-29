from typing import Optional, List
from fastapi import Request, Query
from pydantic import BaseModel, Field
from app.business.dianying import (
    DianyingUserBusiness,
    DianyingMovieBusiness,
    DianyingRatingBusiness,
    DianyingFavoriteBusiness,
    DianyingStatsBusiness
)


class LoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    email: str = Field(default='', description="邮箱")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class UpdateProfileRequest(BaseModel):
    email: Optional[str] = Field(default=None, description="邮箱")
    avatar: Optional[str] = Field(default=None, description="头像")


class MovieCreateRequest(BaseModel):
    title: str = Field(..., description="电影标题")
    poster: str = Field(default='', description="海报URL")
    year: Optional[int] = Field(default=None, description="年份")
    genre: str = Field(default='', description="类型")
    director: str = Field(default='', description="导演")
    actors: str = Field(default='', description="演员")
    description: str = Field(default='', description="简介")
    trailer: str = Field(default='', description="预告片URL")
    duration: int = Field(default=0, description="时长(分钟)")
    country: str = Field(default='', description="国家")


class MovieUpdateRequest(BaseModel):
    id: int = Field(..., description="电影ID")
    title: Optional[str] = Field(default=None, description="电影标题")
    poster: Optional[str] = Field(default=None, description="海报URL")
    year: Optional[int] = Field(default=None, description="年份")
    genre: Optional[str] = Field(default=None, description="类型")
    director: Optional[str] = Field(default=None, description="导演")
    actors: Optional[str] = Field(default=None, description="演员")
    description: Optional[str] = Field(default=None, description="简介")
    trailer: Optional[str] = Field(default=None, description="预告片URL")
    duration: Optional[int] = Field(default=None, description="时长(分钟)")
    country: Optional[str] = Field(default=None, description="国家")


class RateRequest(BaseModel):
    movie_id: int = Field(..., description="电影ID")
    score: float = Field(..., ge=1, le=10, description="评分1-10")


class FavoriteRequest(BaseModel):
    movie_id: int = Field(..., description="电影ID")


class DianyingController:
    def __init__(self):
        self.user_business = DianyingUserBusiness()
        self.movie_business = DianyingMovieBusiness()
        self.rating_business = DianyingRatingBusiness()
        self.favorite_business = DianyingFavoriteBusiness()
        self.stats_business = DianyingStatsBusiness()

    def _get_current_user(self, request: Request):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return None
        try:
            from app.common.sqlite.db import get_db
            db = get_db()
            row = db.fetch_one("SELECT * FROM tb_dianying_model_token WHERE token = ?", (token,))
            if not row:
                return None
            from app.model.dianying.user import DianyingUserModel
            user_model = DianyingUserModel()
            user = user_model.get_by_id(row['user_id'])
            if not user:
                return None
            return {'id': user['id'], 'username': user['username'], 'role': user.get('role', 'user')}
        except Exception:
            return None

    def _save_token(self, user_id: int, token: str):
        from app.common.sqlite.db import get_db
        db = get_db()
        from datetime import datetime
        now = datetime.now().isoformat()
        db.execute(
            "INSERT OR REPLACE INTO tb_dianying_model_token (user_id, token, created_at) VALUES (?, ?, ?)",
            (user_id, token, now)
        )

    def ActionDianyingUserLoginPost(self, request: Request, body: LoginRequest):
        """
        用户登录接口
        POST /api/dianying/user/login/post
        """
        result = self.user_business.login(body.username, body.password)
        if result['code'] == 0:
            token = result['data']['access_token']
            user_id = result['data']['user']['id']
            self._save_token(user_id, token)
        return result

    def ActionDianyingUserRegisterPost(self, request: Request, body: RegisterRequest):
        """
        用户注册接口
        POST /api/dianying/user/register/post
        """
        return self.user_business.register(body.username, body.password, body.email)

    def ActionDianyingUserInfoGet(self, request: Request):
        """
        获取当前用户信息
        GET /api/dianying/user/info/get
        """
        user = self._get_current_user(request)
        if not user:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.user_business.get_user_info(user['id'])

    def ActionDianyingUserChangePasswordPost(self, request: Request, body: ChangePasswordRequest):
        """
        修改密码
        POST /api/dianying/user/change/password/post
        """
        user = self._get_current_user(request)
        if not user:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.user_business.change_password(user['id'], body.old_password, body.new_password)

    def ActionDianyingUserUpdatePost(self, request: Request, body: UpdateProfileRequest):
        """
        更新用户信息
        POST /api/dianying/user/update/post
        """
        user = self._get_current_user(request)
        if not user:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.user_business.update_profile(user['id'], body.email, body.avatar)

    def ActionDianyingMovieListGet(self, request: Request,
                                    genre: str = Query(default=None, description="类型"),
                                    year: int = Query(default=None, description="年份"),
                                    min_rating: float = Query(default=None, description="最低评分"),
                                    search: str = Query(default=None, description="搜索关键词"),
                                    page: int = Query(default=1, ge=1, description="页码"),
                                    page_size: int = Query(default=20, ge=1, le=100, description="每页数量")):
        """
        获取电影列表
        GET /api/dianying/movie/list/get
        """
        return self.movie_business.list_movies(genre=genre, year=year, min_rating=min_rating,
                                               search=search, page=page, page_size=page_size)

    def ActionDianyingMovieDetailGet(self, request: Request, id: int = Query(..., description="电影ID")):
        """
        获取电影详情
        GET /api/dianying/movie/detail/get
        """
        return self.movie_business.get_movie(id)

    def ActionDianyingMovieCreatePost(self, request: Request, body: MovieCreateRequest):
        """
        创建电影（管理员）
        POST /api/dianying/movie/create/post
        """
        user = self._get_current_user(request)
        if not user or user.get('role') != 'admin':
            return {'code': 1, 'message': '无权限', 'data': None}
        return self.movie_business.create_movie(
            title=body.title, poster=body.poster, year=body.year, genre=body.genre,
            director=body.director, actors=body.actors, description=body.description,
            trailer=body.trailer, duration=body.duration, country=body.country
        )

    def ActionDianyingMovieUpdatePost(self, request: Request, body: MovieUpdateRequest):
        """
        更新电影（管理员）
        POST /api/dianying/movie/update/post
        """
        user = self._get_current_user(request)
        if not user or user.get('role') != 'admin':
            return {'code': 1, 'message': '无权限', 'data': None}
        kwargs = {}
        for key in ['title', 'poster', 'year', 'genre', 'director', 'actors', 'description', 'trailer', 'duration', 'country']:
            val = getattr(body, key, None)
            if val is not None:
                kwargs[key] = val
        return self.movie_business.update_movie(body.id, **kwargs)

    def ActionDianyingMovieDeleteGet(self, request: Request, id: int = Query(..., description="电影ID")):
        """
        删除电影（管理员）
        GET /api/dianying/movie/delete/get
        """
        user = self._get_current_user(request)
        if not user or user.get('role') != 'admin':
            return {'code': 1, 'message': '无权限', 'data': None}
        return self.movie_business.delete_movie(id)

    def ActionDianyingMovieGenresGet(self, request: Request):
        """
        获取所有电影类型
        GET /api/dianying/movie/genres/get
        """
        return self.movie_business.get_genres()

    def ActionDianyingMovieYearsGet(self, request: Request):
        """
        获取所有年份
        GET /api/dianying/movie/years/get
        """
        return self.movie_business.get_years()

    def ActionDianyingMovieRecommendGet(self, request: Request, limit: int = Query(default=10, ge=1, le=50)):
        """
        获取个性化推荐
        GET /api/dianying/movie/recommend/get
        """
        user = self._get_current_user(request)
        if not user:
            return self.movie_business.list_movies(page_size=limit)
        return self.movie_business.get_recommended(user['id'], limit)

    def ActionDianyingRatingSetPost(self, request: Request, body: RateRequest):
        """
        给电影评分
        POST /api/dianying/rating/set/post
        """
        user = self._get_current_user(request)
        if not user:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.rating_business.rate_movie(user['id'], body.movie_id, body.score)

    def ActionDianyingRatingGetGet(self, request: Request, movie_id: int = Query(..., description="电影ID")):
        """
        获取用户对某电影的评分
        GET /api/dianying/rating/get/get
        """
        user = self._get_current_user(request)
        if not user:
            return {'code': 0, 'message': 'success', 'data': None}
        return self.rating_business.get_user_movie_rating(user['id'], movie_id)

    def ActionDianyingRatingMyListGet(self, request: Request):
        """
        获取我的评分列表
        GET /api/dianying/rating/my/list/get
        """
        user = self._get_current_user(request)
        if not user:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.rating_business.get_user_ratings(user['id'])

    def ActionDianyingFavoriteTogglePost(self, request: Request, body: FavoriteRequest):
        """
        切换收藏状态
        POST /api/dianying/favorite/toggle/post
        """
        user = self._get_current_user(request)
        if not user:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.favorite_business.toggle_favorite(user['id'], body.movie_id)

    def ActionDianyingFavoriteCheckGet(self, request: Request, movie_id: int = Query(..., description="电影ID")):
        """
        检查是否已收藏
        GET /api/dianying/favorite/check/get
        """
        user = self._get_current_user(request)
        if not user:
            return {'code': 0, 'message': 'success', 'data': {'is_favorite': False}}
        return self.favorite_business.check_favorite(user['id'], movie_id)

    def ActionDianyingFavoriteListGet(self, request: Request):
        """
        获取我的收藏列表
        GET /api/dianying/favorite/list/get
        """
        user = self._get_current_user(request)
        if not user:
            return {'code': 1, 'message': '未登录', 'data': None}
        return self.favorite_business.get_user_favorites(user['id'])

    def ActionDianyingFavoriteIdsGet(self, request: Request):
        """
        获取我的收藏ID列表
        GET /api/dianying/favorite/ids/get
        """
        user = self._get_current_user(request)
        if not user:
            return {'code': 0, 'message': 'success', 'data': []}
        return self.favorite_business.get_user_favorite_ids(user['id'])

    def ActionDianyingStatsDashboardGet(self, request: Request):
        """
        获取统计面板数据
        GET /api/dianying/stats/dashboard/get
        """
        return self.stats_business.get_dashboard()

    def ActionDianyingStatsRatingDistributionGet(self, request: Request):
        """
        获取评分分布
        GET /api/dianying/stats/rating/distribution/get
        """
        return self.stats_business.get_rating_distribution()

    def ActionDianyingStatsTopMoviesGet(self, request: Request, limit: int = Query(default=10, ge=1, le=50)):
        """
        获取热门电影
        GET /api/dianying/stats/top/movies/get
        """
        return self.stats_business.get_top_movies(limit)

    def ActionDianyingStatsGenreDistributionGet(self, request: Request):
        """
        获取类型分布
        GET /api/dianying/stats/genre/distribution/get
        """
        return self.stats_business.get_genre_distribution()

    def ActionDianyingStatsYearDistributionGet(self, request: Request):
        """
        获取年份分布
        GET /api/dianying/stats/year/distribution/get
        """
        return self.stats_business.get_year_distribution()
