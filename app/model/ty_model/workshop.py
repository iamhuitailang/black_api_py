from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class WorkshopModel:
    TABLE_NAME = 'tb_ty_model_workshop'

    STATUS_PUBLISHED = 1
    STATUS_DRAFT = 0
    STATUS_DELETED = 2

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
                weapon_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                tags TEXT,
                view_count INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                favorite_count INTEGER DEFAULT 0,
                comment_count INTEGER DEFAULT 0,
                is_official INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_weapon_id ON {cls.TABLE_NAME}(weapon_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_official ON {cls.TABLE_NAME}(is_official)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_like_count ON {cls.TABLE_NAME}(like_count)"
        db.execute(index_sql)

    def publish(self, user_id: int, weapon_id: int, title: str,
                description: str = '', tags: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'weapon_id': weapon_id,
            'title': title,
            'description': description,
            'tags': tags,
            'view_count': 0,
            'like_count': 0,
            'favorite_count': 0,
            'comment_count': 0,
            'is_official': 0,
            'status': self.STATUS_PUBLISHED,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, workshop_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(workshop_id)

    def get_by_weapon_id(self, weapon_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'weapon_id': weapon_id, 'status': self.STATUS_PUBLISHED})

    def get_list(self, page: int = 1, page_size: int = 10,
                 user_id: int = None, is_official: int = None,
                 keyword: str = None, tag: str = None,
                 sort_by: str = 'like_count') -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["w.status = 1"]
        params = []

        if user_id:
            where_clauses.append("w.user_id = ?")
            params.append(user_id)
        if is_official is not None:
            where_clauses.append("w.is_official = ?")
            params.append(is_official)
        if keyword:
            where_clauses.append("(w.title LIKE ? OR w.description LIKE ?)")
            like_pattern = f"%{keyword}%"
            params.extend([like_pattern, like_pattern])
        if tag:
            where_clauses.append("w.tags LIKE ?")
            params.append(f"%{tag}%")

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} w WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        order_clause = f"w.{sort_by} DESC, w.created_at DESC"
        if sort_by not in ['like_count', 'view_count', 'favorite_count', 'created_at']:
            order_clause = "w.like_count DESC, w.created_at DESC"

        select_sql = f"""
            SELECT w.*, u.nickname as author_name, u.avatar as author_avatar,
                   wp.name as weapon_name, wp.weapon_type, wp.rarity, wp.attack,
                   wp.defense, wp.speed, wp.level, wp.doodle_data, wp.doodle_style,
                   wp.color_palette, wp.description as weapon_description
            FROM {self.TABLE_NAME} w
            LEFT JOIN tb_ty_model_users u ON w.user_id = u.id
            LEFT JOIN tb_ty_model_weapons wp ON w.weapon_id = wp.id
            WHERE {' AND '.join(where_clauses)}
            ORDER BY {order_clause}
            LIMIT ? OFFSET ?
        """
        params.extend([page_size, offset])
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def add_view(self, workshop_id: int) -> int:
        workshop = self.get_by_id(workshop_id)
        if not workshop:
            return 0

        now = datetime.now().isoformat()
        data = {
            'view_count': workshop.get('view_count', 0) + 1,
            'updated_at': now
        }
        return self.exec.update_by_id(workshop_id, data)

    def add_like(self, workshop_id: int) -> int:
        workshop = self.get_by_id(workshop_id)
        if not workshop:
            return 0

        now = datetime.now().isoformat()
        data = {
            'like_count': workshop.get('like_count', 0) + 1,
            'updated_at': now
        }
        affected = self.exec.update_by_id(workshop_id, data)

        if affected > 0:
            from app.model.ty_model.weapon import WeaponModel
            weapon_model = WeaponModel()
            weapon_model.add_like(workshop.get('weapon_id', 0))

        return affected

    def add_favorite(self, workshop_id: int) -> int:
        workshop = self.get_by_id(workshop_id)
        if not workshop:
            return 0

        now = datetime.now().isoformat()
        data = {
            'favorite_count': workshop.get('favorite_count', 0) + 1,
            'updated_at': now
        }
        return self.exec.update_by_id(workshop_id, data)

    def update(self, workshop_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'description', 'tags'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(workshop_id, update_data)

    def delete(self, workshop_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_DELETED,
            'updated_at': now
        }
        return self.exec.update_by_id(workshop_id, data)

    def copy_weapon(self, workshop_id: int, target_user_id: int) -> Dict[str, Any]:
        from app.model.ty_model.weapon import WeaponModel
        from app.model.ty_model.user import UserModel

        workshop = self.get_by_id(workshop_id)
        if not workshop:
            return {'success': False, 'msg': '作品不存在'}

        weapon_model = WeaponModel()
        user_model = UserModel()

        original_weapon = weapon_model.get_by_id(workshop.get('weapon_id', 0))
        if not original_weapon:
            return {'success': False, 'msg': '武器数据不存在'}

        if not user_model.use_paint_and_canvas(target_user_id, 1, 1):
            return {'success': False, 'msg': '颜料或画布不足'}

        new_weapon_id = weapon_model.create(
            user_id=target_user_id,
            name=f"{original_weapon.get('name', '武器')}(副本)",
            doodle_data=original_weapon.get('doodle_data', ''),
            weapon_type=original_weapon.get('weapon_type', 'custom'),
            attack=original_weapon.get('attack', 10),
            defense=original_weapon.get('defense', 5),
            speed=original_weapon.get('speed', 5),
            doodle_style=original_weapon.get('doodle_style', 'normal'),
            color_palette=original_weapon.get('color_palette', ''),
            description=f"复制自创意工坊作品: {workshop.get('title', '')}"
        )

        if new_weapon_id > 0:
            self.add_favorite(workshop_id)
            return {'success': True, 'weapon_id': new_weapon_id, 'msg': '复制成功'}

        return {'success': False, 'msg': '复制失败'}

    def to_public_dict(self, item: Dict[str, Any]) -> Dict[str, Any]:
        tags = item.get('tags', '')
        tag_list = tags.split(',') if tags else []

        return {
            'id': item.get('id'),
            'user_id': item.get('user_id'),
            'weapon_id': item.get('weapon_id'),
            'title': item.get('title'),
            'description': item.get('description'),
            'tags': tag_list,
            'view_count': item.get('view_count'),
            'like_count': item.get('like_count'),
            'favorite_count': item.get('favorite_count'),
            'comment_count': item.get('comment_count'),
            'is_official': item.get('is_official'),
            'author_name': item.get('author_name'),
            'author_avatar': item.get('author_avatar'),
            'weapon': {
                'id': item.get('weapon_id'),
                'name': item.get('weapon_name'),
                'weapon_type': item.get('weapon_type'),
                'rarity': item.get('rarity'),
                'attack': item.get('attack'),
                'defense': item.get('defense'),
                'speed': item.get('speed'),
                'level': item.get('level'),
                'doodle_data': item.get('doodle_data'),
                'doodle_style': item.get('doodle_style'),
                'color_palette': item.get('color_palette'),
                'description': item.get('weapon_description')
            } if item.get('weapon_id') else None,
            'created_at': item.get('created_at')
        }
