from typing import Optional
from fastapi import Query, Request
from pydantic import BaseModel
from app.business.bookclub import BookClubBusiness


class RegisterRequest(BaseModel):
    nickname: str
    avatar_url: Optional[str] = ''


class AddBookRequest(BaseModel):
    user_id: int
    title: str
    author: str
    pages: Optional[int] = 0
    start_date: Optional[str] = ''
    end_date: Optional[str] = ''
    rating: Optional[int] = 0
    review: Optional[str] = ''


class UpdateBookRequest(BaseModel):
    user_id: int
    book_id: int
    title: Optional[str] = None
    author: Optional[str] = None
    pages: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    rating: Optional[int] = None
    review: Optional[str] = None


class CheckinRequest(BaseModel):
    user_id: int
    date: Optional[str] = None


class DeleteBookRequest(BaseModel):
    user_id: int
    book_id: int


class BookClubController:
    def __init__(self):
        self.business = BookClubBusiness()

    def ActionBookclubRegisterPost(self, request: Request, body: RegisterRequest):
        """
        注册或获取用户
        POST /api/bookclub/register
        请求体: { nickname: "昵称", avatar_url: "可选头像地址" }
        """
        return self.business.register_or_get_user(body.nickname, body.avatar_url)

    def ActionBookclubUserGet(self, request: Request, user_id: int = Query(..., ge=1)):
        """
        获取用户信息
        GET /api/bookclub/user/get
        参数: user_id - 用户ID
        """
        return self.business.get_user(user_id)

    def ActionBookclubHomepageGet(self, request: Request, user_id: int = Query(..., ge=1)):
        """
        获取用户主页数据
        GET /api/bookclub/homepage/get
        参数: user_id - 用户ID
        """
        return self.business.get_user_homepage(user_id)

    def ActionBookclubAddbookPost(self, request: Request, body: AddBookRequest):
        """
        添加书籍
        POST /api/bookclub/addbook
        """
        return self.business.add_book(
            user_id=body.user_id,
            title=body.title,
            author=body.author,
            pages=body.pages,
            start_date=body.start_date,
            end_date=body.end_date,
            rating=body.rating,
            review=body.review
        )

    def ActionBookclubUpdatebookPut(self, request: Request, body: UpdateBookRequest):
        """
        编辑书籍
        PUT /api/bookclub/updatebook/put
        """
        kwargs = {}
        if body.title is not None:
            kwargs['title'] = body.title
        if body.author is not None:
            kwargs['author'] = body.author
        if body.pages is not None:
            kwargs['pages'] = body.pages
        if body.start_date is not None:
            kwargs['start_date'] = body.start_date
        if body.end_date is not None:
            kwargs['end_date'] = body.end_date
        if body.rating is not None:
            kwargs['rating'] = body.rating
        if body.review is not None:
            kwargs['review'] = body.review
        return self.business.update_book(body.user_id, body.book_id, **kwargs)

    def ActionBookclubDeletebookDelete(self, request: Request, user_id: int = Query(..., ge=1),
                                        book_id: int = Query(..., ge=1)):
        """
        删除书籍
        DELETE /api/bookclub/deletebook/delete
        参数: user_id, book_id
        """
        return self.business.delete_book(user_id, book_id)

    def ActionBookclubCheckinPost(self, request: Request, body: CheckinRequest):
        """
        打卡
        POST /api/bookclub/checkin
        请求体: { user_id, date: 可选日期YYYY-MM-DD }
        """
        return self.business.checkin(body.user_id, body.date)

    def ActionBookclubCalendarGet(self, request: Request, user_id: int = Query(..., ge=1),
                                   year_month: Optional[str] = Query(None)):
        """
        获取打卡日历
        GET /api/bookclub/calendar/get
        参数: user_id, year_month(格式YYYY-MM, 可选)
        """
        return self.business.get_checkin_calendar(user_id, year_month)

    def ActionBookclubLeaderboardGet(self, request: Request, year_month: Optional[str] = Query(None)):
        """
        获取排行榜
        GET /api/bookclub/leaderboard/get
        参数: year_month(格式YYYY-MM, 可选)
        """
        return self.business.get_leaderboard(year_month)

    def ActionBookclubRecentGet(self, request: Request, limit: int = Query(20, ge=1, le=100)):
        """
        获取最近阅读动态
        GET /api/bookclub/recent/get
        参数: limit - 数量限制
        """
        return self.business.get_recent_activity(limit)
