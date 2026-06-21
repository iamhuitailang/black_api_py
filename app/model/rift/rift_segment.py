from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RiftSegmentModel:
    TABLE_NAME = 'rift_segment'

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
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                prev_x INTEGER,
                prev_y INTEGER,
                branch_id INTEGER NOT NULL DEFAULT 1,
                is_sealed INTEGER NOT NULL DEFAULT 0,
                is_node INTEGER NOT NULL DEFAULT 0,
                turn_created INTEGER NOT NULL DEFAULT 0,
                turn_sealed INTEGER,
                has_anchor INTEGER NOT NULL DEFAULT 0,
                anchor_turns_left INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_branch ON {cls.TABLE_NAME}(game_id, branch_id)"
        db.execute(index_sql2)

    def create(self, game_id: int, x: int, y: int, prev_x: int = None, prev_y: int = None,
               branch_id: int = 1, is_node: int = 0, turn_created: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'x': x,
            'y': y,
            'prev_x': prev_x,
            'prev_y': prev_y,
            'branch_id': branch_id,
            'is_sealed': 0,
            'is_node': is_node,
            'turn_created': turn_created,
            'turn_sealed': None,
            'has_anchor': 0,
            'anchor_turns_left': 0,
            'created_at': now
        }
        return self.exec.insert(data)

    def create_many(self, segments: List[Dict[str, Any]]) -> int:
        now = datetime.now().isoformat()
        data_list = []
        for seg in segments:
            data_list.append({
                'game_id': seg['game_id'],
                'x': seg['x'],
                'y': seg['y'],
                'prev_x': seg.get('prev_x'),
                'prev_y': seg.get('prev_y'),
                'branch_id': seg.get('branch_id', 1),
                'is_sealed': 0,
                'is_node': seg.get('is_node', 0),
                'turn_created': seg.get('turn_created', 0),
                'turn_sealed': None,
                'has_anchor': 0,
                'anchor_turns_left': 0,
                'created_at': now
            })
        return self.exec.insert_many(data_list)

    def get_by_game_id(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'game_id': game_id}, order_by='id ASC')

    def get_unsealed_by_game_id(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'game_id': game_id, 'is_sealed': 0},
            order_by='id ASC'
        )

    def get_edge_segments(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'game_id': game_id, 'is_sealed': 0, 'is_node': 0},
            order_by='id ASC'
        )

    def get_node_segments(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'game_id': game_id, 'is_sealed': 0, 'is_node': 1},
            order_by='id ASC'
        )

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        return self.exec.update_by_id(record_id, data)

    def seal_segment(self, record_id: int, turn: int) -> int:
        return self.exec.update_by_id(record_id, {'is_sealed': 1, 'turn_sealed': turn})

    def seal_segments(self, segment_ids: List[int], turn: int) -> int:
        if not segment_ids:
            return 0
        placeholders = ','.join(['?' for _ in segment_ids])
        sql = f"UPDATE {self.TABLE_NAME} SET is_sealed = 1, turn_sealed = ? WHERE id IN ({placeholders})"
        params = tuple([turn] + segment_ids)
        cursor = self.db.execute(sql, params)
        return cursor.rowcount

    def set_anchor(self, record_id: int, turns: int = 3) -> int:
        return self.exec.update_by_id(record_id, {'has_anchor': 1, 'anchor_turns_left': turns})

    def count_by_game_id(self, game_id: int, is_sealed: int = None) -> int:
        conditions = {'game_id': game_id}
        if is_sealed is not None:
            conditions['is_sealed'] = is_sealed
        return self.query.count(conditions=conditions)

    def count_branches(self, game_id: int) -> int:
        sql = f"SELECT COUNT(DISTINCT branch_id) as cnt FROM {self.TABLE_NAME} WHERE game_id = ? AND is_sealed = 0"
        result = self.db.fetch_one(sql, (game_id,))
        return result['cnt'] if result else 0

    def decrement_anchor_turns(self, game_id: int) -> int:
        sql = f"""
            UPDATE {self.TABLE_NAME} 
            SET anchor_turns_left = anchor_turns_left - 1,
                has_anchor = CASE WHEN anchor_turns_left - 1 <= 0 THEN 0 ELSE has_anchor END
            WHERE game_id = ? AND has_anchor = 1
        """
        cursor = self.db.execute(sql, (game_id,))
        return cursor.rowcount

    def get_anchored_segments(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'game_id': game_id, 'has_anchor': 1},
            order_by='id ASC'
        )
