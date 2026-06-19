import random
from typing import Dict, Any, List, Optional
from .game_data import (
    TECH_TREE, MUTUALLY_EXCLUSIVE_PAIRS, SEASON_ORDER, SEASON_EFFECTS,
    BUILDING_DEFINITIONS, MILITARY_UNITS, ERA_ADVANCE_REQUIREMENTS,
    JOB_RESOURCE_MAPPING, TRADE_RATES, TECH_ERA_ORDER, ERA_NAMES,
    TRIBESPERSON_NAMES, FOREIGN_TRIBE_TEMPLATES
)


class GameEngine:

    @staticmethod
    def get_tech_tree() -> Dict[str, Any]:
        return TECH_TREE

    @staticmethod
    def get_tech(tech_id: str) -> Optional[Dict[str, Any]]:
        return TECH_TREE.get(tech_id)

    @staticmethod
    def can_research_tech(tech_id: str, researched_ids: List[str],
                          era: str, knowledge: int) -> Dict[str, Any]:
        tech = TECH_TREE.get(tech_id)
        if not tech:
            return {'can': False, 'reason': f'科技 {tech_id} 不存在'}

        if tech_id in researched_ids:
            return {'can': False, 'reason': f'{tech["name"]} 已经研究完成'}

        if TECH_ERA_ORDER.get(tech['era'], 0) > TECH_ERA_ORDER.get(era, 0):
            return {'can': False, 'reason': f'{tech["name"]} 需要{ERA_NAMES[tech["era"]]}才能研究'}

        for prereq in tech['prerequisites']:
            if prereq not in researched_ids:
                prereq_tech = TECH_TREE.get(prereq)
                prereq_name = prereq_tech['name'] if prereq_tech else prereq
                return {'can': False, 'reason': f'需要先研究 {prereq_name}'}

        for pair_a, pair_b in MUTUALLY_EXCLUSIVE_PAIRS:
            if tech_id == pair_a and pair_b in researched_ids:
                pair_name = TECH_TREE.get(pair_b, {}).get('name', pair_b)
                return {'can': False, 'reason': f'与已研究的 {pair_name} 互斥，无法同时选择'}
            if tech_id == pair_b and pair_a in researched_ids:
                pair_name = TECH_TREE.get(pair_a, {}).get('name', pair_a)
                return {'can': False, 'reason': f'与已研究的 {pair_name} 互斥，无法同时选择'}

        if knowledge < tech['cost']:
            return {'can': False, 'reason': f'知识不足，需要 {tech["cost"]}，当前 {knowledge}'}

        return {'can': True, 'reason': ''}

    @staticmethod
    def get_available_techs(researched_ids: List[str], era: str,
                            knowledge: int) -> List[Dict[str, Any]]:
        available = []
        for tech_id, tech in TECH_TREE.items():
            result = GameEngine.can_research_tech(tech_id, researched_ids, era, knowledge)
            if result['can']:
                available.append({
                    'tech_id': tech_id,
                    'name': tech['name'],
                    'cost': tech['cost'],
                    'era': tech['era'],
                    'description': tech['description'],
                    'effects': tech['effects'],
                    'mutually_exclusive_with': tech['mutually_exclusive_with'],
                })
        return available

    @staticmethod
    def get_locked_techs(researched_ids: List[str], era: str) -> List[Dict[str, Any]]:
        locked = []
        for tech_id, tech in TECH_TREE.items():
            if tech_id in researched_ids:
                continue
            result = GameEngine.can_research_tech(tech_id, researched_ids, era, 999999)
            if not result['can']:
                locked.append({
                    'tech_id': tech_id,
                    'name': tech['name'],
                    'era': tech['era'],
                    'reason': result['reason'],
                })
        return locked

    @staticmethod
    def calculate_resource_production(tribespeople: List[Dict[str, Any]],
                                      buildings: List[Dict[str, Any]],
                                      researched_ids: List[str],
                                      season: str) -> Dict[str, float]:
        season_effects = SEASON_EFFECTS[season]
        production = {'food': 0.0, 'wood': 0.0, 'stone': 0.0, 'metal': 0.0, 'knowledge': 0.0}

        for person in tribespeople:
            job = person.get('job', 'idle')
            base_output = JOB_RESOURCE_MAPPING.get(job, {})
            skill_key = f'skill_{job}' if job in ['gatherer', 'hunter', 'builder', 'researcher'] else None
            skill_mult = 1.0
            if skill_key and skill_key in person:
                skill_mult = 0.5 + person[skill_key]

            for resource, amount in base_output.items():
                modifier = season_effects.get(f'{resource}_modifier', 1.0)
                production[resource] += amount * skill_mult * modifier

        tech_bonuses = {'food_production': 0, 'wood_production': 0, 'stone_production': 0,
                        'metal_production': 0, 'knowledge_production': 0,
                        'gathering_bonus': 0, 'hunting_bonus': 0,
                        'research_bonus': 0, 'military_bonus': 0,
                        'trade_bonus': 0, 'building_speed': 0,
                        'food_preservation': 0, 'defense_bonus': 0,
                        'max_population_bonus': 0, 'morale_bonus': 0}
        for tech_id in researched_ids:
            tech = TECH_TREE.get(tech_id)
            if tech:
                for key, value in tech['effects'].items():
                    if key in tech_bonuses:
                        tech_bonuses[key] += value

        for building in buildings:
            if building.get('is_constructing'):
                continue
            bldg_def = BUILDING_DEFINITIONS.get(building['building_type'])
            if bldg_def:
                level = building.get('level', 1)
                for key, value in bldg_def['effects'].items():
                    if key in tech_bonuses:
                        tech_bonuses[key] += value * level

        production['food'] += tech_bonuses['food_production'] * season_effects['food_modifier']
        production['wood'] += tech_bonuses['wood_production'] * season_effects['wood_modifier']
        production['stone'] += tech_bonuses['stone_production'] * season_effects['stone_modifier']
        production['metal'] += tech_bonuses['metal_production'] * season_effects['metal_modifier']
        production['knowledge'] += tech_bonuses['knowledge_production'] * season_effects['research_modifier']

        if tech_bonuses['gathering_bonus'] > 0:
            for person in tribespeople:
                if person.get('job') == 'gatherer':
                    production['food'] += production['food'] * tech_bonuses['gathering_bonus'] * 0.1

        if tech_bonuses['hunting_bonus'] > 0:
            for person in tribespeople:
                if person.get('job') == 'hunter':
                    production['food'] += production['food'] * tech_bonuses['hunting_bonus'] * 0.1

        return {k: max(0, round(v, 1)) for k, v in production.items()}

    @staticmethod
    def calculate_food_consumption(population: int, season: str,
                                   researched_ids: List[str]) -> int:
        season_effects = SEASON_EFFECTS[season]
        base_consumption = population * 2
        consumption = int(base_consumption * season_effects['food_consumption'])

        preservation = 0
        for tech_id in researched_ids:
            tech = TECH_TREE.get(tech_id)
            if tech and 'food_preservation' in tech['effects']:
                preservation += tech['food_preservation']

        consumption = int(consumption * (1 - min(preservation, 0.5)))
        return max(1, consumption)

    @staticmethod
    def advance_season(current_season: str, current_year: int) -> Dict[str, Any]:
        idx = SEASON_ORDER.index(current_season)
        if idx == 3:
            return {'season': 'spring', 'year': current_year + 1}
        return {'season': SEASON_ORDER[idx + 1], 'year': current_year}

    @staticmethod
    def can_advance_era(current_era: str, researched_ids: List[str]) -> Dict[str, Any]:
        era_idx = TECH_ERA_ORDER.get(current_era, 0)
        next_era_idx = era_idx + 1
        next_era = None
        for e, idx in TECH_ERA_ORDER.items():
            if idx == next_era_idx:
                next_era = e
                break

        if not next_era:
            return {'can': False, 'reason': '已达最高时代'}

        requirements = ERA_ADVANCE_REQUIREMENTS.get(next_era, {})
        required_tech = requirements.get('required_tech')
        min_techs = requirements.get('min_techs', 0)

        if required_tech and required_tech not in researched_ids:
            tech_name = TECH_TREE.get(required_tech, {}).get('name', required_tech)
            return {'can': False, 'reason': f'需要研究 {tech_name}'}

        era_techs = [t for t in researched_ids if TECH_TREE.get(t, {}).get('era') == current_era]
        if len(era_techs) < min_techs:
            return {'can': False, 'reason': f'需要至少研究 {min_techs} 项{ERA_NAMES[current_era]}科技'}

        return {'can': True, 'next_era': next_era, 'reason': ''}

    @staticmethod
    def calculate_military_strength(tribespeople: List[Dict[str, Any]],
                                    buildings: List[Dict[str, Any]],
                                    researched_ids: List[str]) -> int:
        strength = 0
        for person in tribespeople:
            if person.get('job') == 'soldier':
                strength += 5 + int(person.get('skill_military', 0.3) * 10)

        for tech_id in researched_ids:
            tech = TECH_TREE.get(tech_id)
            if tech:
                strength += int(tech['effects'].get('military_bonus', 0) * 20)

        for building in buildings:
            if building.get('is_constructing'):
                continue
            bldg_def = BUILDING_DEFINITIONS.get(building['building_type'])
            if bldg_def:
                strength += int(bldg_def['effects'].get('military_bonus', 0) * 10 * building.get('level', 1))

        return strength

    @staticmethod
    def calculate_max_population(buildings: List[Dict[str, Any]],
                                 researched_ids: List[str]) -> int:
        base = 10
        bonus = 0
        for building in buildings:
            if building.get('is_constructing'):
                continue
            bldg_def = BUILDING_DEFINITIONS.get(building['building_type'])
            if bldg_def:
                bonus += bldg_def['effects'].get('max_population_bonus', 0) * building.get('level', 1)

        for tech_id in researched_ids:
            tech = TECH_TREE.get(tech_id)
            if tech:
                bonus += tech['effects'].get('max_population_bonus', 0)

        return base + bonus

    @staticmethod
    def calculate_morale(buildings: List[Dict[str, Any]],
                         researched_ids: List[str], season: str,
                         food: int, consumption: int) -> int:
        base = 50
        bonus = 0
        for building in buildings:
            if building.get('is_constructing'):
                continue
            bldg_def = BUILDING_DEFINITIONS.get(building['building_type'])
            if bldg_def:
                bonus += bldg_def['effects'].get('morale_bonus', 0)

        for tech_id in researched_ids:
            tech = TECH_TREE.get(tech_id)
            if tech:
                bonus += tech['effects'].get('morale_bonus', 0)

        if season == 'winter':
            bonus -= 10
        if season == 'autumn':
            bonus += 5

        if food < consumption:
            bonus -= 20
        elif food < consumption * 2:
            bonus -= 5
        else:
            bonus += 5

        return max(0, min(100, base + bonus))

    @staticmethod
    def generate_tribesperson_name() -> str:
        return random.choice(TRIBESPERSON_NAMES)

    @staticmethod
    def generate_random_skills() -> Dict[str, float]:
        return {
            'skill_gathering': round(random.uniform(0.2, 1.0), 2),
            'skill_hunting': round(random.uniform(0.1, 0.9), 2),
            'skill_building': round(random.uniform(0.2, 0.8), 2),
            'skill_research': round(random.uniform(0.1, 0.7), 2),
            'skill_military': round(random.uniform(0.1, 0.8), 2),
            'skill_trade': round(random.uniform(0.1, 0.6), 2),
        }

    @staticmethod
    def get_building_cost(building_type: str, level: int = 1) -> Optional[Dict[str, int]]:
        bldg_def = BUILDING_DEFINITIONS.get(building_type)
        if not bldg_def:
            return None
        base_cost = bldg_def['cost']
        return {
            'wood': int(base_cost['wood'] * (1.5 ** (level - 1))),
            'stone': int(base_cost['stone'] * (1.5 ** (level - 1))),
            'metal': int(base_cost['metal'] * (1.5 ** (level - 1)))
        }

    @staticmethod
    def can_build(building_type: str, tribe_resources: Dict[str, int],
                  era: str, level: int = 1) -> Dict[str, Any]:
        bldg_def = BUILDING_DEFINITIONS.get(building_type)
        if not bldg_def:
            return {'can': False, 'reason': f'建筑 {building_type} 不存在'}

        if TECH_ERA_ORDER.get(bldg_def['era'], 0) > TECH_ERA_ORDER.get(era, 0):
            return {'can': False, 'reason': f'{bldg_def["name"]} 需要{ERA_NAMES[bldg_def["era"]]}才能建造'}

        cost = GameEngine.get_building_cost(building_type, level)
        for resource, amount in cost.items():
            if amount > 0 and tribe_resources.get(resource, 0) < amount:
                return {'can': False, 'reason': f'{resource}不足，需要{amount}，当前{tribe_resources.get(resource, 0)}'}

        return {'can': True, 'cost': cost, 'reason': ''}

    @staticmethod
    def get_available_buildings(era: str, researched_ids: List[str],
                                tribe_resources: Dict[str, int]) -> List[Dict[str, Any]]:
        available = []
        for bldg_type, bldg_def in BUILDING_DEFINITIONS.items():
            if TECH_ERA_ORDER.get(bldg_def['era'], 0) > TECH_ERA_ORDER.get(era, 0):
                continue
            if bldg_type not in ['hut', 'farm', 'stone_quarry']:
                unlocked = False
                for tech_id, tech in TECH_TREE.items():
                    if tech_id in researched_ids and bldg_type in tech.get('unlocks_buildings', []):
                        unlocked = True
                        break
                if not unlocked:
                    continue

            cost = GameEngine.get_building_cost(bldg_type, 1)
            can_afford = all(
                tribe_resources.get(r, 0) >= amt for r, amt in cost.items() if amt > 0
            )
            available.append({
                'building_type': bldg_type,
                'name': bldg_def['name'],
                'era': bldg_def['era'],
                'cost': cost,
                'effects': bldg_def['effects'],
                'description': bldg_def['description'],
                'max_level': bldg_def['max_level'],
                'can_afford': can_afford,
            })
        return available

    @staticmethod
    def calculate_trade(foreign_tribe: Dict[str, Any],
                        offered_resource: str, offered_amount: int,
                        requested_resource: str) -> Dict[str, Any]:
        offered_value = offered_amount * TRADE_RATES.get(offered_resource, 1.0)
        attitude_mult = {'friendly': 1.2, 'neutral': 1.0, 'hostile': 0.6, 'ally': 1.4}
        mult = attitude_mult.get(foreign_tribe.get('attitude', 'neutral'), 1.0)
        received_value = offered_value * mult * 0.8
        received_rate = TRADE_RATES.get(requested_resource, 1.0)
        received_amount = int(received_value / received_rate)

        if foreign_tribe.get('specialty_resource') == requested_resource:
            received_amount = int(received_amount * 1.5)

        return {
            'offered_resource': offered_resource,
            'offered_amount': offered_amount,
            'requested_resource': requested_resource,
            'received_amount': max(1, received_amount),
            'attitude_modifier': mult
        }

    @staticmethod
    def resolve_battle(tribe_strength: int, foreign_strength: int,
                       tribe_morale: int) -> Dict[str, Any]:
        morale_mult = tribe_morale / 100.0
        effective_strength = int(tribe_strength * morale_mult)
        total = effective_strength + foreign_strength
        if total == 0:
            return {'result': 'draw', 'losses': 0, 'gains': 0}

        win_chance = effective_strength / total
        roll = random.random()

        if roll < win_chance * 0.8:
            losses = max(1, int(effective_strength * random.uniform(0.05, 0.15)))
            gains = int(foreign_strength * random.uniform(0.3, 0.6))
            return {'result': 'victory', 'losses': losses, 'gains': gains,
                    'loot': {'food': random.randint(5, 20), 'wood': random.randint(3, 15),
                             'metal': random.randint(1, 8)}}
        elif roll < win_chance * 0.8 + (1 - win_chance) * 0.7:
            losses = int(effective_strength * random.uniform(0.1, 0.3))
            return {'result': 'draw', 'losses': losses, 'gains': 0, 'loot': {}}
        else:
            losses = int(effective_strength * random.uniform(0.3, 0.6))
            penalty = {'food': random.randint(10, 30), 'wood': random.randint(5, 15)}
            return {'result': 'defeat', 'losses': losses, 'gains': 0,
                    'penalty': penalty}

    @staticmethod
    def process_turn(tribe: Dict[str, Any], tribespeople: List[Dict[str, Any]],
                     buildings: List[Dict[str, Any]], researched_ids: List[str]) -> Dict[str, Any]:
        season = tribe['season']
        year = tribe['year']

        production = GameEngine.calculate_resource_production(
            tribespeople, buildings, researched_ids, season)
        consumption = GameEngine.calculate_food_consumption(
            tribe['population'], season, researched_ids)
        max_pop = GameEngine.calculate_max_population(buildings, researched_ids)
        morale = GameEngine.calculate_morale(
            buildings, researched_ids, season, tribe['food'], consumption)

        new_food = tribe['food'] + int(production['food']) - consumption
        new_wood = tribe['wood'] + int(production['wood'])
        new_stone = tribe['stone'] + int(production['stone'])
        new_metal = tribe['metal'] + int(production['metal'])
        new_knowledge = tribe['knowledge'] + int(production['knowledge'])

        new_food = max(0, new_food)
        new_wood = max(0, new_wood)
        new_stone = max(0, new_stone)
        new_metal = max(0, new_metal)
        new_knowledge = max(0, new_knowledge)

        new_population = tribe['population']
        if new_food <= 0 and season == 'winter':
            new_population = max(1, new_population - random.randint(1, 3))
        elif morale > 80 and new_food > consumption * 2 and new_population < max_pop:
            if random.random() < 0.3:
                new_population = min(max_pop, new_population + 1)

        next_season = GameEngine.advance_season(season, year)
        new_turn = tribe['turn'] + 1

        era_check = GameEngine.can_advance_era(tribe['era'], researched_ids)
        era_advance = None
        if era_check['can']:
            era_advance = era_check['next_era']

        return {
            'food': new_food, 'wood': new_wood, 'stone': new_stone,
            'metal': new_metal, 'knowledge': new_knowledge,
            'population': new_population, 'max_population': max_pop,
            'morale': morale, 'season': next_season['season'],
            'year': next_season['year'], 'turn': new_turn,
            'production': production, 'consumption': consumption,
            'era_advance': era_advance,
        }

    @staticmethod
    def get_tech_tree_visual() -> List[Dict[str, Any]]:
        nodes = []
        edges = []
        for tech_id, tech in TECH_TREE.items():
            nodes.append({
                'id': tech_id,
                'name': tech['name'],
                'era': tech['era'],
                'cost': tech['cost'],
                'description': tech['description'],
                'effects': tech['effects'],
                'mutually_exclusive_with': tech['mutually_exclusive_with'],
                'position': tech['position'],
                'prerequisites': tech['prerequisites'],
            })
            for prereq in tech['prerequisites']:
                edges.append({'from': prereq, 'to': tech_id})

        for pair_a, pair_b in MUTUALLY_EXCLUSIVE_PAIRS:
            edges.append({'from': pair_a, 'to': pair_b, 'type': 'exclusive'})

        return {'nodes': nodes, 'edges': edges}
