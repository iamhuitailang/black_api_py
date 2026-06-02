from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DialogueModel:
    TABLE_NAME = 'tb_poan_model_dialogue'

    TRIGGER_AUTO = 'auto'
    TRIGGER_CLUE = 'clue'
    TRIGGER_KEYWORD = 'keyword'

    TRIGGER_TYPES = {
        TRIGGER_AUTO: '自动触发',
        TRIGGER_CLUE: '线索触发',
        TRIGGER_KEYWORD: '关键词触发'
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
                character_id INTEGER NOT NULL,
                case_id INTEGER NOT NULL,
                trigger_type TEXT NOT NULL,
                question TEXT DEFAULT '',
                answer TEXT DEFAULT '',
                unlock_condition TEXT DEFAULT '',
                order_num INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_character_id ON {cls.TABLE_NAME}(character_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_case_id ON {cls.TABLE_NAME}(case_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_trigger_type ON {cls.TABLE_NAME}(trigger_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_order_num ON {cls.TABLE_NAME}(order_num)"
        db.execute(index_sql)

    def create(self, character_id: int, case_id: int, trigger_type: str,
               question: str = '', answer: str = '', unlock_condition: str = '',
               order_num: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'character_id': character_id,
            'case_id': case_id,
            'trigger_type': trigger_type,
            'question': question,
            'answer': answer,
            'unlock_condition': unlock_condition,
            'order_num': order_num,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'trigger_type', 'question', 'answer',
            'unlock_condition', 'order_num'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_character(self, character_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'character_id': character_id}, order_by='order_num ASC')

    def get_by_case(self, case_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'case_id': case_id}, order_by='order_num ASC')

    def to_dict(self, dialogue: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': dialogue.get('id'),
            'character_id': dialogue.get('character_id'),
            'case_id': dialogue.get('case_id'),
            'trigger_type': dialogue.get('trigger_type'),
            'trigger_type_name': self.TRIGGER_TYPES.get(dialogue.get('trigger_type'), '未知'),
            'question': dialogue.get('question'),
            'answer': dialogue.get('answer'),
            'unlock_condition': dialogue.get('unlock_condition'),
            'order_num': dialogue.get('order_num'),
            'created_at': dialogue.get('created_at')
        }
