from typing import Dict, Any, List, Optional
from app.model.skate import ScoreModel


class ScoreBusiness:
    def __init__(self):
        self.score_model = ScoreModel()

    def get_scores(self, track_id: int = None, limit: int = 50) -> Dict[str, Any]:
        if track_id:
            scores = self.score_model.get_by_track(track_id, limit)
        else:
            scores = self.score_model.get_all(limit)
        return {
            'code': 0,
            'message': 'success',
            'data': scores
        }

    def get_top_scores(self, track_id: int = None, limit: int = 10) -> Dict[str, Any]:
        scores = self.score_model.get_top_scores(track_id, limit)
        return {
            'code': 0,
            'message': 'success',
            'data': scores
        }

    def add_score(self, player_name: str, track_id: int, score: int, trick_score: int,
                  time_used: float, crash_count: int) -> Dict[str, Any]:
        score_id = self.score_model.create(
            player_name=player_name,
            track_id=track_id,
            score=score,
            trick_score=trick_score,
            time_used=time_used,
            crash_count=crash_count
        )

        from app.common.sqlite.db import get_db
        db = get_db()
        rank_sql = f"""
            SELECT COUNT(*) + 1 as rank
            FROM {self.score_model.TABLE_NAME}
            WHERE track_id = ? AND score > ?
        """
        rank_result = db.fetch_one(rank_sql, (track_id, score))
        rank = rank_result['rank'] if rank_result else 1

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': score_id,
                'rank': rank
            }
        }

    def delete_score(self, score_id: int) -> Dict[str, Any]:
        rows = self.score_model.delete(score_id)
        return {
            'code': 0,
            'message': 'success',
            'data': {'deleted': rows}
        }
