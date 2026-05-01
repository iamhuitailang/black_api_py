from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TieluGoodsConfigModel:
    TABLE_NAME = 'tb_tielu_goods_config'

    DEFAULT_GOODS = [
        {'name': '木材', 'emoji': '🪵', 'price': 20, 'rarity': '普通', 'city_name': '起点镇'},
        {'name': '铁矿', 'emoji': '⛏️', 'price': 35, 'rarity': '普通', 'city_name': '铁矿镇'},
        {'name': '粮食', 'emoji': '🌾', 'price': 25, 'rarity': '普通', 'city_name': '粮仓市'},
        {'name': '机械零件', 'emoji': '⚙️', 'price': 60, 'rarity': '稀有', 'city_name': '工业城'},
        {'name': '钻石', 'emoji': '💎', 'price': 200, 'rarity': '稀有', 'city_name': '钻石港'},
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
                name TEXT NOT NULL UNIQUE,
                emoji TEXT DEFAULT '',
                price INTEGER DEFAULT 0,
                rarity TEXT DEFAULT '普通',
                city_name TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_sql)

    @classmethod
    def init_default_data(cls):
        model = TieluGoodsConfigModel()
        existing = model.query.count()
        if existing > 0:
            return

        now = datetime.now().isoformat()
        goods_data = []
        for goods in cls.DEFAULT_GOODS:
            goods_data.append({
                'name': goods['name'],
                'emoji': goods['emoji'],
                'price': goods['price'],
                'rarity': goods['rarity'],
                'city_name': goods['city_name'],
                'created_at': now
            })

        model.exec.insert_many(goods_data)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def get_by_city(self, city_name: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'city_name': city_name}, order_by='id ASC')

    def to_public_dict(self, goods: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': goods.get('id'),
            'name': goods.get('name'),
            'emoji': goods.get('emoji'),
            'price': goods.get('price'),
            'rarity': goods.get('rarity'),
            'city_name': goods.get('city_name')
        }
