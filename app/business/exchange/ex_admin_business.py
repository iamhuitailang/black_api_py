from typing import Dict, Any, Optional, List
from app.model.exchange import (
    ExUserModel, ExItemModel, ExReportModel, 
    ExMessageModel, ExExchangeModel
)


class ExAdminBusiness:
    def __init__(self):
        self.user_model = ExUserModel()
        self.item_model = ExItemModel()
        self.report_model = ExReportModel()
        self.message_model = ExMessageModel()
        self.exchange_model = ExExchangeModel()

    def get_statistics(self) -> Dict[str, Any]:
        total_users = self.user_model.query.count()
        total_items = self.item_model.query.count()
        total_exchanges = self.exchange_model.query.count()
        pending_reports = self.report_model.query.count({'status': ExReportModel.STATUS_PENDING})
        
        on_shelf_items = self.item_model.query.count({'status': ExItemModel.STATUS_ON_SHELF})
        completed_exchanges = self.exchange_model.query.count({'status': ExExchangeModel.STATUS_COMPLETED})
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'total_items': total_items,
                'on_shelf_items': on_shelf_items,
                'total_exchanges': total_exchanges,
                'completed_exchanges': completed_exchanges,
                'pending_reports': pending_reports
            }
        }

    def get_user_list(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        
        result = self.user_model.get_all(page, page_size, conditions)
        items = [self.user_model.to_public_dict(item) for item in result.get('items', [])]
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'list': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def ban_user(self, user_id: int, reason: str = None) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }
        
        affected = self.user_model.update_status(user_id, 0)
        if affected > 0:
            self.item_model.exec.execute_raw(
                f"UPDATE {self.item_model.TABLE_NAME} SET status = ? WHERE user_id = ?",
                (ExItemModel.STATUS_OFF_SHELF, user_id)
            )
            
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '用户已封禁',
                'data': self.user_model.to_public_dict(updated_user)
            }
        
        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def unban_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }
        
        affected = self.user_model.update_status(user_id, 1)
        if affected > 0:
            updated_user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '用户已解封',
                'data': self.user_model.to_public_dict(updated_user)
            }
        
        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def get_item_list(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        
        result = self.item_model.get_all(page, page_size, conditions)
        items = []
        for item in result.get('items', []):
            item_data = self.item_model.to_public_dict(item)
            owner = self.user_model.get_by_id(item.get('user_id'))
            if owner:
                item_data['owner_nickname'] = owner.get('nickname')
                item_data['owner_phone'] = owner.get('phone')
            items.append(item_data)
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'list': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def take_item_off_shelf(self, item_id: int, reason: str = None) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'msg': '物品不存在',
                'data': None
            }
        
        affected = self.item_model.update_status(item_id, ExItemModel.STATUS_OFF_SHELF)
        if affected > 0:
            updated_item = self.item_model.get_by_id(item_id)
            return {
                'code': 0,
                'msg': '物品已下架',
                'data': self.item_model.to_public_dict(updated_item)
            }
        
        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def get_report_list(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        
        result = self.report_model.get_all(page, page_size, conditions)
        items = []
        for report in result.get('items', []):
            report_data = self.report_model.to_public_dict(report)
            
            reporter = self.user_model.get_by_id(report.get('reporter_id'))
            if reporter:
                report_data['reporter_nickname'] = reporter.get('nickname')
                report_data['reporter_phone'] = reporter.get('phone')
            
            report_type = report.get('report_type')
            target_id = report.get('target_id')
            if report_type == ExReportModel.TYPE_ITEM:
                item = self.item_model.get_by_id(target_id)
                if item:
                    report_data['target_info'] = {
                        'type': 'item',
                        'title': item.get('title'),
                        'user_id': item.get('user_id')
                    }
            elif report_type == ExReportModel.TYPE_USER:
                user = self.user_model.get_by_id(target_id)
                if user:
                    report_data['target_info'] = {
                        'type': 'user',
                        'nickname': user.get('nickname'),
                        'phone': user.get('phone')
                    }
            
            items.append(report_data)
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'list': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def process_report(self, report_id: int, handler_id: int, status: int, 
                       handle_note: str = None) -> Dict[str, Any]:
        report = self.report_model.get_by_id(report_id)
        if not report:
            return {
                'code': 1,
                'msg': '举报记录不存在',
                'data': None
            }
        
        affected = self.report_model.update_status(
            report_id=report_id,
            status=status,
            handler_id=handler_id,
            handle_note=handle_note
        )
        
        if affected > 0:
            updated_report = self.report_model.get_by_id(report_id)
            return {
                'code': 0,
                'msg': '处理成功',
                'data': self.report_model.to_public_dict(updated_report)
            }
        
        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def create_report(self, reporter_id: int, report_type: int, target_id: int,
                      reason: str, description: str = '') -> Dict[str, Any]:
        if report_type not in [ExReportModel.TYPE_ITEM, ExReportModel.TYPE_USER, ExReportModel.TYPE_EXCHANGE]:
            return {
                'code': 1,
                'msg': '举报类型不正确',
                'data': None
            }
        
        if not reason or len(reason.strip()) == 0:
            return {
                'code': 1,
                'msg': '请填写举报原因',
                'data': None
            }
        
        report_id = self.report_model.create(
            reporter_id=reporter_id,
            report_type=report_type,
            target_id=target_id,
            reason=reason,
            description=description
        )
        
        if report_id > 0:
            report = self.report_model.get_by_id(report_id)
            return {
                'code': 0,
                'msg': '举报已提交',
                'data': self.report_model.to_public_dict(report)
            }
        
        return {
            'code': 1,
            'msg': '提交失败',
            'data': None
        }


class ExMessageBusiness:
    def __init__(self):
        self.message_model = ExMessageModel()
        self.user_model = ExUserModel()

    def get_my_messages(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.message_model.get_by_receiver(user_id, page, page_size)
        items = []
        for msg in result.get('items', []):
            item = self.message_model.to_public_dict(msg)
            
            if item.get('sender_id') > 0:
                sender = self.user_model.get_by_id(item.get('sender_id'))
                if sender:
                    item['sender_nickname'] = sender.get('nickname')
                    item['sender_avatar'] = sender.get('avatar_url')
            else:
                item['sender_nickname'] = '系统消息'
            
            items.append(item)
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'list': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_unread_count(self, user_id: int) -> Dict[str, Any]:
        count = self.message_model.get_unread_count(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'unread_count': count
            }
        }

    def mark_as_read(self, message_id: int, user_id: int) -> Dict[str, Any]:
        msg = self.message_model.get_by_id(message_id)
        if not msg:
            return {
                'code': 1,
                'msg': '消息不存在',
                'data': None
            }
        
        if msg.get('receiver_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此消息',
                'data': None
            }
        
        self.message_model.mark_as_read(message_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': None
        }

    def mark_all_read(self, user_id: int) -> Dict[str, Any]:
        count = self.message_model.mark_all_read(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'marked_count': count
            }
        }
