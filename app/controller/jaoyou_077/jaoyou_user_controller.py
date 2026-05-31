from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")
    gender: Optional[int] = Field(1, description="性别 1-男 2-女")


class LoginRequest(BaseModel):
    phone: str = Field(..., description="手机号")
    password: str = Field(..., description="密码")


class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")
    gender: Optional[int] = Field(None, description="性别")
    age: Optional[int] = Field(None, description="年龄")
    height: Optional[int] = Field(None, description="身高(cm)")
    weight: Optional[int] = Field(None, description="体重(kg)")
    education: Optional[str] = Field(None, description="学历")
    occupation: Optional[str] = Field(None, description="职业")
    income: Optional[str] = Field(None, description="收入")
    city: Optional[str] = Field(None, description="城市")
    district: Optional[str] = Field(None, description="区域")
    introduction: Optional[str] = Field(None, description="自我介绍")
    interest: Optional[str] = Field(None, description="兴趣爱好")


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class SendHeartRequest(BaseModel):
    to_user_id: int = Field(..., description="对方用户ID")


class RespondHeartRequest(BaseModel):
    heart_id: int = Field(..., description="心动记录ID")
    accepted: bool = Field(..., description="是否接受")


class SendDateRequest(BaseModel):
    to_user_id: int = Field(..., description="对方用户ID")
    title: str = Field(..., description="约会标题")
    description: Optional[str] = Field('', description="约会描述")
    location: Optional[str] = Field('', description="约会地点")
    date_time: str = Field(..., description="约会时间")


class RespondDateRequest(BaseModel):
    date_id: int = Field(..., description="约会记录ID")
    accepted: bool = Field(..., description="是否接受")


class CreateComplaintRequest(BaseModel):
    to_user_id: int = Field(..., description="被投诉用户ID")
    reason: str = Field(..., description="投诉原因")
    description: Optional[str] = Field('', description="投诉详情")


class JaoyouUserController:
    def __init__(self):
        from app.business.jaoyou_077.user_business import JaoyouUserBusiness
        from app.business.jaoyou_077.heart_business import JaoyouHeartBusiness
        from app.business.jaoyou_077.match_business import JaoyouMatchBusiness
        from app.business.jaoyou_077.date_business import JaoyouDateBusiness
        from app.business.jaoyou_077.message_business import JaoyouMessageBusiness
        from app.business.jaoyou_077.complaint_business import JaoyouComplaintBusiness
        self.user_business = JaoyouUserBusiness()
        self.heart_business = JaoyouHeartBusiness()
        self.match_business = JaoyouMatchBusiness()
        self.date_business = JaoyouDateBusiness()
        self.message_business = JaoyouMessageBusiness()
        self.complaint_business = JaoyouComplaintBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionJaoyouUserRegisterPost(self, request: Request, body: RegisterRequest):
        return self.user_business.register(
            phone=body.phone,
            password=body.password,
            nickname=body.nickname or '',
            gender=body.gender or 1
        )

    def ActionJaoyouUserLoginPost(self, request: Request, body: LoginRequest):
        return self.user_business.login(
            phone=body.phone,
            password=body.password
        )

    def ActionJaoyouUserLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        return self.user_business.logout(token)

    def ActionJaoyouUserCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_by_id(user.get('id'))

    def ActionJaoyouUserProfileUpdatePost(self, request: Request, body: UpdateProfileRequest,
                                          authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        for field in ['nickname', 'avatar', 'gender', 'age', 'height', 'weight',
                      'education', 'occupation', 'income', 'city', 'district',
                      'introduction', 'interest']:
            if getattr(body, field) is not None:
                data[field] = getattr(body, field)

        return self.user_business.update_profile(
            user_id=user.get('id'),
            data=data
        )

    def ActionJaoyouUserPasswordChangePost(self, request: Request, body: ChangePasswordRequest,
                                            authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.change_password(
            user_id=user.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionJaoyouUserListGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(10, description="每页数量"),
                                 city: Optional[str] = Query(None, description="城市"),
                                 keyword: Optional[str] = Query(None, description="关键词"),
                                 authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_opposite_gender_users(
            current_user_id=user.get('id'),
            page=page,
            page_size=page_size,
            city=city,
            keyword=keyword
        )

    def ActionJaoyouUserDetailGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_by_id(user_id)

    def ActionJaoyouHeartSendPost(self, request: Request, body: SendHeartRequest,
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.heart_business.send_heart(
            from_user_id=user.get('id'),
            to_user_id=body.to_user_id
        )

    def ActionJaoyouHeartRespondPost(self, request: Request, body: RespondHeartRequest,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.heart_business.respond_heart(
            heart_id=body.heart_id,
            user_id=user.get('id'),
            accepted=body.accepted
        )

    def ActionJaoyouHeartSentGet(self, request: Request, page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.heart_business.get_sent_hearts(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionJaoyouHeartReceivedGet(self, request: Request, page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.heart_business.get_received_hearts(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionJaoyouMatchListGet(self, request: Request, page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.match_business.get_user_matches(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionJaoyouMatchCancelPost(self, request: Request, match_id: int = Query(..., description="匹配ID"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.match_business.cancel_match(
            match_id=match_id,
            user_id=user.get('id')
        )

    def ActionJaoyouDateSendPost(self, request: Request, body: SendDateRequest,
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.date_business.send_date(
            from_user_id=user.get('id'),
            to_user_id=body.to_user_id,
            title=body.title,
            description=body.description or '',
            location=body.location or '',
            date_time=body.date_time
        )

    def ActionJaoyouDateRespondPost(self, request: Request, body: RespondDateRequest,
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.date_business.respond_date(
            date_id=body.date_id,
            user_id=user.get('id'),
            accepted=body.accepted
        )

    def ActionJaoyouDateCancelPost(self, request: Request, date_id: int = Query(..., description="约会ID"),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.date_business.cancel_date(
            date_id=date_id,
            user_id=user.get('id')
        )

    def ActionJaoyouDateSentGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(10, description="每页数量"),
                                 status: Optional[int] = Query(None, description="状态"),
                                 authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.date_business.get_sent_dates(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionJaoyouDateReceivedGet(self, request: Request, page: int = Query(1, description="页码"),
                                     page_size: int = Query(10, description="每页数量"),
                                     status: Optional[int] = Query(None, description="状态"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.date_business.get_received_dates(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionJaoyouMessageListGet(self, request: Request, page: int = Query(1, description="页码"),
                                    page_size: int = Query(10, description="每页数量"),
                                    status: Optional[int] = Query(None, description="状态"),
                                    msg_type: Optional[int] = Query(None, description="消息类型"),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.message_business.get_user_messages(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status,
            msg_type=msg_type
        )

    def ActionJaoyouMessageReadPost(self, request: Request, message_id: int = Query(..., description="消息ID"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.message_business.mark_as_read(
            message_id=message_id,
            user_id=user.get('id')
        )

    def ActionJaoyouMessageReadAllPost(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.message_business.mark_all_as_read(
            user_id=user.get('id')
        )

    def ActionJaoyouMessageDeletePost(self, request: Request, message_id: int = Query(..., description="消息ID"),
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.message_business.delete_message(
            message_id=message_id,
            user_id=user.get('id')
        )

    def ActionJaoyouMessageUnreadCountGet(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.message_business.get_unread_count(
            user_id=user.get('id')
        )

    def ActionJaoyouComplaintCreatePost(self, request: Request, body: CreateComplaintRequest,
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.create_complaint(
            from_user_id=user.get('id'),
            to_user_id=body.to_user_id,
            reason=body.reason,
            description=body.description or ''
        )

    def ActionJaoyouComplaintListGet(self, request: Request, page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量"),
                                      status: Optional[int] = Query(None, description="状态"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.complaint_business.get_user_complaints(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status
        )
