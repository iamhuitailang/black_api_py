from typing import Optional, List
from fastapi import Query, Request
from pydantic import BaseModel, Field
from app.business.meeting import ProjectBusiness


class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = ''


class ProjectUpdateRequest(BaseModel):
    id: int
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectController:
    def __init__(self):
        self.business = ProjectBusiness()

    def ActionProjectList(self, request: Request):
        """
        获取项目列表
        GET /api/project/list
        """
        result = self.business.get_list()
        return result

    def ActionProjectGet(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取项目详情
        GET /api/project/get
        参数: id - 项目ID
        """
        result = self.business.get_by_id(id)
        return result

    def ActionProjectCreatePost(self, request: Request, body: ProjectCreateRequest):
        """
        创建项目
        POST /api/project/create
        """
        result = self.business.create(body.name, body.description or '')
        return result

    def ActionProjectUpdatePost(self, request: Request, body: ProjectUpdateRequest):
        """
        更新项目
        POST /api/project/update
        """
        result = self.business.update(body.id, body.name, body.description)
        return result

    def ActionProjectDelete(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除项目
        DELETE /api/project/delete
        参数: id - 项目ID
        """
        result = self.business.delete(id)
        return result
