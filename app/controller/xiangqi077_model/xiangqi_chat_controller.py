from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class SendMessageRequest(BaseModel):
    content: str = Field(..., description="消息内容")
    game_id: Optional[int] = Field(None, description="对局ID（对局聊天时传）")


class XiangqiChatController:
    def __init__(self):
        from app.business.xiangqi077_model.chat_business import XiangqiChatBusiness
        self.chat_business = XiangqiChatBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.xiangqi077_model.user_business import XiangqiUserBusiness
        return XiangqiUserBusiness().verify_token(token)

    def ActionXiangqiChatSendPost(self, request: Request, body: SendMessageRequest,
                                   authorization: Optional[str] = Header(None)):
        """发送聊天消息"""
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        if body.game_id:
            return self.chat_business.send_game_message(
                user_id=user.get('id'),
                username=user.get('username', ''),
                nickname=user.get('nickname', ''),
                content=body.content,
                game_id=body.game_id
            )
        else:
            return self.chat_business.send_hall_message(
                user_id=user.get('id'),
                username=user.get('username', ''),
                nickname=user.get('nickname', ''),
                content=body.content
            )

    def ActionXiangqiChatGameMessagesGet(self, request: Request, game_id: int,
                                          limit: int = Query(50, ge=1, le=200)):
        """获取对局聊天记录"""
        return self.chat_business.get_game_messages(game_id=game_id, limit=limit)

    def ActionXiangqiChatHallMessagesGet(self, request: Request,
                                          limit: int = Query(50, ge=1, le=200)):
        """获取大厅聊天记录"""
        return self.chat_business.get_hall_messages(limit=limit)

    def ActionXiangqiChatAllMessagesGet(self, request: Request,
                                         page: int = Query(1, ge=1),
                                         page_size: int = Query(10, ge=1, le=100),
                                         chat_type: Optional[int] = Query(None),
                                         game_id: Optional[int] = Query(None),
                                         authorization: Optional[str] = Header(None)):
        """管理员获取所有聊天记录"""
        token = self._get_token_from_header(request, authorization)
        from app.business.xiangqi077_model.admin_business import XiangqiAdminBusiness
        admin = XiangqiAdminBusiness().verify_token(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.chat_business.get_all_messages(
            page=page, page_size=page_size, chat_type=chat_type, game_id=game_id
        )
