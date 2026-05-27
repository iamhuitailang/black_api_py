from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class LevelModel:
    TABLE_NAME = 'tb_renlei_model_level'
    
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
                description TEXT,
                level_type TEXT,
                difficulty INTEGER DEFAULT 1,
                theme TEXT,
                start_position TEXT,
                end_position TEXT,
                obstacles TEXT,
                is_active INTEGER DEFAULT 1,
                order_num INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        cls.init_default_levels(db)

    @classmethod
    def init_default_levels(cls, db):
        existing = db.fetch_one(f"SELECT COUNT(*) as count FROM {cls.TABLE_NAME}")
        if existing and existing['count'] > 0:
            return

        levels = [
            (
                '旋转气球舞台',
                '躲避旋转气球障碍，借力气球弹跳前行',
                'balloon',
                1,
                'circus',
                json.dumps({'x': 100, 'y': 400}),
                json.dumps({'x': 1100, 'y': 400}),
                json.dumps([
                    {'type': 'balloon', 'x': 300, 'y': 300, 'radius': 50, 'rotationSpeed': 2},
                    {'type': 'balloon', 'x': 500, 'y': 250, 'radius': 60, 'rotationSpeed': -1.5},
                    {'type': 'balloon', 'x': 700, 'y': 350, 'radius': 45, 'rotationSpeed': 2.5},
                    {'type': 'balloon', 'x': 900, 'y': 280, 'radius': 55, 'rotationSpeed': -2}
                ]),
                1,
                1
            ),
            (
                '摇摆吊桥马戏',
                '行走晃动吊桥，极易失衡摔倒',
                'bridge',
                2,
                'circus',
                json.dumps({'x': 100, 'y': 350}),
                json.dumps({'x': 1100, 'y': 350}),
                json.dumps([
                    {'type': 'bridge', 'x': 300, 'y': 400, 'width': 200, 'height': 20, 'swingAmount': 30},
                    {'type': 'bridge', 'x': 600, 'y': 380, 'width': 150, 'height': 20, 'swingAmount': 40},
                    {'type': 'bridge', 'x': 850, 'y': 420, 'width': 180, 'height': 20, 'swingAmount': 35}
                ]),
                1,
                2
            ),
            (
                '小丑弹跳乐园',
                '多层弹力蹦床，把控落点闯关',
                'trampoline',
                3,
                'circus',
                json.dumps({'x': 100, 'y': 450}),
                json.dumps({'x': 1100, 'y': 150}),
                json.dumps([
                    {'type': 'trampoline', 'x': 250, 'y': 480, 'width': 100, 'height': 20, 'bounceForce': 15},
                    {'type': 'trampoline', 'x': 450, 'y': 400, 'width': 80, 'height': 20, 'bounceForce': 18},
                    {'type': 'trampoline', 'x': 650, 'y': 300, 'width': 90, 'height': 20, 'bounceForce': 16},
                    {'type': 'trampoline', 'x': 850, 'y': 200, 'width': 100, 'height': 20, 'bounceForce': 14}
                ]),
                1,
                3
            ),
            (
                '高空钢丝巡演',
                '窄道行走，重心极易偏移坠落',
                'tightrope',
                4,
                'circus',
                json.dumps({'x': 100, 'y': 200}),
                json.dumps({'x': 1100, 'y': 200}),
                json.dumps([
                    {'type': 'rope', 'x': 200, 'y': 200, 'width': 300, 'height': 10, 'windForce': 5},
                    {'type': 'rope', 'x': 600, 'y': 200, 'width': 350, 'height': 10, 'windForce': 7}
                ]),
                1,
                4
            )
        ]

        now = datetime.now().isoformat()
        for level in levels:
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (name, description, level_type, difficulty, theme, start_position, end_position, obstacles, is_active, order_num, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                level + (now,)
            )

    def create(self, name: str, description: str = None, level_type: str = None,
               difficulty: int = 1, theme: str = None, start_position: dict = None,
               end_position: dict = None, obstacles: list = None, is_active: bool = True,
               order_num: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'level_type': level_type,
            'difficulty': difficulty,
            'theme': theme,
            'start_position': json.dumps(start_position) if start_position else None,
            'end_position': json.dumps(end_position) if end_position else None,
            'obstacles': json.dumps(obstacles) if obstacles else None,
            'is_active': 1 if is_active else 0,
            'order_num': order_num,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        level = self.query.find_by_id(record_id)
        if level:
            level['start_position'] = json.loads(level['start_position']) if level.get('start_position') else None
            level['end_position'] = json.loads(level['end_position']) if level.get('end_position') else None
            level['obstacles'] = json.loads(level['obstacles']) if level.get('obstacles') else None
        return level

    def get_all(self, only_active: bool = True) -> List[Dict[str, Any]]:
        condition = {'is_active': 1} if only_active else None
        levels = self.query.find_all(condition, order_by='order_num ASC')
        for level in levels:
            level['start_position'] = json.loads(level['start_position']) if level.get('start_position') else None
            level['end_position'] = json.loads(level['end_position']) if level.get('end_position') else None
            level['obstacles'] = json.loads(level['obstacles']) if level.get('obstacles') else None
        return levels

    def update(self, record_id: int, **kwargs) -> int:
        if 'start_position' in kwargs and kwargs['start_position']:
            kwargs['start_position'] = json.dumps(kwargs['start_position'])
        if 'end_position' in kwargs and kwargs['end_position']:
            kwargs['end_position'] = json.dumps(kwargs['end_position'])
        if 'obstacles' in kwargs and kwargs['obstacles']:
            kwargs['obstacles'] = json.dumps(kwargs['obstacles'])
        return self.exec.update_by_id(record_id, kwargs)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
