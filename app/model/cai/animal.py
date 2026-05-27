from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import random


class AnimalModel:
    TABLE_NAME = 'tb_cai_animals'

    LEVEL_EASY = 1
    LEVEL_NORMAL = 2
    LEVEL_ADVANCED = 3
    LEVEL_HARD = 4

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
                name TEXT NOT NULL UNIQUE,
                level INTEGER DEFAULT 1,
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level ON {cls.TABLE_NAME}(level)"
        db.execute(index_sql)

    def init_default_data(self):
        default_animals = [
            {'name': '猫', 'level': self.LEVEL_EASY, 'description': '常见家养宠物'},
            {'name': '狗', 'level': self.LEVEL_EASY, 'description': '人类最忠诚的朋友'},
            {'name': '兔子', 'level': self.LEVEL_EASY, 'description': '长耳朵短尾巴'},
            {'name': '小鸡', 'level': self.LEVEL_EASY, 'description': '会下蛋的家禽'},
            {'name': '鸭子', 'level': self.LEVEL_EASY, 'description': '嘎嘎叫的家禽'},
            {'name': '猪', 'level': self.LEVEL_EASY, 'description': '圆滚滚的家畜'},
            {'name': '牛', 'level': self.LEVEL_EASY, 'description': '产奶的家畜'},
            {'name': '羊', 'level': self.LEVEL_EASY, 'description': '有羊毛的家畜'},

            {'name': '老虎', 'level': self.LEVEL_NORMAL, 'description': '森林之王'},
            {'name': '狮子', 'level': self.LEVEL_NORMAL, 'description': '草原之王'},
            {'name': '大象', 'level': self.LEVEL_NORMAL, 'description': '长鼻子大耳朵'},
            {'name': '长颈鹿', 'level': self.LEVEL_NORMAL, 'description': '脖子最长的动物'},
            {'name': '熊猫', 'level': self.LEVEL_NORMAL, 'description': '中国国宝'},
            {'name': '猴子', 'level': self.LEVEL_NORMAL, 'description': '聪明灵活的动物'},
            {'name': '狐狸', 'level': self.LEVEL_NORMAL, 'description': '狡猾的动物'},
            {'name': '狼', 'level': self.LEVEL_NORMAL, 'description': '群居的猛兽'},

            {'name': '海豚', 'level': self.LEVEL_ADVANCED, 'description': '聪明的海洋哺乳动物'},
            {'name': '老鹰', 'level': self.LEVEL_ADVANCED, 'description': '天空的霸主'},
            {'name': '企鹅', 'level': self.LEVEL_ADVANCED, 'description': '南极的绅士'},
            {'name': '金鱼', 'level': self.LEVEL_ADVANCED, 'description': '常见的观赏鱼'},
            {'name': '鲨鱼', 'level': self.LEVEL_ADVANCED, 'description': '海洋的顶级掠食者'},
            {'name': '天鹅', 'level': self.LEVEL_ADVANCED, 'description': '优雅的水鸟'},
            {'name': '孔雀', 'level': self.LEVEL_ADVANCED, 'description': '开屏很美丽'},
            {'name': '乌龟', 'level': self.LEVEL_ADVANCED, 'description': '长寿的爬行动物'},

            {'name': '树懒', 'level': self.LEVEL_HARD, 'description': '世界上最慢的动物'},
            {'name': '考拉', 'level': self.LEVEL_HARD, 'description': '澳大利亚国宝'},
            {'name': '羚羊', 'level': self.LEVEL_HARD, 'description': '奔跑速度极快'},
            {'name': '浣熊', 'level': self.LEVEL_HARD, 'description': '爱洗东西的动物'},
            {'name': '食蚁兽', 'level': self.LEVEL_HARD, 'description': '长舌头吃蚂蚁'},
            {'name': '穿山甲', 'level': self.LEVEL_HARD, 'description': '全身有鳞片'},
            {'name': '鸭嘴兽', 'level': self.LEVEL_HARD, 'description': '最原始的哺乳动物'},
            {'name': '水獭', 'level': self.LEVEL_HARD, 'description': '喜欢在水中玩耍'},
        ]

        for animal in default_animals:
            existing = self.get_by_name(animal['name'])
            if not existing:
                self.create(animal['name'], animal['level'], animal['description'])

    def create(self, name: str, level: int, description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'level': level,
            'description': description,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def get_by_level(self, level: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'level': level}, order_by='id ASC')

    def get_random_by_level(self, level: int, exclude_ids: List[int] = None) -> Optional[Dict[str, Any]]:
        animals = self.get_by_level(level)
        if exclude_ids:
            animals = [a for a in animals if a.get('id') not in exclude_ids]
        if animals:
            return random.choice(animals)
        return None

    def get_random(self, exclude_ids: List[int] = None) -> Optional[Dict[str, Any]]:
        animals = self.get_all()
        if exclude_ids:
            animals = [a for a in animals if a.get('id') not in exclude_ids]
        if animals:
            return random.choice(animals)
        return None

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in ['name', 'level', 'description']}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='level ASC, id ASC')

    def get_list(self, page: int = 1, page_size: int = 10, level: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if level is not None:
            conditions['level'] = level

        if keyword:
            return self.search(keyword, page, page_size, level)

        return self.query.paginate(page, page_size, conditions, order_by='level ASC, id ASC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10, level: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if level is not None:
            where_clauses.append("level = ?")
            params.append(level)

        where_clauses.append("(name LIKE ? OR description LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY level ASC, id ASC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_level_text(self, level: int) -> str:
        level_map = {
            self.LEVEL_EASY: '简单',
            self.LEVEL_NORMAL: '普通',
            self.LEVEL_ADVANCED: '进阶',
            self.LEVEL_HARD: '困难'
        }
        return level_map.get(level, '未知')

    def to_dict(self, animal: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': animal.get('id'),
            'name': animal.get('name'),
            'level': animal.get('level'),
            'level_text': self.get_level_text(animal.get('level')),
            'description': animal.get('description'),
            'created_at': animal.get('created_at')
        }
