from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EnemyModel:
    TABLE_NAME = 'tb_game_enemy'

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
                ship_type TEXT NOT NULL DEFAULT 'scout',
                description TEXT DEFAULT '',
                faction TEXT NOT NULL DEFAULT 'pirate',
                max_hull INTEGER NOT NULL DEFAULT 50,
                max_shield INTEGER NOT NULL DEFAULT 20,
                shield_regen INTEGER NOT NULL DEFAULT 2,
                attack INTEGER NOT NULL DEFAULT 10,
                defense INTEGER NOT NULL DEFAULT 2,
                evasion INTEGER NOT NULL DEFAULT 5,
                reward_credits INTEGER NOT NULL DEFAULT 100,
                reward_exp INTEGER NOT NULL DEFAULT 10,
                difficulty INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    @classmethod
    def seed_data(cls):
        model = cls()
        if model.query.count() > 0:
            return
        enemies = [
            {'name': '海盗侦察机', 'ship_type': 'scout', 'description': '最弱的海盗飞船，皮薄馅大。',
             'faction': 'pirate', 'max_hull': 40, 'max_shield': 15, 'shield_regen': 2,
             'attack': 8, 'defense': 1, 'evasion': 8, 'reward_credits': 80, 'reward_exp': 5, 'difficulty': 1},
            {'name': '海盗拦截艇', 'ship_type': 'fighter', 'description': '标准海盗战斗单位。',
             'faction': 'pirate', 'max_hull': 80, 'max_shield': 30, 'shield_regen': 3,
             'attack': 14, 'defense': 4, 'evasion': 10, 'reward_credits': 180, 'reward_exp': 15, 'difficulty': 2},
            {'name': '海盗突袭舰', 'ship_type': 'raider', 'description': '改装的武装商船，火力不错。',
             'faction': 'pirate', 'max_hull': 120, 'max_shield': 50, 'shield_regen': 4,
             'attack': 20, 'defense': 6, 'evasion': 7, 'reward_credits': 320, 'reward_exp': 30, 'difficulty': 3},
            {'name': '海盗重型炮舰', 'ship_type': 'gunship', 'description': '海盗精英单位，火力凶猛。',
             'faction': 'pirate', 'max_hull': 200, 'max_shield': 80, 'shield_regen': 6,
             'attack': 28, 'defense': 12, 'evasion': 5, 'reward_credits': 600, 'reward_exp': 60, 'difficulty': 4},
            {'name': '海盗旗舰', 'ship_type': 'flagship', 'description': '海盗首领的座舰，不好对付。',
             'faction': 'pirate', 'max_hull': 350, 'max_shield': 150, 'shield_regen': 10,
             'attack': 38, 'defense': 18, 'evasion': 6, 'reward_credits': 1500, 'reward_exp': 150, 'difficulty': 5},
            {'name': '失窃无人机', 'ship_type': 'drone', 'description': '失控的工业无人机。',
             'faction': 'rogue', 'max_hull': 30, 'max_shield': 10, 'shield_regen': 1,
             'attack': 10, 'defense': 0, 'evasion': 15, 'reward_credits': 60, 'reward_exp': 8, 'difficulty': 1},
            {'name': '失控守卫艇', 'ship_type': 'guard', 'description': '被黑客入侵的企业保安艇。',
             'faction': 'rogue', 'max_hull': 100, 'max_shield': 60, 'shield_regen': 5,
             'attack': 16, 'defense': 8, 'evasion': 5, 'reward_credits': 250, 'reward_exp': 25, 'difficulty': 3},
            {'name': '外星生物舰船', 'ship_type': 'bio', 'description': '来自深空的未知生物体。',
             'faction': 'alien', 'max_hull': 150, 'max_shield': 40, 'shield_regen': 8,
             'attack': 24, 'defense': 8, 'evasion': 12, 'reward_credits': 500, 'reward_exp': 70, 'difficulty': 4},
        ]
        for e in enemies:
            model.create(**e)

    def create(self, name: str, ship_type: str = 'scout', description: str = '',
               faction: str = 'pirate', max_hull: int = 50, max_shield: int = 20,
               shield_regen: int = 2, attack: int = 10, defense: int = 2,
               evasion: int = 5, reward_credits: int = 100, reward_exp: int = 10,
               difficulty: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'ship_type': ship_type,
            'description': description,
            'faction': faction,
            'max_hull': max_hull,
            'max_shield': max_shield,
            'shield_regen': shield_regen,
            'attack': attack,
            'defense': defense,
            'evasion': evasion,
            'reward_credits': reward_credits,
            'reward_exp': reward_exp,
            'difficulty': difficulty,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='difficulty ASC, faction ASC')

    def get_by_faction(self, faction: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'faction': faction}, order_by='difficulty ASC')

    def get_by_difficulty(self, max_diff: int, min_diff: int = 1) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE difficulty >= ? AND difficulty <= ? ORDER BY difficulty ASC"
        return self.db.fetch_all(sql, (min_diff, max_diff))

    def get_random_by_difficulty(self, difficulty: int) -> Optional[Dict[str, Any]]:
        min_d = max(1, difficulty - 1)
        max_d = difficulty
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE difficulty >= ? AND difficulty <= ? ORDER BY RANDOM() LIMIT 1"
        return self.db.fetch_one(sql, (min_d, max_d))

    def update(self, record_id: int, **kwargs) -> int:
        data = {}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        if not data:
            return 0
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
