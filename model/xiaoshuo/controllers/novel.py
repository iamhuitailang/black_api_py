from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.response import ok, fail, page_ok
from ..schemas.novel import (
    NovelCreate,
    NovelUpdate,
    NovelQuery,
    ChapterCreate,
    ChapterUpdate,
    CategoryCreate,
    CategoryUpdate,
    ShelfItemCreate,
    ShelfItemUpdate,
    ShelfQuery,
    ReadingRecordCreate,
    BookmarkCreate,
    CommentCreate,
    BannerCreate,
    OfflineCacheCreate,
)
from ..business.novel import (
    NovelBusiness,
    ChapterBusiness,
    CategoryBusiness,
    ShelfBusiness,
    ReadingRecordBusiness,
    BookmarkBusiness,
    CommentBusiness,
    BannerBusiness,
    OfflineCacheBusiness,
)

router = APIRouter()
USER_ID = 1


@router.get("/novel/list")
def novel_list(
    keyword: Optional[str] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    is_hot: Optional[bool] = None,
    is_recommend: Optional[bool] = None,
    is_finished: Optional[bool] = None,
    sort_by: str = "updated_at",
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    query = NovelQuery(
        keyword=keyword,
        category_id=category_id,
        status=status,
        is_hot=is_hot,
        is_recommend=is_recommend,
        is_finished=is_finished,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )
    items, total = NovelBusiness.list(db, query)
    return page_ok(items, total, page, page_size)


@router.get("/novel/detail/{id}")
def novel_detail(id: int, db: Session = Depends(get_db)):
    NovelBusiness.increment_click(db, id)
    item = NovelBusiness.get(db, id)
    if not item:
        return fail(message="小说不存在")
    return ok(item)


@router.post("/novel/create")
def novel_create(data: NovelCreate, db: Session = Depends(get_db)):
    item = NovelBusiness.create(db, data)
    return ok(item, "创建成功")


@router.put("/novel/update/{id}")
def novel_update(id: int, data: NovelUpdate, db: Session = Depends(get_db)):
    item = NovelBusiness.update(db, id, data)
    if not item:
        return fail(message="小说不存在")
    return ok(item, "更新成功")


@router.delete("/novel/delete/{id}")
def novel_delete(id: int, db: Session = Depends(get_db)):
    if NovelBusiness.delete(db, id):
        return ok(message="删除成功")
    return fail(message="删除失败")


@router.get("/novel/hot")
def novel_hot(limit: int = 10, db: Session = Depends(get_db)):
    items = NovelBusiness.hot_list(db, limit)
    return ok(items)


@router.get("/novel/recommend")
def novel_recommend(limit: int = 10, db: Session = Depends(get_db)):
    items = NovelBusiness.recommend_list(db, limit)
    return ok(items)


@router.get("/novel/finished")
def novel_finished(limit: int = 10, db: Session = Depends(get_db)):
    items = NovelBusiness.finished_list(db, limit)
    return ok(items)


@router.get("/novel/latest")
def novel_latest(limit: int = 10, db: Session = Depends(get_db)):
    items = NovelBusiness.latest_list(db, limit)
    return ok(items)


@router.get("/novel/rank/click")
def novel_rank_click(limit: int = 10, db: Session = Depends(get_db)):
    return ok(NovelBusiness.click_rank(db, limit))


@router.get("/novel/rank/recommend")
def novel_rank_recommend(limit: int = 10, db: Session = Depends(get_db)):
    return ok(NovelBusiness.recommend_rank(db, limit))


@router.get("/novel/rank/new")
def novel_rank_new(limit: int = 10, db: Session = Depends(get_db)):
    return ok(NovelBusiness.new_book_rank(db, limit))


@router.get("/novel/similar/{id}")
def novel_similar(id: int, limit: int = 6, db: Session = Depends(get_db)):
    item = NovelBusiness.get(db, id)
    if not item:
        return fail(message="小说不存在")
    items = NovelBusiness.similar_list(db, item["category_id"], id, limit)
    return ok(items)


@router.get("/chapter/list/{novel_id}")
def chapter_list(novel_id: int, simple: bool = True, db: Session = Depends(get_db)):
    items = ChapterBusiness.list_by_novel(db, novel_id, simple)
    return ok(items)


@router.get("/chapter/detail/{id}")
def chapter_detail(id: int, db: Session = Depends(get_db)):
    item = ChapterBusiness.get(db, id)
    if not item:
        return fail(message="章节不存在")
    return ok(item)


@router.get("/chapter/prev")
def chapter_prev(novel_id: int, chapter_no: int, db: Session = Depends(get_db)):
    item = ChapterBusiness.get_prev(db, novel_id, chapter_no)
    if not item:
        return fail(message="已经是第一章")
    return ok(item)


@router.get("/chapter/next")
def chapter_next(novel_id: int, chapter_no: int, db: Session = Depends(get_db)):
    item = ChapterBusiness.get_next(db, novel_id, chapter_no)
    if not item:
        return fail(message="已经是最后一章")
    return ok(item)


@router.post("/chapter/create")
def chapter_create(data: ChapterCreate, db: Session = Depends(get_db)):
    item = ChapterBusiness.create(db, data)
    return ok(item, "创建成功")


@router.put("/chapter/update/{id}")
def chapter_update(id: int, data: ChapterUpdate, db: Session = Depends(get_db)):
    item = ChapterBusiness.update(db, id, data)
    if not item:
        return fail(message="章节不存在")
    return ok(item, "更新成功")


@router.delete("/chapter/delete/{id}")
def chapter_delete(id: int, db: Session = Depends(get_db)):
    if ChapterBusiness.delete(db, id):
        return ok(message="删除成功")
    return fail(message="删除失败")


@router.get("/category/list")
def category_list(db: Session = Depends(get_db)):
    items = CategoryBusiness.list(db)
    return ok(items)


@router.post("/category/create")
def category_create(data: CategoryCreate, db: Session = Depends(get_db)):
    item = CategoryBusiness.create(db, data)
    return ok(item, "创建成功")


@router.put("/category/update/{id}")
def category_update(id: int, data: CategoryUpdate, db: Session = Depends(get_db)):
    item = CategoryBusiness.update(db, id, data)
    if not item:
        return fail(message="分类不存在")
    return ok(item, "更新成功")


@router.delete("/category/delete/{id}")
def category_delete(id: int, db: Session = Depends(get_db)):
    if CategoryBusiness.delete(db, id):
        return ok(message="删除成功")
    return fail(message="删除失败")


@router.get("/shelf/list")
def shelf_list(
    group_name: Optional[str] = None,
    sort_by: str = "updated_at",
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
):
    query = ShelfQuery(group_name=group_name, sort_by=sort_by, page=page, page_size=page_size)
    items, total = ShelfBusiness.list(db, USER_ID, query)
    return page_ok(items, total, page, page_size)


@router.get("/shelf/stats")
def shelf_stats(db: Session = Depends(get_db)):
    stats = ShelfBusiness.stats(db, USER_ID)
    return ok(stats)


@router.get("/shelf/groups")
def shelf_groups(db: Session = Depends(get_db)):
    groups = ShelfBusiness.group_list(db, USER_ID)
    return ok(groups)


@router.post("/shelf/create")
def shelf_create(data: ShelfItemCreate, db: Session = Depends(get_db)):
    item = ShelfBusiness.create(db, USER_ID, data)
    return ok(item, "加入书架成功")


@router.put("/shelf/update/{id}")
def shelf_update(id: int, data: ShelfItemUpdate, db: Session = Depends(get_db)):
    item = ShelfBusiness.update(db, id, data)
    if not item:
        return fail(message="书架项不存在")
    return ok(item, "更新成功")


@router.delete("/shelf/delete/{id}")
def shelf_delete(id: int, db: Session = Depends(get_db)):
    if ShelfBusiness.delete(db, id):
        return ok(message="移除成功")
    return fail(message="移除失败")


@router.get("/reading/last")
def reading_last(novel_id: int, db: Session = Depends(get_db)):
    item = ReadingRecordBusiness.get_last(db, USER_ID, novel_id)
    return ok(item)


@router.post("/reading/save")
def reading_save(data: ReadingRecordCreate, db: Session = Depends(get_db)):
    item = ReadingRecordBusiness.create(db, USER_ID, data)
    return ok(item, "保存成功")


@router.get("/bookmark/list")
def bookmark_list(novel_id: Optional[int] = None, db: Session = Depends(get_db)):
    items = BookmarkBusiness.list(db, USER_ID, novel_id)
    return ok(items)


@router.post("/bookmark/create")
def bookmark_create(data: BookmarkCreate, db: Session = Depends(get_db)):
    item = BookmarkBusiness.create(db, USER_ID, data)
    return ok(item, "添加书签成功")


@router.delete("/bookmark/delete/{id}")
def bookmark_delete(id: int, db: Session = Depends(get_db)):
    if BookmarkBusiness.delete(db, id):
        return ok(message="删除成功")
    return fail(message="删除失败")


@router.get("/comment/list")
def comment_list(
    novel_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    items, total = CommentBusiness.list(db, novel_id, page, page_size)
    return page_ok(items, total, page, page_size)


@router.post("/comment/create")
def comment_create(data: CommentCreate, db: Session = Depends(get_db)):
    item = CommentBusiness.create(db, data)
    return ok(item, "评论成功")


@router.get("/banner/list")
def banner_list(db: Session = Depends(get_db)):
    items = BannerBusiness.list(db)
    return ok(items)


@router.post("/banner/create")
def banner_create(data: BannerCreate, db: Session = Depends(get_db)):
    item = BannerBusiness.create(db, data)
    return ok(item, "创建成功")


@router.delete("/banner/delete/{id}")
def banner_delete(id: int, db: Session = Depends(get_db)):
    if BannerBusiness.delete(db, id):
        return ok(message="删除成功")
    return fail(message="删除失败")


@router.get("/offline/list")
def offline_list(novel_id: Optional[int] = None, db: Session = Depends(get_db)):
    items = OfflineCacheBusiness.list(db, USER_ID, novel_id)
    return ok(items)


@router.post("/offline/cache")
def offline_cache(data: OfflineCacheCreate, db: Session = Depends(get_db)):
    item = OfflineCacheBusiness.create(db, USER_ID, data)
    return ok(item, "缓存成功")


@router.delete("/offline/delete/{id}")
def offline_delete(id: int, db: Session = Depends(get_db)):
    if OfflineCacheBusiness.delete(db, id):
        return ok(message="删除成功")
    return fail(message="删除失败")


@router.get("/share/{novel_id}")
def share_novel(novel_id: int, db: Session = Depends(get_db)):
    item = NovelBusiness.get(db, novel_id)
    if not item:
        return fail(message="小说不存在")
    share_data = {
        "title": item["title"],
        "author": item["author"],
        "cover": item["cover"],
        "description": item["description"],
        "share_url": f"/novel/{novel_id}",
        "share_text": f"推荐一本好书《{item['title']}》-{item['author']}",
    }
    return ok(share_data)
