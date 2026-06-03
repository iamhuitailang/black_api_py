from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
from app.model.hd_model.level import LevelModel
from app.model.hd_model.user import UserModel


class UserLevelModel:
    TABLE_NAME = 'tb_hd_model_user_level'

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)
        self.level_model = LevelModel()
        self.user_model = UserModel()

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                level_id INTEGER NOT NULL,
                best_score INTEGER DEFAULT 0,
                best_time INTEGER DEFAULT 0,
                stars INTEGER DEFAULT 0,
                is_completed INTEGER DEFAULT 0,
                play_count INTEGER DEFAULT 0,
                last_play_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level_id ON {cls.TABLE_NAME}(level_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_level ON {cls.TABLE_NAME}(user_id, level_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_completed ON {cls.TABLE_NAME}(is_completed)"
        db.execute(index_sql)

    def create(self, user_id: int, level_id: int, best_score: int = 0,
               best_time: int = 0, stars: int = 0, is_completed: int = 0,
               play_count: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'level_id': level_id,
            'best_score': best_score,
            'best_time': best_time,
            'stars': stars,
            'is_completed': is_completed,
            'play_count': play_count,
            'last_play_at': now,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'best_score', 'best_time', 'stars', 'is_completed', 'play_count', 'last_play_at'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                user_id: int = None, level_id: int = None,
                is_completed: int = None, order_by: str = 'id DESC') -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        if level_id:
            conditions['level_id'] = level_id
        if is_completed is not None:
            conditions['is_completed'] = is_completed
        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def get_user_level(self, user_id: int, level_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'level_id': level_id})

    def get_user_levels(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT ul.*, l.name, l.description, l.type, l.difficulty, 
                   l.unlock_level, l.reward_exp, l.reward_gold, 
                   l.enemy_count, l.time_limit, l.map_data
            FROM {self.TABLE_NAME} ul
            RIGHT JOIN {LevelModel.TABLE_NAME} l ON ul.level_id = l.id
            WHERE ul.user_id = ? OR ul.user_id IS NULL
            ORDER BY l.difficulty ASC, l.id ASC
        """
        results = self.db.fetch_all(sql, (user_id,))
        levels = []
        for row in results:
            level = dict(row)
            if level.get('user_id') is None:
                level['user_id'] = user_id
                level['level_id'] = level.get('id')
                level['best_score'] = 0
                level['best_time'] = 0
                level['stars'] = 0
                level['is_completed'] = 0
                level['play_count'] = 0
            level['type_text'] = self.level_model.get_type_text(level.get('type'))
            level['difficulty_stars'] = self.level_model.get_difficulty_stars(level.get('difficulty'))
            levels.append(level)
        return levels

    def start_level(self, user_id: int, level_id: int) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {'success': False, 'message': '关卡不存在'}

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'success': False, 'message': '用户不存在'}

        if user.get('level', 1) < level.get('unlock_level', 1):
            return {'success': False, 'message': f'需要等级{level.get("unlock_level")}才能解锁此关卡'}

        user_level = self.get_user_level(user_id, level_id)
        now = datetime.now().isoformat()

        if user_level:
            update_data = {
                'play_count': user_level.get('play_count', 0) + 1,
                'last_play_at': now
            }
            self.exec.update_by_id(user_level['id'], update_data)
        else:
            self.create(user_id, level_id, play_count=1)

        return {
            'success': True,
            'message': '开始游戏',
            'level': self.level_model.to_dict(level)
        }

    def complete_level(self, user_id: int, level_id: int, score: int, time: int) -> Dict[str, Any]:
        user_level = self.get_user_level(user_id, level_id)
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {'success': False, 'message': '关卡不存在'}

        if not user_level:
            user_level_id = self.create(user_id, level_id)
            user_level = {'id': user_level_id, 'best_score': 0, 'best_time': 0, 'stars': 0, 'is_completed': 0}

        stars = self._calculate_stars(score, time, level)
        now = datetime.now().isoformat()

        update_data = {}
        is_new_record = False

        if score > user_level.get('best_score', 0):
            update_data['best_score'] = score
            is_new_record = True

        if user_level.get('best_time', 0) == 0 or time < user_level.get('best_time', 0):
            update_data['best_time'] = time
            is_new_record = True

        if stars > user_level.get('stars', 0):
            update_data['stars'] = stars

        if not user_level.get('is_completed', 0):
            update_data['is_completed'] = 1

        update_data['last_play_at'] = now

        rows = self.exec.update_by_id(user_level['id'], update_data)

        if rows > 0 and not user_level.get('is_completed', 0):
            self.user_model.add_exp(user_id, level.get('reward_exp', 0))
            self.user_model.update_gold(user_id, level.get('reward_gold', 0))

        return {
            'success': True,
            'message': '关卡完成',
            'stars': stars,
            'is_new_record': is_new_record,
            'reward_exp': level.get('reward_exp', 0) if not user_level.get('is_completed', 0) else 0,
            'reward_gold': level.get('reward_gold', 0) if not user_level.get('is_completed', 0) else 0
        }

    def get_progress(self, user_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as total_levels,
                SUM(CASE WHEN ul.is_completed = 1 THEN 1 ELSE 0 END) as completed_levels,
                COALESCE(SUM(ul.stars), 0) as total_stars,
                COALESCE(SUM(ul.play_count), 0) as total_plays,
                COALESCE(MAX(ul.best_score), 0) as best_score,
                COALESCE(MIN(CASE WHEN ul.best_time > 0 THEN ul.best_time END), 0) as best_time
            FROM {LevelModel.TABLE_NAME} l
            LEFT JOIN {self.TABLE_NAME} ul ON l.id = ul.level_id AND ul.user_id = ?
        """
        result = self.db.fetch_one(sql, (user_id,))
        if result:
            total_levels = result.get('total_levels', 0)
            completed_levels = result.get('completed_levels', 0)
            total_stars = result.get('total_stars', 0)
            max_stars = total_levels * 3
            return {
                'total_levels': total_levels,
                'completed_levels': completed_levels,
                'completion_rate': round(completed_levels / total_levels * 100, 2) if total_levels > 0 else 0,
                'total_stars': total_stars,
                'max_stars': max_stars,
                'star_rate': round(total_stars / max_stars * 100, 2) if max_stars > 0 else 0,
                'total_plays': result.get('total_plays', 0),
                'best_score': result.get('best_score', 0),
                'best_time': result.get('best_time', 0)
            }
        return {
            'total_levels': 0,
            'completed_levels': 0,
            'completion_rate': 0,
            'total_stars': 0,
            'max_stars': 0,
            'star_rate': 0,
            'total_plays': 0,
            'best_score': 0,
            'best_time': 0
        }

    def get_completed_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id, 'is_completed': 1})

    def get_total_stars(self, user_id: int) -> int:
        sql = f"SELECT COALESCE(SUM(stars), 0) as total FROM {self.TABLE_NAME} WHERE user_id = ?"
        result = self.db.fetch_one(sql, (user_id,))
        return result.get('total', 0) if result else 0

    def _calculate_stars(self, score: int, time: int, level: Dict[str, Any]) -> int:
        time_limit = level.get('time_limit', 0)
        if time_limit == 0:
            time_ratio = 1.0
        else:
            time_ratio = max(0, min(1, 1 - (time / time_limit)))

        score_thresholds = [5000, 8000, 10000]
        time_bonus = int(time_ratio * 5000)
        total_score = score + time_bonus

        stars = 0
        if total_score >= score_thresholds[0]:
            stars = 1
        if total_score >= score_thresholds[1]:
            stars = 2
        if total_score >= score_thresholds[2]:
            stars = 3

        return stars
