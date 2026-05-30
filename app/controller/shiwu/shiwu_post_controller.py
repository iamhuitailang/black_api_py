from typing import Optional, Union
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreatePostRequest(BaseModel):
    post_type: str = Field(..., description="类型: lost/found")
    category_code: str = Field(..., description="分类编码")
    title: str = Field(..., description="标题")
    description: str = Field(..., description="详细描述")
    item_name: Optional[str] = Field(None, description="物品名称")
    item_color: Optional[str] = Field(None, description="物品颜色")
    item_brand: Optional[str] = Field(None, description="物品品牌")
    item_features: Optional[str] = Field(None, description="物品特征")
    lost_time: Optional[str] = Field(None, description="丢失/拾到时间")
    lost_location: Optional[str] = Field(None, description="丢失/拾到地点")
    lost_latitude: Optional[float] = Field(None, description="纬度")
    lost_longitude: Optional[float] = Field(None, description="经度")
    contact: Optional[str] = Field(None, description="联系方式")
    reward: Optional[str] = Field(None, description="酬谢")
    images: Optional[str] = Field(None, description="图片URL列表，逗号分隔")
    expire_days: Optional[int] = Field(30, description="过期天数")


class UpdatePostRequest(BaseModel):
    category_code: Optional[str] = Field(None, description="分类编码")
    title: Optional[str] = Field(None, description="标题")
    description: Optional[str] = Field(None, description="详细描述")
    item_name: Optional[str] = Field(None, description="物品名称")
    item_color: Optional[str] = Field(None, description="物品颜色")
    item_brand: Optional[str] = Field(None, description="物品品牌")
    item_features: Optional[str] = Field(None, description="物品特征")
    lost_time: Optional[str] = Field(None, description="丢失/拾到时间")
    lost_location: Optional[str] = Field(None, description="丢失/拾到地点")
    lost_latitude: Optional[float] = Field(None, description="纬度")
    lost_longitude: Optional[float] = Field(None, description="经度")
    contact: Optional[str] = Field(None, description="联系方式")
    reward: Optional[str] = Field(None, description="酬谢")
    images: Optional[str] = Field(None, description="图片URL列表，逗号分隔")


class ShiwuPostController:
    def __init__(self):
        from app.business.shiwu.post_business import PostBusiness
        from app.business.shiwu.user_business import UserBusiness
        self.post_business = PostBusiness()
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

    def ActionShiwuPostCreatePost(self, request: Request, body: CreatePostRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        发布信息接口
        POST /api/shiwu/post/create
        用户发布寻物启事或招领启事
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.create_post(
            user_id=user.get('id'),
            post_type=body.post_type,
            category_code=body.category_code,
            title=body.title,
            description=body.description,
            item_name=body.item_name or '',
            item_color=body.item_color or '',
            item_brand=body.item_brand or '',
            item_features=body.item_features or '',
            lost_time=body.lost_time,
            lost_location=body.lost_location or '',
            lost_latitude=body.lost_latitude,
            lost_longitude=body.lost_longitude,
            contact=body.contact or '',
            reward=body.reward or '',
            images=body.images or '',
            expire_days=body.expire_days or 30
        )

    def ActionShiwuPostListGet(self, request: Request,
                                page: int = Query(1, ge=1, description="页码"),
                                page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                post_type: Optional[str] = Query(None, description="类型: lost/found"),
                                category_code: Optional[str] = Query(None, description="分类编码"),
                                status: Optional[int] = Query(None, description="状态"),
                                verify_status: Optional[int] = Query(None, description="审核状态"),
                                keyword: Optional[str] = Query(None, description="搜索关键词"),
                                location: Optional[str] = Query(None, description="地点关键词")):
        """
        获取信息列表接口
        GET /api/shiwu/post/list/get
        分页获取信息列表，支持筛选
        """
        return self.post_business.get_post_list(
            page=page,
            page_size=page_size,
            post_type=post_type,
            category_code=category_code,
            status=status,
            verify_status=verify_status,
            keyword=keyword,
            location=location
        )

    def ActionShiwuPostMyListGet(self, request: Request,
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  post_type: Optional[str] = Query(None, description="类型: lost/found"),
                                  status: Optional[Union[str, int]] = Query(None, description="状态"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取我的发布列表接口
        GET /api/shiwu/post/my/list/get
        获取当前用户发布的信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        status_raw = request.query_params.get('status')
        from app.model.shiwu_model.post import PostModel
        status_map = {
            'active': PostModel.STATUS_ACTIVE,
            'claimed': PostModel.STATUS_CLAIMED,
            'expired': PostModel.STATUS_EXPIRED,
            'closed': PostModel.STATUS_CLOSED
        }
        status_int = None
        if status_raw and status_raw != 'all':
            status_int = status_map.get(status_raw)
            if status_int is None:
                try:
                    status_int = int(status_raw)
                except (ValueError, TypeError):
                    status_int = None

        return self.post_business.get_my_posts(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            post_type=post_type,
            status=status_int
        )

    def ActionShiwuPostDetailGet(self, request: Request,
                                  post_id: int = Query(..., description="信息ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取信息详情接口
        GET /api/shiwu/post/detail/get
        根据信息ID获取详细信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        current_user_id = user.get('id') if user else None

        return self.post_business.get_post_detail(
            post_id=post_id,
            current_user_id=current_user_id
        )

    def ActionShiwuPostUpdatePost(self, request: Request,
                                   post_id: int = Query(..., description="信息ID"),
                                   body: UpdatePostRequest = None,
                                   authorization: Optional[str] = Header(None)):
        """
        更新信息接口
        POST /api/shiwu/post/update
        更新自己发布的信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.category_code is not None:
            data['category_code'] = body.category_code
        if body.title is not None:
            data['title'] = body.title
        if body.description is not None:
            data['description'] = body.description
        if body.item_name is not None:
            data['item_name'] = body.item_name
        if body.item_color is not None:
            data['item_color'] = body.item_color
        if body.item_brand is not None:
            data['item_brand'] = body.item_brand
        if body.item_features is not None:
            data['item_features'] = body.item_features
        if body.lost_time is not None:
            data['lost_time'] = body.lost_time
        if body.lost_location is not None:
            data['lost_location'] = body.lost_location
        if body.lost_latitude is not None:
            data['lost_latitude'] = body.lost_latitude
        if body.lost_longitude is not None:
            data['lost_longitude'] = body.lost_longitude
        if body.contact is not None:
            data['contact'] = body.contact
        if body.reward is not None:
            data['reward'] = body.reward
        if body.images is not None:
            data['images'] = body.images

        return self.post_business.update_post(
            user_id=user.get('id'),
            post_id=post_id,
            data=data
        )

    def ActionShiwuPostFoundMarkPost(self, request: Request,
                                      post_id: int = Query(..., description="信息ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        标记已找回接口
        POST /api/shiwu/post/found/mark
        发布者标记物品已找回
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.mark_as_found(
            user_id=user.get('id'),
            post_id=post_id
        )

    def ActionShiwuPostClosePost(self, request: Request,
                                  post_id: int = Query(..., description="信息ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        下架/关闭信息接口
        POST /api/shiwu/post/close
        发布者手动下架信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.mark_as_closed(
            user_id=user.get('id'),
            post_id=post_id
        )

    def ActionShiwuPostDeletePost(self, request: Request,
                                   post_id: int = Query(..., description="信息ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        删除信息接口
        POST /api/shiwu/post/delete
        删除自己发布的信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.delete_post(
            user_id=user.get('id'),
            post_id=post_id
        )

    def ActionShiwuPostStatisticsGet(self, request: Request):
        """
        获取统计数据接口
        GET /api/shiwu/post/statistics/get
        获取发布量、找回率等统计数据
        """
        return self.post_business.get_statistics()

    def ActionShiwuPostMapListGet(self, request: Request,
                                   post_type: Optional[str] = Query(None, description="类型: lost/found"),
                                   category_code: Optional[str] = Query(None, description="分类编码")):
        """
        获取地图标记数据接口
        GET /api/shiwu/post/map/list/get
        获取用于地图显示的标记点数据
        """
        return self.post_business.get_map_posts(
            post_type=post_type,
            category_code=category_code
        )

    def ActionShiwuPostAdminListGet(self, request: Request,
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                     post_type: Optional[str] = Query(None, description="类型: lost/found"),
                                     category_code: Optional[str] = Query(None, description="分类编码"),
                                     status: Optional[int] = Query(None, description="状态"),
                                     verify_status: Optional[int] = Query(None, description="审核状态"),
                                     keyword: Optional[str] = Query(None, description="搜索关键词"),
                                     authorization: Optional[str] = Header(None)):
        """
        管理员获取信息列表接口
        GET /api/shiwu/post/admin/list/get
        管理员获取所有信息列表
        """
        from app.business.shiwu.admin_business import AdminBusiness
        admin_business = AdminBusiness()
        token = self._get_token_from_header(request, authorization)
        admin = admin_business.verify_token(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.get_post_list(
            page=page,
            page_size=page_size,
            post_type=post_type,
            category_code=category_code,
            status=status,
            verify_status=verify_status,
            keyword=keyword
        )
