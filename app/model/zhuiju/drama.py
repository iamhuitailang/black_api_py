from datetime import datetime
from enum import Enum
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DramaStatus(str, Enum):
    WANT = "want"
    WATCHING = "watching"
    FINISHED = "finished"
    DROPPED = "dropped"


STATUS_LABELS = {
    DramaStatus.WANT: "想看",
    DramaStatus.WATCHING: "正在追",
    DramaStatus.FINISHED: "已看完",
    DramaStatus.DROPPED: "弃剧",
}


DEFAULT_DRAMAS = [
    {"name": "地球脉动3", "genre": "纪录片", "seasons": 1, "total_episodes": 8, "episode_duration": 60, "sort_order": "A", "cover": "🌍"},
    {"name": "权力的游戏", "genre": "奇幻", "seasons": 8, "total_episodes": 73, "episode_duration": 55, "sort_order": "B", "cover": "🧙"},
    {"name": "黑镜", "genre": "科幻", "seasons": 6, "total_episodes": 27, "episode_duration": 50, "sort_order": "C", "cover": "🤖"},
    {"name": "王冠", "genre": "历史", "seasons": 6, "total_episodes": 60, "episode_duration": 55, "sort_order": "D", "cover": "👑"},
    {"name": "星期三", "genre": "悬疑", "seasons": 1, "total_episodes": 8, "episode_duration": 50, "sort_order": "E", "cover": "🔪"},
    {"name": "绝命毒师", "genre": "犯罪", "seasons": 5, "total_episodes": 62, "episode_duration": 50, "sort_order": "F", "cover": "💊"},
    {"name": "鱿鱼游戏", "genre": "惊悚", "seasons": 1, "total_episodes": 9, "episode_duration": 55, "sort_order": "G", "cover": "🐙"},
    {"name": "浪漫医生金师傅", "genre": "医疗", "seasons": 3, "total_episodes": 50, "episode_duration": 60, "sort_order": "H", "cover": "❤️"},
    {"name": "龙之家族", "genre": "奇幻", "seasons": 1, "total_episodes": 10, "episode_duration": 65, "sort_order": "I", "cover": "🐉"},
    {"name": "睡魔", "genre": "奇幻", "seasons": 1, "total_episodes": 11, "episode_duration": 50, "sort_order": "J", "cover": "😈"},
    {"name": "怪奇物语", "genre": "科幻", "seasons": 4, "total_episodes": 34, "episode_duration": 55, "sort_order": "K", "cover": "🎸"},
    {"name": "我的解放日志", "genre": "治愈", "seasons": 1, "total_episodes": 16, "episode_duration": 70, "sort_order": "L", "cover": "🏠"},
    {"name": "半泽直树", "genre": "日剧", "seasons": 2, "total_episodes": 20, "episode_duration": 55, "sort_order": "M", "cover": "👔"},
    {"name": "深夜食堂", "genre": "日剧", "seasons": 5, "total_episodes": 50, "episode_duration": 25, "sort_order": "N", "cover": "🍜"},
    {"name": "爱情而已", "genre": "爱情", "seasons": 1, "total_episodes": 38, "episode_duration": 45, "sort_order": "O", "cover": "💑"},
    {"name": "隐秘的角落", "genre": "悬疑", "seasons": 1, "total_episodes": 12, "episode_duration": 50, "sort_order": "P", "cover": "🕵️"},
    {"name": "白色巨塔", "genre": "经典", "seasons": 1, "total_episodes": 21, "episode_duration": 50, "sort_order": "Q", "cover": "🏥"},
    {"name": "大明王朝1566", "genre": "历史", "seasons": 1, "total_episodes": 46, "episode_duration": 45, "sort_order": "R", "cover": "🎭"},
    {"name": "老友记", "genre": "喜剧", "seasons": 10, "total_episodes": 236, "episode_duration": 22, "sort_order": "S", "cover": "🤣"},
    {"name": "未生", "genre": "职场", "seasons": 1, "total_episodes": 20, "episode_duration": 70, "sort_order": "T", "cover": "🏢"},
]


class DramaModel:
    TABLE_NAME = 'tb_zhuiju_drama'

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
                cover TEXT DEFAULT '',
                genre TEXT DEFAULT '',
                seasons INTEGER DEFAULT 1,
                total_episodes INTEGER DEFAULT 0,
                watched_episodes INTEGER DEFAULT 0,
                episode_duration INTEGER DEFAULT 45,
                status TEXT DEFAULT 'want',
                rating INTEGER DEFAULT 0,
                review TEXT DEFAULT '',
                tags TEXT DEFAULT '',
                is_rewatch INTEGER DEFAULT 0,
                year INTEGER DEFAULT 0,
                sort_order TEXT DEFAULT '',
                note TEXT DEFAULT '',
                is_custom INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        indexes = [
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_genre ON {cls.TABLE_NAME}(genre)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_updated ON {cls.TABLE_NAME}(updated_at)",
        ]
        for idx_sql in indexes:
            db.execute(idx_sql)

    @classmethod
    def init_default_dramas(cls):
        db = get_db()
        row = db.fetch_one(f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}")
        if row and row.get('total', 0) > 0:
            return
        now = datetime.now().isoformat()
        insert_sql = f"""
            INSERT INTO {cls.TABLE_NAME}
            (name, cover, genre, seasons, total_episodes, watched_episodes, episode_duration,
             status, rating, review, tags, is_rewatch, year, sort_order, note, is_custom,
             created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = []
        for d in DEFAULT_DRAMAS:
            params.append((
                d['name'], d.get('cover', ''), d['genre'], d['seasons'], d['total_episodes'],
                0, d['episode_duration'], DramaStatus.WANT.value, 0, '', '', 0, 0,
                d['sort_order'], '', 0, now, now
            ))
        db.execute_many(insert_sql, params)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        item = {
            'name': data.get('name', ''),
            'cover': data.get('cover', ''),
            'genre': data.get('genre', ''),
            'seasons': data.get('seasons', 1),
            'total_episodes': data.get('total_episodes', 0),
            'watched_episodes': data.get('watched_episodes', 0),
            'episode_duration': data.get('episode_duration', 45),
            'status': data.get('status', DramaStatus.WANT.value),
            'rating': data.get('rating', 0),
            'review': data.get('review', ''),
            'tags': data.get('tags', ''),
            'is_rewatch': data.get('is_rewatch', 0),
            'year': data.get('year', 0),
            'sort_order': data.get('sort_order', ''),
            'note': data.get('note', ''),
            'is_custom': data.get('is_custom', 1),
            'created_at': now,
            'updated_at': now,
        }
        return self.exec.insert(item)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, conditions: Dict[str, Any] = None, order_by: str = 'updated_at DESC, id ASC') -> List[Dict[str, Any]]:
        return self.query.find_all(conditions=conditions, order_by=order_by)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data = {k: v for k, v in data.items() if v is not None}
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_all(self) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME}"
        return self.exec.execute_raw(sql)

    def count(self, conditions: Dict[str, Any] = None) -> int:
        return self.query.count(conditions)

    def count_by_status(self) -> Dict[str, int]:
        sql = f"SELECT status, COUNT(*) as total FROM {self.TABLE_NAME} GROUP BY status"
        rows = self.db.fetch_all(sql)
        result = {s.value: 0 for s in DramaStatus}
        for r in rows:
            result[r['status']] = r['total']
        return result

    def sum_watched(self) -> Dict[str, Any]:
        sql = f"""
            SELECT
                COUNT(*) as total_dramas,
                SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) as finished_count,
                COALESCE(SUM(watched_episodes), 0) as total_watched_episodes,
                COALESCE(SUM(watched_episodes * episode_duration), 0) as total_watch_minutes,
                COALESCE(AVG(CASE WHEN rating > 0 THEN rating END), 0) as avg_rating
            FROM {self.TABLE_NAME}
        """
        return self.db.fetch_one(sql) or {}

    def count_finished_this_month(self) -> int:
        sql = f"""
            SELECT COUNT(*) as total FROM {self.TABLE_NAME}
            WHERE status = 'finished'
              AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')
        """
        row = self.db.fetch_one(sql)
        return row['total'] if row else 0

    def clear_all(self) -> int:
        return self.delete_all()

    def get_distinct_genres(self) -> List[str]:
        sql = f"SELECT DISTINCT genre FROM {self.TABLE_NAME} WHERE genre IS NOT NULL AND genre != '' ORDER BY genre"
        rows = self.db.fetch_all(sql)
        return [r['genre'] for r in rows]

    def get_distinct_years(self) -> List[int]:
        sql = f"SELECT DISTINCT year FROM {self.TABLE_NAME} WHERE year IS NOT NULL AND year > 0 ORDER BY year DESC"
        rows = self.db.fetch_all(sql)
        return [r['year'] for r in rows]
