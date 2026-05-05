from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DotaBattleLogModel:
    TABLE_NAME = 'tb_dota_battle_logs'

    RESULT_WIN = 'win'
    RESULT_LOSE = 'lose'

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
                stage_id INTEGER NOT NULL,
                hero_id INTEGER NOT NULL,
                result TEXT NOT NULL,
                gold_earned INTEGER DEFAULT 0,
                exp_earned INTEGER DEFAULT 0,
                damage_dealt INTEGER DEFAULT 0,
                damage_taken INTEGER DEFAULT 0,
                rounds INTEGER DEFAULT 0,
                battle_log TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_stage_id ON {cls.TABLE_NAME}(stage_id)"
        db.execute(index_sql2)

    def create(self, user_id: int, stage_id: int, hero_id: int, result: str,
               gold_earned: int = 0, exp_earned: int = 0,
               damage_dealt: int = 0, damage_taken: int = 0,
               rounds: int = 0, battle_log: List[Dict[str, Any]] = None) -> int:
        import json
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'stage_id': stage_id,
            'hero_id': hero_id,
            'result': result,
            'gold_earned': gold_earned,
            'exp_earned': exp_earned,
            'damage_dealt': damage_dealt,
            'damage_taken': damage_taken,
            'rounds': rounds,
            'battle_log': json.dumps(battle_log or [], ensure_ascii=False),
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_user(self, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'user_id': user_id},
            order_by='id DESC',
            limit=limit
        )

    def get_by_user_stage(self, user_id: int, stage_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'user_id': user_id, 'stage_id': stage_id},
            order_by='id DESC',
            limit=limit
        )

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        total_wins = self.query.count({'user_id': user_id, 'result': self.RESULT_WIN})
        total_losses = self.query.count({'user_id': user_id, 'result': self.RESULT_LOSE})

        return {
            'total_battles': total_wins + total_losses,
            'total_wins': total_wins,
            'total_losses': total_losses,
            'win_rate': round(total_wins / (total_wins + total_losses), 2) if (total_wins + total_losses) > 0 else 0
        }

    def to_dict(self, log: Dict[str, Any]) -> Dict[str, Any]:
        import json
        try:
            battle_log = json.loads(log.get('battle_log', '[]'))
        except (json.JSONDecodeError, TypeError):
            battle_log = []

        return {
            'id': log.get('id'),
            'user_id': log.get('user_id'),
            'stage_id': log.get('stage_id'),
            'hero_id': log.get('hero_id'),
            'result': log.get('result'),
            'gold_earned': log.get('gold_earned'),
            'exp_earned': log.get('exp_earned'),
            'damage_dealt': log.get('damage_dealt'),
            'damage_taken': log.get('damage_taken'),
            'rounds': log.get('rounds'),
            'battle_log': battle_log,
            'created_at': log.get('created_at')
        }
