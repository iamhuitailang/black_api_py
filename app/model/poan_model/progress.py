import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ProgressModel:
    TABLE_NAME = 'tb_poan_model_progress'

    INVESTIGATE = 'investigate'
    EVIDENCE = 'evidence'
    TIMELINE = 'timeline'
    QUIZ = 'quiz'
    ENDING = 'ending'

    STAGES = {
        INVESTIGATE: '调查阶段',
        EVIDENCE: '举证阶段',
        TIMELINE: '时间线阶段',
        QUIZ: '问答阶段',
        ENDING: '结局阶段'
    }

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
                user_id INTEGER NOT NULL,
                case_id INTEGER NOT NULL,
                current_stage TEXT DEFAULT 'investigate',
                collected_clues TEXT DEFAULT '[]',
                talked_characters TEXT DEFAULT '[]',
                timeline_unlocked TEXT DEFAULT '[]',
                score INTEGER DEFAULT 0,
                is_completed INTEGER DEFAULT 0,
                ending_type TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_case_id ON {cls.TABLE_NAME}(case_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_case ON {cls.TABLE_NAME}(user_id, case_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_completed ON {cls.TABLE_NAME}(is_completed)"
        db.execute(index_sql)

    def create(self, user_id: int, case_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'case_id': case_id,
            'current_stage': self.INVESTIGATE,
            'collected_clues': '[]',
            'talked_characters': '[]',
            'timeline_unlocked': '[]',
            'score': 0,
            'is_completed': 0,
            'ending_type': '',
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_case(self, user_id: int, case_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'case_id': case_id})

    def update_stage(self, record_id: int, stage: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'current_stage': stage,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def add_collected_clue(self, record_id: int, clue_id: int) -> int:
        progress = self.get_by_id(record_id)
        if not progress:
            return 0

        clues = json.loads(progress.get('collected_clues', '[]'))
        if clue_id not in clues:
            clues.append(clue_id)

        now = datetime.now().isoformat()
        data = {
            'collected_clues': json.dumps(clues),
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def add_talked_character(self, record_id: int, character_id: int) -> int:
        progress = self.get_by_id(record_id)
        if not progress:
            return 0

        characters = json.loads(progress.get('talked_characters', '[]'))
        if character_id not in characters:
            characters.append(character_id)

        now = datetime.now().isoformat()
        data = {
            'talked_characters': json.dumps(characters),
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def add_timeline_unlocked(self, record_id: int, event_id: int) -> int:
        progress = self.get_by_id(record_id)
        if not progress:
            return 0

        unlocked = json.loads(progress.get('timeline_unlocked', '[]'))
        if event_id not in unlocked:
            unlocked.append(event_id)

        now = datetime.now().isoformat()
        data = {
            'timeline_unlocked': json.dumps(unlocked),
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def update_score(self, record_id: int, score: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'score': score,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def complete_case(self, record_id: int, ending_type: str = '', score: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'current_stage': self.ENDING,
            'is_completed': 1,
            'ending_type': ending_type,
            'score': score,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        return self.query.paginate(page, page_size, conditions, order_by='updated_at DESC')

    def to_dict(self, progress: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': progress.get('id'),
            'user_id': progress.get('user_id'),
            'case_id': progress.get('case_id'),
            'current_stage': progress.get('current_stage'),
            'current_stage_name': self.STAGES.get(progress.get('current_stage'), '未知'),
            'collected_clues': json.loads(progress.get('collected_clues', '[]')),
            'talked_characters': json.loads(progress.get('talked_characters', '[]')),
            'timeline_unlocked': json.loads(progress.get('timeline_unlocked', '[]')),
            'score': progress.get('score'),
            'is_completed': progress.get('is_completed'),
            'ending_type': progress.get('ending_type'),
            'created_at': progress.get('created_at'),
            'updated_at': progress.get('updated_at')
        }
