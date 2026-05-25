from typing import Dict, Any, Optional
from app.model.tucao import ReplyModel, LikeModel


class TucaoReplyBusiness:
    def __init__(self):
        self.reply_model = ReplyModel()
        self.like_model = LikeModel()

    def like_reply(self, reply_id: int, user_id: int = 0,
                   ip_address: str = '', device_id: str = '') -> Dict[str, Any]:
        reply = self.reply_model.get_by_id(reply_id)
        if not reply:
            return {
                'code': 1,
                'msg': '回复不存在',
                'data': None
            }

        if reply.get('status') != self.reply_model.STATUS_NORMAL:
            return {
                'code': 1,
                'msg': '回复不存在或已删除',
                'data': None
            }

        existing = self.like_model.get_like_record(
            target_id=reply_id,
            target_type=self.like_model.TYPE_REPLY,
            user_id=user_id,
            ip_address=ip_address,
            device_id=device_id
        )

        if existing:
            self.like_model.delete(existing.get('id'))
            self.reply_model.increment_like_count(reply_id, -1)
            return {
                'code': 0,
                'msg': '取消点赞成功',
                'data': {'liked': False}
            }
        else:
            self.like_model.create(
                target_id=reply_id,
                target_type=self.like_model.TYPE_REPLY,
                user_id=user_id,
                ip_address=ip_address,
                device_id=device_id
            )
            self.reply_model.increment_like_count(reply_id, 1)
            return {
                'code': 0,
                'msg': '点赞成功',
                'data': {'liked': True}
            }

    def delete_reply(self, reply_id: int, user_id: int = 0) -> Dict[str, Any]:
        reply = self.reply_model.get_by_id(reply_id)
        if not reply:
            return {
                'code': 1,
                'msg': '回复不存在',
                'data': None
            }

        if user_id > 0 and reply.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能删除自己的回复',
                'data': None
            }

        affected = self.reply_model.soft_delete(reply_id)
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

    def admin_delete_reply(self, reply_id: int) -> Dict[str, Any]:
        reply = self.reply_model.get_by_id(reply_id)
        if not reply:
            return {
                'code': 1,
                'msg': '回复不存在',
                'data': None
            }

        affected = self.reply_model.soft_delete(reply_id)
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

    def get_reply_list(self, post_id: int, page: int = 1,
                       page_size: int = 100) -> Dict[str, Any]:
        result = self.reply_model.get_by_post(post_id, page, page_size)
        items = [self.reply_model.to_public_dict(reply) for reply in result.get('items', [])]

        for item in items:
            children = self.reply_model.get_by_parent(item.get('id'))
            item['children'] = [self.reply_model.to_public_dict(c) for c in children]

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
