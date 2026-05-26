from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ChapterModel:
    TABLE_NAME = 'tb_manhua_chapters'

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                comic_id INTEGER NOT NULL,
                chapter_no INTEGER NOT NULL,
                title TEXT NOT NULL,
                page_count INTEGER DEFAULT 0,
                pages TEXT DEFAULT '[]',
                is_free INTEGER DEFAULT 1,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_comic_id ON {cls.TABLE_NAME}(comic_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_chapter_no ON {cls.TABLE_NAME}(comic_id, chapter_no)"
        db.execute(index_sql)

    @classmethod
    def init_default_chapters(cls):
        from app.model.manhua import ComicModel, ChapterModel
        comic_model = ComicModel()
        chapter_model = ChapterModel()
        count = chapter_model.query.count()
        if count > 0:
            return

        comics = comic_model.query.find_all(order_by='id ASC')
        for comic in comics:
            comic_id = comic.get('id')
            total = comic.get('total_chapters', 1)
            now = datetime.now().isoformat()
            chapters = []
            for i in range(1, total + 1):
                chapters.append({
                    'comic_id': comic_id,
                    'chapter_no': i,
                    'title': f'第{i}话',
                    'page_count': 10,
                    'pages': '[]',
                    'is_free': 1,
                    'sort_order': i,
                    'created_at': now,
                    'updated_at': now
                })
                if len(chapters) >= 500:
                    chapter_model.exec.insert_many(chapters)
                    chapters = []
            if chapters:
                chapter_model.exec.insert_many(chapters)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_comic_and_chapter(self, comic_id: int, chapter_no: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'comic_id': comic_id, 'chapter_no': chapter_no})

    def get_by_comic_id(self, comic_id: int, page: int = 1, page_size: int = 100) -> Dict[str, Any]:
        conditions = {'comic_id': comic_id}
        return self.query.paginate(page, page_size, conditions, order_by='chapter_no ASC')

    def get_latest_by_comic_id(self, comic_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'comic_id': comic_id}, order_by='chapter_no DESC')

    def update(self, chapter_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(chapter_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_comic_id(self, comic_id: int) -> int:
        conditions = {'comic_id': comic_id}
        return self.exec.delete(conditions)

    def to_dict(self, chapter: Dict[str, Any]) -> Dict[str, Any]:
        import json
        pages = chapter.get('pages', '[]')
        if isinstance(pages, str):
            try:
                pages = json.loads(pages)
            except:
                pages = []
        return {
            'id': chapter.get('id'),
            'comic_id': chapter.get('comic_id'),
            'chapter_no': chapter.get('chapter_no'),
            'title': chapter.get('title'),
            'page_count': chapter.get('page_count'),
            'pages': pages,
            'is_free': chapter.get('is_free'),
            'sort_order': chapter.get('sort_order'),
            'created_at': chapter.get('created_at')
        }