from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import CreatureCreate, CreatureUpdate, ResponseModel, CreatureResponse, PaginatedResponse
from services import CreatureService, UserCollectionService
from services.auth_service import get_current_user
from models import User

router = APIRouter(prefix="/creatures", tags=["海洋生物"])


@router.get("/", response_model=PaginatedResponse[CreatureResponse])
def read_creatures(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    creatures = CreatureService.get_creatures(db, skip=skip, limit=limit)
    return PaginatedResponse(
        code=200, 
        message="获取成功", 
        data=[CreatureResponse.from_orm(c) for c in creatures],
        total=len(creatures),
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/depth/{depth}", response_model=ResponseModel)
def read_creatures_by_depth(
    depth: float, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    creatures = CreatureService.get_creatures_by_depth(db, depth=depth)
    return ResponseModel(
        code=200, 
        message="获取成功", 
        data=[CreatureResponse.from_orm(c) for c in creatures]
    )


@router.get("/dangerous", response_model=ResponseModel)
def read_dangerous_creatures(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    creatures = CreatureService.get_dangerous_creatures(db)
    return ResponseModel(
        code=200, 
        message="获取成功", 
        data=[CreatureResponse.from_orm(c) for c in creatures]
    )


@router.get("/{creature_id}", response_model=ResponseModel)
def read_creature(
    creature_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_creature = CreatureService.get_creature(db, creature_id=creature_id)
    if db_creature is None:
        raise HTTPException(status_code=404, detail="海洋生物不存在")
    return ResponseModel(code=200, message="获取成功", data=CreatureResponse.from_orm(db_creature))


@router.post("/", response_model=ResponseModel)
def create_creature(
    creature: CreatureCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_creature = CreatureService.create_creature(db=db, creature=creature)
    return ResponseModel(code=200, message="创建成功", data=CreatureResponse.from_orm(db_creature))


@router.post("/{creature_id}/collect", response_model=ResponseModel)
def collect_creature(
    creature_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_creature = CreatureService.get_creature(db, creature_id=creature_id)
    if db_creature is None:
        raise HTTPException(status_code=404, detail="海洋生物不存在")
    
    from schemas import UserCollectionCreate
    collection_data = UserCollectionCreate(
        user_id=current_user.id,
        item_type="creature",
        item_id=creature_id
    )
    collection = UserCollectionService.create_user_collection(db, collection_data)
    return ResponseModel(code=200, message="收集成功", data=collection)


@router.put("/{creature_id}", response_model=ResponseModel)
def update_creature(
    creature_id: int, 
    creature: CreatureUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_creature = CreatureService.update_creature(db, creature_id=creature_id, creature=creature)
    if db_creature is None:
        raise HTTPException(status_code=404, detail="海洋生物不存在")
    return ResponseModel(code=200, message="更新成功", data=CreatureResponse.from_orm(db_creature))


@router.delete("/{creature_id}", response_model=ResponseModel)
def delete_creature(
    creature_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = CreatureService.delete_creature(db, creature_id=creature_id)
    if not success:
        raise HTTPException(status_code=404, detail="海洋生物不存在")
    return ResponseModel(code=200, message="删除成功", data=None)
