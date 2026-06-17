from fastapi import APIRouter, HTTPException, Query, Depends, Header, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.business.kpi import kpi_business
from app.business.auth import auth_business

router = APIRouter(prefix="/kpi", tags=["KPI绩效考核"])


def _get_token_from_header(request: Request, authorization: Optional[str] = Header(None)) -> str:
    if authorization and authorization.startswith('Bearer '):
        return authorization[7:]
    token = request.query_params.get('token')
    return token or ''


async def get_current_user(request: Request, authorization: Optional[str] = Header(None)):
    token = _get_token_from_header(request, authorization)
    user = auth_business.verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="请先登录")
    return user


class DimensionCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    weight: int
    sort_order: Optional[int] = 0


class CycleCreate(BaseModel):
    name: str
    year: int
    quarter: int
    start_date: str
    end_date: str
    status: Optional[str] = "draft"
    dimensions: List[DimensionCreate]


class CycleUpdate(BaseModel):
    name: Optional[str] = None
    year: Optional[int] = None
    quarter: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    dimensions: Optional[List[DimensionCreate]] = None


class ScoreItem(BaseModel):
    id: Optional[int] = None
    self_score: Optional[int] = None
    self_comment: Optional[str] = ""
    supervisor_score: Optional[int] = None
    supervisor_comment: Optional[str] = ""


class SelfReviewSubmit(BaseModel):
    self_review_comment: Optional[str] = ""
    scores: List[ScoreItem]


class SupervisorReviewSubmit(BaseModel):
    supervisor_comment: Optional[str] = ""
    scores: List[ScoreItem]


@router.get("/employees")
async def list_employees(current_user: Dict[str, Any] = Depends(get_current_user)):
    data = kpi_business.get_all_employees()
    return {"code": 0, "message": "success", "data": data}


@router.get("/employees/user/{user_id}")
async def get_employee_by_user(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    data = kpi_business.get_employee_by_user_id(user_id)
    if not data:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"code": 0, "message": "success", "data": data}


@router.get("/departments")
async def list_departments(current_user: Dict[str, Any] = Depends(get_current_user)):
    data = kpi_business.get_all_departments()
    return {"code": 0, "message": "success", "data": data}


@router.get("/employees/{supervisor_id}/subordinates")
async def list_subordinates(supervisor_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    data = kpi_business.get_subordinates(supervisor_id)
    return {"code": 0, "message": "success", "data": data}


@router.get("/cycles")
async def list_cycles(current_user: Dict[str, Any] = Depends(get_current_user)):
    data = kpi_business.get_all_cycles()
    return {"code": 0, "message": "success", "data": data}


@router.get("/cycles/{cycle_id}")
async def get_cycle(cycle_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    data = kpi_business.get_cycle_by_id(cycle_id)
    if not data:
        raise HTTPException(status_code=404, detail="Cycle not found")
    return {"code": 0, "message": "success", "data": data}


@router.post("/cycles")
async def create_cycle(body: CycleCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    emp = kpi_business.get_employee_by_user_id(current_user.get('id'))
    if not emp or emp.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="仅管理员可创建考核周期")
    cycle_id = kpi_business.create_cycle(body.model_dump())
    return {"code": 0, "message": "success", "data": {"id": cycle_id}}


@router.put("/cycles/{cycle_id}")
async def update_cycle(cycle_id: int, body: CycleUpdate, current_user: Dict[str, Any] = Depends(get_current_user)):
    emp = kpi_business.get_employee_by_user_id(current_user.get('id'))
    if not emp or emp.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="仅管理员可编辑考核周期")
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    kpi_business.update_cycle(cycle_id, data)
    return {"code": 0, "message": "success", "data": None}


@router.delete("/cycles/{cycle_id}")
async def delete_cycle(cycle_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    emp = kpi_business.get_employee_by_user_id(current_user.get('id'))
    if not emp or emp.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="仅管理员可删除考核周期")
    kpi_business.delete_cycle(cycle_id)
    return {"code": 0, "message": "success", "data": None}


@router.post("/cycles/{cycle_id}/publish")
async def publish_cycle(cycle_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    emp = kpi_business.get_employee_by_user_id(current_user.get('id'))
    if not emp or emp.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="仅管理员可发布考核周期")
    kpi_business.publish_cycle(cycle_id)
    return {"code": 0, "message": "success", "data": None}


@router.get("/records")
async def list_records(
    cycle_id: Optional[int] = Query(None),
    employee_id: Optional[int] = Query(None),
    supervisor_id: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    if employee_id:
        data = kpi_business.get_assessment_records_by_employee(employee_id)
    elif supervisor_id:
        data = kpi_business.get_pending_reviews_by_supervisor(supervisor_id, cycle_id)
    elif department:
        data = kpi_business.get_records_by_department(department, cycle_id)
    elif cycle_id:
        data = kpi_business.get_records_by_cycle(cycle_id)
    else:
        data = []
    return {"code": 0, "message": "success", "data": data}


@router.get("/records/{record_id}")
async def get_record(record_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    data = kpi_business.get_assessment_record_detail(record_id)
    if not data:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"code": 0, "message": "success", "data": data}


@router.post("/records/{record_id}/self-review")
async def submit_self_review(record_id: int, body: SelfReviewSubmit, current_user: Dict[str, Any] = Depends(get_current_user)):
    emp = kpi_business.get_employee_by_user_id(current_user.get('id'))
    detail = kpi_business.get_assessment_record_detail(record_id)
    if not emp or not detail or emp.get('id') != detail.get('employee_id'):
        raise HTTPException(status_code=403, detail="仅可提交本人的自评")
    kpi_business.submit_self_review(record_id, body.model_dump())
    return {"code": 0, "message": "success", "data": None}


@router.post("/records/{record_id}/supervisor-review")
async def submit_supervisor_review(record_id: int, body: SupervisorReviewSubmit, current_user: Dict[str, Any] = Depends(get_current_user)):
    emp = kpi_business.get_employee_by_user_id(current_user.get('id'))
    detail = kpi_business.get_assessment_record_detail(record_id)
    if not emp or not detail or emp.get('id') != detail.get('supervisor_id'):
        raise HTTPException(status_code=403, detail="仅直属上级可提交评分")
    kpi_business.submit_supervisor_review(record_id, body.model_dump())
    return {"code": 0, "message": "success", "data": None}


@router.get("/statistics")
async def get_statistics(
    cycle_id: int = Query(...),
    department: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    emp = kpi_business.get_employee_by_user_id(current_user.get('id'))
    if not emp or emp.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="仅管理员可查看统计分析")
    data = kpi_business.get_statistics(cycle_id, department)
    return {"code": 0, "message": "success", "data": data}


@router.get("/employees/{employee_id}/trend")
async def get_employee_trend(employee_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    emp = kpi_business.get_employee_by_user_id(current_user.get('id'))
    if not emp or (emp.get('id') != employee_id and emp.get('role') != 'admin'):
        raise HTTPException(status_code=403, detail="仅可查看本人或管理员查看所有历史绩效")
    data = kpi_business.get_employee_trend(employee_id)
    return {"code": 0, "message": "success", "data": data}
