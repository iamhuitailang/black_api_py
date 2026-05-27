from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateBookRequest(BaseModel):
    category_id: int = Field(..., description="分类ID")
    title: str = Field(..., description="教材标题")
    author: Optional[str] = Field(None, description="作者")
    publisher: Optional[str] = Field(None, description="出版社")
    publish_date: Optional[str] = Field(None, description="出版日期")
    isbn: Optional[str] = Field(None, description="ISBN")
    edition: Optional[str] = Field(None, description="版本")
    price: float = Field(..., description="价格")
    original_price: Optional[float] = Field(None, description="原价")
    condition: Optional[str] = Field('good', description="成色")
    description: Optional[str] = Field(None, description="描述")
    images: Optional[str] = Field(None, description="图片")
    school: Optional[str] = Field(None, description="学校")
    major: Optional[str] = Field(None, description="专业")
    course: Optional[str] = Field(None, description="课程")


class UpdateBookRequest(BaseModel):
    category_id: Optional[int] = Field(None, description="分类ID")
    title: Optional[str] = Field(None, description="教材标题")
    author: Optional[str] = Field(None, description="作者")
    publisher: Optional[str] = Field(None, description="出版社")
    publish_date: Optional[str] = Field(None, description="出版日期")
    isbn: Optional[str] = Field(None, description="ISBN")
    edition: Optional[str] = Field(None, description="版本")
    price: Optional[float] = Field(None, description="价格")
    original_price: Optional[float] = Field(None, description="原价")
    condition: Optional[str] = Field(None, description="成色")
    description: Optional[str] = Field(None, description="描述")
    images: Optional[str] = Field(None, description="图片")
    school: Optional[str] = Field(None, description="学校")
    major: Optional[str] = Field(None, description="专业")
    course: Optional[str] = Field(None, description="课程")


class CreateCategoryRequest(BaseModel):
    name: str = Field(..., description="分类名称")
    icon: Optional[str] = Field(None, description="图标")
    sort_order: Optional[int] = Field(0, description="排序")


class CreateReviewRequest(BaseModel):
    book_id: int = Field(..., description="教材ID")
    order_id: Optional[int] = Field(0, description="订单ID")
    rating: int = Field(5, description="评分")
    content: Optional[str] = Field(None, description="评价内容")
    images: Optional[str] = Field(None, description="图片")


class JiaoyiBookController:
    def __init__(self):
        from app.business.jiaoyi import (
            JiaoyiCategoryBusiness, JiaoyiBookBusiness,
            JiaoyiFavoriteBusiness, JiaoyiReviewBusiness
        )
        self.category_business = JiaoyiCategoryBusiness()
        self.book_business = JiaoyiBookBusiness()
        self.favorite_business = JiaoyiFavoriteBusiness()
        self.review_business = JiaoyiReviewBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.jiaoyi import JiaoyiUserBusiness
        user_business = JiaoyiUserBusiness()
        return user_business.verify_token(token)

    def ActionJiaoyiCategoryListGet(self, request: Request):
        return self.category_business.get_category_list(status=0)

    def ActionJiaoyiCategoryAllGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.category_business.get_category_list()

    def _get_current_admin(self, token: str) -> Optional[dict]:
        from app.business.jiaoyi import JiaoyiAdminBusiness
        admin_business = JiaoyiAdminBusiness()
        return admin_business.verify_token(token)

    def ActionJiaoyiCategoryCreatePost(self, request: Request, body: CreateCategoryRequest,
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.category_business.create_category(
            name=body.name,
            icon=body.icon or '',
            sort_order=body.sort_order or 0
        )

    def ActionJiaoyiCategoryUpdatePost(self, request: Request, category_id: int = Query(..., description="分类ID"),
                                         name: Optional[str] = Query(None, description="名称"),
                                         icon: Optional[str] = Query(None, description="图标"),
                                         sort_order: Optional[int] = Query(None, description="排序"),
                                         status: Optional[int] = Query(None, description="状态"),
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if name is not None:
            data['name'] = name
        if icon is not None:
            data['icon'] = icon
        if sort_order is not None:
            data['sort_order'] = sort_order
        if status is not None:
            data['status'] = status

        return self.category_business.update_category(category_id, data)

    def ActionJiaoyiCategoryDeletePost(self, request: Request, category_id: int = Query(..., description="分类ID"),
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }
        return self.category_business.delete_category(category_id)

    def ActionJiaoyiBookListGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(10, description="每页数量"),
                                 category_id: Optional[int] = Query(None, description="分类ID"),
                                 school: Optional[str] = Query(None, description="学校"),
                                 keyword: Optional[str] = Query(None, description="关键词"),
                                 min_price: Optional[float] = Query(None, description="最低价格"),
                                 max_price: Optional[float] = Query(None, description="最高价格"),
                                 condition: Optional[str] = Query(None, description="成色")):
        return self.book_business.get_book_list(
            page=page,
            page_size=page_size,
            category_id=category_id,
            status=1,
            school=school,
            keyword=keyword,
            min_price=min_price,
            max_price=max_price,
            condition=condition
        )

    def ActionJiaoyiBookDetailGet(self, request: Request, book_id: int = Query(..., description="教材ID"),
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else None
        return self.book_business.get_book_detail(book_id, user_id)

    def ActionJiaoyiBookCreatePost(self, request: Request, body: CreateBookRequest,
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        if user.get('role') not in ['seller', 'both']:
            return {
                'code': 1,
                'msg': '请先升级为卖家角色',
                'data': None
            }

        return self.book_business.create_book(
            seller_id=user.get('id'),
            category_id=body.category_id,
            title=body.title,
            author=body.author or '',
            publisher=body.publisher or '',
            publish_date=body.publish_date or '',
            isbn=body.isbn or '',
            edition=body.edition or '',
            price=body.price,
            original_price=body.original_price or 0,
            condition=body.condition or 'good',
            description=body.description or '',
            images=body.images or '',
            school=body.school or '',
            major=body.major or '',
            course=body.course or ''
        )

    def ActionJiaoyiBookUpdatePost(self, request: Request, book_id: int = Query(..., description="教材ID"),
                                    body: UpdateBookRequest = None,
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        for field in ['category_id', 'title', 'author', 'publisher', 'publish_date',
                      'isbn', 'edition', 'price', 'original_price', 'condition',
                      'description', 'images', 'school', 'major', 'course']:
            value = getattr(body, field, None)
            if value is not None:
                data[field] = value

        return self.book_business.update_book(book_id, user.get('id'), data)

    def ActionJiaoyiBookOffShelfPost(self, request: Request, book_id: int = Query(..., description="教材ID"),
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.book_business.off_shelf_book(book_id, user.get('id'))

    def ActionJiaoyiBookOnShelfPost(self, request: Request, book_id: int = Query(..., description="教材ID"),
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.book_business.on_shelf_book(book_id, user.get('id'))

    def ActionJiaoyiBookDeletePost(self, request: Request, book_id: int = Query(..., description="教材ID"),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.book_business.delete_book(book_id, user.get('id'))

    def ActionJiaoyiBookMyGet(self, request: Request, page: int = Query(1, description="页码"),
                               page_size: int = Query(10, description="每页数量"),
                               status: Optional[int] = Query(None, description="状态"),
                               authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.book_business.get_my_books(user.get('id'), page, page_size, status)

    def ActionJiaoyiBookAuditListGet(self, request: Request, page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      keyword: Optional[str] = Query(None, description="关键词"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.book_business.get_book_list(
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword
        )

    def ActionJiaoyiBookAuditPost(self, request: Request, book_id: int = Query(..., description="教材ID"),
                                   status: int = Query(..., description="状态"),
                                   reject_reason: Optional[str] = Query(None, description="拒绝原因"),
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.book_business.update_book_status(book_id, status, reject_reason or '')

    def ActionJiaoyiFavoriteTogglePost(self, request: Request, book_id: int = Query(..., description="教材ID"),
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.favorite_business.toggle_favorite(user.get('id'), book_id)

    def ActionJiaoyiFavoriteListGet(self, request: Request, page: int = Query(1, description="页码"),
                                     page_size: int = Query(10, description="每页数量"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.favorite_business.get_favorite_list(user.get('id'), page, page_size)

    def ActionJiaoyiFavoriteCheckGet(self, request: Request, book_id: int = Query(..., description="教材ID"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 0,
                'msg': 'success',
                'data': {'is_favorite': False}
            }

        return self.favorite_business.check_favorite(user.get('id'), book_id)

    def ActionJiaoyiReviewCreatePost(self, request: Request, body: CreateReviewRequest,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.create_review(
            user_id=user.get('id'),
            book_id=body.book_id,
            order_id=body.order_id or 0,
            rating=body.rating,
            content=body.content or '',
            images=body.images or ''
        )

    def ActionJiaoyiReviewBookListGet(self, request: Request, book_id: int = Query(..., description="教材ID"),
                                       page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量")):
        return self.review_business.get_book_reviews(book_id, page, page_size)

    def ActionJiaoyiReviewMyGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(10, description="每页数量"),
                                 authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.get_my_reviews(user.get('id'), page, page_size)

    def ActionJiaoyiReviewDeletePost(self, request: Request, review_id: int = Query(..., description="评价ID"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.delete_review(review_id, user.get('id'))
