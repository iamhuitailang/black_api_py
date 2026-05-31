from sqlalchemy.orm import Session
from model.feixingqi_model.models.rank import Rank
from model.feixingqi_model.models.user import User
from typing import List, Tuple

class RankBusiness:
    @staticmethod
    def update_rank(db: Session):
        users = db.query(User).filter(User.status == 1).order_by(User.score.desc()).all()
        for i, user in enumerate(users):
            rank_record = db.query(Rank).filter(Rank.user_id == user.id).first()
            win_rate = int((user.wins / (user.wins + user.losses) * 100)) if (user.wins + user.losses) > 0 else 0
            if rank_record:
                rank_record.username = user.username
                rank_record.nickname = user.nickname
                rank_record.avatar = user.avatar
                rank_record.score = user.score
                rank_record.wins = user.wins
                rank_record.losses = user.losses
                rank_record.win_rate = win_rate
                rank_record.rank = i + 1
            else:
                rank_record = Rank(
                    user_id=user.id,
                    username=user.username,
                    nickname=user.nickname,
                    avatar=user.avatar,
                    score=user.score,
                    wins=user.wins,
                    losses=user.losses,
                    win_rate=win_rate,
                    rank=i + 1
                )
                db.add(rank_record)
        db.commit()

    @staticmethod
    def get_rank_list(db: Session, page: int = 1, page_size: int = 20) -> Tuple[List[Rank], int]:
        RankBusiness.update_rank(db)
        query = db.query(Rank).order_by(Rank.rank)
        total = query.count()
        ranks = query.offset((page - 1) * page_size).limit(page_size).all()
        return ranks, total

    @staticmethod
    def get_user_rank(db: Session, user_id: int):
        RankBusiness.update_rank(db)
        return db.query(Rank).filter(Rank.user_id == user_id).first()

    @staticmethod
    def get_statistics(db: Session) -> dict:
        total_users = db.query(User).count()
        total_games = db.query(Rank).with_entities(Rank.wins).all()
        total_games_count = sum([w[0] for w in total_games])
        avg_win_rate = db.query(Rank).with_entities(Rank.win_rate).all()
        avg_win_rate_val = int(sum([w[0] for w in avg_win_rate]) / len(avg_win_rate)) if avg_win_rate else 0
        
        return {
            "total_users": total_users,
            "total_games": total_games_count,
            "avg_win_rate": avg_win_rate_val,
            "top_score": db.query(Rank).order_by(Rank.score.desc()).first().score if db.query(Rank).first() else 0
        }
