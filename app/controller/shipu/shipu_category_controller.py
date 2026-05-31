from typing import Optional
from fastapi import Request, Query


class ShipuCategoryController:
    def __init__(self):
        from app.business.shipu.category_business import ShipuCategoryBusiness
        self.category_business = ShipuCategoryBusiness()

    def ActionShipuCategoryAllGet(self, request: Request):
        """
        获取所有分类接口
        GET /api/shipu/category/all/get
        获取所有启用的分类列表
        """
        return self.category_business.get_all()

    def ActionShipuCategoryListGet(self, request: Request, page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  keyword: Optional[str] = Query(None, description="搜索关键词")):
        """
        获取分类列表接口
        GET /api/shipu/category/list/get
        分页获取分类列表
        """
        return self.category_business.get_list(page, page_size, keyword)

    def ActionShipuCategoryDetailGet(self, request: Request, category_id: int = Query(..., description="分类ID")):
        """
        获取分类详情接口
        GET /api/shipu/category/detail/get
        根据分类ID获取分类详情
        """
        return self.category_business.get_by_id(category_id)
