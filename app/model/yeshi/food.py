from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class FoodModel:
    TABLE_NAME = 'tb_yeshi_model_food'
    
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
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT,
                icon TEXT,
                base_price INTEGER DEFAULT 10,
                cook_time INTEGER DEFAULT 5,
                unlock_level INTEGER DEFAULT 1,
                unlock_cost INTEGER DEFAULT 0,
                is_default INTEGER DEFAULT 0,
                difficulty INTEGER DEFAULT 1,
                ingredient_cost INTEGER DEFAULT 5,
                experience_reward INTEGER DEFAULT 10,
                tags TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        cls._init_default_foods(db)

    @classmethod
    def _init_default_foods(cls, db):
        default_foods = [
            ('羊肉串', '烤串', '鲜嫩多汁的经典羊肉串', '🍢', 15, 8, 1, 0, 1, 1, 5, 10, '热门,经典'),
            ('烤鸡翅', '烤串', '外酥里嫩的香辣鸡翅', '🍗', 18, 10, 1, 0, 1, 1, 6, 12, '热门'),
            ('烤茄子', '烤串', '蒜蓉烤茄子，香气四溢', '🍆', 12, 12, 2, 50, 0, 2, 4, 15, '素菜'),
            ('烤玉米', '烤串', '香甜可口的烤玉米', '🌽', 8, 6, 1, 0, 1, 1, 3, 8, '素菜,便宜'),
            ('烤韭菜', '烤串', '鲜香爽脆的烤韭菜', '🥬', 6, 5, 2, 30, 0, 1, 2, 6, '素菜'),
            ('牛肉串', '烤串', '大块牛肉，嚼劲十足', '🥩', 20, 10, 3, 100, 0, 2, 8, 15, '高级'),
            ('蛋炒饭', '炒面', '简单美味的蛋炒饭', '🍚', 12, 6, 1, 0, 1, 1, 4, 10, '主食,经典'),
            ('炒面', '炒面', '劲道十足的夜市炒面', '🍜', 15, 8, 1, 0, 1, 1, 5, 12, '主食'),
            ('炒米粉', '炒面', '细腻爽滑的炒米粉', '🍝', 14, 7, 2, 50, 0, 1, 4, 11, '主食'),
            ('扬州炒饭', '炒面', '配料丰富的扬州炒饭', '🍛', 20, 10, 3, 100, 0, 2, 7, 18, '高级,主食'),
            ('麻辣烫', '麻辣烫', '麻辣鲜香，食材丰富', '🍲', 25, 15, 2, 80, 0, 3, 10, 20, '热门,汤品'),
            ('冒菜', '麻辣烫', '一个人的火锅', '🥘', 28, 18, 3, 120, 0, 3, 12, 22, '高级'),
            ('关东煮', '麻辣烫', '温暖身心的日式煮物', '🍢', 22, 12, 4, 150, 0, 2, 8, 18, '汤品'),
            ('冰粉', '甜品', '清凉解暑的手工冰粉', '🍧', 8, 3, 1, 0, 1, 1, 3, 8, '甜品,热门'),
            ('西米露', '甜品', '椰香浓郁的西米露', '🥣', 12, 5, 2, 60, 0, 1, 4, 12, '甜品'),
            ('双皮奶', '甜品', '嫩滑香甜的双皮奶', '🥛', 15, 8, 3, 100, 0, 2, 5, 15, '甜品,高级'),
            ('绿豆汤', '甜品', '清热解暑的绿豆汤', '🫘', 6, 4, 1, 0, 1, 1, 2, 6, '便宜,甜品'),
            ('酸梅汤', '饮品', '酸甜可口的酸梅汤', '🥤', 5, 2, 1, 0, 1, 1, 2, 5, '便宜,饮品'),
            ('鲜榨果汁', '饮品', '新鲜水果现榨果汁', '🧃', 18, 5, 2, 80, 0, 1, 6, 15, '健康,饮品'),
            ('啤酒', '饮品', '冰爽啤酒，夜市必备', '🍺', 10, 1, 1, 0, 1, 1, 5, 8, '热门,饮品'),
            ('烤生蚝', '海鲜', '蒜香浓郁的烤生蚝', '🦪', 30, 12, 4, 200, 0, 3, 15, 25, '高级,海鲜'),
            ('烤扇贝', '海鲜', '鲜嫩多汁的烤扇贝', '🐚', 28, 10, 4, 180, 0, 3, 12, 22, '海鲜'),
            ('小龙虾', '海鲜', '麻辣鲜香的小龙虾', '🦞', 50, 20, 5, 300, 0, 4, 25, 40, '高级,热门'),
            ('烤鱿鱼', '海鲜', 'Q弹有嚼劲的烤鱿鱼', '🦑', 22, 10, 3, 120, 0, 2, 10, 18, '海鲜,热门'),
            ('手抓饼', '小吃', '香脆可口的手抓饼', '🥙', 10, 5, 1, 0, 1, 1, 4, 8, '小吃,便宜'),
            ('臭豆腐', '小吃', '闻着臭吃着香的臭豆腐', '🫔', 12, 8, 2, 60, 0, 2, 5, 12, '特色,小吃'),
            ('章鱼小丸子', '小吃', '外酥里嫩的章鱼小丸子', '🐙', 15, 10, 3, 100, 0, 2, 6, 15, '日式,小吃'),
            ('炸鸡排', '小吃', '香脆多汁的大鸡排', '🍗', 18, 12, 3, 120, 0, 2, 8, 18, '小吃'),
            ('烤肠', '小吃', '香气扑鼻的烤香肠', '🌭', 8, 4, 1, 0, 1, 1, 3, 6, '便宜,小吃'),
            ('煎饺', '小吃', '金黄酥脆的煎饺', '🥟', 15, 10, 2, 80, 0, 2, 6, 12, '小吃'),
            ('狼牙土豆', '小吃', '麻辣鲜香的狼牙土豆', '🥔', 10, 8, 2, 50, 0, 1, 4, 10, '素菜,小吃'),
            ('烤面筋', '烤串', '劲道十足的烤面筋', '🍞', 6, 6, 1, 0, 1, 1, 2, 6, '便宜,素菜'),
            ('烤蘑菇', '烤串', '鲜嫩多汁的烤蘑菇', '🍄', 10, 8, 2, 40, 0, 1, 4, 10, '素菜'),
            ('锡纸花甲', '海鲜', '鲜美的锡纸花甲', '🐚', 25, 15, 4, 180, 0, 3, 12, 20, '海鲜,汤品'),
            ('糖水', '甜品', '滋润养颜的糖水', '🍯', 10, 6, 2, 60, 0, 1, 3, 10, '甜品'),
            ('奶茶', '饮品', '香浓丝滑的奶茶', '🧋', 15, 5, 2, 80, 0, 1, 5, 12, '饮品,热门'),
            ('水果捞', '甜品', '新鲜水果搭配酸奶', '🍓', 20, 8, 4, 200, 0, 2, 8, 18, '健康,甜品'),
            ('烤鲍鱼', '海鲜', '珍贵的烤鲍鱼', '🐚', 80, 25, 6, 500, 0, 5, 40, 60, '高级,海鲜'),
            ('芝士玉米', '小吃', '拉丝芝士玉米', '🌽', 18, 10, 3, 100, 0, 2, 6, 15, '小吃'),
            ('酸辣粉', '汤品', '酸辣开胃的酸辣粉', '🍜', 14, 10, 2, 60, 0, 2, 5, 12, '汤品,热门'),
            ('担担面', '炒面', '麻辣鲜香的担担面', '🍜', 16, 12, 3, 100, 0, 2, 6, 15, '主食'),
            ('热干面', '炒面', '香飘四溢的热干面', '🍝', 14, 8, 2, 70, 0, 2, 5, 12, '主食,特色'),
            ('烤包子', '小吃', '外酥里嫩的烤包子', '🥠', 12, 10, 2, 60, 0, 2, 5, 10, '小吃'),
            ('肉夹馍', '小吃', '正宗陕西肉夹馍', '🌮', 15, 12, 3, 100, 0, 2, 6, 12, '小吃,主食'),
            ('凉皮', '小吃', '清爽解暑的凉皮', '🍜', 10, 8, 2, 50, 0, 1, 4, 10, '小吃,素菜'),
            ('烤猪蹄', '烤串', '软糯Q弹的烤猪蹄', '🐷', 28, 20, 4, 200, 0, 3, 15, 25, '高级,热门'),
            ('烤腰子', '烤串', '滋补养生的烤腰子', '🫘', 35, 15, 4, 250, 0, 3, 18, 30, '高级'),
            ('毛蛋', '小吃', '特色小吃毛蛋', '🥚', 15, 12, 3, 120, 0, 3, 8, 15, '特色'),
            ('烤鸡架', '烤串', '越啃越香的烤鸡架', '🍖', 12, 15, 3, 100, 0, 2, 6, 15, '下酒'),
            ('凉拌黄瓜', '素菜', '清爽解腻的凉拌黄瓜', '🥒', 6, 3, 1, 0, 1, 1, 2, 5, '便宜,素菜'),
        ]
        
        existing = db.fetch_one(f"SELECT COUNT(*) as count FROM {cls.TABLE_NAME}")
        if existing and existing.get('count', 0) == 0:
            now = datetime.now().isoformat()
            for food in default_foods:
                db.execute(
                    f"""INSERT INTO {cls.TABLE_NAME} 
                    (name, category, description, icon, base_price, cook_time, unlock_level, unlock_cost, is_default, difficulty, ingredient_cost, experience_reward, tags, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (*food, now, now)
                )

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def get_by_category(self, category: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'category': category}, order_by='id ASC')

    def get_default_foods(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_default': 1}, order_by='id ASC')

    def get_unlockable_by_level(self, level: int) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE unlock_level <= ? AND is_default = 0 ORDER BY unlock_level ASC"
        return self.db.fetch_all(sql, (level,))

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 50) -> List[Dict[str, Any]]:
        offset = (page - 1) * page_size
        return self.query.find_all(order_by='id ASC', limit=page_size, offset=offset)

    def count(self) -> int:
        result = self.db.fetch_one(f"SELECT COUNT(*) as count FROM {self.TABLE_NAME}")
        return result.get('count', 0) if result else 0
