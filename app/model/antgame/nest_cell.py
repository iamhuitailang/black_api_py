from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class NestCellModel:
    TABLE_NAME = 'ant_game_nest_cell'
    
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
                save_id INTEGER NOT NULL,
                grid_x INTEGER NOT NULL,
                grid_y INTEGER NOT NULL,
                cell_type TEXT NOT NULL,
                food INTEGER DEFAULT 0,
                dirt INTEGER DEFAULT 0,
                has_queen INTEGER DEFAULT 0,
                is_under_construction INTEGER DEFAULT 0,
                construction_progress INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_save_id_grid ON {cls.TABLE_NAME}(save_id, grid_x, grid_y)"
        db.execute(index_sql)

    def create(self, save_id: int, grid_x: int, grid_y: int, cell_type: str,
               food: int = 0, dirt: int = 0, has_queen: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'save_id': save_id,
            'grid_x': grid_x,
            'grid_y': grid_y,
            'cell_type': cell_type,
            'food': food,
            'dirt': dirt,
            'has_queen': has_queen,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def create_many(self, cells: List[Dict[str, Any]]) -> int:
        now = datetime.now().isoformat()
        data_list = []
        for cell in cells:
            data = {
                'save_id': cell['save_id'],
                'grid_x': cell['grid_x'],
                'grid_y': cell['grid_y'],
                'cell_type': cell['cell_type'],
                'food': cell.get('food', 0),
                'dirt': cell.get('dirt', 0),
                'has_queen': cell.get('has_queen', 0),
                'created_at': now,
                'updated_at': now
            }
            data_list.append(data)
        return self.exec.insert_many(data_list)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_save_id(self, save_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'save_id': save_id}, order_by='grid_y ASC, grid_x ASC')

    def get_by_position(self, save_id: int, grid_x: int, grid_y: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'save_id': save_id, 'grid_x': grid_x, 'grid_y': grid_y})

    def get_by_type(self, save_id: int, cell_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'save_id': save_id, 'cell_type': cell_type})

    def count_by_save(self, save_id: int) -> int:
        return self.query.count({'save_id': save_id})

    def count_by_type(self, save_id: int, cell_type: str) -> int:
        return self.query.count({'save_id': save_id, 'cell_type': cell_type})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_save_id(self, save_id: int) -> int:
        return self.exec.delete({'save_id': save_id})
