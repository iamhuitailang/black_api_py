from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


LAYER_LEAF = 0
LAYER_SEMI_DECAYED = 1
LAYER_HUMUS = 2
LAYER_MINERAL = 3

LAYER_NAMES = {
    LAYER_LEAF: '落叶层',
    LAYER_SEMI_DECAYED: '半腐层',
    LAYER_HUMUS: '腐殖层',
    LAYER_MINERAL: '矿质层'
}

LAYER_INITIAL_ORGANIC = {
    LAYER_LEAF: 80.0,
    LAYER_SEMI_DECAYED: 50.0,
    LAYER_HUMUS: 30.0,
    LAYER_MINERAL: 10.0
}

LAYER_INITIAL_DIFFICULTY = {
    LAYER_LEAF: 1.0,
    LAYER_SEMI_DECAYED: 2.0,
    LAYER_HUMUS: 3.0,
    LAYER_MINERAL: 4.0
}

LAYER_DEFAULT_AREA = 100.0


class LayerModel:
    TABLE_NAME = 'tb_rainforest_layer'

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
                layer_type INTEGER NOT NULL,
                organic_matter REAL NOT NULL,
                base_difficulty REAL NOT NULL,
                area REAL NOT NULL DEFAULT 100.0,
                is_depleted INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        composite_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_layer ON {cls.TABLE_NAME}(game_id, layer_type)"
        db.execute(composite_sql)

    def create(self, game_id: int, layer_type: int, organic_matter: float,
               base_difficulty: float, area: float = LAYER_DEFAULT_AREA) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'layer_type': layer_type,
            'organic_matter': organic_matter,
            'base_difficulty': base_difficulty,
            'area': area,
            'is_depleted': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_game_and_type(self, game_id: int, layer_type: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'game_id': game_id, 'layer_type': layer_type})

    def get_all_by_game(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_id': game_id}, order_by='layer_type ASC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        kwargs['updated_at'] = now
        return self.exec.update_by_id(record_id, kwargs)

    def delete_by_game(self, game_id: int) -> int:
        return self.exec.delete({'game_id': game_id})

    def create_initial_layers(self, game_id: int) -> List[int]:
        ids = []
        for layer_type in [LAYER_LEAF, LAYER_SEMI_DECAYED, LAYER_HUMUS, LAYER_MINERAL]:
            layer_id = self.create(
                game_id=game_id,
                layer_type=layer_type,
                organic_matter=LAYER_INITIAL_ORGANIC[layer_type],
                base_difficulty=LAYER_INITIAL_DIFFICULTY[layer_type],
                area=LAYER_DEFAULT_AREA
            )
            ids.append(layer_id)
        return ids
