from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from model.pet_model.core.database import get_db
from model.pet_model.core.response import success, error, page_result
from model.pet_model.schemas.pet import PetCreate, PetUpdate, PetResponse, PetDetailResponse
from model.pet_model.business.pet_business import (
    create_pet,
    get_pet,
    get_pet_detail,
    get_pet_list,
    update_pet,
    delete_pet,
    increment_view_count,
    update_pet_status,
)

router = APIRouter(prefix="/pet", tags=["宠物管理"])


@router.post("/create", summary="发布宠物")
def create_pet_info(pet: PetCreate, user_id: int, db: Session = Depends(get_db)):
    db_pet = create_pet(db, pet, user_id)
    return success(db_pet, "发布成功")


@router.get("/detail/{pet_id}", summary="获取宠物详情")
def get_pet_info(pet_id: int, db: Session = Depends(get_db)):
    result = get_pet_detail(db, pet_id)
    if not result:
        return error("宠物不存在")
    increment_view_count(db, pet_id)
    pet, owner = result
    response = PetDetailResponse(
        id=pet.id,
        name=pet.name,
        breed=pet.breed,
        type=pet.type,
        age=pet.age,
        gender=pet.gender,
        weight=pet.weight,
        color=pet.color,
        vaccinated=pet.vaccinated,
        sterilized=pet.sterilized,
        dewormed=pet.dewormed,
        description=pet.description,
        images=pet.images,
        status=pet.status,
        user_id=pet.user_id,
        address=pet.address,
        view_count=pet.view_count,
        created_at=pet.created_at,
        updated_at=pet.updated_at,
        owner_nickname=owner.nickname if owner else None,
        owner_avatar=owner.avatar if owner else None,
    )
    return success(response)


@router.get("/list", summary="获取宠物列表")
def get_pets(
    page: int = 1,
    page_size: int = 10,
    keyword: Optional[str] = None,
    type: Optional[str] = None,
    breed: Optional[str] = None,
    gender: Optional[str] = None,
    status: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    pets, total = get_pet_list(db, page, page_size, keyword, type, breed, gender, status, user_id)
    return page_result(pets, total, page, page_size)


@router.put("/update/{pet_id}", summary="更新宠物信息")
def update_pet_info(pet_id: int, pet_update: PetUpdate, db: Session = Depends(get_db)):
    db_pet = update_pet(db, pet_id, pet_update)
    if not db_pet:
        return error("宠物不存在")
    return success(db_pet, "更新成功")


@router.put("/status/{pet_id}", summary="更新宠物状态")
def update_pet_info_status(pet_id: int, status: str, db: Session = Depends(get_db)):
    db_pet = update_pet_status(db, pet_id, status)
    if not db_pet:
        return error("宠物不存在")
    return success(db_pet, "状态更新成功")


@router.delete("/delete/{pet_id}", summary="删除宠物")
def delete_pet_info(pet_id: int, db: Session = Depends(get_db)):
    result = delete_pet(db, pet_id)
    if not result:
        return error("宠物不存在")
    return success(None, "删除成功")
