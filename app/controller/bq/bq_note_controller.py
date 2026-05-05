from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateNoteRequest(BaseModel):
    title: Optional[str] = Field('', description="标题")
    content: Optional[str] = Field('', description="内容")
    color: Optional[str] = Field(None, description="背景色")
    category: Optional[str] = Field('', description="分类")
    tags: Optional[List[str]] = Field([], description="标签数组")
    is_pinned: Optional[bool] = Field(False, description="是否置顶")
    is_completed: Optional[bool] = Field(False, description="是否完成")
    remind_at: Optional[str] = Field(None, description="提醒时间")


class UpdateNoteRequest(BaseModel):
    title: Optional[str] = Field(None, description="标题")
    content: Optional[str] = Field(None, description="内容")
    color: Optional[str] = Field(None, description="背景色")
    category: Optional[str] = Field(None, description="分类")
    tags: Optional[List[str]] = Field(None, description="标签数组")
    is_pinned: Optional[bool] = Field(None, description="是否置顶")
    is_completed: Optional[bool] = Field(None, description="是否完成")
    remind_at: Optional[str] = Field(None, description="提醒时间")


class TogglePinRequest(BaseModel):
    is_pinned: bool = Field(..., description="是否置顶")


class ToggleCompleteRequest(BaseModel):
    is_completed: bool = Field(..., description="是否完成")


class ImportRequest(BaseModel):
    notes: List[dict] = Field(..., description="便签数据")


class BqNoteController:
    def __init__(self):
        from app.business.bq.note_business import BqNoteBusiness
        self.note_business = BqNoteBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.bq.user_business import BqUserBusiness
        user_business = BqUserBusiness()
        return user_business.verify_token(token)

    def ActionBqNoteCreatePost(self, request: Request, body: CreateNoteRequest,
                                authorization: Optional[str] = Header(None)):
        """
        创建便签接口
        POST /api/bq/note/create
        创建新便签
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.note_business.create(
            user_id=user.get('id'),
            title=body.title or '',
            content=body.content or '',
            color=body.color,
            category=body.category or '',
            tags=body.tags or [],
            is_pinned=body.is_pinned or False,
            is_completed=body.is_completed or False,
            remind_at=body.remind_at
        )

    def ActionBqNoteDetailGet(self, request: Request, note_id: int = Query(..., description="便签ID"),
                               authorization: Optional[str] = Header(None)):
        """
        获取便签详情接口
        GET /api/bq/note/detail/get
        根据ID获取便签详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.note_business.get_by_id(user.get('id'), note_id)

    def ActionBqNoteUpdatePost(self, request: Request, note_id: int = Query(..., description="便签ID"),
                                body: UpdateNoteRequest = None,
                                authorization: Optional[str] = Header(None)):
        """
        更新便签接口
        POST /api/bq/note/update
        更新便签内容
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
        if body.content is not None:
            data['content'] = body.content
        if body.color is not None:
            data['color'] = body.color
        if body.category is not None:
            data['category'] = body.category
        if body.tags is not None:
            data['tags'] = body.tags
        if body.is_pinned is not None:
            data['is_pinned'] = body.is_pinned
        if body.is_completed is not None:
            data['is_completed'] = body.is_completed
        if body.remind_at is not None:
            data['remind_at'] = body.remind_at

        return self.note_business.update(user.get('id'), note_id, data)

    def ActionBqNoteDeletePost(self, request: Request, note_id: int = Query(..., description="便签ID"),
                                authorization: Optional[str] = Header(None)):
        """
        删除便签接口（软删除）
        POST /api/bq/note/delete
        将便签移到回收站
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.note_business.soft_delete(user.get('id'), note_id)

    def ActionBqNoteRestorePost(self, request: Request, note_id: int = Query(..., description="便签ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        恢复便签接口
        POST /api/bq/note/restore
        从回收站恢复便签
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.note_business.restore(user.get('id'), note_id)

    def ActionBqNoteDeletePermanentPost(self, request: Request, note_id: int = Query(..., description="便签ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        永久删除便签接口
        POST /api/bq/note/delete/permanent
        永久删除便签，不可恢复
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.note_business.delete_permanently(user.get('id'), note_id)

    def ActionBqNotePinPost(self, request: Request, note_id: int = Query(..., description="便签ID"),
                             body: TogglePinRequest = None,
                             authorization: Optional[str] = Header(None)):
        """
        置顶便签接口
        POST /api/bq/note/pin
        切换便签置顶状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.note_business.toggle_pin(
            user_id=user.get('id'),
            note_id=note_id,
            is_pinned=body.is_pinned
        )

    def ActionBqNoteCompletePost(self, request: Request, note_id: int = Query(..., description="便签ID"),
                                  body: ToggleCompleteRequest = None,
                                  authorization: Optional[str] = Header(None)):
        """
        完成便签接口
        POST /api/bq/note/complete
        切换便签完成状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.note_business.toggle_complete(
            user_id=user.get('id'),
            note_id=note_id,
            is_completed=body.is_completed
        )

    def ActionBqNoteListGet(self, request: Request,
                             page: int = Query(1, description="页码"),
                             page_size: int = Query(20, description="每页数量"),
                             status: str = Query('normal', description="状态: normal/deleted"),
                             category: str = Query(None, description="分类"),
                             is_pinned: bool = Query(None, description="是否置顶"),
                             keyword: str = Query(None, description="搜索关键词"),
                             tags: str = Query(None, description="标签,逗号分隔"),
                             authorization: Optional[str] = Header(None)):
        """
        获取便签列表接口
        GET /api/bq/note/list
        分页获取便签列表，支持筛选和搜索
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        tag_list = None
        if tags:
            tag_list = [t.strip() for t in tags.split(',') if t.strip()]

        return self.note_business.get_list(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status,
            category=category,
            is_pinned=is_pinned,
            keyword=keyword,
            tags=tag_list
        )

    def ActionBqNoteStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取便签统计接口
        GET /api/bq/note/statistics
        获取用户便签统计信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.note_business.get_statistics(user.get('id'))

    def ActionBqNoteColorsGet(self, request: Request):
        """
        获取颜色选项接口
        GET /api/bq/note/colors
        获取便签可选颜色列表
        """
        return self.note_business.get_color_options()

    def ActionBqNoteCategoriesGet(self, request: Request):
        """
        获取分类选项接口
        GET /api/bq/note/categories
        获取便签可选分类列表
        """
        return self.note_business.get_categories()

    def ActionBqNoteExportJsonGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        导出JSON接口
        GET /api/bq/note/export/json
        导出所有便签为JSON格式
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.note_business.export_json(user.get('id'))

    def ActionBqNoteExportMarkdownGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        导出Markdown接口
        GET /api/bq/note/export/markdown
        导出所有便签为Markdown格式
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.note_business.export_markdown(user.get('id'))

    def ActionBqNoteImportPost(self, request: Request, body: ImportRequest,
                                authorization: Optional[str] = Header(None)):
        """
        导入便签接口
        POST /api/bq/note/import
        从JSON导入便签
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.note_business.import_notes(user.get('id'), {'notes': body.notes})

    def ActionBqNoteTrashRestoreAllPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        批量恢复便签接口
        POST /api/bq/note/trash/restore/all
        恢复回收站所有便签
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.note_business.batch_restore(user.get('id'))

    def ActionBqNoteTrashEmptyPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        清空回收站接口
        POST /api/bq/note/trash/empty
        永久删除回收站所有便签
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.note_business.empty_trash(user.get('id'))
