from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class XiangqiGameStateModel:
    TABLE_NAME = 'tb_xiangqi077_model_game_state'

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
                game_id INTEGER NOT NULL UNIQUE,
                fen TEXT DEFAULT '',
                current_turn TEXT DEFAULT 'red',
                move_count INTEGER DEFAULT 0,
                red_time INTEGER DEFAULT 0,
                black_time INTEGER DEFAULT 0,
                last_move_from TEXT DEFAULT '',
                last_move_to TEXT DEFAULT '',
                undo_requested INTEGER DEFAULT 0,
                undo_requester TEXT DEFAULT '',
                draw_requested INTEGER DEFAULT 0,
                draw_requester TEXT DEFAULT '',
                extra_data TEXT DEFAULT '',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)

    def save_state(self, game_id: int, fen: str, current_turn: str, move_count: int,
                   red_time: int = 0, black_time: int = 0,
                   last_move_from: str = '', last_move_to: str = '',
                   extra_data: str = '') -> int:
        existing = self.query.find_one({'game_id': game_id})
        now = datetime.now().isoformat()
        data = {
            'fen': fen,
            'current_turn': current_turn,
            'move_count': move_count,
            'red_time': red_time,
            'black_time': black_time,
            'last_move_from': last_move_from,
            'last_move_to': last_move_to,
            'extra_data': extra_data,
            'updated_at': now
        }
        if existing:
            self.exec.update_by_id(existing.get('id'), data)
            return existing.get('id')
        else:
            data['game_id'] = game_id
            data['undo_requested'] = 0
            data['undo_requester'] = ''
            data['draw_requested'] = 0
            data['draw_requester'] = ''
            return self.exec.insert(data)

    def get_state(self, game_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'game_id': game_id})

    def set_undo_request(self, game_id: int, requester: str) -> int:
        existing = self.query.find_one({'game_id': game_id})
        if not existing:
            return 0
        now = datetime.now().isoformat()
        data = {'undo_requested': 1, 'undo_requester': requester, 'updated_at': now}
        return self.exec.update_by_id(existing.get('id'), data)

    def clear_undo_request(self, game_id: int) -> int:
        existing = self.query.find_one({'game_id': game_id})
        if not existing:
            return 0
        now = datetime.now().isoformat()
        data = {'undo_requested': 0, 'undo_requester': '', 'updated_at': now}
        return self.exec.update_by_id(existing.get('id'), data)

    def set_draw_request(self, game_id: int, requester: str) -> int:
        existing = self.query.find_one({'game_id': game_id})
        if not existing:
            return 0
        now = datetime.now().isoformat()
        data = {'draw_requested': 1, 'draw_requester': requester, 'updated_at': now}
        return self.exec.update_by_id(existing.get('id'), data)

    def clear_draw_request(self, game_id: int) -> int:
        existing = self.query.find_one({'game_id': game_id})
        if not existing:
            return 0
        now = datetime.now().isoformat()
        data = {'draw_requested': 0, 'draw_requester': '', 'updated_at': now}
        return self.exec.update_by_id(existing.get('id'), data)

    def delete_state(self, game_id: int) -> int:
        existing = self.query.find_one({'game_id': game_id})
        if existing:
            return self.exec.delete_by_id(existing.get('id'))
        return 0
