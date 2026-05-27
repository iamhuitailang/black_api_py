from typing import Dict, Any
from app.model.jiaoyi import (
    OrderModel, AnnouncementModel, ChatModel, RefundModel,
    ReportModel, StatisticsModel
)


class JiaoyiOrderBusiness:
    def __init__(self):
        self.order_model = OrderModel()
        self.book_model = None

    def _get_book_model(self):
        if not self.book_model:
            from app.model.jiaoyi import BookModel
            self.book_model = BookModel()
        return self.book_model

    def create_order(self, buyer_id: int, book_id: int, receiver_name: str = '',
                     receiver_phone: str = '', receiver_address: str = '',
                     remark: str = '') -> Dict[str, Any]:
        book_model = self._get_book_model()
        book = book_model.get_by_id(book_id)
        
        if not book:
            return {
                'code': 1,
                'msg': '教材不存在',
                'data': None
            }

        if book.get('status') != book_model.STATUS_ON_SALE:
            return {
                'code': 1,
                'msg': '教材不在销售状态',
                'data': None
            }

        if book.get('seller_id') == buyer_id:
            return {
                'code': 1,
                'msg': '不能购买自己的教材',
                'data': None
            }

        order_id = self.order_model.create(
            buyer_id=buyer_id,
            seller_id=book.get('seller_id'),
            book_id=book_id,
            book_title=book.get('title'),
            book_image=book.get('images'),
            price=book.get('price'),
            quantity=1,
            receiver_name=receiver_name,
            receiver_phone=receiver_phone,
            receiver_address=receiver_address,
            remark=remark
        )

        if order_id > 0:
            order = self.order_model.get_by_id(order_id)
            return {
                'code': 0,
                'msg': '下单成功',
                'data': order
            }

        return {
            'code': 1,
            'msg': '下单失败',
            'data': None
        }

    def get_order_detail(self, order_id: int, user_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('buyer_id') != user_id and order.get('seller_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限查看',
                'data': None
            }

        order['status_text'] = self.order_model.get_status_text(order.get('status', 0))
        return {
            'code': 0,
            'msg': 'success',
            'data': order
        }

    def get_buyer_orders(self, buyer_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.order_model.get_by_buyer(buyer_id, page, page_size, status)
        
        for item in result.get('items', []):
            item['status_text'] = self.order_model.get_status_text(item.get('status', 0))

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_seller_orders(self, seller_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.order_model.get_by_seller(seller_id, page, page_size, status)
        
        for item in result.get('items', []):
            item['status_text'] = self.order_model.get_status_text(item.get('status', 0))

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_all_orders(self, page: int = 1, page_size: int = 10, status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.order_model.get_all(page, page_size, status, keyword)
        
        for item in result.get('items', []):
            item['status_text'] = self.order_model.get_status_text(item.get('status', 0))

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def pay_order(self, order_id: int, buyer_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('buyer_id') != buyer_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        if order.get('status') != self.order_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '订单状态不正确',
                'data': None
            }

        affected = self.order_model.update_status(order_id, self.order_model.STATUS_PAID)
        if affected > 0:
            return {
                'code': 0,
                'msg': '支付成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '支付失败',
            'data': None
        }

    def ship_order(self, order_id: int, seller_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('seller_id') != seller_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        if order.get('status') != self.order_model.STATUS_PAID:
            return {
                'code': 1,
                'msg': '订单状态不正确',
                'data': None
            }

        affected = self.order_model.update_status(order_id, self.order_model.STATUS_SHIPPED)
        if affected > 0:
            return {
                'code': 0,
                'msg': '发货成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '发货失败',
            'data': None
        }

    def receive_order(self, order_id: int, buyer_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('buyer_id') != buyer_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        if order.get('status') != self.order_model.STATUS_SHIPPED:
            return {
                'code': 1,
                'msg': '订单状态不正确',
                'data': None
            }

        affected = self.order_model.update_status(order_id, self.order_model.STATUS_RECEIVED)
        if affected > 0:
            return {
                'code': 0,
                'msg': '确认收货成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '确认收货失败',
            'data': None
        }

    def complete_order(self, order_id: int, user_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('buyer_id') != user_id and order.get('seller_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        if order.get('status') != self.order_model.STATUS_RECEIVED:
            return {
                'code': 1,
                'msg': '订单状态不正确',
                'data': None
            }

        affected = self.order_model.update_status(order_id, self.order_model.STATUS_COMPLETED)
        if affected > 0:
            book_model = self._get_book_model()
            book_model.update(order.get('book_id'), {'status': book_model.STATUS_SOLD})
            return {
                'code': 0,
                'msg': '订单完成',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def cancel_order(self, order_id: int, buyer_id: int, reason: str = '') -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('buyer_id') != buyer_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        if order.get('status') not in [self.order_model.STATUS_PENDING, self.order_model.STATUS_PAID]:
            return {
                'code': 1,
                'msg': '订单状态不正确，无法取消',
                'data': None
            }

        affected = self.order_model.cancel(order_id, reason)
        if affected > 0:
            return {
                'code': 0,
                'msg': '取消成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '取消失败',
            'data': None
        }


class JiaoyiAnnouncementBusiness:
    def __init__(self):
        self.announcement_model = AnnouncementModel()

    def get_announcement_list(self, page: int = 1, page_size: int = 10,
                              status: int = None, type: str = None) -> Dict[str, Any]:
        result = self.announcement_model.get_all(page, page_size, status, type)
        
        for item in result.get('items', []):
            item['status_text'] = self.announcement_model.get_status_text(item.get('status', 0))
            item['type_text'] = self.announcement_model.get_type_text(item.get('type', ''))

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_announcement_detail(self, announcement_id: int) -> Dict[str, Any]:
        announcement = self.announcement_model.get_by_id(announcement_id)
        if not announcement:
            return {
                'code': 1,
                'msg': '公告不存在',
                'data': None
            }

        self.announcement_model.update_view_count(announcement_id)
        announcement['view_count'] = announcement.get('view_count', 0) + 1
        announcement['status_text'] = self.announcement_model.get_status_text(announcement.get('status', 0))
        announcement['type_text'] = self.announcement_model.get_type_text(announcement.get('type', ''))

        return {
            'code': 0,
            'msg': 'success',
            'data': announcement
        }

    def create_announcement(self, title: str, content: str = '', type: str = 'notice',
                            status: int = 0, sort_order: int = 0) -> Dict[str, Any]:
        if not title:
            return {
                'code': 1,
                'msg': '标题不能为空',
                'data': None
            }

        announcement_id = self.announcement_model.create(title, content, type, status, sort_order)
        if announcement_id > 0:
            announcement = self.announcement_model.get_by_id(announcement_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': announcement
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_announcement(self, announcement_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        announcement = self.announcement_model.get_by_id(announcement_id)
        if not announcement:
            return {
                'code': 1,
                'msg': '公告不存在',
                'data': None
            }

        affected = self.announcement_model.update(announcement_id, data)
        if affected >= 0:
            updated = self.announcement_model.get_by_id(announcement_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': updated
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_announcement(self, announcement_id: int) -> Dict[str, Any]:
        affected = self.announcement_model.delete(announcement_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }


class JiaoyiChatBusiness:
    def __init__(self):
        self.chat_model = ChatModel()

    def send_message(self, sender_id: int, receiver_id: int, book_id: int = 0,
                     content: str = '', type: str = 'text') -> Dict[str, Any]:
        if not content:
            return {
                'code': 1,
                'msg': '消息内容不能为空',
                'data': None
            }

        message_id = self.chat_model.create(sender_id, receiver_id, book_id, content, type)
        if message_id > 0:
            message = self.chat_model.get_by_id(message_id)
            return {
                'code': 0,
                'msg': '发送成功',
                'data': message
            }

        return {
            'code': 1,
            'msg': '发送失败',
            'data': None
        }

    def get_conversation(self, user_id: int, other_id: int, book_id: int = 0,
                         page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        self.chat_model.mark_conversation_as_read(user_id, other_id)
        result = self.chat_model.get_conversation(user_id, other_id, book_id, page, page_size)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_conversation_list(self, user_id: int) -> Dict[str, Any]:
        result = self.chat_model.get_conversation_list(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }


class JiaoyiRefundBusiness:
    def __init__(self):
        self.refund_model = RefundModel()
        self.order_model = None

    def _get_order_model(self):
        if not self.order_model:
            self.order_model = OrderModel()
        return self.order_model

    def create_refund(self, order_id: int, buyer_id: int, reason: str = '',
                      description: str = '', images: str = '') -> Dict[str, Any]:
        order = self._get_order_model().get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'msg': '订单不存在',
                'data': None
            }

        if order.get('buyer_id') != buyer_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        if order.get('status') not in [self._get_order_model().STATUS_PAID,
                                        self._get_order_model().STATUS_SHIPPED,
                                        self._get_order_model().STATUS_RECEIVED]:
            return {
                'code': 1,
                'msg': '订单状态不支持退款',
                'data': None
            }

        existing = self.refund_model.get_by_order_id(order_id)
        if existing:
            return {
                'code': 1,
                'msg': '该订单已申请退款',
                'data': None
            }

        refund_id = self.refund_model.create(
            order_id=order_id,
            order_no=order.get('order_no'),
            buyer_id=buyer_id,
            seller_id=order.get('seller_id'),
            reason=reason,
            description=description,
            images=images,
            amount=order.get('total_price')
        )

        if refund_id > 0:
            self._get_order_model().update_status(order_id, self._get_order_model().STATUS_REFUNDING)
            refund = self.refund_model.get_by_id(refund_id)
            return {
                'code': 0,
                'msg': '退款申请已提交',
                'data': refund
            }

        return {
            'code': 1,
            'msg': '申请失败',
            'data': None
        }

    def get_refund_detail(self, refund_id: int, user_id: int) -> Dict[str, Any]:
        refund = self.refund_model.get_by_id(refund_id)
        if not refund:
            return {
                'code': 1,
                'msg': '退款申请不存在',
                'data': None
            }

        if refund.get('buyer_id') != user_id and refund.get('seller_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限查看',
                'data': None
            }

        refund['status_text'] = self.refund_model.get_status_text(refund.get('status', 0))
        return {
            'code': 0,
            'msg': 'success',
            'data': refund
        }

    def get_refund_list(self, page: int = 1, page_size: int = 10, status: int = None,
                        buyer_id: int = None, seller_id: int = None) -> Dict[str, Any]:
        result = self.refund_model.get_all(page, page_size, status, buyer_id, seller_id)
        
        for item in result.get('items', []):
            item['status_text'] = self.refund_model.get_status_text(item.get('status', 0))

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def approve_refund(self, refund_id: int, seller_id: int) -> Dict[str, Any]:
        refund = self.refund_model.get_by_id(refund_id)
        if not refund:
            return {
                'code': 1,
                'msg': '退款申请不存在',
                'data': None
            }

        if refund.get('seller_id') != seller_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        if refund.get('status') != self.refund_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '退款申请状态不正确',
                'data': None
            }

        affected = self.refund_model.update_status(refund_id, self.refund_model.STATUS_APPROVED)
        if affected > 0:
            self._get_order_model().update_status(refund.get('order_id'), self._get_order_model().STATUS_REFUNDED)
            return {
                'code': 0,
                'msg': '已同意退款',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def reject_refund(self, refund_id: int, seller_id: int, reason: str = '') -> Dict[str, Any]:
        refund = self.refund_model.get_by_id(refund_id)
        if not refund:
            return {
                'code': 1,
                'msg': '退款申请不存在',
                'data': None
            }

        if refund.get('seller_id') != seller_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        if refund.get('status') != self.refund_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '退款申请状态不正确',
                'data': None
            }

        affected = self.refund_model.update_status(refund_id, self.refund_model.STATUS_REJECTED, reason)
        if affected > 0:
            return {
                'code': 0,
                'msg': '已拒绝退款',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }


class JiaoyiReportBusiness:
    def __init__(self):
        self.report_model = ReportModel()

    def create_report(self, reporter_id: int, target_type: str, target_id: int,
                      type: str, reason: str = '', description: str = '', images: str = '') -> Dict[str, Any]:
        if not target_type:
            return {
                'code': 1,
                'msg': '举报类型不能为空',
                'data': None
            }

        if not type:
            return {
                'code': 1,
                'msg': '举报分类不能为空',
                'data': None
            }

        report_id = self.report_model.create(reporter_id, target_type, target_id, type, reason, description, images)
        if report_id > 0:
            report = self.report_model.get_by_id(report_id)
            return {
                'code': 0,
                'msg': '举报已提交',
                'data': report
            }

        return {
            'code': 1,
            'msg': '提交失败',
            'data': None
        }

    def get_report_list(self, page: int = 1, page_size: int = 10, status: int = None,
                        target_type: str = None, reporter_id: int = None) -> Dict[str, Any]:
        result = self.report_model.get_all(page, page_size, status, target_type, reporter_id)
        
        for item in result.get('items', []):
            item['status_text'] = self.report_model.get_status_text(item.get('status', 0))
            item['type_text'] = self.report_model.get_type_text(item.get('type', ''))

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_report_detail(self, report_id: int) -> Dict[str, Any]:
        report = self.report_model.get_by_id(report_id)
        if not report:
            return {
                'code': 1,
                'msg': '举报不存在',
                'data': None
            }

        report['status_text'] = self.report_model.get_status_text(report.get('status', 0))
        report['type_text'] = self.report_model.get_type_text(report.get('type', ''))
        return {
            'code': 0,
            'msg': 'success',
            'data': report
        }

    def process_report(self, report_id: int, admin_id: int, status: int, note: str = '') -> Dict[str, Any]:
        affected = self.report_model.update_status(report_id, status, admin_id, note)
        if affected > 0:
            return {
                'code': 0,
                'msg': '处理成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '处理失败',
            'data': None
        }


class JiaoyiStatisticsBusiness:
    def __init__(self):
        self.statistics_model = StatisticsModel()

    def get_overall_statistics(self) -> Dict[str, Any]:
        result = self.statistics_model.get_overall_statistics()
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_user_statistics(self, user_id: int, role: str = 'buyer') -> Dict[str, Any]:
        result = self.statistics_model.get_user_statistics(user_id, role)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_daily_trend(self, days: int = 7) -> Dict[str, Any]:
        result = self.statistics_model.get_daily_trend(days)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_category_statistics(self) -> Dict[str, Any]:
        result = self.statistics_model.get_category_statistics()
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }
