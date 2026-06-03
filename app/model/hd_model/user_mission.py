from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserMissionModel:
    TABLE_NAME = 'tb_hd_model_user_mission'

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
                mission_id INTEGER NOT NULL,
                progress INTEGER DEFAULT 0,
                is_completed INTEGER DEFAULT 0,
                is_claimed INTEGER DEFAULT 0,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_mission_id ON {cls.TABLE_NAME}(mission_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_mission ON {cls.TABLE_NAME}(user_id, mission_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_completed ON {cls.TABLE_NAME}(is_completed)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_claimed ON {cls.TABLE_NAME}(is_claimed)"
        db.execute(index_sql)

    def create(self, user_id: int, mission_id: int, progress: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'mission_id': mission_id,
            'progress': progress,
            'is_completed': 0,
            'is_claimed': 0,
            'completed_at': None,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_mission(self, user_id: int, mission_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'mission_id': mission_id})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'progress', 'is_completed', 'is_claimed', 'completed_at'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                user_id: int = None, mission_id: int = None,
                is_completed: int = None, is_claimed: int = None,
                order_by: str = 'id DESC') -> Dict[str, Any]:
        conditions = {}
        if user_id is not None:
            conditions['user_id'] = user_id
        if mission_id is not None:
            conditions['mission_id'] = mission_id
        if is_completed is not None:
            conditions['is_completed'] = is_completed
        if is_claimed is not None:
            conditions['is_claimed'] = is_claimed
        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def get_user_missions(self, user_id: int, mission_type: int = None) -> List[Dict[str, Any]]:
        from app.model.hd_model.mission import MissionModel
        mission_model = MissionModel()

        where_clauses = ["um.user_id = ?"]
        params = [user_id]

        if mission_type is not None:
            where_clauses.append("m.type = ?")
            params.append(mission_type)

        sql = f"""
            SELECT um.*, m.name, m.description, m.type, m.target_type, m.target_value,
                   m.reward_exp, m.reward_gold, m.is_daily
            FROM {self.TABLE_NAME} um
            LEFT JOIN {mission_model.TABLE_NAME} m ON um.mission_id = m.id
            WHERE {' AND '.join(where_clauses)}
            ORDER BY m.is_daily DESC, m.type ASC, um.id ASC
        """
        return self.db.fetch_all(sql, tuple(params))

    def update_progress(self, user_id: int, target_type: str, delta: int = 1) -> List[Dict[str, Any]]:
        from app.model.hd_model.mission import MissionModel
        mission_model = MissionModel()

        sql = f"""
            SELECT um.id, um.progress, m.target_value, m.id as mission_id
            FROM {self.TABLE_NAME} um
            LEFT JOIN {mission_model.TABLE_NAME} m ON um.mission_id = m.id
            WHERE um.user_id = ? AND m.target_type = ? AND um.is_completed = 0
        """
        user_missions = self.db.fetch_all(sql, (user_id, target_type))

        completed_missions = []
        now = datetime.now().isoformat()

        for um in user_missions:
            new_progress = um['progress'] + delta
            target_value = um['target_value']
            is_completed = 1 if new_progress >= target_value else 0
            completed_at = now if is_completed else None

            update_data = {
                'progress': min(new_progress, target_value),
                'is_completed': is_completed,
                'completed_at': completed_at
            }
            self.update(um['id'], update_data)

            if is_completed:
                mission = mission_model.get_by_id(um['mission_id'])
                completed_missions.append({
                    'user_mission_id': um['id'],
                    'mission_id': um['mission_id'],
                    'mission_name': mission.get('name') if mission else '',
                    'reward_exp': mission.get('reward_exp', 0) if mission else 0,
                    'reward_gold': mission.get('reward_gold', 0) if mission else 0
                })

        return completed_missions

    def claim_reward(self, user_mission_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        user_mission = self.get_by_id(user_mission_id)
        if not user_mission:
            return None

        if user_mission.get('user_id') != user_id:
            return None

        if user_mission.get('is_completed') != 1:
            return None

        if user_mission.get('is_claimed') == 1:
            return None

        from app.model.hd_model.mission import MissionModel
        mission_model = MissionModel()
        mission = mission_model.get_by_id(user_mission.get('mission_id'))

        if not mission:
            return None

        self.update(user_mission_id, {'is_claimed': 1})

        return {
            'reward_exp': mission.get('reward_exp', 0),
            'reward_gold': mission.get('reward_gold', 0),
            'mission_name': mission.get('name')
        }

    def refresh_daily(self, user_id: int) -> int:
        from app.model.hd_model.mission import MissionModel
        mission_model = MissionModel()

        daily_missions = mission_model.get_daily_missions()
        now = datetime.now().isoformat()
        count = 0

        for mission in daily_missions:
            existing = self.get_by_user_and_mission(user_id, mission.get('id'))
            if not existing:
                self.create(user_id, mission.get('id'))
                count += 1
            else:
                self.update(existing.get('id'), {
                    'progress': 0,
                    'is_completed': 0,
                    'is_claimed': 0,
                    'completed_at': None
                })
                count += 1

        return count

    def init_user_missions(self, user_id: int) -> int:
        from app.model.hd_model.mission import MissionModel
        mission_model = MissionModel()

        all_missions = mission_model.get_all(page_size=1000).get('items', [])
        count = 0

        for mission in all_missions:
            existing = self.get_by_user_and_mission(user_id, mission.get('id'))
            if not existing:
                self.create(user_id, mission.get('id'))
                count += 1

        return count

    def to_dict(self, user_mission: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user_mission.get('id'),
            'user_id': user_mission.get('user_id'),
            'mission_id': user_mission.get('mission_id'),
            'progress': user_mission.get('progress'),
            'is_completed': user_mission.get('is_completed'),
            'is_claimed': user_mission.get('is_claimed'),
            'completed_at': user_mission.get('completed_at'),
            'created_at': user_mission.get('created_at'),
            'updated_at': user_mission.get('updated_at')
        }
