from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ZumaUserItemModel:
    TABLE_NAME = 'tb_zuma_model_user_items'

    ITEM_SLOW_TIME = 'slow_time'
    ITEM_BACKWARD = 'backward'
    ITEM_AIM = 'aim'
    ITEM_BOMB = 'bomb'
    ITEM_COLOR_CHANGE = 'color_change'

    ITEM_INFO = {
        ITEM_SLOW_TIME: {
            'name': '时间减缓',
            'description': '减慢珠子移动速度5秒',
            'icon': '⏱️',
            'price': 50
        },
        ITEM_BACKWARD: {
            'name': '时光倒流',
            'description': '将所有珠子向后退一段距离',
            'icon': '⏪',
            'price': 80
        },
        ITEM_AIM: {
            'name': '精准瞄准',
            'description': '显示射击轨迹线',
            'icon': '🎯',
            'price': 30
        },
        ITEM_BOMB: {
            'name': '炸弹',
            'description': '消除周围一片区域的珠子',
            'icon': '💣',
            'price': 100
        },
        ITEM_COLOR_CHANGE: {
            'name': '换色术',
            'description': '改变当前珠子颜色',
            'icon': '🎨',
            'price': 40
        }
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
                item_type TEXT NOT NULL,
                quantity INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, item_type)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_item_type ON {cls.TABLE_NAME}(item_type)"
        db.execute(index_sql)

    def get_user_items(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE user_id = ? AND quantity > 0
        """
        items = self.db.fetch_all(sql, (user_id,))

        result = []
        for item in items:
            item_type = item.get('item_type')
            item_info = self.ITEM_INFO.get(item_type, {})
            result.append({
                **item,
                'name': item_info.get('name', ''),
                'description': item_info.get('description', ''),
                'icon': item_info.get('icon', ''),
                'price': item_info.get('price', 0)
            })

        return result

    def get_item_quantity(self, user_id: int, item_type: str) -> int:
        result = self.query.find_one({'user_id': user_id, 'item_type': item_type})
        return result.get('quantity', 0) if result else 0

    def add_item(self, user_id: int, item_type: str, quantity: int = 1) -> int:
        existing = self.query.find_one({'user_id': user_id, 'item_type': item_type})
        now = datetime.now().isoformat()

        if existing:
            new_quantity = existing.get('quantity', 0) + quantity
            return self.exec.update_by_id(existing.get('id'), {
                'quantity': new_quantity,
                'updated_at': now
            })
        else:
            return self.exec.insert({
                'user_id': user_id,
                'item_type': item_type,
                'quantity': quantity,
                'created_at': now,
                'updated_at': now
            })

    def use_item(self, user_id: int, item_type: str) -> bool:
        existing = self.query.find_one({'user_id': user_id, 'item_type': item_type})
        if not existing or existing.get('quantity', 0) <= 0:
            return False

        now = datetime.now().isoformat()
        new_quantity = existing.get('quantity', 0) - 1
        self.exec.update_by_id(existing.get('id'), {
            'quantity': new_quantity,
            'updated_at': now
        })
        return True

    @classmethod
    def get_all_items_info(cls) -> List[Dict[str, Any]]:
        result = []
        for item_type, info in cls.ITEM_INFO.items():
            result.append({
                'item_type': item_type,
                **info
            })
        return result

    def delete_by_user_id(self, user_id: int) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?"
        cursor = self.db.execute(sql, (user_id,))
        return cursor.rowcount
