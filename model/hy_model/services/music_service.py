from typing import List, Optional
from sqlalchemy.orm import Session
from models import Music
from schemas import MusicCreate, MusicUpdate


class MusicService:
    @staticmethod
    def get_music(db: Session, music_id: int) -> Optional[Music]:
        return db.query(Music).filter(Music.id == music_id).first()

    @staticmethod
    def get_musics(db: Session, skip: int = 0, limit: int = 100) -> List[Music]:
        return db.query(Music).offset(skip).limit(limit).all()

    @staticmethod
    def get_musics_by_mood(db: Session, mood: str) -> List[Music]:
        return db.query(Music).filter(Music.mood == mood).all()

    @staticmethod
    def get_musics_by_genre(db: Session, genre: str) -> List[Music]:
        return db.query(Music).filter(Music.genre == genre).all()

    @staticmethod
    def get_musics_by_level(db: Session, level: int) -> List[Music]:
        return db.query(Music).filter(Music.unlock_level <= level).all()

    @staticmethod
    def create_music(db: Session, music: MusicCreate) -> Music:
        db_music = Music(**music.dict())
        db.add(db_music)
        db.commit()
        db.refresh(db_music)
        return db_music

    @staticmethod
    def update_music(db: Session, music_id: int, music: MusicUpdate) -> Optional[Music]:
        db_music = MusicService.get_music(db, music_id)
        if db_music:
            update_data = music.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_music, key, value)
            db.commit()
            db.refresh(db_music)
        return db_music

    @staticmethod
    def delete_music(db: Session, music_id: int) -> bool:
        db_music = MusicService.get_music(db, music_id)
        if db_music:
            db.delete(db_music)
            db.commit()
            return True
        return False
