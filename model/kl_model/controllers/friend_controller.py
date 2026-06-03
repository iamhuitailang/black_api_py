from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.kl_model.database.db import get_db
from model.kl_model.core.response import success_response, error_response
from model.kl_model.core.security import get_current_user
from model.kl_model.schemas.friend import FriendInviteCreate, FriendInviteAccept, FriendInteractionRequest
from model.kl_model.business.friend_business import FriendBusiness
from model.kl_model.business.user_business import UserBusiness
from model.kl_model.models import User

router = APIRouter(prefix="/friends", tags=["friends"])


@router.get("")
def read_my_friends(
    status: str = "accepted",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    friends = FriendBusiness.get_friends(db, user_id=current_user.id, status=status)
    return success_response(data=friends)


@router.get("/requests")
def read_friend_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = FriendBusiness.get_friend_requests(db, user_id=current_user.id)
    return success_response(data=requests)


@router.post("/request/{friend_id}")
def send_friend_request(
    friend_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    friend = FriendBusiness.send_friend_request(db, friend_id=friend_id, user_id=current_user.id)
    if not friend:
        return error_response(code=400, message="无法发送好友请求")
    return success_response(data=friend, message="好友请求已发送")


@router.post("/accept/{friend_id}")
def accept_friend_request(
    friend_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    friend = FriendBusiness.accept_friend_request(db, friend_id=friend_id, user_id=current_user.id)
    if not friend:
        return error_response(code=400, message="无法接受好友请求")
    return success_response(data=friend, message="已添加好友")


@router.post("/reject/{friend_id}")
def reject_friend_request(
    friend_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = FriendBusiness.reject_friend_request(db, friend_id=friend_id, user_id=current_user.id)
    if not success:
        return error_response(code=400, message="无法拒绝好友请求")
    return success_response(message="已拒绝好友请求")


@router.delete("/{friend_id}")
def remove_friend(
    friend_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = FriendBusiness.remove_friend(db, friend_id=friend_id, user_id=current_user.id)
    if not success:
        return error_response(code=404, message="好友不存在")
    return success_response(message="已删除好友")


@router.post("/invite")
def create_invite(
    invite_data: FriendInviteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invite = FriendBusiness.create_invite(db, invite_data=invite_data, user_id=current_user.id)
    return success_response(data=invite, message="邀请链接已生成")


@router.get("/invites")
def read_my_invites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invites = FriendBusiness.get_invites(db, user_id=current_user.id)
    return success_response(data=invites)


@router.post("/invite/accept")
def accept_invite(
    request: FriendInviteAccept,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    invite = FriendBusiness.accept_invite(db, invite_code=request.invite_code, user_id=current_user.id)
    if not invite:
        return error_response(code=400, message="邀请码无效或已过期")
    UserBusiness.add_experience(db, current_user.id, 100)
    return success_response(data=invite, message="邀请已接受，成为好友！")


@router.post("/interact")
def interact_friend(
    request: FriendInteractionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    friend, exp_gain = FriendBusiness.interact_friend(
        db, 
        friend_id=request.friend_id, 
        user_id=current_user.id, 
        interaction_type=request.interaction_type
    )
    if not friend:
        return error_response(code=400, message="无法互动")
    UserBusiness.add_experience(db, current_user.id, exp_gain)
    return success_response(data={"friendship": friend, "exp_gain": exp_gain}, message="互动成功！")
