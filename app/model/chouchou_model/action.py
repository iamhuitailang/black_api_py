from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ActionModel:
    TABLE_NAME = 'tb_chouchou_model_actions'

    ACTION_OBEY = 'obey'
    ACTION_REFUSE = 'refuse'
    ACTION_SABOTAGE = 'sabotage'

    RESULT_SUCCESS = 'success'
    RESULT_FAILED = 'failed'
    RESULT_PARTIAL = 'partial'

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
                command_id INTEGER NOT NULL,
                player_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                result TEXT,
                score_change INTEGER DEFAULT 0,
                is_punished INTEGER DEFAULT 0,
                punishment_reason TEXT,
                response_time INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_command_id ON {cls.TABLE_NAME}(command_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_id ON {cls.TABLE_NAME}(player_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_command_player ON {cls.TABLE_NAME}(command_id, player_id)"
        db.execute(index_sql)

    def create(self, game_id: int, command_id: int, player_id: int, action: str,
               result: str = None, score_change: int = 0, is_punished: bool = False,
               punishment_reason: str = '', response_time: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'command_id': command_id,
            'player_id': player_id,
            'action': action,
            'result': result,
            'score_change': score_change,
            'is_punished': 1 if is_punished else 0,
            'punishment_reason': punishment_reason,
            'response_time': response_time,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, action_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(action_id)

    def get_by_command(self, command_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'command_id': command_id}, order_by='id ASC')

    def get_by_player(self, game_id: int, player_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'game_id': game_id, 'player_id': player_id},
            order_by='id DESC'
        )

    def get_by_command_and_player(self, command_id: int, player_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'command_id': command_id, 'player_id': player_id})

    def update_result(self, action_id: int, result: str, score_change: int = 0,
                      is_punished: bool = False, punishment_reason: str = '') -> int:
        data = {
            'result': result,
            'score_change': score_change,
            'is_punished': 1 if is_punished else 0,
            'punishment_reason': punishment_reason
        }
        return self.exec.update_by_id(action_id, data)

    def has_responded(self, command_id: int, player_id: int) -> bool:
        return self.get_by_command_and_player(command_id, player_id) is not None

    def count_responded(self, command_id: int) -> int:
        sql = f"SELECT COUNT(*) as count FROM {self.TABLE_NAME} WHERE command_id = ?"
        result = self.db.fetch_one(sql, (command_id,))
        return result['count'] if result else 0

    def get_action_stats(self, command_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                action,
                COUNT(*) as count,
                SUM(CASE WHEN result = 'success' THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN is_punished = 1 THEN 1 ELSE 0 END) as punished_count
            FROM {self.TABLE_NAME} 
            WHERE command_id = ?
            GROUP BY action
        """
        results = self.db.fetch_all(sql, (command_id,))
        stats = {
            'total': 0,
            'obey': 0,
            'refuse': 0,
            'sabotage': 0,
            'success': 0,
            'punished': 0
        }
        for row in results:
            action = row['action']
            stats[action] = row['count']
            stats['total'] += row['count']
            stats['success'] += row['success_count']
            stats['punished'] += row['punished_count']
        return stats

    def get_action_text(self, action: str) -> str:
        action_map = {
            self.ACTION_OBEY: '服从',
            self.ACTION_REFUSE: '拒绝',
            self.ACTION_SABOTAGE: '捣乱'
        }
        return action_map.get(action, '未知')

    def get_result_text(self, result: str) -> str:
        result_map = {
            self.RESULT_SUCCESS: '成功',
            self.RESULT_FAILED: '失败',
            self.RESULT_PARTIAL: '部分成功'
        }
        return result_map.get(result, '待判定')

    def delete_by_game(self, game_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE game_id = ?",
            (game_id,)
        )

    def to_dict(self, action: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': action.get('id'),
            'game_id': action.get('game_id'),
            'command_id': action.get('command_id'),
            'player_id': action.get('player_id'),
            'action': action.get('action'),
            'action_text': self.get_action_text(action.get('action')),
            'result': action.get('result'),
            'result_text': self.get_result_text(action.get('result')),
            'score_change': action.get('score_change'),
            'is_punished': bool(action.get('is_punished', 0)),
            'punishment_reason': action.get('punishment_reason'),
            'response_time': action.get('response_time'),
            'created_at': action.get('created_at')
        }
