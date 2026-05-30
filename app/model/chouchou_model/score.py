from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScoreModel:
    TABLE_NAME = 'tb_chouchou_model_scores'

    TYPE_COMMAND = 'command'
    TYPE_PUNISHMENT = 'punishment'
    TYPE_BONUS = 'bonus'
    TYPE_SPECIAL = 'special'
    TYPE_FINAL = 'final'

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
                player_id INTEGER NOT NULL,
                round INTEGER DEFAULT 0,
                type TEXT NOT NULL,
                score_change INTEGER NOT NULL,
                balance_after INTEGER NOT NULL,
                reason TEXT,
                related_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player_id ON {cls.TABLE_NAME}(player_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_player ON {cls.TABLE_NAME}(game_id, player_id)"
        db.execute(index_sql)

    def create(self, game_id: int, player_id: int, score_type: str, score_change: int,
               balance_after: int, round_num: int = 0, reason: str = '',
               related_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'player_id': player_id,
            'round': round_num,
            'type': score_type,
            'score_change': score_change,
            'balance_after': balance_after,
            'reason': reason,
            'related_id': related_id,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, score_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(score_id)

    def get_by_game(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_id': game_id}, order_by='id DESC')

    def get_by_player(self, game_id: int, player_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'game_id': game_id, 'player_id': player_id},
            order_by='id DESC'
        )

    def get_by_round(self, game_id: int, round_num: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'game_id': game_id, 'round': round_num},
            order_by='id ASC'
        )

    def get_player_summary(self, game_id: int, player_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                SUM(CASE WHEN type = 'command' AND score_change > 0 THEN score_change ELSE 0 END) as command_earned,
                SUM(CASE WHEN type = 'punishment' THEN score_change ELSE 0 END) as punishment_total,
                SUM(CASE WHEN type = 'bonus' THEN score_change ELSE 0 END) as bonus_total,
                SUM(CASE WHEN type = 'special' THEN score_change ELSE 0 END) as special_total,
                COUNT(*) as total_records
            FROM {self.TABLE_NAME} 
            WHERE game_id = ? AND player_id = ?
        """
        result = self.db.fetch_one(sql, (game_id, player_id))
        return result or {
            'command_earned': 0,
            'punishment_total': 0,
            'bonus_total': 0,
            'special_total': 0,
            'total_records': 0
        }

    def get_game_rankings(self, game_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT 
                s.player_id,
                p.nickname,
                p.role,
                MAX(s.balance_after) as final_score
            FROM {self.TABLE_NAME} s
            INNER JOIN tb_chouchou_model_players p ON s.player_id = p.id
            WHERE s.game_id = ?
            GROUP BY s.player_id, p.nickname, p.role
            ORDER BY final_score DESC
            LIMIT {limit}
        """
        return self.db.fetch_all(sql, (game_id,))

    def get_type_text(self, score_type: str) -> str:
        type_map = {
            self.TYPE_COMMAND: '指令奖励',
            self.TYPE_PUNISHMENT: '惩罚扣分',
            self.TYPE_BONUS: '阵营加成',
            self.TYPE_SPECIAL: '特殊技能',
            self.TYPE_FINAL: '最终结算'
        }
        return type_map.get(score_type, '未知')

    def delete_by_game(self, game_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE game_id = ?",
            (game_id,)
        )

    def to_dict(self, score: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': score.get('id'),
            'game_id': score.get('game_id'),
            'player_id': score.get('player_id'),
            'round': score.get('round'),
            'type': score.get('type'),
            'type_text': self.get_type_text(score.get('type')),
            'score_change': score.get('score_change'),
            'balance_after': score.get('balance_after'),
            'reason': score.get('reason'),
            'related_id': score.get('related_id'),
            'created_at': score.get('created_at')
        }
