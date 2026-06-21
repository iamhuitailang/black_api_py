from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ShieldStatsModel:
    TABLE_NAME = 'shield_game_shield_stats'

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
                record_id INTEGER NOT NULL,
                level INTEGER NOT NULL,
                player_name TEXT NOT NULL DEFAULT 'Player',
                shield_bash_count INTEGER NOT NULL DEFAULT 0,
                shield_smash_count INTEGER NOT NULL DEFAULT 0,
                shield_block_count INTEGER NOT NULL DEFAULT 0,
                total_damage_blocked INTEGER NOT NULL DEFAULT 0,
                shield_durability_lost INTEGER NOT NULL DEFAULT 0,
                repaired_times INTEGER NOT NULL DEFAULT 0,
                repaired_amount INTEGER NOT NULL DEFAULT 0,
                shield_broken INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_record_id ON {cls.TABLE_NAME}(record_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level ON {cls.TABLE_NAME}(level)"
        db.execute(index_sql2)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        record_data = {
            'record_id': data.get('record_id', 0),
            'level': data.get('level', 1),
            'player_name': data.get('player_name', 'Player'),
            'shield_bash_count': data.get('shield_bash_count', 0),
            'shield_smash_count': data.get('shield_smash_count', 0),
            'shield_block_count': data.get('shield_block_count', 0),
            'total_damage_blocked': data.get('total_damage_blocked', 0),
            'shield_durability_lost': data.get('shield_durability_lost', 0),
            'repaired_times': data.get('repaired_times', 0),
            'repaired_amount': data.get('repaired_amount', 0),
            'shield_broken': data.get('shield_broken', 0),
            'created_at': now
        }
        return self.exec.insert(record_data)

    def get_by_id(self, stats_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(stats_id)

    def get_by_record_id(self, record_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('record_id', record_id, order_by='id DESC')

    def get_by_level(self, level: int) -> List[Dict[str, Any]]:
        return self.query.find_all_by_field('level', level, order_by='id DESC')

    def get_player_summary(self, player_name: str) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT 
                COUNT(*) as game_count,
                SUM(shield_bash_count) as total_bash,
                SUM(shield_smash_count) as total_smash,
                SUM(shield_block_count) as total_block,
                SUM(total_damage_blocked) as total_damage_blocked,
                SUM(shield_durability_lost) as total_durability_lost,
                SUM(repaired_times) as total_repaired,
                SUM(shield_broken) as total_broken
            FROM {self.TABLE_NAME} 
            WHERE player_name = ?
        """
        return self.db.fetch_one(sql, (player_name,))

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit)

    def update(self, stats_id: int, data: Dict[str, Any]) -> int:
        return self.exec.update_by_id(stats_id, data)

    def delete(self, stats_id: int) -> int:
        return self.exec.delete_by_id(stats_id)

    def count(self) -> int:
        return self.query.count()
