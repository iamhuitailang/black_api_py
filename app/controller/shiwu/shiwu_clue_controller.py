from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateClueRequest(BaseModel):
    post_id: int = Field(..., description="寻物信息ID")
    description: Optional[str] = Field(None, description="线索描述")
    location: Optional[str] = Field(None, description="发现地点")
    location_latitude: Optional[float] = Field(None, description="地点纬度")
    location_longitude: Optional[float] = Field(None, description="地点经度")
    contact: Optional[str] = Field(None, description="联系方式")
    images: Optional[str] = Field(None, description="图片URL列表，逗号分隔")


class CreateClueReviewRequest(BaseModel):
    clue_id: int = Field(..., description="线索ID")
    rating: int = Field(5, description="评分 1-5")
    content: Optional[str] = Field(None, description="评价内容")


class ShiwuClueController:
    def __init__(self):
        from app.business.shiwu.clue_business import ClueBusiness
        from app.business.shiwu.user_business import UserBusiness
        self.clue_business = ClueBusiness()
        self.user_business = UserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionShiwuClueCreatePost(self, request: Request, body: CreateClueRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        提供线索接口
        POST /api/shiwu/clue/create
        用户对寻物启事提供线索
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.clue_business.create_clue(
            provider_id=user.get('id'),
            post_id=body.post_id,
            description=body.description or '',
            location=body.location or '',
            location_latitude=body.location_latitude,
            location_longitude=body.location_longitude,
            contact=body.contact or '',
            images=body.images or ''
        )

    def ActionShiwuClueDetailGet(self, request: Request,
                                  clue_id: int = Query(..., description="线索ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取线索详情接口
        GET /api/shiwu/clue/detail/get
        根据线索ID获取详细信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        current_user_id = user.get('id') if user else None

        return self.clue_business.get_clue_by_id(
            clue_id=clue_id,
            current_user_id=current_user_id
        )

    def ActionShiwuClueByPostGet(self, request: Request,
                                  post_id: int = Query(..., description="信息ID"),
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  status: Optional[int] = Query(None, description="状态"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取某信息收到的线索接口
        GET /api/shiwu/clue/by/post/get
        信息发布者查看收到的线索
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.clue_business.get_clues_by_post(
            post_id=post_id,
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionShiwuClueMyListGet(self, request: Request,
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  status: Optional[int] = Query(None, description="状态"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取我提供的线索接口
        GET /api/shiwu/clue/my/list/get
        获取当前用户提供的线索列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.clue_business.get_my_clues(
            provider_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionShiwuClueReceivedGet(self, request: Request,
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                    status: Optional[int] = Query(None, description="状态"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取我收到的线索接口
        GET /api/shiwu/clue/received/get
        获取当前用户发布的信息收到的线索
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.clue_business.get_received_clues(
            owner_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionShiwuClueReadMarkPost(self, request: Request,
                                     clue_id: int = Query(..., description="线索ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        标记线索已读接口
        POST /api/shiwu/clue/read/mark
        信息发布者标记线索为已读
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.clue_business.mark_clue_read(
            owner_id=user.get('id'),
            clue_id=clue_id
        )

    def ActionShiwuClueContactedMarkPost(self, request: Request,
                                          clue_id: int = Query(..., description="线索ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        标记已联系接口
        POST /api/shiwu/clue/contacted/mark
        信息发布者标记已与线索提供者联系
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.clue_business.mark_clue_contacted(
            owner_id=user.get('id'),
            clue_id=clue_id
        )

    def ActionShiwuClueDeletePost(self, request: Request,
                                   clue_id: int = Query(..., description="线索ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        删除线索接口
        POST /api/shiwu/clue/delete
        线索提供者删除自己提供的线索
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.clue_business.delete_clue(
            provider_id=user.get('id'),
            clue_id=clue_id
        )

    def ActionShiwuClueReviewPost(self, request: Request,
                                   body: CreateClueReviewRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        评价线索接口
        POST /api/shiwu/clue/review
        线索帮助找回物品后双方互评
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.clue_business.create_review(
            reviewer_id=user.get('id'),
            clue_id=body.clue_id,
            rating=body.rating,
            content=body.content or ''
        )
