from typing import Dict, Any, List, Optional
from app.model.rainforest import (
    GameStateModel, LayerModel, PopulationModel,
    LAYER_LEAF, LAYER_SEMI_DECAYED, LAYER_HUMUS, LAYER_MINERAL,
    LAYER_NAMES, LAYER_INITIAL_ORGANIC, LAYER_INITIAL_DIFFICULTY,
    MORPH_FUNGI, MORPH_BACTERIA, MORPH_NEMATODE, MORPH_NAMES
)

FUNGI_CONSUMPTION_MULTIPLIER = 2
BACTERIA_CONSUMPTION_MULTIPLIER = 1
NEMATODE_CONSUMPTION_MULTIPLIER = 3

DEPLETION_ORGANIC_DECAY_RATE = 0.10
DEPLETION_CONSUMPTION_PENALTY = 1.5

DENSITY_LIMIT_FACTOR = 0.15

FUNGI_CROSS_LAYER_EFFICIENCY = 0.8
BACTERIA_CROSS_LAYER_EFFICIENCY = 1.0
NEMATODE_CROSS_LAYER_DEVOUR_EFFICIENCY = 0.6

RAINSTORM_INTERVAL = 10
RAINSTORM_LEAF_ORGANIC_BOOST = 0.20
RAINSTORM_MINERAL_DIFFICULTY_MULTIPLIER = 2.0
RAINSTORM_NEMATODE_CONSUMPTION_MULTIPLIER = 1.5
LEACHING_SEMI_DECAYED_ORGANIC_BOOST = 0.10
LEACHING_DURATION = 3

NEMATODE_DEVOUR_COST_RATE = 0
FUNGI_DECOMPOSITION_EFFICIENCY = 1.5
BACTERIA_DECOMPOSITION_EFFICIENCY = 0.6
NEMATODE_BASE_EFFICIENCY = 0.8


class GameBusiness:
    def __init__(self):
        self.game_model = GameStateModel()
        self.layer_model = LayerModel()
        self.population_model = PopulationModel()

    def create_game(self, initial_fungi: int = 5, initial_bacteria: int = 8,
                    initial_nematode: int = 2) -> Dict[str, Any]:
        try:
            game_id = self.game_model.create()
            self.layer_model.create_initial_layers(game_id)

            layers = self.layer_model.get_all_by_game(game_id)
            leaf_layer = next((l for l in layers if l['layer_type'] == LAYER_LEAF), None)

            if leaf_layer:
                self.population_model.create_initial_population(
                    game_id=game_id,
                    layer_id=leaf_layer['id'],
                    fungi=initial_fungi,
                    bacteria=initial_bacteria,
                    nematode=initial_nematode
                )

            return self.get_game_state(game_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def get_game_state(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'message': 'Game not found', 'data': None}

        layers = self.layer_model.get_all_by_game(game_id)
        populations = self.population_model.get_all_by_game(game_id)

        layer_map = {l['id']: l for l in layers}

        layer_data = []
        for layer in layers:
            layer_pops = [p for p in populations if p['layer_id'] == layer['id']]
            density_limit = self._calc_density_limit(layer)
            total_pop = sum(p['count'] for p in layer_pops)

            pop_data = []
            for pop in layer_pops:
                consumption = self._calc_consumption(pop['morph_type'], layer)
                pop_data.append({
                    'id': pop['id'],
                    'morph_type': pop['morph_type'],
                    'morph_name': MORPH_NAMES.get(pop['morph_type'], '未知'),
                    'count': pop['count'],
                    'consumption_per_turn': round(consumption * pop['count'], 2)
                })

            layer_data.append({
                'id': layer['id'],
                'layer_type': layer['layer_type'],
                'layer_name': LAYER_NAMES.get(layer['layer_type'], '未知'),
                'organic_matter': round(layer['organic_matter'], 2),
                'base_difficulty': layer['base_difficulty'],
                'area': layer['area'],
                'is_depleted': bool(layer['is_depleted']),
                'density_limit': round(density_limit, 2),
                'total_population': total_pop,
                'populations': pop_data
            })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': game['id'],
                'turn': game['turn'],
                'rainstorm_active': bool(game['rainstorm_active']),
                'rainstorm_remaining_turns': game['rainstorm_remaining_turns'],
                'leaching_remaining_turns': game['leaching_remaining_turns'],
                'layers': layer_data
            }
        }

    def advance_turn(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'message': 'Game not found', 'data': None}

        try:
            new_turn = game['turn'] + 1

            self._process_rainstorm_effects(game_id, game, new_turn)
            self._process_leaching_effects(game_id, game)

            layers = self.layer_model.get_all_by_game(game_id)
            populations = self.population_model.get_all_by_game(game_id)

            for layer in layers:
                layer_pops = [p for p in populations if p['layer_id'] == layer['id']]
                total_consumption = 0
                for pop in layer_pops:
                    unit_consumption = self._calc_consumption(pop['morph_type'], layer, game)
                    total_consumption += unit_consumption * pop['count']

                new_organic = max(0, layer['organic_matter'] - total_consumption)
                self.layer_model.update(layer['id'], organic_matter=new_organic)

            updated_layers = self.layer_model.get_all_by_game(game_id)
            updated_pops = self.population_model.get_all_by_game(game_id)
            for layer in updated_layers:
                self._check_depletion(layer, updated_pops)

            self._remove_dead_populations(game_id)

            self._update_game_turn(game_id, game, new_turn)

            return self.get_game_state(game_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def morph_transform(self, game_id: int, target_morph: int,
                        population_id: int = None,
                        layer_id: int = None, morph_type: int = None) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'message': 'Game not found', 'data': None}

        if target_morph not in (MORPH_FUNGI, MORPH_BACTERIA, MORPH_NEMATODE):
            return {'code': 1, 'message': 'Invalid target morph type', 'data': None}

        if population_id is None:
            if layer_id is None or morph_type is None:
                return {'code': 1, 'message': 'Provide either population_id or (layer_id + morph_type)', 'data': None}
            pop = self.population_model.get_by_game_layer_morph(game_id, layer_id, morph_type)
        else:
            pop = self.population_model.get_by_id(population_id)
        if not pop or pop['game_id'] != game_id:
            return {'code': 1, 'message': 'Population not found', 'data': None}

        if pop['morph_type'] == target_morph:
            return {'code': 1, 'message': 'Already in target morph type', 'data': None}

        try:
            current_count = pop['count']
            if current_count <= 0:
                return {'code': 1, 'message': 'No population to transform', 'data': None}
            self.population_model.update(pop['id'], count=0)

            existing_target = self.population_model.get_by_game_layer_morph(
                game_id, pop['layer_id'], target_morph
            )
            if existing_target:
                new_count = existing_target['count'] + current_count
                self.population_model.update(existing_target['id'], count=new_count)
            else:
                self.population_model.create(
                    game_id=game_id,
                    layer_id=pop['layer_id'],
                    morph_type=target_morph,
                    count=current_count
                )

            return self.get_game_state(game_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def migrate_population(self, game_id: int, target_layer_type: int, count: int,
                           population_id: int = None,
                           from_layer_id: int = None, morph_type: int = None) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'message': 'Game not found', 'data': None}

        if target_layer_type not in (LAYER_LEAF, LAYER_SEMI_DECAYED, LAYER_HUMUS, LAYER_MINERAL):
            return {'code': 1, 'message': 'Invalid target layer type', 'data': None}

        if count <= 0:
            return {'code': 1, 'message': 'Count must be positive', 'data': None}

        if population_id is None:
            if from_layer_id is None or morph_type is None:
                return {'code': 1, 'message': 'Provide either population_id or (from_layer_id + morph_type)', 'data': None}
            pop = self.population_model.get_by_game_layer_morph(game_id, from_layer_id, morph_type)
        else:
            pop = self.population_model.get_by_id(population_id)
        if not pop or pop['game_id'] != game_id:
            return {'code': 1, 'message': 'Population not found', 'data': None}

        if pop['count'] < count:
            return {'code': 1, 'message': 'Not enough population to migrate', 'data': None}

        source_layer = self.layer_model.get_by_id(pop['layer_id'])
        if source_layer and source_layer['is_depleted']:
            return {'code': 1, 'message': 'Cannot migrate from a depleted layer', 'data': None}

        target_layer = self.layer_model.get_by_game_and_type(game_id, target_layer_type)
        if not target_layer:
            return {'code': 1, 'message': 'Target layer not found', 'data': None}

        if target_layer['is_depleted']:
            return {'code': 1, 'message': 'Cannot migrate to a depleted layer', 'data': None}

        try:
            source_layer_type = source_layer['layer_type']
            if source_layer_type != target_layer_type:
                self._apply_cross_layer_adaptation(
                    game_id, pop['morph_type'], source_layer_type,
                    target_layer_type, target_layer['id'], count
                )

            new_source_count = pop['count'] - count
            if new_source_count <= 0:
                self.population_model.update(pop['id'], count=0)
            else:
                self.population_model.update(pop['id'], count=new_source_count)

            return self.get_game_state(game_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def add_population(self, game_id: int, layer_type: int, morph_type: int,
                       count: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'message': 'Game not found', 'data': None}

        if layer_type not in (LAYER_LEAF, LAYER_SEMI_DECAYED, LAYER_HUMUS, LAYER_MINERAL):
            return {'code': 1, 'message': 'Invalid layer type', 'data': None}

        if morph_type not in (MORPH_FUNGI, MORPH_BACTERIA, MORPH_NEMATODE):
            return {'code': 1, 'message': 'Invalid morph type', 'data': None}

        if count <= 0:
            return {'code': 1, 'message': 'Count must be positive', 'data': None}

        layer = self.layer_model.get_by_game_and_type(game_id, layer_type)
        if not layer:
            return {'code': 1, 'message': 'Layer not found', 'data': None}

        try:
            self.population_model.upsert_population(
                game_id=game_id,
                layer_id=layer['id'],
                morph_type=morph_type,
                count=count
            )
            return self.get_game_state(game_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def nematode_devour(self, game_id: int,
                        nematode_pop_id: int = None, target_pop_id: int = None,
                        layer_id: int = None, target_morph_type: int = None) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'message': 'Game not found', 'data': None}

        if nematode_pop_id is None:
            if layer_id is None:
                return {'code': 1, 'message': 'Provide either nematode_pop_id or layer_id', 'data': None}
            nematode_pop = self.population_model.get_by_game_layer_morph(game_id, layer_id, MORPH_NEMATODE)
        else:
            nematode_pop = self.population_model.get_by_id(nematode_pop_id)
        if not nematode_pop or nematode_pop['game_id'] != game_id:
            return {'code': 1, 'message': 'Nematode population not found', 'data': None}

        if nematode_pop['morph_type'] != MORPH_NEMATODE:
            return {'code': 1, 'message': 'Source must be nematode', 'data': None}

        if target_pop_id is None:
            if layer_id is None or target_morph_type is None:
                return {'code': 1, 'message': 'Provide either target_pop_id or (layer_id + target_morph_type)', 'data': None}
            target_pop = self.population_model.get_by_game_layer_morph(game_id, layer_id, target_morph_type)
        else:
            target_pop = self.population_model.get_by_id(target_pop_id)
        if not target_pop or target_pop['game_id'] != game_id:
            return {'code': 1, 'message': 'Target population not found', 'data': None}

        if target_pop['layer_id'] != nematode_pop['layer_id']:
            return {'code': 1, 'message': 'Target must be in the same layer', 'data': None}

        if target_pop['morph_type'] == MORPH_NEMATODE:
            return {'code': 1, 'message': 'Cannot devour another nematode', 'data': None}

        try:
            nematode_count = nematode_pop['count']
            target_count = target_pop['count']
            max_devour = min(nematode_count, target_count)
            if max_devour <= 0:
                return {'code': 1, 'message': 'Nothing to devour', 'data': None}

            source_layer = self.layer_model.get_by_id(nematode_pop['layer_id'])
            devour_efficiency = 1.0
            if source_layer:
                devour_efficiency = self._get_devour_efficiency(source_layer['layer_type'])

            gained = int(max_devour * devour_efficiency)

            new_nematode_count = nematode_count + gained
            self.population_model.update(nematode_pop['id'], count=new_nematode_count)

            new_target_count = target_count - max_devour
            if new_target_count <= 0:
                self.population_model.update(target_pop['id'], count=0)
            else:
                self.population_model.update(target_pop['id'], count=new_target_count)

            return self.get_game_state(game_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def delete_game(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {'code': 1, 'message': 'Game not found', 'data': None}

        self.population_model.delete_by_game(game_id)
        self.layer_model.delete_by_game(game_id)
        self.game_model.delete(game_id)

        return {'code': 0, 'message': 'Game deleted', 'data': None}

    def _calc_density_limit(self, layer: Dict[str, Any]) -> float:
        return layer['organic_matter'] / 100.0 * layer['area'] * DENSITY_LIMIT_FACTOR

    def _calc_consumption(self, morph_type: int, layer: Dict[str, Any],
                          game: Dict[str, Any] = None) -> float:
        difficulty = layer['base_difficulty']

        if game and game.get('rainstorm_active') and layer['layer_type'] == LAYER_MINERAL:
            difficulty *= RAINSTORM_MINERAL_DIFFICULTY_MULTIPLIER

        base_consumption = 0.0
        if morph_type == MORPH_FUNGI:
            base_consumption = difficulty * FUNGI_CONSUMPTION_MULTIPLIER
        elif morph_type == MORPH_BACTERIA:
            base_consumption = difficulty * BACTERIA_CONSUMPTION_MULTIPLIER
        elif morph_type == MORPH_NEMATODE:
            base_consumption = difficulty * NEMATODE_CONSUMPTION_MULTIPLIER
            if game and game.get('rainstorm_active'):
                base_consumption *= RAINSTORM_NEMATODE_CONSUMPTION_MULTIPLIER

        if layer['is_depleted']:
            base_consumption *= DEPLETION_CONSUMPTION_PENALTY

        return base_consumption

    def _check_depletion(self, layer: Dict[str, Any], populations: List[Dict[str, Any]]):
        layer_pops = [p for p in populations if p['layer_id'] == layer['id']]
        total_pop = sum(p['count'] for p in layer_pops)
        density_limit = self._calc_density_limit(layer)

        if total_pop > density_limit and not layer['is_depleted']:
            self.layer_model.update(layer['id'], is_depleted=1)
        elif total_pop <= density_limit and layer['is_depleted']:
            if layer['organic_matter'] > 0:
                self.layer_model.update(layer['id'], is_depleted=0)

    def _process_rainstorm_effects(self, game_id: int, game: Dict[str, Any], new_turn: int):
        rainstorm_active = bool(game['rainstorm_active'])
        rainstorm_remaining = game['rainstorm_remaining_turns']
        leaching_remaining = game['leaching_remaining_turns']

        if new_turn > 0 and new_turn % RAINSTORM_INTERVAL == 0:
            rainstorm_active = True
            rainstorm_remaining = 1
            leaching_remaining = LEACHING_DURATION

            leaf_layer = self.layer_model.get_by_game_and_type(game_id, LAYER_LEAF)
            if leaf_layer:
                boosted = leaf_layer['organic_matter'] * (1 + RAINSTORM_LEAF_ORGANIC_BOOST)
                self.layer_model.update(leaf_layer['id'], organic_matter=min(100, boosted))

        if rainstorm_remaining > 0:
            rainstorm_remaining -= 1
            if rainstorm_remaining <= 0:
                rainstorm_active = False

        self.game_model.update(game_id,
                               rainstorm_active=int(rainstorm_active),
                               rainstorm_remaining_turns=rainstorm_remaining,
                               leaching_remaining_turns=leaching_remaining)

    def _process_leaching_effects(self, game_id: int, game: Dict[str, Any]):
        leaching_remaining = game['leaching_remaining_turns']

        if leaching_remaining > 0:
            semi_layer = self.layer_model.get_by_game_and_type(game_id, LAYER_SEMI_DECAYED)
            if semi_layer:
                boosted = semi_layer['organic_matter'] * (1 + LEACHING_SEMI_DECAYED_ORGANIC_BOOST)
                self.layer_model.update(semi_layer['id'], organic_matter=min(100, boosted))

            leaching_remaining -= 1
            self.game_model.update(game_id, leaching_remaining_turns=leaching_remaining)

    def _apply_cross_layer_adaptation(self, game_id: int, morph_type: int,
                                       source_layer_type: int, target_layer_type: int,
                                       target_layer_id: int, count: int):
        existing = self.population_model.get_by_game_layer_morph(
            game_id, target_layer_id, morph_type
        )

        if morph_type == MORPH_FUNGI:
            actual_count = int(count * FUNGI_CROSS_LAYER_EFFICIENCY)
        elif morph_type == MORPH_BACTERIA:
            actual_count = int(count * BACTERIA_CROSS_LAYER_EFFICIENCY)
        elif morph_type == MORPH_NEMATODE:
            actual_count = count
        else:
            actual_count = count

        if existing:
            self.population_model.update(existing['id'],
                                         count=existing['count'] + actual_count)
        else:
            self.population_model.create(
                game_id=game_id,
                layer_id=target_layer_id,
                morph_type=morph_type,
                count=actual_count
            )

    def _get_devour_efficiency(self, layer_type: int) -> float:
        if layer_type in (LAYER_LEAF,):
            return 1.0
        return NEMATODE_CROSS_LAYER_DEVOUR_EFFICIENCY

    def _remove_dead_populations(self, game_id: int):
        populations = self.population_model.get_all_by_game(game_id)
        for pop in populations:
            if pop['count'] <= 0:
                self.population_model.update(pop['id'], count=0)

    def _update_game_turn(self, game_id: int, game: Dict[str, Any], new_turn: int):
        self.game_model.update(game_id, turn=new_turn)

    def get_game_summary(self, game_id: int) -> Dict[str, Any]:
        state_result = self.get_game_state(game_id)
        if state_result['code'] != 0:
            return state_result

        game_data = state_result['data']
        total_population = 0
        total_organic = 0
        depleted_layers = 0

        for layer in game_data['layers']:
            total_population += layer['total_population']
            total_organic += layer['organic_matter']
            if layer['is_depleted']:
                depleted_layers += 1

        avg_organic = total_organic / len(game_data['layers']) if game_data['layers'] else 0

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'game_id': game_id,
                'turn': game_data['turn'],
                'total_population': total_population,
                'average_organic_matter': round(avg_organic, 2),
                'depleted_layers': depleted_layers,
                'rainstorm_active': game_data['rainstorm_active'],
                'leaching_remaining_turns': game_data['leaching_remaining_turns']
            }
        }
