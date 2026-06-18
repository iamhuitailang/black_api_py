from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameStateModel:
    TABLE_NAME = 'fortress_game_state'

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
                day INTEGER DEFAULT 1,
                phase TEXT DEFAULT 'day',
                time_of_day REAL DEFAULT 0,
                water INTEGER DEFAULT 100,
                arrows INTEGER DEFAULT 50,
                oil INTEGER DEFAULT 30,
                work_hours INTEGER DEFAULT 100,
                max_work_hours INTEGER DEFAULT 100,
                fortress_hp INTEGER DEFAULT 500,
                max_fortress_hp INTEGER DEFAULT 500,
                morale INTEGER DEFAULT 80,
                is_game_over INTEGER DEFAULT 0,
                is_siege_day INTEGER DEFAULT 0,
                next_siege_day INTEGER DEFAULT 7,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create_initial(self) -> int:
        now = datetime.now().isoformat()
        data = {
            'day': 1,
            'phase': 'day',
            'time_of_day': 0,
            'water': 100,
            'arrows': 50,
            'oil': 30,
            'work_hours': 100,
            'max_work_hours': 100,
            'fortress_hp': 500,
            'max_fortress_hp': 500,
            'morale': 80,
            'is_game_over': 0,
            'is_siege_day': 0,
            'next_siege_day': 7,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_latest(self) -> Optional[Dict[str, Any]]:
        return self.query.find_one(order_by='id DESC')

    def get_by_id(self, state_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(state_id)

    def update(self, state_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(state_id, data)


class BuildingModel:
    TABLE_NAME = 'fortress_buildings'

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
                game_state_id INTEGER NOT NULL,
                building_type TEXT NOT NULL,
                position_x INTEGER NOT NULL,
                position_y INTEGER NOT NULL,
                hp INTEGER DEFAULT 100,
                max_hp INTEGER DEFAULT 100,
                level INTEGER DEFAULT 1,
                is_building INTEGER DEFAULT 0,
                build_progress REAL DEFAULT 0,
                build_time REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_state_id ON {cls.TABLE_NAME}(game_state_id)"
        db.execute(index_sql)

    def create(self, game_state_id: int, building_type: str, position_x: int, 
               position_y: int, hp: int = 100, build_time: float = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_state_id': game_state_id,
            'building_type': building_type,
            'position_x': position_x,
            'position_y': position_y,
            'hp': hp,
            'max_hp': hp,
            'level': 1,
            'is_building': 1 if build_time > 0 else 0,
            'build_progress': 0,
            'build_time': build_time,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_game_state(self, game_state_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'game_state_id': game_state_id},
            order_by='position_x ASC'
        )

    def update(self, building_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(building_id, data)

    def delete(self, building_id: int) -> int:
        return self.exec.delete_by_id(building_id)

    def delete_by_game_state(self, game_state_id: int) -> int:
        return self.exec.delete(conditions={'game_state_id': game_state_id})


class EnemyWaveModel:
    TABLE_NAME = 'fortress_enemy_waves'

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
                game_state_id INTEGER NOT NULL,
                wave_number INTEGER NOT NULL,
                is_active INTEGER DEFAULT 0,
                enemies_remaining INTEGER DEFAULT 0,
                total_enemies INTEGER DEFAULT 0,
                is_siege INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_state_id ON {cls.TABLE_NAME}(game_state_id)"
        db.execute(index_sql)

    def create(self, game_state_id: int, wave_number: int, total_enemies: int,
               is_siege: bool = False) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_state_id': game_state_id,
            'wave_number': wave_number,
            'is_active': 1,
            'enemies_remaining': total_enemies,
            'total_enemies': total_enemies,
            'is_siege': 1 if is_siege else 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_active_wave(self, game_state_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            conditions={'game_state_id': game_state_id, 'is_active': 1},
            order_by='id DESC'
        )

    def update(self, wave_id: int, data: Dict[str, Any]) -> int:
        data['updated_at'] = datetime.now().isoformat()
        return self.exec.update_by_id(wave_id, data)

    def get_by_game_state(self, game_state_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'game_state_id': game_state_id},
            order_by='wave_number ASC'
        )


class GameLogModel:
    TABLE_NAME = 'fortress_game_logs'

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
                game_state_id INTEGER NOT NULL,
                day INTEGER NOT NULL,
                log_type TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_state_id ON {cls.TABLE_NAME}(game_state_id)"
        db.execute(index_sql)

    def create(self, game_state_id: int, day: int, log_type: str, message: str) -> int:
        data = {
            'game_state_id': game_state_id,
            'day': day,
            'log_type': log_type,
            'message': message
        }
        return self.exec.insert(data)

    def get_recent(self, game_state_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'game_state_id': game_state_id},
            order_by='id DESC',
            limit=limit
        )

    def delete_by_game_state(self, game_state_id: int) -> int:
        return self.exec.delete(conditions={'game_state_id': game_state_id})
