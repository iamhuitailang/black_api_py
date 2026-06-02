from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ItemModel:
    TABLE_NAME = 'tb_danzhu_model_items'

    TYPE_BUMPER = 'bumper'
    TYPE_TARGET = 'target'
    TYPE_SPINNER = 'spinner'
    TYPE_RAMP = 'ramp'
    TYPE_HOLE = 'hole'
    TYPE_MULTIBALL = 'multiball'
    TYPE_BONUS = 'bonus'

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1

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
                type TEXT NOT NULL,
                description TEXT DEFAULT '',
                icon TEXT DEFAULT '',
                color TEXT DEFAULT '#ff6b6b',
                radius REAL DEFAULT 25,
                score_value INTEGER DEFAULT 100,
                combo_bonus INTEGER DEFAULT 0,
                special_effect TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @classmethod
    def init_default_items(cls):
        model = cls()
        default_items = [
            {
                'name': '圆形弹射器',
                'type': 'bumper',
                'description': '碰到会弹射并获得分数',
                'color': '#ff6b6b',
                'radius': 25,
                'score_value': 100,
                'combo_bonus': 10,
                'special_effect': 'bounce',
                'status': 0
            },
            {
                'name': '靶心',
                'type': 'target',
                'description': '击中获得高分',
                'color': '#4ecdc4',
                'radius': 20,
                'score_value': 500,
                'combo_bonus': 50,
                'special_effect': 'flash',
                'status': 0
            },
            {
                'name': '旋转器',
                'type': 'spinner',
                'description': '持续旋转，多次碰撞加分',
                'color': '#ffe66d',
                'radius': 30,
                'score_value': 50,
                'combo_bonus': 20,
                'special_effect': 'spin',
                'status': 0
            },
            {
                'name': '坡道',
                'type': 'ramp',
                'description': '引导弹珠进入特定区域',
                'color': '#95e1d3',
                'radius': 15,
                'score_value': 200,
                'combo_bonus': 30,
                'special_effect': 'guide',
                'status': 0
            },
            {
                'name': '黑洞',
                'type': 'hole',
                'description': '吸住弹珠片刻后释放',
                'color': '#2c3e50',
                'radius': 35,
                'score_value': 1000,
                'combo_bonus': 100,
                'special_effect': 'attract',
                'status': 0
            },
            {
                'name': '多球奖励',
                'type': 'multiball',
                'description': '触发后额外获得弹珠',
                'color': '#e056fd',
                'radius': 22,
                'score_value': 300,
                'combo_bonus': 0,
                'special_effect': 'extra_ball',
                'status': 0
            },
            {
                'name': '双倍奖励',
                'type': 'bonus',
                'description': '一段时间内分数翻倍',
                'color': '#f9ca24',
                'radius': 28,
                'score_value': 0,
                'combo_bonus': 0,
                'special_effect': 'double_score',
                'status': 0
            }
        ]

        for item_data in default_items:
            existing = model.query.find_one({'name': item_data['name']})
            if not existing:
                model.create(**item_data)

    def create(self, name: str, type: str, description: str = '', icon: str = '',
                 color: str = '#ff6b6b', radius: float = 25, score_value: int = 100,
                 combo_bonus: int = 0, special_effect: str = '', status: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'type': type,
            'description': description,
            'icon': icon,
            'color': color,
            'radius': radius,
            'score_value': score_value,
            'combo_bonus': combo_bonus,
            'special_effect': special_effect,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_type(self, type: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'type': type, 'status': self.STATUS_ACTIVE}, order_by='id ASC')

    def get_all_active(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'status': self.STATUS_ACTIVE}, order_by='id ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'type', 'description', 'icon', 'color',
            'radius', 'score_value', 'combo_bonus', 'special_effect', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_status(self, record_id: int, status: int) -> int:
        return self.update(record_id, {'status': status})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                 type: str = None, status: int = None,
                 keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if type:
            conditions['type'] = type
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, type, status)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               type: str = None, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if type:
            where_clauses.append("type = ?")
            params.append(type)

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(name LIKE ? OR description LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY id DESC 
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

    def get_type_text(self, type: str) -> str:
        type_map = {
            self.TYPE_BUMPER: '弹射器',
            self.TYPE_TARGET: '靶心',
            self.TYPE_SPINNER: '旋转器',
            self.TYPE_RAMP: '坡道',
            self.TYPE_HOLE: '黑洞',
            self.TYPE_MULTIBALL: '多球奖励',
            self.TYPE_BONUS: '双倍奖励'
        }
        return type_map.get(type, '未知')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '启用',
            self.STATUS_DISABLED: '禁用'
        }
        return status_map.get(status, '未知')

    def to_dict(self, item: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': item.get('id'),
            'name': item.get('name'),
            'type': item.get('type'),
            'type_text': self.get_type_text(item.get('type')),
            'description': item.get('description'),
            'icon': item.get('icon'),
            'color': item.get('color'),
            'radius': item.get('radius'),
            'score_value': item.get('score_value'),
            'combo_bonus': item.get('combo_bonus'),
            'special_effect': item.get('special_effect'),
            'status': item.get('status'),
            'status_text': self.get_status_text(item.get('status')),
            'created_at': item.get('created_at'),
            'updated_at': item.get('updated_at')
        }
