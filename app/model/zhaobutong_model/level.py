from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ZbtLevelModel:
    TABLE_NAME = 'tb_zhaobutong_model_level'

    THEME_NATURE = 'nature'
    THEME_CITY = 'city'
    THEME_FOOD = 'food'

    DIFFICULTY_EASY = 1
    DIFFICULTY_MEDIUM = 2
    DIFFICULTY_HARD = 3

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1

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
                name TEXT NOT NULL,
                theme TEXT NOT NULL DEFAULT 'nature',
                difficulty INTEGER DEFAULT 1,
                image_original TEXT NOT NULL,
                image_modified TEXT NOT NULL,
                difference_count INTEGER NOT NULL DEFAULT 5,
                time_limit INTEGER DEFAULT 120,
                hint_count INTEGER DEFAULT 3,
                status INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_theme ON {cls.TABLE_NAME}(theme)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty ON {cls.TABLE_NAME}(difficulty)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @classmethod
    def init_default_levels(cls):
        model = cls()
        count = model.query.count({'status': cls.STATUS_ACTIVE})
        if count > 0:
            return

        from app.model.zhaobutong_model.difference import ZbtDifferenceModel
        diff_model = ZbtDifferenceModel()

        import random

        themes = [
            (cls.THEME_NATURE, '自然风光'),
            (cls.THEME_CITY, '城市建筑'),
            (cls.THEME_FOOD, '美食甜点'),
        ]

        img_w = 600
        img_h = 400

        for i, (theme, theme_name) in enumerate(themes):
            for diff in range(1, 4):
                diff_name = {1: '简单', 2: '中等', 3: '困难'}[diff]
                diff_count = {1: 3, 2: 5, 3: 7}[diff]
                time_limit = {1: 180, 2: 120, 3: 90}[diff]
                name = f'{theme_name}-{diff_name}'
                image_original = f'{theme}_{diff}_orig'
                image_modified = f'{theme}_{diff}_mod'
                level_id = model.create(
                    name=name,
                    theme=theme,
                    difficulty=diff,
                    image_original=image_original,
                    image_modified=image_modified,
                    difference_count=diff_count,
                    time_limit=time_limit,
                    hint_count=2,
                    sort_order=i * 3 + diff
                )

                margin = 40
                for _ in range(diff_count):
                    x = random.randint(margin, img_w - margin)
                    y = random.randint(margin, img_h - margin)
                    radius = {1: 30, 2: 25, 3: 20}[diff]
                    desc = f'不同点{_ + 1}'
                    diff_model.create(level_id, x, y, radius, desc)

    def create(self, name: str, theme: str, difficulty: int, image_original: str,
               image_modified: str, difference_count: int = 5, time_limit: int = 120,
               hint_count: int = 3, sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'theme': theme,
            'difficulty': difficulty,
            'image_original': image_original,
            'image_modified': image_modified,
            'difference_count': difference_count,
            'time_limit': time_limit,
            'hint_count': hint_count,
            'status': self.STATUS_ACTIVE,
            'sort_order': sort_order,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, level_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'theme', 'difficulty', 'image_original', 'image_modified',
            'difference_count', 'time_limit', 'hint_count', 'status', 'sort_order'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(level_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_active_levels(self, theme: str = None, difficulty: int = None) -> List[Dict[str, Any]]:
        conditions = {'status': self.STATUS_ACTIVE}
        if theme:
            conditions['theme'] = theme
        if difficulty:
            conditions['difficulty'] = difficulty
        return self.query.find_all(conditions, order_by='sort_order ASC, id ASC')

    def get_all(self, page: int = 1, page_size: int = 10, theme: str = None,
                difficulty: int = None, status: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if theme:
            conditions['theme'] = theme
        if difficulty is not None:
            conditions['difficulty'] = difficulty
        if status is not None:
            conditions['status'] = status
        if keyword:
            return self.search(keyword, page, page_size, theme, difficulty, status)
        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id ASC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               theme: str = None, difficulty: int = None, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["1=1"]
        params = []
        if theme:
            where_clauses.append("theme = ?")
            params.append(theme)
        if difficulty is not None:
            where_clauses.append("difficulty = ?")
            params.append(difficulty)
        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)
        where_clauses.append("(name LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.append(like_pattern)
        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0
        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY sort_order ASC, id ASC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def to_dict(self, level: Dict[str, Any]) -> Dict[str, Any]:
        theme_map = {self.THEME_NATURE: '自然风光', self.THEME_CITY: '城市建筑', self.THEME_FOOD: '美食甜点'}
        diff_map = {1: '简单', 2: '中等', 3: '困难'}
        return {
            'id': level.get('id'),
            'name': level.get('name'),
            'theme': level.get('theme'),
            'theme_text': theme_map.get(level.get('theme'), '未知'),
            'difficulty': level.get('difficulty'),
            'difficulty_text': diff_map.get(level.get('difficulty'), '未知'),
            'image_original': level.get('image_original'),
            'image_modified': level.get('image_modified'),
            'difference_count': level.get('difference_count'),
            'time_limit': level.get('time_limit'),
            'hint_count': level.get('hint_count'),
            'status': level.get('status'),
            'sort_order': level.get('sort_order'),
            'created_at': level.get('created_at')
        }
