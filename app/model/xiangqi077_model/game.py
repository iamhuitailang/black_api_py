from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class XiangqiGameModel:
    TABLE_NAME = 'tb_xiangqi077_model_game'

    TYPE_PVE = 0
    TYPE_PVP = 1

    STATUS_WAITING = 0
    STATUS_PLAYING = 1
    STATUS_FINISHED = 2

    RESULT_RED_WIN = 1
    RESULT_BLACK_WIN = 2
    RESULT_DRAW = 3

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
                game_type INTEGER DEFAULT 0,
                red_player_id INTEGER,
                black_player_id INTEGER,
                ai_level INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                result INTEGER DEFAULT 0,
                fen TEXT DEFAULT '',
                current_turn TEXT DEFAULT 'red',
                move_count INTEGER DEFAULT 0,
                last_move_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                finished_at TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_red_player ON {cls.TABLE_NAME}(red_player_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_black_player ON {cls.TABLE_NAME}(black_player_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(game_type)"
        db.execute(index_sql)

    def create(self, game_type: int, red_player_id: int, black_player_id: int = None,
               ai_level: int = 0, fen: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'game_type': game_type,
            'red_player_id': red_player_id,
            'black_player_id': black_player_id,
            'ai_level': ai_level,
            'status': self.STATUS_PLAYING if game_type == self.TYPE_PVE else self.STATUS_WAITING,
            'result': 0,
            'fen': fen,
            'current_turn': 'red',
            'move_count': 0,
            'last_move_at': now,
            'created_at': now,
            'finished_at': None
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update_fen(self, game_id: int, fen: str, current_turn: str, move_count: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'fen': fen,
            'current_turn': current_turn,
            'move_count': move_count,
            'last_move_at': now
        }
        return self.exec.update_by_id(game_id, data)

    def update_status(self, game_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {'status': status}
        if status == self.STATUS_FINISHED:
            data['finished_at'] = now
        return self.exec.update_by_id(game_id, data)

    def finish_game(self, game_id: int, result: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_FINISHED,
            'result': result,
            'finished_at': now
        }
        return self.exec.update_by_id(game_id, data)

    def join_game(self, game_id: int, black_player_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'black_player_id': black_player_id,
            'status': self.STATUS_PLAYING,
            'last_move_at': now
        }
        return self.exec.update_by_id(game_id, data)

    def get_waiting_games(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size,
            conditions={'status': self.STATUS_WAITING, 'game_type': self.TYPE_PVP},
            order_by='id DESC'
        )

    def get_user_games(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE (red_player_id = ? OR black_player_id = ?)"
        total_result = self.db.fetch_one(count_sql, (user_id, user_id))
        total = total_result['total'] if total_result else 0
        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE (red_player_id = ? OR black_player_id = ?)
            ORDER BY id DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, (user_id, user_id))
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_active_games(self, limit: int = 20) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE status = {self.STATUS_PLAYING} ORDER BY last_move_at DESC LIMIT {limit}"
        return self.db.fetch_all(sql)

    def get_all(self, page: int = 1, page_size: int = 10, game_type: int = None, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if game_type is not None:
            conditions['game_type'] = game_type
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def to_dict(self, game: Dict[str, Any]) -> Dict[str, Any]:
        type_map = {self.TYPE_PVE: '人机对战', self.TYPE_PVP: '在线对战'}
        status_map = {self.STATUS_WAITING: '等待中', self.STATUS_PLAYING: '进行中', self.STATUS_FINISHED: '已结束'}
        result_map = {0: '未结束', self.RESULT_RED_WIN: '红方胜', self.RESULT_BLACK_WIN: '黑方胜', self.RESULT_DRAW: '和棋'}
        return {
            'id': game.get('id'),
            'game_type': game.get('game_type'),
            'game_type_text': type_map.get(game.get('game_type'), '未知'),
            'red_player_id': game.get('red_player_id'),
            'black_player_id': game.get('black_player_id'),
            'ai_level': game.get('ai_level'),
            'status': game.get('status'),
            'status_text': status_map.get(game.get('status'), '未知'),
            'result': game.get('result'),
            'result_text': result_map.get(game.get('result'), '未知'),
            'fen': game.get('fen'),
            'current_turn': game.get('current_turn'),
            'move_count': game.get('move_count'),
            'last_move_at': game.get('last_move_at'),
            'created_at': game.get('created_at'),
            'finished_at': game.get('finished_at')
        }
