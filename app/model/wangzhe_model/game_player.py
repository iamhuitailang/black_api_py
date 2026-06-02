from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GamePlayerModel:
    TABLE_NAME = 'tb_wangzhe_model_game_players'

    TEAM_BLUE = 'blue'
    TEAM_RED = 'red'

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
                game_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                hero_id INTEGER DEFAULT NULL,
                team TEXT DEFAULT 'blue',
                kills INTEGER DEFAULT 0,
                deaths INTEGER DEFAULT 0,
                assists INTEGER DEFAULT 0,
                gold_earned INTEGER DEFAULT 0,
                damage_dealt INTEGER DEFAULT 0,
                damage_taken INTEGER DEFAULT 0,
                healing_done INTEGER DEFAULT 0,
                is_mvp INTEGER DEFAULT 0,
                equipment_ids TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql2)

    def create(self, game_id: int, user_id: int, team: str = 'blue') -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'user_id': user_id,
            'hero_id': None,
            'team': team,
            'kills': 0,
            'deaths': 0,
            'assists': 0,
            'gold_earned': 0,
            'damage_dealt': 0,
            'damage_taken': 0,
            'healing_done': 0,
            'is_mvp': 0,
            'equipment_ids': '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_game_and_user(self, game_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'game_id': game_id, 'user_id': user_id})

    def get_by_game_id(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_id': game_id}, order_by='team ASC')

    def select_hero(self, record_id: int, hero_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'hero_id': hero_id,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def update_stats(self, record_id: int, kills: int = 0, deaths: int = 0, 
                     assists: int = 0, gold: int = 0, damage_dealt: int = 0,
                     damage_taken: int = 0, healing_done: int = 0) -> int:
        record = self.get_by_id(record_id)
        if not record:
            return 0

        now = datetime.now().isoformat()
        data = {
            'kills': record.get('kills', 0) + kills,
            'deaths': record.get('deaths', 0) + deaths,
            'assists': record.get('assists', 0) + assists,
            'gold_earned': record.get('gold_earned', 0) + gold,
            'damage_dealt': record.get('damage_dealt', 0) + damage_dealt,
            'damage_taken': record.get('damage_taken', 0) + damage_taken,
            'healing_done': record.get('healing_done', 0) + healing_done,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def set_mvp(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'is_mvp': 1,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def update_equipment(self, record_id: int, equipment_ids: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'equipment_ids': equipment_ids,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_public_dict(self, player: Dict[str, Any]) -> Dict[str, Any]:
        equipment_ids = player.get('equipment_ids', '')
        equipment_list = []
        if equipment_ids:
            equipment_list = [int(x) for x in equipment_ids.split(',') if x]
        
        return {
            'id': player.get('id'),
            'game_id': player.get('game_id'),
            'user_id': player.get('user_id'),
            'hero_id': player.get('hero_id'),
            'team': player.get('team'),
            'kills': player.get('kills'),
            'deaths': player.get('deaths'),
            'assists': player.get('assists'),
            'gold_earned': player.get('gold_earned'),
            'damage_dealt': player.get('damage_dealt'),
            'damage_taken': player.get('damage_taken'),
            'healing_done': player.get('healing_done'),
            'is_mvp': player.get('is_mvp'),
            'equipment_ids': equipment_list,
            'created_at': player.get('created_at')
        }
