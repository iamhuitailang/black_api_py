from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from model.kl_model.database.db import get_db
from model.kl_model.core.response import success_response, error_response
from model.kl_model.core.security import get_current_user
from model.kl_model.schemas.event import EventCreate, EventUpdate, EventResolveRequest
from model.kl_model.business.event_business import EventBusiness
from model.kl_model.business.user_business import UserBusiness
from model.kl_model.business.park_business import ParkBusiness
from model.kl_model.models import User

router = APIRouter(prefix="/events", tags=["events"])


@router.get("")
def read_my_events(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    events = EventBusiness.get_events_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return success_response(data=events)


@router.get("/unresolved")
def read_unresolved_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    events = EventBusiness.get_unresolved_events(db, user_id=current_user.id)
    return success_response(data=events)


@router.post("/generate/{park_id}")
def generate_event(
    park_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = EventBusiness.generate_random_event(db, park_id=park_id, user_id=current_user.id)
    if not event:
        return error_response(code=400, message="无法生成事件")
    return success_response(data=event, message="新的突发事件！")


@router.post("/resolve")
def resolve_event(
    request: EventResolveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event, message, coins_change, reputation_change = EventBusiness.resolve_event(db, request=request, user_id=current_user.id)
    if not event:
        return error_response(code=400, message=message)
    
    UserBusiness.update_balance(db, current_user.id, coins=coins_change)
    if reputation_change != 0:
        ParkBusiness.update_reputation(db, park_id=event.park_id, change=reputation_change)
    
    return success_response(data={"event": event, "coins_change": coins_change}, message=message)


@router.get("/{event_id}")
def read_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_event = EventBusiness.get_event(db, event_id=event_id)
    if db_event is None or db_event.user_id != current_user.id:
        return error_response(code=404, message="事件不存在")
    return success_response(data=db_event)


@router.post("")
def create_event(
    event: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_event = EventBusiness.create_event(db, event=event, user_id=current_user.id)
    return success_response(data=db_event)


@router.put("/{event_id}")
def update_event(
    event_id: int,
    event_update: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_event = EventBusiness.update_event(db, event_id, event_update, user_id=current_user.id)
    if db_event is None:
        return error_response(code=404, message="事件不存在或无权限")
    return success_response(data=db_event)


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = EventBusiness.delete_event(db, event_id, user_id=current_user.id)
    if not success:
        return error_response(code=404, message="事件不存在或无权限")
    return success_response(message="删除成功")
