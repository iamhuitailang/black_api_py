from typing import Optional, List
from fastapi import Query, Request
from pydantic import BaseModel, Field
from app.business.renovation import RenovationBusiness


class RoomAddRequest(BaseModel):
    name: str = Field(..., description="房间名称")
    status: str = Field(default='not_started', description="状态: not_started/in_progress/completed")
    budget: float = Field(default=0, description="房间预算")


class RoomUpdateRequest(BaseModel):
    id: int = Field(..., description="房间ID")
    name: Optional[str] = Field(default=None, description="房间名称")
    status: Optional[str] = Field(default=None, description="状态: not_started/in_progress/completed")
    budget: Optional[float] = Field(default=None, description="房间预算")


class ExpenseAddRequest(BaseModel):
    room_id: int = Field(..., description="房间ID")
    category: str = Field(..., description="类别: 硬装/软装/家电/人工/其他")
    amount: float = Field(..., description="金额")
    date: str = Field(..., description="日期")
    note: str = Field(default='', description="备注")
    image_url: str = Field(default='', description="图片URL")


class ExpenseUpdateRequest(BaseModel):
    id: int = Field(..., description="花销ID")
    room_id: Optional[int] = Field(default=None, description="房间ID")
    category: Optional[str] = Field(default=None, description="类别")
    amount: Optional[float] = Field(default=None, description="金额")
    date: Optional[str] = Field(default=None, description="日期")
    note: Optional[str] = Field(default=None, description="备注")
    image_url: Optional[str] = Field(default=None, description="图片URL")


class BudgetSetRequest(BaseModel):
    total_budget: float = Field(..., description="总预算金额")


class RenovationController:
    def __init__(self):
        self.business = RenovationBusiness()

    def ActionRenovationRoomListGet(self, request: Request):
        """
        获取所有房间列表
        """
        return self.business.get_rooms()

    def ActionRenovationRoomAddPost(self, request: Request, body: RoomAddRequest):
        """
        新增房间
        """
        return self.business.add_room(name=body.name, status=body.status, budget=body.budget)

    def ActionRenovationRoomUpdatePost(self, request: Request, body: RoomUpdateRequest):
        """
        更新房间信息
        """
        return self.business.update_room(room_id=body.id, name=body.name, status=body.status, budget=body.budget)

    def ActionRenovationRoomDelete(self, request: Request, id: int = Query(..., ge=1, description="房间ID")):
        """
        删除房间
        """
        return self.business.delete_room(room_id=id)

    def ActionRenovationExpenseListGet(self, request: Request,
                                        room_id: Optional[int] = Query(default=None, description="房间ID"),
                                        category: Optional[str] = Query(default=None, description="类别"),
                                        start_date: Optional[str] = Query(default=None, description="开始日期"),
                                        end_date: Optional[str] = Query(default=None, description="结束日期")):
        """
        获取花销列表，支持按房间、类别、日期范围筛选
        """
        return self.business.get_expenses(room_id=room_id, category=category, start_date=start_date, end_date=end_date)

    def ActionRenovationExpenseAddPost(self, request: Request, body: ExpenseAddRequest):
        """
        新增花销记录
        """
        return self.business.add_expense(
            room_id=body.room_id, category=body.category, amount=body.amount,
            date=body.date, note=body.note, image_url=body.image_url
        )

    def ActionRenovationExpenseUpdatePost(self, request: Request, body: ExpenseUpdateRequest):
        """
        更新花销记录
        """
        return self.business.update_expense(
            expense_id=body.id, room_id=body.room_id, category=body.category,
            amount=body.amount, date=body.date, note=body.note, image_url=body.image_url
        )

    def ActionRenovationExpenseDelete(self, request: Request, id: int = Query(..., ge=1, description="花销ID")):
        """
        删除花销记录
        """
        return self.business.delete_expense(expense_id=id)

    def ActionRenovationBudgetGet(self, request: Request):
        """
        获取总预算、已花费、剩余
        """
        return self.business.get_budget()

    def ActionRenovationBudgetSet(self, request: Request, body: BudgetSetRequest):
        """
        设置总预算
        """
        return self.business.set_budget(total_budget=body.total_budget)

    def ActionRenovationStatsRoomGet(self, request: Request):
        """
        按房间汇总统计
        """
        return self.business.stats_by_room()

    def ActionRenovationStatsCategoryGet(self, request: Request):
        """
        按类别汇总统计
        """
        return self.business.stats_by_category()
