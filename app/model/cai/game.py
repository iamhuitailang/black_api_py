from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameModel:
    TABLE_NAME = 'tb_cai_games'

    STATUS_DRAWING = 0
    STATUS_GUESSING = 1
    STATUS_CORRECT = 2
    STATUS_TIMEOUT = 3

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
                room_id INTEGER DEFAULT 0,
                room_code TEXT DEFAULT '',
                round INTEGER DEFAULT 1,
                animal_id INTEGER DEFAULT 0,
                animal_name TEXT DEFAULT '',
                drawer_id INTEGER DEFAULT 0,
                drawer_name TEXT DEFAULT '',
                guesser_id INTEGER DEFAULT 0,
                guesser_name TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                guess_answer TEXT DEFAULT '',
                is_correct INTEGER DEFAULT 0,
                score_awarded INTEGER DEFAULT 0,
                time_used INTEGER DEFAULT 0,
                drawing_data TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_room_id ON {cls.TABLE_NAME}(room_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_drawer_id ON {cls.TABLE_NAME}(drawer_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, room_id: int, room_code: str, round_num: int, animal_id: int, animal_name: str,
               drawer_id: int, drawer_name: str, guesser_id: int = 0, guesser_name: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'room_id': room_id,
            'room_code': room_code,
            'round': round_num,
            'animal_id': animal_id,
            'animal_name': animal_name,
            'drawer_id': drawer_id,
            'drawer_name': drawer_name,
            'guesser_id': guesser_id,
            'guesser_name': guesser_name,
            'status': self.STATUS_DRAWING,
            'guess_answer': '',
            'is_correct': 0,
            'score_awarded': 0,
            'time_used': 0,
            'drawing_data': '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_room_and_round(self, room_id: int, round_num: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'room_id': room_id, 'round': round_num}, order_by='id DESC')

    def get_by_room(self, room_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'room_id': room_id}, order_by='round ASC')

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def update_guess(self, record_id: int, guess_answer: str, is_correct: int, score_awarded: int, time_used: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'guess_answer': guess_answer,
            'is_correct': is_correct,
            'score_awarded': score_awarded,
            'time_used': time_used,
            'status': self.STATUS_CORRECT if is_correct else self.STATUS_GUESSING,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def update_drawing(self, record_id: int, drawing_data: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'drawing_data': drawing_data,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def mark_timeout(self, record_id: int, time_used: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_TIMEOUT,
            'time_used': time_used,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_user_games(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["(drawer_id = ? OR guesser_id = ?)"]
        params = [user_id, user_id]

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY id DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_DRAWING: '作画中',
            self.STATUS_GUESSING: '猜题中',
            self.STATUS_CORRECT: '答对了',
            self.STATUS_TIMEOUT: '超时'
        }
        return status_map.get(status, '未知')

    def to_dict(self, game: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': game.get('id'),
            'room_id': game.get('room_id'),
            'room_code': game.get('room_code'),
            'round': game.get('round'),
            'animal_id': game.get('animal_id'),
            'animal_name': game.get('animal_name'),
            'drawer_id': game.get('drawer_id'),
            'drawer_name': game.get('drawer_name'),
            'guesser_id': game.get('guesser_id'),
            'guesser_name': game.get('guesser_name'),
            'status': game.get('status'),
            'status_text': self.get_status_text(game.get('status')),
            'guess_answer': game.get('guess_answer'),
            'is_correct': game.get('is_correct'),
            'score_awarded': game.get('score_awarded'),
            'time_used': game.get('time_used'),
            'drawing_data': game.get('drawing_data'),
            'created_at': game.get('created_at')
        }
