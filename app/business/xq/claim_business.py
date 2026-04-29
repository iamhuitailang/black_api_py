from typing import Dict, Any, Optional
from app.model.xq import ClaimModel, PostModel, UserModel


class XqClaimBusiness:
    def __init__(self):
        self.claim_model = ClaimModel()
        self.post_model = PostModel()
        self.user_model = UserModel()

    def create_claim(self, user_id: int, post_id: int, comment: str = '') -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if user.get('status') == self.user_model.STATUS_BANNED:
            return {
                'code': 1,
                'msg': '账号已被封号，无法接单',
                'data': None
            }

        if user.get('status') == self.user_model.STATUS_MUTED:
            return {
                'code': 1,
                'msg': '账号已被禁言，无法接单',
                'data': None
            }

        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '帖子不存在',
                'data': None
            }

        if post.get('user_id') == user_id:
            return {
                'code': 1,
                'msg': '不能接自己发布的帖子',
                'data': None
            }

        if post.get('status') != PostModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该帖子已被接单或已完成',
                'data': None
            }

        if self.claim_model.has_claimed(post_id, user_id):
            return {
                'code': 1,
                'msg': '您已经申请过了',
                'data': None
            }

        claim_id = self.claim_model.create(
            post_id=post_id,
            helper_id=user_id,
            comment=comment or ''
        )

        if claim_id > 0:
            claim = self.claim_model.get_by_id(claim_id)
            return {
                'code': 0,
                'msg': '申请成功',
                'data': self.claim_model.to_dict(claim)
            }

        return {
            'code': 1,
            'msg': '申请失败',
            'data': None
        }

    def accept_claim(self, user_id: int, claim_id: int) -> Dict[str, Any]:
        claim = self.claim_model.get_by_id(claim_id)
        if not claim:
            return {
                'code': 1,
                'msg': '申请不存在',
                'data': None
            }

        post = self.post_model.get_by_id(claim.get('post_id'))
        if not post:
            return {
                'code': 1,
                'msg': '帖子不存在',
                'data': None
            }

        if post.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能确认自己帖子的申请',
                'data': None
            }

        if claim.get('status') != ClaimModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该申请已被处理',
                'data': None
            }

        self.claim_model.update_status(claim_id, ClaimModel.STATUS_ACCEPTED)
        self.post_model.update_status(post.get('id'), PostModel.STATUS_IN_PROGRESS)

        updated_claim = self.claim_model.get_by_id(claim_id)
        return {
            'code': 0,
            'msg': '已确认接单',
            'data': self.claim_model.to_dict(updated_claim)
        }

    def reject_claim(self, user_id: int, claim_id: int) -> Dict[str, Any]:
        claim = self.claim_model.get_by_id(claim_id)
        if not claim:
            return {
                'code': 1,
                'msg': '申请不存在',
                'data': None
            }

        post = self.post_model.get_by_id(claim.get('post_id'))
        if not post:
            return {
                'code': 1,
                'msg': '帖子不存在',
                'data': None
            }

        if post.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能拒绝自己帖子的申请',
                'data': None
            }

        if claim.get('status') != ClaimModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该申请已被处理',
                'data': None
            }

        self.claim_model.update_status(claim_id, ClaimModel.STATUS_REJECTED)

        return {
            'code': 0,
            'msg': '已拒绝',
            'data': None
        }

    def complete_claim(self, user_id: int, claim_id: int) -> Dict[str, Any]:
        claim = self.claim_model.get_by_id(claim_id)
        if not claim:
            return {
                'code': 1,
                'msg': '申请不存在',
                'data': None
            }

        post = self.post_model.get_by_id(claim.get('post_id'))
        if not post:
            return {
                'code': 1,
                'msg': '帖子不存在',
                'data': None
            }

        if post.get('user_id') != user_id and claim.get('helper_id') != user_id:
            return {
                'code': 1,
                'msg': '没有权限',
                'data': None
            }

        if claim.get('status') != ClaimModel.STATUS_ACCEPTED:
            return {
                'code': 1,
                'msg': '该申请未被确认',
                'data': None
            }

        self.claim_model.update_status(claim_id, ClaimModel.STATUS_COMPLETED)
        self.post_model.update_status(post.get('id'), PostModel.STATUS_COMPLETED)

        return {
            'code': 0,
            'msg': '已完成',
            'data': None
        }

    def get_my_claims(self, user_id: int, page: int = 1, page_size: int = 10,
                      status: int = None) -> Dict[str, Any]:
        result = self.claim_model.get_by_helper(
            helper_id=user_id,
            page=page,
            page_size=page_size,
            status=status
        )

        items = []
        for claim in result.get('items', []):
            claim_data = self.claim_model.to_dict(claim)
            post = self.post_model.get_by_id(claim.get('post_id'))
            if post:
                claim_data['post'] = self.post_model.to_dict(post)
            items.append(claim_data)

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

    def get_post_claims(self, post_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.claim_model.get_by_post(
            post_id=post_id,
            page=page,
            page_size=page_size
        )

        items = []
        for claim in result.get('items', []):
            claim_data = self.claim_model.to_dict(claim)
            helper = self.user_model.get_by_id(claim.get('helper_id'))
            if helper:
                claim_data['helper'] = {
                    'id': helper.get('id'),
                    'nickname': helper.get('nickname'),
                    'avatar': helper.get('avatar'),
                    'credit': helper.get('credit')
                }
            items.append(claim_data)

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

    def get_claim_detail(self, claim_id: int) -> Dict[str, Any]:
        claim = self.claim_model.get_by_id(claim_id)
        if not claim:
            return {
                'code': 1,
                'msg': '申请不存在',
                'data': None
            }

        claim_data = self.claim_model.to_dict(claim)
        post = self.post_model.get_by_id(claim.get('post_id'))
        if post:
            claim_data['post'] = self.post_model.to_dict(post)

        helper = self.user_model.get_by_id(claim.get('helper_id'))
        if helper:
            claim_data['helper'] = {
                'id': helper.get('id'),
                'nickname': helper.get('nickname'),
                'avatar': helper.get('avatar'),
                'credit': helper.get('credit')
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': claim_data
        }
