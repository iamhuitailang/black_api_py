from typing import Dict, Any, List, Optional
from datetime import datetime
from app.model.fuwu_077_model import (
    OrderModel, ServiceModel, StaffModel, UserModel, 
    NotificationModel, ReviewModel
)


class OrderBusiness:
    def __init__(self):
        self.order_model = OrderModel()
        self.service_model = ServiceModel()
        self.staff_model = StaffModel()
        self.user_model = UserModel()
        self.notification_model = NotificationModel()
        self.review_model = ReviewModel()

    def create_order(self, user_id: int, service_id: int, 
                     appointment_time: str, address: str,
                     contact_name: str, contact_phone: str, 
                     remark: str = '') -> Dict[str, Any]:
        if not service_id:
            return {
                'code': 1,
                'msg': '请选择服务项目',
                'data': None
            }

        if not appointment_time:
            return {
                'code': 1,
                'msg': '请选择预约时间',
                'data': None
            }

        if not address:
            return {
                'code': 1,
                'msg': '请填写服务地址',
                'data': None
            }

        if not contact_name:
            return {
                'code': 1,
                'msg': '请填写联系人姓名',
                'data': None
            }

        if not contact_phone:
            return {
                'code': 1,
                'msg': '请填写联系电话',
                'data': None
            }

        service = self.service_model.get_by_id(service_id)
        if not service:
            return {
                'code': 1,
                'msg': '服务项目不存在',
                'data': None
            }

        if service.get('status') != 1:
            return {
                'code': 1,
                'msg': '该服务已下架',
                'data': None
            }

        try:
            datetime.fromisoformat(appointment_time.replace('Z', '+00:00'))
        except:
            return {
                'code': 1,
                'msg': '预约时间格式不正确',
                'data': None
            }

        order_id = self.order_model.create(
            user_id=user_id,
            service_id=service_id,
            service_name=service.get('name', ''),
            service_price=service.get('price', 0),
            appointment_time=appointment_time,
            address=address,
            contact_name=contact_name,
            contact_phone=contact_phone,
            remark=remark
        )

        if order_id > 0:
            self.notification_model.create(
                user_id=user_id,
                title='订单创建成功',
                content=f'您的{service.get("name")}服务订单已提交，请等待管理员派单',
                notification_type='order',
                related_id=order_id
            )

            order = self.order_model.get_by_id(order_id)
            return {
                'code': 0,
                'msg': '订单创建成功',
                'data': self._enrich_order_dict(order)
            }

        return {
            'code': 1,
            'msg': '订单创建失败',
            'data': None
        }

    def get_order_list(self, page: int = 1, page_size: int = 10,
                      status: int = None, user_id: int = None,
                      staff_id: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.order_model.get_all(page, page_size, status, user_id, staff_id, keyword)
        items = [self._enrich_order_dict(item) for item in result.get('items', [])]

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

    def get_user_orders(self, user_id: int, page: int = 1,
                        page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.order_model.get_by_user_id(user_id, page, page_size, status)
        items = [self._enrich_order_dict(item) for item in result.get('items', [])]

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

    def get_order_detail(self, order_id: int, user_id: int = None) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if user_id and order.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权查看该订单',
                'data': None
            }

        result = self._enrich_order_dict(order)
        
        review = self.review_model.get_by_order_id(order_id)
        if review:
            result['review'] = self.review_model.to_dict(review)
        else:
            result['review'] = None

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def assign_staff(self, order_id: int, staff_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('status') not in [0, 1]:
            return {
                'code': 1,
                'msg': '该订单状态不允许派单',
                'data': None
            }

        staff = self.staff_model.get_by_id(staff_id)
        if not staff:
            return {
                'code': 1,
                'msg': '服务人员不存在',
                'data': None
            }

        if staff.get('status') != 1:
            return {
                'code': 1,
                'msg': '该服务人员已离职',
                'data': None
            }

        affected = self.order_model.assign_staff(order_id, staff_id)
        if affected > 0:
            self.notification_model.create(
                user_id=order.get('user_id'),
                title='订单已派单',
                content=f'您的{order.get("service_name")}订单已分配服务人员，请等待服务',
                notification_type='order',
                related_id=order_id
            )

            updated_order = self.order_model.get_by_id(order_id)
            return {
                'code': 0,
                'msg': '派单成功',
                'data': self._enrich_order_dict(updated_order)
            }

        return {
            'code': 1,
            'msg': '派单失败',
            'data': None
        }

    def user_confirm(self, order_id: int, user_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作该订单',
                'data': None
            }

        if order.get('status') not in [1, 2]:
            return {
                'code': 1,
                'msg': '该订单状态不允许确认',
                'data': None
            }

        if order.get('user_confirmed') == 1:
            return {
                'code': 1,
                'msg': '您已确认完成',
                'data': None
            }

        affected = self.order_model.user_confirm(order_id)
        if affected > 0:
            updated_order = self.order_model.get_by_id(order_id)
            
            if updated_order.get('status') == 3:
                self.notification_model.create(
                    user_id=user_id,
                    title='订单已完成',
                    content=f'您的{order.get("service_name")}订单已完成，感谢您的使用！',
                    notification_type='order',
                    related_id=order_id
                )
            else:
                self.notification_model.create(
                    user_id=user_id,
                    title='确认服务完成',
                    content=f'您已确认{order.get("service_name")}服务完成，等待服务人员确认',
                    notification_type='order',
                    related_id=order_id
                )

            return {
                'code': 0,
                'msg': '确认成功',
                'data': self._enrich_order_dict(updated_order)
            }

        return {
            'code': 1,
            'msg': '确认失败',
            'data': None
        }

    def cancel_order(self, order_id: int, user_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作该订单',
                'data': None
            }

        if order.get('status') not in [0, 1]:
            return {
                'code': 1,
                'msg': '该订单状态不允许取消',
                'data': None
            }

        affected = self.order_model.cancel_order(order_id)
        if affected > 0:
            self.notification_model.create(
                user_id=user_id,
                title='订单已取消',
                content=f'您的{order.get("service_name")}订单已取消',
                notification_type='order',
                related_id=order_id
            )

            updated_order = self.order_model.get_by_id(order_id)
            return {
                'code': 0,
                'msg': '取消成功',
                'data': self._enrich_order_dict(updated_order)
            }

        return {
            'code': 1,
            'msg': '取消失败',
            'data': None
        }

    def get_upcoming_orders(self, hours: int = 24) -> Dict[str, Any]:
        orders = self.order_model.get_upcoming_orders(hours)
        items = [self._enrich_order_dict(item) for item in orders]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def _enrich_order_dict(self, order: Dict[str, Any]) -> Dict[str, Any]:
        user = None
        staff = None
        service = None

        if order.get('user_id'):
            user = self.user_model.get_by_id(order.get('user_id'))

        if order.get('staff_id'):
            staff = self.staff_model.get_by_id(order.get('staff_id'))

        if order.get('service_id'):
            service = self.service_model.get_by_id(order.get('service_id'))

        return self.order_model.to_dict(order, user, staff, service)
