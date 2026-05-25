from typing import Optional, List
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from ..models.novel import (
    Novel,
    Chapter,
    Category,
    ShelfItem,
    ReadingRecord,
    Bookmark,
    Comment,
    Banner,
    OfflineCache,
)
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


class NovelBusiness:
    @staticmethod
    def list(db: Session, query: NovelQuery):
        q = db.query(Novel)
        if query.keyword:
            like = f"%{query.keyword}%"
            q = q.filter(or_(Novel.title.like(like), Novel.author.like(like)))
        if query.category_id:
            q = q.filter(Novel.category_id == query.category_id)
        if query.status:
            q = q.filter(Novel.status == query.status)
        if query.is_hot is not None:
            q = q.filter(Novel.is_hot == query.is_hot)
        if query.is_recommend is not None:
            q = q.filter(Novel.is_recommend == query.is_recommend)
        if query.is_finished is not None:
            q = q.filter(Novel.is_finished == query.is_finished)
        total = q.count()
        sort_col = getattr(Novel, query.sort_by, Novel.updated_at)
        q = q.order_by(desc(sort_col))
        items = (
            q.offset((query.page - 1) * query.page_size)
            .limit(query.page_size)
            .all()
        )
        return [item.to_dict() for item in items], total

    @staticmethod
    def get(db: Session, id: int):
        item = db.query(Novel).filter(Novel.id == id).first()
        if not item:
            return None
        return item.to_dict()

    @staticmethod
    def create(db: Session, data: NovelCreate):
        item = Novel(**data.dict())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item.to_dict()

    @staticmethod
    def update(db: Session, id: int, data: NovelUpdate):
        item = db.query(Novel).filter(Novel.id == id).first()
        if not item:
            return None
        for k, v in data.dict(exclude_unset=True).items():
            setattr(item, k, v)
        db.commit()
        db.refresh(item)
        return item.to_dict()

    @staticmethod
    def delete(db: Session, id: int):
        item = db.query(Novel).filter(Novel.id == id).first()
        if not item:
            return False
        db.delete(item)
        db.commit()
        return True

    @staticmethod
    def hot_list(db: Session, limit: int = 10):
        items = db.query(Novel).filter(Novel.is_hot == True).order_by(desc(Novel.click_count)).limit(limit).all()
        return [item.to_dict() for item in items]

    @staticmethod
    def recommend_list(db: Session, limit: int = 10):
        items = db.query(Novel).filter(Novel.is_recommend == True).order_by(desc(Novel.updated_at)).limit(limit).all()
        return [item.to_dict() for item in items]

    @staticmethod
    def finished_list(db: Session, limit: int = 10):
        items = db.query(Novel).filter(Novel.is_finished == True).order_by(desc(Novel.updated_at)).limit(limit).all()
        return [item.to_dict() for item in items]

    @staticmethod
    def latest_list(db: Session, limit: int = 10):
        items = db.query(Novel).order_by(desc(Novel.updated_at)).limit(limit).all()
        return [item.to_dict() for item in items]

    @staticmethod
    def click_rank(db: Session, limit: int = 10):
        items = db.query(Novel).order_by(desc(Novel.click_count)).limit(limit).all()
        return [item.to_dict() for item in items]

    @staticmethod
    def new_book_rank(db: Session, limit: int = 10):
        items = db.query(Novel).order_by(desc(Novel.created_at)).limit(limit).all()
        return [item.to_dict() for item in items]

    @staticmethod
    def recommend_rank(db: Session, limit: int = 10):
        items = db.query(Novel).filter(Novel.is_recommend == True).order_by(desc(Novel.rating)).limit(limit).all()
        return [item.to_dict() for item in items]

    @staticmethod
    def similar_list(db: Session, category_id: int, exclude_id: int, limit: int = 6):
        items = (
            db.query(Novel)
            .filter(Novel.category_id == category_id, Novel.id != exclude_id)
            .order_by(desc(Novel.updated_at))
            .limit(limit)
            .all()
        )
        return [item.to_dict() for item in items]

    @staticmethod
    def increment_click(db: Session, id: int):
        item = db.query(Novel).filter(Novel.id == id).first()
        if item:
            item.click_count += 1
            db.commit()


class ChapterBusiness:
    @staticmethod
    def list_by_novel(db: Session, novel_id: int, simple: bool = False):
        items = (
            db.query(Chapter)
            .filter(Chapter.novel_id == novel_id)
            .order_by(asc(Chapter.chapter_no))
            .all()
        )
        if simple:
            return [item.to_dict_simple() for item in items]
        return [item.to_dict() for item in items]

    @staticmethod
    def get(db: Session, id: int):
        item = db.query(Chapter).filter(Chapter.id == id).first()
        if not item:
            return None
        return item.to_dict()

    @staticmethod
    def get_by_no(db: Session, novel_id: int, chapter_no: int):
        item = (
            db.query(Chapter)
            .filter(Chapter.novel_id == novel_id, Chapter.chapter_no == chapter_no)
            .first()
        )
        return item.to_dict() if item else None

    @staticmethod
    def get_prev(db: Session, novel_id: int, chapter_no: int):
        item = (
            db.query(Chapter)
            .filter(Chapter.novel_id == novel_id, Chapter.chapter_no < chapter_no)
            .order_by(desc(Chapter.chapter_no))
            .first()
        )
        return item.to_dict() if item else None

    @staticmethod
    def get_next(db: Session, novel_id: int, chapter_no: int):
        item = (
            db.query(Chapter)
            .filter(Chapter.novel_id == novel_id, Chapter.chapter_no > chapter_no)
            .order_by(asc(Chapter.chapter_no))
            .first()
        )
        return item.to_dict() if item else None

    @staticmethod
    def create(db: Session, data: ChapterCreate):
        item = Chapter(**data.dict())
        if not item.word_count:
            item.word_count = len(data.content) if data.content else 0
        db.add(item)
        db.commit()
        db.refresh(item)
        return item.to_dict()

    @staticmethod
    def update(db: Session, id: int, data: ChapterUpdate):
        item = db.query(Chapter).filter(Chapter.id == id).first()
        if not item:
            return None
        for k, v in data.dict(exclude_unset=True).items():
            setattr(item, k, v)
        db.commit()
        db.refresh(item)
        return item.to_dict()

    @staticmethod
    def delete(db: Session, id: int):
        item = db.query(Chapter).filter(Chapter.id == id).first()
        if not item:
            return False
        db.delete(item)
        db.commit()
        return True

    @staticmethod
    def count_by_novel(db: Session, novel_id: int):
        return db.query(Chapter).filter(Chapter.novel_id == novel_id).count()


class CategoryBusiness:
    @staticmethod
    def list(db: Session):
        items = db.query(Category).order_by(asc(Category.sort)).all()
        return [item.to_dict() for item in items]

    @staticmethod
    def get(db: Session, id: int):
        item = db.query(Category).filter(Category.id == id).first()
        return item.to_dict() if item else None

    @staticmethod
    def create(db: Session, data: CategoryCreate):
        item = Category(**data.dict())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item.to_dict()

    @staticmethod
    def update(db: Session, id: int, data: CategoryUpdate):
        item = db.query(Category).filter(Category.id == id).first()
        if not item:
            return None
        for k, v in data.dict(exclude_unset=True).items():
            setattr(item, k, v)
        db.commit()
        db.refresh(item)
        return item.to_dict()

    @staticmethod
    def delete(db: Session, id: int):
        item = db.query(Category).filter(Category.id == id).first()
        if not item:
            return False
        db.delete(item)
        db.commit()
        return True


class ShelfBusiness:
    @staticmethod
    def list(db: Session, user_id: int, query: ShelfQuery):
        q = db.query(ShelfItem).filter(ShelfItem.user_id == user_id)
        if query.group_name:
            q = q.filter(ShelfItem.group_name == query.group_name)
        total = q.count()
        sort_col = getattr(ShelfItem, query.sort_by, ShelfItem.updated_at)
        q = q.order_by(desc(ShelfItem.is_pinned), desc(sort_col))
        items = (
            q.offset((query.page - 1) * query.page_size)
            .limit(query.page_size)
            .all()
        )
        return [item.to_dict() for item in items], total

    @staticmethod
    def get(db: Session, id: int):
        item = db.query(ShelfItem).filter(ShelfItem.id == id).first()
        return item.to_dict() if item else None

    @staticmethod
    def get_by_novel(db: Session, user_id: int, novel_id: int):
        item = (
            db.query(ShelfItem)
            .filter(ShelfItem.user_id == user_id, ShelfItem.novel_id == novel_id)
            .first()
        )
        return item.to_dict() if item else None

    @staticmethod
    def create(db: Session, user_id: int, data: ShelfItemCreate):
        exist = (
            db.query(ShelfItem)
            .filter(ShelfItem.user_id == user_id, ShelfItem.novel_id == data.novel_id)
            .first()
        )
        if exist:
            return exist.to_dict()
        item = ShelfItem(user_id=user_id, **data.dict())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item.to_dict()

    @staticmethod
    def update(db: Session, id: int, data: ShelfItemUpdate):
        item = db.query(ShelfItem).filter(ShelfItem.id == id).first()
        if not item:
            return None
        for k, v in data.dict(exclude_unset=True).items():
            setattr(item, k, v)
        item.updated_at = datetime.now()
        db.commit()
        db.refresh(item)
        return item.to_dict()

    @staticmethod
    def delete(db: Session, id: int):
        item = db.query(ShelfItem).filter(ShelfItem.id == id).first()
        if not item:
            return False
        db.delete(item)
        db.commit()
        return True

    @staticmethod
    def stats(db: Session, user_id: int):
        items = db.query(ShelfItem).filter(ShelfItem.user_id == user_id).all()
        total = len(items)
        recent = sorted(items, key=lambda x: x.updated_at or datetime.min, reverse=True)
        recent_id = recent[0].novel_id if recent else None
        total_seconds = sum(item.total_read_seconds for item in items)
        return {
            "total_count": total,
            "recent_read_novel_id": recent_id,
            "total_read_seconds": total_seconds,
        }

    @staticmethod
    def group_list(db: Session, user_id: int):
        items = (
            db.query(ShelfItem.group_name)
            .filter(ShelfItem.user_id == user_id)
            .distinct()
            .all()
        )
        return [row[0] for row in items]


class ReadingRecordBusiness:
    @staticmethod
    def get_last(db: Session, user_id: int, novel_id: int):
        item = (
            db.query(ReadingRecord)
            .filter(ReadingRecord.user_id == user_id, ReadingRecord.novel_id == novel_id)
            .order_by(desc(ReadingRecord.created_at))
            .first()
        )
        return item.to_dict() if item else None

    @staticmethod
    def create(db: Session, user_id: int, data: ReadingRecordCreate):
        item = ReadingRecord(user_id=user_id, **data.dict())
        db.add(item)
        db.commit()
        db.refresh(item)
        shelf = (
            db.query(ShelfItem)
            .filter(ShelfItem.user_id == user_id, ShelfItem.novel_id == data.novel_id)
            .first()
        )
        if shelf:
            shelf.last_read_chapter_id = data.chapter_id
            shelf.last_read_position = data.position
            shelf.total_read_seconds += data.read_seconds
            shelf.updated_at = datetime.now()
            db.commit()
        return item.to_dict()

    @staticmethod
    def list_by_novel(db: Session, user_id: int, novel_id: int, limit: int = 50):
        items = (
            db.query(ReadingRecord)
            .filter(ReadingRecord.user_id == user_id, ReadingRecord.novel_id == novel_id)
            .order_by(desc(ReadingRecord.created_at))
            .limit(limit)
            .all()
        )
        return [item.to_dict() for item in items]


class BookmarkBusiness:
    @staticmethod
    def list(db: Session, user_id: int, novel_id: Optional[int] = None):
        q = db.query(Bookmark).filter(Bookmark.user_id == user_id)
        if novel_id:
            q = q.filter(Bookmark.novel_id == novel_id)
        items = q.order_by(desc(Bookmark.created_at)).all()
        return [item.to_dict() for item in items]

    @staticmethod
    def create(db: Session, user_id: int, data: BookmarkCreate):
        item = Bookmark(user_id=user_id, **data.dict())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item.to_dict()

    @staticmethod
    def delete(db: Session, id: int):
        item = db.query(Bookmark).filter(Bookmark.id == id).first()
        if not item:
            return False
        db.delete(item)
        db.commit()
        return True


class CommentBusiness:
    @staticmethod
    def list(db: Session, novel_id: int, page: int = 1, page_size: int = 20):
        q = db.query(Comment).filter(Comment.novel_id == novel_id)
        total = q.count()
        items = (
            q.order_by(desc(Comment.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return [item.to_dict() for item in items], total

    @staticmethod
    def create(db: Session, data: CommentCreate):
        item = Comment(**data.dict())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item.to_dict()

    @staticmethod
    def delete(db: Session, id: int):
        item = db.query(Comment).filter(Comment.id == id).first()
        if not item:
            return False
        db.delete(item)
        db.commit()
        return True


class BannerBusiness:
    @staticmethod
    def list(db: Session):
        items = (
            db.query(Banner)
            .filter(Banner.is_active == True)
            .order_by(asc(Banner.sort))
            .all()
        )
        return [item.to_dict() for item in items]

    @staticmethod
    def create(db: Session, data: BannerCreate):
        item = Banner(**data.dict())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item.to_dict()

    @staticmethod
    def update(db: Session, id: int, data: dict):
        item = db.query(Banner).filter(Banner.id == id).first()
        if not item:
            return None
        for k, v in data.items():
            setattr(item, k, v)
        db.commit()
        db.refresh(item)
        return item.to_dict()

    @staticmethod
    def delete(db: Session, id: int):
        item = db.query(Banner).filter(Banner.id == id).first()
        if not item:
            return False
        db.delete(item)
        db.commit()
        return True


class OfflineCacheBusiness:
    @staticmethod
    def list(db: Session, user_id: int, novel_id: Optional[int] = None):
        q = db.query(OfflineCache).filter(OfflineCache.user_id == user_id)
        if novel_id:
            q = q.filter(OfflineCache.novel_id == novel_id)
        items = q.order_by(desc(OfflineCache.cached_at)).all()
        return [item.to_dict() for item in items]

    @staticmethod
    def create(db: Session, user_id: int, data: OfflineCacheCreate):
        exist = (
            db.query(OfflineCache)
            .filter(
                OfflineCache.user_id == user_id,
                OfflineCache.chapter_id == data.chapter_id,
            )
            .first()
        )
        if exist:
            return exist.to_dict()
        item = OfflineCache(user_id=user_id, **data.dict())
        db.add(item)
        chapter = db.query(Chapter).filter(Chapter.id == data.chapter_id).first()
        if chapter:
            chapter.is_cached = True
        db.commit()
        db.refresh(item)
        return item.to_dict()

    @staticmethod
    def delete(db: Session, id: int):
        item = db.query(OfflineCache).filter(OfflineCache.id == id).first()
        if not item:
            return False
        chapter = db.query(Chapter).filter(Chapter.id == item.chapter_id).first()
        if chapter:
            chapter.is_cached = False
        db.delete(item)
        db.commit()
        return True

    @staticmethod
    def is_cached(db: Session, user_id: int, chapter_id: int):
        item = (
            db.query(OfflineCache)
            .filter(
                OfflineCache.user_id == user_id,
                OfflineCache.chapter_id == chapter_id,
            )
            .first()
        )
        return item is not None
