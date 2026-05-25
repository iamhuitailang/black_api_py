from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateOrderRequest(BaseModel):
    title: str = Field(..., description="报修标题")
    description: Optional[str] = Field('', description="报修描述")
    category: Optional[str] = Field('', description="报修类别")
    urgency: Optional[int] = Field(1, description="紧急程度: 0-低 1-普通 2-高 3-紧急")
    dormitory_id: Optional[int] = Field(0, description="宿舍楼ID")
    room_number: Optional[str] = Field('', description="房间号")
    contact_name: Optional[str] = Field('', description="联系人")
    contact_phone: Optional[str] = Field('', description="联系电话")
    images: Optional[str] = Field('', description="图片")


class UpdateOrderRequest(BaseModel):
    title: Optional[str] = Field(None, description="报修标题")
    description: Optional[str] = Field(None, description="报修描述")
    category: Optional[str] = Field(None, description="报修类别")
    urgency: Optional[int] = Field(None, description="紧急程度")
    dormitory_id: Optional[int] = Field(None, description="宿舍楼ID")
    room_number: Optional[str] = Field(None, description="房间号")
    contact_name: Optional[str] = Field(None, description="联系人")
    contact_phone: Optional[str] = Field(None, description="联系电话")
    images: Optional[str] = Field(None, description="图片")


class AssignOrderRequest(BaseModel):
    repairman_id: int = Field(..., description="维修工ID")


class CompleteOrderRequest(BaseModel):
    description: Optional[str] = Field('', description="维修描述")
    images: Optional[str] = Field('', description="维修图片")


class CancelOrderRequest(BaseModel):
    reason: Optional[str] = Field('', description="取消原因")


class BaoxiuOrderController:
    def __init__(self):
        from app.business.baoxiu.order_business import BaoxiuOrderBusiness
        from app.business.baoxiu.auth_business import BaoxiuAuthBusiness
        self.order_business = BaoxiuOrderBusiness()
        self.auth_business = BaoxiuAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionBaoxiuOrderCreatePost(self, request: Request, body: CreateOrderRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建报修单接口
        POST /api/baoxiu/order/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.create_order(
            student_id=user.get('id'),
            title=body.title,
            description=body.description or '',
            category=body.category or '',
            urgency=body.urgency or 1,
            dormitory_id=body.dormitory_id or 0,
            room_number=body.room_number or '',
            contact_name=body.contact_name or '',
            contact_phone=body.contact_phone or '',
            images=body.images or ''
        )

    def ActionBaoxiuOrderListGet(self, request: Request,
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  student_id: Optional[int] = Query(None, description="学生ID"),
                                  repairman_id: Optional[int] = Query(None, description="维修工ID"),
                                  status: Optional[int] = Query(None, description="状态"),
                                  dormitory_id: Optional[int] = Query(None, description="宿舍楼ID"),
                                  category: Optional[str] = Query(None, description="类别"),
                                  urgency: Optional[int] = Query(None, description="紧急程度"),
                                  keyword: Optional[str] = Query(None, description="搜索关键词"),
                                  include_pending: Optional[bool] = Query(False, description="是否包含待分配工单"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取报修单列表接口
        GET /api/baoxiu/order/list/get
        """
        return self.order_business.get_order_list(
            page=page, page_size=page_size,
            student_id=student_id, repairman_id=repairman_id,
            status=status, dormitory_id=dormitory_id,
            category=category, urgency=urgency, keyword=keyword,
            include_pending=include_pending
        )

    def ActionBaoxiuOrderDetailGet(self, request: Request,
                                    order_id: int = Query(..., description="报修单ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取报修单详情接口
        GET /api/baoxiu/order/detail/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        
        user_id = user.get('id') if user else None
        role = user.get('role') if user else None
        
        return self.order_business.get_order_detail(order_id, user_id=user_id, role=role)

    def ActionBaoxiuOrderAssignPost(self, request: Request, body: AssignOrderRequest,
                                     order_id: int = Query(..., description="报修单ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        分配报修单接口
        POST /api/baoxiu/order/assign
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.assign_order(
            order_id=order_id,
            repairman_id=body.repairman_id,
            operator_id=user.get('id')
        )

    def ActionBaoxiuOrderAcceptPost(self, request: Request,
                                     order_id: int = Query(..., description="报修单ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        维修工接单接口
        POST /api/baoxiu/order/accept
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.accept_order(
            order_id=order_id,
            repairman_id=user.get('id')
        )

    def ActionBaoxiuOrderStartPost(self, request: Request,
                                    order_id: int = Query(..., description="报修单ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        开始维修接口
        POST /api/baoxiu/order/start
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.start_processing(
            order_id=order_id,
            repairman_id=user.get('id')
        )

    def ActionBaoxiuOrderCompletePost(self, request: Request, body: CompleteOrderRequest,
                                       order_id: int = Query(..., description="报修单ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        完成维修接口
        POST /api/baoxiu/order/complete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.complete_order(
            order_id=order_id,
            repairman_id=user.get('id'),
            description=body.description or '',
            images=body.images or ''
        )

    def ActionBaoxiuOrderCancelPost(self, request: Request, body: CancelOrderRequest,
                                     order_id: int = Query(..., description="报修单ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        取消报修单接口
        POST /api/baoxiu/order/cancel
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        return self.order_business.cancel_order(
            order_id=order_id,
            operator_id=user.get('id'),
            reason=body.reason or ''
        )

    def ActionBaoxiuOrderUpdatePost(self, request: Request, body: UpdateOrderRequest,
                                     order_id: int = Query(..., description="报修单ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        更新报修单接口
        POST /api/baoxiu/order/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.description is not None:
            data['description'] = body.description
        if body.category is not None:
            data['category'] = body.category
        if body.urgency is not None:
            data['urgency'] = body.urgency
        if body.dormitory_id is not None:
            data['dormitory_id'] = body.dormitory_id
        if body.room_number is not None:
            data['room_number'] = body.room_number
        if body.contact_name is not None:
            data['contact_name'] = body.contact_name
        if body.contact_phone is not None:
            data['contact_phone'] = body.contact_phone
        if body.images is not None:
            data['images'] = body.images

        return self.order_business.update_order(
            order_id=order_id,
            data=data,
            operator_id=user.get('id')
        )

    def ActionBaoxiuOrderDeletePost(self, request: Request,
                                     order_id: int = Query(..., description="报修单ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        删除报修单接口
        POST /api/baoxiu/order/delete
        """
        return self.order_business.delete_order(order_id)
