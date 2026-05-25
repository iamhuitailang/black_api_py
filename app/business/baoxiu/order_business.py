from typing import Dict, Any, Optional
from app.model.baoxiu import (OrderModel, RepairRecordModel, UserModel,
                                NotificationModel, LogModel, RepairmanDetailModel)


class BaoxiuOrderBusiness:
    def __init__(self):
        self.order_model = OrderModel()
        self.repair_record_model = RepairRecordModel()
        self.user_model = UserModel()
        self.notification_model = NotificationModel()
        self.log_model = LogModel()
        self.repairman_detail_model = RepairmanDetailModel()

    def create_order(self, student_id: int, title: str, description: str = '',
                   category: str = '', urgency: int = 1,
                   dormitory_id: int = 0, room_number: str = '',
                   contact_name: str = '', contact_phone: str = '',
                   images: str = '') -> Dict[str, Any]:
        if not title:
            return {'code': 1, 'msg': '报修标题不能为空', 'data': None}

        if not category:
            return {'code': 1, 'msg': '请选择报修类别', 'data': None}

        if not dormitory_id or dormitory_id == 0:
            return {'code': 1, 'msg': '请选择宿舍楼', 'data': None}

        if not room_number:
            return {'code': 1, 'msg': '请填写房间号', 'data': None}

        if not contact_name:
            return {'code': 1, 'msg': '请填写联系人', 'data': None}

        if not contact_phone:
            return {'code': 1, 'msg': '请填写联系电话', 'data': None}

        import re
        if not re.match(r'^1[3-9]\d{9}$', contact_phone):
            return {'code': 1, 'msg': '联系电话格式不正确', 'data': None}

        order_id = self.order_model.create(
            student_id=student_id, title=title, description=description,
            category=category, urgency=urgency, dormitory_id=dormitory_id,
            room_number=room_number, contact_name=contact_name,
            contact_phone=contact_phone, images=images
        )

        if order_id > 0:
            self.log_model.create(student_id, LogModel.ACTION_CREATE_ORDER, 'order', order_id,
                                  f'创建报修单: {title}')
            order = self.order_model.get_by_id(order_id)
            return {
                'code': 0,
                'msg': '提交成功',
                'data': self._format_order(order)
            }

        return {'code': 1, 'msg': '提交失败', 'data': None}

    def get_order_list(self, page: int = 1, page_size: int = 10,
                      student_id: int = None, repairman_id: int = None,
                      status: int = None, dormitory_id: int = None,
                      category: str = None, urgency: int = None,
                      keyword: str = None,
                      include_pending: bool = False) -> Dict[str, Any]:
        if repairman_id and include_pending:
            pending_orders = self.order_model.get_all(
                page=1, page_size=1000, status=OrderModel.STATUS_PENDING
            )
            assigned_orders = self.order_model.get_all(
                page=page, page_size=page_size,
                repairman_id=repairman_id, status=status,
                dormitory_id=dormitory_id, category=category,
                urgency=urgency, keyword=keyword
            )

            all_items = list(pending_orders.get('items', [])) + list(assigned_orders.get('items', []))
            seen_ids = set()
            unique_items = []
            for item in all_items:
                if item.get('id') not in seen_ids:
                    seen_ids.add(item.get('id'))
                    unique_items.append(item)

            unique_items.sort(key=lambda x: x.get('id', 0), reverse=True)

            start = (page - 1) * page_size
            end = start + page_size
            paged_items = unique_items[start:end]

            items = [self._format_order(item) for item in paged_items]

            return {
                'code': 0,
                'msg': 'success',
                'data': {
                    'items': items,
                    'total': len(unique_items),
                    'page': page,
                    'page_size': page_size,
                    'total_pages': (len(unique_items) + page_size - 1) // page_size
                }
            }

        result = self.order_model.get_all(
            page=page, page_size=page_size, student_id=student_id,
            repairman_id=repairman_id, status=status,
            dormitory_id=dormitory_id, category=category,
            urgency=urgency, keyword=keyword
        )

        items = [self._format_order(item) for item in result.get('items', [])]

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

    def get_order_detail(self, order_id: int, user_id: int = None, role: str = None) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '报修单不存在', 'data': None}

        if role == UserModel.ROLE_STUDENT:
            if order.get('student_id') != user_id:
                return {'code': 1, 'msg': '无权查看该报修单', 'data': None}
        elif role == UserModel.ROLE_REPAIRMAN:
            if order.get('status') != OrderModel.STATUS_PENDING and order.get('repairman_id') != user_id:
                return {'code': 1, 'msg': '无权查看该报修单', 'data': None}

        result = self._format_order(order)

        records = self.repair_record_model.get_by_order_id(order_id)
        formatted_records = []
        for record in records:
            record_dict = dict(record)
            record_dict['action_text'] = self.repair_record_model.get_action_text(record.get('action'))
            formatted_records.append(record_dict)
        result['records'] = formatted_records

        return {'code': 0, 'msg': 'success', 'data': result}

    def assign_order(self, order_id: int, repairman_id: int,
                     operator_id: int = 0) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '报修单不存在', 'data': None}

        if order.get('status') != OrderModel.STATUS_PENDING:
            return {'code': 1, 'msg': '该报修单已被处理', 'data': None}

        repairman = self.user_model.get_by_id(repairman_id)
        if not repairman or repairman.get('role') != UserModel.ROLE_REPAIRMAN:
            return {'code': 1, 'msg': '维修工不存在', 'data': None}

        affected = self.order_model.assign_repairman(order_id, repairman_id)
        if affected > 0:
            self.repair_record_model.create(
                order_id=order_id,
                action=RepairRecordModel.ACTION_ASSIGN,
                repairman_id=repairman_id,
                description=f'管理员分配给: {repairman.get("real_name")}'
            )
            self.notification_model.create(
                user_id=repairman_id,
                title='新的维修工单',
                content=f'您收到新的维修工单: {order.get("title")}',
                type='order'
            )
            self.notification_model.create(
                user_id=order.get('student_id'),
                title='报修单已分配',
                content=f'您的报修单已分配给: {repairman.get("real_name")}',
                type='order'
            )
            self.log_model.create(operator_id, LogModel.ACTION_ASSIGN_ORDER, 'order', order_id,
                                  f'分配报修单给: {repairman.get("real_name")}')

            updated_order = self.order_model.get_by_id(order_id)
            return {'code': 0, 'msg': '分配成功', 'data': self._format_order(updated_order)}

        return {'code': 1, 'msg': '分配失败', 'data': None}

    def accept_order(self, order_id: int, repairman_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '报修单不存在', 'data': None}

        if order.get('status') != OrderModel.STATUS_PENDING:
            return {'code': 1, 'msg': '该报修单已被接单', 'data': None}

        repairman = self.user_model.get_by_id(repairman_id)
        if not repairman or repairman.get('role') != UserModel.ROLE_REPAIRMAN:
            return {'code': 1, 'msg': '维修工不存在', 'data': None}

        affected = self.order_model.assign_repairman(order_id, repairman_id)
        if affected > 0:
            self.repair_record_model.create(
                order_id=order_id,
                action=RepairRecordModel.ACTION_ASSIGN,
                repairman_id=repairman_id,
                description=f'维修工自主接单: {repairman.get("real_name")}'
            )
            self.notification_model.create(
                user_id=order.get('student_id'),
                title='报修单已被接单',
                content=f'您的报修单已被: {repairman.get("real_name")} 接单',
                type='order'
            )
            self.log_model.create(repairman_id, LogModel.ACTION_ASSIGN_ORDER, 'order', order_id,
                                  f'维修工自主接单: {repairman.get("real_name")}')

            updated_order = self.order_model.get_by_id(order_id)
            return {'code': 0, 'msg': '接单成功', 'data': self._format_order(updated_order)}

        return {'code': 1, 'msg': '接单失败', 'data': None}

    def start_processing(self, order_id: int, repairman_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '报修单不存在', 'data': None}

        if order.get('repairman_id') != repairman_id:
            return {'code': 1, 'msg': '您不是该工单的维修工', 'data': None}

        if order.get('status') not in [OrderModel.STATUS_ASSIGNED, OrderModel.STATUS_PROCESSING]:
            return {'code': 1, 'msg': '该工单状态不允许开始维修', 'data': None}

        affected = self.order_model.start_processing(order_id)
        if affected > 0:
            self.repair_record_model.create(
                order_id=order_id,
                action=RepairRecordModel.ACTION_START,
                repairman_id=repairman_id,
                description='开始维修'
            )
            self.log_model.create(repairman_id, LogModel.ACTION_PROCESS_ORDER, 'order', order_id, '开始维修')

            updated_order = self.order_model.get_by_id(order_id)
            return {'code': 0, 'msg': '开始维修', 'data': self._format_order(updated_order)}

        return {'code': 1, 'msg': '操作失败', 'data': None}

    def complete_order(self, order_id: int, repairman_id: int,
                       description: str = '', images: str = '') -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '报修单不存在', 'data': None}

        if order.get('repairman_id') != repairman_id:
            return {'code': 1, 'msg': '您不是该工单的维修工', 'data': None}

        if order.get('status') not in [OrderModel.STATUS_ASSIGNED, OrderModel.STATUS_PROCESSING]:
            return {'code': 1, 'msg': '该工单状态不允许完成', 'data': None}

        affected = self.order_model.complete(order_id)
        if affected > 0:
            self.repair_record_model.create(
                order_id=order_id,
                action=RepairRecordModel.ACTION_COMPLETE,
                repairman_id=repairman_id,
                description=description,
                images=images
            )
            self.notification_model.create(
                user_id=order.get('student_id'),
                title='维修已完成',
                content=f'您的报修单已完成: {order.get("title")}',
                type='order'
            )
            self.log_model.create(repairman_id, LogModel.ACTION_COMPLETE_ORDER, 'order', order_id, '完成维修')

            updated_order = self.order_model.get_by_id(order_id)
            return {'code': 0, 'msg': '完成维修', 'data': self._format_order(updated_order)}

        return {'code': 1, 'msg': '操作失败', 'data': None}

    def cancel_order(self, order_id: int, operator_id: int,
                     reason: str = '') -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '报修单不存在', 'data': None}

        if order.get('status') in [OrderModel.STATUS_COMPLETED, OrderModel.STATUS_CANCELLED]:
            return {'code': 1, 'msg': '该工单已完成或已取消', 'data': None}

        if order.get('student_id') != operator_id:
            user = self.user_model.get_by_id(operator_id)
            if not user or user.get('role') != UserModel.ROLE_ADMIN:
                return {'code': 1, 'msg': '您没有权限取消该工单', 'data': None}

        affected = self.order_model.cancel(order_id)
        if affected > 0:
            self.repair_record_model.create(
                order_id=order_id,
                action=RepairRecordModel.ACTION_CANCEL,
                repairman_id=order.get('repairman_id', 0),
                description=reason
            )
            self.log_model.create(operator_id, LogModel.ACTION_CANCEL_ORDER, 'order', order_id,
                                  f'取消报修单: {reason}')

            updated_order = self.order_model.get_by_id(order_id)
            return {'code': 0, 'msg': '取消成功', 'data': self._format_order(updated_order)}

        return {'code': 1, 'msg': '取消失败', 'data': None}

    def update_order(self, order_id: int, data: Dict[str, Any],
                     operator_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '报修单不存在', 'data': None}

        if order.get('status') != OrderModel.STATUS_PENDING:
            return {'code': 1, 'msg': '该工单已被处理，无法修改', 'data': None}

        if order.get('student_id') != operator_id:
            user = self.user_model.get_by_id(operator_id)
            if not user or user.get('role') != UserModel.ROLE_ADMIN:
                return {'code': 1, 'msg': '您没有权限修改该工单', 'data': None}

        affected = self.order_model.update(order_id, data)
        if affected > 0:
            self.log_model.create(operator_id, LogModel.ACTION_UPDATE_USER, 'order', order_id, '修改报修单')
            updated_order = self.order_model.get_by_id(order_id)
            return {'code': 0, 'msg': '修改成功', 'data': self._format_order(updated_order)}

        return {'code': 1, 'msg': '修改失败', 'data': None}

    def delete_order(self, order_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {'code': 1, 'msg': '报修单不存在', 'data': None}

        if order.get('status') not in [OrderModel.STATUS_PENDING, OrderModel.STATUS_CANCELLED]:
            return {'code': 1, 'msg': '该工单状态不允许删除', 'data': None}

        affected = self.order_model.delete(order_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}

        return {'code': 1, 'msg': '删除失败', 'data': None}

    def _format_order(self, order: Dict[str, Any]) -> Dict[str, Any]:
        if not order:
            return {}

        result = dict(order)
        result['status_text'] = self.order_model.get_status_text(order.get('status', 0))
        result['urgency_text'] = self.order_model.get_urgency_text(order.get('urgency', 1))

        student = self.user_model.get_by_id(order.get('student_id', 0))
        if student:
            result['student_name'] = student.get('real_name', '')
            result['student_username'] = student.get('username', '')

        repairman_id = order.get('repairman_id', 0)
        if repairman_id and repairman_id > 0:
            repairman = self.user_model.get_by_id(repairman_id)
            if repairman:
                result['repairman_name'] = repairman.get('real_name', '')
                result['repairman_username'] = repairman.get('username', '')

        return result
