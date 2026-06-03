from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScTeamMemberModel:
    TABLE_NAME = 'tb_sc_model_team_members'

    ROLE_OWNER = 'owner'
    ROLE_ENGINEER = 'engineer'
    ROLE_DRIVER = 'driver'
    ROLE_MECHANIC = 'mechanic'

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
                team_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                role TEXT NOT NULL DEFAULT 'driver',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                contribution_points INTEGER DEFAULT 0
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_team_id ON {cls.TABLE_NAME}(team_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_team_user ON {cls.TABLE_NAME}(team_id, user_id)"
        db.execute(index_sql)

    def create(self, team_id: int, user_id: int, role: str = 'driver') -> int:
        now = datetime.now().isoformat()
        data = {
            'team_id': team_id,
            'user_id': user_id,
            'role': role,
            'joined_at': now,
            'contribution_points': 0
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_team_id(self, team_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'team_id': team_id}, order_by='id DESC')

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='id DESC')

    def get_by_team_and_user(self, team_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'team_id': team_id, 'user_id': user_id})

    def update_role(self, record_id: int, role: str) -> int:
        data = {
            'role': role
        }
        return self.exec.update_by_id(record_id, data)

    def update_contribution(self, record_id: int, points: int) -> int:
        member = self.get_by_id(record_id)
        if not member:
            return 0

        current_points = member.get('contribution_points', 0)
        new_points = max(0, current_points + points)

        data = {
            'contribution_points': new_points
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_role_text(self, role: str) -> str:
        role_map = {
            self.ROLE_OWNER: '队长',
            self.ROLE_ENGINEER: '工程师',
            self.ROLE_DRIVER: '车手',
            self.ROLE_MECHANIC: '机械师'
        }
        return role_map.get(role, '未知')
