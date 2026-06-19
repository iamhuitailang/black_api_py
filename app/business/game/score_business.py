from typing import Dict, Any, List, Optional
from app.model.game import ScoreModel


class ScoreBusiness:
    def __init__(self):
        self.model = ScoreModel()

    def _calculate_grade(self, completion_time: float, damage_taken: int,
                         collectibles: int, max_collectibles: int) -> tuple:
        time_score = max(0, 100 - int(completion_time))
        damage_score = max(0, 50 - damage_taken * 10)
        collect_ratio = collectibles / max(max_collectibles, 1)
        collect_score = int(collect_ratio * 50)
        total = time_score + damage_score + collect_score

        if total >= 160:
            grade = 'S'
        elif total >= 120:
            grade = 'A'
        elif total >= 60:
            grade = 'B'
        else:
            grade = 'C'

        return grade, total

    def submit_score(self, player_name: str, level_id: int, completion_time: float,
                     damage_taken: int, collectibles: int, max_collectibles: int) -> Dict[str, Any]:
        if level_id < 1 or level_id > 10:
            return {'code': 1, 'message': 'Invalid level id', 'data': None}
        if not player_name or not player_name.strip():
            player_name = '剑客'

        grade, score = self._calculate_grade(
            completion_time, damage_taken, collectibles, max_collectibles
        )

        record_id = self.model.create(
            player_name=player_name.strip(),
            level_id=level_id,
            completion_time=completion_time,
            damage_taken=damage_taken,
            collectibles=collectibles,
            max_collectibles=max_collectibles,
            grade=grade,
            score=score
        )

        record = self.model.get_by_id(record_id)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': record.get('id'),
                'grade': grade,
                'score': score,
                'level_id': level_id
            }
        }

    def get_level_scores(self, level_id: int, limit: int = 20) -> Dict[str, Any]:
        if level_id < 1 or level_id > 10:
            return {'code': 1, 'message': 'Invalid level id', 'data': None}

        scores = self.model.get_by_level(level_id, limit)
        best = self.model.get_best_by_level(level_id)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'level_id': level_id,
                'scores': scores,
                'best': best
            }
        }

    def get_ranking(self, limit: int = 20) -> Dict[str, Any]:
        ranking = self.model.get_ranking(limit)
        levels_best = self.model.get_all_levels_best()

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'ranking': ranking,
                'levels_best': levels_best
            }
        }

    def get_player_progress(self, player_name: str) -> Dict[str, Any]:
        if not player_name:
            return {'code': 1, 'message': 'Player name required', 'data': None}

        grades = self.model.get_level_grades(player_name)
        unlocked = 1
        if grades:
            max_cleared = max(g.get('level_id', 0) for g in grades)
            unlocked = min(max_cleared + 1, 10)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'player_name': player_name,
                'grades': grades,
                'unlocked_level': unlocked
            }
        }
