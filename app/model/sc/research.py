from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScResearchModel:
    TABLE_NAME = 'tb_sc_model_research'

    PART_TYPE_ENGINE = 'engine'
    PART_TYPE_CHASSIS = 'chassis'
    PART_TYPE_AERODYNAMICS = 'aerodynamics'
    PART_TYPE_TIRES = 'tires'
    PART_TYPE_GEARBOX = 'gearbox'

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
                part_type TEXT NOT NULL,
                research_level INTEGER DEFAULT 1,
                progress REAL DEFAULT 0.0,
                required_exp INTEGER DEFAULT 1000,
                cost_coins INTEGER DEFAULT 5000,
                is_complete INTEGER DEFAULT 0,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_part_type ON {cls.TABLE_NAME}(part_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_complete ON {cls.TABLE_NAME}(is_complete)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_part ON {cls.TABLE_NAME}(user_id, part_type)"
        db.execute(index_sql)

    def create(self, user_id: int, part_type: str, research_level: int = 1,
               required_exp: int = 1000, cost_coins: int = 5000) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'part_type': part_type,
            'research_level': research_level,
            'progress': 0.0,
            'required_exp': required_exp,
            'cost_coins': cost_coins,
            'is_complete': 0,
            'started_at': now,
            'completed_at': None
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='started_at DESC')

    def get_by_user_and_type(self, user_id: int, part_type: str,
                            is_complete: int = None) -> List[Dict[str, Any]]:
        conditions = {
            'user_id': user_id,
            'part_type': part_type
        }
        if is_complete is not None:
            conditions['is_complete'] = is_complete
        return self.query.find_all(conditions, order_by='research_level DESC')

    def update_progress(self, record_id: int, exp_gained: float) -> Dict[str, Any]:
        research = self.get_by_id(record_id)
        if not research:
            return {'success': False, 'message': '研究项目不存在'}

        current_progress = research.get('progress', 0.0)
        required_exp = research.get('required_exp', 1000)
        new_progress = min(required_exp, current_progress + exp_gained)
        is_complete = 1 if new_progress >= required_exp else 0

        now = datetime.now().isoformat()
        data = {
            'progress': new_progress,
            'is_complete': is_complete
        }
        if is_complete and not research.get('is_complete', 0):
            data['completed_at'] = now

        rows_affected = self.exec.update_by_id(record_id, data)

        return {
            'success': rows_affected > 0,
            'progress': new_progress,
            'is_complete': is_complete,
            'progress_percent': (new_progress / required_exp) * 100 if required_exp > 0 else 0
        }

    def complete_research(self, record_id: int) -> Dict[str, Any]:
        research = self.get_by_id(record_id)
        if not research:
            return {'success': False, 'message': '研究项目不存在'}

        if research.get('is_complete', 0):
            return {'success': False, 'message': '研究已完成'}

        now = datetime.now().isoformat()
        required_exp = research.get('required_exp', 1000)
        data = {
            'progress': required_exp,
            'is_complete': 1,
            'completed_at': now
        }

        rows_affected = self.exec.update_by_id(record_id, data)

        return {
            'success': rows_affected > 0,
            'progress': required_exp,
            'progress_percent': 100.0
        }

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_part_type_text(self, part_type: str) -> str:
        type_map = {
            self.PART_TYPE_ENGINE: '引擎',
            self.PART_TYPE_CHASSIS: '底盘',
            self.PART_TYPE_AERODYNAMICS: '空气动力学',
            self.PART_TYPE_TIRES: '轮胎',
            self.PART_TYPE_GEARBOX: '变速箱'
        }
        return type_map.get(part_type, '未知')
