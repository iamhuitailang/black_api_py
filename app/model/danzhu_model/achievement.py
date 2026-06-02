from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AchievementModel:
    TABLE_NAME = 'tb_danzhu_model_achievements'

    TYPE_SCORE = 'score'
    TYPE_COMBO = 'combo'
    TYPE_GAMES = 'games'
    TYPE_SPECIAL = 'special'

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
                description TEXT DEFAULT '',
                type TEXT DEFAULT 'score',
                icon TEXT DEFAULT '',
                condition_type TEXT DEFAULT '',
                condition_value INTEGER DEFAULT 0,
                reward_points INTEGER DEFAULT 0,
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
    def init_default_achievements(cls):
        model = cls()
        default_achievements = [
            {
                'name': '初试锋芒',
                'description': '完成第一局游戏',
                'type': 'games',
                'condition_type': 'games_played',
                'condition_value': 1,
                'reward_points': 10,
                'status': 0
            },
            {
                'name': '小试牛刀',
                'description': '完成10局游戏',
                'type': 'games',
                'condition_type': 'games_played',
                'condition_value': 10,
                'reward_points': 50,
                'status': 0
            },
            {
                'name': '百战百胜',
                'description': '完成100局游戏',
                'type': 'games',
                'condition_type': 'games_played',
                'condition_value': 100,
                'reward_points': 200,
                'status': 0
            },
            {
                'name': '初露锋芒',
                'description': '单局得分超过1000',
                'type': 'score',
                'condition_type': 'single_score',
                'condition_value': 1000,
                'reward_points': 20,
                'status': 0
            },
            {
                'name': '得分高手',
                'description': '单局得分超过5000',
                'type': 'score',
                'condition_type': 'single_score',
                'condition_value': 5000,
                'reward_points': 100,
                'status': 0
            },
            {
                'name': '弹珠大师',
                'description': '单局得分超过10000',
                'type': 'score',
                'condition_type': 'single_score',
                'condition_value': 10000,
                'reward_points': 300,
                'status': 0
            },
            {
                'name': '传奇玩家',
                'description': '单局得分超过50000',
                'type': 'score',
                'condition_type': 'single_score',
                'condition_value': 50000,
                'reward_points': 1000,
                'status': 0
            },
            {
                'name': '连击新手',
                'description': '达成5连击',
                'type': 'combo',
                'condition_type': 'max_combo',
                'condition_value': 5,
                'reward_points': 15,
                'status': 0
            },
            {
                'name': '连击达人',
                'description': '达成10连击',
                'type': 'combo',
                'condition_type': 'max_combo',
                'condition_value': 10,
                'reward_points': 50,
                'status': 0
            },
            {
                'name': '连击王者',
                'description': '达成20连击',
                'type': 'combo',
                'condition_type': 'max_combo',
                'condition_value': 20,
                'reward_points': 150,
                'status': 0
            },
            {
                'name': '连击之神',
                'description': '达成50连击',
                'type': 'combo',
                'condition_type': 'max_combo',
                'condition_value': 50,
                'reward_points': 500,
                'status': 0
            },
            {
                'name': '总分王者',
                'description': '累计得分超过100000',
                'type': 'score',
                'condition_type': 'total_score',
                'condition_value': 100000,
                'reward_points': 500,
                'status': 0
            }
        ]

        for achievement_data in default_achievements:
            existing = model.query.find_one({'name': achievement_data['name']})
            if not existing:
                model.create(**achievement_data)

    def create(self, name: str, description: str = '', type: str = 'score',
                 icon: str = '', condition_type: str = '', condition_value: int = 0,
                 reward_points: int = 0, status: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'type': type,
            'icon': icon,
            'condition_type': condition_type,
            'condition_value': condition_value,
            'reward_points': reward_points,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all_active(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'status': self.STATUS_ACTIVE}, order_by='id ASC')

    def check_and_unlock(self, user_id: int, user_stats: Dict[str, Any]) -> List[Dict[str, Any]]:
        from app.model.danzhu_model.achievement import UserAchievementModel
        user_achievement_model = UserAchievementModel()

        all_achievements = self.get_all_active()
        unlocked = []

        for achievement in all_achievements:
            condition_type = achievement.get('condition_type', '')
            condition_value = achievement.get('condition_value', 0)

            current_value = user_stats.get(condition_type, 0)

            if current_value >= condition_value:
                existing = user_achievement_model.query.find_one({
                    'user_id': user_id,
                    'achievement_id': achievement.get('id')
                })

                if not existing:
                    user_achievement_model.create(user_id, achievement.get('id'), achievement.get('reward_points', 0))
                    unlocked.append(achievement)

        return unlocked

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'type', 'icon',
            'condition_type', 'condition_value', 'reward_points', 'status'
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
            self.TYPE_SCORE: '得分',
            self.TYPE_COMBO: '连击',
            self.TYPE_GAMES: '游戏次数',
            self.TYPE_SPECIAL: '特殊'
        }
        return type_map.get(type, '未知')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_ACTIVE: '启用',
            self.STATUS_DISABLED: '禁用'
        }
        return status_map.get(status, '未知')

    def to_dict(self, achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': achievement.get('id'),
            'name': achievement.get('name'),
            'description': achievement.get('description'),
            'type': achievement.get('type'),
            'type_text': self.get_type_text(achievement.get('type')),
            'icon': achievement.get('icon'),
            'condition_type': achievement.get('condition_type'),
            'condition_value': achievement.get('condition_value'),
            'reward_points': achievement.get('reward_points'),
            'status': achievement.get('status'),
            'status_text': self.get_status_text(achievement.get('status')),
            'created_at': achievement.get('created_at'),
            'updated_at': achievement.get('updated_at')
        }


class UserAchievementModel:
    TABLE_NAME = 'tb_danzhu_model_user_achievements'

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
                achievement_id INTEGER NOT NULL,
                reward_points INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_achievement_id ON {cls.TABLE_NAME}(achievement_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_achievement ON {cls.TABLE_NAME}(user_id, achievement_id)"
        db.execute(index_sql3)

    def create(self, user_id: int, achievement_id: int, reward_points: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'achievement_id': achievement_id,
            'reward_points': reward_points,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_user_achievements(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT ua.*, a.name, a.description, a.type, a.icon, 
                   a.condition_type, a.condition_value, a.reward_points as achievement_reward
            FROM {self.TABLE_NAME} ua
            LEFT JOIN {AchievementModel.TABLE_NAME} a ON ua.achievement_id = a.id
            WHERE ua.user_id = ?
            ORDER BY ua.created_at DESC
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_user_achievement_ids(self, user_id: int) -> List[int]:
        records = self.query.find_all({'user_id': user_id})
        return [r.get('achievement_id') for r in records]

    def get_user_total_rewards(self, user_id: int) -> int:
        sql = f"SELECT COALESCE(SUM(reward_points), 0) as total FROM {self.TABLE_NAME} WHERE user_id = ?"
        result = self.db.fetch_one(sql, (user_id,))
        return result.get('total', 0) if result else 0

    def delete_by_user_id(self, user_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE user_id = ?",
            (user_id,)
        )

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'achievement_id': record.get('achievement_id'),
            'reward_points': record.get('reward_points'),
            'name': record.get('name'),
            'description': record.get('description'),
            'type': record.get('type'),
            'icon': record.get('icon'),
            'condition_type': record.get('condition_type'),
            'condition_value': record.get('condition_value'),
            'created_at': record.get('created_at')
        }
