from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class XiangqiGameMoveModel:
    TABLE_NAME = 'tb_xiangqi077_model_game_move'

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
                move_number INTEGER NOT NULL,
                player TEXT NOT NULL,
                piece TEXT NOT NULL,
                from_pos TEXT NOT NULL,
                to_pos TEXT NOT NULL,
                fen_after TEXT DEFAULT '',
                is_undo INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)

    def create(self, game_id: int, move_number: int, player: str, piece: str,
               from_pos: str, to_pos: str, fen_after: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'move_number': move_number,
            'player': player,
            'piece': piece,
            'from_pos': from_pos,
            'to_pos': to_pos,
            'fen_after': fen_after,
            'is_undo': 0,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_game_moves(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'game_id': game_id, 'is_undo': 0},
            order_by='move_number ASC'
        )

    def get_last_move(self, game_id: int) -> Optional[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE game_id = ? AND is_undo = 0 ORDER BY move_number DESC LIMIT 1"
        return self.db.fetch_one(sql, (game_id,))

    def mark_undo(self, move_id: int) -> int:
        data = {'is_undo': 1}
        return self.exec.update_by_id(move_id, data)

    def get_move_count(self, game_id: int) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE game_id = ? AND is_undo = 0"
        result = self.db.fetch_one(sql, (game_id,))
        return result['total'] if result else 0
