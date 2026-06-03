from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class BattleModel:
    TABLE_NAME = 'tb_hd_model_battle'

    TYPE_RANKED = 1
    TYPE_MATCH = 2
    TYPE_TRAINING = 3

    TYPE_MAP = {
        TYPE_RANKED: '排位',
        TYPE_MATCH: '匹配',
        TYPE_TRAINING: '训练'
    }

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
                player1_id INTEGER NOT NULL,
                player2_id INTEGER NOT NULL,
                winner_id INTEGER,
                player1_score INTEGER DEFAULT 0,
                player2_score INTEGER DEFAULT 0,
                battle_type INTEGER NOT NULL,
                duration INTEGER DEFAULT 0,
                is_finished INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player1_id ON {cls.TABLE_NAME}(player1_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player2_id ON {cls.TABLE_NAME}(player2_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_winner_id ON {cls.TABLE_NAME}(winner_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_battle_type ON {cls.TABLE_NAME}(battle_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_finished ON {cls.TABLE_NAME}(is_finished)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player ON {cls.TABLE_NAME}(player1_id, player2_id)"
        db.execute(index_sql)

    def create(self, player1_id: int, player2_id: int, battle_type: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player1_id': player1_id,
            'player2_id': player2_id,
            'winner_id': None,
            'player1_score': 0,
            'player2_score': 0,
            'battle_type': battle_type,
            'duration': 0,
            'is_finished': 0,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'player1_id', 'player2_id', 'winner_id', 'player1_score',
            'player2_score', 'battle_type', 'duration', 'is_finished'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                player_id: int = None, battle_type: int = None,
                is_finished: int = None, order_by: str = 'id DESC') -> Dict[str, Any]:
        conditions = {}
        if battle_type is not None:
            conditions['battle_type'] = battle_type
        if is_finished is not None:
            conditions['is_finished'] = is_finished

        if player_id is not None:
            return self.get_user_battles(player_id, page, page_size, battle_type, is_finished)

        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def start_battle(self, player1_id: int, player2_id: int, battle_type: int) -> Dict[str, Any]:
        battle_id = self.create(player1_id, player2_id, battle_type)
        return {
            'id': battle_id,
            'player1_id': player1_id,
            'player2_id': player2_id,
            'battle_type': battle_type,
            'is_finished': 0,
            'created_at': datetime.now().isoformat()
        }

    def end_battle(self, battle_id: int, winner_id: int,
                   player1_score: int, player2_score: int, duration: int) -> Optional[Dict[str, Any]]:
        battle = self.get_by_id(battle_id)
        if not battle:
            return None

        data = {
            'winner_id': winner_id,
            'player1_score': player1_score,
            'player2_score': player2_score,
            'duration': duration,
            'is_finished': 1
        }
        self.update(battle_id, data)

        return self.get_by_id(battle_id)

    def get_user_battles(self, user_id: int, page: int = 1, page_size: int = 10,
                        battle_type: int = None, is_finished: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["(player1_id = ? OR player2_id = ?)"]
        params = [user_id, user_id]

        if battle_type is not None:
            where_clauses.append("battle_type = ?")
            params.append(battle_type)

        if is_finished is not None:
            where_clauses.append("is_finished = ?")
            params.append(is_finished)

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

    def get_user_stats(self, user_id: int, battle_type: int = None) -> Dict[str, Any]:
        where_clauses = ["(player1_id = ? OR player2_id = ?)"]
        params = [user_id, user_id]

        if battle_type is not None:
            where_clauses.append("battle_type = ?")
            params.append(battle_type)

        where_clauses.append("is_finished = 1")

        sql = f"""
            SELECT 
                COUNT(*) as total_battles,
                SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN winner_id != ? AND winner_id IS NOT NULL THEN 1 ELSE 0 END) as losses,
                COALESCE(SUM(duration), 0) as total_duration,
                COALESCE(AVG(duration), 0) as avg_duration
            FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)}
        """
        params.extend([user_id, user_id])

        result = self.db.fetch_one(sql, tuple(params))

        total_battles = result.get('total_battles', 0) if result else 0
        wins = result.get('wins', 0) if result else 0
        losses = result.get('losses', 0) if result else 0
        total_duration = result.get('total_duration', 0) if result else 0
        avg_duration = result.get('avg_duration', 0) if result else 0
        win_rate = (wins / total_battles * 100) if total_battles > 0 else 0

        return {
            'user_id': user_id,
            'total_battles': total_battles,
            'wins': wins,
            'losses': losses,
            'win_rate': round(win_rate, 2),
            'total_duration': total_duration,
            'avg_duration': round(avg_duration, 2)
        }

    def get_type_text(self, battle_type: int) -> str:
        return self.TYPE_MAP.get(battle_type, '未知')

    def to_dict(self, battle: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': battle.get('id'),
            'player1_id': battle.get('player1_id'),
            'player2_id': battle.get('player2_id'),
            'winner_id': battle.get('winner_id'),
            'player1_score': battle.get('player1_score'),
            'player2_score': battle.get('player2_score'),
            'battle_type': battle.get('battle_type'),
            'battle_type_text': self.get_type_text(battle.get('battle_type')),
            'duration': battle.get('duration'),
            'is_finished': battle.get('is_finished'),
            'created_at': battle.get('created_at')
        }
