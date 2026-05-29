from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AddPhotoRequest(BaseModel):
    activity_id: int = Field(..., description="活动ID")
    url: str = Field(..., description="图片URL")
    description: Optional[str] = Field('', description="描述")
    sort_order: Optional[int] = Field(0, description="排序")


class HuodongPhotoController:
    def __init__(self):
        from app.business.huodong.photo_business import PhotoBusiness
        from app.business.huodong.user_business import HuodongUserBusiness
        self.photo_business = PhotoBusiness()
        self.user_business = HuodongUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionHuodongPhotoAddPost(self, request: Request, body: AddPhotoRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        上传活动照片
        POST /api/huodong/photo/add
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.photo_business.add_photo(
            user_id=user.get('id'),
            activity_id=body.activity_id,
            url=body.url,
            description=body.description or '',
            sort_order=body.sort_order or 0
        )

    def ActionHuodongPhotoListGet(self, request: Request,
                                    activity_id: int = Query(..., description="活动ID")):
        """
        获取活动照片列表
        GET /api/huodong/photo/list/get
        """
        return self.photo_business.get_activity_photos(activity_id)

    def ActionHuodongPhotoDeletePost(self, request: Request,
                                       photo_id: int = Query(..., description="照片ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        删除活动照片
        POST /api/huodong/photo/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.photo_business.delete_photo(user.get('id'), photo_id)
