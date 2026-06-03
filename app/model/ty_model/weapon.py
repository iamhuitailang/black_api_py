from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class WeaponModel:
    TABLE_NAME = 'tb_ty_model_weapons'

    STATUS_DRAFT = 0
    STATUS_ACTIVE = 1
    STATUS_DELETED = 2

    RARITY_COMMON = 1
    RARITY_RARE = 2
    RARITY_EPIC = 3
    RARITY_LEGENDARY = 4

    TYPE_SWORD = 'sword'
    TYPE_AXE = 'axe'
    TYPE_BOW = 'bow'
    TYPE_SPEAR = 'spear'
    TYPE_SHIELD = 'shield'
    TYPE_CUSTOM = 'custom'

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
                name TEXT NOT NULL,
                weapon_type TEXT DEFAULT 'custom',
                rarity INTEGER DEFAULT 1,
                attack INTEGER DEFAULT 10,
                defense INTEGER DEFAULT 5,
                speed INTEGER DEFAULT 5,
                durability INTEGER DEFAULT 100,
                max_durability INTEGER DEFAULT 100,
                level INTEGER DEFAULT 1,
                exp INTEGER DEFAULT 0,
                doodle_data TEXT,
                doodle_style TEXT DEFAULT 'normal',
                color_palette TEXT,
                description TEXT DEFAULT '',
                is_shared INTEGER DEFAULT 0,
                share_count INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_rarity ON {cls.TABLE_NAME}(rarity)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(weapon_type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_shared ON {cls.TABLE_NAME}(is_shared)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, user_id: int, name: str, doodle_data: str, weapon_type: str = 'custom',
               attack: int = 10, defense: int = 5, speed: int = 5,
               doodle_style: str = 'normal', color_palette: str = '',
               description: str = '') -> int:
        now = datetime.now().isoformat()

        rarity = self._calculate_rarity(attack, defense, speed, doodle_style)

        data = {
            'user_id': user_id,
            'name': name,
            'weapon_type': weapon_type,
            'rarity': rarity,
            'attack': attack,
            'defense': defense,
            'speed': speed,
            'durability': 100,
            'max_durability': 100,
            'level': 1,
            'exp': 0,
            'doodle_data': doodle_data,
            'doodle_style': doodle_style,
            'color_palette': color_palette,
            'description': description,
            'is_shared': 0,
            'share_count': 0,
            'like_count': 0,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def _calculate_rarity(self, attack: int, defense: int, speed: int, style: str) -> int:
        total = attack + defense + speed
        style_bonus = {'normal': 0, 'fire': 5, 'ice': 5, 'lightning': 8, 'poison': 5, 'holy': 10, 'shadow': 10}
        total += style_bonus.get(style, 0)

        if total >= 60:
            return self.RARITY_LEGENDARY
        elif total >= 45:
            return self.RARITY_EPIC
        elif total >= 30:
            return self.RARITY_RARE
        else:
            return self.RARITY_COMMON

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size,
            {'user_id': user_id, 'status': self.STATUS_ACTIVE},
            order_by='created_at DESC'
        )

    def get_shared_weapons(self, page: int = 1, page_size: int = 10,
                           rarity: int = None, weapon_type: str = None,
                           keyword: str = None) -> Dict[str, Any]:
        conditions = {'is_shared': 1, 'status': self.STATUS_ACTIVE}
        if rarity:
            conditions['rarity'] = rarity
        if weapon_type:
            conditions['weapon_type'] = weapon_type

        if keyword:
            return self._search_shared(keyword, page, page_size, rarity, weapon_type)

        return self.query.paginate(page, page_size, conditions, order_by='like_count DESC, created_at DESC')

    def _search_shared(self, keyword: str, page: int = 1, page_size: int = 10,
                       rarity: int = None, weapon_type: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["is_shared = 1", "status = 1"]
        params = []

        if rarity:
            where_clauses.append("rarity = ?")
            params.append(rarity)
        if weapon_type:
            where_clauses.append("weapon_type = ?")
            params.append(weapon_type)

        where_clauses.append("(name LIKE ? OR description LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY like_count DESC, created_at DESC 
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

    def update(self, weapon_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'attack', 'defense', 'speed', 'description', 'is_shared'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(weapon_id, update_data)

    def add_exp(self, weapon_id: int, exp: int) -> Dict[str, Any]:
        weapon = self.get_by_id(weapon_id)
        if not weapon:
            return {'success': False, 'level_up': False}

        current_exp = weapon.get('exp', 0) + exp
        current_level = weapon.get('level', 1)
        level_up = False
        new_level = current_level

        while current_exp >= new_level * 50:
            current_exp -= new_level * 50
            new_level += 1
            level_up = True

        now = datetime.now().isoformat()
        data = {
            'exp': current_exp,
            'level': new_level,
            'updated_at': now
        }

        if level_up:
            data['attack'] = weapon.get('attack', 10) + 2 * (new_level - current_level)
            data['defense'] = weapon.get('defense', 5) + 1 * (new_level - current_level)
            data['max_durability'] = weapon.get('max_durability', 100) + 10 * (new_level - current_level)
            data['durability'] = data['max_durability']

        affected = self.exec.update_by_id(weapon_id, data)
        return {
            'success': affected > 0,
            'level_up': level_up,
            'new_level': new_level,
            'remaining_exp': current_exp
        }

    def repair(self, weapon_id: int) -> int:
        weapon = self.get_by_id(weapon_id)
        if not weapon:
            return 0

        now = datetime.now().isoformat()
        data = {
            'durability': weapon.get('max_durability', 100),
            'updated_at': now
        }
        return self.exec.update_by_id(weapon_id, data)

    def decrease_durability(self, weapon_id: int, amount: int = 10) -> int:
        weapon = self.get_by_id(weapon_id)
        if not weapon:
            return 0

        new_durability = max(0, weapon.get('durability', 100) - amount)
        now = datetime.now().isoformat()
        data = {
            'durability': new_durability,
            'updated_at': now
        }
        return self.exec.update_by_id(weapon_id, data)

    def add_like(self, weapon_id: int) -> int:
        weapon = self.get_by_id(weapon_id)
        if not weapon:
            return 0

        now = datetime.now().isoformat()
        data = {
            'like_count': weapon.get('like_count', 0) + 1,
            'updated_at': now
        }
        return self.exec.update_by_id(weapon_id, data)

    def add_share_count(self, weapon_id: int) -> int:
        weapon = self.get_by_id(weapon_id)
        if not weapon:
            return 0

        now = datetime.now().isoformat()
        data = {
            'share_count': weapon.get('share_count', 0) + 1,
            'updated_at': now
        }
        return self.exec.update_by_id(weapon_id, data)

    def delete(self, weapon_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_DELETED,
            'updated_at': now
        }
        return self.exec.update_by_id(weapon_id, data)

    def get_rarity_text(self, rarity: int) -> str:
        rarity_map = {
            self.RARITY_COMMON: '普通',
            self.RARITY_RARE: '稀有',
            self.RARITY_EPIC: '史诗',
            self.RARITY_LEGENDARY: '传说'
        }
        return rarity_map.get(rarity, '未知')

    def get_type_text(self, weapon_type: str) -> str:
        type_map = {
            self.TYPE_SWORD: '剑',
            self.TYPE_AXE: '斧',
            self.TYPE_BOW: '弓',
            self.TYPE_SPEAR: '矛',
            self.TYPE_SHIELD: '盾',
            self.TYPE_CUSTOM: '自定义'
        }
        return type_map.get(weapon_type, '自定义')

    def to_public_dict(self, weapon: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': weapon.get('id'),
            'user_id': weapon.get('user_id'),
            'name': weapon.get('name'),
            'weapon_type': weapon.get('weapon_type'),
            'weapon_type_text': self.get_type_text(weapon.get('weapon_type', 'custom')),
            'rarity': weapon.get('rarity'),
            'rarity_text': self.get_rarity_text(weapon.get('rarity', 1)),
            'attack': weapon.get('attack'),
            'defense': weapon.get('defense'),
            'speed': weapon.get('speed'),
            'durability': weapon.get('durability'),
            'max_durability': weapon.get('max_durability'),
            'level': weapon.get('level'),
            'exp': weapon.get('exp'),
            'doodle_data': weapon.get('doodle_data'),
            'doodle_style': weapon.get('doodle_style'),
            'color_palette': weapon.get('color_palette'),
            'description': weapon.get('description'),
            'is_shared': weapon.get('is_shared'),
            'share_count': weapon.get('share_count'),
            'like_count': weapon.get('like_count'),
            'status': weapon.get('status'),
            'created_at': weapon.get('created_at'),
            'updated_at': weapon.get('updated_at')
        }
