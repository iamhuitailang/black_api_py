from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


MORPH_FUNGI = 0
MORPH_BACTERIA = 1
MORPH_NEMATODE = 2

MORPH_NAMES = {
    MORPH_FUNGI: '真菌',
    MORPH_BACTERIA: '细菌',
    MORPH_NEMATODE: '线虫'
}


class PopulationModel:
    TABLE_NAME = 'tb_rainforest_population'

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
                layer_id INTEGER NOT NULL,
                morph_type INTEGER NOT NULL,
                count INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        unique_sql = f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_layer_morph ON {cls.TABLE_NAME}(game_id, layer_id, morph_type)"
        db.execute(unique_sql)

    def create(self, game_id: int, layer_id: int, morph_type: int, count: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'layer_id': layer_id,
            'morph_type': morph_type,
            'count': count,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_game_layer_morph(self, game_id: int, layer_id: int, morph_type: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'game_id': game_id,
            'layer_id': layer_id,
            'morph_type': morph_type
        })

    def get_all_by_game(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_id': game_id})

    def get_all_by_layer(self, game_id: int, layer_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_id': game_id, 'layer_id': layer_id})

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        kwargs['updated_at'] = now
        return self.exec.update_by_id(record_id, kwargs)

    def upsert_population(self, game_id: int, layer_id: int, morph_type: int, count: int) -> int:
        existing = self.get_by_game_layer_morph(game_id, layer_id, morph_type)
        if existing:
            return self.update(existing['id'], count=count)
        else:
            return self.create(game_id=game_id, layer_id=layer_id, morph_type=morph_type, count=count)

    def delete_by_game(self, game_id: int) -> int:
        return self.exec.delete({'game_id': game_id})

    def get_total_population_in_layer(self, game_id: int, layer_id: int) -> int:
        populations = self.get_all_by_layer(game_id, layer_id)
        return sum(p['count'] for p in populations)

    def create_initial_population(self, game_id: int, layer_id: int,
                                  fungi: int = 0, bacteria: int = 0, nematode: int = 0):
        if fungi > 0:
            self.upsert_population(game_id, layer_id, MORPH_FUNGI, fungi)
        if bacteria > 0:
            self.upsert_population(game_id, layer_id, MORPH_BACTERIA, bacteria)
        if nematode > 0:
            self.upsert_population(game_id, layer_id, MORPH_NEMATODE, nematode)
