from typing import List, Optional
from sqlalchemy.orm import Session
from model.kl_model.models import Share, ShareInteraction, User
from model.kl_model.schemas.share import ShareCreate, ShareUpdate, ShareInteractionCreate


class ShareBusiness:
    @staticmethod
    def get_share(db: Session, share_id: int) -> Optional[Share]:
        return db.query(Share).filter(Share.id == share_id).first()

    @staticmethod
    def get_shares_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Share]:
        return db.query(Share).filter(Share.user_id == user_id).order_by(Share.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_public_shares(db: Session, skip: int = 0, limit: int = 100) -> List[Share]:
        return db.query(Share).filter(Share.visibility == "public").order_by(Share.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create_share(db: Session, share: ShareCreate, user_id: int) -> Share:
        db_share = Share(
            user_id=user_id,
            share_type=share.share_type,
            title=share.title,
            content=share.content,
            related_id=share.related_id,
            related_type=share.related_type,
            visibility=share.visibility
        )
        db.add(db_share)
        db.commit()
        db.refresh(db_share)
        return db_share

    @staticmethod
    def update_share(db: Session, share_id: int, share_update: ShareUpdate, user_id: int) -> Optional[Share]:
        db_share = ShareBusiness.get_share(db, share_id)
        if not db_share or db_share.user_id != user_id:
            return None
        update_data = share_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_share, key, value)
        db.commit()
        db.refresh(db_share)
        return db_share

    @staticmethod
    def delete_share(db: Session, share_id: int, user_id: int) -> bool:
        db_share = ShareBusiness.get_share(db, share_id)
        if not db_share or db_share.user_id != user_id:
            return False
        db.delete(db_share)
        db.commit()
        return True

    @staticmethod
    def add_interaction(db: Session, interaction: ShareInteractionCreate, user_id: int) -> tuple[Optional[ShareInteraction], int]:
        share = ShareBusiness.get_share(db, interaction.share_id)
        if not share:
            return None, 0
        
        if interaction.interaction_type == "like":
            share.likes += 1
            exp_gain = 5
        elif interaction.interaction_type == "comment":
            share.comments += 1
            exp_gain = 10
        elif interaction.interaction_type == "share":
            share.shares += 1
            exp_gain = 15
        else:
            exp_gain = 0
        
        db_interaction = ShareInteraction(
            share_id=interaction.share_id,
            user_id=user_id,
            interaction_type=interaction.interaction_type,
            comment=interaction.comment
        )
        db.add(db_interaction)
        db.commit()
        db.refresh(db_interaction)
        db.refresh(share)
        
        return db_interaction, exp_gain

    @staticmethod
    def get_share_interactions(db: Session, share_id: int) -> List[ShareInteraction]:
        return db.query(ShareInteraction).filter(ShareInteraction.share_id == share_id).order_by(ShareInteraction.created_at.desc()).all()
