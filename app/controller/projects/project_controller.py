from typing import Optional, List
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.projects import ProjectBusiness


class AddProjectRequest(BaseModel):
    github_url: str
    tags: Optional[List[str]] = None
    priority: Optional[str] = 'want_to_read'
    note: Optional[str] = None


class UpdateProjectRequest(BaseModel):
    id: int
    tags: Optional[List[str]] = None
    priority: Optional[str] = None
    note: Optional[str] = None


class BatchDeleteRequest(BaseModel):
    ids: List[int]


class ProjectController:
    def __init__(self):
        self.business = ProjectBusiness()

    async def ActionProjectsAddPost(self, request: Request, body: AddProjectRequest):
        """
        添加项目到收藏夹
        POST /api/projects/add
        请求体: { github_url: "GitHub仓库URL", tags: ["标签1", "标签2"], priority: "want_to_read", note: "笔记" }
        """
        result = await self.business.add_project(
            github_url=body.github_url,
            tags=body.tags,
            priority=body.priority or 'want_to_read',
            note=body.note
        )
        return result

    def ActionProjectsListGet(self, request: Request,
                          search: Optional[str] = Query(None),
                          language: Optional[str] = Query(None),
                          priority: Optional[str] = Query(None),
                          tag: Optional[str] = Query(None)):
        """
        获取项目列表（支持多条件筛选）
        GET /api/projects/list
        参数: search - 搜索项目名和笔记, language - 按语言筛选, priority - 按优先级筛选, tag - 按标签筛选
        """
        result = self.business.get_projects(
            search=search,
            language=language,
            priority=priority,
            tag=tag
        )
        return result

    def ActionProjectsLanguagesGet(self, request: Request):
        """
        获取所有可用的编程语言列表
        GET /api/projects/languages
        """
        result = self.business.get_languages()
        return result

    def ActionProjectsRandomGet(self, request: Request):
        """
        随机推荐一个"想看"的项目
        GET /api/projects/random
        """
        result = self.business.get_random_project()
        return result

    def ActionProjectsUpdatePut(self, request: Request, body: UpdateProjectRequest):
        """
        更新项目信息（标签/优先级/笔记）
        PUT /api/projects/update/put
        请求体: { id: 1, tags: [], priority: "want_to_read", note: "笔记" }
        """
        result = self.business.update_project(
            project_id=body.id,
            tags=body.tags,
            priority=body.priority,
            note=body.note
        )
        return result

    def ActionProjectsDeleteDelete(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除单个项目
        DELETE /api/projects/delete
        参数: id - 要删除的项目ID
        """
        result = self.business.delete_project(project_id=id)
        return result

    def ActionProjectsBatchdeletePost(self, request: Request, body: BatchDeleteRequest):
        """
        批量删除项目
        POST /api/projects/batch-delete
        请求体: { ids: [1, 2, 3] }
        """
        result = self.business.batch_delete_projects(ids=body.ids)
        return result
