import random
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from model.kl_model.models import Event, Dinosaur, Park
from model.kl_model.schemas.event import EventCreate, EventUpdate, EventResolveRequest


class EventBusiness:
    @staticmethod
    def get_event(db: Session, event_id: int) -> Optional[Event]:
        return db.query(Event).filter(Event.id == event_id).first()

    @staticmethod
    def get_events_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Event]:
        return db.query(Event).filter(Event.user_id == user_id).order_by(Event.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_unresolved_events(db: Session, user_id: int) -> List[Event]:
        return db.query(Event).filter(Event.user_id == user_id, Event.is_resolved == False).all()

    @staticmethod
    def create_event(db: Session, event: EventCreate, user_id: int) -> Event:
        db_event = Event(
            user_id=user_id,
            park_id=event.park_id,
            type=event.type,
            title=event.title,
            description=event.description,
            severity=event.severity,
            dinosaur_id=event.dinosaur_id,
            habitat_id=event.habitat_id,
            reward_coins=event.reward_coins,
            penalty_coins=event.penalty_coins,
            reputation_change=event.reputation_change
        )
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return db_event

    @staticmethod
    def update_event(db: Session, event_id: int, event_update: EventUpdate, user_id: int) -> Optional[Event]:
        db_event = EventBusiness.get_event(db, event_id)
        if not db_event or db_event.user_id != user_id:
            return None
        update_data = event_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_event, key, value)
        db.commit()
        db.refresh(db_event)
        return db_event

    @staticmethod
    def delete_event(db: Session, event_id: int, user_id: int) -> bool:
        db_event = EventBusiness.get_event(db, event_id)
        if not db_event or db_event.user_id != user_id:
            return False
        db.delete(db_event)
        db.commit()
        return True

    @staticmethod
    def resolve_event(db: Session, request: EventResolveRequest, user_id: int) -> tuple[Optional[Event], str, int, int]:
        db_event = EventBusiness.get_event(db, request.event_id)
        if not db_event or db_event.user_id != user_id:
            return None, "事件不存在", 0, 0
        
        if db_event.is_resolved:
            return None, "事件已经解决", 0, 0
        
        db_event.is_resolved = True
        db_event.resolved_at = datetime.utcnow()
        db.commit()
        db.refresh(db_event)
        
        message = f"事件已解决: {db_event.title}"
        if db_event.reward_coins > 0:
            message += f" 获得 {db_event.reward_coins} 金币"
        if db_event.penalty_coins > 0:
            message += f" 损失 {db_event.penalty_coins} 金币"
        
        return db_event, message, db_event.reward_coins - db_event.penalty_coins, db_event.reputation_change

    @staticmethod
    def generate_random_event(db: Session, park_id: int, user_id: int) -> Optional[Event]:
        park = db.query(Park).filter(Park.id == park_id, Park.user_id == user_id).first()
        if not park:
            return None
        
        dinosaurs = db.query(Dinosaur).filter(Dinosaur.park_id == park_id).all()
        if not dinosaurs:
            return None
        
        event_types = [
            {
                "type": "dinosaur_escape",
                "title": "恐龙逃脱！",
                "description": "一只恐龙突破了围栏，需要立即处理！",
                "severity": "critical",
                "reward_coins": 500,
                "penalty_coins": 1000,
                "reputation_change": -20
            },
            {
                "type": "dinosaur_sick",
                "title": "恐龙生病",
                "description": "一只恐龙看起来不太舒服，需要兽医检查。",
                "severity": "warning",
                "reward_coins": 200,
                "penalty_coins": 300,
                "reputation_change": -5
            },
            {
                "type": "power_outage",
                "title": "电力故障",
                "description": "公园部分区域停电了，安全系统可能受影响。",
                "severity": "warning",
                "reward_coins": 300,
                "penalty_coins": 500,
                "reputation_change": -10
            },
            {
                "type": "visitor_incident",
                "title": "游客意外",
                "description": "有游客在游览时发生意外，需要处理。",
                "severity": "normal",
                "reward_coins": 150,
                "penalty_coins": 200,
                "reputation_change": -8
            },
            {
                "type": "rare_discovery",
                "title": "罕见发现！",
                "description": "你的恐龙公园吸引了稀有物种的关注！",
                "severity": "positive",
                "reward_coins": 800,
                "penalty_coins": 0,
                "reputation_change": 15
            },
            {
                "type": "media_visit",
                "title": "媒体采访",
                "description": "有媒体要来采访你的公园，这是个好机会！",
                "severity": "positive",
                "reward_coins": 500,
                "penalty_coins": 0,
                "reputation_change": 20
            }
        ]
        
        selected_event = random.choice(event_types)
        random_dino = random.choice(dinosaurs) if dinosaurs else None
        
        db_event = Event(
            user_id=user_id,
            park_id=park_id,
            type=selected_event["type"],
            title=selected_event["title"],
            description=selected_event["description"],
            severity=selected_event["severity"],
            dinosaur_id=random_dino.id if random_dino else None,
            reward_coins=selected_event["reward_coins"],
            penalty_coins=selected_event["penalty_coins"],
            reputation_change=selected_event["reputation_change"]
        )
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        
        return db_event
