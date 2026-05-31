from typing import Optional
from fastapi import Request, Query


class SiweiTemplateController:
    def __init__(self):
        from app.business.siwei_077.template_business import SiweiTemplateBusiness
        self.template_business = SiweiTemplateBusiness()

    def ActionSiweiTemplateListGet(self, request: Request,
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                     category: Optional[str] = Query(None, description="分类")):
        """
        获取模板列表接口
        GET /api/siwei/template/list/get
        分页获取思维导图模板列表
        """
        return self.template_business.get_template_list(page, page_size, category)

    def ActionSiweiTemplateDetailGet(self, request: Request,
                                       template_id: int = Query(..., description="模板ID")):
        """
        获取模板详情接口
        GET /api/siwei/template/detail/get
        获取模板详细信息，包含节点和连线数据
        """
        return self.template_business.get_template_detail(template_id)

    def ActionSiweiTemplateCategoriesGet(self, request: Request):
        """
        获取模板分类列表接口
        GET /api/siwei/template/categories/get
        获取所有模板分类
        """
        return self.template_business.get_categories()
