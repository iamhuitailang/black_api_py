from typing import Dict, Any
from app.model.shiwu_model import ClaimModel, PostModel, UserModel, NotificationModel, ReviewModel


class ClaimBusiness:
    def __init__(self):
        self.claim_model = ClaimModel()
        self.post_model = PostModel()
        self.user_model = UserModel()
        self.notification_model = NotificationModel()
        self.review_model = ReviewModel()

    def create_claim(self, claimant_id: int, post_id: int, description: str = '',
                    item_features: str = '', contact: str = '') -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        if post.get('post_type') != PostModel.TYPE_FOUND:
            return {
                'code': 1,
                'msg': '只能对招领启事申请认领',
                'data': None
            }

        if post.get('status') != PostModel.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '该信息已关闭或已认领',
                'data': None
            }

        if post.get('user_id') == claimant_id:
            return {
                'code': 1,
                'msg': '不能认领自己发布的信息',
                'data': None
            }

        existing = self.claim_model.get_by_post_and_claimant(post_id, claimant_id)
        if existing:
            return {
                'code': 1,
                'msg': '您已提交过认领申请',
                'data': None
            }

        claim_id = self.claim_model.create(
            post_id=post_id,
            claimant_id=claimant_id,
            post_owner_id=post.get('user_id'),
            description=description,
            item_features=item_features,
            contact=contact
        )

        if claim_id > 0:
            self.notification_model.create(
                user_id=post.get('user_id'),
                notification_type='claim',
                title='收到新的认领申请',
                content=f'您发布的"{post.get("title")}"收到了新的认领申请',
                related_id=claim_id,
                related_type='claim'
            )

            claim = self.claim_model.get_by_id(claim_id)
            return {
                'code': 0,
                'msg': '申请已提交',
                'data': self.claim_model.to_dict(claim)
            }

        return {
            'code': 1,
            'msg': '申请提交失败',
            'data': None
        }

    def get_claim_by_id(self, claim_id: int, current_user_id: int = None) -> Dict[str, Any]:
        claim = self.claim_model.get_by_id(claim_id)
        if not claim:
            return {
                'code': 1,
                'msg': '申请不存在',
                'data': None
            }

        if current_user_id and current_user_id not in [claim.get('claimant_id'), claim.get('post_owner_id')]:
            return {
                'code': 1,
                'msg': '无权限查看',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.claim_model.to_dict(claim)
        }

    def get_claims_by_post(self, post_id: int, user_id: int, page: int = 1,
                          page_size: int = 10, status: int = None) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        if post.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限查看',
                'data': None
            }

        result = self.claim_model.get_by_post(post_id, page, page_size, status)
        items = [self.claim_model.to_dict(item) for item in result.get('items', [])]

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

    def get_my_claims(self, claimant_id: int, page: int = 1, page_size: int = 10,
                     status: int = None) -> Dict[str, Any]:
        result = self.claim_model.get_by_claimant(claimant_id, page, page_size, status)
        items = []
        for item in result.get('items', []):
            claim_dict = self.claim_model.to_dict(item)
            post = self.post_model.get_by_id(item.get('post_id', 0))
            if post:
                claim_dict['post'] = self.post_model.to_dict(post)
            items.append(claim_dict)

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

    def get_received_claims(self, owner_id: int, page: int = 1, page_size: int = 10,
                           status: int = None) -> Dict[str, Any]:
        result = self.claim_model.get_by_owner(owner_id, page, page_size, status)
        items = []
        for item in result.get('items', []):
            claim_dict = self.claim_model.to_dict(item)
            post = self.post_model.get_by_id(item.get('post_id', 0))
            if post:
                claim_dict['post'] = self.post_model.to_dict(post)
            items.append(claim_dict)

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

    def get_all_claims(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.claim_model.get_all(page, page_size, status)
        items = []
        for item in result.get('items', []):
            claim_dict = self.claim_model.to_dict(item)
            post = self.post_model.get_by_id(item.get('post_id', 0))
            if post:
                claim_dict['post'] = self.post_model.to_dict(post)
            claimant = self.user_model.get_by_id(item.get('claimant_id', 0))
            if claimant:
                claim_dict['claimant'] = self.user_model.to_public_dict(claimant)
            items.append(claim_dict)

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

    def approve_claim(self, owner_id: int, claim_id: int) -> Dict[str, Any]:
        claim = self.claim_model.get_by_id(claim_id)
        if not claim:
            return {
                'code': 1,
                'msg': '申请不存在',
                'data': None
            }

        if claim.get('post_owner_id') != owner_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        if claim.get('status') != ClaimModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该申请已处理',
                'data': None
            }

        affected = self.claim_model.approve(claim_id)
        if affected > 0:
            self.post_model.update_status(claim.get('post_id'), PostModel.STATUS_CLAIMED)
            
            self.notification_model.create(
                user_id=claim.get('claimant_id'),
                notification_type='claim',
                title='认领申请已通过',
                content=f'您对"{self.post_model.get_by_id(claim.get("post_id", 0)).get("title", "")}"的认领申请已通过',
                related_id=claim_id,
                related_type='claim'
            )

            updated_claim = self.claim_model.get_by_id(claim_id)
            return {
                'code': 0,
                'msg': '已通过申请',
                'data': self.claim_model.to_dict(updated_claim)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def reject_claim(self, owner_id: int, claim_id: int, reject_reason: str = '') -> Dict[str, Any]:
        claim = self.claim_model.get_by_id(claim_id)
        if not claim:
            return {
                'code': 1,
                'msg': '申请不存在',
                'data': None
            }

        if claim.get('post_owner_id') != owner_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        if claim.get('status') != ClaimModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该申请已处理',
                'data': None
            }

        affected = self.claim_model.reject(claim_id, reject_reason)
        if affected > 0:
            self.notification_model.create(
                user_id=claim.get('claimant_id'),
                notification_type='claim',
                title='认领申请被拒绝',
                content=f'您对"{self.post_model.get_by_id(claim.get("post_id", 0)).get("title", "")}"的认领申请被拒绝，原因：{reject_reason}',
                related_id=claim_id,
                related_type='claim'
            )

            updated_claim = self.claim_model.get_by_id(claim_id)
            return {
                'code': 0,
                'msg': '已拒绝申请',
                'data': self.claim_model.to_dict(updated_claim)
            }

        return {
            'code': 1,
            'msg': '操作失败',
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

        if user_id not in [claim.get('claimant_id'), claim.get('post_owner_id')]:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        if claim.get('status') != ClaimModel.STATUS_APPROVED:
            return {
                'code': 1,
                'msg': '该申请未通过或已完成',
                'data': None
            }

        affected = self.claim_model.complete(claim_id)
        if affected > 0:
            updated_claim = self.claim_model.get_by_id(claim_id)
            return {
                'code': 0,
                'msg': '已完成',
                'data': self.claim_model.to_dict(updated_claim)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def cancel_claim(self, claimant_id: int, claim_id: int) -> Dict[str, Any]:
        claim = self.claim_model.get_by_id(claim_id)
        if not claim:
            return {
                'code': 1,
                'msg': '申请不存在',
                'data': None
            }

        if claim.get('claimant_id') != claimant_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        if claim.get('status') != ClaimModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该申请已处理，不能取消',
                'data': None
            }

        affected = self.claim_model.delete(claim_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '已取消申请',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def create_review(self, reviewer_id: int, claim_id: int, rating: int = 5,
                     content: str = '') -> Dict[str, Any]:
        claim = self.claim_model.get_by_id(claim_id)
        if not claim:
            return {
                'code': 1,
                'msg': '申请不存在',
                'data': None
            }

        if claim.get('status') != ClaimModel.STATUS_APPROVED:
            return {
                'code': 1,
                'msg': '只能对已通过的申请进行评价',
                'data': None
            }

        if reviewer_id == claim.get('claimant_id'):
            reviewed_id = claim.get('post_owner_id')
        elif reviewer_id == claim.get('post_owner_id'):
            reviewed_id = claim.get('claimant_id')
        else:
            return {
                'code': 1,
                'msg': '无权限评价',
                'data': None
            }

        review_id = self.review_model.create(
            post_id=claim.get('post_id'),
            related_id=claim_id,
            related_type=ReviewModel.TYPE_CLAIM,
            reviewer_id=reviewer_id,
            reviewed_id=reviewed_id,
            rating=rating,
            content=content
        )

        if review_id > 0:
            self.notification_model.create(
                user_id=reviewed_id,
                notification_type='review',
                title='收到新的评价',
                content=f'您收到了一条新的评价，评分：{rating}星',
                related_id=review_id,
                related_type='review'
            )

            review = self.review_model.get_by_id(review_id)
            return {
                'code': 0,
                'msg': '评价成功',
                'data': self.review_model.to_dict(review)
            }

        return {
            'code': 1,
            'msg': '评价失败',
            'data': None
        }
