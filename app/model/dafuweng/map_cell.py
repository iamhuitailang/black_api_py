from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MapCellModel:
    TABLE_NAME = 'tb_dafuweng_model_map_cell'

    TYPE_START = 0
    TYPE_EMPTY = 1
    TYPE_LAND = 2
    TYPE_CHANCE = 3
    TYPE_TAX = 4
    TYPE_ITEM_SHOP = 5
    TYPE_BANK = 6
    TYPE_REST = 7

    CELL_TYPES = [
        {'code': TYPE_START, 'name': '起点', 'icon': '🏁'},
        {'code': TYPE_EMPTY, 'name': '空地', 'icon': '⬜'},
        {'code': TYPE_LAND, 'name': '地产', 'icon': '🏠'},
        {'code': TYPE_CHANCE, 'name': '机会', 'icon': '🎲'},
        {'code': TYPE_TAX, 'name': '税收', 'icon': '💰'},
        {'code': TYPE_ITEM_SHOP, 'name': '道具店', 'icon': '🛒'},
        {'code': TYPE_BANK, 'name': '银行', 'icon': '🏦'},
        {'code': TYPE_REST, 'name': '休息', 'icon': '☕'}
    ]

    DEFAULT_MAP = [
        {'position': 0, 'name': '起点', 'cell_type': 0, 'base_price': 0, 'rent_level1': 0, 'rent_level2': 0, 'rent_level3': 0, 'color': '#4CAF50', 'icon': '🏁', 'description': '每位玩家经过起点获得2000金币'},
        {'position': 1, 'name': '东海大道', 'cell_type': 2, 'base_price': 1000, 'rent_level1': 200, 'rent_level2': 600, 'rent_level3': 1800, 'color': '#E91E63', 'icon': '🏠', 'description': '繁华的商业街道'},
        {'position': 2, 'name': '机会', 'cell_type': 3, 'base_price': 0, 'rent_level1': 0, 'rent_level2': 0, 'rent_level3': 0, 'color': '#FF9800', 'icon': '🎲', 'description': '抽取一张机会卡'},
        {'position': 3, 'name': '南山路', 'cell_type': 2, 'base_price': 1200, 'rent_level1': 240, 'rent_level2': 720, 'rent_level3': 2160, 'color': '#E91E63', 'icon': '🏠', 'description': '安静的住宅区'},
        {'position': 4, 'name': '税收', 'cell_type': 4, 'base_price': 0, 'rent_level1': 0, 'rent_level2': 0, 'rent_level3': 0, 'color': '#9C27B0', 'icon': '💰', 'description': '缴纳500金币税款'},
        {'position': 5, 'name': '道具店', 'cell_type': 5, 'base_price': 0, 'rent_level1': 0, 'rent_level2': 0, 'rent_level3': 0, 'color': '#00BCD4', 'icon': '🛒', 'description': '购买各种道具'},
        {'position': 6, 'name': '西湖街', 'cell_type': 2, 'base_price': 1500, 'rent_level1': 300, 'rent_level2': 900, 'rent_level3': 2700, 'color': '#2196F3', 'icon': '🏠', 'description': '湖景豪宅区'},
        {'position': 7, 'name': '休息', 'cell_type': 7, 'base_price': 0, 'rent_level1': 0, 'rent_level2': 0, 'rent_level3': 0, 'color': '#8BC34A', 'icon': '☕', 'description': '休息一回合'},
        {'position': 8, 'name': '银行', 'cell_type': 6, 'base_price': 0, 'rent_level1': 0, 'rent_level2': 0, 'rent_level3': 0, 'color': '#FFC107', 'icon': '🏦', 'description': '存取金币'},
        {'position': 9, 'name': '中山路', 'cell_type': 2, 'base_price': 1800, 'rent_level1': 360, 'rent_level2': 1080, 'rent_level3': 3240, 'color': '#2196F3', 'icon': '🏠', 'description': '中心商业区'},
        {'position': 10, 'name': '机会', 'cell_type': 3, 'base_price': 0, 'rent_level1': 0, 'rent_level2': 0, 'rent_level3': 0, 'color': '#FF9800', 'icon': '🎲', 'description': '抽取一张机会卡'},
        {'position': 11, 'name': '解放路', 'cell_type': 2, 'base_price': 2000, 'rent_level1': 400, 'rent_level2': 1200, 'rent_level3': 3600, 'color': '#4CAF50', 'icon': '🏠', 'description': '高端商业街'},
        {'position': 12, 'name': '空地', 'cell_type': 1, 'base_price': 0, 'rent_level1': 0, 'rent_level2': 0, 'rent_level3': 0, 'color': '#9E9E9E', 'icon': '⬜', 'description': '一片空地'},
        {'position': 13, 'name': '和平路', 'cell_type': 2, 'base_price': 2200, 'rent_level1': 440, 'rent_level2': 1320, 'rent_level3': 3960, 'color': '#4CAF50', 'icon': '🏠', 'description': '黄金地段'},
        {'position': 14, 'name': '税收', 'cell_type': 4, 'base_price': 0, 'rent_level1': 0, 'rent_level2': 0, 'rent_level3': 0, 'color': '#9C27B0', 'icon': '💰', 'description': '缴纳800金币税款'},
        {'position': 15, 'name': '建国路', 'cell_type': 2, 'base_price': 2500, 'rent_level1': 500, 'rent_level2': 1500, 'rent_level3': 4500, 'color': '#F44336', 'icon': '🏠', 'description': '顶级商业区'},
        {'position': 16, 'name': '道具店', 'cell_type': 5, 'base_price': 0, 'rent_level1': 0, 'rent_level2': 0, 'rent_level3': 0, 'color': '#00BCD4', 'icon': '🛒', 'description': '购买各种道具'},
        {'position': 17, 'name': '人民路', 'cell_type': 2, 'base_price': 2800, 'rent_level1': 560, 'rent_level2': 1680, 'rent_level3': 5040, 'color': '#F44336', 'icon': '🏠', 'description': '最繁华的地段'},
        {'position': 18, 'name': '机会', 'cell_type': 3, 'base_price': 0, 'rent_level1': 0, 'rent_level2': 0, 'rent_level3': 0, 'color': '#FF9800', 'icon': '🎲', 'description': '抽取一张机会卡'},
        {'position': 19, 'name': '长安街', 'cell_type': 2, 'base_price': 3000, 'rent_level1': 600, 'rent_level2': 1800, 'rent_level3': 5400, 'color': '#F44336', 'icon': '🏠', 'description': '至尊地王'}
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
                position INTEGER NOT NULL UNIQUE,
                name TEXT NOT NULL,
                cell_type INTEGER NOT NULL,
                base_price INTEGER DEFAULT 0,
                rent_level1 INTEGER DEFAULT 0,
                rent_level2 INTEGER DEFAULT 0,
                rent_level3 INTEGER DEFAULT 0,
                color TEXT DEFAULT '#999999',
                icon TEXT DEFAULT '',
                description TEXT DEFAULT '',
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_position ON {cls.TABLE_NAME}(position)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_cell_type ON {cls.TABLE_NAME}(cell_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql)

    @classmethod
    def init_default_map(cls):
        model = cls()
        existing = model.get_all_cells()
        if not existing:
            for cell_data in cls.DEFAULT_MAP:
                model.create(**cell_data)

    def create(self, position: int, name: str, cell_type: int, base_price: int = 0,
               rent_level1: int = 0, rent_level2: int = 0, rent_level3: int = 0,
               color: str = '#999999', icon: str = '', description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'position': position,
            'name': name,
            'cell_type': cell_type,
            'base_price': base_price,
            'rent_level1': rent_level1,
            'rent_level2': rent_level2,
            'rent_level3': rent_level3,
            'color': color,
            'icon': icon,
            'description': description,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_position(self, position: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'position': position})

    def get_all_cells(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_active': 1}, order_by='position ASC')

    def update(self, cell_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'cell_type', 'base_price', 'rent_level1', 'rent_level2',
            'rent_level3', 'color', 'icon', 'description', 'is_active'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(cell_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_cell_type_name(self, cell_type: int) -> str:
        for ct in self.CELL_TYPES:
            if ct['code'] == cell_type:
                return ct['name']
        return '未知'

    def to_dict(self, cell: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': cell.get('id'),
            'position': cell.get('position'),
            'name': cell.get('name'),
            'cell_type': cell.get('cell_type'),
            'cell_type_name': self.get_cell_type_name(cell.get('cell_type')),
            'base_price': cell.get('base_price'),
            'rent_level1': cell.get('rent_level1'),
            'rent_level2': cell.get('rent_level2'),
            'rent_level3': cell.get('rent_level3'),
            'color': cell.get('color'),
            'icon': cell.get('icon'),
            'description': cell.get('description'),
            'is_active': cell.get('is_active'),
            'created_at': cell.get('created_at'),
            'updated_at': cell.get('updated_at')
        }
