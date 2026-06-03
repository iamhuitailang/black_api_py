from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from models import User
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    GhostTypeBase, GhostTypeResponse,
    LocationBase, LocationResponse,
    EquipmentBase, EquipmentResponse,
    TaskBase, TaskResponse,
    EvidenceTypeBase, EvidenceTypeResponse,
    UserGameStateResponse, UserTaskResponse,
    UserEvidenceResponse, UserInventoryResponse,
    GhostArchiveResponse, ExploreRequest,
    EvidenceCollectRequest, ExorcismRequest,
    UpgradeEquipmentRequest
)
from business import (
    UserBusiness, GhostTypeBusiness, LocationBusiness,
    EquipmentBusiness, TaskBusiness, EvidenceTypeBusiness,
    GameBusiness
)
from utils import (
    create_access_token, get_current_user,
    success_response, error_response, ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/api")


@router.post("/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = UserBusiness.get_user_by_username(db, user.username)
    if existing_user:
        return error_response(400, "用户名已存在")
    
    db_user = UserBusiness.create_user(db, user)
    return success_response(UserResponse.model_validate(db_user), "注册成功")


@router.post("/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = UserBusiness.authenticate_user(db, user.username, user.password)
    if not db_user:
        return error_response(401, "用户名或密码错误")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username}, expires_delta=access_token_expires
    )
    
    return success_response({
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(db_user)
    }, "登录成功")


@router.get("/auth/me")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return success_response(UserResponse.model_validate(current_user))


@router.get("/ghost-types")
def get_ghost_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ghost_types = GhostTypeBusiness.get_all(db)
    return success_response([GhostTypeResponse.model_validate(g) for g in ghost_types])


@router.get("/ghost-types/{ghost_id}")
def get_ghost_type(ghost_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ghost = GhostTypeBusiness.get_by_id(db, ghost_id)
    if not ghost:
        return error_response(404, "鬼魂类型不存在")
    return success_response(GhostTypeResponse.model_validate(ghost))


@router.post("/ghost-types")
def create_ghost_type(ghost: GhostTypeBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_ghost = GhostTypeBusiness.create(db, ghost)
    return success_response(GhostTypeResponse.model_validate(new_ghost), "创建成功")


@router.put("/ghost-types/{ghost_id}")
def update_ghost_type(ghost_id: int, ghost: GhostTypeBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    updated = GhostTypeBusiness.update(db, ghost_id, ghost)
    if not updated:
        return error_response(404, "鬼魂类型不存在")
    return success_response(GhostTypeResponse.model_validate(updated), "更新成功")


@router.delete("/ghost-types/{ghost_id}")
def delete_ghost_type(ghost_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deleted = GhostTypeBusiness.delete(db, ghost_id)
    if not deleted:
        return error_response(404, "鬼魂类型不存在")
    return success_response(None, "删除成功")


@router.get("/locations")
def get_locations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    locations = LocationBusiness.get_all(db, current_user.level)
    return success_response([LocationResponse.model_validate(l) for l in locations])


@router.get("/locations/{location_id}")
def get_location(location_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    location = LocationBusiness.get_by_id(db, location_id)
    if not location:
        return error_response(404, "地点不存在")
    return success_response(LocationResponse.model_validate(location))


@router.post("/locations")
def create_location(location: LocationBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_location = LocationBusiness.create(db, location)
    return success_response(LocationResponse.model_validate(new_location), "创建成功")


@router.put("/locations/{location_id}")
def update_location(location_id: int, location: LocationBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    updated = LocationBusiness.update(db, location_id, location)
    if not updated:
        return error_response(404, "地点不存在")
    return success_response(LocationResponse.model_validate(updated), "更新成功")


@router.delete("/locations/{location_id}")
def delete_location(location_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deleted = LocationBusiness.delete(db, location_id)
    if not deleted:
        return error_response(404, "地点不存在")
    return success_response(None, "删除成功")


@router.get("/equipments")
def get_equipments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    equipments = EquipmentBusiness.get_all(db)
    return success_response([EquipmentResponse.model_validate(e) for e in equipments])


@router.get("/equipments/{equipment_id}")
def get_equipment(equipment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    equipment = EquipmentBusiness.get_by_id(db, equipment_id)
    if not equipment:
        return error_response(404, "装备不存在")
    return success_response(EquipmentResponse.model_validate(equipment))


@router.post("/equipments")
def create_equipment(equipment: EquipmentBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_equipment = EquipmentBusiness.create(db, equipment)
    return success_response(EquipmentResponse.model_validate(new_equipment), "创建成功")


@router.put("/equipments/{equipment_id}")
def update_equipment(equipment_id: int, equipment: EquipmentBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    updated = EquipmentBusiness.update(db, equipment_id, equipment)
    if not updated:
        return error_response(404, "装备不存在")
    return success_response(EquipmentResponse.model_validate(updated), "更新成功")


@router.delete("/equipments/{equipment_id}")
def delete_equipment(equipment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deleted = EquipmentBusiness.delete(db, equipment_id)
    if not deleted:
        return error_response(404, "装备不存在")
    return success_response(None, "删除成功")


@router.get("/tasks")
def get_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tasks = TaskBusiness.get_all(db, current_user.level)
    return success_response([TaskResponse.model_validate(t) for t in tasks])


@router.get("/tasks/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = TaskBusiness.get_by_id(db, task_id)
    if not task:
        return error_response(404, "任务不存在")
    return success_response(TaskResponse.model_validate(task))


@router.post("/tasks")
def create_task(task: TaskBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_task = TaskBusiness.create(db, task)
    return success_response(TaskResponse.model_validate(new_task), "创建成功")


@router.put("/tasks/{task_id}")
def update_task(task_id: int, task: TaskBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    updated = TaskBusiness.update(db, task_id, task)
    if not updated:
        return error_response(404, "任务不存在")
    return success_response(TaskResponse.model_validate(updated), "更新成功")


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deleted = TaskBusiness.delete(db, task_id)
    if not deleted:
        return error_response(404, "任务不存在")
    return success_response(None, "删除成功")


@router.get("/evidence-types")
def get_evidence_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    evidence_types = EvidenceTypeBusiness.get_all(db)
    return success_response([EvidenceTypeResponse.model_validate(e) for e in evidence_types])


@router.get("/game/state")
def get_game_state(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    state = GameBusiness.get_game_state(db, current_user.id)
    if not state:
        return error_response(404, "游戏状态不存在")
    return success_response(UserGameStateResponse.model_validate(state))


@router.post("/game/explore/start")
def start_explore(request: ExploreRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    state = GameBusiness.start_exploring(db, current_user.id, request.location_id, request.task_id)
    return success_response(UserGameStateResponse.model_validate(state), "开始探索")


@router.post("/game/explore/stop")
def stop_explore(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    state = GameBusiness.stop_exploring(db, current_user.id)
    return success_response(UserGameStateResponse.model_validate(state), "停止探索")


@router.post("/game/evidence/collect")
def collect_evidence(request: EvidenceCollectRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    evidence = GameBusiness.collect_evidence(db, current_user.id, request)
    return success_response(UserEvidenceResponse.model_validate(evidence), "证据收集成功")


@router.post("/game/exorcism")
def perform_exorcism(request: ExorcismRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result, error = GameBusiness.perform_exorcism(db, current_user.id, request.task_id, request.ghost_type_id)
    if error:
        return error_response(400, error)
    return success_response(result, "驱魔完成")


@router.get("/game/tasks")
def get_my_tasks(status: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tasks = GameBusiness.get_user_tasks(db, current_user.id, status)
    return success_response([UserTaskResponse.model_validate(t) for t in tasks])


@router.post("/game/tasks/{task_id}/accept")
def accept_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = GameBusiness.accept_task(db, current_user.id, task_id)
    return success_response(UserTaskResponse.model_validate(task), "任务接受成功")


@router.get("/game/evidence")
def get_my_evidence(task_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    evidence = GameBusiness.get_user_evidence(db, current_user.id, task_id)
    return success_response([UserEvidenceResponse.model_validate(e) for e in evidence])


@router.get("/game/inventory")
def get_my_inventory(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inventory = GameBusiness.get_user_inventory(db, current_user.id)
    return success_response([UserInventoryResponse.model_validate(i) for i in inventory])


@router.post("/game/inventory/upgrade")
def upgrade_equipment(request: UpgradeEquipmentRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result, error = GameBusiness.upgrade_equipment(db, current_user.id, request.inventory_id)
    if error:
        return error_response(400, error)
    return success_response(UserInventoryResponse.model_validate(result), "升级成功")


@router.post("/game/inventory/buy/{equipment_id}")
def buy_equipment(equipment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result, error = GameBusiness.buy_equipment(db, current_user.id, equipment_id)
    if error:
        return error_response(400, error)
    return success_response(UserInventoryResponse.model_validate(result), "购买成功")


@router.get("/game/archive")
def get_ghost_archive(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    archive = GameBusiness.get_ghost_archive(db, current_user.id)
    return success_response([GhostArchiveResponse.model_validate(a) for a in archive])


@router.post("/game/night-mode")
def toggle_night_mode(is_night: bool, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    state = GameBusiness.toggle_night_mode(db, current_user.id, is_night)
    return success_response(UserGameStateResponse.model_validate(state), "时间切换成功")
