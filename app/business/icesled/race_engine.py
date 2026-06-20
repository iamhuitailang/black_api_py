import math
from typing import Dict, Any, List, Tuple, Optional
from app.business.icesled.ai_engine import AIRacer, PlayerRacer


INITIAL_SPEED = 60
MAX_SPEED = 150
WALL_HIT_SPEED_LOSS = 30
WALL_HIT_SPEED_PENALTY = 10
CRACK_FALL_TIME_LOSS = 3.0
BOOST_SPEED_GAIN = 20
SPEED_DECAY_PER_SECOND = 2
TICK_SECONDS = 0.1


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
        self._last_tick_events = []

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
        return None

    def _get_ahead_info(self, state: RacerState) -> Dict[str, Any]:
        ahead = {'turn_warning_distance': 999, 'crack_warning_distance': 999}
        look_ahead = 200
        pos = state.position
        for seg in self.segments:
            seg_start = seg['start_position']
            seg_end = seg_start + seg['length']
            if seg_start >= pos - 10 and seg_start <= pos + look_ahead:
                dist = max(0, seg_start - pos)
                if seg['type'] == 'curve' and dist < ahead['turn_warning_distance']:
                    ahead['turn_warning_distance'] = dist
                elif seg['type'] == 'crack' and dist < ahead['crack_warning_distance']:
                    ahead['crack_warning_distance'] = dist
        return ahead

    def _process_segment_effects(self, state: RacerState, action: Dict[str, Any],
                                  segment: Dict[str, Any], dt: float):
        if not segment:
            return

        seg_type = segment['type']
        tick_events = []

        if seg_type == 'curve':
            if not action.get('turn'):
                if state.position >= segment['start_position'] + segment['length'] * 0.3:
                    if not any(e.get('type') == 'wall_hit' for e in state._last_tick_events):
                        state.speed = max(0, state.speed - WALL_HIT_SPEED_LOSS)
                        state.speed = max(0, state.speed - WALL_HIT_SPEED_PENALTY)
                        state.wall_hit_count += 1
                        event = {
                            'type': 'wall_hit',
                            'time': round(state.total_time, 3),
                            'position': round(state.position, 1),
                            'segment': segment['index'],
                            'speed_after': round(state.speed, 1)
                        }
                        state.event_log.append(event)
                        tick_events.append(event)
            else:
                hold = action.get('speed_hold', 0.85)
                if state.speed > 0 and random.random() < 0.1:
                    event = {
                        'type': 'curve_pass',
                        'time': round(state.total_time, 3),
                        'position': round(state.position, 1),
                        'segment': segment['index'],
                        'direction': segment.get('direction', 'left')
                    }
                    state.event_log.append(event)

        elif seg_type == 'crack':
            crack_positions = []
            crack_count = segment.get('crack_count', 1)
            for i in range(crack_count):
                crack_positions.append(
                    segment['start_position'] + segment['length'] * (i + 1) / (crack_count + 1)
                )
            for cp in crack_positions:
                near = abs(state.position - cp) < (state.speed * dt * 0.5 + 2)
                if near:
                    already_fallen = any(
                        e.get('type') == 'crack_fall'
                        and abs(e.get('position', 0) - cp) < 5
                        for e in state.event_log
                    )
                    if not action.get('jump') and not already_fallen:
                        state.pending_time_penalty += CRACK_FALL_TIME_LOSS
                        state.crack_fall_count += 1
                        state.speed = max(state.speed * 0.5, 10)
                        event = {
                            'type': 'crack_fall',
                            'time': round(state.total_time, 3),
                            'position': round(state.position, 1),
                            'segment': segment['index']
                        }
                        state.event_log.append(event)
                        tick_events.append(event)
                    elif action.get('jump') and not already_fallen:
                        event = {
                            'type': 'jump_success',
                            'time': round(state.total_time, 3),
                            'position': round(state.position, 1),
                            'segment': segment['index']
                        }
                        state.event_log.append(event)

        elif seg_type == 'boost':
            boost_start = segment['start_position']
            passed_boost = state.position >= boost_start + 10
            already_boosted = any(
                e.get('type') == 'boost'
                and e.get('segment') == segment['index']
                for e in state.event_log
            )
            if passed_boost and not already_boosted:
                power = segment.get('boost_power', BOOST_SPEED_GAIN)
                state.speed = min(state.speed + power, MAX_SPEED)
                state.boost_count += 1
                event = {
                    'type': 'boost',
                    'time': round(state.total_time, 3),
                    'position': round(state.position, 1),
                    'segment': segment['index'],
                    'power': power,
                    'speed_after': round(state.speed, 1)
                }
                state.event_log.append(event)
                tick_events.append(event)

        state._last_tick_events = tick_events

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

        state.speed -= SPEED_DECAY_PER_SECOND * dt
        if state.speed < 20:
            state.speed = 20
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
                current_seg = self._get_segment_at(state.position) or state.__dict__.get('_last_seg', self.segments[0])
                if current_seg:
                    state._last_seg = current_seg

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
