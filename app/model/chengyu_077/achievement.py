from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AchievementModel:
    TABLE_NAME = 'tb_chengyu_077_model_achievement'

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
                description TEXT DEFAULT '',
                icon TEXT DEFAULT '🎖️',
                points INTEGER DEFAULT 0,
                category TEXT DEFAULT 'game',
                condition_type TEXT DEFAULT '',
                condition_value INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    @classmethod
    def init_default_data(cls):
        db = get_db()
        count = db.fetch_one(f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}")
        if count and count['total'] > 0:
            return
        achievements = [
            ('初出茅庐', '完成第一场游戏', '🎮', 10, 'game', 'total_games', 1),
            ('小试牛刀', '累计完成5场游戏', '🎯', 20, 'game', 'total_games', 5),
            ('身经百战', '累计完成20场游戏', '⚔️', 50, 'game', 'total_games', 20),
            ('首战告捷', '赢得第一场胜利', '🏆', 15, 'win', 'total_wins', 1),
            ('常胜将军', '累计赢得5场胜利', '👑', 30, 'win', 'total_wins', 5),
            ('战无不胜', '累计赢得10场胜利', '💎', 60, 'win', 'total_wins', 10),
            ('成语达人', '单场得分达到100', '🌟', 25, 'score', 'single_score', 100),
            ('成语大师', '单场得分达到300', '💫', 50, 'score', 'single_score', 300),
            ('连击之王', '单场最大连击达到5', '🔥', 35, 'combo', 'max_combo', 5),
        ]
        for name, desc, icon, points, cat, cond_type, cond_val in achievements:
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT OR IGNORE INTO {cls.TABLE_NAME} (name, description, icon, points, category, condition_type, condition_value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (name, desc, icon, points, cat, cond_type, cond_val, now)
            )

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
