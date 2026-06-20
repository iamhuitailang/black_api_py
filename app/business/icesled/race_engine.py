import math
import random
from typing import Dict, Any, List, Tuple, Optional
from app.business.icesled.ai_engine import AIRacer, PlayerRacer


INITIAL_SPEED = 60.0
MAX_SPEED = 150.0
MIN_SPEED = 15.0
WALL_HIT_SPEED_LOSS = 30.0
CRACK_FALL_TIME_LOSS = 3.0
BOOST_SPEED_GAIN = 20.0
SPEED_DECAY_PER_SECOND = 1.5
TICK_SECONDS = 0.1
BASE_ACCELERATION = 2.0


class RacerState:
    def __init__(self, racer):
        self.racer = racer
        self.name = racer.name
        self.racer_type = racer.racer_type
        self.strategy_type = getattr(racer, 'strategy_type', 'player')
        self.speed = INITIAL_SPEED
        self.position = 0.0
        self.total_time = 0.0
        self.finished = False
        self.current_segment_idx = 0
        self.event_log = []
        self.wall_hit_count = 0
        self.crack_fall_count = 0
        self.boost_count = 0
        self.pending_time_penalty = 0.0
        self._hit_segments = set()
        self._crack_hits = set()
        self._boost_segments = set()
        self._curve_passed = set()

    def has_hit_wall_in_segment(self, seg_idx: int) -> bool:
        return seg_idx in self._hit_segments

    def mark_wall_hit(self, seg_idx: int):
        self._hit_segments.add(seg_idx)

    def has_crack_at(self, crack_key: str) -> bool:
        return crack_key in self._crack_hits

    def mark_crack(self, crack_key: str):
        self._crack_hits.add(crack_key)

    def has_boost_in_segment(self, seg_idx: int) -> bool:
        return seg_idx in self._boost_segments

    def mark_boost(self, seg_idx: int):
        self._boost_segments.add(seg_idx)

    def has_passed_curve(self, seg_idx: int) -> bool:
        return seg_idx in self._curve_passed

    def mark_curve_passed(self, seg_idx: int):
        self._curve_passed.add(seg_idx)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'racer_type': self.racer_type,
            'strategy_type': self.strategy_type,
            'speed': round(self.speed, 1),
            'position': round(self.position, 1),
            'total_time': round(self.total_time, 3),
            'finished': self.finished,
            'current_segment_idx': self.current_segment_idx,
            'wall_hit_count': self.wall_hit_count,
            'crack_fall_count': self.crack_fall_count,
            'boost_count': self.boost_count,
            'rank': 0,
            'score': 0,
        }


class RaceSimulator:
    def __init__(self, track: Dict[str, Any],
                 player_name: str = '玩家',
                 player_actions: Optional[List[Dict[str, Any]]] = None):
        self.track = track
        self.segments = track['segments']
        self.total_length = track['total_length']
        self.player_name = player_name
        self.player_actions = player_actions or []
        self.tick_count = 0
        self.states: List[RacerState] = []
        self.frames: List[List[Dict[str, Any]]] = []
        self._init_racers()

    def _init_racers(self):
        player = PlayerRacer(self.player_name)
        self.states.append(RacerState(player))

        ai_configs = [
            ('疾风·雷德', 'aggressive', 1.04),
            ('稳如·老狗', 'steady', 0.98),
            ('天选·欧皇', 'random', 1.0),
        ]
        for name, strat, mod in ai_configs:
            ai = AIRacer(name, strat, mod)
            self.states.append(RacerState(ai))

    def _get_segment_at(self, position: float) -> Optional[Dict[str, Any]]:
        for seg in self.segments:
            start = seg['start_position']
            end = start + seg['length']
            if start <= position < end:
                return seg
        if position >= self.total_length:
            return self.segments[-1]
        return None

    def _get_ahead_info(self, state: RacerState) -> Dict[str, Any]:
        ahead = {'turn_warning_distance': 999, 'crack_warning_distance': 999}
        look_ahead = 250
        pos = state.position
        for seg in self.segments:
            seg_start = seg['start_position']
            if seg_start >= pos - 20 and seg_start <= pos + look_ahead:
                dist = max(0, seg_start - pos)
                if seg['type'] == 'curve' and dist < ahead['turn_warning_distance']:
                    ahead['turn_warning_distance'] = dist
                elif seg['type'] == 'crack' and dist < ahead['crack_warning_distance']:
                    ahead['crack_warning_distance'] = dist
        return ahead

    def _process_curve(self, state: RacerState, action: Dict[str, Any],
                        segment: Dict[str, Any], dt: float):
        seg_idx = segment['index']
        seg_start = segment['start_position']
        seg_len = segment['length']
        seg_end = seg_start + seg_len
        pos_in_seg = state.position - seg_start

        difficulty = segment.get('difficulty', 2)
        turn_success = action.get('turn', False)

        if pos_in_seg < seg_len * 0.3:
            return

        if state.has_passed_curve(seg_idx):
            state.speed = max(MIN_SPEED, state.speed * (0.98 + 0.02 * difficulty * 0.2))
            return

        if turn_success:
            speed_factor = 0.85 + (3 - difficulty) * 0.05
            state.speed = max(MIN_SPEED, state.speed * speed_factor)

            if pos_in_seg >= seg_len * 0.7 and not state.has_passed_curve(seg_idx):
                state.mark_curve_passed(seg_idx)
                event = {
                    'type': 'curve_pass',
                    'time': round(state.total_time, 3),
                    'position': round(state.position, 1),
                    'segment': seg_idx,
                    'direction': segment.get('direction', 'left')
                }
                state.event_log.append(event)
        else:
            if not state.has_hit_wall_in_segment(seg_idx):
                state.speed = max(MIN_SPEED, state.speed - WALL_HIT_SPEED_LOSS)
                state.wall_hit_count += 1
                state.mark_wall_hit(seg_idx)
                event = {
                    'type': 'wall_hit',
                    'time': round(state.total_time, 3),
                    'position': round(state.position, 1),
                    'segment': seg_idx,
                    'speed_after': round(state.speed, 1)
                }
                state.event_log.append(event)

            friction = 0.88 - difficulty * 0.04
            state.speed = max(MIN_SPEED, state.speed * friction)

            if pos_in_seg >= seg_len * 0.95:
                state.mark_curve_passed(seg_idx)

    def _process_crack(self, state: RacerState, action: Dict[str, Any],
                        segment: Dict[str, Any], dt: float):
        seg_idx = segment['index']
        crack_count = segment.get('crack_count', 1)

        for i in range(crack_count):
            crack_pos = segment['start_position'] + segment['length'] * (i + 1) / (crack_count + 1)
            crack_key = f"{seg_idx}_{i}"

            dist = abs(state.position - crack_pos)
            detect_range = max(state.speed * dt / 3.6 * 1.5, 3)

            if dist < detect_range and not state.has_crack_at(crack_key):
                if action.get('jump'):
                    state.mark_crack(crack_key)
                    event = {
                        'type': 'jump_success',
                        'time': round(state.total_time, 3),
                        'position': round(state.position, 1),
                        'segment': seg_idx
                    }
                    state.event_log.append(event)
                else:
                    state.mark_crack(crack_key)
                    state.pending_time_penalty += CRACK_FALL_TIME_LOSS
                    state.crack_fall_count += 1
                    state.speed = max(MIN_SPEED, state.speed * 0.4)
                    event = {
                        'type': 'crack_fall',
                        'time': round(state.total_time, 3),
                        'position': round(state.position, 1),
                        'segment': seg_idx
                    }
                    state.event_log.append(event)

    def _process_boost(self, state: RacerState, segment: Dict[str, Any]):
        seg_idx = segment['index']
        pos_in_seg = state.position - segment['start_position']

        if pos_in_seg >= segment['length'] * 0.2 and not state.has_boost_in_segment(seg_idx):
            power = segment.get('boost_power', BOOST_SPEED_GAIN)
            state.speed = min(state.speed + power, MAX_SPEED)
            state.boost_count += 1
            state.mark_boost(seg_idx)
            event = {
                'type': 'boost',
                'time': round(state.total_time, 3),
                'position': round(state.position, 1),
                'segment': seg_idx,
                'power': power,
                'speed_after': round(state.speed, 1)
            }
            state.event_log.append(event)

    def _process_segment_effects(self, state: RacerState, action: Dict[str, Any],
                                  segment: Dict[str, Any], dt: float):
        if not segment or state.finished:
            return

        seg_type = segment['type']

        if seg_type == 'curve':
            self._process_curve(state, action, segment, dt)
        elif seg_type == 'crack':
            self._process_crack(state, action, segment, dt)
        elif seg_type == 'boost':
            self._process_boost(state, segment)

    def _advance(self, state: RacerState, action: Dict[str, Any], dt: float):
        if state.finished:
            return

        if state.pending_time_penalty > 0:
            penalty = min(state.pending_time_penalty, dt)
            state.total_time += penalty
            state.pending_time_penalty -= penalty
            return

        hold = action.get('speed_hold', 1.0)
        effective_speed = state.speed * hold
        if hasattr(state.racer, 'base_speed_modifier'):
            effective_speed *= state.racer.base_speed_modifier

        state.speed += BASE_ACCELERATION * dt
        state.speed -= SPEED_DECAY_PER_SECOND * dt

        if state.speed < MIN_SPEED:
            state.speed = MIN_SPEED
        if state.speed > MAX_SPEED:
            state.speed = MAX_SPEED

        move_distance = effective_speed * dt / 3.6
        state.position += move_distance
        state.total_time += dt

        current_seg = self._get_segment_at(state.position)
        if current_seg:
            state.current_segment_idx = current_seg['index']
            self._process_segment_effects(state, action, current_seg, dt)

        if state.position >= self.total_length:
            state.position = self.total_length
            state.finished = True

    def _get_player_action_for_tick(self, tick_idx: int) -> Dict[str, Any]:
        if 0 <= tick_idx < len(self.player_actions):
            return self.player_actions[tick_idx]
        return {'turn': False, 'jump': False}

    def simulate(self) -> Dict[str, Any]:
        max_ticks = 5000

        while self.tick_count < max_ticks:
            self.tick_count += 1
            frame_snapshot = []

            for state in self.states:
                if state.finished:
                    frame_snapshot.append(state.to_dict())
                    continue

                ahead = self._get_ahead_info(state)
                current_seg = self._get_segment_at(state.position)

                if state.racer_type == 'player':
                    p_action = self._get_player_action_for_tick(self.tick_count - 1)
                    action = state.racer.decide_action(current_seg, state.speed, ahead, p_action)
                else:
                    action = state.racer.decide_action(current_seg, state.speed, ahead)

                self._advance(state, action, TICK_SECONDS)
                frame_snapshot.append(state.to_dict())

            self.frames.append(frame_snapshot)

            if all(s.finished for s in self.states):
                break

        return self._finalize()

    def _finalize(self) -> Dict[str, Any]:
        sorted_states = sorted(self.states, key=lambda s: s.total_time)
        rank_scores = {1: 50, 2: 30, 3: 15, 4: 0}
        results = []

        for idx, state in enumerate(sorted_states):
            rank = idx + 1
            score = rank_scores.get(rank, 0)
            info = state.to_dict()
            info['rank'] = rank
            info['score'] = score
            info['event_log'] = state.event_log
            info['wall_hit_count'] = state.wall_hit_count
            info['crack_fall_count'] = state.crack_fall_count
            info['boost_count'] = state.boost_count
            info['final_speed'] = state.speed
            results.append(info)

        winner = results[0]
        total_time = max(s.total_time for s in self.states)

        return {
            'track': self.track,
            'total_time': round(total_time, 3),
            'winner_name': winner['name'],
            'winner_type': winner['racer_type'],
            'results': results,
            'frames': self.frames,
            'frame_count': len(self.frames),
            'tick_interval': TICK_SECONDS
        }
