from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ThemeModel:
    TABLE_NAME = 'tb_chouchou_model_themes'

    THEME_CARNIVAL = 'carnival'
    THEME_VINTAGE = 'vintage'
    THEME_DARK = 'dark'

    DEFAULT_THEMES = [
        {
            'code': THEME_CARNIVAL,
            'name': '欢乐马戏城',
            'description': '卡通童趣风格，彩色马戏大棚、气球彩旗，Q版卡通人偶形象',
            'emoji': '🎠',
            'is_default': True,
            'is_unlocked': True,
            'unlock_condition': '',
            'sort_order': 1
        },
        {
            'code': THEME_VINTAGE,
            'name': '复古马戏团',
            'description': '怀旧欧式风格，老式露天马戏舞台、复古看台，暖黄聚光灯、飘雪彩带',
            'emoji': '🎩',
            'is_default': False,
            'is_unlocked': True,
            'unlock_condition': '',
            'sort_order': 2
        },
        {
            'code': THEME_DARK,
            'name': '暗夜诡马戏',
            'description': '悬疑暗黑风格，昏暗阴森马戏牢笼、冷色灯光，暗影雾气、诡异光影',
            'emoji': '🌑',
            'is_default': False,
            'is_unlocked': True,
            'unlock_condition': '',
            'sort_order': 3
        }
    ]

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
                user_id INTEGER NOT NULL,
                theme_code TEXT NOT NULL,
                is_unlocked INTEGER DEFAULT 0,
                unlocked_at TIMESTAMP,
                current_using INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, theme_code)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_theme_code ON {cls.TABLE_NAME}(theme_code)"
        db.execute(index_sql)

    @classmethod
    def init_default_themes(cls, user_id: int):
        db = get_db()
        now = datetime.now().isoformat()
        for theme in cls.DEFAULT_THEMES:
            sql = f"""
                INSERT OR IGNORE INTO {cls.TABLE_NAME} 
                (user_id, theme_code, is_unlocked, unlocked_at, current_using, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            is_unlocked = 1 if theme['is_unlocked'] else 0
            current_using = 1 if theme['code'] == cls.THEME_CARNIVAL else 0
            unlocked_at = now if theme['is_unlocked'] else None
            db.execute(sql, (user_id, theme['code'], is_unlocked, unlocked_at, current_using, now, now))

    def create(self, user_id: int, theme_code: str, is_unlocked: bool = False) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'theme_code': theme_code,
            'is_unlocked': 1 if is_unlocked else 0,
            'unlocked_at': now if is_unlocked else None,
            'current_using': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        user_themes = self.query.find_all({'user_id': user_id}, order_by='id ASC')

        theme_map = {}
        for ut in user_themes:
            theme_map[ut['theme_code']] = ut

        result = []
        for default_theme in self.DEFAULT_THEMES:
            theme_code = default_theme['code']
            user_theme = theme_map.get(theme_code)

            if user_theme:
                result.append({
                    **default_theme,
                    'is_unlocked': bool(user_theme.get('is_unlocked', 0)),
                    'unlocked_at': user_theme.get('unlocked_at'),
                    'current_using': bool(user_theme.get('current_using', 0))
                })
            else:
                result.append({
                    **default_theme,
                    'is_unlocked': default_theme['is_unlocked'],
                    'unlocked_at': None,
                    'current_using': theme_code == self.THEME_CARNIVAL
                })

        return result

    def get_current_theme(self, user_id: int) -> Dict[str, Any]:
        user_theme = self.query.find_one({'user_id': user_id, 'current_using': 1})

        theme_code = self.THEME_CARNIVAL
        if user_theme:
            theme_code = user_theme['theme_code']

        for default_theme in self.DEFAULT_THEMES:
            if default_theme['code'] == theme_code:
                return {
                    **default_theme,
                    'is_unlocked': bool(user_theme.get('is_unlocked', 1)) if user_theme else default_theme['is_unlocked'],
                    'current_using': True
                }

        return self.DEFAULT_THEMES[0]

    def unlock_theme(self, user_id: int, theme_code: str) -> int:
        user_theme = self.query.find_one({'user_id': user_id, 'theme_code': theme_code})
        now = datetime.now().isoformat()

        if user_theme:
            return self.exec.update_by_id(user_theme['id'], {
                'is_unlocked': 1,
                'unlocked_at': now,
                'updated_at': now
            })
        else:
            return self.create(user_id, theme_code, is_unlocked=True)

    def set_current_theme(self, user_id: int, theme_code: str) -> bool:
        user_themes = self.query.find_all({'user_id': user_id})

        target_theme = None
        for ut in user_themes:
            if ut['theme_code'] == theme_code:
                target_theme = ut
                if not ut.get('is_unlocked', 0):
                    return False

        now = datetime.now().isoformat()

        for ut in user_themes:
            self.exec.update_by_id(ut['id'], {
                'current_using': 1 if ut['theme_code'] == theme_code else 0,
                'updated_at': now
            })

        if not target_theme:
            self.create(user_id, theme_code, is_unlocked=True)

        return True

    def is_unlocked(self, user_id: int, theme_code: str) -> bool:
        for theme in self.DEFAULT_THEMES:
            if theme['code'] == theme_code and theme['is_unlocked']:
                return True

        user_theme = self.query.find_one({'user_id': user_id, 'theme_code': theme_code})
        return bool(user_theme and user_theme.get('is_unlocked', 0))

    def get_all_themes(self) -> List[Dict[str, Any]]:
        return self.DEFAULT_THEMES.copy()

    def delete_by_user(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?",
            (user_id,)
        )

    def to_dict(self, theme: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'code': theme.get('code'),
            'name': theme.get('name'),
            'description': theme.get('description'),
            'emoji': theme.get('emoji'),
            'is_default': theme.get('is_default', False),
            'is_unlocked': theme.get('is_unlocked', False),
            'unlock_condition': theme.get('unlock_condition', ''),
            'unlocked_at': theme.get('unlocked_at'),
            'current_using': theme.get('current_using', False),
            'sort_order': theme.get('sort_order', 0)
        }
