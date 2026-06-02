import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class QuizModel:
    TABLE_NAME = 'tb_poan_model_quiz'

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
                question TEXT NOT NULL,
                options TEXT DEFAULT '[]',
                correct_answer TEXT DEFAULT '',
                explanation TEXT DEFAULT '',
                reward_exp INTEGER DEFAULT 0,
                order_num INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_case_id ON {cls.TABLE_NAME}(case_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_num ON {cls.TABLE_NAME}(order_num)"
        db.execute(index_sql)

    def create(self, case_id: int, question: str, options: List[str] = None,
               correct_answer: str = '', explanation: str = '', reward_exp: int = 0,
               order_num: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'case_id': case_id,
            'question': question,
            'options': json.dumps(options or []),
            'correct_answer': correct_answer,
            'explanation': explanation,
            'reward_exp': reward_exp,
            'order_num': order_num,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'question', 'options', 'correct_answer',
            'explanation', 'reward_exp', 'order_num'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_case(self, case_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'case_id': case_id}, order_by='order_num ASC')

    def to_dict(self, quiz: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': quiz.get('id'),
            'case_id': quiz.get('case_id'),
            'question': quiz.get('question'),
            'options': json.loads(quiz.get('options', '[]')),
            'correct_answer': quiz.get('correct_answer'),
            'explanation': quiz.get('explanation'),
            'reward_exp': quiz.get('reward_exp'),
            'order_num': quiz.get('order_num'),
            'created_at': quiz.get('created_at')
        }
