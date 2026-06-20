import random
from typing import Dict, Any, List, Tuple
from app.model.icesled import TrackTemplateModel


SEGMENT_TYPES = ['straight', 'curve', 'crack', 'boost']
CURVE_DIRECTIONS = ['left', 'right']


class TrackEngine:
    MIN_SEGMENTS = 5
    MAX_SEGMENTS = 5
    MIN_SEGMENT_LENGTH = 200
    MAX_SEGMENT_LENGTH = 500
    MIN_CURVE_RATIO = 0.30

    @classmethod
    def generate_track(cls, difficulty: str = 'normal') -> Dict[str, Any]:
        if difficulty == 'easy':
            length_range = (200, 350)
            boost_extra = 0.15
        elif difficulty == 'hard':
            length_range = (350, 500)
            boost_extra = -0.1
        else:
            length_range = (250, 450)
            boost_extra = 0

        min_seg_len, max_seg_len = length_range

        while True:
            segments = []
            total_length = 0
            curve_length = 0

            for seg_idx in range(cls.MAX_SEGMENTS):
                seg_length = random.randint(min_seg_len, max_seg_len)

                if seg_idx == 0:
                    seg_type = 'straight'
                elif seg_idx == cls.MAX_SEGMENTS - 1:
                    seg_type = 'straight'
                else:
                    seg_type = cls._pick_segment_type(boost_extra)

                segment = {
                    'index': seg_idx,
                    'type': seg_type,
                    'length': seg_length,
                    'start_position': total_length
                }

                if seg_type == 'curve':
                    segment['direction'] = random.choice(CURVE_DIRECTIONS)
                    segment['difficulty'] = random.randint(1, 3)
                    curve_length += seg_length
                elif seg_type == 'crack':
                    segment['crack_count'] = random.randint(1, 3)
                elif seg_type == 'boost':
                    segment['boost_power'] = random.randint(15, 25)

                segments.append(segment)
                total_length += seg_length

            curve_ratio = curve_length / total_length if total_length > 0 else 0
            if curve_ratio >= cls.MIN_CURVE_RATIO:
                break

        track_name = cls._generate_track_name(difficulty)

        return {
            'name': track_name,
            'segments': segments,
            'total_length': total_length,
            'curve_ratio': round(curve_ratio, 3),
            'difficulty': difficulty
        }

    @classmethod
    def _pick_segment_type(cls, boost_extra: float = 0) -> str:
        weights = {
            'straight': 30,
            'curve': 35,
            'crack': 18,
            'boost': 17 + int(boost_extra * 100)
        }
        types = list(weights.keys())
        weight_values = list(weights.values())
        total = sum(weight_values)
        r = random.uniform(0, total)
        cumulative = 0
        for t, w in zip(types, weight_values):
            cumulative += w
            if r <= cumulative:
                return t
        return 'straight'

    @classmethod
    def _generate_track_name(cls, difficulty: str) -> str:
        prefixes = ['冰川', '极光', '极地', '霜雪', '寒冰', '极寒', '冰河', '雪岭']
        suffixes = ['大回环', '极速道', '挑战赛', '邀请赛', '大师赛', '精英赛']
        difficulty_tag = {'easy': '新手', 'normal': '标准', 'hard': '大师'}
        return f"{random.choice(prefixes)}{random.choice(suffixes)}·{difficulty_tag.get(difficulty, '标准')}级"

    @classmethod
    def save_track(cls, track_data: Dict[str, Any]) -> int:
        model = TrackTemplateModel()
        return model.create(
            name=track_data['name'],
            segments=track_data['segments'],
            total_length=track_data['total_length'],
            curve_ratio=track_data['curve_ratio'],
            difficulty=track_data['difficulty']
        )

    @classmethod
    def generate_and_save(cls, difficulty: str = 'normal', count: int = 1) -> List[Dict[str, Any]]:
        results = []
        for _ in range(count):
            track = cls.generate_track(difficulty)
            track_id = cls.save_track(track)
            track['id'] = track_id
            results.append(track)
        return results

    @classmethod
    def seed_default_tracks(cls):
        model = TrackTemplateModel()
        if model.count() > 0:
            return

        print("Seeding default icesled tracks...")
        for difficulty in ['easy', 'normal', 'hard']:
            tracks = cls.generate_and_save(difficulty, count=3)
            for t in tracks:
                print(f"  - Created: {t['name']} (length={t['total_length']}m, "
                      f"curves={t['curve_ratio']*100:.1f}%)")

    @classmethod
    def get_all_tracks(cls) -> List[Dict[str, Any]]:
        model = TrackTemplateModel()
        return model.get_all()

    @classmethod
    def get_track_by_id(cls, track_id: int) -> Dict[str, Any]:
        model = TrackTemplateModel()
        return model.get_by_id(track_id)

    @classmethod
    def get_random_track(cls) -> Dict[str, Any]:
        model = TrackTemplateModel()
        track = model.get_random()
        if track:
            return track
        return cls.generate_track()
