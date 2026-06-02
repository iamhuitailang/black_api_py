from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AiModel:
    TABLE_NAME = 'tb_majiang_model_ai'

    DIFFICULTY_EASY = 1
    DIFFICULTY_MEDIUM = 2
    DIFFICULTY_HARD = 3

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
                avatar TEXT DEFAULT '',
                difficulty INTEGER NOT NULL,
                description TEXT DEFAULT '',
                think_time INTEGER DEFAULT 1000,
                risk_tolerance REAL DEFAULT 0.5,
                win_rate REAL DEFAULT 0,
                total_games INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty ON {cls.TABLE_NAME}(difficulty)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)

    @classmethod
    def init_default_ai(cls):
        model = cls()
        default_ais = [
            {'name': '新手小雀', 'difficulty': 1, 'description': '适合新手练习，出牌比较随意', 'think_time': 500, 'risk_tolerance': 0.3},
            {'name': '普通玩家', 'difficulty': 2, 'description': '有一定的麻将基础，会做简单牌型', 'think_time': 1000, 'risk_tolerance': 0.5},
            {'name': '麻将高手', 'difficulty': 3, 'description': '精通麻将规则，善于计算番数', 'think_time': 1500, 'risk_tolerance': 0.7},
        ]
        for ai_data in default_ais:
            existing = model.get_by_name(ai_data['name'])
            if not existing:
                model.create(**ai_data)

    def create(self, name: str, difficulty: int, description: str = '', avatar: str = '',
               think_time: int = 1000, risk_tolerance: float = 0.5) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'difficulty': difficulty,
            'description': description,
            'avatar': avatar,
            'think_time': think_time,
            'risk_tolerance': risk_tolerance,
            'win_rate': 0,
            'total_games': 0,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def get_by_difficulty(self, difficulty: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'difficulty': difficulty, 'status': 1})

    def get_all_active(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'status': 1}, order_by='difficulty ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'difficulty', 'description', 'avatar', 'think_time', 'risk_tolerance', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_game_result(self, ai_id: int, is_win: bool) -> int:
        ai = self.get_by_id(ai_id)
        if not ai:
            return 0

        total_games = ai.get('total_games', 0) + 1
        wins = int(ai.get('win_rate', 0) * ai.get('total_games', 0)) + (1 if is_win else 0)
        win_rate = wins / total_games if total_games > 0 else 0

        now = datetime.now().isoformat()
        data = {
            'total_games': total_games,
            'win_rate': win_rate,
            'updated_at': now
        }
        return self.exec.update_by_id(ai_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'status': 0, 'updated_at': datetime.now().isoformat()})

    def get_all(self, page: int = 1, page_size: int = 10, difficulty: int = None,
                status: int = None) -> Dict[str, Any]:
        conditions = {}
        if difficulty is not None:
            conditions['difficulty'] = difficulty
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_difficulty_text(self, difficulty: int) -> str:
        diff_map = {
            self.DIFFICULTY_EASY: '简单',
            self.DIFFICULTY_MEDIUM: '中等',
            self.DIFFICULTY_HARD: '困难'
        }
        return diff_map.get(difficulty, '未知')

    def get_status_text(self, status: int) -> str:
        return '启用' if status == 1 else '禁用'

    def to_dict(self, ai: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': ai.get('id'),
            'name': ai.get('name'),
            'avatar': ai.get('avatar'),
            'difficulty': ai.get('difficulty'),
            'difficulty_text': self.get_difficulty_text(ai.get('difficulty')),
            'description': ai.get('description'),
            'think_time': ai.get('think_time'),
            'risk_tolerance': ai.get('risk_tolerance'),
            'win_rate': round(ai.get('win_rate', 0) * 100, 2),
            'total_games': ai.get('total_games'),
            'status': ai.get('status'),
            'status_text': self.get_status_text(ai.get('status')),
            'created_at': ai.get('created_at')
        }
