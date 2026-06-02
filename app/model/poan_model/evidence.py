import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EvidenceModel:
    TABLE_NAME = 'tb_poan_model_evidence'

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
                case_id INTEGER NOT NULL,
                clue_ids TEXT DEFAULT '[]',
                conclusion TEXT DEFAULT '',
                is_correct INTEGER DEFAULT 0,
                explanation TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_case_id ON {cls.TABLE_NAME}(case_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_correct ON {cls.TABLE_NAME}(is_correct)"
        db.execute(index_sql)

    def create(self, case_id: int, clue_ids: List[int], conclusion: str,
               is_correct: int = 0, explanation: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'case_id': case_id,
            'clue_ids': json.dumps(clue_ids),
            'conclusion': conclusion,
            'is_correct': is_correct,
            'explanation': explanation,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_case(self, case_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'case_id': case_id})

    def check_answer(self, case_id: int, clue_ids: List[int], conclusion: str) -> Optional[Dict[str, Any]]:
        evidences = self.get_by_case(case_id)
        for evidence in evidences:
            stored_clue_ids = json.loads(evidence.get('clue_ids', '[]'))
            if set(stored_clue_ids) == set(clue_ids) and evidence.get('conclusion') == conclusion:
                return {
                    'is_correct': evidence.get('is_correct'),
                    'explanation': evidence.get('explanation')
                }
        return None

    def to_dict(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': evidence.get('id'),
            'case_id': evidence.get('case_id'),
            'clue_ids': json.loads(evidence.get('clue_ids', '[]')),
            'conclusion': evidence.get('conclusion'),
            'is_correct': evidence.get('is_correct'),
            'explanation': evidence.get('explanation'),
            'created_at': evidence.get('created_at')
        }
