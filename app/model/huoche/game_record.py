from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameRecordModel:
    TABLE_NAME = 'tb_huoche_game_record'
    
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
                train_id INTEGER NOT NULL,
                route_id INTEGER NOT NULL,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                actual_duration INTEGER,
                scheduled_duration INTEGER,
                distance REAL DEFAULT 0,
                avg_speed REAL DEFAULT 0,
                max_speed REAL DEFAULT 0,
                passengers_transported INTEGER DEFAULT 0,
                cargo_transported REAL DEFAULT 0,
                signal_violations INTEGER DEFAULT 0,
                station_stops INTEGER DEFAULT 0,
                perfect_stops INTEGER DEFAULT 0,
                weather_condition TEXT DEFAULT 'clear',
                breakdowns INTEGER DEFAULT 0,
                passenger_satisfaction REAL DEFAULT 100.0,
                cargo_condition REAL DEFAULT 100.0,
                coins_earned INTEGER DEFAULT 0,
                exp_earned INTEGER DEFAULT 0,
                is_completed INTEGER DEFAULT 0,
                is_perfect INTEGER DEFAULT 0,
                score INTEGER DEFAULT 0,
                grade TEXT DEFAULT 'C',
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES tb_auth_user(id),
                FOREIGN KEY (train_id) REFERENCES tb_huoche_train(id),
                FOREIGN KEY (route_id) REFERENCES tb_huoche_route(id)
            )
        """
        db.execute(sql)
        
        index_sql1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql1)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_train_id ON {cls.TABLE_NAME}(train_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_route_id ON {cls.TABLE_NAME}(route_id)"
        db.execute(index_sql3)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def start_game(self, user_id: int, train_id: int, route_id: int, scheduled_duration: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'train_id': train_id,
            'route_id': route_id,
            'start_time': now,
            'scheduled_duration': scheduled_duration,
            'is_completed': 0,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT gr.*, t.name as train_name, r.name as route_name
            FROM {self.TABLE_NAME} gr
            LEFT JOIN tb_huoche_train t ON gr.train_id = t.id
            LEFT JOIN tb_huoche_route r ON gr.route_id = r.id
            WHERE gr.user_id = ? AND gr.status = 1
            ORDER BY gr.created_at DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (user_id, limit))

    def get_user_best_scores(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT gr.*, t.name as train_name, r.name as route_name
            FROM {self.TABLE_NAME} gr
            LEFT JOIN tb_huoche_train t ON gr.train_id = t.id
            LEFT JOIN tb_huoche_route r ON gr.route_id = r.id
            WHERE gr.user_id = ? AND gr.is_completed = 1 AND gr.status = 1
            ORDER BY gr.score DESC
            LIMIT ?
        """
        return self.db.fetch_all(sql, (user_id, limit))

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def complete_game(self, record_id: int, game_data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        game_data['end_time'] = now
        game_data['is_completed'] = 1
        game_data['updated_at'] = now
        
        score = self._calculate_score(game_data)
        game_data['score'] = score
        game_data['grade'] = self._calculate_grade(score)
        
        return self.exec.update_by_id(record_id, game_data)

    def _calculate_score(self, data: Dict[str, Any]) -> int:
        score = 1000
        
        avg_speed = data.get('avg_speed', 0)
        if avg_speed > 0:
            score += int(avg_speed * 2)
        
        passenger_satisfaction = data.get('passenger_satisfaction', 0)
        score += int(passenger_satisfaction * 3)
        
        cargo_condition = data.get('cargo_condition', 0)
        score += int(cargo_condition * 2)
        
        perfect_stops = data.get('perfect_stops', 0)
        station_stops = data.get('station_stops', 1)
        if station_stops > 0:
            stop_accuracy = perfect_stops / station_stops
            score += int(stop_accuracy * 200)
        
        signal_violations = data.get('signal_violations', 0)
        score -= signal_violations * 50
        
        breakdowns = data.get('breakdowns', 0)
        score -= breakdowns * 100
        
        actual_duration = data.get('actual_duration', 0)
        scheduled_duration = data.get('scheduled_duration', 1)
        if actual_duration > 0 and scheduled_duration > 0:
            time_ratio = actual_duration / scheduled_duration
            if time_ratio <= 1.0:
                score += int((1 - time_ratio) * 300)
            else:
                score -= int((time_ratio - 1) * 200)
        
        return max(0, score)

    def _calculate_grade(self, score: int) -> str:
        if score >= 1800:
            return 'S'
        elif score >= 1500:
            return 'A'
        elif score >= 1200:
            return 'B'
        elif score >= 900:
            return 'C'
        elif score >= 600:
            return 'D'
        else:
            return 'F'

    def delete(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'status': 0})
