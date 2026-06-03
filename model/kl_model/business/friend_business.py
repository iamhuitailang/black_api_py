import uuid
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from model.kl_model.models import Friend, FriendInvite, User
from model.kl_model.schemas.friend import FriendCreate, FriendUpdate, FriendInviteCreate


class FriendBusiness:
    @staticmethod
    def get_friend(db: Session, friend_id: int, user_id: int) -> Optional[Friend]:
        return db.query(Friend).filter(
            Friend.user_id == user_id,
            Friend.friend_id == friend_id
        ).first()

    @staticmethod
    def get_friends(db: Session, user_id: int, status: str = "accepted") -> List[Friend]:
        return db.query(Friend).filter(
            Friend.user_id == user_id,
            Friend.status == status
        ).all()

    @staticmethod
    def get_friend_requests(db: Session, user_id: int) -> List[Friend]:
        return db.query(Friend).filter(
            Friend.friend_id == user_id,
            Friend.status == "pending"
        ).all()

    @staticmethod
    def send_friend_request(db: Session, friend_id: int, user_id: int) -> Optional[Friend]:
        if user_id == friend_id:
            return None
        
        existing = db.query(Friend).filter(
            or_(
                and_(Friend.user_id == user_id, Friend.friend_id == friend_id),
                and_(Friend.user_id == friend_id, Friend.friend_id == user_id)
            )
        ).first()
        
        if existing:
            return None
        
        db_friend = Friend(
            user_id=user_id,
            friend_id=friend_id,
            status="pending"
        )
        db.add(db_friend)
        db.commit()
        db.refresh(db_friend)
        return db_friend

    @staticmethod
    def accept_friend_request(db: Session, friend_id: int, user_id: int) -> Optional[Friend]:
        db_friend = db.query(Friend).filter(
            Friend.user_id == friend_id,
            Friend.friend_id == user_id,
            Friend.status == "pending"
        ).first()
        
        if not db_friend:
            return None
        
        db_friend.status = "accepted"
        
        reverse_friend = Friend(
            user_id=user_id,
            friend_id=friend_id,
            status="accepted"
        )
        db.add(reverse_friend)
        db.commit()
        db.refresh(db_friend)
        return db_friend

    @staticmethod
    def reject_friend_request(db: Session, friend_id: int, user_id: int) -> bool:
        db_friend = db.query(Friend).filter(
            Friend.user_id == friend_id,
            Friend.friend_id == user_id,
            Friend.status == "pending"
        ).first()
        
        if not db_friend:
            return False
        
        db.delete(db_friend)
        db.commit()
        return True

    @staticmethod
    def remove_friend(db: Session, friend_id: int, user_id: int) -> bool:
        friendships = db.query(Friend).filter(
            or_(
                and_(Friend.user_id == user_id, Friend.friend_id == friend_id),
                and_(Friend.user_id == friend_id, Friend.friend_id == user_id)
            )
        ).all()
        
        if not friendships:
            return False
        
        for f in friendships:
            db.delete(f)
        db.commit()
        return True

    @staticmethod
    def create_invite(db: Session, invite_data: FriendInviteCreate, user_id: int) -> FriendInvite:
        invite_code = str(uuid.uuid4())[:8].upper()
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        db_invite = FriendInvite(
            inviter_id=user_id,
            invitee_email=invite_data.invitee_email,
            invite_code=invite_code,
            message=invite_data.message,
            expires_at=expires_at
        )
        db.add(db_invite)
        db.commit()
        db.refresh(db_invite)
        return db_invite

    @staticmethod
    def get_invites(db: Session, user_id: int) -> List[FriendInvite]:
        return db.query(FriendInvite).filter(
            FriendInvite.inviter_id == user_id
        ).all()

    @staticmethod
    def accept_invite(db: Session, invite_code: str, user_id: int) -> Optional[FriendInvite]:
        db_invite = db.query(FriendInvite).filter(
            FriendInvite.invite_code == invite_code,
            FriendInvite.is_accepted == False,
            FriendInvite.expires_at > datetime.utcnow()
        ).first()
        
        if not db_invite:
            return None
        
        db_invite.is_accepted = True
        db_invite.accepted_by = user_id
        db_invite.accepted_at = datetime.utcnow()
        
        existing = db.query(Friend).filter(
            or_(
                and_(Friend.user_id == user_id, Friend.friend_id == db_invite.inviter_id),
                and_(Friend.user_id == db_invite.inviter_id, Friend.friend_id == user_id)
            )
        ).first()
        
        if not existing:
            friendship1 = Friend(user_id=user_id, friend_id=db_invite.inviter_id, status="accepted")
            friendship2 = Friend(user_id=db_invite.inviter_id, friend_id=user_id, status="accepted")
            db.add(friendship1)
            db.add(friendship2)
        
        db.commit()
        db.refresh(db_invite)
        return db_invite

    @staticmethod
    def interact_friend(db: Session, friend_id: int, user_id: int, interaction_type: str) -> tuple[Optional[Friend], int]:
        db_friend = FriendBusiness.get_friend(db, friend_id, user_id)
        if not db_friend or db_friend.status != "accepted":
            return None, 0
        
        db_friend.interaction_count += 1
        db_friend.last_interaction = datetime.utcnow()
        
        exp_reward = 10
        if interaction_type == "gift":
            exp_reward = 50
        elif interaction_type == "visit":
            exp_reward = 20
        
        if db_friend.interaction_count % 10 == 0:
            db_friend.friendship_level = min(10, db_friend.friendship_level + 1)
        
        db.commit()
        db.refresh(db_friend)
        return db_friend, exp_reward
