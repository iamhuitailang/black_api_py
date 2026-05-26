from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateProjectRequest(BaseModel):
    name: str = Field(..., description="项目名称")
    description: Optional[str] = Field('', description="项目描述")
    color: Optional[str] = Field('#409EFF', description="项目颜色")
    icon: Optional[str] = Field('', description="项目图标")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateProjectRequest(BaseModel):
    name: Optional[str] = Field(None, description="项目名称")
    description: Optional[str] = Field(None, description="项目描述")
    color: Optional[str] = Field(None, description="项目颜色")
    icon: Optional[str] = Field(None, description="项目图标")
    sort_order: Optional[int] = Field(None, description="排序")
    status: Optional[int] = Field(None, description="状态")


class TodoProjectController:
    def __init__(self):
        from app.business.todo.todo_project_business import TodoProjectBusiness
        from app.business.todo.todo_auth_business import TodoAuthBusiness
        self.project_business = TodoProjectBusiness()
        self.auth_business = TodoAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.auth_business.verify_token(token)

    def ActionTodoProjectCreatePost(self, request: Request, body: CreateProjectRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建项目接口
        POST /api/todo/project/create
        创建新的任务项目
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.project_business.create(
            user_id=user.get('id'),
            name=body.name,
            description=body.description or '',
            color=body.color or '#409EFF',
            icon=body.icon or '',
            sort_order=body.sort_order or 0
        )

    def ActionTodoProjectUpdatePost(self, request: Request, body: UpdateProjectRequest,
                                     project_id: int = Query(..., description="项目ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        更新项目接口
        POST /api/todo/project/update
        更新项目信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.color is not None:
            data['color'] = body.color
        if body.icon is not None:
            data['icon'] = body.icon
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order
        if body.status is not None:
            data['status'] = body.status

        return self.project_business.update(
            project_id=project_id,
            user_id=user.get('id'),
            data=data
        )

    def ActionTodoProjectDeletePost(self, request: Request, project_id: int = Query(..., description="项目ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        删除项目接口
        POST /api/todo/project/delete
        删除项目及其下所有任务
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.project_business.delete(project_id, user.get('id'))

    def ActionTodoProjectDetailGet(self, request: Request, project_id: int = Query(..., description="项目ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取项目详情接口
        GET /api/todo/project/detail/get
        根据ID获取项目详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.project_business.get_by_id(project_id, user.get('id'))

    def ActionTodoProjectListGet(self, request: Request,
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  status: Optional[int] = Query(None, description="状态"),
                                  keyword: Optional[str] = Query(None, description="搜索关键词"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取项目列表接口
        GET /api/todo/project/list/get
        分页获取项目列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.project_business.get_list(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword
        )

    def ActionTodoProjectAllGet(self, request: Request,
                                 status: Optional[int] = Query(None, description="状态"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取所有项目接口
        GET /api/todo/project/all/get
        获取所有项目（不分页）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.project_business.get_all(user.get('id'), status)

    def ActionTodoProjectProgressGet(self, request: Request,
                                      project_id: int = Query(..., description="项目ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        获取项目进度接口
        GET /api/todo/project/progress/get
        获取项目的任务完成进度
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.project_business.get_progress(project_id, user.get('id'))

    def ActionTodoProjectArchivePost(self, request: Request,
                                      project_id: int = Query(..., description="项目ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        归档项目接口
        POST /api/todo/project/archive
        将项目标记为已归档
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.project_business.archive(project_id, user.get('id'))

    def ActionTodoProjectUnarchivePost(self, request: Request,
                                        project_id: int = Query(..., description="项目ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        取消归档项目接口
        POST /api/todo/project/unarchive
        将归档项目恢复为活动状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.project_business.unarchive(project_id, user.get('id'))
