from typing import Dict, Any, List
from app.model.prismgame import ScoreboardModel, SolutionModel


class ScoreboardBusiness:
    def __init__(self):
        self.scoreboard_model = ScoreboardModel()
        self.solution_model = SolutionModel()

    def get_top_scores(self, limit: int = 10) -> Dict[str, Any]:
        scores = self.scoreboard_model.get_top_scores(limit)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': scores,
                'total': len(scores)
            }
        }

    def get_player_rank(self, player_name: str) -> Dict[str, Any]:
        player = self.scoreboard_model.get_by_player_name(player_name)
        if not player:
            return {
                'code': 1,
                'message': f'Player {player_name} not found',
                'data': None
            }

        all_scores = self.scoreboard_model.get_top_scores(1000)
        rank = 0
        for i, s in enumerate(all_scores):
            if s['player_name'] == player_name:
                rank = i + 1
                break

        return {
            'code': 0,
            'message': 'success',
            'data': {
                **player,
                'rank': rank
            }
        }

    def add_score(self, player_name: str, score: int, rotations: int,
                  level_cleared: bool = False) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }

        player_name = player_name.strip()
        self.scoreboard_model.update_score(player_name, score, rotations, level_cleared)

        updated = self.scoreboard_model.get_by_player_name(player_name)
        return {
            'code': 0,
            'message': 'success',
            'data': updated
        }

    def get_paginated_scores(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.scoreboard_model.paginate(page, page_size)
        items_with_rank = []
        start_rank = (page - 1) * page_size + 1
        for i, item in enumerate(result['items']):
            item['rank'] = start_rank + i
            items_with_rank.append(item)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': items_with_rank,
                'total': result['total'],
                'page': result['page'],
                'page_size': result['page_size'],
                'total_pages': result['total_pages']
            }
        }

    def recalculate_player_score(self, player_name: str) -> Dict[str, Any]:
        from app.model.prismgame import LevelModel
        level_model = LevelModel()

        solutions = []
        levels = level_model.get_all()
        for level in levels:
            best = self.solution_model.get_best_by_level_and_player(level['id'], player_name)
            if best:
                solutions.append(best)

        total_score = sum(s['score'] for s in solutions)
        total_rotations = sum(s['rotations_used'] for s in solutions)
        best_single = max((s['score'] for s in solutions), default=0)
        levels_cleared = len(solutions)

        existing = self.scoreboard_model.get_by_player_name(player_name)
        if existing:
            data = {
                'total_score': total_score,
                'levels_cleared': levels_cleared,
                'total_rotations': total_rotations,
                'best_single_score': best_single
            }
            self.scoreboard_model.update_score.__wrapped__ if hasattr(self.scoreboard_model.update_score, '__wrapped__') else None
            from app.common.sqlite.orm_exec import ORMExec
            exec_obj = ORMExec(ScoreboardModel.TABLE_NAME)
            exec_obj.update(data, {'player_name': player_name})
        else:
            data = {
                'player_name': player_name,
                'total_score': total_score,
                'levels_cleared': levels_cleared,
                'total_rotations': total_rotations,
                'best_single_score': best_single
            }
            self.scoreboard_model.create(data)

        updated = self.scoreboard_model.get_by_player_name(player_name)
        return {
            'code': 0,
            'message': 'success',
            'data': updated
        }
