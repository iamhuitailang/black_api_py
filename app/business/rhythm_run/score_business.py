from typing import Dict, Any, List, Optional
from app.model.rhythm_run import RhythmRunScoreModel


SONGS = [
    {'id': 'song1', 'name': '夜色初章', 'bpm': 100, 'difficulty': 'Easy'},
    {'id': 'song2', 'name': '霓虹狂奔', 'bpm': 130, 'difficulty': 'Normal'},
    {'id': 'song3', 'name': '极速都市', 'bpm': 160, 'difficulty': 'Hard'}
]


class RhythmRunScoreBusiness:
    def __init__(self):
        self.model = RhythmRunScoreModel()

    def submit_score(self, player_name: str, song: str, score: int, max_combo: int,
                     perfect_count: int, good_count: int, miss_count: int) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }

        if not song or not song.strip():
            return {
                'code': 1,
                'message': 'Song cannot be empty',
                'data': None
            }

        valid_songs = [s['id'] for s in SONGS]
        if song not in valid_songs:
            return {
                'code': 1,
                'message': f'Invalid song: {song}',
                'data': None
            }

        total = perfect_count + good_count + miss_count
        if total == 0:
            rating = 'C'
        else:
            perfect_rate = perfect_count / total
            if perfect_rate >= 0.95:
                rating = 'S'
            elif perfect_rate >= 0.80:
                rating = 'A'
            elif perfect_rate >= 0.60:
                rating = 'B'
            else:
                rating = 'C'

        player_name = player_name.strip()[:20]

        record_id = self.model.create(
            player_name=player_name,
            song=song,
            score=score,
            max_combo=max_combo,
            rating=rating,
            perfect_count=perfect_count,
            good_count=good_count,
            miss_count=miss_count
        )

        record = self.model.query.find_by_id(record_id)

        return {
            'code': 0,
            'message': 'Score submitted successfully',
            'data': {
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'song': record.get('song'),
                'score': record.get('score'),
                'max_combo': record.get('max_combo'),
                'rating': record.get('rating'),
                'perfect_count': record.get('perfect_count'),
                'good_count': record.get('good_count'),
                'miss_count': record.get('miss_count'),
                'created_at': record.get('created_at')
            }
        }

    def get_leaderboard(self, song: str = None, limit: int = 10) -> Dict[str, Any]:
        if limit < 1:
            limit = 10
        if limit > 100:
            limit = 100

        records = self.model.get_leaderboard(song, limit)

        result = []
        for i, record in enumerate(records):
            result.append({
                'rank': i + 1,
                'player_name': record.get('player_name'),
                'score': record.get('score'),
                'max_combo': record.get('max_combo'),
                'rating': record.get('rating'),
                'perfect_count': record.get('perfect_count'),
                'good_count': record.get('good_count'),
                'miss_count': record.get('miss_count'),
                'created_at': record.get('created_at')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'song': song,
                'items': result,
                'total': len(result)
            }
        }

    def get_songs(self) -> Dict[str, Any]:
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'songs': SONGS
            }
        }

    def get_player_best(self, player_name: str, song: str) -> Dict[str, Any]:
        if not player_name or not song:
            return {
                'code': 1,
                'message': 'Player name and song are required',
                'data': None
            }

        record = self.model.get_player_best(player_name, song)

        if record:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'player_name': record.get('player_name'),
                    'song': record.get('song'),
                    'score': record.get('score'),
                    'max_combo': record.get('max_combo'),
                    'rating': record.get('rating'),
                    'perfect_count': record.get('perfect_count'),
                    'good_count': record.get('good_count'),
                    'miss_count': record.get('miss_count'),
                    'created_at': record.get('created_at')
                }
            }

        return {
            'code': 0,
            'message': 'No record found',
            'data': None
        }
