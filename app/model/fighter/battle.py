from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BattleRecordModel:
    TABLE_NAME = 'fighter_battle_records'

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
                player_final_hp INTEGER NOT NULL,
                enemy_final_hp INTEGER NOT NULL,
                winner TEXT NOT NULL,
                total_rounds INTEGER NOT NULL,
                player_damage_dealt INTEGER NOT NULL,
                enemy_damage_dealt INTEGER NOT NULL,
                player_intent_switches INTEGER NOT NULL,
                enemy_intent_switches INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, player_final_hp: int, enemy_final_hp: int, winner: str,
               total_rounds: int, player_damage_dealt: int, enemy_damage_dealt: int,
               player_intent_switches: int, enemy_intent_switches: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_final_hp': player_final_hp,
            'enemy_final_hp': enemy_final_hp,
            'winner': winner,
            'total_rounds': total_rounds,
            'player_damage_dealt': player_damage_dealt,
            'enemy_damage_dealt': enemy_damage_dealt,
            'player_intent_switches': player_intent_switches,
            'enemy_intent_switches': enemy_intent_switches,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit)

    def get_recent(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC', limit=limit)

    def count(self) -> int:
        return self.query.count()

    def get_win_rate(self) -> Dict[str, Any]:
        db = get_db()
        total = self.query.count()
        if total == 0:
            return {'total': 0, 'player_wins': 0, 'enemy_wins': 0, 'win_rate': 0}
        
        player_wins_sql = f"SELECT COUNT(*) as cnt FROM {self.TABLE_NAME} WHERE winner = 'player'"
        player_wins_row = db.fetch_one(player_wins_sql)
        player_wins = player_wins_row['cnt'] if player_wins_row else 0
        
        return {
            'total': total,
            'player_wins': player_wins,
            'enemy_wins': total - player_wins,
            'win_rate': round(player_wins / total * 100, 2) if total > 0 else 0
        }
