from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.model.jieyong_model import BorrowModel, ItemModel, UserModel, MessageModel


class JieyongBorrowBusiness:
    def __init__(self):
        self.borrow_model = BorrowModel()
        self.item_model = ItemModel()
        self.user_model = UserModel()
        self.message_model = MessageModel()

    def borrow_item(self, user_id: int, item_id: int, quantity: int,
                    expected_return_date: str, remark: str = '') -> Dict[str, Any]:
        if quantity <= 0:
            return {
                'code': 1,
                'msg': '借用数量必须大于0',
                'data': None
            }

        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'msg': '物品不存在',
                'data': None
            }

        if item.get('status') != self.item_model.STATUS_AVAILABLE:
            return {
                'code': 1,
                'msg': '该物品暂不可借用',
                'data': None
            }

        if item.get('available_quantity', 0) < quantity:
            return {
                'code': 1,
                'msg': f'库存不足，当前可借数量：{item.get("available_quantity", 0)}',
                'data': None
            }

        try:
            expected_dt = datetime.fromisoformat(expected_return_date)
            if expected_dt <= datetime.now():
                return {
                    'code': 1,
                    'msg': '预计归还时间必须晚于当前时间',
                    'data': None
                }

            max_days = item.get('max_borrow_days', 7)
            max_return_date = datetime.now() + timedelta(days=max_days)
            if expected_dt > max_return_date:
                return {
                    'code': 1,
                    'msg': f'最长借用时间为{max_days}天，预计归还时间不能超过{max_return_date.strftime("%Y-%m-%d")}',
                    'data': None
                }
        except (ValueError, TypeError):
            return {
                'code': 1,
                'msg': '预计归还时间格式不正确',
                'data': None
            }

        borrow_id = 0
        with self.item_model.exec.transaction():
            affected = self.item_model.update_quantity(item_id, -quantity)
            if affected <= 0:
                raise Exception('库存扣减失败')

            self.item_model.increment_borrow_count(item_id)

            borrow_id = self.borrow_model.create(
                user_id=user_id,
                item_id=item_id,
                quantity=quantity,
                expected_return_date=expected_return_date,
                remark=remark,
                status=self.borrow_model.STATUS_BORROWED
            )

            if borrow_id <= 0:
                raise Exception('创建借用记录失败')

        if borrow_id > 0:
            self.message_model.send_borrow_success(
                user_id=user_id,
                borrow_id=borrow_id,
                item_name=item.get('name'),
                quantity=quantity
            )

            borrow = self.borrow_model.get_by_id(borrow_id)
            return {
                'code': 0,
                'msg': '借用成功',
                'data': self.borrow_model.to_dict(borrow)
            }

        return {
            'code': 1,
            'msg': '借用失败',
            'data': None
        }

    def return_item(self, borrow_id: int, user_id: int = None,
                    fine_amount: float = 0, admin_id: int = None) -> Dict[str, Any]:
        borrow = self.borrow_model.get_by_id(borrow_id)
        if not borrow:
            return {
                'code': 1,
                'msg': '借用记录不存在',
                'data': None
            }

        if borrow.get('status') not in [self.borrow_model.STATUS_BORROWED, self.borrow_model.STATUS_OVERDUE]:
            return {
                'code': 1,
                'msg': '该借用记录无法归还',
                'data': None
            }

        if user_id and borrow.get('user_id') != user_id and not self.user_model.is_admin(user_id):
            return {
                'code': 1,
                'msg': '无权归还他人的物品',
                'data': None
            }

        item_id = borrow.get('item_id')
        quantity = borrow.get('quantity', 0)
        success = False

        with self.item_model.exec.transaction():
            affected = self.item_model.update_quantity(item_id, quantity)
            if affected <= 0:
                raise Exception('库存增加失败')

            affected = self.borrow_model.return_item(
                record_id=borrow_id,
                fine_amount=fine_amount,
                admin_id=admin_id
            )

            if affected <= 0:
                raise Exception('更新借用记录失败')

            success = True

        if success:
            item = self.item_model.get_by_id(item_id)
            self.message_model.send_return_success(
                user_id=borrow.get('user_id'),
                borrow_id=borrow_id,
                item_name=item.get('name') if item else '物品'
            )

            updated_borrow = self.borrow_model.get_by_id(borrow_id)
            return {
                'code': 0,
                'msg': '归还成功',
                'data': self.borrow_model.to_dict(updated_borrow)
            }

        return {
            'code': 1,
            'msg': '归还失败',
            'data': None
        }

    def approve_borrow(self, borrow_id: int, admin_id: int) -> Dict[str, Any]:
        borrow = self.borrow_model.get_by_id(borrow_id)
        if not borrow:
            return {
                'code': 1,
                'msg': '借用记录不存在',
                'data': None
            }

        if borrow.get('status') != self.borrow_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该借用记录无需审核',
                'data': None
            }

        affected = self.borrow_model.update_status(
            borrow_id,
            self.borrow_model.STATUS_BORROWED,
            admin_id=admin_id
        )

        if affected > 0:
            updated_borrow = self.borrow_model.get_by_id(borrow_id)
            return {
                'code': 0,
                'msg': '审核通过',
                'data': self.borrow_model.to_dict(updated_borrow)
            }

        return {
            'code': 1,
            'msg': '审核失败',
            'data': None
        }

    def reject_borrow(self, borrow_id: int, reject_reason: str, admin_id: int) -> Dict[str, Any]:
        borrow = self.borrow_model.get_by_id(borrow_id)
        if not borrow:
            return {
                'code': 1,
                'msg': '借用记录不存在',
                'data': None
            }

        if borrow.get('status') != self.borrow_model.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该借用记录无需审核',
                'data': None
            }

        item_id = borrow.get('item_id')
        quantity = borrow.get('quantity', 0)
        success = False

        with self.item_model.exec.transaction():
            self.item_model.update_quantity(item_id, quantity)

            affected = self.borrow_model.reject(
                record_id=borrow_id,
                reject_reason=reject_reason,
                admin_id=admin_id
            )

            if affected <= 0:
                raise Exception('拒绝申请失败')

            success = True

        if success:
            updated_borrow = self.borrow_model.get_by_id(borrow_id)
            return {
                'code': 0,
                'msg': '已拒绝',
                'data': self.borrow_model.to_dict(updated_borrow)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def get_by_id(self, borrow_id: int) -> Dict[str, Any]:
        borrow = self.borrow_model.get_by_id(borrow_id)
        if not borrow:
            return {
                'code': 1,
                'msg': '借用记录不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.borrow_model.to_dict(borrow)
        }

    def get_my_borrows(self, user_id: int, page: int = 1, page_size: int = 10,
                       status: int = None) -> Dict[str, Any]:
        result = self.borrow_model.get_by_user_id(user_id, page, page_size, status)
        items = [self.borrow_model.to_dict(item) for item in result.get('items', [])]

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

    def get_list(self, page: int = 1, page_size: int = 10, user_id: int = None,
                 item_id: int = None, status: int = None, keyword: str = None,
                 start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        result = self.borrow_model.get_all(
            page, page_size, user_id, item_id, status, keyword, start_date, end_date
        )
        items = [self.borrow_model.to_dict(item) for item in result.get('items', [])]

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

    def get_overdue_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.borrow_model.get_overdue_records(page, page_size)
        items = [self.borrow_model.to_dict(item) for item in result.get('items', [])]

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

    def check_and_mark_overdue(self) -> Dict[str, Any]:
        message_ids = self.message_model.check_and_send_overdue_reminders()
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'processed_count': len(message_ids),
                'message_ids': message_ids
            }
        }

    def get_statistics(self) -> Dict[str, Any]:
        stats = self.borrow_model.get_statistics()
        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }

    def get_user_borrowed_count(self, user_id: int) -> Dict[str, Any]:
        count = self.borrow_model.get_user_borrowed_count(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'borrowed_count': count
            }
        }
