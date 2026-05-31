from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameRecordModel:
    TABLE_NAME = 'tb_doudizhu_model_game_records'

    RESULT_WIN = 1
    RESULT_LOSE = 0

    ROLE_LANDLORD = 1
    ROLE_PEASANT = 0

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
                user_id INTEGER NOT NULL,
                game_type INTEGER DEFAULT 0,
                ai_difficulty INTEGER DEFAULT 1,
                role INTEGER DEFAULT 0,
                result INTEGER DEFAULT 0,
                score INTEGER DEFAULT 0,
                coins_change INTEGER DEFAULT 0,
                bomb_count INTEGER DEFAULT 0,
                is_spring INTEGER DEFAULT 0,
                play_cards TEXT DEFAULT '',
                played_cards TEXT DEFAULT '',
                duration INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_result ON {cls.TABLE_NAME}(result)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, user_id: int, game_type: int = 0, ai_difficulty: int = 1, role: int = 0,
               result: int = 0, score: int = 0, coins_change: int = 0, bomb_count: int = 0,
               is_spring: int = 0, play_cards: str = '', played_cards: str = '', duration: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'game_type': game_type,
            'ai_difficulty': ai_difficulty,
            'role': role,
            'result': result,
            'score': score,
            'coins_change': coins_change,
            'bomb_count': bomb_count,
            'is_spring': is_spring,
            'play_cards': play_cards,
            'played_cards': played_cards,
            'duration': duration,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as total_games,
                SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) as win_count,
                SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as lose_count,
                SUM(score) as total_score,
                AVG(score) as avg_score,
                SUM(CASE WHEN role = 1 THEN 1 ELSE 0 END) as landlord_count,
                SUM(CASE WHEN role = 1 AND result = 1 THEN 1 ELSE 0 END) as landlord_win_count,
                SUM(bomb_count) as total_bombs,
                SUM(CASE WHEN is_spring = 1 THEN 1 ELSE 0 END) as spring_count,
                SUM(coins_change) as total_coins_change
            FROM {self.TABLE_NAME} 
            WHERE user_id = ?
        """
        result = self.db.fetch_one(sql, (user_id,))
        if not result:
            return {
                'total_games': 0,
                'win_count': 0,
                'lose_count': 0,
                'total_score': 0,
                'avg_score': 0,
                'landlord_count': 0,
                'landlord_win_count': 0,
                'total_bombs': 0,
                'spring_count': 0,
                'total_coins_change': 0,
                'win_rate': 0
            }
        total_games = result.get('total_games', 0)
        win_count = result.get('win_count', 0)
        win_rate = round(win_count / total_games * 100, 2) if total_games > 0 else 0
        result['win_rate'] = win_rate
        return result

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None,
                result: int = None, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if user_id is not None:
            where_clauses.append("user_id = ?")
            params.append(user_id)

        if result is not None:
            where_clauses.append("result = ?")
            params.append(result)

        if start_date:
            where_clauses.append("created_at >= ?")
            params.append(start_date)

        if end_date:
            where_clauses.append("created_at <= ?")
            params.append(end_date + ' 23:59:59')

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY created_at DESC 
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

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_result_text(self, result: int) -> str:
        result_map = {
            self.RESULT_WIN: '胜利',
            self.RESULT_LOSE: '失败'
        }
        return result_map.get(result, '未知')

    def get_role_text(self, role: int) -> str:
        role_map = {
            self.ROLE_LANDLORD: '地主',
            self.ROLE_PEASANT: '农民'
        }
        return role_map.get(role, '未知')

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'game_type': record.get('game_type'),
            'ai_difficulty': record.get('ai_difficulty'),
            'role': record.get('role'),
            'role_text': self.get_role_text(record.get('role')),
            'result': record.get('result'),
            'result_text': self.get_result_text(record.get('result')),
            'score': record.get('score'),
            'coins_change': record.get('coins_change'),
            'bomb_count': record.get('bomb_count'),
            'is_spring': record.get('is_spring'),
            'duration': record.get('duration'),
            'created_at': record.get('created_at')
        }
