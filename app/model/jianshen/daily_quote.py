from datetime import datetime, date as date_type
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import random


DEFAULT_QUOTES = [
    "今天流的汗，是为了明天穿得下的衣服。",
    "没有借口，只有结果。",
    "痛苦是暂时的，放弃是永恒的。",
    "坚持的理由只有一个，放弃的理由有一百个。",
    "你的身体能承受的，远比你想象的多。",
    "健身是为了遇见更好的自己。",
    "每一次训练，都让你更接近理想的自己。",
    "今天不去，明天还是不去，最后就永远不去了。",
    "进步从不在舒适区里发生。",
    "健身是一场与自己的赛跑。",
    "汗水不会背叛你。",
    "再坚持一下，下一个就是你。",
    "身材是你生活习惯的镜子。",
    "自律给你自由。",
    "每天进步一点点，时间会给你答案。"
]


class JianshenDailyQuoteModel:
    TABLE_NAME = 'tb_jianshen_daily_quotes'

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
                quote_date TEXT NOT NULL UNIQUE,
                content TEXT NOT NULL,
                author TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    def ensure_today(self) -> Dict[str, Any]:
        today = date_type.today().isoformat()
        existing = self.query.find_one({'quote_date': today})
        if existing:
            return existing
        content = random.choice(DEFAULT_QUOTES)
        now = datetime.now().isoformat()
        self.exec.insert({
            'quote_date': today,
            'content': content,
            'author': '',
            'created_at': now
        })
        return self.query.find_one({'quote_date': today})

    def get_today(self) -> Optional[Dict[str, Any]]:
        today = date_type.today().isoformat()
        return self.query.find_one({'quote_date': today})

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_date(self, quote_date: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'quote_date': quote_date})

    def create(self, quote_date: str, content: str, author: str = '') -> int:
        existing = self.query.find_one({'quote_date': quote_date})
        if existing:
            return existing.get('id', 0)
        return self.exec.insert({
            'quote_date': quote_date,
            'content': content,
            'author': author,
            'created_at': datetime.now().isoformat()
        })

    def get_all(self, page: int = 1, page_size: int = 30) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='quote_date DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'quote_date': record.get('quote_date'),
            'content': record.get('content'),
            'author': record.get('author'),
            'created_at': record.get('created_at')
        }
