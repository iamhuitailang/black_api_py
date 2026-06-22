from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OpinionTimelineModel:
    TABLE_NAME = 'tb_opinion_timeline'
    
    TYPE_SUBMIT = 'submit'
    TYPE_ASSIGN = 'assign'
    TYPE_CLAIM = 'claim'
    TYPE_PROCESS = 'process'
    TYPE_RESOLVE = 'resolve'
    TYPE_ESCALATE = 'escalate'
    TYPE_RATING = 'rating'
    TYPE_CLOSE = 'close'
    TYPE_NOTE = 'note'
    
    TYPE_MAP = {
        TYPE_SUBMIT: '提交意见',
        TYPE_ASSIGN: '分配处理',
        TYPE_CLAIM: '认领任务',
        TYPE_PROCESS: '处理中',
        TYPE_RESOLVE: '处理完成',
        TYPE_ESCALATE: '升级督办',
        TYPE_RATING: '满意度评分',
        TYPE_CLOSE: '关闭意见',
        TYPE_NOTE: '备注'
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
                opinion_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                content TEXT,
                operator_id INTEGER,
                operator_name TEXT,
                photos TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_opinion ON {cls.TABLE_NAME}(opinion_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql2)

    def create(self, opinion_id: int, timeline_type: str, content: str = None, 
               operator_id: int = None, operator_name: str = None, photos: str = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'opinion_id': opinion_id,
            'type': timeline_type,
            'content': content,
            'operator_id': operator_id,
            'operator_name': operator_name,
            'photos': photos,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_opinion_id(self, opinion_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'opinion_id': opinion_id}, order_by='created_at ASC')

    def delete_by_opinion_id(self, opinion_id: int) -> int:
        return self.exec.delete({'opinion_id': opinion_id})
