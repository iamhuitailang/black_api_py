import random
from typing import Dict, Any, Tuple


class AIStrategy:
    def decide(self, segment: Dict[str, Any], current_speed: float,
               ahead_info: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError


class AggressiveAI(AIStrategy):
    name = '激进型'

    def decide(self, segment: Dict[str, Any], current_speed: float,
               ahead_info: Dict[str, Any]) -> Dict[str, Any]:
        seg_type = segment['type']
        action = {'turn': False, 'jump': False, 'boost_attempt': True,
                  'risk_level': 'high', 'speed_hold': 1.0}

        if seg_type == 'curve':
            difficulty = segment.get('difficulty', 2)
            turn_chance = 0.55 + (current_speed / 150) * 0.2
            if ahead_info.get('turn_warning_distance', 999) < 120:
                turn_chance += 0.2
            if random.random() < turn_chance:
                action['turn'] = True
                action['speed_hold'] = 0.85 if difficulty <= 2 else 0.75
            else:
                action['speed_hold'] = 0.98

        elif seg_type == 'crack':
            crack_count = segment.get('crack_count', 1)
            jump_chance = 0.50 + crack_count * 0.10
            if ahead_info.get('crack_warning_distance', 999) < 80:
                jump_chance += 0.25
            action['jump'] = random.random() < jump_chance
            action['speed_hold'] = 0.92

        elif seg_type == 'boost':
            action['speed_hold'] = 1.05

        elif seg_type == 'straight':
            action['speed_hold'] = 1.02

        return action


class SteadyAI(AIStrategy):
    name = '稳健型'

    def decide(self, segment: Dict[str, Any], current_speed: float,
               ahead_info: Dict[str, Any]) -> Dict[str, Any]:
        seg_type = segment['type']
        action = {'turn': False, 'jump': False, 'boost_attempt': True,
                  'risk_level': 'low', 'speed_hold': 0.95}

        if seg_type == 'curve':
            difficulty = segment.get('difficulty', 2)
            turn_chance = 0.88
            if ahead_info.get('turn_warning_distance', 999) < 150:
                turn_chance = 0.95
            if random.random() < turn_chance:
                action['turn'] = True
                action['speed_hold'] = 0.78 if difficulty >= 2 else 0.85
            else:
                action['speed_hold'] = 0.90

        elif seg_type == 'crack':
            crack_count = segment.get('crack_count', 1)
            jump_chance = 0.90 if crack_count >= 2 else 0.85
            if ahead_info.get('crack_warning_distance', 999) < 100:
                jump_chance = 0.98
            action['jump'] = random.random() < jump_chance
            action['speed_hold'] = 0.88

        elif seg_type == 'boost':
            action['speed_hold'] = 1.0

        elif seg_type == 'straight':
            action['speed_hold'] = 0.98

        return action


class RandomAI(AIStrategy):
    name = '随机型'

    def decide(self, segment: Dict[str, Any], current_speed: float,
               ahead_info: Dict[str, Any]) -> Dict[str, Any]:
        seg_type = segment['type']
        action = {'turn': False, 'jump': False, 'boost_attempt': True,
                  'risk_level': 'random', 'speed_hold': random.uniform(0.85, 1.05)}

        if seg_type == 'curve':
            turn_chance = random.uniform(0.55, 0.9)
            if ahead_info.get('turn_warning_distance', 999) < 100:
                turn_chance += 0.15
            action['turn'] = random.random() < turn_chance

        elif seg_type == 'crack':
            jump_chance = random.uniform(0.5, 0.95)
            if ahead_info.get('crack_warning_distance', 999) < 80:
                jump_chance += 0.1
            action['jump'] = random.random() < jump_chance

        return action


STRATEGIES = {
    'aggressive': AggressiveAI,
    'steady': SteadyAI,
    'random': RandomAI,
}


class AIRacer:
    def __init__(self, name: str, strategy_type: str,
                 base_speed_modifier: float = 1.0):
        self.name = name
        self.strategy_type = strategy_type
        self.strategy: AIStrategy = STRATEGIES[strategy_type]()
        self.base_speed_modifier = base_speed_modifier
        self.racer_type = 'ai'

    def decide_action(self, segment: Dict[str, Any], current_speed: float,
                      ahead_info: Dict[str, Any]) -> Dict[str, Any]:
        return self.strategy.decide(segment, current_speed, ahead_info)


class PlayerRacer:
    def __init__(self, name: str = '玩家'):
        self.name = name
        self.racer_type = 'player'
        self.strategy_type = 'player'

    def decide_action(self, segment: Dict[str, Any], current_speed: float,
                      ahead_info: Dict[str, Any],
                      player_input: Dict[str, Any] = None) -> Dict[str, Any]:
        if player_input is None:
            player_input = {}
        return {
            'turn': player_input.get('turn', False),
            'jump': player_input.get('jump', False),
            'boost_attempt': True,
            'risk_level': 'player',
            'speed_hold': 1.0
        }
