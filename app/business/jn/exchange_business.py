from typing import Dict, Any, List, Optional
from app.model.jn import ExchangeModel, SkillModel, UserModel


class JnExchangeBusiness:
    def __init__(self):
        self.exchange_model = ExchangeModel()
        self.skill_model = SkillModel()
        self.user_model = UserModel()

    def create_exchange(self, from_user: int, to_user: int, offer_skill_id: int,
                        need_skill_id: int, message: str = '') -> Dict[str, Any]:
        if from_user == to_user:
            return {
                'code': 1,
                'msg': '不能向自己发起交换',
                'data': None
            }

        offer_skill = self.skill_model.get_by_id(offer_skill_id)
        if not offer_skill or offer_skill.get('is_active') != 1:
            return {
                'code': 1,
                'msg': '提供的技能不存在',
                'data': None
            }

        if offer_skill.get('user_id') != from_user:
            return {
                'code': 1,
                'msg': '只能使用自己的技能发起交换',
                'data': None
            }

        need_skill = self.skill_model.get_by_id(need_skill_id)
        if not need_skill or need_skill.get('is_active') != 1:
            return {
                'code': 1,
                'msg': '需求的技能不存在',
                'data': None
            }

        if need_skill.get('user_id') != to_user:
            return {
                'code': 1,
                'msg': '需求的技能不属于目标用户',
                'data': None
            }

        if self.exchange_model.check_pending_exists(from_user, to_user):
            return {
                'code': 1,
                'msg': '您已向该用户发起过交换邀请，等待对方确认',
                'data': None
            }

        exchange_id = self.exchange_model.create(
            from_user=from_user,
            to_user=to_user,
            offer_skill_id=offer_skill_id,
            need_skill_id=need_skill_id,
            message=message
        )

        if exchange_id > 0:
            exchange = self.exchange_model.get_by_id(exchange_id)
            return {
                'code': 0,
                'msg': '交换邀请已发送',
                'data': self.exchange_model.to_dict(exchange)
            }

        return {
            'code': 1,
            'msg': '发起失败',
            'data': None
        }

    def accept_exchange(self, user_id: int, exchange_id: int) -> Dict[str, Any]:
        exchange = self.exchange_model.get_by_id(exchange_id)
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }

        if exchange.get('to_user') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此交换',
                'data': None
            }

        if exchange.get('status') != ExchangeModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '只能接受待确认的交换邀请',
                'data': None
            }

        affected = self.exchange_model.accept(exchange_id)
        if affected > 0:
            updated = self.exchange_model.get_by_id(exchange_id)
            return {
                'code': 0,
                'msg': '已接受交换邀请',
                'data': self.exchange_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def reject_exchange(self, user_id: int, exchange_id: int) -> Dict[str, Any]:
        exchange = self.exchange_model.get_by_id(exchange_id)
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }

        if exchange.get('to_user') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此交换',
                'data': None
            }

        if exchange.get('status') != ExchangeModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '只能拒绝待确认的交换邀请',
                'data': None
            }

        affected = self.exchange_model.reject(exchange_id)
        if affected > 0:
            updated = self.exchange_model.get_by_id(exchange_id)
            return {
                'code': 0,
                'msg': '已拒绝交换邀请',
                'data': self.exchange_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def start_exchange(self, user_id: int, exchange_id: int) -> Dict[str, Any]:
        exchange = self.exchange_model.get_by_id(exchange_id)
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }

        if exchange.get('from_user') != user_id and exchange.get('to_user') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此交换',
                'data': None
            }

        if exchange.get('status') != ExchangeModel.STATUS_ACCEPTED:
            return {
                'code': 1,
                'msg': '只能从已接受状态开始交换',
                'data': None
            }

        affected = self.exchange_model.start(exchange_id)
        if affected > 0:
            updated = self.exchange_model.get_by_id(exchange_id)
            return {
                'code': 0,
                'msg': '交换已开始',
                'data': self.exchange_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def complete_exchange(self, user_id: int, exchange_id: int) -> Dict[str, Any]:
        exchange = self.exchange_model.get_by_id(exchange_id)
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }

        if exchange.get('from_user') != user_id and exchange.get('to_user') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此交换',
                'data': None
            }

        if exchange.get('status') != ExchangeModel.STATUS_IN_PROGRESS:
            return {
                'code': 1,
                'msg': '只能在进行中状态完成交换',
                'data': None
            }

        affected = self.exchange_model.complete(exchange_id)
        if affected > 0:
            updated = self.exchange_model.get_by_id(exchange_id)
            return {
                'code': 0,
                'msg': '交换已完成',
                'data': self.exchange_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def cancel_exchange(self, user_id: int, exchange_id: int) -> Dict[str, Any]:
        exchange = self.exchange_model.get_by_id(exchange_id)
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }

        if exchange.get('from_user') != user_id:
            return {
                'code': 1,
                'msg': '只有发起方可以取消交换',
                'data': None
            }

        if exchange.get('status') not in [ExchangeModel.STATUS_PENDING, ExchangeModel.STATUS_ACCEPTED]:
            return {
                'code': 1,
                'msg': '只能取消待确认或已接受的交换',
                'data': None
            }

        affected = self.exchange_model.cancel(exchange_id)
        if affected > 0:
            updated = self.exchange_model.get_by_id(exchange_id)
            return {
                'code': 0,
                'msg': '交换已取消',
                'data': self.exchange_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def get_user_exchanges(self, user_id: int, status: str = None) -> Dict[str, Any]:
        exchanges = self.exchange_model.get_by_user(user_id, status)
        
        result = []
        for exchange in exchanges:
            item = self.exchange_model.to_dict(exchange)
            
            from_user = self.user_model.get_by_id(exchange.get('from_user'))
            to_user = self.user_model.get_by_id(exchange.get('to_user'))
            offer_skill = self.skill_model.get_by_id(exchange.get('offer_skill_id'))
            need_skill = self.skill_model.get_by_id(exchange.get('need_skill_id'))
            
            item['from_user_info'] = self.user_model.to_public_dict(from_user) if from_user else None
            item['to_user_info'] = self.user_model.to_public_dict(to_user) if to_user else None
            item['offer_skill_info'] = self.skill_model.to_dict(offer_skill) if offer_skill else None
            item['need_skill_info'] = self.skill_model.to_dict(need_skill) if need_skill else None
            
            result.append(item)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_exchange_detail(self, user_id: int, exchange_id: int) -> Dict[str, Any]:
        exchange = self.exchange_model.get_by_id(exchange_id)
        if not exchange:
            return {
                'code': 1,
                'msg': '交换记录不存在',
                'data': None
            }

        if exchange.get('from_user') != user_id and exchange.get('to_user') != user_id:
            return {
                'code': 1,
                'msg': '无权查看此交换',
                'data': None
            }

        item = self.exchange_model.to_dict(exchange)
        
        from_user = self.user_model.get_by_id(exchange.get('from_user'))
        to_user = self.user_model.get_by_id(exchange.get('to_user'))
        offer_skill = self.skill_model.get_by_id(exchange.get('offer_skill_id'))
        need_skill = self.skill_model.get_by_id(exchange.get('need_skill_id'))
        
        item['from_user_info'] = self.user_model.to_public_dict(from_user) if from_user else None
        item['to_user_info'] = self.user_model.to_public_dict(to_user) if to_user else None
        item['offer_skill_info'] = self.skill_model.to_dict(offer_skill) if offer_skill else None
        item['need_skill_info'] = self.skill_model.to_dict(need_skill) if need_skill else None

        return {
            'code': 0,
            'msg': 'success',
            'data': item
        }

    def get_all_exchanges(self, page: int = 1, page_size: int = 10,
                          status: str = None, keyword: str = None) -> Dict[str, Any]:
        result = self.exchange_model.get_all(page, page_size, status, keyword)
        
        items = []
        for exchange in result.get('items', []):
            item = self.exchange_model.to_dict(exchange)
            
            from_user = self.user_model.get_by_id(exchange.get('from_user'))
            to_user = self.user_model.get_by_id(exchange.get('to_user'))
            offer_skill = self.skill_model.get_by_id(exchange.get('offer_skill_id'))
            need_skill = self.skill_model.get_by_id(exchange.get('need_skill_id'))
            
            item['from_user_info'] = self.user_model.to_public_dict(from_user) if from_user else None
            item['to_user_info'] = self.user_model.to_public_dict(to_user) if to_user else None
            item['offer_skill_info'] = self.skill_model.to_dict(offer_skill) if offer_skill else None
            item['need_skill_info'] = self.skill_model.to_dict(need_skill) if need_skill else None
            
            items.append(item)

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
