from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AchievementModel:
    TABLE_NAME = 'tb_dafeiji_achievement'

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
                achievement_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                icon TEXT,
                category TEXT DEFAULT 'general',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        achievements = [
            {'achievement_id': 'first_kill', 'name': '首杀', 'description': '击杀第一个敌人', 'icon': '🎯', 'category': 'combat'},
            {'achievement_id': 'first_boss', 'name': 'Boss猎人', 'description': '首次击败Boss', 'icon': '👑', 'category': 'combat'},
            {'achievement_id': 'kill_100', 'name': '百人斩', 'description': '累计击杀100个敌人', 'icon': '⚔️', 'category': 'combat'},
            {'achievement_id': 'kill_500', 'name': '杀戮者', 'description': '累计击杀500个敌人', 'icon': '🗡️', 'category': 'combat'},
            {'achievement_id': 'kill_1000', 'name': '死神降临', 'description': '累计击杀1000个敌人', 'icon': '💀', 'category': 'combat'},
            {'achievement_id': 'survive_5min', 'name': '坚守者', 'description': '单局存活超过5分钟', 'icon': '⏱️', 'category': 'survival'},
            {'achievement_id': 'score_10000', 'name': '高分选手', 'description': '单局得分超过10000', 'icon': '🏆', 'category': 'score'},
            {'achievement_id': 'all_items', 'name': '收藏家', 'description': '收集到所有类型的道具', 'icon': '💎', 'category': 'collection'},
            {'achievement_id': 'all_planes', 'name': '全机师', 'description': '使用过所有机型', 'icon': '✈️', 'category': 'collection'},
            {'achievement_id': 'perfect_5waves', 'name': '完美无瑕', 'description': '连续5波不受伤', 'icon': '🛡️', 'category': 'skill'},
        ]

        for ach in achievements:
            existing = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE achievement_id = ?", (ach['achievement_id'],))
            if not existing:
                now = datetime.now().isoformat()
                db.execute(
                    f"INSERT INTO {cls.TABLE_NAME} (achievement_id, name, description, icon, category, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                    (ach['achievement_id'], ach['name'], ach['description'], ach['icon'], ach['category'], now)
                )

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_by_achievement_id(self, achievement_id: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'achievement_id': achievement_id})


class UserAchievementModel:
    TABLE_NAME = 'tb_dafeiji_user_achievement'

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
                achievement_id TEXT NOT NULL,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, achievement_id)
            )
        """
        db.execute(sql)

        index_user = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_user)

    def unlock_achievement(self, user_id: int, achievement_id: str) -> bool:
        existing = self.query.find_one({'user_id': user_id, 'achievement_id': achievement_id})
        if existing:
            return False
        now = datetime.now().isoformat()
        try:
            self.exec.insert({
                'user_id': user_id,
                'achievement_id': achievement_id,
                'unlocked_at': now
            })
            return True
        except Exception:
            return False

    def get_user_achievements(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT a.*, ua.unlocked_at
            FROM {self.TABLE_NAME} ua
            JOIN {AchievementModel.TABLE_NAME} a ON ua.achievement_id = a.achievement_id
            WHERE ua.user_id = ?
            ORDER BY ua.unlocked_at DESC
        """
        return self.db.fetch_all(sql, (user_id,))

    def has_achievement(self, user_id: int, achievement_id: str) -> bool:
        result = self.query.find_one({'user_id': user_id, 'achievement_id': achievement_id})
        return result is not None

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE user_id = ?"
        result = self.db.fetch_one(sql, (user_id,))
        total_sql = f"SELECT COUNT(*) as total FROM {AchievementModel.TABLE_NAME}"
        total_result = self.db.fetch_one(total_sql)
        return {
            'unlocked_count': result.get('count', 0) if result else 0,
            'total_count': total_result.get('total', 0) if total_result else 0
        }
