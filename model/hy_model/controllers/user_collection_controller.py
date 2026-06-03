from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import UserCollectionCreate, ResponseModel, UserCollectionResponse, PaginatedResponse
from services import UserCollectionService
from services.auth_service import get_current_user
from models import User

router = APIRouter(prefix="/collections", tags=["收藏"])


@router.get("/", response_model=PaginatedResponse[UserCollectionResponse])
def read_user_collections(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    collections = UserCollectionService.get_user_collections(
        db, 
        user_id=current_user.id, 
        skip=skip, 
        limit=limit
    )
    return PaginatedResponse(
        code=200, 
        message="获取成功", 
        data=[UserCollectionResponse.from_orm(c) for c in collections],
        total=len(collections),
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/type/{item_type}", response_model=ResponseModel)
def read_user_collections_by_type(
    item_type: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    collections = UserCollectionService.get_user_collections_by_type(
        db, 
        user_id=current_user.id, 
        item_type=item_type
    )
    return ResponseModel(
        code=200, 
        message="获取成功", 
        data=[UserCollectionResponse.from_orm(c) for c in collections]
    )


@router.get("/{collection_id}", response_model=ResponseModel)
def read_user_collection(
    collection_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_collection = UserCollectionService.get_user_collection(db, collection_id=collection_id)
    if db_collection is None:
        raise HTTPException(status_code=404, detail="收藏不存在")
    if db_collection.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权限查看他人收藏")
    return ResponseModel(code=200, message="获取成功", data=UserCollectionResponse.from_orm(db_collection))


@router.post("/", response_model=ResponseModel)
def create_user_collection(
    collection: UserCollectionCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if collection.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权限为他人创建收藏")
    db_collection = UserCollectionService.create_user_collection(db=db, collection=collection)
    return ResponseModel(code=200, message="创建成功", data=UserCollectionResponse.from_orm(db_collection))


@router.delete("/{collection_id}", response_model=ResponseModel)
def delete_user_collection(
    collection_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_collection = UserCollectionService.get_user_collection(db, collection_id=collection_id)
    if db_collection is None:
        raise HTTPException(status_code=404, detail="收藏不存在")
    if db_collection.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权限删除他人收藏")
    success = UserCollectionService.delete_user_collection(db, collection_id=collection_id)
    if not success:
        raise HTTPException(status_code=404, detail="收藏不存在")
    return ResponseModel(code=200, message="删除成功", data=None)
