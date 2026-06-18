from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class VaultSaveModel:
    TABLE_NAME = 'vault_saves'

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
                name TEXT NOT NULL DEFAULT 'Vault 101',
                day INTEGER NOT NULL DEFAULT 1,
                capacity INTEGER NOT NULL DEFAULT 4,
                current_energy INTEGER NOT NULL DEFAULT 50,
                current_water INTEGER NOT NULL DEFAULT 50,
                current_food INTEGER NOT NULL DEFAULT 50,
                current_medicine INTEGER NOT NULL DEFAULT 20,
                max_energy INTEGER NOT NULL DEFAULT 100,
                max_water INTEGER NOT NULL DEFAULT 100,
                max_food INTEGER NOT NULL DEFAULT 100,
                max_medicine INTEGER NOT NULL DEFAULT 50,
                event_counter INTEGER NOT NULL DEFAULT 0,
                wanderer_pending TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_updated_at ON {cls.TABLE_NAME}(updated_at)"
        db.execute(index_sql)

    @classmethod
    def migrate_add_wanderer_pending(cls):
        db = get_db()
        cols = db.fetch_all(f"PRAGMA table_info({cls.TABLE_NAME})")
        col_names = [c['name'] for c in cols]
        if 'wanderer_pending' not in col_names:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN wanderer_pending TEXT DEFAULT NULL")
            return True
        return False

    def create(self, name: str = 'Vault 101') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'day': 1,
            'capacity': 4,
            'current_energy': 50,
            'current_water': 50,
            'current_food': 50,
            'current_medicine': 20,
            'max_energy': 100,
            'max_water': 100,
            'max_food': 100,
            'max_medicine': 50,
            'event_counter': 0,
            'wanderer_pending': None,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, save_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(save_id)

    def get_latest(self) -> Optional[Dict[str, Any]]:
        return self.query.find_one(order_by='id DESC')

    def update_save(self, save_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = dict(kwargs)
        data['updated_at'] = now
        return self.exec.update_by_id(save_id, data)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='updated_at DESC')

    def delete(self, save_id: int) -> int:
        return self.exec.delete_by_id(save_id)


class VaultResidentModel:
    TABLE_NAME = 'vault_residents'

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
                save_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                hunger INTEGER NOT NULL DEFAULT 80,
                health INTEGER NOT NULL DEFAULT 100,
                mood INTEGER NOT NULL DEFAULT 80,
                assignment TEXT NOT NULL DEFAULT 'idle',
                skills TEXT DEFAULT '{{}}',
                is_alive INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_save_id ON {cls.TABLE_NAME}(save_id)"
        db.execute(index_sql)

    def create(self, save_id: int, name: str, hunger: int = 80, health: int = 100,
               mood: int = 80, assignment: str = 'idle') -> int:
        now = datetime.now().isoformat()
        data = {
            'save_id': save_id,
            'name': name,
            'hunger': hunger,
            'health': health,
            'mood': mood,
            'assignment': assignment,
            'is_alive': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, resident_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(resident_id)

    def get_by_save(self, save_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'save_id': save_id, 'is_alive': 1}, order_by='id ASC')

    def update_resident(self, resident_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = dict(kwargs)
        data['updated_at'] = now
        return self.exec.update_by_id(resident_id, data)

    def delete(self, resident_id: int) -> int:
        return self.exec.delete_by_id(resident_id)

    def count_by_save(self, save_id: int) -> int:
        return self.query.count({'save_id': save_id, 'is_alive': 1})


class VaultFacilityModel:
    TABLE_NAME = 'vault_facilities'

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
                save_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                level INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_save_id ON {cls.TABLE_NAME}(save_id)"
        db.execute(index_sql)

    def create(self, save_id: int, facility_type: str, level: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'save_id': save_id,
            'type': facility_type,
            'level': level,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_save(self, save_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'save_id': save_id}, order_by='type ASC')

    def get_by_type(self, save_id: int, facility_type: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'save_id': save_id, 'type': facility_type})

    def update_facility(self, facility_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = dict(kwargs)
        data['updated_at'] = now
        return self.exec.update_by_id(facility_id, data)


class VaultResourceModel:
    TABLE_NAME = 'vault_resources'

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
                save_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                amount INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def create(self, save_id: int, resource_type: str, amount: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'save_id': save_id,
            'type': resource_type,
            'amount': amount,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_save(self, save_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'save_id': save_id})

    def update_resource(self, resource_id: int, amount: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'amount': amount,
            'updated_at': now
        }
        return self.exec.update_by_id(resource_id, data)


class VaultLogModel:
    TABLE_NAME = 'vault_logs'

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
                save_id INTEGER NOT NULL,
                day INTEGER NOT NULL,
                type TEXT NOT NULL DEFAULT 'info',
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_save_id_day ON {cls.TABLE_NAME}(save_id, day)"
        db.execute(index_sql)

    def create(self, save_id: int, day: int, log_type: str, message: str) -> int:
        data = {
            'save_id': save_id,
            'day': day,
            'type': log_type,
            'message': message
        }
        return self.exec.insert(data)

    def get_by_save(self, save_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        return self.query.find_all({'save_id': save_id}, order_by='id DESC', limit=limit)

    def get_by_day(self, save_id: int, day: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'save_id': save_id, 'day': day}, order_by='id ASC')
