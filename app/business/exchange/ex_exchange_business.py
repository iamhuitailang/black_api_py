from typing import Dict, Any, Optional, List
from app.model.exchange import (
    ExExchangeModel, ExItemModel, ExUserModel, 
    ExReviewModel, ExMessageModel
)


class ExExchangeBusiness:
    def __init__(self):
        self.exchange_model = ExExchangeModel()
        self.item_model = ExItemModel()
        self.user_model = ExUserModel()
        self.review_model = ExReviewModel()
        self.message_model = ExMessageModel()

    def create_request(self, requester_id: int, receiver_item_id: int, 
                       requester_item_id: int, message: str = '') -> Dict[str, Any]:
        receiver_item = self.item_model.get_by_id(receiver_item_id)
        if not receiver_item:
            return {
                'code': 1,
                'msg': '对方物品不存在',
                'data': None
            }
        
        if receiver_item.get('status') != ExItemModel.STATUS_ON_SHELF:
            return {
                'code': 1,
                'msg': '该物品已下架或已交换',
                'data': None
            }
        
        receiver_id = receiver_item.get('user_id')
        if receiver_id == requester_id:
            return {
                'code': 1,
                'msg': '不能对自己的物品发起交换',
                'data': None
            }
        
        requester_item = self.item_model.get_by_id(requester_item_id)
        if not requester_item:
            return {
                'code': 1,
                'msg': '您的物品不存在',
                'data': None
            }
        
        if requester_item.get('user_id') != requester_id:
            return {
                'code': 1,
                'msg': '该物品不属于您',
                'data': None
            }
        
        if requester_item.get('status') != ExItemModel.STATUS_ON_SHELF:
            return {
                'code': 1,
                'msg': '您的物品已下架或已交换',
                'data': None
            }
        
        if self.exchange_model.check_pending_exists(requester_id, receiver_item_id):
            return {
                'code': 1,
                'msg': '您已对该物品发起过交换请求，请等待对方处理',
                'data': None
            }
        
        exchange_id = self.exchange_model.create(
            requester_id=requester_id,
            receiver_id=receiver_id,
            requester_item_id=requester_item_id,
            receiver_item_id=receiver_item_id,
            message=message
        )
        
        if exchange_id > 0:
            requester = self.user_model.get_by_id(requester_id)
            requester_name = requester.get('nickname') or f'用户{requester_id}'
            msg_content = f"用户{requester_name}想用「{requester_item.get('title')}」交换您的「{receiver_item.get('title')}」"
            self.message_model.send_system_message(receiver_id, msg_content, exchange_id)
            
            exchange = self.exchange_model.get_by_id(exchange_id)
            return {
                'code': 0,
                'msg': '交换请求已发送',
                'data': self.exchange_model.to_public_dict(exchange)
            }
        
        return {
            'code': 1,
            'msg': '发起交换失败',
            'data': None
        }

    def get_sent_requests(self, user_id: int, page: int = 1, page_size: int = 10,
                          status: int = None) -> Dict[str, Any]:
        result = self.exchange_model.get_sent_list(user_id, page, page_size, status)
        items = [self._enrich_exchange(item) for item in result.get('items', [])]
        
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

    def get_received_requests(self, user_id: int, page: int = 1, page_size: int = 10,
                              status: int = None) -> Dict[str, Any]:
        result = self.exchange_model.get_received_list(user_id, page, page_size, status)
        items = [self._enrich_exchange(item) for item in result.get('items', [])]
        
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

    def _enrich_exchange(self, exchange: Dict[str, Any]) -> Dict[str, Any]:
        result = self.exchange_model.to_public_dict(exchange)
        
        requester = self.user_model.get_by_id(exchange.get('requester_id'))
        if requester:
            result['requester'] = {
                'id': requester.get('id'),
                'nickname': requester.get('nickname'),
                'avatar_url': requester.get('avatar_url')
            }
        
        receiver = self.user_model.get_by_id(exchange.get('receiver_id'))
        if receiver:
            result['receiver'] = {
                'id': receiver.get('id'),
                'nickname': receiver.get('nickname'),
                'avatar_url': receiver.get('avatar_url')
            }
        
        requester_item = self.item_model.get_by_id(exchange.get('requester_item_id'))
        if requester_item:
            result['requester_item'] = self.item_model.to_public_dict(requester_item)
        
        receiver_item = self.item_model.get_by_id(exchange.get('receiver_item_id'))
        if receiver_item:
            result['receiver_item'] = self.item_model.to_public_dict(receiver_item)
        
        return result

    def get_detail(self, exchange_id: int, user_id: int) -> Dict[str, Any]:
        exchange = self.exchange_model.get_by_id(exchange_id)
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }
        
        if (exchange.get('requester_id') != user_id and 
            exchange.get('receiver_id') != user_id):
            return {
                'code': 1,
                'msg': '无权查看此交换记录',
                'data': None
            }
        
        return {
            'code': 0,
            'msg': 'success',
            'data': self._enrich_exchange(exchange)
        }

    def agree_request(self, exchange_id: int, user_id: int) -> Dict[str, Any]:
        exchange = self.exchange_model.get_by_id(exchange_id)
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }
        
        if exchange.get('receiver_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此交换请求',
                'data': None
            }
        
        if exchange.get('status') != ExExchangeModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该交换请求已处理',
                'data': None
            }
        
        self.exchange_model.update_status(exchange_id, ExExchangeModel.STATUS_AGREED)
        
        requester = self.user_model.get_by_id(exchange.get('requester_id'))
        receiver = self.user_model.get_by_id(exchange.get('receiver_id'))
        receiver_name = receiver.get('nickname') or f'用户{receiver.get("id")}'
        msg_content = f"用户{receiver_name}同意了您的交换请求，快去联系TA吧"
        self.message_model.send_system_message(requester.get('id'), msg_content, exchange_id)
        
        updated_exchange = self.exchange_model.get_by_id(exchange_id)
        return {
            'code': 0,
            'msg': '已同意交换请求',
            'data': self._enrich_exchange(updated_exchange)
        }

    def reject_request(self, exchange_id: int, user_id: int) -> Dict[str, Any]:
        exchange = self.exchange_model.get_by_id(exchange_id)
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }
        
        if exchange.get('receiver_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此交换请求',
                'data': None
            }
        
        if exchange.get('status') != ExExchangeModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该交换请求已处理',
                'data': None
            }
        
        self.exchange_model.update_status(exchange_id, ExExchangeModel.STATUS_REJECTED)
        
        requester = self.user_model.get_by_id(exchange.get('requester_id'))
        receiver = self.user_model.get_by_id(exchange.get('receiver_id'))
        receiver_name = receiver.get('nickname') or f'用户{receiver.get("id")}'
        msg_content = f"用户{receiver_name}拒绝了您的交换请求"
        self.message_model.send_system_message(requester.get('id'), msg_content, exchange_id)
        
        updated_exchange = self.exchange_model.get_by_id(exchange_id)
        return {
            'code': 0,
            'msg': '已拒绝交换请求',
            'data': self._enrich_exchange(updated_exchange)
        }

    def cancel_request(self, exchange_id: int, user_id: int) -> Dict[str, Any]:
        exchange = self.exchange_model.get_by_id(exchange_id)
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }
        
        if exchange.get('requester_id') != user_id:
            return {
                'code': 1,
                'msg': '只能取消自己发起的交换请求',
                'data': None
            }
        
        if exchange.get('status') != ExExchangeModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该交换请求已处理，无法取消',
                'data': None
            }
        
        self.exchange_model.update_status(exchange_id, ExExchangeModel.STATUS_CANCELLED)
        
        updated_exchange = self.exchange_model.get_by_id(exchange_id)
        return {
            'code': 0,
            'msg': '已取消交换请求',
            'data': self._enrich_exchange(updated_exchange)
        }

    def confirm_complete(self, exchange_id: int, user_id: int) -> Dict[str, Any]:
        exchange = self.exchange_model.get_by_id(exchange_id)
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }
        
        if (exchange.get('requester_id') != user_id and 
            exchange.get('receiver_id') != user_id):
            return {
                'code': 1,
                'msg': '无权操作此交换记录',
                'data': None
            }
        
        if exchange.get('status') != ExExchangeModel.STATUS_AGREED:
            return {
                'code': 1,
                'msg': '只有已同意的交换才能确认完成',
                'data': None
            }
        
        self.exchange_model.update_status(exchange_id, ExExchangeModel.STATUS_COMPLETED)
        self.item_model.update_status(exchange.get('requester_item_id'), ExItemModel.STATUS_EXCHANGED)
        self.item_model.update_status(exchange.get('receiver_item_id'), ExItemModel.STATUS_EXCHANGED)
        
        other_user_id = exchange.get('receiver_id') if user_id == exchange.get('requester_id') else exchange.get('requester_id')
        confirmer = self.user_model.get_by_id(user_id)
        confirmer_name = confirmer.get('nickname') or f'用户{user_id}'
        msg_content = f"用户{confirmer_name}确认已完成交换，请确认收货"
        self.message_model.send_system_message(other_user_id, msg_content, exchange_id)
        
        updated_exchange = self.exchange_model.get_by_id(exchange_id)
        return {
            'code': 0,
            'msg': '已确认交换完成',
            'data': self._enrich_exchange(updated_exchange)
        }

    def submit_review(self, exchange_id: int, reviewer_id: int,
                      description_score: int, attitude_score: int,
                      efficiency_score: int, comment: str = '') -> Dict[str, Any]:
        exchange = self.exchange_model.get_by_id(exchange_id)
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }
        
        if (exchange.get('requester_id') != reviewer_id and 
            exchange.get('receiver_id') != reviewer_id):
            return {
                'code': 1,
                'msg': '无权评价此交换',
                'data': None
            }
        
        if exchange.get('status') != ExExchangeModel.STATUS_COMPLETED:
            return {
                'code': 1,
                'msg': '只能评价已完成的交换',
                'data': None
            }
        
        if self.review_model.check_exists(exchange_id, reviewer_id):
            return {
                'code': 1,
                'msg': '您已评价过此交换',
                'data': None
            }
        
        if not all(1 <= s <= 5 for s in [description_score, attitude_score, efficiency_score]):
            return {
                'code': 1,
                'msg': '评分必须在1-5星之间',
                'data': None
            }
        
        reviewee_id = exchange.get('receiver_id') if reviewer_id == exchange.get('requester_id') else exchange.get('requester_id')
        
        review_id = self.review_model.create(
            exchange_id=exchange_id,
            reviewer_id=reviewer_id,
            reviewee_id=reviewee_id,
            description_score=description_score,
            attitude_score=attitude_score,
            efficiency_score=efficiency_score,
            comment=comment
        )
        
        if review_id > 0:
            self.user_model.update_credit_after_review(
                reviewee_id, description_score, attitude_score, efficiency_score
            )
            
            review = self.review_model.get_by_id(review_id)
            return {
                'code': 0,
                'msg': '评价成功',
                'data': self.review_model.to_public_dict(review)
            }
        
        return {
            'code': 1,
            'msg': '评价失败',
            'data': None
        }

    def get_my_reviews(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.review_model.get_by_reviewee(user_id, page, page_size)
        items = []
        for r in result.get('items', []):
            reviewer = self.user_model.get_by_id(r.get('reviewer_id'))
            item = self.review_model.to_public_dict(r)
            if reviewer:
                item['reviewer'] = {
                    'id': reviewer.get('id'),
                    'nickname': reviewer.get('nickname'),
                    'avatar_url': reviewer.get('avatar_url')
                }
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

    def get_completed_history(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'status': ExExchangeModel.STATUS_COMPLETED}
        where_clauses = ["status = ?"]
        params = [ExExchangeModel.STATUS_COMPLETED]
        where_clauses.append("(requester_id = ? OR receiver_id = ?)")
        params.extend([user_id, user_id])
        
        offset = (page - 1) * page_size
        
        count_sql = f"SELECT COUNT(*) as total FROM {self.exchange_model.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        count_result = self.exchange_model.db.fetch_one(count_sql, tuple(params))
        total = count_result['total'] if count_result else 0
        
        sql = f"SELECT * FROM {self.exchange_model.TABLE_NAME} WHERE {' AND '.join(where_clauses)} ORDER BY id DESC LIMIT ? OFFSET ?"
        params.append(page_size)
        params.append(offset)
        
        items = self.exchange_model.db.fetch_all(sql, tuple(params))
        items = [self._enrich_exchange(item) for item in items]
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'list': items,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }
        }

    def get_all_exchanges(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.exchange_model.get_all(page, page_size)
        items = [self._enrich_exchange(item) for item in result.get('items', [])]
        
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
