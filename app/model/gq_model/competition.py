from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GqCompetitionModel:
    TABLE_NAME = 'tb_gq_model_competition'

    STATUS_UPCOMING = 0
    STATUS_ACTIVE = 1
    STATUS_ENDED = 2
    STATUS_CANCELLED = 3

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
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                track_id INTEGER NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                max_participants INTEGER DEFAULT 100,
                reward_coins INTEGER DEFAULT 0,
                reward_gems INTEGER DEFAULT 0,
                reward_magic_id INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        indexes = [
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_track_id ON {cls.TABLE_NAME}(track_id)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_start_time ON {cls.TABLE_NAME}(start_time)",
            f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_end_time ON {cls.TABLE_NAME}(end_time)"
        ]
        for index_sql in indexes:
            db.execute(index_sql)

    def create(self, title: str, description: str, track_id: int, start_time: str, end_time: str,
               max_participants: int = 100, reward_coins: int = 0, reward_gems: int = 0,
               reward_magic_id: int = 0, status: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'description': description,
            'track_id': track_id,
            'start_time': start_time,
            'end_time': end_time,
            'max_participants': max_participants,
            'reward_coins': reward_coins,
            'reward_gems': reward_gems,
            'reward_magic_id': reward_magic_id,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, competition_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'description', 'track_id', 'start_time', 'end_time',
            'max_participants', 'reward_coins', 'reward_gems', 'reward_magic_id', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(competition_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(
            page, page_size,
            conditions=conditions if conditions else None,
            order_by='created_at DESC'
        )

    def get_active_competitions(self) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'status': self.STATUS_ACTIVE},
            order_by='start_time ASC'
        )

    def get_upcoming_competitions(self) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'status': self.STATUS_UPCOMING},
            order_by='start_time ASC'
        )

    def get_participant_count(self, competition_id: int) -> int:
        from app.model.gq_model.competition_entry import GqCompetitionEntryModel
        entry_model = GqCompetitionEntryModel()
        return entry_model.query.count(conditions={'competition_id': competition_id})

    @classmethod
    def init_default_competitions(cls):
        model = cls()
        if model.query.count() > 0:
            return

        now = datetime.now()
        active_start = now - timedelta(days=1)
        active_end = now + timedelta(days=7)
        upcoming_start = now + timedelta(days=7)
        upcoming_end = now + timedelta(days=14)

        model.create(
            title='Spring Melody Challenge',
            description='Play the Spring Melody track and compete for the highest score!',
            track_id=1,
            start_time=active_start.isoformat(),
            end_time=active_end.isoformat(),
            max_participants=100,
            reward_coins=500,
            reward_gems=10,
            reward_magic_id=1,
            status=cls.STATUS_ACTIVE
        )

        model.create(
            title='Midnight Sonata Cup',
            description='An upcoming competition on the Midnight Sonata track. Get ready!',
            track_id=2,
            start_time=upcoming_start.isoformat(),
            end_time=upcoming_end.isoformat(),
            max_participants=50,
            reward_coins=1000,
            reward_gems=25,
            reward_magic_id=2,
            status=cls.STATUS_UPCOMING
        )
