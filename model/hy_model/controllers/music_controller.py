from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import MusicCreate, MusicUpdate, ResponseModel, MusicResponse, PaginatedResponse
from services import MusicService
from services.auth_service import get_current_user
from models import User

router = APIRouter(prefix="/music", tags=["音乐"])


@router.get("/", response_model=PaginatedResponse[MusicResponse])
def read_musics(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    musics = MusicService.get_musics(db, skip=skip, limit=limit)
    return PaginatedResponse(
        code=200, 
        message="获取成功", 
        data=[MusicResponse.from_orm(m) for m in musics],
        total=len(musics),
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/mood/{mood}", response_model=ResponseModel)
def read_musics_by_mood(
    mood: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    musics = MusicService.get_musics_by_mood(db, mood=mood)
    return ResponseModel(
        code=200, 
        message="获取成功", 
        data=[MusicResponse.from_orm(m) for m in musics]
    )


@router.get("/genre/{genre}", response_model=ResponseModel)
def read_musics_by_genre(
    genre: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    musics = MusicService.get_musics_by_genre(db, genre=genre)
    return ResponseModel(
        code=200, 
        message="获取成功", 
        data=[MusicResponse.from_orm(m) for m in musics]
    )


@router.get("/unlocked", response_model=ResponseModel)
def read_unlocked_musics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    musics = MusicService.get_musics_by_level(db, level=current_user.level)
    return ResponseModel(
        code=200, 
        message="获取成功", 
        data=[MusicResponse.from_orm(m) for m in musics]
    )


@router.get("/{music_id}", response_model=ResponseModel)
def read_music(
    music_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_music = MusicService.get_music(db, music_id=music_id)
    if db_music is None:
        raise HTTPException(status_code=404, detail="音乐不存在")
    return ResponseModel(code=200, message="获取成功", data=MusicResponse.from_orm(db_music))


@router.post("/", response_model=ResponseModel)
def create_music(
    music: MusicCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_music = MusicService.create_music(db=db, music=music)
    return ResponseModel(code=200, message="创建成功", data=MusicResponse.from_orm(db_music))


@router.put("/{music_id}", response_model=ResponseModel)
def update_music(
    music_id: int, 
    music: MusicUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_music = MusicService.update_music(db, music_id=music_id, music=music)
    if db_music is None:
        raise HTTPException(status_code=404, detail="音乐不存在")
    return ResponseModel(code=200, message="更新成功", data=MusicResponse.from_orm(db_music))


@router.delete("/{music_id}", response_model=ResponseModel)
def delete_music(
    music_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = MusicService.delete_music(db, music_id=music_id)
    if not success:
        raise HTTPException(status_code=404, detail="音乐不存在")
    return ResponseModel(code=200, message="删除成功", data=None)
