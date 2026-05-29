from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from ..db.database import Base


class Favorite(Base):
    __tablename__ = "tb_dianying_model_favorite"
    __table_args__ = (UniqueConstraint('user_id', 'movie_id', name='_user_movie_favorite_uc'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("tb_dianying_model_user.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("tb_dianying_model_movie.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
