from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateBookRequest(BaseModel):
    title: str = Field(..., description="书名")
    author: Optional[str] = Field('', description="作者")
    isbn: Optional[str] = Field('', description="ISBN")
    publisher: Optional[str] = Field('', description="出版社")
    category: str = Field(..., description="分类代码")
    original_price: Optional[float] = Field(0, description="原价")
    price: float = Field(..., description="售价")
    condition_level: str = Field(..., description="成色")
    description: Optional[str] = Field('', description="描述")
    cover_image: Optional[str] = Field('', description="封面图")


class UpdateBookRequest(BaseModel):
    title: Optional[str] = Field(None, description="书名")
    author: Optional[str] = Field(None, description="作者")
    isbn: Optional[str] = Field(None, description="ISBN")
    publisher: Optional[str] = Field(None, description="出版社")
    category: Optional[str] = Field(None, description="分类代码")
    original_price: Optional[float] = Field(None, description="原价")
    price: Optional[float] = Field(None, description="售价")
    condition_level: Optional[str] = Field(None, description="成色")
    description: Optional[str] = Field(None, description="描述")
    cover_image: Optional[str] = Field(None, description="封面图")


class ErshoushuBookController:
    def __init__(self):
        from app.business.ershoushu_077_model.book_business import ErshoushuBookBusiness
        from app.business.ershoushu_077_model.user_business import ErshoushuUserBusiness
        self.book_business = ErshoushuBookBusiness()
        self.user_business = ErshoushuUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionErshoushuBookCreatePost(self, request: Request, body: CreateBookRequest,
                                       authorization: Optional[str] = Header(None)):
        """
        发布二手书接口
        POST /api/ershoushu/book/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.book_business.create_book(
            user_id=user.get('id'),
            title=body.title,
            author=body.author or '',
            isbn=body.isbn or '',
            publisher=body.publisher or '',
            category=body.category,
            original_price=body.original_price or 0,
            price=body.price,
            condition_level=body.condition_level,
            description=body.description or '',
            cover_image=body.cover_image or ''
        )

    def ActionErshoushuBookDetailGet(self, request: Request, book_id: int = Query(..., description="书籍ID")):
        """
        获取书籍详情接口
        GET /api/ershoushu/book/detail/get
        """
        return self.book_business.get_book_detail(book_id)

    def ActionErshoushuBookListGet(self, request: Request,
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                    category: Optional[str] = Query(None, description="分类"),
                                    keyword: Optional[str] = Query(None, description="搜索关键词"),
                                    condition_level: Optional[str] = Query(None, description="成色"),
                                    min_price: Optional[float] = Query(None, description="最低价"),
                                    max_price: Optional[float] = Query(None, description="最高价"),
                                    order_by: str = Query('created_at DESC', description="排序")):
        """
        获取书籍列表接口
        GET /api/ershoushu/book/list/get
        """
        return self.book_business.get_book_list(
            page=page, page_size=page_size,
            category=category, keyword=keyword,
            condition_level=condition_level,
            min_price=min_price, max_price=max_price,
            order_by=order_by
        )

    def ActionErshoushuBookMyListGet(self, request: Request,
                                      page: int = Query(1, ge=1, description="页码"),
                                      page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取我的书籍列表接口
        GET /api/ershoushu/book/my/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.book_business.get_my_books(user.get('id'), page, page_size, status)

    def ActionErshoushuBookUpdatePost(self, request: Request, book_id: int = Query(..., description="书籍ID"),
                                       body: UpdateBookRequest = None,
                                       authorization: Optional[str] = Header(None)):
        """
        更新书籍接口
        POST /api/ershoushu/book/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.author is not None:
            data['author'] = body.author
        if body.isbn is not None:
            data['isbn'] = body.isbn
        if body.publisher is not None:
            data['publisher'] = body.publisher
        if body.category is not None:
            data['category'] = body.category
        if body.original_price is not None:
            data['original_price'] = body.original_price
        if body.price is not None:
            data['price'] = body.price
        if body.condition_level is not None:
            data['condition_level'] = body.condition_level
        if body.description is not None:
            data['description'] = body.description
        if body.cover_image is not None:
            data['cover_image'] = body.cover_image
        return self.book_business.update_book(user.get('id'), book_id, data)

    def ActionErshoushuBookDeletePost(self, request: Request, book_id: int = Query(..., description="书籍ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        删除书籍接口
        POST /api/ershoushu/book/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.book_business.delete_book(user.get('id'), book_id)

    def ActionErshoushuBookCategoriesGet(self, request: Request):
        """
        获取分类列表接口
        GET /api/ershoushu/book/categories/get
        """
        return self.book_business.get_categories()

    def ActionErshoushuBookConditionsGet(self, request: Request):
        """
        获取成色列表接口
        GET /api/ershoushu/book/conditions/get
        """
        return self.book_business.get_conditions()

    def ActionErshoushuBookStatisticsGet(self, request: Request):
        """
        获取书籍统计接口
        GET /api/ershoushu/book/statistics/get
        """
        return self.book_business.get_statistics()

    def ActionErshoushuBookAdminListGet(self, request: Request,
                                         page: int = Query(1, ge=1, description="页码"),
                                         page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                         category: Optional[str] = Query(None, description="分类"),
                                         status: Optional[int] = Query(None, description="状态"),
                                         is_checked: Optional[int] = Query(None, description="审核状态"),
                                         keyword: Optional[str] = Query(None, description="搜索关键词"),
                                         authorization: Optional[str] = Header(None)):
        """
        管理端获取书籍列表接口
        GET /api/ershoushu/book/admin/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        if user.get('role') != 'admin':
            return {'code': 1, 'msg': '无权限', 'data': None}
        return self.book_business.get_admin_book_list(page, page_size, category, status, is_checked, keyword)

    def ActionErshoushuBookCheckPost(self, request: Request, book_id: int = Query(..., description="书籍ID"),
                                      is_checked: int = Query(..., description="审核状态 0/1"),
                                      authorization: Optional[str] = Header(None)):
        """
        审核书籍接口
        POST /api/ershoushu/book/check
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        if user.get('role') != 'admin':
            return {'code': 1, 'msg': '无权限', 'data': None}
        return self.book_business.check_book(book_id, is_checked)
