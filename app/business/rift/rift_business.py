import math
import random
from typing import Dict, Any, List, Optional, Tuple
from app.model.rift import (
    RiftGameModel, RiftSegmentModel, RiftSealOperationModel,
    RiftAnchorModel, RiftVortexModel
)


SEAL_MODES = {
    'slow': {'rate': 0.95, 'coverage': 1, 'name': '慢速精准'},
    'medium': {'rate': 0.75, 'coverage': 2, 'name': '中速平衡'},
    'fast': {'rate': 0.50, 'coverage': 3, 'name': '快速粗略'},
}

CANVAS_WIDTH = 800
CANVAS_HEIGHT = 600
SEGMENT_DISTANCE = 20
MAX_RIFT_LENGTH = 80
MAX_BRANCHES_FOR_SHAKE = 4
ANCHOR_THRESHOLD = 20
MAX_ANCHORS_PER_GAME = 5


class RiftBusiness:
    def __init__(self):
        self.game_model = RiftGameModel()
        self.segment_model = RiftSegmentModel()
        self.operation_model = RiftSealOperationModel()
        self.anchor_model = RiftAnchorModel()
        self.vortex_model = RiftVortexModel()

    def _distance(self, x1: int, y1: int, x2: int, y2: int) -> float:
        return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

    def _find_nearest_segments(self, tracker_x: int, tracker_y: int,
                                segments: List[Dict[str, Any]],
                                count: int = 1) -> List[Dict[str, Any]]:
        with_dist = []
        for seg in segments:
            dist = self._distance(tracker_x, tracker_y, seg['x'], seg['y'])
            with_dist.append((dist, seg))
        with_dist.sort(key=lambda x: x[0])
        return [s for _, s in with_dist[:count]]

    def _is_position_occupied(self, game_id: int, x: int, y: int) -> bool:
        all_segments = self.segment_model.get_by_game_id(game_id)
        for seg in all_segments:
            if self._distance(seg['x'], seg['y'], x, y) < SEGMENT_DISTANCE * 0.5:
                return True
        return False

    def _get_segment_endpoints(self, game_id: int) -> List[Dict[str, Any]]:
        all_segments = self.segment_model.get_unsealed_by_game_id(game_id)
        if not all_segments:
            return []

        seg_dict = {(s['x'], s['y']): s for s in all_segments}
        endpoints = []

        for seg in all_segments:
            if seg.get('has_anchor') and seg['anchor_turns_left'] > 0:
                continue
            next_count = 0
            for other in all_segments:
                if other['prev_x'] == seg['x'] and other['prev_y'] == seg['y']:
                    next_count += 1
            if next_count == 0:
                endpoints.append(seg)
            elif next_count >= 2 and seg.get('is_node'):
                endpoints.append(seg)

        return endpoints

    def _expand_rift(self, game_id: int, turn: int, expansion_rate: float) -> Dict[str, Any]:
        endpoints = self._get_segment_endpoints(game_id)
        if not endpoints:
            return {'expanded': 0, 'new_vortex_ids': [], 'new_branch_count': 0}

        segments_to_add = []
        new_vortex_ids = []
        total_expand = max(1, int(round(expansion_rate)))
        branch_count = self.segment_model.count_branches(game_id)

        all_segments = self.segment_model.get_by_game_id(game_id)
        existing_positions = set()
        for seg in all_segments:
            existing_positions.add((round(seg['x'] / SEGMENT_DISTANCE) * SEGMENT_DISTANCE,
                                    round(seg['y'] / SEGMENT_DISTANCE) * SEGMENT_DISTANCE))

        directions = [
            (1, 0), (-1, 0), (0, 1), (0, -1),
            (1, 1), (1, -1), (-1, 1), (-1, -1)
        ]

        expanded_count = 0
        for _ in range(total_expand):
            if not endpoints:
                break
            endpoint = random.choice(endpoints)

            valid_dirs = []
            for dx, dy in directions:
                new_x = endpoint['x'] + dx * SEGMENT_DISTANCE
                new_y = endpoint['y'] + dy * SEGMENT_DISTANCE
                if 50 <= new_x <= CANVAS_WIDTH - 50 and 50 <= new_y <= CANVAS_HEIGHT - 50:
                    grid_key = (round(new_x / SEGMENT_DISTANCE) * SEGMENT_DISTANCE,
                                round(new_y / SEGMENT_DISTANCE) * SEGMENT_DISTANCE)
                    if grid_key not in existing_positions:
                        valid_dirs.append((dx, dy, new_x, new_y))

            if valid_dirs:
                dx, dy, new_x, new_y = random.choice(valid_dirs)
                grid_key = (round(new_x / SEGMENT_DISTANCE) * SEGMENT_DISTANCE,
                            round(new_y / SEGMENT_DISTANCE) * SEGMENT_DISTANCE)

                is_branch = False
                is_node = 0
                branch_id = endpoint['branch_id']

                if random.random() < 0.15 and branch_count < 6:
                    is_branch = True
                    branch_count += 1
                    branch_id = branch_count
                    is_node = 1
                    self.segment_model.update(endpoint['id'], {'is_node': 1})

                segments_to_add.append({
                    'game_id': game_id,
                    'x': new_x,
                    'y': new_y,
                    'prev_x': endpoint['x'],
                    'prev_y': endpoint['y'],
                    'branch_id': branch_id,
                    'is_node': 0,
                    'turn_created': turn,
                })
                existing_positions.add(grid_key)
                expanded_count += 1

                for seg in all_segments:
                    if (self._distance(seg['x'], seg['y'], new_x, new_y) < SEGMENT_DISTANCE * 1.2
                            and seg['branch_id'] != branch_id):
                        is_node = 1
                        vortex_id = self.vortex_model.create(
                            game_id=game_id, x=new_x, y=new_y,
                            segment_id=0, turn_created=turn
                        )
                        new_vortex_ids.append(vortex_id)
                        break

                if is_branch:
                    endpoint = {
                        'id': 0,
                        'x': new_x,
                        'y': new_y,
                        'branch_id': branch_id,
                        'is_node': 0,
                        'has_anchor': 0,
                        'anchor_turns_left': 0,
                    }
                    endpoints.append(endpoint)

        if segments_to_add:
            self.segment_model.create_many(segments_to_add)

        return {
            'expanded': expanded_count,
            'new_vortex_ids': new_vortex_ids,
            'new_branch_count': branch_count,
        }

    def _is_near_vortex(self, tracker_x: int, tracker_y: int,
                         vortices: List[Dict[str, Any]]) -> bool:
        for v in vortices:
            if self._distance(tracker_x, tracker_y, v['x'], v['y']) <= SEGMENT_DISTANCE * 2.5:
                return True
        return False

    def create_game(self) -> Dict[str, Any]:
        center_x = CANVAS_WIDTH // 2
        center_y = CANVAS_HEIGHT // 2
        game_id = self.game_model.create(tracker_x=center_x, tracker_y=center_y)

        initial_segments = []
        directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
        for i, (dx, dy) in enumerate(directions):
            for step in range(1, 4):
                x = center_x + dx * step * SEGMENT_DISTANCE
                y = center_y + dy * step * SEGMENT_DISTANCE
                initial_segments.append({
                    'game_id': game_id,
                    'x': x,
                    'y': y,
                    'prev_x': center_x + dx * (step - 1) * SEGMENT_DISTANCE,
                    'prev_y': center_y + dy * (step - 1) * SEGMENT_DISTANCE,
                    'branch_id': i + 1,
                    'is_node': 0 if step < 3 else 0,
                    'turn_created': 0,
                })

        self.segment_model.create_many(initial_segments)

        return {
            'code': 0,
            'message': 'success',
            'data': self._get_game_state(game_id)
        }

    def _get_game_state(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {}

        segments = self.segment_model.get_by_game_id(game_id)
        operations = self.operation_model.get_by_game_id(game_id)
        anchors = self.anchor_model.get_by_game_id(game_id)
        vortices = self.vortex_model.get_by_game_id(game_id)

        unsealed_segments = [s for s in segments if not s['is_sealed']]
        total_length = len(unsealed_segments)

        is_out_of_control = total_length > MAX_RIFT_LENGTH
        branch_count = len(set(s['branch_id'] for s in unsealed_segments))
        is_shaking = branch_count > MAX_BRANCHES_FOR_SHAKE

        if game.get('is_out_of_control') != (1 if is_out_of_control else 0):
            self.game_model.update(game_id, {'is_out_of_control': 1 if is_out_of_control else 0})
        if game.get('branch_count') != branch_count:
            self.game_model.update(game_id, {'branch_count': branch_count})
        if game.get('is_shaking') != (1 if is_shaking else 0):
            self.game_model.update(game_id, {'is_shaking': 1 if is_shaking else 0})

        return {
            'game': game,
            'segments': segments,
            'operations': operations,
            'anchors': anchors,
            'vortices': vortices,
            'total_length': total_length,
            'is_out_of_control': is_out_of_control,
            'is_shaking': is_shaking,
            'branch_count': branch_count,
            'canvas_width': CANVAS_WIDTH,
            'canvas_height': CANVAS_HEIGHT,
            'segment_distance': SEGMENT_DISTANCE,
            'max_length': MAX_RIFT_LENGTH,
            'seal_modes': SEAL_MODES,
            'max_anchors': MAX_ANCHORS_PER_GAME,
        }

    def get_game_state(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'message': 'Game not found', 'data': None}
        return {
            'code': 0,
            'message': 'success',
            'data': self._get_game_state(game_id)
        }

    def get_active_game(self) -> Dict[str, Any]:
        game = self.game_model.get_active_game()
        if not game:
            return self.create_game()
        return {
            'code': 0,
            'message': 'success',
            'data': self._get_game_state(game['id'])
        }

    def execute_seal(self, game_id: int, mode: str,
                      tracker_x: int, tracker_y: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game or game['status'] != 'playing':
            return {'code': 1, 'message': 'Game not found or not playing', 'data': None}

        if mode not in SEAL_MODES:
            return {'code': 1, 'message': 'Invalid seal mode', 'data': None}

        mode_config = SEAL_MODES[mode]
        coverage = mode_config['coverage']
        base_rate = mode_config['rate']

        is_out_of_control = game.get('is_out_of_control', 0) == 1
        is_shaking = game.get('is_shaking', 0) == 1

        adjusted_rate = base_rate
        if is_out_of_control:
            adjusted_rate -= 0.20
        if is_shaking:
            adjusted_rate -= 0.10
        adjusted_rate = max(0.05, min(0.99, adjusted_rate))

        unsealed = self.segment_model.get_unsealed_by_game_id(game_id)
        if not unsealed:
            return {'code': 1, 'message': 'No rift segments to seal', 'data': None}

        nearest_segments = self._find_nearest_segments(tracker_x, tracker_y, unsealed, coverage)
        target_ids = [s['id'] for s in nearest_segments]

        vortices = self.vortex_model.get_active_by_game(game_id)
        tracker_x_before = game['tracker_x']
        tracker_y_before = game['tracker_y']

        success = random.random() < adjusted_rate
        turn = game['turn'] + 1
        sealed_count = 0
        expansion_count = 0

        if success:
            sealed_count = len(target_ids)
            self.segment_model.seal_segments(target_ids, turn)
        else:
            expansion_count = 2
            for seg in nearest_segments[:1]:
                for i in range(expansion_count):
                    directions = [
                        (1, 0), (-1, 0), (0, 1), (0, -1),
                        (1, 1), (1, -1), (-1, 1), (-1, -1)
                    ]
                    random.shuffle(directions)
                    for dx, dy in directions:
                        new_x = seg['x'] + dx * SEGMENT_DISTANCE * (i + 1)
                        new_y = seg['y'] + dy * SEGMENT_DISTANCE * (i + 1)
                        if (50 <= new_x <= CANVAS_WIDTH - 50
                                and 50 <= new_y <= CANVAS_HEIGHT - 50
                                and not self._is_position_occupied(game_id, new_x, new_y)):
                            self.segment_model.create(
                                game_id=game_id, x=new_x, y=new_y,
                                prev_x=seg['x'], prev_y=seg['y'],
                                branch_id=seg['branch_id'], turn_created=turn
                            )
                            break

        self.operation_model.create(
            game_id=game_id, turn=turn, mode=mode,
            target_segment_ids=target_ids, success=1 if success else 0,
            success_rate=adjusted_rate, sealed_count=sealed_count,
            expansion_count=expansion_count,
            tracker_x_before=tracker_x_before, tracker_y_before=tracker_y_before,
            tracker_x_after=tracker_x, tracker_y_after=tracker_y,
        )

        total_sealed = game['total_sealed'] + sealed_count
        anchors_available = game['anchors_available'] + (sealed_count // ANCHOR_THRESHOLD)
        new_anchors_from_sealing = sealed_count // ANCHOR_THRESHOLD
        anchors_available = game['anchors_available'] + new_anchors_from_sealing

        expansion_rate = 1.0 + (turn // 10) * 0.5
        expand_result = self._expand_rift(game_id, turn, expansion_rate)

        collapsed_vortex_ids = self.vortex_model.decrement_turns(game_id)
        for _ in collapsed_vortex_ids:
            anchors_available += 2
        self.anchor_model.decrement_turns(game_id)
        self.segment_model.decrement_anchor_turns(game_id)

        new_tracker_x = tracker_x
        new_tracker_y = tracker_y
        if is_shaking:
            offset_x = random.choice([-SEGMENT_DISTANCE, 0, SEGMENT_DISTANCE])
            offset_y = random.choice([-SEGMENT_DISTANCE, 0, SEGMENT_DISTANCE])
            new_tracker_x = max(0, min(CANVAS_WIDTH, tracker_x + offset_x))
            new_tracker_y = max(0, min(CANVAS_HEIGHT, tracker_y + offset_y))

        score = game['score'] + sealed_count * 10 + (1 if success else 0) * 5

        self.game_model.update(game_id, {
            'turn': turn,
            'tracker_x': new_tracker_x,
            'tracker_y': new_tracker_y,
            'total_sealed': total_sealed,
            'anchors_available': anchors_available,
            'expansion_rate': expansion_rate,
            'score': score,
        })

        state = self._get_game_state(game_id)
        state['last_operation'] = {
            'success': success,
            'sealed_count': sealed_count,
            'expansion_count': expansion_count,
            'adjusted_rate': adjusted_rate,
            'mode': mode,
        }
        state['expanded_this_turn'] = expand_result['expanded']

        return {'code': 0, 'message': 'success', 'data': state}

    def deploy_anchor(self, game_id: int, segment_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game or game['status'] != 'playing':
            return {'code': 1, 'message': 'Game not found or not playing', 'data': None}

        if game['anchors_available'] <= 0:
            return {'code': 1, 'message': 'No anchors available', 'data': None}

        if game['anchors_deployed'] >= MAX_ANCHORS_PER_GAME:
            return {'code': 1, 'message': 'Max anchors deployed this game', 'data': None}

        segment = self.segment_model.query.find_by_id(segment_id)
        if not segment or segment['game_id'] != game_id:
            return {'code': 1, 'message': 'Segment not found', 'data': None}

        if segment.get('has_anchor'):
            return {'code': 1, 'message': 'Segment already has anchor', 'data': None}

        self.anchor_model.create(
            game_id=game_id, segment_id=segment_id,
            x=segment['x'], y=segment['y'],
            turn_deployed=game['turn']
        )
        self.segment_model.set_anchor(segment_id, 3)

        self.game_model.update(game_id, {
            'anchors_available': game['anchors_available'] - 1,
            'anchors_deployed': game['anchors_deployed'] + 1,
        })

        return {'code': 0, 'message': 'success', 'data': self._get_game_state(game_id)}

    def move_tracker(self, game_id: int, tracker_x: int, tracker_y: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game or game['status'] != 'playing':
            return {'code': 1, 'message': 'Game not found or not playing', 'data': None}

        tracker_x = max(0, min(CANVAS_WIDTH, tracker_x))
        tracker_y = max(0, min(CANVAS_HEIGHT, tracker_y))

        self.game_model.update(game_id, {
            'tracker_x': tracker_x,
            'tracker_y': tracker_y,
        })

        return {'code': 0, 'message': 'success', 'data': self._get_game_state(game_id)}

    def get_games(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.game_model.query.paginate(page, page_size, order_by='id DESC')
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': result['items'],
                'total': result['total'],
                'page': result['page'],
                'page_size': result['page_size'],
                'total_pages': result['total_pages']
            }
        }
