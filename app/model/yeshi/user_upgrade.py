from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserUpgradeModel:
    TABLE_NAME = 'tb_yeshi_model_user_upgrade'
    
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
                game_user_id INTEGER NOT NULL,
                upgrade_id INTEGER NOT NULL,
                upgrade_name TEXT NOT NULL,
                current_level INTEGER DEFAULT 0,
                upgraded_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(game_user_id, upgrade_id)
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(game_user_id)"
        db.execute(index_sql)

    def create(self, game_user_id: int, upgrade_id: int, upgrade_name: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_user_id': game_user_id,
            'upgrade_id': upgrade_id,
            'upgrade_name': upgrade_name,
            'current_level': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_and_upgrade(self, game_user_id: int, upgrade_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'game_user_id': game_user_id,
            'upgrade_id': upgrade_id
        })

    def get_by_user_id(self, game_user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_user_id': game_user_id}, order_by='id ASC')

    def get_upgraded_by_user_id(self, game_user_id: int) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE game_user_id = ? AND current_level > 0"
        return self.db.fetch_all(sql, (game_user_id,))

    def upgrade(self, game_user_id: int, upgrade_id: int, upgrade_name: str, max_level: int = 5) -> Dict[str, Any]:
        now = datetime.now().isoformat()
        existing = self.get_by_user_and_upgrade(game_user_id, upgrade_id)
        
        if existing:
            current_level = existing.get('current_level', 0)
            if current_level >= max_level:
                return {
                    'success': False,
                    'message': '已达到最高等级',
                    'new_level': current_level
                }
            new_level = current_level + 1
            data = {
                'current_level': new_level,
                'upgraded_at': now,
                'updated_at': now
            }
            self.exec.update_by_id(existing['id'], data)
            return {
                'success': True,
                'message': '升级成功',
                'new_level': new_level,
                'old_level': current_level
            }
        else:
            data = {
                'game_user_id': game_user_id,
                'upgrade_id': upgrade_id,
                'upgrade_name': upgrade_name,
                'current_level': 1,
                'upgraded_at': now,
                'created_at': now,
                'updated_at': now
            }
            self.exec.insert(data)
            return {
                'success': True,
                'message': '升级成功',
                'new_level': 1,
                'old_level': 0
            }

    def get_current_level(self, game_user_id: int, upgrade_id: int) -> int:
        record = self.get_by_user_and_upgrade(game_user_id, upgrade_id)
        return record.get('current_level', 0) if record else 0

    def get_total_effects(self, game_user_id: int) -> Dict[str, int]:
        from app.model.yeshi.upgrade import UpgradeModel
        upgrade_model = UpgradeModel()
        all_upgrades = upgrade_model.get_all_active()
        user_upgrades = self.get_by_user_id(game_user_id)
        
        user_upgrade_map = {u['upgrade_id']: u['current_level'] for u in user_upgrades}
        
        effects = {}
        for upgrade in all_upgrades:
            level = user_upgrade_map.get(upgrade['id'], 0)
            if level > 0:
                effect_type = upgrade.get('effect_type')
                effect_value = upgrade.get('effect_value', 0)
                if effect_type:
                    effects[effect_type] = effects.get(effect_type, 0) + effect_value * level
        
        return effects

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
