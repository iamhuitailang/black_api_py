from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateMapRequest(BaseModel):
    title: Optional[str] = Field('未命名思维导图', description="标题")
    description: Optional[str] = Field('', description="描述")
    theme: Optional[str] = Field('classic', description="主题")
    layout: Optional[str] = Field('right', description="布局")


class CreateMapFromTemplateRequest(BaseModel):
    template_id: int = Field(..., description="模板ID")
    title: Optional[str] = Field('', description="标题")


class UpdateMapRequest(BaseModel):
    title: Optional[str] = Field(None, description="标题")
    description: Optional[str] = Field(None, description="描述")
    theme: Optional[str] = Field(None, description="主题")
    layout: Optional[str] = Field(None, description="布局")
    status: Optional[int] = Field(None, description="状态")
    is_template: Optional[int] = Field(None, description="是否模板")
    thumbnail: Optional[str] = Field(None, description="缩略图")


class CreateNodeRequest(BaseModel):
    text: Optional[str] = Field('', description="文本")
    parent_id: Optional[int] = Field(0, description="父节点ID")
    x: Optional[float] = Field(0, description="X坐标")
    y: Optional[float] = Field(0, description="Y坐标")
    width: Optional[float] = Field(120, description="宽度")
    height: Optional[float] = Field(40, description="高度")
    bg_color: Optional[str] = Field('#409eff', description="背景色")
    text_color: Optional[str] = Field('#ffffff', description="文字色")
    font_size: Optional[int] = Field(14, description="字号")
    shape: Optional[str] = Field('rect', description="形状")
    note: Optional[str] = Field('', description="备注")


class UpdateNodeRequest(BaseModel):
    text: Optional[str] = Field(None, description="文本")
    parent_id: Optional[int] = Field(None, description="父节点ID")
    x: Optional[float] = Field(None, description="X坐标")
    y: Optional[float] = Field(None, description="Y坐标")
    width: Optional[float] = Field(None, description="宽度")
    height: Optional[float] = Field(None, description="高度")
    bg_color: Optional[str] = Field(None, description="背景色")
    text_color: Optional[str] = Field(None, description="文字色")
    font_size: Optional[int] = Field(None, description="字号")
    shape: Optional[str] = Field(None, description="形状")
    note: Optional[str] = Field(None, description="备注")
    priority: Optional[int] = Field(None, description="优先级")
    is_collapsed: Optional[int] = Field(None, description="是否折叠")


class BatchUpdateNodesRequest(BaseModel):
    nodes: List[dict] = Field(..., description="节点列表")


class CreateEdgeRequest(BaseModel):
    source_id: int = Field(..., description="源节点ID")
    target_id: int = Field(..., description="目标节点ID")
    label: Optional[str] = Field('', description="标签")
    line_type: Optional[str] = Field('curve', description="线型")
    line_color: Optional[str] = Field('#909399', description="线颜色")
    line_width: Optional[float] = Field(2, description="线宽")


class UpdateEdgeRequest(BaseModel):
    label: Optional[str] = Field(None, description="标签")
    line_type: Optional[str] = Field(None, description="线型")
    line_color: Optional[str] = Field(None, description="线颜色")
    line_width: Optional[float] = Field(None, description="线宽")


class SiweiMindmapController:
    def __init__(self):
        from app.business.siwei_077.mindmap_business import SiweiMindmapBusiness
        from app.business.siwei_077.user_business import SiweiUserBusiness
        self.mindmap_business = SiweiMindmapBusiness()
        self.user_business = SiweiUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionSiweiMapCreatePost(self, request: Request, body: CreateMapRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        创建思维导图接口
        POST /api/siwei/map/create
        创建新的思维导图，自动生成根节点
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.mindmap_business.create_map(
            user_id=user.get('id'),
            title=body.title,
            description=body.description,
            theme=body.theme,
            layout=body.layout
        )

    def ActionSiweiMapFromTemplateCreatePost(self, request: Request, body: CreateMapFromTemplateRequest,
                                                authorization: Optional[str] = Header(None)):
        """
        从模板创建思维导图接口
        POST /api/siwei/map/from/template/create
        根据模板创建思维导图
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.mindmap_business.create_map_from_template(
            user_id=user.get('id'),
            template_id=body.template_id,
            title=body.title
        )

    def ActionSiweiMapDetailGet(self, request: Request, map_id: int = Query(..., description="导图ID"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取思维导图详情接口
        GET /api/siwei/map/detail/get
        获取导图详情，包含所有节点和连线
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else None
        return self.mindmap_business.get_map_detail(map_id, user_id)

    def ActionSiweiMapUpdatePost(self, request: Request, map_id: int = Query(..., description="导图ID"),
                                   body: UpdateMapRequest = None,
                                   authorization: Optional[str] = Header(None)):
        """
        更新思维导图接口
        POST /api/siwei/map/update
        更新导图标题、描述、主题等
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.description is not None:
            data['description'] = body.description
        if body.theme is not None:
            data['theme'] = body.theme
        if body.layout is not None:
            data['layout'] = body.layout
        if body.status is not None:
            data['status'] = body.status
        if body.is_template is not None:
            data['is_template'] = body.is_template
        if body.thumbnail is not None:
            data['thumbnail'] = body.thumbnail
        return self.mindmap_business.update_map(user.get('id'), map_id, data)

    def ActionSiweiMapDeletePost(self, request: Request, map_id: int = Query(..., description="导图ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        删除思维导图接口
        POST /api/siwei/map/delete
        删除导图及其所有节点和连线
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.mindmap_business.delete_map(user.get('id'), map_id)

    def ActionSiweiMapMyListGet(self, request: Request,
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  keyword: Optional[str] = Query(None, description="搜索关键词"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取我的思维导图列表接口
        GET /api/siwei/map/my/list/get
        获取当前用户创建的思维导图列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.mindmap_business.get_my_maps(user.get('id'), page, page_size, keyword)

    def ActionSiweiMapSharedListGet(self, request: Request,
                                      page: int = Query(1, ge=1, description="页码"),
                                      page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                      keyword: Optional[str] = Query(None, description="搜索关键词")):
        """
        获取公开思维导图列表接口
        GET /api/siwei/map/shared/list/get
        获取公开分享的思维导图列表
        """
        return self.mindmap_business.get_shared_maps(page, page_size, keyword)

    def ActionSiweiNodeCreatePost(self, request: Request, map_id: int = Query(..., description="导图ID"),
                                    body: CreateNodeRequest = None,
                                    authorization: Optional[str] = Header(None)):
        """
        创建节点接口
        POST /api/siwei/node/create
        在思维导图中创建新节点
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        data = body.dict()
        return self.mindmap_business.create_node(user.get('id'), map_id, data)

    def ActionSiweiNodeUpdatePost(self, request: Request, map_id: int = Query(..., description="导图ID"),
                                    node_id: int = Query(..., description="节点ID"),
                                    body: UpdateNodeRequest = None,
                                    authorization: Optional[str] = Header(None)):
        """
        更新节点接口
        POST /api/siwei/node/update
        更新节点的文本、位置、样式等
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        data = {}
        if body.text is not None:
            data['text'] = body.text
        if body.parent_id is not None:
            data['parent_id'] = body.parent_id
        if body.x is not None:
            data['x'] = body.x
        if body.y is not None:
            data['y'] = body.y
        if body.width is not None:
            data['width'] = body.width
        if body.height is not None:
            data['height'] = body.height
        if body.bg_color is not None:
            data['bg_color'] = body.bg_color
        if body.text_color is not None:
            data['text_color'] = body.text_color
        if body.font_size is not None:
            data['font_size'] = body.font_size
        if body.shape is not None:
            data['shape'] = body.shape
        if body.note is not None:
            data['note'] = body.note
        if body.priority is not None:
            data['priority'] = body.priority
        if body.is_collapsed is not None:
            data['is_collapsed'] = body.is_collapsed
        return self.mindmap_business.update_node(user.get('id'), map_id, node_id, data)

    def ActionSiweiNodeDeletePost(self, request: Request, map_id: int = Query(..., description="导图ID"),
                                    node_id: int = Query(..., description="节点ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除节点接口
        POST /api/siwei/node/delete
        删除节点及其子节点和连线
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.mindmap_business.delete_node(user.get('id'), map_id, node_id)

    def ActionSiweiNodeBatchUpdatePost(self, request: Request, map_id: int = Query(..., description="导图ID"),
                                         body: BatchUpdateNodesRequest = None,
                                         authorization: Optional[str] = Header(None)):
        """
        批量更新节点接口
        POST /api/siwei/node/batch/update
        批量更新多个节点（拖拽后保存位置）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.mindmap_business.batch_update_nodes(user.get('id'), map_id, body.nodes)

    def ActionSiweiEdgeCreatePost(self, request: Request, map_id: int = Query(..., description="导图ID"),
                                    body: CreateEdgeRequest = None,
                                    authorization: Optional[str] = Header(None)):
        """
        创建连线接口
        POST /api/siwei/edge/create
        创建节点间的连线
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        data = body.dict()
        return self.mindmap_business.create_edge(user.get('id'), map_id, data)

    def ActionSiweiEdgeUpdatePost(self, request: Request, map_id: int = Query(..., description="导图ID"),
                                    edge_id: int = Query(..., description="连线ID"),
                                    body: UpdateEdgeRequest = None,
                                    authorization: Optional[str] = Header(None)):
        """
        更新连线接口
        POST /api/siwei/edge/update
        更新连线的样式和标签
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        data = {}
        if body.label is not None:
            data['label'] = body.label
        if body.line_type is not None:
            data['line_type'] = body.line_type
        if body.line_color is not None:
            data['line_color'] = body.line_color
        if body.line_width is not None:
            data['line_width'] = body.line_width
        return self.mindmap_business.update_edge(user.get('id'), map_id, edge_id, data)

    def ActionSiweiEdgeDeletePost(self, request: Request, map_id: int = Query(..., description="导图ID"),
                                    edge_id: int = Query(..., description="连线ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除连线接口
        POST /api/siwei/edge/delete
        删除节点间的连线
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.mindmap_business.delete_edge(user.get('id'), map_id, edge_id)

    def ActionSiweiThemeListGet(self, request: Request):
        """
        获取主题列表接口
        GET /api/siwei/theme/list/get
        获取所有可用的视觉主题
        """
        return self.mindmap_business.get_themes()

    def ActionSiweiLayoutListGet(self, request: Request):
        """
        获取布局列表接口
        GET /api/siwei/layout/list/get
        获取所有可用的布局方式
        """
        return self.mindmap_business.get_layouts()
