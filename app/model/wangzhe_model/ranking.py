from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RankingModel:
    TABLE_NAME = 'tb_wangzhe_model_rankings'

    TYPE_ALL = 'all'
    TYPE_WARRIOR = 'warrior'
    TYPE_MAGE = 'mage'
    TYPE_ARCHER = 'archer'
    TYPE_TANK = 'tank'
    TYPE_ASSASSIN = 'assassin'
    TYPE_SUPPORT = 'support'

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
                ranking_type TEXT DEFAULT 'all',
                hero_id INTEGER DEFAULT NULL,
                points INTEGER DEFAULT 1000,
                rank INTEGER DEFAULT 0,
                wins INTEGER DEFAULT 0,
                losses INTEGER DEFAULT 0,
                streak INTEGER DEFAULT 0,
                best_streak INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(ranking_type)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_points ON {cls.TABLE_NAME}(points DESC)"
        db.execute(index_sql3)

    def create(self, user_id: int, ranking_type: str = 'all', hero_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'ranking_type': ranking_type,
            'hero_id': hero_id,
            'points': 1000,
            'rank': 0,
            'wins': 0,
            'losses': 0,
            'streak': 0,
            'best_streak': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_and_type(self, user_id: int, ranking_type: str = 'all', 
                             hero_id: int = None) -> Optional[Dict[str, Any]]:
        conditions = {'user_id': user_id, 'ranking_type': ranking_type}
        if hero_id:
            conditions['hero_id'] = hero_id
        return self.query.find_one(conditions)

    def update_rank(self, user_id: int, win: bool, points_delta: int, 
                    ranking_type: str = 'all', hero_id: int = None) -> int:
        record = self.get_by_user_and_type(user_id, ranking_type, hero_id)
        if not record:
            self.create(user_id, ranking_type, hero_id)
            record = self.get_by_user_and_type(user_id, ranking_type, hero_id)

        now = datetime.now().isoformat()
        new_points = max(0, record.get('points', 1000) + points_delta)
        new_wins = record.get('wins', 0) + (1 if win else 0)
        new_losses = record.get('losses', 0) + (0 if win else 1)
        new_streak = record.get('streak', 0) + 1 if win else 0
        new_best_streak = max(record.get('best_streak', 0), new_streak)

        data = {
            'points': new_points,
            'wins': new_wins,
            'losses': new_losses,
            'streak': new_streak,
            'best_streak': new_best_streak,
            'updated_at': now
        }
        return self.exec.update_by_id(record.get('id'), data)

    def get_ranking(self, ranking_type: str = 'all', page: int = 1, 
                    page_size: int = 100) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        conditions = {'ranking_type': ranking_type}
        if ranking_type == 'all':
            conditions['hero_id'] = None

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE ranking_type = ?"
        params = [ranking_type]
        if ranking_type == 'all':
            count_sql += " AND hero_id IS NULL"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT r.*, u.nickname, u.avatar, u.level 
            FROM {self.TABLE_NAME} r
            INNER JOIN tb_wangzhe_model_users u ON r.user_id = u.id
            WHERE r.ranking_type = ?
        """
        if ranking_type == 'all':
            select_sql += " AND r.hero_id IS NULL"
        select_sql += " ORDER BY r.points DESC, r.wins DESC LIMIT ? OFFSET ?"
        params.extend([page_size, offset])

        items = self.db.fetch_all(select_sql, tuple(params))

        ranked_items = []
        for i, item in enumerate(items):
            item_dict = dict(item)
            item_dict['rank'] = offset + i + 1
            item_dict['win_rate'] = round(item.get('wins', 0) / max(1, item.get('wins', 0) + item.get('losses', 0)) * 100, 2)
            ranked_items.append(item_dict)

        return {
            'items': ranked_items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_user_rank_position(self, user_id: int, ranking_type: str = 'all') -> Optional[int]:
        sql = f"""
            SELECT COUNT(*) as rank FROM {self.TABLE_NAME} 
            WHERE ranking_type = ? AND (points > 
                (SELECT points FROM {self.TABLE_NAME} WHERE user_id = ? AND ranking_type = ? 
                {'AND hero_id IS NULL' if ranking_type == 'all' else ''})
            OR id <= 
                (SELECT id FROM {self.TABLE_NAME} WHERE user_id = ? AND ranking_type = ? 
                {'AND hero_id IS NULL' if ranking_type == 'all' else ''}))
        """
        params = [ranking_type, user_id, ranking_type, user_id, ranking_type]
        result = self.db.fetch_one(sql, tuple(params))
        return result['rank'] if result else None

    def get_tier(self, points: int) -> Dict[str, Any]:
        tiers = [
            {'name': '青铜', 'min': 0, 'max': 999, 'color': '#CD7F32'},
            {'name': '白银', 'min': 1000, 'max': 1249, 'color': '#C0C0C0'},
            {'name': '黄金', 'min': 1250, 'max': 1499, 'color': '#FFD700'},
            {'name': '铂金', 'min': 1500, 'max': 1749, 'color': '#00BFFF'},
            {'name': '钻石', 'min': 1750, 'max': 1999, 'color': '#B9F2FF'},
            {'name': '星耀', 'min': 2000, 'max': 2499, 'color': '#9400D3'},
            {'name': '王者', 'min': 2500, 'max': 2999, 'color': '#FF4500'},
            {'name': '荣耀王者', 'min': 3000, 'max': 9999, 'color': '#FF0000'},
        ]

        for tier in tiers:
            if tier['min'] <= points <= tier['max']:
                return tier

        return tiers[0]

    def to_public_dict(self, ranking: Dict[str, Any]) -> Dict[str, Any]:
        points = ranking.get('points', 1000)
        tier = self.get_tier(points)

        return {
            'id': ranking.get('id'),
            'user_id': ranking.get('user_id'),
            'nickname': ranking.get('nickname'),
            'avatar': ranking.get('avatar'),
            'level': ranking.get('level'),
            'ranking_type': ranking.get('ranking_type'),
            'hero_id': ranking.get('hero_id'),
            'points': points,
            'rank': ranking.get('rank'),
            'tier_name': tier['name'],
            'tier_color': tier['color'],
            'wins': ranking.get('wins'),
            'losses': ranking.get('losses'),
            'win_rate': ranking.get('win_rate'),
            'streak': ranking.get('streak'),
            'best_streak': ranking.get('best_streak'),
            'created_at': ranking.get('created_at')
        }
