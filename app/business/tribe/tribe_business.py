from typing import Dict, Any, List, Optional
from app.model.tribe import (
    TribeModel, TribespersonModel, BuildingModel,
    TechnologyModel, ForeignTribeModel, DiplomacyModel
)
from app.business.tribe.game_engine import GameEngine
from app.business.tribe.game_data import (
    FOREIGN_TRIBE_TEMPLATES, BUILDING_DEFINITIONS, MUTUALLY_EXCLUSIVE_PAIRS,
    ERA_NAMES, SEASON_NAMES, JOB_NAMES, JOB_RESOURCE_MAPPING
)


class TribeBusiness:
    def __init__(self):
        self.tribe_model = TribeModel()
        self.tribesperson_model = TribespersonModel()
        self.building_model = BuildingModel()
        self.technology_model = TechnologyModel()
        self.foreign_tribe_model = ForeignTribeModel()
        self.diplomacy_model = DiplomacyModel()

    def _success(self, data: Any = None, message: str = 'success') -> Dict[str, Any]:
        return {'code': 0, 'message': message, 'data': data}

    def _error(self, message: str) -> Dict[str, Any]:
        return {'code': 1, 'message': message, 'data': None}

    def _get_tribe_or_error(self, tribe_id: int) -> tuple:
        tribe = self.tribe_model.get_by_id(tribe_id)
        if not tribe:
            return None, self._error(f'Tribe {tribe_id} not found')
        return tribe, None

    def create_game(self, name: str) -> Dict[str, Any]:
        if not name or not name.strip():
            return self._error('Tribe name is required')

        tribe_id = self.tribe_model.create(name.strip())
        if not tribe_id:
            return self._error('Failed to create tribe')

        for _ in range(5):
            person_name = GameEngine.generate_tribesperson_name()
            skills = GameEngine.generate_random_skills()
            self.tribesperson_model.create(
                tribe_id=tribe_id,
                name=person_name,
                skill_gathering=skills['skill_gathering'],
                skill_hunting=skills['skill_hunting'],
                skill_building=skills['skill_building'],
                skill_research=skills['skill_research'],
                skill_military=skills['skill_military'],
                skill_trade=skills['skill_trade'],
            )

        initial_buildings = [
            ('hut', 2),
            ('farm', 1),
            ('stone_quarry', 1),
        ]
        for building_type, count in initial_buildings:
            bldg_def = BUILDING_DEFINITIONS.get(building_type)
            total_progress = bldg_def['cost']['wood'] + bldg_def['cost']['stone'] + bldg_def['cost']['metal'] if bldg_def else 100
            for _ in range(count):
                bldg_id = self.building_model.create(
                    tribe_id=tribe_id,
                    building_type=building_type,
                    total_progress=total_progress if total_progress > 0 else 100,
                )
                self.building_model.update_progress(bldg_id, total_progress, 0)

        for template in FOREIGN_TRIBE_TEMPLATES:
            ft_id = self.foreign_tribe_model.create(
                name=template['name'],
                era=template.get('era', 'stone'),
                strength=template.get('strength', 10),
                attitude=template.get('attitude', 'neutral'),
                specialty_resource=template.get('specialty_resource', 'wood'),
                trade_available=template.get('trade_available', 1),
            )
            self.diplomacy_model.create(
                tribe_id=tribe_id,
                foreign_tribe_id=ft_id,
                relation=template.get('attitude', 'neutral'),
            )

        tribe = self.tribe_model.get_by_id(tribe_id)
        if tribe:
            tribe['tribe_id'] = tribe_id
        return self._success(tribe)

    def get_tribe_info(self, tribe_id: int) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        researched_ids = self.technology_model.get_researched_ids(tribe_id)
        buildings = self.building_model.get_by_tribe(tribe_id)
        max_pop = GameEngine.calculate_max_population(buildings, researched_ids)
        consumption = GameEngine.calculate_food_consumption(tribe['population'], tribe['season'], researched_ids)
        morale = GameEngine.calculate_morale(buildings, researched_ids, tribe['season'], tribe['food'], consumption)

        tribe['max_population'] = max_pop
        tribe['morale'] = morale
        tribe['food_consumption'] = consumption
        tribe['era_name'] = ERA_NAMES.get(tribe['era'], tribe['era'])
        tribe['season_name'] = SEASON_NAMES.get(tribe['season'], tribe['season'])

        return self._success(tribe)

    def get_tribespeople(self, tribe_id: int) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        people = self.tribesperson_model.get_by_tribe(tribe_id)
        for person in people:
            job = person.get('job', 'idle')
            person['job_name'] = JOB_NAMES.get(job, job)

        return self._success(people)

    def assign_job(self, tribe_id: int, person_id: int, job: str) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        valid_jobs = list(JOB_NAMES.keys())
        if job not in valid_jobs:
            return self._error(f'Invalid job: {job}. Valid jobs: {", ".join(valid_jobs)}')

        person = self.tribesperson_model.get_by_id(person_id)
        if not person:
            return self._error(f'Tribesperson {person_id} not found')

        if person['tribe_id'] != tribe_id:
            return self._error(f'Tribesperson {person_id} does not belong to tribe {tribe_id}')

        self.tribesperson_model.assign_job(person_id, job)
        updated = self.tribesperson_model.get_by_id(person_id)
        updated['job_name'] = JOB_NAMES.get(job, job)

        return self._success(updated)

    def research_tech(self, tribe_id: int, tech_id: str) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        if not tech_id:
            return self._error('Tech ID is required')

        researched_ids = self.technology_model.get_researched_ids(tribe_id)
        check = GameEngine.can_research_tech(tech_id, researched_ids, tribe['era'], tribe['knowledge'])
        if not check['can']:
            return self._error(check['reason'])

        tech = GameEngine.get_tech(tech_id)
        cost = tech['cost']

        self.tribe_model.update(tribe_id, knowledge=tribe['knowledge'] - cost)
        self.technology_model.create(tribe_id, tech_id)

        for pair_a, pair_b in MUTUALLY_EXCLUSIVE_PAIRS:
            if tech_id == pair_a and pair_b in researched_ids:
                self.technology_model.delete_by_tribe(tribe_id)
                self.technology_model.create(tribe_id, tech_id)
                break
            if tech_id == pair_b and pair_a in researched_ids:
                self.technology_model.delete_by_tribe(tribe_id)
                self.technology_model.create(tribe_id, tech_id)
                break

        updated_tribe = self.tribe_model.get_by_id(tribe_id)
        updated_researched = self.technology_model.get_researched_ids(tribe_id)

        return self._success({
            'tribe': updated_tribe,
            'researched_techs': updated_researched,
            'tech': tech,
        })

    def build_building(self, tribe_id: int, building_type: str) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        if not building_type:
            return self._error('Building type is required')

        tribe_resources = {
            'wood': tribe['wood'],
            'stone': tribe['stone'],
            'metal': tribe['metal'],
        }

        check = GameEngine.can_build(building_type, tribe_resources, tribe['era'], 1)
        if not check['can']:
            return self._error(check['reason'])

        cost = check['cost']
        self.tribe_model.update(
            tribe_id,
            wood=tribe['wood'] - cost['wood'],
            stone=tribe['stone'] - cost['stone'],
            metal=tribe['metal'] - cost['metal'],
        )

        bldg_def = BUILDING_DEFINITIONS.get(building_type)
        total_progress = cost['wood'] + cost['stone'] + cost['metal']
        if total_progress <= 0:
            total_progress = 100

        building_id = self.building_model.create(
            tribe_id=tribe_id,
            building_type=building_type,
            total_progress=total_progress,
        )

        building = self.building_model.get_by_id(building_id)
        return self._success({
            'building': building,
            'cost': cost,
            'remaining_resources': {
                'wood': tribe['wood'] - cost['wood'],
                'stone': tribe['stone'] - cost['stone'],
                'metal': tribe['metal'] - cost['metal'],
            },
        })

    def upgrade_building(self, tribe_id: int, building_id: int) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        building = self.building_model.get_by_id(building_id)
        if not building:
            return self._error(f'Building {building_id} not found')

        if building['tribe_id'] != tribe_id:
            return self._error(f'Building {building_id} does not belong to tribe {tribe_id}')

        if building.get('is_constructing'):
            return self._error('Building is still under construction')

        bldg_def = BUILDING_DEFINITIONS.get(building['building_type'])
        if not bldg_def:
            return self._error(f'Building definition not found for type {building["building_type"]}')

        current_level = building.get('level', 1)
        max_level = bldg_def.get('max_level', 3)
        if current_level >= max_level:
            return self._error(f'Building is already at max level ({max_level})')

        new_level = current_level + 1
        tribe_resources = {
            'wood': tribe['wood'],
            'stone': tribe['stone'],
            'metal': tribe['metal'],
        }

        check = GameEngine.can_build(building['building_type'], tribe_resources, tribe['era'], new_level)
        if not check['can']:
            return self._error(check['reason'])

        cost = check['cost']
        self.tribe_model.update(
            tribe_id,
            wood=tribe['wood'] - cost['wood'],
            stone=tribe['stone'] - cost['stone'],
            metal=tribe['metal'] - cost['metal'],
        )

        total_progress = cost['wood'] + cost['stone'] + cost['metal']
        if total_progress <= 0:
            total_progress = 100

        self.building_model.upgrade(building_id, new_level, total_progress)

        updated_building = self.building_model.get_by_id(building_id)
        return self._success({
            'building': updated_building,
            'cost': cost,
        })

    def advance_turn(self, tribe_id: int) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        tribespeople = self.tribesperson_model.get_by_tribe(tribe_id)
        buildings = self.building_model.get_by_tribe(tribe_id)
        researched_ids = self.technology_model.get_researched_ids(tribe_id)

        for building in buildings:
            if building.get('is_constructing'):
                builders = self.tribesperson_model.count_by_tribe_and_job(tribe_id, 'builder')
                progress_increment = max(10, builders * 20)
                new_progress = building['progress'] + progress_increment
                if new_progress >= building['total_progress']:
                    self.building_model.update_progress(building['id'], building['total_progress'], is_constructing=0)
                else:
                    self.building_model.update_progress(building['id'], new_progress)

        buildings = self.building_model.get_by_tribe(tribe_id)

        turn_result = GameEngine.process_turn(tribe, tribespeople, buildings, researched_ids)

        self.tribe_model.advance_turn(
            tribe_id,
            season=turn_result['season'],
            year=turn_result['year'],
            turn=turn_result['turn'],
            food=turn_result['food'],
            wood=turn_result['wood'],
            stone=turn_result['stone'],
            metal=turn_result['metal'],
            knowledge=turn_result['knowledge'],
            population=turn_result['population'],
            max_population=turn_result['max_population'],
            morale=turn_result['morale'],
        )

        self.diplomacy_model.decrement_cooldowns(tribe_id)

        if tribe['population'] > turn_result['population']:
            active_soldiers = self.tribesperson_model.get_by_tribe_and_job(tribe_id, 'soldier')
            if active_soldiers:
                losses = tribe['population'] - turn_result['population']
                for i in range(min(losses, len(active_soldiers))):
                    self.tribesperson_model.delete(active_soldiers[i]['id'])

        if turn_result['population'] > tribe['population']:
            diff = turn_result['population'] - tribe['population']
            for _ in range(diff):
                person_name = GameEngine.generate_tribesperson_name()
                skills = GameEngine.generate_random_skills()
                self.tribesperson_model.create(
                    tribe_id=tribe_id,
                    name=person_name,
                    skill_gathering=skills['skill_gathering'],
                    skill_hunting=skills['skill_hunting'],
                    skill_building=skills['skill_building'],
                    skill_research=skills['skill_research'],
                    skill_military=skills['skill_military'],
                    skill_trade=skills['skill_trade'],
                )

        era_advance_notice = None
        if turn_result.get('era_advance'):
            era_advance_notice = turn_result['era_advance']

        updated_tribe = self.tribe_model.get_by_id(tribe_id)
        result = {
            'turn': turn_result['turn'],
            'season': turn_result['season'],
            'year': turn_result['year'],
            'food': turn_result['food'],
            'wood': turn_result['wood'],
            'stone': turn_result['stone'],
            'metal': turn_result['metal'],
            'knowledge': turn_result['knowledge'],
            'population': turn_result['population'],
            'max_population': turn_result['max_population'],
            'morale': turn_result['morale'],
            'production': turn_result['production'],
            'consumption': turn_result['consumption'],
            'era_advance_notice': era_advance_notice,
            'tribe': updated_tribe,
        }
        return self._success(result)

    def advance_era(self, tribe_id: int) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        researched_ids = self.technology_model.get_researched_ids(tribe_id)
        check = GameEngine.can_advance_era(tribe['era'], researched_ids)
        if not check['can']:
            return self._error(check['reason'])

        next_era = check['next_era']
        self.tribe_model.update_era(tribe_id, next_era)

        updated_tribe = self.tribe_model.get_by_id(tribe_id)
        return self._success({
            'tribe': updated_tribe,
            'previous_era': tribe['era'],
            'new_era': next_era,
            'new_era_name': ERA_NAMES.get(next_era, next_era),
        })

    def get_diplomacy(self, tribe_id: int) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        relations = self.diplomacy_model.get_by_tribe(tribe_id)
        result = []
        for rel in relations:
            foreign = self.foreign_tribe_model.get_by_id(rel['foreign_tribe_id'])
            result.append({
                'diplomacy_id': rel['id'],
                'foreign_tribe': foreign,
                'relation': rel['relation'],
                'trade_cooldown': rel['trade_cooldown'],
            })

        return self._success(result)

    def trade(self, tribe_id: int, foreign_tribe_id: int,
              offered_resource: str, offered_amount: int,
              requested_resource: str) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        foreign = self.foreign_tribe_model.get_by_id(foreign_tribe_id)
        if not foreign:
            return self._error(f'Foreign tribe {foreign_tribe_id} not found')

        diplomacy = self.diplomacy_model.get_relation(tribe_id, foreign_tribe_id)
        if not diplomacy:
            return self._error('No diplomatic relation with this foreign tribe')

        if diplomacy['relation'] == 'war':
            return self._error('Cannot trade with a tribe at war')

        if diplomacy['trade_cooldown'] > 0:
            return self._error(f'Trade cooldown: {diplomacy["trade_cooldown"]} turns remaining')

        if not foreign.get('trade_available'):
            return self._error('This foreign tribe is not available for trade')

        valid_resources = ['food', 'wood', 'stone', 'metal', 'knowledge']
        if offered_resource not in valid_resources:
            return self._error(f'Invalid offered resource: {offered_resource}')
        if requested_resource not in valid_resources:
            return self._error(f'Invalid requested resource: {requested_resource}')
        if offered_resource == requested_resource:
            return self._error('Cannot trade the same resource')

        if offered_amount <= 0:
            return self._error('Offered amount must be positive')

        if tribe.get(offered_resource, 0) < offered_amount:
            return self._error(f'Not enough {offered_resource}. Have {tribe.get(offered_resource, 0)}, need {offered_amount}')

        trade_result = GameEngine.calculate_trade(foreign, offered_resource, offered_amount, requested_resource)
        received_amount = trade_result['received_amount']

        new_offered = tribe[offered_resource] - offered_amount
        new_requested = tribe.get(requested_resource, 0) + received_amount
        update_data = {offered_resource: new_offered, requested_resource: new_requested}
        self.tribe_model.update(tribe_id, **update_data)

        self.diplomacy_model.update_trade_cooldown(tribe_id, foreign_tribe_id, 3)

        updated_tribe = self.tribe_model.get_by_id(tribe_id)
        result = {
            'offered_resource': offered_resource,
            'offered_amount': offered_amount,
            'requested_resource': requested_resource,
            'received_amount': received_amount,
            'attitude_modifier': trade_result.get('attitude_modifier'),
            'tribe': updated_tribe,
        }
        return self._success(result)

    def declare_war(self, tribe_id: int, foreign_tribe_id: int) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        foreign = self.foreign_tribe_model.get_by_id(foreign_tribe_id)
        if not foreign:
            return self._error(f'Foreign tribe {foreign_tribe_id} not found')

        diplomacy = self.diplomacy_model.get_relation(tribe_id, foreign_tribe_id)
        if not diplomacy:
            return self._error('No diplomatic relation with this foreign tribe')

        if diplomacy['relation'] == 'war':
            return self._error('Already at war with this tribe')

        self.diplomacy_model.update_relation(tribe_id, foreign_tribe_id, 'war')

        updated_diplomacy = self.diplomacy_model.get_relation(tribe_id, foreign_tribe_id)
        return self._success({
            'diplomacy': updated_diplomacy,
            'foreign_tribe': foreign,
        })

    def make_peace(self, tribe_id: int, foreign_tribe_id: int) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        foreign = self.foreign_tribe_model.get_by_id(foreign_tribe_id)
        if not foreign:
            return self._error(f'Foreign tribe {foreign_tribe_id} not found')

        diplomacy = self.diplomacy_model.get_relation(tribe_id, foreign_tribe_id)
        if not diplomacy:
            return self._error('No diplomatic relation with this foreign tribe')

        if diplomacy['relation'] != 'war':
            return self._error('Not at war with this tribe')

        import random
        peace_chance = 0.5
        if foreign.get('attitude') == 'friendly':
            peace_chance = 0.8
        elif foreign.get('attitude') == 'hostile':
            peace_chance = 0.2

        if random.random() < peace_chance:
            self.diplomacy_model.update_relation(tribe_id, foreign_tribe_id, 'neutral')
            updated_diplomacy = self.diplomacy_model.get_relation(tribe_id, foreign_tribe_id)
            return self._success({
                'diplomacy': updated_diplomacy,
                'peace_accepted': True,
                'message': 'Peace accepted',
            })
        else:
            return self._success({
                'diplomacy': diplomacy,
                'peace_accepted': False,
                'message': 'Peace offer rejected',
            })

    def battle(self, tribe_id: int, foreign_tribe_id: int) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        foreign = self.foreign_tribe_model.get_by_id(foreign_tribe_id)
        if not foreign:
            return self._error(f'Foreign tribe {foreign_tribe_id} not found')

        diplomacy = self.diplomacy_model.get_relation(tribe_id, foreign_tribe_id)
        if not diplomacy:
            return self._error('No diplomatic relation with this foreign tribe')

        if diplomacy['relation'] != 'war':
            return self._error('Must be at war to initiate a battle')

        tribespeople = self.tribesperson_model.get_by_tribe(tribe_id)
        buildings = self.building_model.get_by_tribe(tribe_id)
        researched_ids = self.technology_model.get_researched_ids(tribe_id)

        tribe_strength = GameEngine.calculate_military_strength(tribespeople, buildings, researched_ids)
        foreign_strength = foreign.get('strength', 10)
        morale = GameEngine.calculate_morale(buildings, researched_ids, tribe['season'], tribe['food'],
                                              GameEngine.calculate_food_consumption(tribe['population'], tribe['season'], researched_ids))

        battle_result = GameEngine.resolve_battle(tribe_strength, foreign_strength, morale)

        update_data = {}
        if battle_result['result'] == 'victory' and battle_result.get('loot'):
            for resource, amount in battle_result['loot'].items():
                update_data[resource] = tribe.get(resource, 0) + amount
            new_strength = max(1, foreign.get('strength', 10) - int(foreign.get('strength', 10) * 0.3))
            self.foreign_tribe_model.update(foreign_tribe_id, strength=new_strength, attitude='hostile')
        elif battle_result['result'] == 'defeat' and battle_result.get('penalty'):
            for resource, amount in battle_result['penalty'].items():
                update_data[resource] = max(0, tribe.get(resource, 0) - amount)

        if update_data:
            self.tribe_model.update(tribe_id, **update_data)

        updated_tribe = self.tribe_model.get_by_id(tribe_id)
        result = {
            'foreign_tribe_id': foreign_tribe_id,
            'tribe_strength': tribe_strength,
            'foreign_strength': foreign_strength,
            'result': battle_result['result'],
            'losses': battle_result['losses'],
            'gains': battle_result.get('gains', 0),
            'loot': battle_result.get('loot'),
            'penalty': battle_result.get('penalty'),
            'tribe': updated_tribe,
        }
        return self._success(result)

    def get_game_state(self, tribe_id: int) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        tribespeople = self.tribesperson_model.get_by_tribe(tribe_id)
        for person in tribespeople:
            job = person.get('job', 'idle')
            person['job_name'] = JOB_NAMES.get(job, job)

        buildings = self.building_model.get_by_tribe(tribe_id)
        researched_ids = self.technology_model.get_researched_ids(tribe_id)

        diplomacy_records = self.diplomacy_model.get_by_tribe(tribe_id)
        diplomacy_info = []
        for rel in diplomacy_records:
            foreign = self.foreign_tribe_model.get_by_id(rel['foreign_tribe_id'])
            if foreign:
                diplomacy_info.append({
                    'diplomacy_id': rel['id'],
                    'foreign_tribe_id': rel['foreign_tribe_id'],
                    'foreign_name': foreign.get('name'),
                    'foreign_era': foreign.get('era'),
                    'strength': foreign.get('strength', 10),
                    'attitude': foreign.get('attitude', 'neutral'),
                    'specialty_resource': foreign.get('specialty_resource'),
                    'trade_available': foreign.get('trade_available', 1),
                    'relation': rel['relation'],
                    'trade_cooldown': rel['trade_cooldown'],
                })

        available_techs = GameEngine.get_available_techs(researched_ids, tribe['era'], tribe['knowledge'])
        available_buildings = GameEngine.get_available_buildings(tribe['era'], researched_ids, {
            'wood': tribe['wood'], 'stone': tribe['stone'], 'metal': tribe['metal']
        })

        production = GameEngine.calculate_resource_production(tribespeople, buildings, researched_ids, tribe['season'])
        max_pop = GameEngine.calculate_max_population(buildings, researched_ids)
        consumption = GameEngine.calculate_food_consumption(tribe['population'], tribe['season'], researched_ids)
        morale = GameEngine.calculate_morale(buildings, researched_ids, tribe['season'], tribe['food'], consumption)
        military_strength = GameEngine.calculate_military_strength(tribespeople, buildings, researched_ids)

        era_check = GameEngine.can_advance_era(tribe['era'], researched_ids)
        can_advance_era = era_check['can']
        era_advance_requirements = era_check.get('reason', '')

        building_names = {bt: bd['name'] for bt, bd in BUILDING_DEFINITIONS.items()}
        tech_names = {tid: tech['name'] for tid, tech in GameEngine.get_tech_tree().items()}

        tribe['max_population'] = max_pop
        tribe['morale'] = morale

        return self._success({
            'tribe': tribe,
            'tribespeople': tribespeople,
            'buildings': buildings,
            'building_names': building_names,
            'tech_names': tech_names,
            'researched_ids': researched_ids,
            'production': production,
            'food_consumption': consumption,
            'military_strength': military_strength,
            'diplomacy': diplomacy_info,
            'available_techs': available_techs,
            'available_buildings': available_buildings,
            'can_advance_era': can_advance_era,
            'era_advance_requirements': era_advance_requirements,
        })

    def delete_game(self, tribe_id: int) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        self.tribesperson_model.delete_by_tribe(tribe_id)
        self.building_model.delete_by_tribe(tribe_id)
        self.technology_model.delete_by_tribe(tribe_id)
        self.diplomacy_model.delete_by_tribe(tribe_id)
        self.tribe_model.delete(tribe_id)

        return self._success(None, message='Game deleted successfully')

    def list_games(self) -> Dict[str, Any]:
        tribes = self.tribe_model.get_all()
        result = []
        for tribe in tribes:
            result.append({
                'id': tribe['id'],
                'name': tribe['name'],
                'era': tribe['era'],
                'era_name': ERA_NAMES.get(tribe['era'], tribe['era']),
                'turn': tribe['turn'],
                'season': tribe['season'],
                'season_name': SEASON_NAMES.get(tribe['season'], tribe['season']),
                'year': tribe['year'],
                'population': tribe['population'],
            })

        return self._success(result)

    def get_tech_tree(self) -> Dict[str, Any]:
        tech_tree = GameEngine.get_tech_tree_visual()
        return self._success(tech_tree)

    def get_available_buildings(self, tribe_id: int) -> Dict[str, Any]:
        tribe, err = self._get_tribe_or_error(tribe_id)
        if err:
            return err

        researched_ids = self.technology_model.get_researched_ids(tribe_id)
        tribe_resources = {
            'wood': tribe['wood'],
            'stone': tribe['stone'],
            'metal': tribe['metal'],
        }
        available_buildings = GameEngine.get_available_buildings(tribe['era'], researched_ids, tribe_resources)
        return self._success(available_buildings)
