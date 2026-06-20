import random
import math
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from app.model.citystate import CityStateModel, BuildingModel, MarketRateModel, InvasionEventModel


class CityStateBusiness:
    GRID_SIZE = 10
    SEASONS = ['spring', 'summer', 'autumn', 'winter']
    SEASON_NAMES = {'spring': '春季', 'summer': '夏季', 'autumn': '秋季', 'winter': '冬季'}

    def __init__(self):
        self.city_state_model = CityStateModel()
        self.building_model = BuildingModel()
        self.market_rate_model = MarketRateModel()
        self.invasion_event_model = InvasionEventModel()

    def _generate_player_id(self) -> str:
        return f"player_{random.randint(100000, 999999)}"

    def _calculate_prosperity(self, city: Dict[str, Any], buildings: List[Dict[str, Any]]) -> int:
        building_count = len([b for b in buildings if b.get('status') == 'active'])
        resource_total = city.get('food', 0) + city.get('stone', 0) + city.get('wood', 0) + city.get('gold', 0)
        prosperity = building_count * 10 + resource_total // 10 + city.get('population', 0) * 5
        return prosperity

    def _calculate_defense_power(self, city_id: int, buildings: List[Dict[str, Any]]) -> int:
        wall_count = len([b for b in buildings if b.get('building_type') == 'wall' and b.get('status') == 'active'])
        total_stone = 0
        city = self.city_state_model.get_by_id(city_id)
        if city:
            total_stone = city.get('stone', 0)
        defense = wall_count * 20 + total_stone * 2
        return defense

    def _calculate_max_population(self, buildings: List[Dict[str, Any]]) -> int:
        house_count = len([b for b in buildings if b.get('building_type') == 'house' and b.get('status') == 'active'])
        return house_count * 8

    def _process_time_progression(self, city: Dict[str, Any], buildings: List[Dict[str, Any]]) -> Dict[str, Any]:
        last_update_str = city.get('last_update')
        if not last_update_str:
            return city

        try:
            last_update = datetime.fromisoformat(last_update_str)
        except (ValueError, TypeError):
            return city

        now = datetime.now()
        elapsed_minutes = (now - last_update).total_seconds() / 60

        if elapsed_minutes < 1:
            return city

        elapsed_minutes = int(elapsed_minutes)

        farm_count = len([b for b in buildings if b.get('building_type') == 'farm' and b.get('status') == 'active'])
        barracks_count = len([b for b in buildings if b.get('building_type') == 'barracks' and b.get('status') == 'active'])

        food_production = farm_count * 6 * elapsed_minutes
        new_food = city.get('food', 0) + food_production

        new_soldiers = city.get('soldiers', 0)
        food_consumption = 0

        if barracks_count > 0 and city.get('population', 0) > 0:
            max_new_soldiers = barracks_count * elapsed_minutes
            actual_new = min(max_new_soldiers, city.get('population', 0))
            food_needed = actual_new * 3

            if new_food >= food_needed:
                new_soldiers += actual_new
                food_consumption = food_needed
                new_food -= food_consumption

        new_food = max(0, new_food)

        total_months_elapsed = elapsed_minutes // 30
        if total_months_elapsed > 0:
            current_season_idx = self.SEASONS.index(city.get('current_season', 'spring'))
            total_seasons = total_months_elapsed // 3
            years_passed = total_seasons // 4
            new_season_idx = (current_season_idx + total_seasons) % 4
            new_year = city.get('current_year', 1) + years_passed

            city['current_season'] = self.SEASONS[new_season_idx]
            city['current_year'] = new_year

        city['food'] = new_food
        city['soldiers'] = new_soldiers
        city['last_update'] = now.isoformat()

        self.city_state_model.update_resources(
            record_id=city['id'],
            food=new_food,
            soldiers=new_soldiers,
            current_year=city['current_year'],
            current_season=city['current_season']
        )

        return city

    def _check_and_refresh_market_rates(self, city_id: int) -> Dict[str, float]:
        latest_rates = self.market_rate_model.get_latest(city_id)
        now = datetime.now()

        should_refresh = False
        if not latest_rates:
            should_refresh = True
        else:
            try:
                refresh_time = datetime.fromisoformat(latest_rates.get('refresh_time'))
                elapsed_hours = (now - refresh_time).total_seconds() / 3600
                if elapsed_hours >= 1:
                    should_refresh = True
            except (ValueError, TypeError):
                should_refresh = True

        if should_refresh:
            rates = {
                'food_to_gold': round(random.uniform(0.8, 1.5), 2),
                'stone_to_gold': round(random.uniform(0.8, 1.5), 2),
                'wood_to_gold': round(random.uniform(0.8, 1.5), 2),
                'gold_to_food': round(random.uniform(0.8, 1.5), 2),
                'gold_to_stone': round(random.uniform(0.8, 1.5), 2),
                'gold_to_wood': round(random.uniform(0.8, 1.5), 2)
            }
            self.market_rate_model.create(city_id, rates)
            return rates

        return {
            'food_to_gold': latest_rates.get('food_to_gold', 1.0),
            'stone_to_gold': latest_rates.get('stone_to_gold', 1.0),
            'wood_to_gold': latest_rates.get('wood_to_gold', 1.0),
            'gold_to_food': latest_rates.get('gold_to_food', 1.0),
            'gold_to_stone': latest_rates.get('gold_to_stone', 1.0),
            'gold_to_wood': latest_rates.get('gold_to_wood', 1.0),
            'refresh_time': latest_rates.get('refresh_time')
        }

    def init_game(self, player_id: str = None) -> Dict[str, Any]:
        if not player_id:
            player_id = self._generate_player_id()

        existing = self.city_state_model.get_by_player_id(player_id)
        if existing:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'player_id': player_id,
                    'city_state_id': existing.get('id')
                }
            }

        city_id = self.city_state_model.create(player_id)

        rates = {
            'food_to_gold': 1.0,
            'stone_to_gold': 1.0,
            'wood_to_gold': 1.0,
            'gold_to_food': 1.0,
            'gold_to_stone': 1.0,
            'gold_to_wood': 1.0
        }
        self.market_rate_model.create(city_id, rates)

        return {
            'code': 0,
            'message': 'Game initialized successfully',
            'data': {
                'player_id': player_id,
                'city_state_id': city_id
            }
        }

    def get_game_state(self, player_id: str) -> Dict[str, Any]:
        city = self.city_state_model.get_by_player_id(player_id)
        if not city:
            return {
                'code': 1,
                'message': 'Game not initialized',
                'data': None
            }

        buildings = self.building_model.get_by_city_id(city['id'])

        city = self._process_time_progression(city, buildings)

        buildings = self.building_model.get_by_city_id(city['id'])

        max_population = self._calculate_max_population(buildings)
        prosperity = self._calculate_prosperity(city, buildings)
        defense_power = self._calculate_defense_power(city['id'], buildings)

        if max_population != city.get('max_population') or prosperity != city.get('prosperity') or defense_power != city.get('defense_power'):
            self.city_state_model.update_resources(
                record_id=city['id'],
                max_population=max_population,
                prosperity=prosperity,
                defense_power=defense_power
            )
            city['max_population'] = max_population
            city['prosperity'] = prosperity
            city['defense_power'] = defense_power

        if city.get('population', 0) < max_population:
            natural_growth = min(1, max_population - city.get('population', 0))
            new_pop = city.get('population', 0) + natural_growth
            self.city_state_model.update_resources(record_id=city['id'], population=new_pop)
            city['population'] = new_pop

        market_rates = self._check_and_refresh_market_rates(city['id'])

        grid = [[None for _ in range(self.GRID_SIZE)] for _ in range(self.GRID_SIZE)]
        for building in buildings:
            if building.get('status') == 'active':
                x = building.get('grid_x')
                y = building.get('grid_y')
                if 0 <= x < self.GRID_SIZE and 0 <= y < self.GRID_SIZE:
                    grid[y][x] = {
                        'id': building.get('id'),
                        'type': building.get('building_type'),
                        'name': BuildingModel.BUILDING_TYPES[building.get('building_type')]['name'],
                        'level': building.get('level')
                    }

        building_counts = {}
        for btype in BuildingModel.BUILDING_TYPES.keys():
            building_counts[btype] = self.building_model.count_by_type(city['id'], btype)

        last_invasion = self.invasion_event_model.get_last_invasion(city['id'])

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'city_state': {
                    'id': city.get('id'),
                    'player_id': city.get('player_id'),
                    'food': city.get('food', 0),
                    'stone': city.get('stone', 0),
                    'wood': city.get('wood', 0),
                    'gold': city.get('gold', 0),
                    'population': city.get('population', 0),
                    'max_population': max_population,
                    'soldiers': city.get('soldiers', 0),
                    'prosperity': prosperity,
                    'defense_power': defense_power,
                    'current_year': city.get('current_year', 1),
                    'current_season': city.get('current_season', 'spring'),
                    'current_season_name': self.SEASON_NAMES.get(city.get('current_season'), '春季')
                },
                'grid': grid,
                'grid_size': self.GRID_SIZE,
                'building_counts': building_counts,
                'building_types': BuildingModel.BUILDING_TYPES,
                'market_rates': market_rates,
                'last_invasion': last_invasion,
                'is_winter': city.get('current_season') == 'winter'
            }
        }

    def build_structure(self, player_id: str, building_type: str, grid_x: int, grid_y: int) -> Dict[str, Any]:
        if building_type not in BuildingModel.BUILDING_TYPES:
            return {
                'code': 1,
                'message': f'Invalid building type: {building_type}',
                'data': None
            }

        if not (0 <= grid_x < self.GRID_SIZE and 0 <= grid_y < self.GRID_SIZE):
            return {
                'code': 1,
                'message': 'Position out of bounds',
                'data': None
            }

        city = self.city_state_model.get_by_player_id(player_id)
        if not city:
            return {
                'code': 1,
                'message': 'Game not initialized',
                'data': None
            }

        existing = self.building_model.get_by_position(city['id'], grid_x, grid_y)
        if existing and existing.get('status') == 'active':
            return {
                'code': 1,
                'message': 'Position already occupied',
                'data': None
            }

        building_info = BuildingModel.BUILDING_TYPES[building_type]
        cost = building_info['cost']

        for resource, amount in cost.items():
            if city.get(resource, 0) < amount:
                return {
                    'code': 1,
                    'message': f'Insufficient {resource}: need {amount}, have {city.get(resource, 0)}',
                    'data': None
                }

        resource_updates = {}
        for resource, amount in cost.items():
            resource_updates[resource] = city.get(resource, 0) - amount

        self.city_state_model.update_resources(record_id=city['id'], **resource_updates)

        building_id = self.building_model.create(city['id'], building_type, grid_x, grid_y)

        return {
            'code': 0,
            'message': f'{building_info["name"]} built successfully',
            'data': {
                'building_id': building_id,
                'building_type': building_type,
                'position': {'x': grid_x, 'y': grid_y}
            }
        }

    def demolish_structure(self, player_id: str, building_id: int) -> Dict[str, Any]:
        city = self.city_state_model.get_by_player_id(player_id)
        if not city:
            return {
                'code': 1,
                'message': 'Game not initialized',
                'data': None
            }

        building = self.building_model.query.find_by_id(building_id)
        if not building or building.get('city_state_id') != city['id']:
            return {
                'code': 1,
                'message': 'Building not found',
                'data': None
            }

        if building.get('status') != 'active':
            return {
                'code': 1,
                'message': 'Building already demolished',
                'data': None
            }

        building_info = BuildingModel.BUILDING_TYPES.get(building.get('building_type'))
        if building_info:
            cost = building_info.get('cost', {})
            resource_updates = {}
            for resource, amount in cost.items():
                refund = amount // 2
                resource_updates[resource] = city.get(resource, 0) + refund
            self.city_state_model.update_resources(record_id=city['id'], **resource_updates)

        self.building_model.update_status(building_id, 'demolished')

        return {
            'code': 0,
            'message': 'Building demolished successfully, 50% resources refunded',
            'data': None
        }

    def trade_resources(self, player_id: str, from_resource: str, to_resource: str, amount: int) -> Dict[str, Any]:
        if amount <= 0:
            return {
                'code': 1,
                'message': 'Amount must be positive',
                'data': None
            }

        valid_resources = ['food', 'stone', 'wood', 'gold']
        if from_resource not in valid_resources or to_resource not in valid_resources:
            return {
                'code': 1,
                'message': 'Invalid resource type',
                'data': None
            }

        if from_resource == to_resource:
            return {
                'code': 1,
                'message': 'Cannot trade same resource',
                'data': None
            }

        city = self.city_state_model.get_by_player_id(player_id)
        if not city:
            return {
                'code': 1,
                'message': 'Game not initialized',
                'data': None
            }

        if city.get(from_resource, 0) < amount:
            return {
                'code': 1,
                'message': f'Insufficient {from_resource}',
                'data': None
            }

        markets = self.building_model.get_by_type(city['id'], 'market')
        if not markets:
            return {
                'code': 1,
                'message': 'Need to build a market first',
                'data': None
            }

        rates = self._check_and_refresh_market_rates(city['id'])

        rate_key = f'{from_resource}_to_{to_resource}'
        if rate_key in rates:
            rate = rates[rate_key]
        else:
            reverse_key = f'{to_resource}_to_{from_resource}'
            if reverse_key in rates and rates[reverse_key] > 0:
                rate = 1.0 / rates[reverse_key]
            else:
                rate = 1.0

        received_amount = int(amount * rate)

        if received_amount <= 0:
            return {
                'code': 1,
                'message': 'Trade amount too small',
                'data': None
            }

        self.city_state_model.update_resources(
            record_id=city['id'],
            **{
                from_resource: city.get(from_resource, 0) - amount,
                to_resource: city.get(to_resource, 0) + received_amount
            }
        )

        return {
            'code': 0,
            'message': 'Trade successful',
            'data': {
                'from': from_resource,
                'to': to_resource,
                'given': amount,
                'received': received_amount,
                'rate': rate
            }
        }

    def trigger_invasion(self, player_id: str) -> Dict[str, Any]:
        city = self.city_state_model.get_by_player_id(player_id)
        if not city:
            return {
                'code': 1,
                'message': 'Game not initialized',
                'data': None
            }

        if city.get('current_season') != 'winter':
            return {
                'code': 1,
                'message': 'Invasions only happen in winter',
                'data': None
            }

        last_invasion = self.invasion_event_model.get_last_invasion(city['id'])
        if last_invasion and last_invasion.get('invasion_year') == city.get('current_year'):
            return {
                'code': 1,
                'message': 'Already invaded this year',
                'data': None
            }

        prosperity = city.get('prosperity', 0)
        year = city.get('current_year', 1)
        invasion_strength = prosperity + year * 20

        buildings = self.building_model.get_by_city_id(city['id'])
        defense_power = self._calculate_defense_power(city['id'], buildings)
        soldiers = city.get('soldiers', 0)
        total_defense = defense_power + soldiers * 10

        result = 'victory' if total_defense >= invasion_strength else 'defeat'

        food_lost = 0
        gold_lost = 0
        soldiers_lost = 0
        population_lost = 0
        description = ''

        if result == 'victory':
            soldiers_lost = min(soldiers, int(invasion_strength * 0.1))
            description = f'城邦成功抵御了蛮族入侵！敌军兵力{invasion_strength}，我方防御{total_defense}。损失士兵{soldiers_lost}人。'
        else:
            damage_ratio = (invasion_strength - total_defense) / invasion_strength
            food_lost = int(city.get('food', 0) * damage_ratio * 0.5)
            gold_lost = int(city.get('gold', 0) * damage_ratio * 0.3)
            soldiers_lost = soldiers
            population_lost = int(city.get('population', 0) * damage_ratio * 0.2)
            description = f'城邦被蛮族攻破！敌军兵力{invasion_strength}，我方防御{total_defense}。损失粮食{food_lost}、金币{gold_lost}、士兵{soldiers_lost}人、人口{population_lost}人。'

        self.city_state_model.update_resources(
            record_id=city['id'],
            food=max(0, city.get('food', 0) - food_lost),
            gold=max(0, city.get('gold', 0) - gold_lost),
            soldiers=max(0, soldiers - soldiers_lost),
            population=max(0, city.get('population', 0) - population_lost)
        )

        self.invasion_event_model.create(
            city_state_id=city['id'],
            invasion_year=year,
            invasion_strength=invasion_strength,
            city_defense=defense_power,
            city_soldiers=soldiers,
            result=result,
            food_lost=food_lost,
            gold_lost=gold_lost,
            soldiers_lost=soldiers_lost,
            population_lost=population_lost,
            description=description
        )

        return {
            'code': 0,
            'message': 'Invasion resolved',
            'data': {
                'year': year,
                'invasion_strength': invasion_strength,
                'total_defense': total_defense,
                'result': result,
                'result_name': '胜利' if result == 'victory' else '失败',
                'food_lost': food_lost,
                'gold_lost': gold_lost,
                'soldiers_lost': soldiers_lost,
                'population_lost': population_lost,
                'description': description
            }
        }

    def get_invasion_history(self, player_id: str, limit: int = 10) -> Dict[str, Any]:
        city = self.city_state_model.get_by_player_id(player_id)
        if not city:
            return {
                'code': 1,
                'message': 'Game not initialized',
                'data': None
            }

        history = self.invasion_event_model.get_by_city_id(city['id'], limit)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'history': history
            }
        }

    def advance_season(self, player_id: str) -> Dict[str, Any]:
        city = self.city_state_model.get_by_player_id(player_id)
        if not city:
            return {
                'code': 1,
                'message': 'Game not initialized',
                'data': None
            }

        current_season_idx = self.SEASONS.index(city.get('current_season', 'spring'))
        new_season_idx = (current_season_idx + 1) % 4
        new_year = city.get('current_year', 1) + (1 if new_season_idx == 0 else 0)
        new_season = self.SEASONS[new_season_idx]

        self.city_state_model.update_resources(
            record_id=city['id'],
            current_year=new_year,
            current_season=new_season
        )

        return {
            'code': 0,
            'message': f'Season advanced to {self.SEASON_NAMES[new_season]}',
            'data': {
                'new_year': new_year,
                'new_season': new_season,
                'new_season_name': self.SEASON_NAMES[new_season],
                'is_winter': new_season == 'winter'
            }
        }
