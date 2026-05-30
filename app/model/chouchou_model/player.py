from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import random


class PlayerModel:
    TABLE_NAME = 'tb_chouchou_model_players'

    ROLE_KING = 'king'
    ROLE_CIVILIAN = 'civilian'
    ROLE_CLOWN = 'clown'

    STATUS_ACTIVE = 'active'
    STATUS_ELIMINATED = 'eliminated'
    STATUS_WINNER = 'winner'

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
                user_id INTEGER NOT NULL,
                nickname TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
                role TEXT,
                seat_number INTEGER,
                score INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                is_ai INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_user ON {cls.TABLE_NAME}(game_id, user_id)"
        db.execute(index_sql)

    def create(self, game_id: int, user_id: int, nickname: str = '', avatar: str = '',
               is_ai: bool = False) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'user_id': user_id,
            'nickname': nickname,
            'avatar': avatar,
            'score': 0,
            'status': self.STATUS_ACTIVE,
            'is_ai': 1 if is_ai else 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, player_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(player_id)

    def get_by_game_and_user(self, game_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'game_id': game_id, 'user_id': user_id})

    def get_by_game(self, game_id: int, status: str = None) -> List[Dict[str, Any]]:
        conditions = {'game_id': game_id}
        if status:
            conditions['status'] = status
        return self.query.find_all(conditions, order_by='seat_number ASC, id ASC')

    def get_active_players(self, game_id: int) -> List[Dict[str, Any]]:
        return self.get_by_game(game_id, status=self.STATUS_ACTIVE)

    def assign_roles(self, game_id: int) -> List[Dict[str, Any]]:
        players = self.get_active_players(game_id)
        if not players or len(players) < 3:
            return []

        player_ids = [p['id'] for p in players]
        random.shuffle(player_ids)

        roles = []
        total = len(players)

        roles.append((player_ids[0], self.ROLE_KING))

        clown_count = max(1, total // 4)
        for i in range(1, 1 + clown_count):
            roles.append((player_ids[i], self.ROLE_CLOWN))

        for i in range(1 + clown_count, total):
            roles.append((player_ids[i], self.ROLE_CIVILIAN))

        random.shuffle(roles)

        now = datetime.now().isoformat()
        for idx, (player_id, role) in enumerate(roles):
            self.exec.update_by_id(player_id, {
                'role': role,
                'seat_number': idx + 1,
                'updated_at': now
            })

        return self.get_by_game(game_id)

    def update_score(self, player_id: int, score_delta: int) -> int:
        player = self.get_by_id(player_id)
        if not player:
            return 0

        new_score = max(0, player.get('score', 0) + score_delta)
        now = datetime.now().isoformat()
        return self.exec.update_by_id(player_id, {
            'score': new_score,
            'updated_at': now
        })

    def update_status(self, player_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(player_id, {
            'status': status,
            'updated_at': now
        })

    def eliminate_player(self, player_id: int) -> int:
        return self.update_status(player_id, self.STATUS_ELIMINATED)

    def set_winner(self, player_id: int) -> int:
        return self.update_status(player_id, self.STATUS_WINNER)

    def get_king(self, game_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'game_id': game_id,
            'role': self.ROLE_KING,
            'status': self.STATUS_ACTIVE
        })

    def get_role_text(self, role: str) -> str:
        role_map = {
            self.ROLE_KING: '国王',
            self.ROLE_CIVILIAN: '平民',
            self.ROLE_CLOWN: '小丑'
        }
        return role_map.get(role, '未知')

    def get_status_text(self, status: str) -> str:
        status_map = {
            self.STATUS_ACTIVE: '存活',
            self.STATUS_ELIMINATED: '淘汰',
            self.STATUS_WINNER: '获胜'
        }
        return status_map.get(status, '未知')

    def delete_by_game(self, game_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE game_id = ?",
            (game_id,)
        )

    def to_dict(self, player: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': player.get('id'),
            'game_id': player.get('game_id'),
            'user_id': player.get('user_id'),
            'nickname': player.get('nickname'),
            'avatar': player.get('avatar'),
            'role': player.get('role'),
            'role_text': self.get_role_text(player.get('role')) if player.get('role') else '',
            'seat_number': player.get('seat_number'),
            'score': player.get('score'),
            'status': player.get('status'),
            'status_text': self.get_status_text(player.get('status')),
            'is_ai': bool(player.get('is_ai', 0)),
            'created_at': player.get('created_at'),
            'updated_at': player.get('updated_at')
        }
