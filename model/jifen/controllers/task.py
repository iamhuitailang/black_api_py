from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from utils.response import ResponseUtil
from utils.auth import get_current_user, get_current_admin
from schemas.task import TaskCreate, TaskUpdate
from models.user import User
from business.task import TaskBusiness

router = APIRouter(prefix="/api/task", tags=["任务"])


@router.post("/")
def create(data: TaskCreate, current_user: User = Depends(get_current_admin),
           db: Session = Depends(get_db)):
    try:
        task = TaskBusiness.create(db, data)
        return ResponseUtil.success(data={"id": task.id}, message="创建成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/list")
def list(is_active: Optional[bool] = None, db: Session = Depends(get_db)):
    try:
        tasks = TaskBusiness.list(db, is_active)
        return ResponseUtil.success(data=[{
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "icon": t.icon,
            "points": t.points,
            "type": t.type,
            "limit_count": t.limit_count,
            "limit_period": t.limit_period,
            "is_active": t.is_active,
            "sort": t.sort
        } for t in tasks])
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/my-tasks")
def get_my_tasks(current_user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    try:
        tasks = TaskBusiness.get_user_tasks(db, current_user.id)
        return ResponseUtil.success(data=tasks)
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.post("/complete/{task_id}")
def complete_task(task_id: int,
                  current_user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    try:
        result = TaskBusiness.complete_task(db, current_user.id, task_id)
        return ResponseUtil.success(data=result, message="任务完成")
    except ValueError as e:
        return ResponseUtil.error(message=str(e))
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/{task_id}")
def get_by_id(task_id: int, db: Session = Depends(get_db)):
    try:
        task = TaskBusiness.get_by_id(db, task_id)
        if not task:
            return ResponseUtil.error(message="任务不存在", code=404)
        return ResponseUtil.success(data={
            "id": task.id,
            "name": task.name,
            "description": task.description,
            "icon": task.icon,
            "points": task.points,
            "type": task.type,
            "limit_count": task.limit_count,
            "limit_period": task.limit_period,
            "is_active": task.is_active,
            "sort": task.sort,
            "created_at": task.created_at
        })
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.put("/{task_id}")
def update(task_id: int, data: TaskUpdate,
           current_user: User = Depends(get_current_admin),
           db: Session = Depends(get_db)):
    try:
        task = TaskBusiness.update(db, task_id, data)
        if not task:
            return ResponseUtil.error(message="任务不存在", code=404)
        return ResponseUtil.success(message="更新成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.delete("/{task_id}")
def delete(task_id: int, current_user: User = Depends(get_current_admin),
           db: Session = Depends(get_db)):
    try:
        result = TaskBusiness.delete(db, task_id)
        if not result:
            return ResponseUtil.error(message="任务不存在", code=404)
        return ResponseUtil.success(message="删除成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.post("/signin")
def signin(current_user: User = Depends(get_current_user),
           db: Session = Depends(get_db)):
    try:
        result = TaskBusiness.signin(db, current_user.id)
        return ResponseUtil.success(data=result, message="签到成功")
    except ValueError as e:
        return ResponseUtil.error(message=str(e))
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/signin/info")
def get_signin_info(current_user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    try:
        info = TaskBusiness.get_signin_info(db, current_user.id)
        return ResponseUtil.success(data=info)
    except Exception as e:
        return ResponseUtil.error(message=str(e))
