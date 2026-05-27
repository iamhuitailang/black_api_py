from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from model.pet_model.models.pet import Pet
from model.pet_model.models.user import User
from model.pet_model.schemas.pet import PetCreate, PetUpdate


def get_pet(db: Session, pet_id: int) -> Optional[Pet]:
    return db.query(Pet).filter(Pet.id == pet_id).first()


def get_pet_detail(db: Session, pet_id: int) -> Optional[Tuple[Pet, Optional[User]]]:
    result = (
        db.query(Pet, User)
        .outerjoin(User, Pet.user_id == User.id)
        .filter(Pet.id == pet_id)
        .first()
    )
    return result


def create_pet(db: Session, pet: PetCreate, user_id: int) -> Pet:
    db_pet = Pet(
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
        address=pet.address,
        user_id=user_id,
        status="pending",
    )
    db.add(db_pet)
    db.commit()
    db.refresh(db_pet)
    return db_pet


def update_pet(db: Session, pet_id: int, pet_update: PetUpdate) -> Optional[Pet]:
    db_pet = get_pet(db, pet_id)
    if not db_pet:
        return None
    update_data = pet_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_pet, key, value)
    db.commit()
    db.refresh(db_pet)
    return db_pet


def delete_pet(db: Session, pet_id: int) -> bool:
    db_pet = get_pet(db, pet_id)
    if not db_pet:
        return False
    db.delete(db_pet)
    db.commit()
    return True


def get_pet_list(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    keyword: Optional[str] = None,
    type: Optional[str] = None,
    breed: Optional[str] = None,
    gender: Optional[str] = None,
    status: Optional[str] = None,
    user_id: Optional[int] = None,
) -> Tuple[List[Pet], int]:
    query = db.query(Pet)
    if keyword:
        query = query.filter(
            (Pet.name.contains(keyword)) | (Pet.breed.contains(keyword)) | (Pet.description.contains(keyword))
        )
    if type:
        query = query.filter(Pet.type == type)
    if breed:
        query = query.filter(Pet.breed == breed)
    if gender:
        query = query.filter(Pet.gender == gender)
    if status:
        query = query.filter(Pet.status == status)
    if user_id:
        query = query.filter(Pet.user_id == user_id)
    total = query.count()
    pets = query.order_by(Pet.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return pets, total


def increment_view_count(db: Session, pet_id: int) -> None:
    db_pet = get_pet(db, pet_id)
    if db_pet:
        db_pet.view_count += 1
        db.commit()


def update_pet_status(db: Session, pet_id: int, status: str) -> Optional[Pet]:
    db_pet = get_pet(db, pet_id)
    if not db_pet:
        return None
    db_pet.status = status
    db.commit()
    db.refresh(db_pet)
    return db_pet
