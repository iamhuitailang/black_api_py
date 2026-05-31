from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MindMapEdgeModel:
    TABLE_NAME = 'tb_siwei_077_model_mind_map_edge'

    LINE_CURVE = 'curve'
    LINE_STRAIGHT = 'straight'
    LINE_POLYLINE = 'polyline'

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
                map_id INTEGER NOT NULL,
                source_id INTEGER NOT NULL,
                target_id INTEGER NOT NULL,
                label TEXT DEFAULT '',
                line_type TEXT DEFAULT 'curve',
                line_color TEXT DEFAULT '#909399',
                line_width REAL DEFAULT 2,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_map_id ON {cls.TABLE_NAME}(map_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_source_id ON {cls.TABLE_NAME}(source_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target_id ON {cls.TABLE_NAME}(target_id)"
        db.execute(index_sql)

    def create(self, map_id: int, source_id: int, target_id: int, label: str = '',
               line_type: str = 'curve', line_color: str = '#909399', line_width: float = 2) -> int:
        now = datetime.now().isoformat()
        data = {
            'map_id': map_id,
            'source_id': source_id,
            'target_id': target_id,
            'label': label,
            'line_type': line_type,
            'line_color': line_color,
            'line_width': line_width,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_map(self, map_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'map_id': map_id}, order_by='id ASC')

    def update(self, edge_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'label', 'line_type', 'line_color', 'line_width'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(edge_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_map(self, map_id: int) -> int:
        return self.exec.delete({'map_id': map_id})

    def delete_by_node(self, map_id: int, node_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE map_id = ? AND (source_id = ? OR target_id = ?)"
        cursor = self.db.execute(sql, (map_id, node_id, node_id))
        return cursor.rowcount

    def batch_create(self, map_id: int, edges: List[Dict[str, Any]]) -> List[int]:
        ids = []
        for edge in edges:
            edge_id = self.create(
                map_id=map_id,
                source_id=edge.get('source_id'),
                target_id=edge.get('target_id'),
                label=edge.get('label', ''),
                line_type=edge.get('line_type', 'curve'),
                line_color=edge.get('line_color', '#909399'),
                line_width=edge.get('line_width', 2)
            )
            ids.append(edge_id)
        return ids

    def to_dict(self, edge: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': edge.get('id'),
            'map_id': edge.get('map_id'),
            'source_id': edge.get('source_id'),
            'target_id': edge.get('target_id'),
            'label': edge.get('label'),
            'line_type': edge.get('line_type'),
            'line_color': edge.get('line_color'),
            'line_width': edge.get('line_width'),
            'created_at': edge.get('created_at'),
            'updated_at': edge.get('updated_at')
        }
