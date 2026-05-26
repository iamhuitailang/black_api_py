from typing import Dict, Any
from app.model.blog import BlogShareModel, BlogPostModel, BlogCategoryModel, BlogTagModel, BlogUserModel


class BlogShareBusiness:
    def __init__(self):
        self.share_model = BlogShareModel()
        self.post_model = BlogPostModel()
        self.category_model = BlogCategoryModel()
        self.tag_model = BlogTagModel()
        self.user_model = BlogUserModel()

    def generate_share(self, share_type: str, target_id: int = None, created_by: int = None) -> Dict[str, Any]:
        valid_types = [
            BlogShareModel.TYPE_POST,
            BlogShareModel.TYPE_CATEGORY,
            BlogShareModel.TYPE_TAG,
            BlogShareModel.TYPE_PROFILE
        ]
        if share_type not in valid_types:
            return {'code': 1, 'message': '不支持的分享类型', 'data': None}

        if share_type == BlogShareModel.TYPE_POST and target_id:
            post = self.post_model.get_by_id(target_id)
            if not post or post.get('status') != BlogPostModel.STATUS_PUBLISHED:
                return {'code': 1, 'message': '文章不存在或未发布', 'data': None}

        elif share_type == BlogShareModel.TYPE_CATEGORY and target_id:
            cat = self.category_model.get_by_id(target_id)
            if not cat:
                return {'code': 1, 'message': '分类不存在', 'data': None}

        elif share_type == BlogShareModel.TYPE_TAG and target_id:
            tag = self.tag_model.get_by_id(target_id)
            if not tag:
                return {'code': 1, 'message': '标签不存在', 'data': None}

        elif share_type == BlogShareModel.TYPE_PROFILE and target_id:
            user = self.user_model.get_by_id(target_id)
            if not user:
                return {'code': 1, 'message': '用户不存在', 'data': None}

        share_info = self.share_model.create_share(
            share_type=share_type,
            target_id=target_id,
            created_by=created_by
        )

        return {
            'code': 0,
            'message': 'success',
            'data': share_info
        }

    def get_share_info(self, share_code: str) -> Dict[str, Any]:
        info = self.share_model.get_share_info(share_code)
        if not info:
            return {'code': 1, 'message': '分享链接不存在或已过期', 'data': None}
        return {'code': 0, 'message': 'success', 'data': info}
