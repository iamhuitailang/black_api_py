from typing import Optional, List
from fastapi import Query, Request
from pydantic import BaseModel, Field
from app.business.meeting import MeetingBusiness


class ActionItemRequest(BaseModel):
    content: str
    assignee: Optional[str] = ''
    due_date: Optional[str] = ''
    completed: Optional[bool] = False


class MeetingCreateRequest(BaseModel):
    project_id: Optional[int] = 0
    title: str
    date: str
    attendees: Optional[List[str]] = []
    content: Optional[str] = ''
    action_items: Optional[List[ActionItemRequest]] = []


class MeetingUpdateRequest(BaseModel):
    id: int
    project_id: Optional[int] = None
    title: Optional[str] = None
    date: Optional[str] = None
    attendees: Optional[List[str]] = None
    content: Optional[str] = None
    action_items: Optional[List[ActionItemRequest]] = None


class MeetingController:
    def __init__(self):
        self.business = MeetingBusiness()

    def ActionMeetingList(self, request: Request,
                          keyword: Optional[str] = Query(None),
                          start_date: Optional[str] = Query(None),
                          end_date: Optional[str] = Query(None),
                          attendee: Optional[str] = Query(None),
                          project_id: Optional[int] = Query(None),
                          page: int = Query(1, ge=1),
                          page_size: int = Query(20, ge=1, le=100)):
        """
        获取会议列表（支持搜索和筛选）
        GET /api/meeting/list
        """
        result = self.business.get_list(
            keyword=keyword,
            start_date=start_date,
            end_date=end_date,
            attendee=attendee,
            project_id=project_id,
            page=page,
            page_size=page_size
        )
        return result

    def ActionMeetingGet(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取会议详情
        GET /api/meeting/get
        参数: id - 会议ID
        """
        result = self.business.get_by_id(id)
        return result

    def ActionMeetingCreatePost(self, request: Request, body: MeetingCreateRequest):
        """
        创建会议纪要
        POST /api/meeting/create
        """
        action_items = None
        if body.action_items:
            action_items = [item.model_dump() for item in body.action_items]

        result = self.business.create(
            project_id=body.project_id or 0,
            title=body.title,
            date=body.date,
            attendees=body.attendees or [],
            content=body.content or '',
            action_items=action_items
        )
        return result

    def ActionMeetingUpdatePost(self, request: Request, body: MeetingUpdateRequest):
        """
        更新会议纪要
        POST /api/meeting/update
        """
        action_items = None
        if body.action_items is not None:
            action_items = [item.model_dump() for item in body.action_items]

        result = self.business.update(
            meeting_id=body.id,
            project_id=body.project_id,
            title=body.title,
            date=body.date,
            attendees=body.attendees,
            content=body.content,
            action_items=action_items
        )
        return result

    def ActionMeetingDelete(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除会议纪要
        DELETE /api/meeting/delete
        参数: id - 会议ID
        """
        result = self.business.delete(id)
        return result

    def ActionMeetingSearch(self, request: Request,
                            keyword: str = Query(..., min_length=1),
                            page: int = Query(1, ge=1),
                            page_size: int = Query(20, ge=1, le=100)):
        """
        搜索会议（全文搜索标题和内容）
        GET /api/meeting/search
        """
        result = self.business.search(keyword, page, page_size)
        return result

    def ActionMeetingAttendees(self, request: Request):
        """
        获取所有参会人列表
        GET /api/meeting/attendees
        """
        result = self.business.get_attendees()
        return result
