from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class GameModel:
    TABLE_NAME = 'tb_chouchou_model_games'

    STATUS_WAITING = 'waiting'
    STATUS_PLAYING = 'playing'
    STATUS_FINISHED = 'finished'
    STATUS_CANCELLED = 'cancelled'

    THEME_CARNIVAL = 'carnival'
    THEME_VINTAGE = 'vintage'
    THEME_DARK = 'dark'

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
                room_code TEXT NOT NULL UNIQUE,
                host_id INTEGER NOT NULL,
                name TEXT DEFAULT '',
                theme TEXT DEFAULT 'carnival',
                max_players INTEGER DEFAULT 8,
                min_players INTEGER DEFAULT 3,
                current_round INTEGER DEFAULT 0,
                total_rounds INTEGER DEFAULT 5,
                status TEXT DEFAULT 'waiting',
                winner_id INTEGER,
                settings TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                finished_at TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_room_code ON {cls.TABLE_NAME}(room_code)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_host_id ON {cls.TABLE_NAME}(host_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, host_id: int, room_code: str, name: str = '', theme: str = 'carnival',
               max_players: int = 8, min_players: int = 3, total_rounds: int = 5,
               settings: Dict[str, Any] = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'room_code': room_code,
            'host_id': host_id,
            'name': name or f'马戏对决-{room_code}',
            'theme': theme,
            'max_players': max_players,
            'min_players': min_players,
            'current_round': 0,
            'total_rounds': total_rounds,
            'status': self.STATUS_WAITING,
            'settings': json.dumps(settings) if settings else '{}',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, game_id: int) -> Optional[Dict[str, Any]]:
        game = self.query.find_by_id(game_id)
        if game and game.get('settings'):
            try:
                game['settings'] = json.loads(game['settings'])
            except (json.JSONDecodeError, TypeError):
                game['settings'] = {}
        return game

    def get_by_room_code(self, room_code: str) -> Optional[Dict[str, Any]]:
        game = self.query.find_one({'room_code': room_code})
        if game and game.get('settings'):
            try:
                game['settings'] = json.loads(game['settings'])
            except (json.JSONDecodeError, TypeError):
                game['settings'] = {}
        return game

    def get_by_host(self, host_id: int, status: str = None) -> List[Dict[str, Any]]:
        conditions = {'host_id': host_id}
        if status:
            conditions['status'] = status
        games = self.query.find_all(conditions, order_by='id DESC')
        for game in games:
            if game.get('settings'):
                try:
                    game['settings'] = json.loads(game['settings'])
                except (json.JSONDecodeError, TypeError):
                    game['settings'] = {}
        return games

    def update_status(self, game_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        if status == self.STATUS_FINISHED:
            data['finished_at'] = now
        return self.exec.update_by_id(game_id, data)

    def update_theme(self, game_id: int, theme: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'theme': theme,
            'updated_at': now
        }
        return self.exec.update_by_id(game_id, data)

    def update_round(self, game_id: int, current_round: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'current_round': current_round,
            'updated_at': now
        }
        return self.exec.update_by_id(game_id, data)

    def set_winner(self, game_id: int, winner_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'winner_id': winner_id,
            'status': self.STATUS_FINISHED,
            'finished_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(game_id, data)

    def update_settings(self, game_id: int, settings: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data = {
            'settings': json.dumps(settings),
            'updated_at': now
        }
        return self.exec.update_by_id(game_id, data)

    def delete(self, game_id: int) -> int:
        return self.exec.delete_by_id(game_id)

    def get_active_games(self, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE status IN ('waiting', 'playing')
            ORDER BY created_at DESC 
            LIMIT {limit}
        """
        games = self.db.fetch_all(sql)
        for game in games:
            if game.get('settings'):
                try:
                    game['settings'] = json.loads(game['settings'])
                except (json.JSONDecodeError, TypeError):
                    game['settings'] = {}
        return games

    def get_user_games(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT g.* FROM {self.TABLE_NAME} g
            INNER JOIN tb_chouchou_model_players p ON g.id = p.game_id
            WHERE p.user_id = ?
            ORDER BY g.created_at DESC
            LIMIT {limit}
        """
        games = self.db.fetch_all(sql, (user_id,))
        for game in games:
            if game.get('settings'):
                try:
                    game['settings'] = json.loads(game['settings'])
                except (json.JSONDecodeError, TypeError):
                    game['settings'] = {}
        return games

    def get_status_text(self, status: str) -> str:
        status_map = {
            self.STATUS_WAITING: '等待中',
            self.STATUS_PLAYING: '进行中',
            self.STATUS_FINISHED: '已结束',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def get_theme_text(self, theme: str) -> str:
        theme_map = {
            self.THEME_CARNIVAL: '欢乐马戏城',
            self.THEME_VINTAGE: '复古马戏团',
            self.THEME_DARK: '暗夜诡马戏'
        }
        return theme_map.get(theme, '未知')

    def to_dict(self, game: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': game.get('id'),
            'room_code': game.get('room_code'),
            'host_id': game.get('host_id'),
            'name': game.get('name'),
            'theme': game.get('theme'),
            'theme_text': self.get_theme_text(game.get('theme')),
            'max_players': game.get('max_players'),
            'min_players': game.get('min_players'),
            'current_round': game.get('current_round'),
            'total_rounds': game.get('total_rounds'),
            'status': game.get('status'),
            'status_text': self.get_status_text(game.get('status')),
            'winner_id': game.get('winner_id'),
            'settings': game.get('settings', {}),
            'created_at': game.get('created_at'),
            'updated_at': game.get('updated_at'),
            'finished_at': game.get('finished_at')
        }
