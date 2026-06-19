from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MissionTemplateModel:
    TABLE_NAME = 'tb_game_mission_template'

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
                mission_type TEXT NOT NULL DEFAULT 'combat',
                faction TEXT NOT NULL DEFAULT 'neutral',
                target_faction TEXT DEFAULT '',
                difficulty INTEGER NOT NULL DEFAULT 1,
                min_reputation INTEGER NOT NULL DEFAULT 0,
                reward_credits INTEGER NOT NULL DEFAULT 100,
                reputation_military INTEGER NOT NULL DEFAULT 0,
                reputation_pirate INTEGER NOT NULL DEFAULT 0,
                bounty_pirate INTEGER NOT NULL DEFAULT 0,
                enemy_count INTEGER NOT NULL DEFAULT 1,
                enemy_difficulty INTEGER NOT NULL DEFAULT 1,
                item_reward_id INTEGER,
                item_reward_quantity INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

    @classmethod
    def seed_data(cls):
        model = cls()
        if model.query.count() > 0:
            return
        missions = [
            {'name': '护送商队', 'description': '一艘商船需要通过海盗出没的区域，护送至目的地。',
             'mission_type': 'escort', 'faction': 'corporate', 'target_faction': 'pirate',
             'difficulty': 1, 'min_reputation': 0, 'reward_credits': 300,
             'reputation_military': 5, 'reputation_pirate': -5, 'bounty_pirate': 50,
             'enemy_count': 2, 'enemy_difficulty': 1},
            {'name': '清剿海盗侦察队', 'description': '海盗侦察队在附近骚扰商船，消灭他们。',
             'mission_type': 'combat', 'faction': 'military', 'target_faction': 'pirate',
             'difficulty': 1, 'min_reputation': 0, 'reward_credits': 250,
             'reputation_military': 8, 'reputation_pirate': -10, 'bounty_pirate': 80,
             'enemy_count': 2, 'enemy_difficulty': 1},
            {'name': '夺回失窃科技', 'description': '企业被抢走的核心科技在海盗手里，夺回来！',
             'mission_type': 'recovery', 'faction': 'corporate', 'target_faction': 'pirate',
             'difficulty': 2, 'min_reputation': 0, 'reward_credits': 600,
             'reputation_military': 5, 'reputation_pirate': -15, 'bounty_pirate': 100,
             'enemy_count': 3, 'enemy_difficulty': 2},
            {'name': '突袭海盗据点', 'description': '军方情报显示有一个海盗前哨站，摧毁它。',
             'mission_type': 'combat', 'faction': 'military', 'target_faction': 'pirate',
             'difficulty': 3, 'min_reputation': 10, 'reward_credits': 1200,
             'reputation_military': 20, 'reputation_pirate': -30, 'bounty_pirate': 250,
             'enemy_count': 4, 'enemy_difficulty': 3},
            {'name': '运送违禁物资', 'description': '客户需要运送一批敏感物资到海盗区。',
             'mission_type': 'smuggle', 'faction': 'pirate', 'target_faction': 'military',
             'difficulty': 2, 'min_reputation': -5, 'reward_credits': 500,
             'reputation_military': -15, 'reputation_pirate': 20, 'bounty_pirate': -50,
             'enemy_count': 2, 'enemy_difficulty': 2},
            {'name': '抢劫商船', 'description': '海盗头目看上了一艘富商的船。',
             'mission_type': 'pirate', 'faction': 'pirate', 'target_faction': 'corporate',
             'difficulty': 2, 'min_reputation': -10, 'reward_credits': 800,
             'reputation_military': -20, 'reputation_pirate': 25, 'bounty_pirate': -100,
             'enemy_count': 2, 'enemy_difficulty': 2},
            {'name': '失控无人机群', 'description': '一群失控的工业无人机在攻击一切移动物体。',
             'mission_type': 'combat', 'faction': 'corporate', 'target_faction': 'rogue',
             'difficulty': 2, 'min_reputation': 0, 'reward_credits': 450,
             'reputation_military': 3, 'reputation_pirate': 0, 'bounty_pirate': 0,
             'enemy_count': 4, 'enemy_difficulty': 1},
            {'name': '未知生物威胁', 'description': '深空异常出现了外星生物，请探查并清除。',
             'mission_type': 'combat', 'faction': 'neutral', 'target_faction': 'alien',
             'difficulty': 4, 'min_reputation': 0, 'reward_credits': 2000,
             'reputation_military': 10, 'reputation_pirate': 0, 'bounty_pirate': 0,
             'enemy_count': 3, 'enemy_difficulty': 4},
            {'name': '海盗旗舰狩猎', 'description': '击杀海盗首领，终结他的恐怖统治。',
             'mission_type': 'boss', 'faction': 'military', 'target_faction': 'pirate',
             'difficulty': 5, 'min_reputation': 30, 'reward_credits': 5000,
             'reputation_military': 50, 'reputation_pirate': -100, 'bounty_pirate': 500,
             'enemy_count': 5, 'enemy_difficulty': 5},
        ]
        for m in missions:
            model.create(**m)

    def create(self, name: str, description: str = '', mission_type: str = 'combat',
               faction: str = 'neutral', target_faction: str = '', difficulty: int = 1,
               min_reputation: int = 0, reward_credits: int = 100,
               reputation_military: int = 0, reputation_pirate: int = 0,
               bounty_pirate: int = 0, enemy_count: int = 1, enemy_difficulty: int = 1,
               item_reward_id: int = None, item_reward_quantity: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'mission_type': mission_type,
            'faction': faction,
            'target_faction': target_faction,
            'difficulty': difficulty,
            'min_reputation': min_reputation,
            'reward_credits': reward_credits,
            'reputation_military': reputation_military,
            'reputation_pirate': reputation_pirate,
            'bounty_pirate': bounty_pirate,
            'enemy_count': enemy_count,
            'enemy_difficulty': enemy_difficulty,
            'item_reward_id': item_reward_id,
            'item_reward_quantity': item_reward_quantity,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='difficulty ASC, id ASC')

    def get_available_for_save(self, save_id: int, planet_faction: str = 'neutral',
                                military_rep: int = 0, pirate_rep: int = 0) -> List[Dict[str, Any]]:
        base_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE min_reputation <= ?
        """
        params = [max(military_rep, pirate_rep, -pirate_rep)]
        rows = self.db.fetch_all(base_sql, tuple(params))
        result = []
        for m in rows:
            if m['faction'] == 'military' and pirate_rep < m['min_reputation'] * -1:
                if military_rep >= m['min_reputation']:
                    result.append(m)
            elif m['faction'] == 'pirate' and military_rep < m['min_reputation'] * -1:
                if pirate_rep >= abs(m['min_reputation']):
                    result.append(m)
            elif m['faction'] in ('neutral', 'corporate'):
                result.append(m)
            elif m['faction'] == planet_faction:
                result.append(m)
        result.sort(key=lambda x: x['difficulty'])
        return result

    def get_by_faction(self, faction: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'faction': faction}, order_by='difficulty ASC')

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
