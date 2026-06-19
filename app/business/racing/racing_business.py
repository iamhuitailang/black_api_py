from typing import Dict, Any, List, Optional, Tuple
from app.model.racing import VehicleModel, RaceModel, CheckpointModel, LeaderboardModel, UpgradeLogModel


class RacingBusiness:
    TRACKS = [
        {'name': '泥路', 'index': 0},
        {'name': '沙地', 'index': 1},
        {'name': '冰面', 'index': 2},
        {'name': '碎石', 'index': 3},
        {'name': '密林', 'index': 4},
        {'name': '断桥', 'index': 5},
        {'name': '火山灰', 'index': 6},
        {'name': '暴风雨', 'index': 7}
    ]

    UPGRADES = {
        'engine': {'name': '升级引擎', 'cost': 50, 'power': 10},
        'soft_tire': {'name': '换软胎', 'cost': 80, 'grip': 2},
        'hard_tire': {'name': '换硬胎', 'cost': 60, 'wear_half': True},
        'suspension': {'name': '加固悬挂', 'cost': 40, 'hardness': 1},
        'weight': {'name': '减重', 'cost': 120, 'weight_reduce': 100},
        'new_tire': {'name': '更换轮胎', 'cost': 100}
    }

    def __init__(self):
        self.vehicle_model = VehicleModel()
        self.race_model = RaceModel()
        self.checkpoint_model = CheckpointModel()
        self.leaderboard_model = LeaderboardModel()
        self.upgrade_log_model = UpgradeLogModel()

    def new_game(self, player_name: str = 'Player') -> Dict[str, Any]:
        self.vehicle_model.deactivate_all()
        vehicle_id = self.vehicle_model.create(player_name)
        vehicle = self.vehicle_model.get_by_id(vehicle_id)
        return vehicle

    def get_active_vehicle(self) -> Optional[Dict[str, Any]]:
        return self.vehicle_model.get_active()

    def apply_upgrade(self, vehicle_id: int, upgrade_type: str) -> Dict[str, Any]:
        vehicle = self.vehicle_model.get_by_id(vehicle_id)
        if not vehicle:
            raise ValueError('Vehicle not found')

        if upgrade_type not in self.UPGRADES:
            raise ValueError('Invalid upgrade type')

        upgrade = self.UPGRADES[upgrade_type]
        cost = upgrade['cost']

        if vehicle['gold'] < cost:
            raise ValueError(f'Not enough gold. Need {cost}, have {vehicle["gold"]}')

        old_values = {}
        new_values = {}

        if upgrade_type == 'engine':
            old_values['engine_power'] = vehicle['engine_power']
            new_values['engine_power'] = vehicle['engine_power'] + upgrade['power']
        elif upgrade_type == 'soft_tire':
            old_values['tire_grip'] = vehicle['tire_grip']
            new_values['tire_grip'] = vehicle['tire_grip'] + upgrade['grip']
            new_values['tire_type'] = 'soft'
            new_values['tire_wear'] = 0
        elif upgrade_type == 'hard_tire':
            new_values['tire_type'] = 'hard'
            new_values['tire_wear'] = 0
            old_values['tire_grip'] = vehicle['tire_grip']
            new_values['tire_grip'] = max(2, vehicle['tire_grip'] - 1)
        elif upgrade_type == 'suspension':
            old_values['suspension_hardness'] = vehicle['suspension_hardness']
            new_susp = min(10, vehicle['suspension_hardness'] + upgrade['hardness'])
            new_values['suspension_hardness'] = new_susp
        elif upgrade_type == 'weight':
            old_values['weight'] = vehicle['weight']
            new_weight = max(600, vehicle['weight'] - upgrade['weight_reduce'])
            new_values['weight'] = new_weight
        elif upgrade_type == 'new_tire':
            new_values['tire_wear'] = 0
            old_values['tire_wear'] = vehicle['tire_wear']

        new_values['gold'] = vehicle['gold'] - cost

        old_value = list(old_values.values())[0] if old_values else 0
        new_value = list(new_values.values())[0] if new_values else 0

        self.upgrade_log_model.log(
            vehicle_id=vehicle_id,
            upgrade_type=upgrade_type,
            cost=cost,
            old_value=old_value,
            new_value=new_value,
            before_track=vehicle['current_track']
        )

        self.vehicle_model.update(vehicle_id, **new_values)

        return self.vehicle_model.get_by_id(vehicle_id)

    def start_race(self, vehicle_id: int, track_index: int) -> Dict[str, Any]:
        track = self.TRACKS[track_index]
        race_id = self.race_model.create(vehicle_id, track_index, track['name'])
        self.race_model.start(race_id)
        self.vehicle_model.update(vehicle_id, current_track=track_index)
        return self.race_model.get_by_id(race_id)

    def record_checkpoint(self, race_id: int, checkpoint_index: int, segment_time: float,
                          is_shortcut: bool = False, has_rollover: bool = False,
                          penalty_time: float = 0) -> Dict[str, Any]:
        checkpoint_id = self.checkpoint_model.record(
            race_id, checkpoint_index, segment_time, is_shortcut, has_rollover, penalty_time
        )
        return {'checkpoint_id': checkpoint_id, 'recorded': True}

    def finish_race(self, race_id: int, total_time: float, shortcuts_found: int = 0,
                    rollovers: int = 0) -> Dict[str, Any]:
        race = self.race_model.get_by_id(race_id)
        if not race:
            raise ValueError('Race not found')

        checkpoints = self.checkpoint_model.get_by_race(race_id)
        total_penalty = sum(cp.get('penalty_time', 0) for cp in checkpoints)
        actual_time = total_time + total_penalty

        position = self._calculate_position(actual_time, race['track_index'])
        gold = self._calculate_gold(position)

        self.race_model.finish(race_id, actual_time, position, gold, shortcuts_found, rollovers)

        vehicle = self.vehicle_model.get_by_id(race['vehicle_id'])
        new_gold = vehicle['gold'] + gold
        self.vehicle_model.update(race['vehicle_id'], gold=new_gold)

        if race['track_index'] == 3:
            current_wear = vehicle['tire_wear']
            if current_wear < 60:
                self.vehicle_model.update(race['vehicle_id'], tire_wear=60)

        all_races = self.race_model.get_all_by_vehicle(race['vehicle_id'])
        finished_races = [r for r in all_races if r['status'] == 'finished']
        if len(finished_races) == 8:
            total_time_all = sum(r['total_time'] for r in finished_races)
            total_gold_all = sum(r['gold_earned'] for r in finished_races)
            total_shortcuts = sum(r['shortcuts_found'] for r in finished_races)
            total_rollovers = sum(r['rollovers'] for r in finished_races)

            self.leaderboard_model.create(
                vehicle_id=race['vehicle_id'],
                player_name=vehicle['player_name'],
                total_time=total_time_all,
                total_gold=total_gold_all,
                total_shortcuts=total_shortcuts,
                total_rollovers=total_rollovers
            )

            self.vehicle_model.update(race['vehicle_id'], is_active=0)

            return {
                'race_completed': True,
                'all_tracks_done': True,
                'total_time': total_time_all,
                'position': position,
                'gold_earned': gold,
                'total_gold': new_gold
            }

        return {
            'race_completed': True,
            'all_tracks_done': False,
            'total_time': actual_time,
            'position': position,
            'gold_earned': gold,
            'total_gold': new_gold
        }

    def _calculate_position(self, time: float, track_index: int) -> int:
        base_times = [90, 85, 100, 95, 110, 80, 120, 105]
        base_time = base_times[track_index]

        if time < base_time * 0.8:
            return 1
        elif time < base_time * 0.95:
            return 2
        elif time < base_time * 1.1:
            return 3
        elif time < base_time * 1.25:
            return 4
        else:
            return 5

    def _calculate_gold(self, position: int) -> int:
        gold_rewards = {1: 500, 2: 400, 3: 300, 4: 200, 5: 100}
        return gold_rewards.get(position, 100)

    def get_race_progress(self, vehicle_id: int) -> Dict[str, Any]:
        races = self.race_model.get_all_by_vehicle(vehicle_id)
        return {
            'total_tracks': 8,
            'completed_count': len([r for r in races if r['status'] == 'finished']),
            'races': races
        }

    def get_leaderboard(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.leaderboard_model.get_top(limit)

    def get_upgrade_options(self) -> Dict[str, Any]:
        return self.UPGRADES

    def get_tracks(self) -> List[Dict[str, Any]]:
        return self.TRACKS

    def update_vehicle_tire_wear(self, vehicle_id: int, wear_increase: int) -> Dict[str, Any]:
        vehicle = self.vehicle_model.get_by_id(vehicle_id)
        if not vehicle:
            raise ValueError('Vehicle not found')

        new_wear = min(100, vehicle['tire_wear'] + wear_increase)
        self.vehicle_model.update(vehicle_id, tire_wear=new_wear)
        return self.vehicle_model.get_by_id(vehicle_id)

    def get_upgrade_history(self, vehicle_id: int) -> List[Dict[str, Any]]:
        return self.upgrade_log_model.get_by_vehicle(vehicle_id)
