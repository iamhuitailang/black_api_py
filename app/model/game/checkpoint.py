from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CheckpointRecordModel:
    TABLE_NAME = 'checkpoint_record'
    
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
                player_id INTEGER NOT NULL,
                game_save_id INTEGER NOT NULL,
                checkpoint_distance INTEGER NOT NULL,
                arrival_time REAL NOT NULL,
                kills_at_checkpoint INTEGER DEFAULT 0,
                health_at_checkpoint INTEGER DEFAULT 100,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (player_id) REFERENCES game_player(id),
                FOREIGN KEY (game_save_id) REFERENCES game_save(id)
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_checkpoint ON {cls.TABLE_NAME}(player_id, checkpoint_distance)"
        db.execute(index_sql)

    def create(self, player_id: int, game_save_id: int, checkpoint_distance: int, 
               arrival_time: float, kills_at_checkpoint: int, health_at_checkpoint: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_id': player_id,
            'game_save_id': game_save_id,
            'checkpoint_distance': checkpoint_distance,
            'arrival_time': arrival_time,
            'kills_at_checkpoint': kills_at_checkpoint,
            'health_at_checkpoint': health_at_checkpoint,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_player_and_distance(self, player_id: int, checkpoint_distance: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'player_id': player_id, 'checkpoint_distance': checkpoint_distance})

    def get_all_by_game_save(self, game_save_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_save_id': game_save_id}, order_by='checkpoint_distance ASC')

    def get_all_by_player(self, player_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'player_id': player_id}, order_by='checkpoint_distance ASC')

    def exists(self, player_id: int, game_save_id: int, checkpoint_distance: int) -> bool:
        return self.query.exists({
            'player_id': player_id,
            'game_save_id': game_save_id,
            'checkpoint_distance': checkpoint_distance
        })
