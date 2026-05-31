from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MindMapNodeModel:
    TABLE_NAME = 'tb_siwei_077_model_mind_map_node'

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
                parent_id INTEGER DEFAULT 0,
                text TEXT NOT NULL DEFAULT '',
                note TEXT DEFAULT '',
                x REAL DEFAULT 0,
                y REAL DEFAULT 0,
                width REAL DEFAULT 120,
                height REAL DEFAULT 40,
                bg_color TEXT DEFAULT '#409eff',
                text_color TEXT DEFAULT '#ffffff',
                font_size INTEGER DEFAULT 14,
                shape TEXT DEFAULT 'rect',
                priority INTEGER DEFAULT 0,
                is_collapsed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_map_id ON {cls.TABLE_NAME}(map_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_parent_id ON {cls.TABLE_NAME}(parent_id)"
        db.execute(index_sql)

    def create(self, map_id: int, text: str = '', parent_id: int = 0, x: float = 0, y: float = 0,
               bg_color: str = '#409eff', text_color: str = '#ffffff', font_size: int = 14,
               shape: str = 'rect', note: str = '', width: float = 120, height: float = 40) -> int:
        now = datetime.now().isoformat()
        data = {
            'map_id': map_id,
            'parent_id': parent_id,
            'text': text,
            'note': note,
            'x': x,
            'y': y,
            'width': width,
            'height': height,
            'bg_color': bg_color,
            'text_color': text_color,
            'font_size': font_size,
            'shape': shape,
            'priority': 0,
            'is_collapsed': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_map(self, map_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'map_id': map_id}, order_by='priority ASC, id ASC')

    def get_children(self, parent_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'parent_id': parent_id}, order_by='priority ASC, id ASC')

    def update(self, node_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'text', 'note', 'x', 'y', 'width', 'height',
            'bg_color', 'text_color', 'font_size', 'shape',
            'priority', 'is_collapsed', 'parent_id'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(node_id, update_data)

    def update_position(self, node_id: int, x: float, y: float) -> int:
        now = datetime.now().isoformat()
        data = {'x': x, 'y': y, 'updated_at': now}
        return self.exec.update_by_id(node_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def delete_by_map(self, map_id: int) -> int:
        return self.exec.delete({'map_id': map_id})

    def batch_create(self, map_id: int, nodes: List[Dict[str, Any]]) -> List[int]:
        ids = []
        for node in nodes:
            node_id = self.create(
                map_id=map_id,
                text=node.get('text', ''),
                parent_id=node.get('parent_id', 0),
                x=node.get('x', 0),
                y=node.get('y', 0),
                bg_color=node.get('bg_color', '#409eff'),
                text_color=node.get('text_color', '#ffffff'),
                font_size=node.get('font_size', 14),
                shape=node.get('shape', 'rect'),
                note=node.get('note', ''),
                width=node.get('width', 120),
                height=node.get('height', 40)
            )
            ids.append(node_id)
        return ids

    def to_dict(self, node: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': node.get('id'),
            'map_id': node.get('map_id'),
            'parent_id': node.get('parent_id'),
            'text': node.get('text'),
            'note': node.get('note'),
            'x': node.get('x'),
            'y': node.get('y'),
            'width': node.get('width'),
            'height': node.get('height'),
            'bg_color': node.get('bg_color'),
            'text_color': node.get('text_color'),
            'font_size': node.get('font_size'),
            'shape': node.get('shape'),
            'priority': node.get('priority'),
            'is_collapsed': node.get('is_collapsed'),
            'created_at': node.get('created_at'),
            'updated_at': node.get('updated_at')
        }
