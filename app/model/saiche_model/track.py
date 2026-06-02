from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class TrackModel:
    TABLE_NAME = 'tb_saiche_model_tracks'

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
                preview_image TEXT DEFAULT '',
                track_data TEXT DEFAULT '',
                difficulty INTEGER DEFAULT 1,
                laps INTEGER DEFAULT 3,
                length INTEGER DEFAULT 3000,
                reward_coins INTEGER DEFAULT 100,
                reward_exp INTEGER DEFAULT 50,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty ON {cls.TABLE_NAME}(difficulty)"
        db.execute(index_sql)

    @classmethod
    def init_default_tracks(cls):
        model = cls()
        existing = model.query.count()
        if existing == 0:
            default_tracks = [
                {
                    'name': '城市赛道',
                    'description': '经典城市道路，适合新手练习',
                    'preview_image': '',
                    'track_data': json.dumps({
                        'width': 120,
                        'checkpoints': [
                            {'x': 400, 'y': 300},
                            {'x': 700, 'y': 300},
                            {'x': 700, 'y': 500},
                            {'x': 400, 'y': 500},
                            {'x': 100, 'y': 500},
                            {'x': 100, 'y': 300}
                        ]
                    }),
                    'difficulty': 1,
                    'laps': 3,
                    'length': 2500,
                    'reward_coins': 100,
                    'reward_exp': 50,
                    'is_active': 1
                },
                {
                    'name': '沙漠赛道',
                    'description': '黄沙漫天的沙漠赛道，弯道更多',
                    'preview_image': '',
                    'track_data': json.dumps({
                        'width': 100,
                        'checkpoints': [
                            {'x': 400, 'y': 200},
                            {'x': 650, 'y': 250},
                            {'x': 750, 'y': 400},
                            {'x': 650, 'y': 550},
                            {'x': 400, 'y': 600},
                            {'x': 150, 'y': 550},
                            {'x': 50, 'y': 400},
                            {'x': 150, 'y': 250}
                        ]
                    }),
                    'difficulty': 2,
                    'laps': 3,
                    'length': 3500,
                    'reward_coins': 150,
                    'reward_exp': 80,
                    'is_active': 1
                },
                {
                    'name': '雪山赛道',
                    'description': '冰雪覆盖的赛道，路面更滑',
                    'preview_image': '',
                    'track_data': json.dumps({
                        'width': 110,
                        'checkpoints': [
                            {'x': 400, 'y': 150},
                            {'x': 600, 'y': 200},
                            {'x': 750, 'y': 350},
                            {'x': 750, 'y': 500},
                            {'x': 600, 'y': 600},
                            {'x': 400, 'y': 650},
                            {'x': 200, 'y': 600},
                            {'x': 50, 'y': 500},
                            {'x': 50, 'y': 350},
                            {'x': 200, 'y': 200}
                        ]
                    }),
                    'difficulty': 3,
                    'laps': 3,
                    'length': 4200,
                    'reward_coins': 200,
                    'reward_exp': 120,
                    'is_active': 1
                },
                {
                    'name': '火山赛道',
                    'description': '极限挑战，高难度弯道',
                    'preview_image': '',
                    'track_data': json.dumps({
                        'width': 90,
                        'checkpoints': [
                            {'x': 400, 'y': 100},
                            {'x': 550, 'y': 150},
                            {'x': 700, 'y': 250},
                            {'x': 780, 'y': 400},
                            {'x': 700, 'y': 550},
                            {'x': 550, 'y': 650},
                            {'x': 400, 'y': 700},
                            {'x': 250, 'y': 650},
                            {'x': 100, 'y': 550},
                            {'x': 20, 'y': 400},
                            {'x': 100, 'y': 250},
                            {'x': 250, 'y': 150}
                        ]
                    }),
                    'difficulty': 4,
                    'laps': 3,
                    'length': 5000,
                    'reward_coins': 300,
                    'reward_exp': 180,
                    'is_active': 1
                },
                {
                    'name': '星空赛道',
                    'description': '传说中的赛道，只有高手才能征服',
                    'preview_image': '',
                    'track_data': json.dumps({
                        'width': 80,
                        'checkpoints': [
                            {'x': 400, 'y': 80},
                            {'x': 520, 'y': 120},
                            {'x': 650, 'y': 200},
                            {'x': 750, 'y': 320},
                            {'x': 780, 'y': 450},
                            {'x': 720, 'y': 580},
                            {'x': 600, 'y': 670},
                            {'x': 450, 'y': 720},
                            {'x': 300, 'y': 700},
                            {'x': 150, 'y': 620},
                            {'x': 50, 'y': 480},
                            {'x': 20, 'y': 350},
                            {'x': 80, 'y': 220},
                            {'x': 200, 'y': 130}
                        ]
                    }),
                    'difficulty': 5,
                    'laps': 3,
                    'length': 6000,
                    'reward_coins': 500,
                    'reward_exp': 300,
                    'is_active': 1
                }
            ]
            for track in default_tracks:
                track['created_at'] = datetime.now().isoformat()
                model.exec.insert(track)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        if isinstance(data.get('track_data'), dict):
            data['track_data'] = json.dumps(data['track_data'])
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        track = self.query.find_by_id(record_id)
        if track and track.get('track_data'):
            try:
                track['track_data'] = json.loads(track['track_data'])
            except:
                pass
        return track

    def get_all(self, page: int = 1, page_size: int = 10, is_active: int = None,
                difficulty: int = None) -> Dict[str, Any]:
        conditions = {}
        if is_active is not None:
            conditions['is_active'] = is_active
        if difficulty is not None:
            conditions['difficulty'] = difficulty

        result = self.query.paginate(page, page_size, conditions, order_by='difficulty ASC, id ASC')

        for item in result.get('items', []):
            if item.get('track_data'):
                try:
                    item['track_data'] = json.loads(item['track_data'])
                except:
                    pass

        return result

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'preview_image', 'track_data',
            'difficulty', 'laps', 'length', 'reward_coins', 'reward_exp', 'is_active'
        ]}
        if isinstance(update_data.get('track_data'), dict):
            update_data['track_data'] = json.dumps(update_data['track_data'])
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_difficulty_text(self, difficulty: int) -> str:
        diff_map = {
            1: '简单',
            2: '普通',
            3: '困难',
            4: '专家',
            5: '大师'
        }
        return diff_map.get(difficulty, '未知')

    def to_public_dict(self, track: Dict[str, Any]) -> Dict[str, Any]:
        track_data = track.get('track_data')
        if isinstance(track_data, str):
            try:
                track_data = json.loads(track_data)
            except:
                track_data = None

        return {
            'id': track.get('id'),
            'name': track.get('name'),
            'description': track.get('description'),
            'preview_image': track.get('preview_image'),
            'track_data': track_data,
            'difficulty': track.get('difficulty'),
            'difficulty_text': self.get_difficulty_text(track.get('difficulty', 1)),
            'laps': track.get('laps'),
            'length': track.get('length'),
            'reward_coins': track.get('reward_coins'),
            'reward_exp': track.get('reward_exp'),
            'is_active': track.get('is_active'),
            'created_at': track.get('created_at')
        }

    def get_best_records(self, track_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT r.finish_time, r.best_lap, r.created_at,
                   u.nickname, u.avatar
            FROM tb_saiche_model_race_records r
            LEFT JOIN tb_saiche_model_users u ON r.user_id = u.id
            WHERE r.track_id = ? AND u.status = 0
            ORDER BY r.finish_time ASC
            LIMIT {limit}
        """
        return self.db.fetch_all(sql, (track_id,))
