from sqlalchemy.orm import Session
from datetime import datetime
from models import (User, UserGameState, UserTask, UserEvidence, 
                      UserInventory, GhostArchive, GhostType, Location, 
                      Equipment, Task, EvidenceType)
from schemas import (UserCreate, UserTaskBase, UserEvidenceBase, 
                       UserInventoryBase, GhostArchiveBase)
from utils import hash_password, verify_password, create_access_token


class UserBusiness:
    @staticmethod
    def create_user(db: Session, user: UserCreate):
        hashed_password = hash_password(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            password_hash=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        game_state = UserGameState(user_id=db_user.id)
        db.add(game_state)
        
        starter_equipments = db.query(Equipment).filter(Equipment.price <= 50).all()
        for eq in starter_equipments[:3]:
            inventory = UserInventory(
                user_id=db_user.id,
                equipment_id=eq.id,
                level=1,
                is_equipped=(eq.id == starter_equipments[0].id)
            )
            db.add(inventory)
        
        all_tasks = db.query(Task).all()
        for task in all_tasks[:3]:
            user_task = UserTask(
                user_id=db_user.id,
                task_id=task.id,
                status="pending"
            )
            db.add(user_task)
        
        for ghost in db.query(GhostType).all():
            archive = GhostArchive(
                user_id=db_user.id,
                ghost_type_id=ghost.id,
                discovered=False,
                encounters=0,
                defeated=0
            )
            db.add(archive)
        
        db.commit()
        return db_user

    @staticmethod
    def authenticate_user(db: Session, username: str, password: str):
        user = db.query(User).filter(User.username == username).first()
        if not user or not verify_password(password, user.password_hash):
            return None
        user.last_login = datetime.utcnow()
        db.commit()
        return user

    @staticmethod
    def get_user_by_id(db: Session, user_id: int):
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str):
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def update_user_exp_and_coins(db: Session, user_id: int, exp: int, coins: int):
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.exp += exp
            user.coins += coins
            exp_needed = user.level * 100
            while user.exp >= exp_needed:
                user.exp -= exp_needed
                user.level += 1
                exp_needed = user.level * 100
            db.commit()
            db.refresh(user)
        return user


class GhostTypeBusiness:
    @staticmethod
    def get_all(db: Session):
        return db.query(GhostType).all()

    @staticmethod
    def get_by_id(db: Session, ghost_id: int):
        return db.query(GhostType).filter(GhostType.id == ghost_id).first()

    @staticmethod
    def create(db: Session, ghost_data):
        ghost = GhostType(**ghost_data.dict())
        db.add(ghost)
        db.commit()
        db.refresh(ghost)
        return ghost

    @staticmethod
    def update(db: Session, ghost_id: int, ghost_data):
        ghost = db.query(GhostType).filter(GhostType.id == ghost_id).first()
        if ghost:
            for key, value in ghost_data.dict(exclude_unset=True).items():
                setattr(ghost, key, value)
            db.commit()
            db.refresh(ghost)
        return ghost

    @staticmethod
    def delete(db: Session, ghost_id: int):
        ghost = db.query(GhostType).filter(GhostType.id == ghost_id).first()
        if ghost:
            db.delete(ghost)
            db.commit()
        return ghost


class LocationBusiness:
    @staticmethod
    def get_all(db: Session, user_level: int = 1):
        return db.query(Location).filter(Location.unlocked_level <= user_level).all()

    @staticmethod
    def get_by_id(db: Session, location_id: int):
        return db.query(Location).filter(Location.id == location_id).first()

    @staticmethod
    def create(db: Session, location_data):
        location = Location(**location_data.dict())
        db.add(location)
        db.commit()
        db.refresh(location)
        return location

    @staticmethod
    def update(db: Session, location_id: int, location_data):
        location = db.query(Location).filter(Location.id == location_id).first()
        if location:
            for key, value in location_data.dict(exclude_unset=True).items():
                setattr(location, key, value)
            db.commit()
            db.refresh(location)
        return location

    @staticmethod
    def delete(db: Session, location_id: int):
        location = db.query(Location).filter(Location.id == location_id).first()
        if location:
            db.delete(location)
            db.commit()
        return location


class EquipmentBusiness:
    @staticmethod
    def get_all(db: Session):
        return db.query(Equipment).all()

    @staticmethod
    def get_by_id(db: Session, equipment_id: int):
        return db.query(Equipment).filter(Equipment.id == equipment_id).first()

    @staticmethod
    def create(db: Session, equipment_data):
        equipment = Equipment(**equipment_data.dict())
        db.add(equipment)
        db.commit()
        db.refresh(equipment)
        return equipment

    @staticmethod
    def update(db: Session, equipment_id: int, equipment_data):
        equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
        if equipment:
            for key, value in equipment_data.dict(exclude_unset=True).items():
                setattr(equipment, key, value)
            db.commit()
            db.refresh(equipment)
        return equipment

    @staticmethod
    def delete(db: Session, equipment_id: int):
        equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
        if equipment:
            db.delete(equipment)
            db.commit()
        return equipment


class TaskBusiness:
    @staticmethod
    def get_all(db: Session, difficulty: int = None):
        query = db.query(Task)
        if difficulty:
            query = query.filter(Task.difficulty <= difficulty)
        return query.all()

    @staticmethod
    def get_by_id(db: Session, task_id: int):
        return db.query(Task).filter(Task.id == task_id).first()

    @staticmethod
    def create(db: Session, task_data):
        task = Task(**task_data.dict())
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def update(db: Session, task_id: int, task_data):
        task = db.query(Task).filter(Task.id == task_id).first()
        if task:
            for key, value in task_data.dict(exclude_unset=True).items():
                setattr(task, key, value)
            db.commit()
            db.refresh(task)
        return task

    @staticmethod
    def delete(db: Session, task_id: int):
        task = db.query(Task).filter(Task.id == task_id).first()
        if task:
            db.delete(task)
            db.commit()
        return task


class EvidenceTypeBusiness:
    @staticmethod
    def get_all(db: Session):
        return db.query(EvidenceType).all()

    @staticmethod
    def get_by_id(db: Session, evidence_id: int):
        return db.query(EvidenceType).filter(EvidenceType.id == evidence_id).first()

    @staticmethod
    def create(db: Session, evidence_data):
        evidence = EvidenceType(**evidence_data.dict())
        db.add(evidence)
        db.commit()
        db.refresh(evidence)
        return evidence

    @staticmethod
    def update(db: Session, evidence_id: int, evidence_data):
        evidence = db.query(EvidenceType).filter(EvidenceType.id == evidence_id).first()
        if evidence:
            for key, value in evidence_data.dict(exclude_unset=True).items():
                setattr(evidence, key, value)
            db.commit()
            db.refresh(evidence)
        return evidence

    @staticmethod
    def delete(db: Session, evidence_id: int):
        evidence = db.query(EvidenceType).filter(EvidenceType.id == evidence_id).first()
        if evidence:
            db.delete(evidence)
            db.commit()
        return evidence


class GameBusiness:
    @staticmethod
    def get_game_state(db: Session, user_id: int):
        return db.query(UserGameState).filter(UserGameState.user_id == user_id).first()

    @staticmethod
    def start_exploring(db: Session, user_id: int, location_id: int, task_id: int = None):
        game_state = db.query(UserGameState).filter(UserGameState.user_id == user_id).first()
        if game_state:
            game_state.current_location_id = location_id
            game_state.current_task_id = task_id
            game_state.is_exploring = True
            game_state.ghost_found = False
            game_state.evidence_collected = 0
            game_state.sanity = 100
            db.commit()
            db.refresh(game_state)
        return game_state

    @staticmethod
    def stop_exploring(db: Session, user_id: int):
        game_state = db.query(UserGameState).filter(UserGameState.user_id == user_id).first()
        if game_state:
            game_state.is_exploring = False
            db.commit()
            db.refresh(game_state)
        return game_state

    @staticmethod
    def collect_evidence(db: Session, user_id: int, evidence_data):
        evidence = UserEvidence(
            user_id=user_id,
            evidence_type_id=evidence_data.evidence_type_id,
            location_id=evidence_data.location_id,
            task_id=evidence_data.task_id,
            notes=evidence_data.notes
        )
        db.add(evidence)
        
        game_state = db.query(UserGameState).filter(UserGameState.user_id == user_id).first()
        if game_state:
            game_state.evidence_collected += 1
            if game_state.evidence_collected >= 3:
                game_state.ghost_found = True
        
        archive = db.query(GhostArchive).filter(
            GhostArchive.user_id == user_id
        ).first()
        if archive:
            archive.encounters += 1
            archive.discovered = True
        
        db.commit()
        db.refresh(evidence)
        return evidence

    @staticmethod
    def perform_exorcism(db: Session, user_id: int, task_id: int, ghost_type_id: int):
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None, "任务不存在"
        
        is_correct = task.ghost_type_id == ghost_type_id
        
        user_task = db.query(UserTask).filter(
            UserTask.user_id == user_id,
            UserTask.task_id == task_id
        ).first()
        
        if not user_task:
            user_task = UserTask(
                user_id=user_id,
                task_id=task_id,
                status="in_progress"
            )
            db.add(user_task)
        
        if is_correct:
            user_task.status = "completed"
            user_task.progress = 100
            user_task.completed_at = datetime.utcnow()
            user_task.ghost_identified = db.query(GhostType).filter(
                GhostType.id == ghost_type_id
            ).first().name
            
            user = db.query(User).filter(User.id == user_id).first()
            user.exp += task.reward_exp
            user.coins += task.reward_coins
            
            archive = db.query(GhostArchive).filter(
                GhostArchive.user_id == user_id,
                GhostArchive.ghost_type_id == ghost_type_id
            ).first()
            if not archive:
                archive = GhostArchive(
                    user_id=user_id,
                    ghost_type_id=ghost_type_id,
                    discovered=True,
                    defeated=1
                )
                db.add(archive)
            else:
                archive.defeated += 1
            
            game_state = db.query(UserGameState).filter(UserGameState.user_id == user_id).first()
            if game_state:
                game_state.is_exploring = False
                game_state.current_task_id = None
            
            db.commit()
            return {"success": True, "rewards": {"exp": task.reward_exp, "coins": task.reward_coins}, "story": task.story}, None
        else:
            game_state = db.query(UserGameState).filter(UserGameState.user_id == user_id).first()
            if game_state:
                game_state.sanity = max(0, game_state.sanity - 20)
            
            db.commit()
            return {"success": False, "sanity_loss": 20}, None

    @staticmethod
    def get_user_tasks(db: Session, user_id: int, status: str = None):
        query = db.query(UserTask).filter(UserTask.user_id == user_id)
        if status:
            query = query.filter(UserTask.status == status)
        return query.all()

    @staticmethod
    def accept_task(db: Session, user_id: int, task_id: int):
        existing = db.query(UserTask).filter(
            UserTask.user_id == user_id,
            UserTask.task_id == task_id
        ).first()
        if existing:
            return existing
        
        user_task = UserTask(
            user_id=user_id,
            task_id=task_id,
            status="pending"
        )
        db.add(user_task)
        db.commit()
        db.refresh(user_task)
        return user_task

    @staticmethod
    def get_user_evidence(db: Session, user_id: int, task_id: int = None):
        query = db.query(UserEvidence).filter(UserEvidence.user_id == user_id)
        if task_id:
            query = query.filter(UserEvidence.task_id == task_id)
        return query.all()

    @staticmethod
    def get_user_inventory(db: Session, user_id: int):
        return db.query(UserInventory).filter(UserInventory.user_id == user_id).all()

    @staticmethod
    def upgrade_equipment(db: Session, user_id: int, inventory_id: int):
        inventory = db.query(UserInventory).filter(
            UserInventory.id == inventory_id,
            UserInventory.user_id == user_id
        ).first()
        if not inventory:
            return None, "装备不存在"
        
        equipment = db.query(Equipment).filter(Equipment.id == inventory.equipment_id).first()
        if inventory.level >= equipment.max_level:
            return None, "已达最高等级"
        
        upgrade_cost = equipment.upgrade_cost * inventory.level
        user = db.query(User).filter(User.id == user_id).first()
        if user.coins < upgrade_cost:
            return None, "金币不足"
        
        user.coins -= upgrade_cost
        inventory.level += 1
        db.commit()
        db.refresh(inventory)
        return inventory, None

    @staticmethod
    def buy_equipment(db: Session, user_id: int, equipment_id: int):
        equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
        if not equipment:
            return None, "装备不存在"
        
        existing = db.query(UserInventory).filter(
            UserInventory.user_id == user_id,
            UserInventory.equipment_id == equipment_id
        ).first()
        if existing:
            return None, "已拥有该装备"
        
        user = db.query(User).filter(User.id == user_id).first()
        if user.coins < equipment.price:
            return None, "金币不足"
        
        user.coins -= equipment.price
        inventory = UserInventory(
            user_id=user_id,
            equipment_id=equipment_id,
            level=1,
            is_equipped=False
        )
        db.add(inventory)
        db.commit()
        db.refresh(inventory)
        return inventory, None

    @staticmethod
    def get_ghost_archive(db: Session, user_id: int):
        return db.query(GhostArchive).filter(GhostArchive.user_id == user_id).all()

    @staticmethod
    def toggle_night_mode(db: Session, user_id: int, is_night: bool):
        game_state = db.query(UserGameState).filter(UserGameState.user_id == user_id).first()
        if game_state:
            game_state.game_time = "night" if is_night else "day"
            db.commit()
            db.refresh(game_state)
        return game_state
