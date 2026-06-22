from typing import Dict, Any, List
from app.model.game import GameRecordModel


class GameBusiness:
    def __init__(self):
        self.model = GameRecordModel()

    def submit_score(self, player_name: str, score: int, towers_destroyed: int,
                     stage1_destroyed: int, stage2_destroyed: int, stage3_destroyed: int,
                     remaining_hp: int, stages_cleared: int) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            player_name = '匿名玩家'

        player_name = player_name.strip()[:20]

        if score < 0:
            score = 0
        if towers_destroyed < 0:
            towers_destroyed = 0
        if remaining_hp < 0:
            remaining_hp = 0
        if stages_cleared < 0:
            stages_cleared = 0
        if stages_cleared > 3:
            stages_cleared = 3

        new_id = self.model.create(
            player_name, score, towers_destroyed,
            stage1_destroyed, stage2_destroyed, stage3_destroyed,
            remaining_hp, stages_cleared
        )

        record = self.model.get_by_id(new_id)
        rank = self._calculate_rank(score, towers_destroyed, remaining_hp)

        return {
            'code': 0,
            'message': '提交成功',
            'data': {
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'score': record.get('score'),
                'towers_destroyed': record.get('towers_destroyed'),
                'stage1_destroyed': record.get('stage1_destroyed'),
                'stage2_destroyed': record.get('stage2_destroyed'),
                'stage3_destroyed': record.get('stage3_destroyed'),
                'remaining_hp': record.get('remaining_hp'),
                'stages_cleared': record.get('stages_cleared'),
                'rank': rank,
                'created_at': record.get('created_at')
            }
        }

    def _calculate_rank(self, score: int, towers_destroyed: int, remaining_hp: int) -> int:
        all_records = self.model.get_leaderboard(limit=1000)
        rank = 1
        for record in all_records:
            if (record['score'] > score or
                (record['score'] == score and record['towers_destroyed'] > towers_destroyed) or
                (record['score'] == score and record['towers_destroyed'] == towers_destroyed and record['remaining_hp'] > remaining_hp)):
                rank += 1
        return rank

    def get_leaderboard(self, limit: int = 50) -> Dict[str, Any]:
        if limit < 1:
            limit = 10
        if limit > 200:
            limit = 200

        records = self.model.get_leaderboard(limit=limit)

        leaderboard = []
        for i, record in enumerate(records):
            leaderboard.append({
                'rank': i + 1,
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'score': record.get('score'),
                'towers_destroyed': record.get('towers_destroyed'),
                'stage1_destroyed': record.get('stage1_destroyed'),
                'stage2_destroyed': record.get('stage2_destroyed'),
                'stage3_destroyed': record.get('stage3_destroyed'),
                'remaining_hp': record.get('remaining_hp'),
                'stages_cleared': record.get('stages_cleared'),
                'created_at': record.get('created_at')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': leaderboard,
                'total': self.model.count()
            }
        }

    def get_top_10(self) -> Dict[str, Any]:
        return self.get_leaderboard(limit=10)
