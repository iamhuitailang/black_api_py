from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RecordProgressRequest(BaseModel):
    comic_id: int = Field(..., description="漫画ID")
    chapter_id: Optional[int] = Field(None, description="章节ID")
    chapter_no: int = Field(0, description="章节号")
    page_no: int = Field(0, description="页码")


class ManhuaHistoryController:
    def __init__(self):
        from app.business.manhua.history_business import ManhuaHistoryBusiness
        from app.business.manhua.user_business import ManhuaUserBusiness
        self.history_business = ManhuaHistoryBusiness()
        self.user_business = ManhuaUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionManhuaHistoryRecordPost(self, request: Request, body: RecordProgressRequest,
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.history_business.record_progress(
            user.get('id'),
            body.comic_id,
            body.chapter_id,
            body.chapter_no,
            body.page_no
        )

    def ActionManhuaHistoryListGet(self, request: Request,
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(20, description="每页数量"),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.history_business.get_history_list(user.get('id'), page, page_size)

    def ActionManhuaHistoryProgressGet(self, request: Request,
                                        comic_id: int = Query(..., description="漫画ID"),
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.history_business.get_progress(user.get('id'), comic_id)

    def ActionManhuaHistoryDeletePost(self, request: Request,
                                       comic_id: Optional[int] = Query(None, description="漫画ID，不传则删除全部"),
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.history_business.delete_history(user.get('id'), comic_id)