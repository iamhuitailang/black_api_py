from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScTeamModel:
    TABLE_NAME = 'tb_sc_model_teams'

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
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                owner_id INTEGER NOT NULL,
                logo TEXT DEFAULT '',
                team_level INTEGER DEFAULT 1,
                reputation INTEGER DEFAULT 0,
                coins INTEGER DEFAULT 0,
                max_members INTEGER DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_owner_id ON {cls.TABLE_NAME}(owner_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_team_level ON {cls.TABLE_NAME}(team_level)"
        db.execute(index_sql)

    def create(self, name: str, owner_id: int, description: str = '', logo: str = '',
               team_level: int = 1, max_members: int = 10) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'owner_id': owner_id,
            'logo': logo,
            'team_level': team_level,
            'reputation': 0,
            'coins': 0,
            'max_members': max_members,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_owner_id(self, owner_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'owner_id': owner_id})

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'logo', 'team_level', 'max_members'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_reputation(self, record_id: int, delta: int) -> int:
        team = self.get_by_id(record_id)
        if not team:
            return 0

        current_rep = team.get('reputation', 0)
        new_rep = max(0, current_rep + delta)

        now = datetime.now().isoformat()
        data = {
            'reputation': new_rep,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def update_coins(self, record_id: int, delta: int) -> int:
        team = self.get_by_id(record_id)
        if not team:
            return 0

        current_coins = team.get('coins', 0)
        new_coins = max(0, current_coins + delta)

        now = datetime.now().isoformat()
        data = {
            'coins': new_coins,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
