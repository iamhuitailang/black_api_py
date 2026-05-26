from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from utils.response import ResponseUtil
from utils.auth import get_current_user
from schemas.address import AddressCreate, AddressUpdate
from models.user import User
from business.address import AddressBusiness

router = APIRouter(prefix="/api/address", tags=["地址"])


@router.post("/")
def create(data: AddressCreate, current_user: User = Depends(get_current_user),
           db: Session = Depends(get_db)):
    try:
        address = AddressBusiness.create(db, current_user.id, data)
        return ResponseUtil.success(data={"id": address.id}, message="添加成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/list")
def list(current_user: User = Depends(get_current_user),
         db: Session = Depends(get_db)):
    try:
        addresses = AddressBusiness.list_by_user(db, current_user.id)
        return ResponseUtil.success(data=[{
            "id": a.id,
            "receiver_name": a.receiver_name,
            "phone": a.phone,
            "province": a.province,
            "city": a.city,
            "district": a.district,
            "detail": a.detail,
            "is_default": a.is_default
        } for a in addresses])
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/default")
def get_default(current_user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    try:
        address = AddressBusiness.get_default(db, current_user.id)
        if not address:
            return ResponseUtil.success(data=None)
        return ResponseUtil.success(data={
            "id": address.id,
            "receiver_name": address.receiver_name,
            "phone": address.phone,
            "province": address.province,
            "city": address.city,
            "district": address.district,
            "detail": address.detail,
            "is_default": address.is_default
        })
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/{address_id}")
def get_by_id(address_id: int, current_user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    try:
        address = AddressBusiness.get_by_id(db, address_id)
        if not address or address.user_id != current_user.id:
            return ResponseUtil.error(message="地址不存在", code=404)
        return ResponseUtil.success(data={
            "id": address.id,
            "receiver_name": address.receiver_name,
            "phone": address.phone,
            "province": address.province,
            "city": address.city,
            "district": address.district,
            "detail": address.detail,
            "is_default": address.is_default
        })
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.put("/{address_id}")
def update(address_id: int, data: AddressUpdate,
           current_user: User = Depends(get_current_user),
           db: Session = Depends(get_db)):
    try:
        address = AddressBusiness.update(db, address_id, current_user.id, data)
        if not address:
            return ResponseUtil.error(message="地址不存在", code=404)
        return ResponseUtil.success(message="更新成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.put("/default/{address_id}")
def set_default(address_id: int, current_user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    try:
        result = AddressBusiness.set_default(db, address_id, current_user.id)
        if not result:
            return ResponseUtil.error(message="地址不存在", code=404)
        return ResponseUtil.success(message="设置成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.delete("/{address_id}")
def delete(address_id: int, current_user: User = Depends(get_current_user),
           db: Session = Depends(get_db)):
    try:
        result = AddressBusiness.delete(db, address_id, current_user.id)
        if not result:
            return ResponseUtil.error(message="地址不存在", code=404)
        return ResponseUtil.success(message="删除成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))
