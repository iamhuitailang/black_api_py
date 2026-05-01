from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TieluWarehouseModel:
    TABLE_NAME = 'tb_tielu_warehouses'

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
                city_name TEXT NOT NULL,
                goods_type TEXT NOT NULL,
                amount INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, city_name, goods_type)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_city ON {cls.TABLE_NAME}(city_name)"
        db.execute(index_sql2)

    def create(self, user_id: int, city_name: str, goods_type: str, amount: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'city_name': city_name,
            'goods_type': goods_type,
            'amount': amount,
            'created_at': now,
            'updated_at': now
        }
        try:
            return self.exec.insert(data)
        except:
            return 0

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_city(self, user_id: int, city_name: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'city_name': city_name}, order_by='id ASC')

    def get_by_user_city_goods(self, user_id: int, city_name: str, goods_type: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'city_name': city_name, 'goods_type': goods_type})

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='city_name ASC, goods_type ASC')

    def add_goods(self, user_id: int, city_name: str, goods_type: str, amount: int) -> int:
        existing = self.get_by_user_city_goods(user_id, city_name, goods_type)
        now = datetime.now().isoformat()

        if existing:
            new_amount = existing.get('amount', 0) + amount
            data = {
                'amount': new_amount,
                'updated_at': now
            }
            return self.exec.update_by_id(existing.get('id'), data)
        else:
            return self.create(user_id, city_name, goods_type, amount)

    def remove_goods(self, user_id: int, city_name: str, goods_type: str, amount: int) -> Dict[str, Any]:
        existing = self.get_by_user_city_goods(user_id, city_name, goods_type)
        if not existing:
            return {'success': False, 'msg': '货物不存在'}

        current_amount = existing.get('amount', 0)
        if current_amount < amount:
            return {'success': False, 'msg': f'货物不足，当前仅有 {current_amount} 吨'}

        new_amount = current_amount - amount
        now = datetime.now().isoformat()

        if new_amount > 0:
            data = {
                'amount': new_amount,
                'updated_at': now
            }
            self.exec.update_by_id(existing.get('id'), data)
        else:
            self.exec.delete_by_id(existing.get('id'))

        return {
            'success': True,
            'msg': '货物出库成功',
            'remaining': new_amount
        }

    def transfer_goods(self, user_id: int, from_city: str, to_city: str, 
                        goods_type: str, amount: int) -> Dict[str, Any]:
        remove_result = self.remove_goods(user_id, from_city, goods_type, amount)
        if not remove_result.get('success'):
            return remove_result

        self.add_goods(user_id, to_city, goods_type, amount)

        return {
            'success': True,
            'msg': '货物转移成功',
            'from_city': from_city,
            'to_city': to_city,
            'goods_type': goods_type,
            'amount': amount
        }

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_public_dict(self, warehouse: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': warehouse.get('id'),
            'user_id': warehouse.get('user_id'),
            'city_name': warehouse.get('city_name'),
            'goods_type': warehouse.get('goods_type'),
            'amount': warehouse.get('amount')
        }
