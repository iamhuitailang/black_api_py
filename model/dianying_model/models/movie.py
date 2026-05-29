from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from ..db.database import Base


class Movie(Base):
    __tablename__ = "tb_dianying_model_movie"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    poster = Column(String(500))
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    year = Column(Integer, index=True)
    genre = Column(String(100), index=True)
    director = Column(String(200))
    actors = Column(String(500))
    description = Column(Text)
    trailer = Column(String(500))
    duration = Column(Integer)
    country = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
