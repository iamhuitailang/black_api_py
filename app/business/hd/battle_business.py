from typing import Dict, Any, Optional
from app.model.hd_model import BattleModel, UserModel, UserMissionModel


class HdBattleBusiness:
    def __init__(self):
        self.battle_model = BattleModel()
        self.user_model = UserModel()
        self.user_mission_model = UserMissionModel()

    def start_battle(self, player1_id: int, player2_id: int, battle_type: int) -> Dict[str, Any]:
        player1 = self.user_model.get_by_id(player1_id)
        if not player1:
            return {
                'code': 1,
                'msg': '玩家1不存在',
                'data': None
            }

        player2 = self.user_model.get_by_id(player2_id)
        if not player2:
            return {
                'code': 1,
                'msg': '玩家2不存在',
                'data': None
            }

        result = self.battle_model.start_battle(player1_id, player2_id, battle_type)

        self.user_mission_model.update_progress(player1_id, 'battle', 1)
        self.user_mission_model.update_progress(player2_id, 'battle', 1)

        return {
            'code': 0,
            'msg': '对战开始',
            'data': self.battle_model.to_dict(result)
        }

    def end_battle(self, battle_id: int, winner_id: int,
                   player1_score: int, player2_score: int,
                   duration: int) -> Dict[str, Any]:
        battle = self.battle_model.get_by_id(battle_id)
        if not battle:
            return {
                'code': 1,
                'msg': '对战记录不存在',
                'data': None
            }

        if battle.get('is_finished') == 1:
            return {
                'code': 1,
                'msg': '对战已结束',
                'data': None
            }

        result = self.battle_model.end_battle(
            battle_id, winner_id, player1_score, player2_score, duration
        )

        if not result:
            return {
                'code': 1,
                'msg': '结束对战失败',
                'data': None
            }

        self.user_mission_model.update_progress(winner_id, 'win', 1)

        return {
            'code': 0,
            'msg': '对战结束',
            'data': self.battle_model.to_dict(result)
        }

    def get_user_battles(self, user_id: int, battle_type: Optional[int] = None,
                          page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        result = self.battle_model.get_user_battles(
            user_id, page, page_size, battle_type, is_finished=1)

        items = []
        for battle in result.get('items', []):
            battle_data = self.battle_model.to_dict(battle)

            opponent_id = battle.get('player2_id') if battle.get('player1_id') == user_id else battle.get('player1_id')
            opponent = self.user_model.get_by_id(opponent_id)
            if opponent:
                battle_data['opponent'] = {
                    'id': opponent.get('id'),
                    'nickname': opponent.get('nickname'),
                    'avatar': opponent.get('avatar'),
                    'level': opponent.get('level')
                }

            is_winner = battle.get('winner_id') == user_id
            battle_data['is_winner'] = is_winner
            battle_data['my_score'] = battle.get('player1_score') if battle.get('player1_id') == user_id else battle.get('player2_score')
            battle_data['opponent_score'] = battle.get('player2_score') if battle.get('player1_id') == user_id else battle.get('player1_score')

            items.append(battle_data)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        stats = self.battle_model.get_user_stats(user_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }

    def get_ranking_list(self, battle_type: Optional[int] = None,
                          page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        from app.common.sqlite.db import get_db

        where_clauses = ["b.is_finished = 1"]
        params = []

        if battle_type is not None:
            where_clauses.append("b.battle_type = ?")
            params.append(battle_type)

        db = get_db()

        count_sql = f"""
            SELECT COUNT(DISTINCT user_id) as total
            FROM (
                SELECT player1_id as user_id FROM {self.battle_model.TABLE_NAME} b WHERE {' AND '.join(where_clauses)}
                UNION
                SELECT player2_id as user_id FROM {self.battle_model.TABLE_NAME} b WHERE {' AND '.join(where_clauses)}
            ) AS unique_users
        """

        count_result = db.fetch_one(count_sql, tuple(params + params))
        total = count_result.get('total', 0) if count_result else 0

        offset = (page - 1) * page_size

        ranking_sql = f"""
            SELECT 
                user_id,
                COUNT(*) as total_battles,
                SUM(CASE WHEN winner_id = user_id THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN winner_id != user_id AND winner_id IS NOT NULL THEN 1 ELSE 0 END) as losses,
                ROUND(
                    CASE WHEN COUNT(*) > 0 
                    THEN SUM(CASE WHEN winner_id = user_id THEN 1 ELSE 0 END) * 100.0 / COUNT(*) 
                    ELSE 0 END, 2
                ) as win_rate
            FROM (
                SELECT player1_id as user_id, winner_id FROM {self.battle_model.TABLE_NAME} b WHERE {' AND '.join(where_clauses)}
                UNION ALL
                SELECT player2_id as user_id, winner_id FROM {self.battle_model.TABLE_NAME} b WHERE {' AND '.join(where_clauses)}
            ) AS user_battles
            GROUP BY user_id
            ORDER BY win_rate DESC, wins DESC, total_battles DESC
            LIMIT {page_size} OFFSET {offset}
        """

        ranking_data = db.fetch_all(ranking_sql, tuple(params + params))

        items = []
        for rank, item in enumerate(ranking_data, start=offset + 1):
            user_id = item.get('user_id')
            user = self.user_model.get_by_id(user_id)
            if user:
                items.append({
                    'rank': rank,
                    'user_id': user_id,
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar'),
                    'level': user.get('level'),
                    'total_battles': item.get('total_battles', 0),
                    'wins': item.get('wins', 0),
                    'losses': item.get('losses', 0),
                    'win_rate': item.get('win_rate', 0)
                })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }
        }

    def create_battle(self, data: Dict[str, Any]) -> Dict[str, Any]:
        required_fields = ['player1_id', 'player2_id', 'battle_type']
        for field in required_fields:
            if field not in data:
                return {
                    'code': 1,
                    'msg': f'缺少必要参数: {field}',
                    'data': None
                }

        battle_id = self.battle_model.create(
            player1_id=data['player1_id'],
            player2_id=data['player2_id'],
            battle_type=data['battle_type']
        )

        if battle_id > 0:
            battle = self.battle_model.get_by_id(battle_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.battle_model.to_dict(battle)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }
