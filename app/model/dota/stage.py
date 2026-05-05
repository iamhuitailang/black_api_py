from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DotaStageModel:
    TABLE_NAME = 'tb_dota_stages'

    TYPE_MINION = 'minion'
    TYPE_ELITE = 'elite'
    TYPE_BOSS = 'boss'

    TYPE_NAMES = {
        TYPE_MINION: '小兵关',
        TYPE_ELITE: '精英关',
        TYPE_BOSS: 'BOSS关'
    }

    DIFFICULTY_EASY = 'easy'
    DIFFICULTY_NORMAL = 'normal'
    DIFFICULTY_HARD = 'hard'

    DIFFICULTY_NAMES = {
        DIFFICULTY_EASY: '简单',
        DIFFICULTY_NORMAL: '中等',
        DIFFICULTY_HARD: '困难'
    }

    DEFAULT_STAGES = [
        {'id': 101, 'chapter': 1, 'stage_num': 1, 'name': '1-1', 'stage_type': TYPE_MINION, 'difficulty': DIFFICULTY_EASY, 'enemy_count': 3, 'enemy_level': 1, 'gold_reward': 50, 'exp_reward': 30, 'description': '小兵 ×3'},
        {'id': 102, 'chapter': 1, 'stage_num': 2, 'name': '1-2', 'stage_type': TYPE_MINION, 'difficulty': DIFFICULTY_EASY, 'enemy_count': 4, 'enemy_level': 1, 'gold_reward': 60, 'exp_reward': 40, 'description': '小兵 ×4'},
        {'id': 103, 'chapter': 1, 'stage_num': 3, 'name': '1-3', 'stage_type': TYPE_MINION, 'difficulty': DIFFICULTY_EASY, 'enemy_count': 5, 'enemy_level': 2, 'gold_reward': 80, 'exp_reward': 50, 'description': '小兵 ×5'},
        {'id': 104, 'chapter': 1, 'stage_num': 4, 'name': '1-4', 'stage_type': TYPE_MINION, 'difficulty': DIFFICULTY_NORMAL, 'enemy_count': 5, 'enemy_level': 2, 'gold_reward': 100, 'exp_reward': 60, 'description': '小兵 ×5'},
        {'id': 105, 'chapter': 1, 'stage_num': 5, 'name': '1-5', 'stage_type': TYPE_ELITE, 'difficulty': DIFFICULTY_NORMAL, 'enemy_count': 1, 'enemy_level': 3, 'gold_reward': 200, 'exp_reward': 100, 'description': '巨魔精英'},
        {'id': 106, 'chapter': 1, 'stage_num': 6, 'name': '1-6', 'stage_type': TYPE_MINION, 'difficulty': DIFFICULTY_NORMAL, 'enemy_count': 5, 'enemy_level': 3, 'gold_reward': 120, 'exp_reward': 70, 'description': '小兵 ×5'},
        {'id': 107, 'chapter': 1, 'stage_num': 7, 'name': '1-7', 'stage_type': TYPE_MINION, 'difficulty': DIFFICULTY_NORMAL, 'enemy_count': 5, 'enemy_level': 4, 'gold_reward': 140, 'exp_reward': 80, 'description': '小兵 ×5'},
        {'id': 108, 'chapter': 1, 'stage_num': 8, 'name': '1-8', 'stage_type': TYPE_MINION, 'difficulty': DIFFICULTY_HARD, 'enemy_count': 6, 'enemy_level': 4, 'gold_reward': 160, 'exp_reward': 90, 'description': '小兵 ×6'},
        {'id': 109, 'chapter': 1, 'stage_num': 9, 'name': '1-9', 'stage_type': TYPE_ELITE, 'difficulty': DIFFICULTY_HARD, 'enemy_count': 1, 'enemy_level': 6, 'gold_reward': 300, 'exp_reward': 150, 'description': '精英守卫'},
        {'id': 110, 'chapter': 1, 'stage_num': 10, 'name': '1-10', 'stage_type': TYPE_BOSS, 'difficulty': DIFFICULTY_HARD, 'enemy_count': 1, 'enemy_level': 8, 'gold_reward': 500, 'exp_reward': 250, 'description': '肉山 BOSS'},
        {'id': 201, 'chapter': 2, 'stage_num': 1, 'name': '2-1', 'stage_type': TYPE_MINION, 'difficulty': DIFFICULTY_NORMAL, 'enemy_count': 5, 'enemy_level': 6, 'gold_reward': 150, 'exp_reward': 90, 'description': '小兵 ×5'},
        {'id': 202, 'chapter': 2, 'stage_num': 2, 'name': '2-2', 'stage_type': TYPE_MINION, 'difficulty': DIFFICULTY_NORMAL, 'enemy_count': 6, 'enemy_level': 7, 'gold_reward': 180, 'exp_reward': 110, 'description': '小兵 ×6'},
        {'id': 203, 'chapter': 2, 'stage_num': 3, 'name': '2-3', 'stage_type': TYPE_MINION, 'difficulty': DIFFICULTY_NORMAL, 'enemy_count': 6, 'enemy_level': 7, 'gold_reward': 200, 'exp_reward': 120, 'description': '小兵 ×6'},
        {'id': 204, 'chapter': 2, 'stage_num': 4, 'name': '2-4', 'stage_type': TYPE_MINION, 'difficulty': DIFFICULTY_HARD, 'enemy_count': 6, 'enemy_level': 8, 'gold_reward': 220, 'exp_reward': 130, 'description': '小兵 ×6'},
        {'id': 205, 'chapter': 2, 'stage_num': 5, 'name': '2-5', 'stage_type': TYPE_ELITE, 'difficulty': DIFFICULTY_HARD, 'enemy_count': 1, 'enemy_level': 10, 'gold_reward': 350, 'exp_reward': 180, 'description': '熊战士精英'},
        {'id': 206, 'chapter': 2, 'stage_num': 6, 'name': '2-6', 'stage_type': TYPE_MINION, 'difficulty': DIFFICULTY_HARD, 'enemy_count': 7, 'enemy_level': 9, 'gold_reward': 250, 'exp_reward': 150, 'description': '小兵 ×7'},
        {'id': 207, 'chapter': 2, 'stage_num': 7, 'name': '2-7', 'stage_type': TYPE_MINION, 'difficulty': DIFFICULTY_HARD, 'enemy_count': 7, 'enemy_level': 10, 'gold_reward': 280, 'exp_reward': 170, 'description': '小兵 ×7'},
        {'id': 208, 'chapter': 2, 'stage_num': 8, 'name': '2-8', 'stage_type': TYPE_MINION, 'difficulty': DIFFICULTY_HARD, 'enemy_count': 8, 'enemy_level': 10, 'gold_reward': 300, 'exp_reward': 180, 'description': '小兵 ×8'},
        {'id': 209, 'chapter': 2, 'stage_num': 9, 'name': '2-9', 'stage_type': TYPE_ELITE, 'difficulty': DIFFICULTY_HARD, 'enemy_count': 1, 'enemy_level': 12, 'gold_reward': 400, 'exp_reward': 200, 'description': '死灵法师精英'},
        {'id': 210, 'chapter': 2, 'stage_num': 10, 'name': '2-10', 'stage_type': TYPE_BOSS, 'difficulty': DIFFICULTY_HARD, 'enemy_count': 1, 'enemy_level': 15, 'gold_reward': 800, 'exp_reward': 400, 'description': '影魔 BOSS'},
    ]

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY,
                chapter INTEGER NOT NULL,
                stage_num INTEGER NOT NULL,
                name TEXT NOT NULL,
                stage_type TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                enemy_count INTEGER DEFAULT 3,
                enemy_level INTEGER DEFAULT 1,
                gold_reward INTEGER DEFAULT 50,
                exp_reward INTEGER DEFAULT 30,
                description TEXT DEFAULT ''
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_chapter ON {cls.TABLE_NAME}(chapter)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_stage_num ON {cls.TABLE_NAME}(stage_num)"
        db.execute(index_sql2)

    @classmethod
    def init_default_stages(cls):
        model = DotaStageModel()
        for stage in cls.DEFAULT_STAGES:
            existing = model.get_by_id(stage['id'])
            if not existing:
                model.exec.insert(stage)

    def get_by_id(self, stage_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(stage_id)

    def get_by_chapter_stage(self, chapter: int, stage_num: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'chapter': chapter, 'stage_num': stage_num})

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='chapter ASC, stage_num ASC')

    def get_by_chapter(self, chapter: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'chapter': chapter}, order_by='stage_num ASC')

    def get_stage_type_icon(self, stage_type: str) -> str:
        icons = {
            self.TYPE_MINION: '🧟',
            self.TYPE_ELITE: '👹',
            self.TYPE_BOSS: '👾'
        }
        return icons.get(stage_type, '❓')

    def to_dict(self, stage: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': stage.get('id'),
            'chapter': stage.get('chapter'),
            'stage_num': stage.get('stage_num'),
            'name': stage.get('name'),
            'stage_type': stage.get('stage_type'),
            'stage_type_name': self.TYPE_NAMES.get(stage.get('stage_type'), '未知'),
            'stage_type_icon': self.get_stage_type_icon(stage.get('stage_type')),
            'difficulty': stage.get('difficulty'),
            'difficulty_name': self.DIFFICULTY_NAMES.get(stage.get('difficulty'), '未知'),
            'enemy_count': stage.get('enemy_count'),
            'enemy_level': stage.get('enemy_level'),
            'gold_reward': stage.get('gold_reward'),
            'exp_reward': stage.get('exp_reward'),
            'description': stage.get('description')
        }
