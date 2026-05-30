from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PointLogModel:
    TABLE_NAME = 'tb_biaoqing_model_point_logs'

    TYPE_SIGN_IN = 1
    TYPE_UPLOAD = 2
    TYPE_DOWNLOAD = 3
    TYPE_SHARE = 4
    TYPE_COMMENT = 5
    TYPE_LIKE = 6
    TYPE_FAVORITE = 7
    TYPE_REGISTER = 8
    TYPE_ACTIVITY = 9
    TYPE_OTHER = 0

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
                type INTEGER DEFAULT 0,
                points INTEGER DEFAULT 0,
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)

    def create(self, user_id: int, points: int, type: int = 0, description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'type': type,
            'points': points,
            'description': description,
            'created_at': now
        }
        result = self.exec.insert(data)
        if result > 0 and points != 0:
            from app.model.biaoqing_model.user import UserModel
            UserModel().update_points(user_id, points)
        return result

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 20, type: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if type is not None:
            conditions['type'] = type
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_user_points(self, user_id: int) -> int:
        sql = f"SELECT COALESCE(SUM(points), 0) as total FROM {self.TABLE_NAME} WHERE user_id = ?"
        result = self.db.fetch_one(sql, (user_id,))
        return result['total'] if result else 0

    def get_type_text(self, type: int) -> str:
        type_map = {
            self.TYPE_SIGN_IN: '每日签到',
            self.TYPE_UPLOAD: '上传表情包',
            self.TYPE_DOWNLOAD: '下载表情包',
            self.TYPE_SHARE: '分享表情包',
            self.TYPE_COMMENT: '发表评论',
            self.TYPE_LIKE: '点赞',
            self.TYPE_FAVORITE: '收藏',
            self.TYPE_REGISTER: '注册奖励',
            self.TYPE_ACTIVITY: '活动奖励',
            self.TYPE_OTHER: '其他'
        }
        return type_map.get(type, '未知')

    def to_dict(self, log: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': log.get('id'),
            'user_id': log.get('user_id'),
            'type': log.get('type'),
            'type_text': self.get_type_text(log.get('type')),
            'points': log.get('points'),
            'description': log.get('description'),
            'created_at': log.get('created_at')
        }
