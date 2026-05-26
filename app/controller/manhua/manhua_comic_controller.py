from typing import Optional
from fastapi import Request, Header, Query


class ManhuaComicController:
    def __init__(self):
        from app.business.manhua.comic_business import ManhuaComicBusiness
        self.comic_business = ManhuaComicBusiness()

    def ActionManhuaComicListGet(self, request: Request,
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(20, description="每页数量"),
                                  category: Optional[str] = Query(None, description="分类"),
                                  status: Optional[str] = Query(None, description="状态")):
        return self.comic_business.get_comic_list(page, page_size, category, status)

    def ActionManhuaComicDetailGet(self, request: Request,
                                    comic_id: int = Query(..., description="漫画ID")):
        return self.comic_business.get_comic_detail(comic_id)

    def ActionManhuaComicRecommendGet(self, request: Request,
                                       page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量")):
        return self.comic_business.get_recommend_list(page, page_size)

    def ActionManhuaComicHotGet(self, request: Request,
                                 page: int = Query(1, description="页码"),
                                 page_size: int = Query(20, description="每页数量")):
        return self.comic_business.get_hot_list(page, page_size)

    def ActionManhuaComicSearchGet(self, request: Request,
                                    keyword: str = Query(..., description="搜索关键词"),
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(20, description="每页数量")):
        return self.comic_business.search_comics(keyword, page, page_size)

    def ActionManhuaComicChapterGet(self, request: Request,
                                     comic_id: int = Query(..., description="漫画ID"),
                                     chapter_no: int = Query(..., description="章节号")):
        return self.comic_business.get_chapter(comic_id, chapter_no)

    def ActionManhuaComicCategoriesGet(self, request: Request):
        return self.comic_business.get_categories()