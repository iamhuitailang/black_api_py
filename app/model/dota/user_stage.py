from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DotaUserStageModel:
    TABLE_NAME = 'tb_dota_user_stages'

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
                current_stage_id INTEGER DEFAULT 101,
                max_stage_id INTEGER DEFAULT 101,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, user_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'current_stage_id': 101,
            'max_stage_id': 101,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def get_or_create(self, user_id: int) -> Dict[str, Any]:
        user_stage = self.get_by_user(user_id)
        if not user_stage:
            self.create(user_id)
            user_stage = self.get_by_user(user_id)
        return user_stage or {}

    def update_current(self, user_id: int, stage_id: int) -> int:
        user_stage = self.get_by_user(user_id)
        if not user_stage:
            self.create(user_id)
            return 1

        now = datetime.now().isoformat()
        max_stage_id = max(user_stage.get('max_stage_id', 0), stage_id)
        data = {
            'current_stage_id': stage_id,
            'max_stage_id': max_stage_id,
            'updated_at': now
        }
        return self.exec.update_by_condition({'user_id': user_id}, data)

    def update_max(self, user_id: int, stage_id: int) -> int:
        user_stage = self.get_by_user(user_id)
        if not user_stage:
            return 0

        now = datetime.now().isoformat()
        max_stage_id = max(user_stage.get('max_stage_id', 0), stage_id)
        data = {
            'max_stage_id': max_stage_id,
            'updated_at': now
        }
        return self.exec.update_by_condition({'user_id': user_id}, data)

    def get_next_stage(self, user_id: int) -> Optional[Dict[str, Any]]:
        from app.model.dota.stage import DotaStageModel
        user_stage = self.get_by_user(user_id)
        if not user_stage:
            return None

        current_id = user_stage.get('current_stage_id', 101)
        stage_model = DotaStageModel()
        current_stage = stage_model.get_by_id(current_id)

        if not current_stage:
            return None

        chapter = current_stage.get('chapter', 1)
        stage_num = current_stage.get('stage_num', 1)

        next_stage = stage_model.get_by_chapter_stage(chapter, stage_num + 1)
        if next_stage:
            return next_stage

        next_chapter_stage = stage_model.get_by_chapter_stage(chapter + 1, 1)
        return next_chapter_stage

    def to_dict(self, user_stage: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user_stage.get('id'),
            'user_id': user_stage.get('user_id'),
            'current_stage_id': user_stage.get('current_stage_id'),
            'max_stage_id': user_stage.get('max_stage_id')
        }
