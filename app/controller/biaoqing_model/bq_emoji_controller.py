from typing import Optional, List
from fastapi import Request, Header, Query, File, UploadFile, Form
from pydantic import BaseModel, Field
import os
import uuid
import shutil


class CreateEmojiRequest(BaseModel):
    url: str = Field(..., description="图片地址")
    category_id: Optional[int] = Field(0, description="分类ID")
    title: Optional[str] = Field('', description="标题")
    description: Optional[str] = Field('', description="描述")
    thumb_url: Optional[str] = Field('', description="缩略图地址")
    tags: Optional[List[str]] = Field(None, description="标签列表")
    width: Optional[int] = Field(0, description="宽度")
    height: Optional[int] = Field(0, description="高度")
    file_size: Optional[int] = Field(0, description="文件大小")
    file_type: Optional[str] = Field('', description="文件类型")


class UpdateEmojiRequest(BaseModel):
    title: Optional[str] = Field(None, description="标题")
    description: Optional[str] = Field(None, description="描述")
    category_id: Optional[int] = Field(None, description="分类ID")
    tags: Optional[List[str]] = Field(None, description="标签列表")
    status: Optional[int] = Field(None, description="状态")


class AddReviewRequest(BaseModel):
    emoji_id: int = Field(..., description="表情包ID")
    content: str = Field(..., description="评论内容")
    rating: Optional[int] = Field(5, description="评分")


class ReportRequest(BaseModel):
    type: int = Field(..., description="举报类型")
    target_id: int = Field(..., description="目标ID")
    reason: str = Field(..., description="举报原因")
    description: Optional[str] = Field('', description="详细描述")
    images: Optional[str] = Field('', description="图片")


class BqEmojiController:
    def __init__(self):
        from app.business.biaoqing_model.emoji_business import BqEmojiBusiness
        self.emoji_business = BqEmojiBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        if not token:
            return None
        try:
            from app.business.biaoqing_model.user_business import BqUserBusiness
            user_business = BqUserBusiness()
            return user_business.verify_token(token)
        except Exception:
            return None

    def ActionBqEmojiCreatePost(self, request: Request, body: CreateEmojiRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        上传表情包接口
        POST /api/bq/emoji/create
        上传新的表情包
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0

        return self.emoji_business.create(
            url=body.url,
            category_id=body.category_id or 0,
            user_id=user_id,
            title=body.title or '',
            description=body.description or '',
            thumb_url=body.thumb_url or '',
            tags=body.tags,
            width=body.width or 0,
            height=body.height or 0,
            file_size=body.file_size or 0,
            file_type=body.file_type or ''
        )

    def ActionBqEmojiUploadPost(self, request: Request,
                                 file: UploadFile = File(..., description="表情包图片文件"),
                                 title: str = Form(..., description="标题"),
                                 category_id: int = Form(..., description="分类ID"),
                                 description: str = Form('', description="描述"),
                                 source: str = Form('', description="来源"),
                                 tags: str = Form('[]', description="标签列表(JSON格式)"),
                                 authorization: Optional[str] = Header(None)):
        """
        上传表情包文件接口
        POST /api/bq/emoji/upload
        上传表情包图片文件并创建表情包记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        user_id = user.get('id')

        if not file.content_type or not file.content_type.startswith('image/'):
            return {
                'code': 1,
                'msg': '请上传图片文件',
                'data': None
            }

        try:
            import json
            tag_list = json.loads(tags) if tags else []
        except (json.JSONDecodeError, TypeError):
            tag_list = []

        file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
        if not file_extension:
            file_extension = '.jpg'

        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        upload_dir = os.path.join(base_dir, 'static', 'uploads')
        os.makedirs(upload_dir, exist_ok=True)

        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)

        try:
            with open(file_path, 'wb') as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            return {
                'code': 1,
                'msg': f'文件保存失败: {str(e)}',
                'data': None
            }

        file_size = os.path.getsize(file_path)
        file_url = f'/static/uploads/{unique_filename}'

        return self.emoji_business.create(
            url=file_url,
            category_id=category_id or 0,
            user_id=user_id,
            title=title or '',
            description=description or '',
            thumb_url=file_url,
            tags=tag_list,
            width=0,
            height=0,
            file_size=file_size,
            file_type=file.content_type or ''
        )

    def ActionBqEmojiUpdatePost(self, request: Request, body: UpdateEmojiRequest,
                                 emoji_id: int = Query(..., description="表情包ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        更新表情包接口
        POST /api/bq/emoji/update
        更新表情包信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.description is not None:
            data['description'] = body.description
        if body.category_id is not None:
            data['category_id'] = body.category_id
        if body.status is not None:
            data['status'] = body.status

        return self.emoji_business.update(
            emoji_id=emoji_id,
            data=data,
            tags=body.tags
        )

    def ActionBqEmojiDeletePost(self, request: Request, emoji_id: int = Query(..., description="表情包ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        删除表情包接口
        POST /api/bq/emoji/delete
        删除指定表情包
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.emoji_business.delete(emoji_id)

    def ActionBqEmojiDetailGet(self, request: Request, emoji_id: int = Query(..., description="表情包ID"),
                                authorization: Optional[str] = Header(None)):
        """
        获取表情包详情接口
        GET /api/bq/emoji/detail/get
        根据ID获取表情包详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0

        return self.emoji_business.get_by_id(
            emoji_id=emoji_id,
            user_id=user_id,
            increment_view=True
        )

    def ActionBqEmojiListGet(self, request: Request, page: int = Query(1, description="页码"),
                             page_size: int = Query(20, description="每页数量"),
                             category_id: Optional[int] = Query(None, description="分类ID"),
                             sort_by: Optional[str] = Query('latest', description="排序方式"),
                             authorization: Optional[str] = Header(None)):
        """
        获取表情包列表接口
        GET /api/bq/emoji/list/get
        分页获取表情包列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0

        return self.emoji_business.get_list(
            page=page,
            page_size=page_size,
            category_id=category_id,
            sort_by=sort_by,
            user_id=user_id
        )

    def ActionBqEmojiHotListGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(20, description="每页数量"),
                                 category_id: Optional[int] = Query(None, description="分类ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取热门表情包列表接口
        GET /api/bq/emoji/hot/list/get
        分页获取热门表情包列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0

        return self.emoji_business.get_hot_list(
            page=page,
            page_size=page_size,
            category_id=category_id,
            user_id=user_id
        )

    def ActionBqEmojiLatestListGet(self, request: Request, page: int = Query(1, description="页码"),
                                    page_size: int = Query(20, description="每页数量"),
                                    category_id: Optional[int] = Query(None, description="分类ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取最新表情包列表接口
        GET /api/bq/emoji/latest/list/get
        分页获取最新表情包列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0

        return self.emoji_business.get_latest_list(
            page=page,
            page_size=page_size,
            category_id=category_id,
            user_id=user_id
        )

    def ActionBqEmojiRecommendListGet(self, request: Request, page: int = Query(1, description="页码"),
                                       page_size: int = Query(20, description="每页数量"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取推荐表情包列表接口
        GET /api/bq/emoji/recommend/list/get
        分页获取推荐表情包列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0

        return self.emoji_business.get_recommend_list(
            page=page,
            page_size=page_size,
            user_id=user_id
        )

    def ActionBqEmojiRandomListGet(self, request: Request, limit: int = Query(10, description="数量"),
                                    category_id: Optional[int] = Query(None, description="分类ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取随机表情包列表接口
        GET /api/bq/emoji/random/list/get
        获取随机推荐的表情包
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0

        return self.emoji_business.get_random_list(
            limit=limit,
            category_id=category_id,
            user_id=user_id
        )

    def ActionBqEmojiSearchGet(self, request: Request, keyword: str = Query(..., description="搜索关键词"),
                                page: int = Query(1, description="页码"),
                                page_size: int = Query(20, description="每页数量"),
                                sort_by: Optional[str] = Query('latest', description="排序方式"),
                                category_id: Optional[int] = Query(None, description="分类ID"),
                                authorization: Optional[str] = Header(None)):
        """
        搜索表情包接口
        GET /api/bq/emoji/search/get
        根据关键词搜索表情包
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0
        search_user_id = user_id

        return self.emoji_business.search(
            keyword=keyword,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            category_id=category_id,
            user_id=user_id,
            search_user_id=search_user_id
        )

    def ActionBqEmojiMyUploadsGet(self, request: Request, page: int = Query(1, description="页码"),
                                   page_size: int = Query(20, description="每页数量"),
                                   status: Optional[int] = Query(None, description="状态"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取我的上传接口
        GET /api/bq/emoji/my/uploads/get
        获取当前用户上传的表情包
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.emoji_business.get_user_uploads(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionBqEmojiFavoriteTogglePost(self, request: Request, emoji_id: int = Query(..., description="表情包ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        切换收藏状态接口
        POST /api/bq/emoji/favorite/toggle
        收藏或取消收藏表情包
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.emoji_business.toggle_favorite(
            user_id=user.get('id'),
            emoji_id=emoji_id
        )

    def ActionBqEmojiFavoritesGet(self, request: Request, page: int = Query(1, description="页码"),
                                   page_size: int = Query(20, description="每页数量"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取我的收藏接口
        GET /api/bq/emoji/favorites/get
        获取当前用户收藏的表情包
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.emoji_business.get_favorites(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionBqEmojiReviewAddPost(self, request: Request, body: AddReviewRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        添加评论接口
        POST /api/bq/emoji/review/add
        对表情包发表评论
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.emoji_business.add_review(
            user_id=user.get('id'),
            emoji_id=body.emoji_id,
            content=body.content,
            rating=body.rating
        )

    def ActionBqEmojiReviewsGet(self, request: Request, emoji_id: int = Query(..., description="表情包ID"),
                                 page: int = Query(1, description="页码"),
                                 page_size: int = Query(20, description="每页数量")):
        """
        获取评论列表接口
        GET /api/bq/emoji/reviews/get
        获取表情包的评论列表
        """
        return self.emoji_business.get_reviews(
            emoji_id=emoji_id,
            page=page,
            page_size=page_size
        )

    def ActionBqEmojiDownloadRecordPost(self, request: Request, emoji_id: int = Query(..., description="表情包ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        记录下载接口
        POST /api/bq/emoji/download/record
        记录表情包下载
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0

        client_ip = request.client.host if request.client else ''
        user_agent = request.headers.get('user-agent', '')

        return self.emoji_business.record_download(
            user_id=user_id,
            emoji_id=emoji_id,
            ip=client_ip,
            user_agent=user_agent
        )

    def ActionBqEmojiDownloadsGet(self, request: Request, page: int = Query(1, description="页码"),
                                   page_size: int = Query(20, description="每页数量"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取我的下载记录接口
        GET /api/bq/emoji/downloads/get
        获取当前用户的下载记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.emoji_business.get_downloads(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionBqEmojiHotTagsGet(self, request: Request, limit: int = Query(20, description="数量")):
        """
        获取热门标签接口
        GET /api/bq/emoji/hot/tags/get
        获取热门标签列表
        """
        return self.emoji_business.get_hot_tags(limit)

    def ActionBqEmojiHotKeywordsGet(self, request: Request, limit: int = Query(10, description="数量")):
        """
        获取热门搜索关键词接口
        GET /api/bq/emoji/hot/keywords/get
        获取热门搜索关键词
        """
        return self.emoji_business.get_hot_keywords(limit)

    def ActionBqEmojiSearchHistoryGet(self, request: Request, limit: int = Query(20, description="数量"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取搜索历史接口
        GET /api/bq/emoji/search/history/get
        获取当前用户的搜索历史
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.emoji_business.get_search_history(
            user_id=user.get('id'),
            limit=limit
        )

    def ActionBqEmojiSearchHistoryClearPost(self, request: Request,
                                             authorization: Optional[str] = Header(None)):
        """
        清空搜索历史接口
        POST /api/bq/emoji/search/history/clear
        清空当前用户的搜索历史
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.emoji_business.clear_search_history(user.get('id'))

    def ActionBqEmojiPendingListGet(self, request: Request, page: int = Query(1, description="页码"),
                                     page_size: int = Query(20, description="每页数量"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取待审核表情包列表接口（管理员）
        GET /api/bq/emoji/pending/list/get
        获取待审核的表情包列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.emoji_business.get_pending_list(
            page=page,
            page_size=page_size
        )

    def ActionBqEmojiStatusUpdatePost(self, request: Request, emoji_id: int = Query(..., description="表情包ID"),
                                       status: int = Query(..., description="状态"),
                                       authorization: Optional[str] = Header(None)):
        """
        更新表情包状态接口（管理员）
        POST /api/bq/emoji/status/update
        审核表情包
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user or user.get('role') != 1:
            return {
                'code': 1,
                'msg': '无权限访问',
                'data': None
            }

        return self.emoji_business.update_status(emoji_id, status)
