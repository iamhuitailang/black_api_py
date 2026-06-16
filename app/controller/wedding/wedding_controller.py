from typing import Optional
from fastapi import Request, Query
from pydantic import BaseModel
from app.business.wedding import WeddingBusiness


class GuestCreateRequest(BaseModel):
    name: str
    group_tag: Optional[str] = '亲友'
    rsvp_status: Optional[str] = '待回复'
    meal_preference: Optional[str] = ''


class GuestUpdateRequest(BaseModel):
    id: int
    name: Optional[str] = None
    group_tag: Optional[str] = None
    rsvp_status: Optional[str] = None
    meal_preference: Optional[str] = None


class GuestRsvpRequest(BaseModel):
    id: int
    rsvp_status: str
    meal_preference: Optional[str] = None


class BudgetItemCreateRequest(BaseModel):
    category: str
    item_name: str
    estimated_cost: Optional[float] = 0
    actual_cost: Optional[float] = 0
    paid: Optional[int] = 0


class BudgetItemUpdateRequest(BaseModel):
    id: int
    category: Optional[str] = None
    item_name: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    paid: Optional[int] = None


class VendorCreateRequest(BaseModel):
    name: str
    service: str
    contact: Optional[str] = ''
    contract_deadline: Optional[str] = None


class VendorUpdateRequest(BaseModel):
    id: int
    name: Optional[str] = None
    service: Optional[str] = None
    contact: Optional[str] = None
    contract_deadline: Optional[str] = None


class TaskCreateRequest(BaseModel):
    title: str
    deadline: Optional[str] = None
    priority: Optional[int] = 2


class TaskUpdateRequest(BaseModel):
    id: int
    title: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[int] = None
    done: Optional[int] = None


class TaskToggleRequest(BaseModel):
    id: int


class SettingUpdateRequest(BaseModel):
    key: str
    value: str


class DeleteRequest(BaseModel):
    id: int


class WeddingController:
    def __init__(self):
        self.business = WeddingBusiness()

    # ==================== Guests ====================
    def ActionGuestsGet(self, request: Request,
                        group_tag: Optional[str] = Query(None),
                        rsvp_status: Optional[str] = Query(None)):
        """
        获取宾客列表，支持按分组和RSVP状态筛选
        GET /api/guests/get
        """
        return self.business.get_guests(group_tag, rsvp_status)

    def ActionGuestsPost(self, request: Request, body: GuestCreateRequest):
        """
        添加宾客
        POST /api/guests/post
        """
        return self.business.create_guest(
            request=request,
            name=body.name,
            group_tag=body.group_tag,
            rsvp_status=body.rsvp_status,
            meal_preference=body.meal_preference
        )

    def ActionGuestsRsvpPut(self, request: Request, body: GuestRsvpRequest):
        """
        更新宾客RSVP状态，自动记录时间戳
        PUT /api/guests/rsvp/put
        """
        return self.business.update_guest_rsvp(
            request=request,
            guest_id=body.id,
            rsvp_status=body.rsvp_status,
            meal_preference=body.meal_preference
        )

    def ActionGuestsPut(self, request: Request, body: GuestUpdateRequest):
        """
        更新宾客信息
        PUT /api/guests/put
        """
        kwargs = {}
        if body.name is not None:
            kwargs['name'] = body.name
        if body.group_tag is not None:
            kwargs['group_tag'] = body.group_tag
        if body.rsvp_status is not None:
            kwargs['rsvp_status'] = body.rsvp_status
        if body.meal_preference is not None:
            kwargs['meal_preference'] = body.meal_preference
        return self.business.update_guest(request, body.id, **kwargs)

    def ActionGuestsDelete(self, request: Request, body: DeleteRequest):
        """
        删除宾客（仅策划师）
        DELETE /api/guests/delete
        """
        return self.business.delete_guest(request, body.id)

    # ==================== Budget Items ====================
    def ActionBudgetItemsGet(self, request: Request,
                             category: Optional[str] = Query(None)):
        """
        获取预算项目列表及汇总
        GET /api/budget/items/get
        """
        return self.business.get_budget_items(category)

    def ActionBudgetItemsPost(self, request: Request, body: BudgetItemCreateRequest):
        """
        添加预算项目（五大固定类别）
        POST /api/budget/items/post
        """
        return self.business.create_budget_item(
            request=request,
            category=body.category,
            item_name=body.item_name,
            estimated_cost=body.estimated_cost,
            actual_cost=body.actual_cost,
            paid=body.paid
        )

    def ActionBudgetItemsPut(self, request: Request, body: BudgetItemUpdateRequest):
        """
        更新预算项目
        PUT /api/budget/items/put
        """
        kwargs = {}
        if body.category is not None:
            kwargs['category'] = body.category
        if body.item_name is not None:
            kwargs['item_name'] = body.item_name
        if body.estimated_cost is not None:
            kwargs['estimated_cost'] = body.estimated_cost
        if body.actual_cost is not None:
            kwargs['actual_cost'] = body.actual_cost
        if body.paid is not None:
            kwargs['paid'] = body.paid
        return self.business.update_budget_item(request, body.id, **kwargs)

    def ActionBudgetItemsDelete(self, request: Request, body: DeleteRequest):
        """
        删除预算项目（仅策划师）
        DELETE /api/budget/items/delete
        """
        return self.business.delete_budget_item(request, body.id)

    # ==================== Vendors ====================
    def ActionVendorsGet(self, request: Request):
        """
        获取供应商联络簿及到期提醒
        GET /api/vendors/get
        """
        return self.business.get_vendors()

    def ActionVendorsPost(self, request: Request, body: VendorCreateRequest):
        """
        添加供应商
        POST /api/vendors/post
        """
        return self.business.create_vendor(
            request=request,
            name=body.name,
            service=body.service,
            contact=body.contact,
            contract_deadline=body.contract_deadline
        )

    def ActionVendorsPut(self, request: Request, body: VendorUpdateRequest):
        """
        更新供应商信息
        PUT /api/vendors/put
        """
        kwargs = {}
        if body.name is not None:
            kwargs['name'] = body.name
        if body.service is not None:
            kwargs['service'] = body.service
        if body.contact is not None:
            kwargs['contact'] = body.contact
        if body.contract_deadline is not None:
            kwargs['contract_deadline'] = body.contract_deadline
        return self.business.update_vendor(request, body.id, **kwargs)

    def ActionVendorsDelete(self, request: Request, body: DeleteRequest):
        """
        删除供应商（仅策划师）
        DELETE /api/vendors/delete
        """
        return self.business.delete_vendor(request, body.id)

    # ==================== Tasks ====================
    def ActionTasksGet(self, request: Request):
        """
        获取任务清单（未完成置顶）
        GET /api/tasks/get
        """
        return self.business.get_tasks()

    def ActionTasksPost(self, request: Request, body: TaskCreateRequest):
        """
        添加任务
        POST /api/tasks/post
        """
        return self.business.create_task(
            request=request,
            title=body.title,
            deadline=body.deadline,
            priority=body.priority
        )

    def ActionTasksTogglePut(self, request: Request, body: TaskToggleRequest):
        """
        切换任务完成状态
        PUT /api/tasks/toggle/put
        """
        return self.business.toggle_task_done(request, body.id)

    def ActionTasksPut(self, request: Request, body: TaskUpdateRequest):
        """
        更新任务信息
        PUT /api/tasks/put
        """
        kwargs = {}
        if body.title is not None:
            kwargs['title'] = body.title
        if body.deadline is not None:
            kwargs['deadline'] = body.deadline
        if body.priority is not None:
            kwargs['priority'] = body.priority
        if body.done is not None:
            kwargs['done'] = body.done
        return self.business.update_task(request, body.id, **kwargs)

    def ActionTasksDelete(self, request: Request, body: DeleteRequest):
        """
        删除任务
        DELETE /api/tasks/delete
        """
        return self.business.delete_task(request, body.id)

    # ==================== Countdown & Settings ====================
    def ActionCountdownGet(self, request: Request):
        """
        获取婚礼倒计时
        GET /api/countdown/get
        """
        return self.business.get_countdown()

    def ActionSettingsGet(self, request: Request):
        """
        获取所有配置
        GET /api/settings/get
        """
        return self.business.get_all_settings()

    def ActionSettingsPut(self, request: Request, body: SettingUpdateRequest):
        """
        更新配置（婚礼日期、预算等）
        PUT /api/settings/put
        """
        return self.business.update_setting(request, body.key, body.value)

    # ==================== Role Info ====================
    def ActionRoleGet(self, request: Request):
        """
        获取当前角色及权限信息
        GET /api/role/get
        """
        return self.business.get_role_info(request)
