from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserHeroModel:
    TABLE_NAME = 'tb_wangzhe_model_user_heroes'

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
                hero_id INTEGER NOT NULL,
                purchased INTEGER DEFAULT 1,
                mastery_level INTEGER DEFAULT 0,
                mastery_points INTEGER DEFAULT 0,
                total_plays INTEGER DEFAULT 0,
                total_wins INTEGER DEFAULT 0,
                total_kills INTEGER DEFAULT 0,
                total_deaths INTEGER DEFAULT 0,
                total_assists INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_hero_id ON {cls.TABLE_NAME}(hero_id)"
        db.execute(index_sql2)

    def create(self, user_id: int, hero_id: int, purchased: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'hero_id': hero_id,
            'purchased': purchased,
            'mastery_level': 0,
            'mastery_points': 0,
            'total_plays': 0,
            'total_wins': 0,
            'total_kills': 0,
            'total_deaths': 0,
            'total_assists': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_hero(self, user_id: int, hero_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'hero_id': hero_id})

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='mastery_level DESC, total_plays DESC')

    def owns_hero(self, user_id: int, hero_id: int) -> bool:
        record = self.get_by_user_and_hero(user_id, hero_id)
        return record is not None and record.get('purchased', 0) == 1

    def update_stats(self, user_id: int, hero_id: int, win: bool, kills: int, 
                     deaths: int, assists: int, mastery_points: int = 10) -> int:
        record = self.get_by_user_and_hero(user_id, hero_id)
        if not record:
            return 0

        now = datetime.now().isoformat()
        new_mastery_points = record.get('mastery_points', 0) + mastery_points
        new_level = record.get('mastery_level', 0)

        level_thresholds = [0, 100, 300, 600, 1000, 2000, 5000, 10000]
        while new_level < len(level_thresholds) - 1 and new_mastery_points >= level_thresholds[new_level + 1]:
            new_level += 1

        data = {
            'total_plays': record.get('total_plays', 0) + 1,
            'total_wins': record.get('total_wins', 0) + (1 if win else 0),
            'total_kills': record.get('total_kills', 0) + kills,
            'total_deaths': record.get('total_deaths', 0) + deaths,
            'total_assists': record.get('total_assists', 0) + assists,
            'mastery_points': new_mastery_points,
            'mastery_level': new_level,
            'updated_at': now
        }
        return self.exec.update_by_id(record.get('id'), data)

    def purchase_hero(self, user_id: int, hero_id: int) -> int:
        record = self.get_by_user_and_hero(user_id, hero_id)
        if record:
            return 0

        return self.create(user_id, hero_id, purchased=1)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_public_dict(self, user_hero: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user_hero.get('id'),
            'user_id': user_hero.get('user_id'),
            'hero_id': user_hero.get('hero_id'),
            'purchased': user_hero.get('purchased'),
            'mastery_level': user_hero.get('mastery_level'),
            'mastery_points': user_hero.get('mastery_points'),
            'total_plays': user_hero.get('total_plays'),
            'total_wins': user_hero.get('total_wins'),
            'total_kills': user_hero.get('total_kills'),
            'total_deaths': user_hero.get('total_deaths'),
            'total_assists': user_hero.get('total_assists'),
            'win_rate': round(user_hero.get('total_wins', 0) / max(1, user_hero.get('total_plays', 0)) * 100, 2),
            'created_at': user_hero.get('created_at')
        }
