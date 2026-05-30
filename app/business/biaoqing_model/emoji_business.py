from typing import Dict, Any, List, Optional
from app.model.biaoqing_model import (
    EmojiModel, CategoryModel, TagModel, FavoriteModel,
    ReviewModel, DownloadLogModel, PointLogModel, SearchHistoryModel
)


class BqEmojiBusiness:
    def __init__(self):
        self.emoji_model = EmojiModel()
        self.category_model = CategoryModel()
        self.tag_model = TagModel()
        self.favorite_model = FavoriteModel()
        self.review_model = ReviewModel()
        self.download_log_model = DownloadLogModel()
        self.point_log_model = PointLogModel()
        self.search_history_model = SearchHistoryModel()

    def create(self, url: str, category_id: int = 0, user_id: int = 0,
               title: str = '', description: str = '', thumb_url: str = '',
               tags: List[str] = None, width: int = 0, height: int = 0,
               file_size: int = 0, file_type: str = '') -> Dict[str, Any]:
        if not url:
            return {
                'code': 1,
                'msg': '图片地址不能为空',
                'data': None
            }

        if category_id > 0:
            category = self.category_model.get_by_id(category_id)
            if not category:
                return {
                    'code': 1,
                    'msg': '分类不存在',
                    'data': None
                }

        emoji_id = self.emoji_model.create(
            url=url, category_id=category_id, user_id=user_id,
            title=title, description=description, thumb_url=thumb_url,
            width=width, height=height, file_size=file_size,
            file_type=file_type, status=EmojiModel.STATUS_APPROVED
        )

        if emoji_id > 0:
            if tags:
                self.emoji_model.set_tags(emoji_id, tags)

            if user_id > 0:
                self.point_log_model.create(
                    user_id, 5, PointLogModel.TYPE_UPLOAD, '上传表情包'
                )

            emoji = self.emoji_model.get_by_id(emoji_id)
            return {
                'code': 0,
                'msg': '上传成功',
                'data': self.emoji_model.to_dict(emoji, include_tags=True)
            }

        return {
            'code': 1,
            'msg': '上传失败',
            'data': None
        }

    def update(self, emoji_id: int, data: Dict[str, Any], tags: List[str] = None) -> Dict[str, Any]:
        emoji = self.emoji_model.get_by_id(emoji_id)
        if not emoji:
            return {
                'code': 1,
                'msg': '表情包不存在',
                'data': None
            }

        if 'category_id' in data and data['category_id'] > 0:
            category = self.category_model.get_by_id(data['category_id'])
            if not category:
                return {
                    'code': 1,
                    'msg': '分类不存在',
                    'data': None
                }

        affected = self.emoji_model.update(emoji_id, data)
        if tags is not None:
            self.emoji_model.set_tags(emoji_id, tags)

        if affected >= 0:
            updated = self.emoji_model.get_by_id(emoji_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.emoji_model.to_dict(updated, include_tags=True)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete(self, emoji_id: int) -> Dict[str, Any]:
        emoji = self.emoji_model.get_by_id(emoji_id)
        if not emoji:
            return {
                'code': 1,
                'msg': '表情包不存在',
                'data': None
            }

        affected = self.emoji_model.delete(emoji_id)
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

    def get_by_id(self, emoji_id: int, user_id: int = 0, increment_view: bool = True) -> Dict[str, Any]:
        emoji = self.emoji_model.get_by_id(emoji_id)
        if not emoji:
            return {
                'code': 1,
                'msg': '表情包不存在',
                'data': None
            }

        if emoji.get('status') != EmojiModel.STATUS_APPROVED:
            return {
                'code': 1,
                'msg': '表情包未审核通过',
                'data': None
            }

        if increment_view:
            self.emoji_model.increment_view(emoji_id)

        result = self.emoji_model.to_dict(emoji, include_tags=True)

        if user_id > 0:
            result['is_favorited'] = self.favorite_model.is_favorited(user_id, emoji_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_list(self, page: int = 1, page_size: int = 20, category_id: int = None,
                 sort_by: str = 'latest', user_id: int = 0) -> Dict[str, Any]:
        order_by_map = {
            'latest': 'id DESC',
            'hot': 'view_count DESC, id DESC',
            'download': 'download_count DESC, id DESC',
            'like': 'like_count DESC, id DESC',
            'favorite': 'favorite_count DESC, id DESC',
        }
        order_by = order_by_map.get(sort_by, 'id DESC')

        result = self.emoji_model.get_all(
            page=page, page_size=page_size,
            status=EmojiModel.STATUS_APPROVED,
            category_id=category_id,
            order_by=order_by
        )

        items = []
        for item in result.get('items', []):
            emoji_dict = self.emoji_model.to_dict(item)
            if user_id > 0:
                emoji_dict['is_favorited'] = self.favorite_model.is_favorited(user_id, item.get('id'))
            items.append(emoji_dict)

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

    def get_hot_list(self, page: int = 1, page_size: int = 20, category_id: int = None,
                     user_id: int = 0) -> Dict[str, Any]:
        result = self.emoji_model.get_hot_list(page, page_size, category_id)

        items = []
        for item in result.get('items', []):
            emoji_dict = self.emoji_model.to_dict(item)
            if user_id > 0:
                emoji_dict['is_favorited'] = self.favorite_model.is_favorited(user_id, item.get('id'))
            items.append(emoji_dict)

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

    def get_recommend_list(self, page: int = 1, page_size: int = 20,
                           user_id: int = 0) -> Dict[str, Any]:
        result = self.emoji_model.get_recommend_list(page, page_size)

        items = []
        for item in result.get('items', []):
            emoji_dict = self.emoji_model.to_dict(item)
            if user_id > 0:
                emoji_dict['is_favorited'] = self.favorite_model.is_favorited(user_id, item.get('id'))
            items.append(emoji_dict)

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

    def get_latest_list(self, page: int = 1, page_size: int = 20, category_id: int = None,
                        user_id: int = 0) -> Dict[str, Any]:
        result = self.emoji_model.get_latest_list(page, page_size, category_id)

        items = []
        for item in result.get('items', []):
            emoji_dict = self.emoji_model.to_dict(item)
            if user_id > 0:
                emoji_dict['is_favorited'] = self.favorite_model.is_favorited(user_id, item.get('id'))
            items.append(emoji_dict)

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

    def get_random_list(self, limit: int = 10, category_id: int = None,
                        user_id: int = 0) -> Dict[str, Any]:
        items_raw = self.emoji_model.get_random_list(limit, category_id)

        items = []
        for item in items_raw:
            emoji_dict = self.emoji_model.to_dict(item)
            if user_id > 0:
                emoji_dict['is_favorited'] = self.favorite_model.is_favorited(user_id, item.get('id'))
            items.append(emoji_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def search(self, keyword: str, page: int = 1, page_size: int = 20,
               sort_by: str = 'latest', category_id: int = None, user_id: int = 0,
               search_user_id: int = 0) -> Dict[str, Any]:
        if not keyword:
            return {
                'code': 1,
                'msg': '搜索关键词不能为空',
                'data': None
            }

        if search_user_id > 0:
            self.search_history_model.add(search_user_id, keyword)

        result = self.emoji_model.search(keyword, page, page_size,
                                          status=EmojiModel.STATUS_APPROVED,
                                          category_id=category_id,
                                          sort_by=sort_by)

        items = []
        for item in result.get('items', []):
            emoji_dict = self.emoji_model.to_dict(item)
            if user_id > 0:
                emoji_dict['is_favorited'] = self.favorite_model.is_favorited(user_id, item.get('id'))
            items.append(emoji_dict)

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

    def get_user_uploads(self, user_id: int, page: int = 1, page_size: int = 20,
                         status: int = None) -> Dict[str, Any]:
        result = self.emoji_model.get_all(page, page_size, status=status, user_id=user_id)

        items = [self.emoji_model.to_dict(item) for item in result.get('items', [])]

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

    def toggle_favorite(self, user_id: int, emoji_id: int) -> Dict[str, Any]:
        is_favorited = self.favorite_model.is_favorited(user_id, emoji_id)

        if is_favorited:
            result = self.favorite_model.delete(user_id, emoji_id)
            if result > 0:
                return {
                    'code': 0,
                    'msg': '取消收藏成功',
                    'data': {'is_favorited': False}
                }
        else:
            result = self.favorite_model.create(user_id, emoji_id)
            if result > 0:
                self.point_log_model.create(
                    user_id, 1, PointLogModel.TYPE_FAVORITE, '收藏表情包'
                )
                return {
                    'code': 0,
                    'msg': '收藏成功',
                    'data': {'is_favorited': True}
                }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def get_favorites(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.favorite_model.get_user_favorites(user_id, page, page_size)

        items = []
        for item in result.get('items', []):
            emoji_dict = self.emoji_model.to_dict(item)
            emoji_dict['is_favorited'] = True
            items.append(emoji_dict)

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

    def add_review(self, user_id: int, emoji_id: int, content: str,
                   rating: int = 5) -> Dict[str, Any]:
        if not content:
            return {
                'code': 1,
                'msg': '评论内容不能为空',
                'data': None
            }

        emoji = self.emoji_model.get_by_id(emoji_id)
        if not emoji:
            return {
                'code': 1,
                'msg': '表情包不存在',
                'data': None
            }

        review_id = self.review_model.create(user_id, emoji_id, content, rating)
        if review_id > 0:
            self.point_log_model.create(
                user_id, 2, PointLogModel.TYPE_COMMENT, '发表评论'
            )
            review = self.review_model.get_by_id(review_id)
            return {
                'code': 0,
                'msg': '评论成功',
                'data': self.review_model.to_dict(review, include_user=True)
            }

        return {
            'code': 1,
            'msg': '评论失败',
            'data': None
        }

    def get_reviews(self, emoji_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.review_model.get_by_emoji_id(emoji_id, page, page_size,
                                                   status=ReviewModel.STATUS_APPROVED)

        items = [self.review_model.to_dict(item, include_user=True) for item in result.get('items', [])]

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

    def record_download(self, user_id: int, emoji_id: int, ip: str = '',
                        user_agent: str = '') -> Dict[str, Any]:
        emoji = self.emoji_model.get_by_id(emoji_id)
        if not emoji:
            return {
                'code': 1,
                'msg': '表情包不存在',
                'data': None
            }

        self.download_log_model.create(user_id, emoji_id, ip, user_agent)

        if user_id > 0:
            self.point_log_model.create(
                user_id, 1, PointLogModel.TYPE_DOWNLOAD, '下载表情包'
            )

        return {
            'code': 0,
            'msg': 'success',
            'data': None
        }

    def get_downloads(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.download_log_model.get_user_downloads(user_id, page, page_size)

        items = [self.emoji_model.to_dict(item) for item in result.get('items', [])]

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

    def get_hot_tags(self, limit: int = 20) -> Dict[str, Any]:
        tags = self.tag_model.get_hot_tags(limit)
        items = [self.tag_model.to_dict(tag) for tag in tags]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def update_status(self, emoji_id: int, status: int) -> Dict[str, Any]:
        emoji = self.emoji_model.get_by_id(emoji_id)
        if not emoji:
            return {
                'code': 1,
                'msg': '表情包不存在',
                'data': None
            }

        affected = self.emoji_model.update_status(emoji_id, status)
        if affected > 0:
            updated = self.emoji_model.get_by_id(emoji_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.emoji_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def get_pending_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.emoji_model.get_all(page, page_size, status=EmojiModel.STATUS_PENDING,
                                          order_by='id ASC')

        items = [self.emoji_model.to_dict(item, include_tags=True) for item in result.get('items', [])]

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

    def get_hot_keywords(self, limit: int = 10) -> Dict[str, Any]:
        keywords = self.search_history_model.get_hot_keywords(limit)
        return {
            'code': 0,
            'msg': 'success',
            'data': keywords
        }

    def get_search_history(self, user_id: int, limit: int = 20) -> Dict[str, Any]:
        history = self.search_history_model.get_user_history(user_id, limit)
        items = [self.search_history_model.to_dict(item) for item in history]
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def clear_search_history(self, user_id: int) -> Dict[str, Any]:
        affected = self.search_history_model.clear_user_history(user_id)
        if affected >= 0:
            return {
                'code': 0,
                'msg': '清空成功',
                'data': None
            }
        return {
            'code': 1,
            'msg': '清空失败',
            'data': None
        }
