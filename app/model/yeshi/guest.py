from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import random


class GuestModel:
    TABLE_NAME = 'tb_yeshi_model_guest'
    
    GUEST_TYPES = [
        {'type': 'normal', 'name': '普通客人', 'patience': 60, 'tip_rate': 0.1, 'icon': '🧑'},
        {'type': 'student', 'name': '学生', 'patience': 45, 'tip_rate': 0.05, 'icon': '👨‍🎓'},
        {'type': 'worker', 'name': '上班族', 'patience': 30, 'tip_rate': 0.15, 'icon': '👔'},
        {'type': 'foodie', 'name': '美食家', 'patience': 90, 'tip_rate': 0.25, 'icon': '🤤'},
        {'type': 'vip', 'name': 'VIP客人', 'patience': 120, 'tip_rate': 0.3, 'icon': '💎'},
        {'type': 'tourist', 'name': '游客', 'patience': 50, 'tip_rate': 0.2, 'icon': '🧳'},
        {'type': 'couple', 'name': '情侣', 'patience': 70, 'tip_rate': 0.15, 'icon': '💑'},
        {'type': 'elder', 'name': '老人', 'patience': 100, 'tip_rate': 0.1, 'icon': '👴'},
    ]
    
    SPECIAL_REQUESTS = [
        {'text': '多放辣', 'effect': 'spicy', 'difficulty': 1},
        {'text': '不要葱', 'effect': 'no_onion', 'difficulty': 1},
        {'text': '少放盐', 'effect': 'low_salt', 'difficulty': 1},
        {'text': '多加料', 'effect': 'extra', 'difficulty': 2, 'price_bonus': 0.2},
        {'text': '赶时间，快点', 'effect': 'hurry', 'difficulty': 2, 'patience_modifier': 0.5},
        {'text': '要变态辣', 'effect': 'super_spicy', 'difficulty': 3, 'price_bonus': 0.3},
        {'text': '不要香菜', 'effect': 'no_coriander', 'difficulty': 1},
        {'text': '打包带走', 'effect': 'takeaway', 'difficulty': 1},
        {'text': '多放醋', 'effect': 'more_vinegar', 'difficulty': 1},
        {'text': '要甜口的', 'effect': 'sweet', 'difficulty': 2},
        {'text': '分量大一点', 'effect': 'big_portion', 'difficulty': 2, 'price_bonus': 0.25},
        {'text': '我是老顾客了', 'effect': 'regular', 'difficulty': 1, 'tip_bonus': 0.1},
    ]
    
    GUEST_NAMES = [
        '小明', '小红', '阿强', '小丽', '老王', '小张', '李大厨', '陈老板',
        '周姐', '吴哥', '郑小妹', '王大爷', '刘阿姨', '赵同学', '孙小姐',
        '马大哥', '朱女士', '胡师傅', '林妹妹', '黄总', '杨小哥', '何阿姨',
        '老罗', '小梁', '宋姐', '唐哥', '韩梅梅', '李雷', '张伟', '王芳'
    ]
    
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
                game_user_id INTEGER NOT NULL,
                session_id INTEGER,
                name TEXT NOT NULL,
                guest_type TEXT DEFAULT 'normal',
                patience INTEGER DEFAULT 60,
                current_patience INTEGER DEFAULT 60,
                tip_rate REAL DEFAULT 0.1,
                icon TEXT,
                status TEXT DEFAULT 'waiting',
                food_preference TEXT,
                desired_food_id INTEGER,
                desired_food_name TEXT,
                desired_food_icon TEXT,
                special_request_text TEXT,
                special_request_effect TEXT,
                special_request_price_bonus REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        columns_to_add = [
            ('desired_food_id', 'INTEGER'),
            ('desired_food_name', 'TEXT'),
            ('desired_food_icon', 'TEXT'),
            ('special_request_text', 'TEXT'),
            ('special_request_effect', 'TEXT'),
            ('special_request_price_bonus', 'REAL DEFAULT 0'),
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN {col_name} {col_type}")
            except:
                pass
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(game_user_id)"
        db.execute(index_sql)

    def create(self, game_user_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        guest_type_info = random.choice(self.GUEST_TYPES)
        name = kwargs.get('name', random.choice(self.GUEST_NAMES))
        
        data = {
            'game_user_id': game_user_id,
            'name': name,
            'guest_type': kwargs.get('guest_type', guest_type_info['type']),
            'patience': kwargs.get('patience', guest_type_info['patience']),
            'current_patience': kwargs.get('patience', guest_type_info['patience']),
            'tip_rate': kwargs.get('tip_rate', guest_type_info['tip_rate']),
            'icon': kwargs.get('icon', guest_type_info['icon']),
            'status': 'waiting',
            'created_at': now,
            'updated_at': now
        }
        data.update(kwargs)
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_active_guests(self, game_user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE game_user_id = ? AND status IN ('waiting', 'ordering', 'eating')
            ORDER BY created_at ASC
        """
        guests = self.db.fetch_all(sql, (game_user_id,))
        for guest in guests:
            if guest.get('special_request_text'):
                guest['special_request'] = {
                    'text': guest.get('special_request_text'),
                    'effect': guest.get('special_request_effect'),
                    'price_bonus': guest.get('special_request_price_bonus', 0)
                }
            if guest.get('desired_food_id'):
                guest['desired_food'] = {
                    'id': guest.get('desired_food_id'),
                    'name': guest.get('desired_food_name'),
                    'icon': guest.get('desired_food_icon')
                }
            else:
                from app.model.yeshi import UserFoodModel
                user_food_model = UserFoodModel()
                unlocked_foods = user_food_model.get_unlocked_foods_with_details(game_user_id)
                if unlocked_foods:
                    import random
                    food = random.choice(unlocked_foods)
                    guest['desired_food'] = {
                        'id': food.get('id'),
                        'name': food.get('name'),
                        'icon': food.get('icon')
                    }
                    now = datetime.now().isoformat()
                    self.db.execute(f"""
                        UPDATE {self.TABLE_NAME} 
                        SET desired_food_id = ?, desired_food_name = ?, desired_food_icon = ?, updated_at = ?
                        WHERE id = ?
                    """, (food.get('id'), food.get('name'), food.get('icon'), now, guest.get('id')))
        return guests

    def get_by_user_id(self, game_user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'game_user_id': game_user_id},
            order_by='created_at DESC',
            limit=limit
        )

    def update_status(self, guest_id: int, status: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(guest_id, data)

    def decrease_patience(self, guest_id: int, amount: int = 5) -> Dict[str, Any]:
        guest = self.get_by_id(guest_id)
        if not guest:
            return {'is_angry': False, 'current_patience': 0}
        
        current_patience = max(0, guest.get('current_patience', 0) - amount)
        is_angry = current_patience <= 0
        
        now = datetime.now().isoformat()
        data = {
            'current_patience': current_patience,
            'status': 'angry' if is_angry else guest.get('status'),
            'updated_at': now
        }
        self.exec.update_by_id(guest_id, data)
        
        return {
            'is_angry': is_angry,
            'current_patience': current_patience
        }

    def generate_guest(self, game_user_id: int, reputation: int = 0, session_id: int = None,
                       desired_food_id: int = None, desired_food_name: str = None,
                       desired_food_icon: str = None, special_request: Dict = None) -> Dict[str, Any]:
        guest_type_info = self._get_guest_type_by_reputation(reputation)
        name = random.choice(self.GUEST_NAMES)
        
        create_data = {
            'game_user_id': game_user_id,
            'session_id': session_id,
            'name': name,
            'guest_type': guest_type_info['type'],
            'patience': guest_type_info['patience'],
            'tip_rate': guest_type_info['tip_rate'],
            'icon': guest_type_info['icon'],
            'desired_food_id': desired_food_id,
            'desired_food_name': desired_food_name,
            'desired_food_icon': desired_food_icon,
        }
        
        if special_request:
            create_data['special_request_text'] = special_request.get('text')
            create_data['special_request_effect'] = special_request.get('effect')
            create_data['special_request_price_bonus'] = special_request.get('price_bonus', 0)
        
        guest_id = self.create(**create_data)
        
        guest = self.get_by_id(guest_id)
        if guest:
            if desired_food_id:
                guest['desired_food'] = {
                    'id': desired_food_id,
                    'name': desired_food_name,
                    'icon': desired_food_icon
                }
            if special_request:
                guest['special_request'] = special_request
        
        return guest or {}

    def _get_guest_type_by_reputation(self, reputation: int) -> Dict[str, Any]:
        weights = []
        for gt in self.GUEST_TYPES:
            base_weight = 10
            if gt['type'] == 'normal':
                weights.append(base_weight)
            elif gt['type'] == 'foodie' and reputation > 50:
                weights.append(base_weight + reputation // 10)
            elif gt['type'] == 'vip' and reputation > 100:
                weights.append(base_weight + reputation // 20)
            elif gt['type'] == 'tourist':
                weights.append(base_weight)
            else:
                weights.append(base_weight)
        
        return random.choices(self.GUEST_TYPES, weights=weights, k=1)[0]

    def get_random_special_request(self) -> Optional[Dict[str, Any]]:
        if random.random() < 0.3:
            return random.choice(self.SPECIAL_REQUESTS)
        return None

    def get_all_guest_types(self) -> List[Dict[str, Any]]:
        return self.GUEST_TYPES

    def get_all_special_requests(self) -> List[Dict[str, Any]]:
        return self.SPECIAL_REQUESTS

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def clear_old_guests(self, game_user_id: int, hours: int = 24) -> int:
        sql = f"""
            DELETE FROM {self.TABLE_NAME} 
            WHERE game_user_id = ? AND created_at < datetime('now', '-{hours} hours')
        """
        cursor = self.db.execute(sql, (game_user_id,))
        return cursor.rowcount if cursor else 0
