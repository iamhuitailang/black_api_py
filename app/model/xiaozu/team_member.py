from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TeamMemberModel:
    TABLE_NAME = 'tb_xiaozu_team_members'

    ROLE_OWNER = 'owner'
    ROLE_ADMIN = 'admin'
    ROLE_MEMBER = 'member'

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
                role TEXT DEFAULT 'member',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(team_id, user_id)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_team_id ON {cls.TABLE_NAME}(team_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql2)

    def create(self, team_id: int, user_id: int, role: str = 'member') -> int:
        now = datetime.now().isoformat()
        data = {
            'team_id': team_id,
            'user_id': user_id,
            'role': role or self.ROLE_MEMBER,
            'joined_at': now
        }
        try:
            return self.exec.insert(data)
        except Exception:
            existing = self.query.find_one({'team_id': team_id, 'user_id': user_id})
            if existing:
                return existing['id']
            raise

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_team_and_user(self, team_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'team_id': team_id, 'user_id': user_id})

    def get_members_by_team(self, team_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT tm.*, u.username, u.email, u.avatar
            FROM {self.TABLE_NAME} tm
            LEFT JOIN tb_xiaozu_users u ON tm.user_id = u.id
            WHERE tm.team_id = ?
            ORDER BY tm.role = 'owner' DESC, tm.role = 'admin' DESC, tm.joined_at ASC
        """
        return self.db.fetch_all(sql, (team_id,))

    def get_teams_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT tm.*, t.name as team_name, t.description as team_description, t.invite_code, t.owner_id
            FROM {self.TABLE_NAME} tm
            LEFT JOIN tb_xiaozu_teams t ON tm.team_id = t.id
            WHERE tm.user_id = ?
            ORDER BY tm.joined_at DESC
        """
        return self.db.fetch_all(sql, (user_id,))

    def update_role(self, team_id: int, user_id: int, role: str) -> int:
        return self.exec.update(
            {'role': role},
            {'team_id': team_id, 'user_id': user_id}
        )

    def remove_member(self, team_id: int, user_id: int) -> int:
        return self.exec.delete({'team_id': team_id, 'user_id': user_id})

    def is_member(self, team_id: int, user_id: int) -> bool:
        return self.query.exists({'team_id': team_id, 'user_id': user_id})

    def get_member_count(self, team_id: int) -> int:
        return self.query.count({'team_id': team_id})

    def get_all(self, page: int = 1, page_size: int = 10, team_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if team_id:
            conditions['team_id'] = team_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')
