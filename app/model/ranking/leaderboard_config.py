from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LeaderboardConfigModel:
    TABLE_NAME = 'tb_ranking_leaderboard_config'

    PERIOD_DAILY = 'daily'
    PERIOD_WEEKLY = 'weekly'
    PERIOD_MONTHLY = 'monthly'
    PERIOD_ALL = 'all'

    SORT_DESC = 'desc'
    SORT_ASC = 'asc'

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
                game_type TEXT NOT NULL,
                name TEXT NOT NULL,
                period TEXT NOT NULL,
                reset_time TEXT DEFAULT '00:00:00',
                sort_order TEXT DEFAULT 'desc',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_type ON {cls.TABLE_NAME}(game_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_period ON {cls.TABLE_NAME}(period)"
        db.execute(index_sql)

    @classmethod
    def init_default_leaderboards(cls):
        model = cls()
        default_leaderboards = [
            {
                'game_type': 'flappy_bird',
                'name': '每日排行榜',
                'period': cls.PERIOD_DAILY,
                'reset_time': '00:00:00',
                'sort_order': cls.SORT_DESC
            },
            {
                'game_type': 'flappy_bird',
                'name': '每周排行榜',
                'period': cls.PERIOD_WEEKLY,
                'reset_time': '00:00:00',
                'sort_order': cls.SORT_DESC
            },
            {
                'game_type': 'flappy_bird',
                'name': '每月排行榜',
                'period': cls.PERIOD_MONTHLY,
                'reset_time': '00:00:00',
                'sort_order': cls.SORT_DESC
            },
            {
                'game_type': 'flappy_bird',
                'name': '总排行榜',
                'period': cls.PERIOD_ALL,
                'reset_time': '00:00:00',
                'sort_order': cls.SORT_DESC
            }
        ]

        for lb in default_leaderboards:
            existing = model.query.find_one({
                'game_type': lb['game_type'],
                'period': lb['period']
            })
            if not existing:
                model.create(**lb)

    def create(self, game_type: str, name: str, period: str, reset_time: str = '00:00:00', sort_order: str = 'desc') -> int:
        now = datetime.now().isoformat()
        data = {
            'game_type': game_type,
            'name': name,
            'period': period,
            'reset_time': reset_time,
            'sort_order': sort_order,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_game_type(self, game_type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_type': game_type}, order_by='id ASC')

    def get_by_game_and_period(self, game_type: str, period: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'game_type': game_type, 'period': period})

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'game_type', 'name', 'period', 'reset_time', 'sort_order'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_period_text(self, period: str) -> str:
        period_map = {
            self.PERIOD_DAILY: '每日',
            self.PERIOD_WEEKLY: '每周',
            self.PERIOD_MONTHLY: '每月',
            self.PERIOD_ALL: '总榜'
        }
        return period_map.get(period, '未知')
