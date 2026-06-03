from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import TreasureCreate, TreasureUpdate, ResponseModel, TreasureResponse, PaginatedResponse
from services import TreasureService, UserCollectionService
from services.auth_service import get_current_user
from models import User

router = APIRouter(prefix="/treasures", tags=["宝藏"])


@router.get("/", response_model=PaginatedResponse[TreasureResponse])
def read_treasures(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    treasures = TreasureService.get_treasures(db, skip=skip, limit=limit)
    return PaginatedResponse(
        code=200, 
        message="获取成功", 
        data=[TreasureResponse.from_orm(t) for t in treasures],
        total=len(treasures),
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/depth/{depth}", response_model=ResponseModel)
def read_treasures_by_depth(
    depth: float, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    treasures = TreasureService.get_treasures_by_depth(db, depth=depth)
    return ResponseModel(
        code=200, 
        message="获取成功", 
        data=[TreasureResponse.from_orm(t) for t in treasures]
    )


@router.get("/{treasure_id}", response_model=ResponseModel)
def read_treasure(
    treasure_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_treasure = TreasureService.get_treasure(db, treasure_id=treasure_id)
    if db_treasure is None:
        raise HTTPException(status_code=404, detail="宝藏不存在")
    return ResponseModel(code=200, message="获取成功", data=TreasureResponse.from_orm(db_treasure))


@router.post("/", response_model=ResponseModel)
def create_treasure(
    treasure: TreasureCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_treasure = TreasureService.create_treasure(db=db, treasure=treasure)
    return ResponseModel(code=200, message="创建成功", data=TreasureResponse.from_orm(db_treasure))


@router.post("/{treasure_id}/collect", response_model=ResponseModel)
def collect_treasure(
    treasure_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_treasure = TreasureService.get_treasure(db, treasure_id=treasure_id)
    if db_treasure is None:
        raise HTTPException(status_code=404, detail="宝藏不存在")
    
    from schemas import UserCollectionCreate
    collection_data = UserCollectionCreate(
        user_id=current_user.id,
        item_type="treasure",
        item_id=treasure_id
    )
    collection = UserCollectionService.create_user_collection(db, collection_data)
    return ResponseModel(code=200, message="收集成功", data=collection)


@router.put("/{treasure_id}", response_model=ResponseModel)
def update_treasure(
    treasure_id: int, 
    treasure: TreasureUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_treasure = TreasureService.update_treasure(db, treasure_id=treasure_id, treasure=treasure)
    if db_treasure is None:
        raise HTTPException(status_code=404, detail="宝藏不存在")
    return ResponseModel(code=200, message="更新成功", data=TreasureResponse.from_orm(db_treasure))


@router.delete("/{treasure_id}", response_model=ResponseModel)
def delete_treasure(
    treasure_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = TreasureService.delete_treasure(db, treasure_id=treasure_id)
    if not success:
        raise HTTPException(status_code=404, detail="宝藏不存在")
    return ResponseModel(code=200, message="删除成功", data=None)
