import json
import random
from typing import Dict, Any, List, Optional
from app.model.game import (
    SaveModel, PlanetModel, MissionTemplateModel, MissionModel,
    EnemyModel, ReputationModel, InventoryModel, ShipModel
)


class MissionBusiness:
    def __init__(self):
        self.save_model = SaveModel()
        self.planet_model = PlanetModel()
        self.mission_template_model = MissionTemplateModel()
        self.mission_model = MissionModel()
        self.enemy_model = EnemyModel()
        self.reputation_model = ReputationModel()
        self.inventory_model = InventoryModel()
        self.ship_model = ShipModel()

    def get_available_missions(self, save_id: int) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            planet = self.planet_model.get_by_id(save['current_planet_id'])
            if not planet or not planet.get('has_mission_board'):
                return {'code': 1, 'message': '该空间站没有任务发布台', 'data': None}

            active_mission = self.mission_model.get_active_by_save_id(save_id)
            completed_missions = self.mission_model.get_by_save_id(save_id, status='completed')
            completed_template_ids = {m['template_id'] for m in completed_missions}

            mil_rep = save['reputation_military']
            pir_rep = save['reputation_pirate']

            all_templates = self.mission_template_model.get_all()

            available = []
            for mt in all_templates:
                if mt['id'] in completed_template_ids:
                    continue
                mr = mt['min_reputation']
                ok = False
                if mt['faction'] == 'military':
                    if mil_rep >= mr:
                        ok = True
                elif mt['faction'] == 'pirate':
                    if pir_rep >= abs(mr):
                        ok = True
                else:
                    ok = True

                if ok:
                    if mt['difficulty'] <= planet.get('danger_level', 5) + 2:
                        available.append(mt)

            available.sort(key=lambda x: (x['difficulty'], -x['reward_credits']))

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'planet': planet,
                    'available_missions': available[:8],
                    'active_mission': active_mission,
                    'player_reputation': {
                        'military': mil_rep,
                        'pirate': pir_rep,
                        'bounty_pirate': save['bounty_pirate'],
                    }
                }
            }
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def accept_mission(self, save_id: int, template_id: int) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            active_mission = self.mission_model.get_active_by_save_id(save_id)
            if active_mission:
                return {'code': 1, 'message': '已有进行中的任务，请先完成或放弃', 'data': None}

            template = self.mission_template_model.get_by_id(template_id)
            if not template:
                return {'code': 1, 'message': '任务模板不存在', 'data': None}

            if template['faction'] == 'military' and save['reputation_military'] < template['min_reputation']:
                return {'code': 1, 'message': '军方声望不足', 'data': None}
            if template['faction'] == 'pirate' and save['reputation_pirate'] < abs(template['min_reputation']):
                return {'code': 1, 'message': '海盗声望不足', 'data': None}

            target_faction = template['target_faction'] if template['target_faction'] else 'pirate'
            enemy_pool = self.enemy_model.get_by_faction(target_faction)
            if not enemy_pool:
                enemy_pool = self.enemy_model.get_by_difficulty(template['enemy_difficulty'] + 1, max(1, template['enemy_difficulty'] - 1))
                if not enemy_pool:
                    enemy_pool = self.enemy_model.get_all()

            enemies_for_mission = []
            enemy_ids = []
            for i in range(template['enemy_count']):
                max_diff = template['enemy_difficulty']
                min_diff = max(1, template['enemy_difficulty'] - 1)
                pool = [e for e in enemy_pool if min_diff <= e['difficulty'] <= max_diff]
                if not pool:
                    pool = enemy_pool
                chosen = random.choice(pool)
                enemies_for_mission.append(chosen)
                enemy_ids.append(chosen['id'])

            mission_id = self.mission_model.create(
                save_id=save_id,
                template_id=template_id,
                name=template['name'],
                description=template['description'],
                mission_type=template['mission_type'],
                faction=template['faction'],
                target_faction=target_faction,
                difficulty=template['difficulty'],
                reward_credits=template['reward_credits'],
                reputation_military=template['reputation_military'],
                reputation_pirate=template['reputation_pirate'],
                bounty_pirate=template['bounty_pirate'],
                enemy_count=template['enemy_count'],
                enemy_difficulty=template['enemy_difficulty'],
                enemies=json.dumps(enemy_ids),
                source_planet_id=save['current_planet_id'],
                target_planet_id=None,
            )

            self.save_model.update(save_id, total_missions=save['total_missions'] + 1)

            return self.get_available_missions(save_id)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def get_mission_enemies(self, save_id: int) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            mission = self.mission_model.get_active_by_save_id(save_id)
            if not mission:
                return {'code': 1, 'message': '没有进行中的任务', 'data': None}

            enemy_ids = []
            try:
                enemy_ids = json.loads(mission['enemies'] or '[]')
            except Exception:
                enemy_ids = []

            if mission['current_enemy_index'] >= len(enemy_ids):
                return self.complete_mission(save_id, mission['id'])

            current_enemy_id = enemy_ids[mission['current_enemy_index']] if enemy_ids else None
            next_batch_ids = []
            if current_enemy_id is not None:
                next_batch_ids = [current_enemy_id]
                idx = mission['current_enemy_index']
                if idx + 1 < len(enemy_ids) and random.randint(1, 100) <= 40:
                    next_batch_ids.append(enemy_ids[idx + 1])

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'mission': mission,
                    'enemy_ids': next_batch_ids,
                    'current_index': mission['current_enemy_index'],
                    'total_enemies': len(enemy_ids),
                }
            }
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def advance_mission_enemy(self, save_id: int, defeated: int = 1) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            mission = self.mission_model.get_active_by_save_id(save_id)
            if not mission:
                return {'code': 1, 'message': '没有进行中的任务', 'data': None}

            new_idx = mission['current_enemy_index'] + defeated
            self.mission_model.update(mission['id'], current_enemy_index=new_idx)

            return {
                'code': 0,
                'message': 'success',
                'data': {'new_index': new_idx}
            }
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def complete_mission(self, save_id: int, mission_id: int = None) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            if mission_id is None:
                active = self.mission_model.get_active_by_save_id(save_id)
                if not active:
                    return {'code': 1, 'message': '没有进行中的任务', 'data': None}
                mission_id = active['id']

            mission = self.mission_model.get_by_id(mission_id)
            if not mission:
                return {'code': 1, 'message': '任务不存在', 'data': None}
            if mission['save_id'] != save_id:
                return {'code': 1, 'message': '任务不属于此存档', 'data': None}
            if mission['status'] != 'active':
                return {'code': 1, 'message': '任务状态异常', 'data': None}

            self.mission_model.complete(mission_id)

            new_credits = save['credits'] + mission['reward_credits']
            new_mil = save['reputation_military'] + mission['reputation_military']
            new_pir = save['reputation_pirate'] + mission['reputation_pirate']
            new_bounty = max(0, save['bounty_pirate'] + mission['bounty_pirate'])
            new_completed = save['completed_missions'] + 1

            self.save_model.update(
                save_id,
                credits=new_credits,
                reputation_military=new_mil,
                reputation_pirate=new_pir,
                bounty_pirate=new_bounty,
                completed_missions=new_completed,
            )

            if mission['reputation_military'] != 0:
                self.reputation_model.create(
                    save_id=save_id,
                    faction='military',
                    change_amount=mission['reputation_military'],
                    reason=f'完成任务：{mission["name"]}'
                )
            if mission['reputation_pirate'] != 0:
                self.reputation_model.create(
                    save_id=save_id,
                    faction='pirate',
                    change_amount=mission['reputation_pirate'],
                    reason=f'完成任务：{mission["name"]}'
                )

            return {
                'code': 0,
                'message': '任务完成！',
                'data': {
                    'reward_credits': mission['reward_credits'],
                    'reputation_military': mission['reputation_military'],
                    'reputation_pirate': mission['reputation_pirate'],
                    'bounty_pirate': mission['bounty_pirate'],
                    'new_credits': new_credits,
                    'new_military_rep': new_mil,
                    'new_pirate_rep': new_pir,
                }
            }
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def abandon_mission(self, save_id: int) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            mission = self.mission_model.get_active_by_save_id(save_id)
            if not mission:
                return {'code': 1, 'message': '没有进行中的任务', 'data': None}

            self.mission_model.fail(mission['id'])

            penalty = 0
            if mission['faction'] == 'military':
                penalty = -5
                self.save_model.update(save_id, reputation_military=max(-100, save['reputation_military'] + penalty))
                self.reputation_model.create(save_id, 'military', penalty, f'放弃任务：{mission["name"]}')
            elif mission['faction'] == 'pirate':
                penalty = -8
                self.save_model.update(save_id, reputation_pirate=max(-100, save['reputation_pirate'] + penalty))
                self.reputation_model.create(save_id, 'pirate', penalty, f'放弃任务：{mission["name"]}')

            return {
                'code': 0,
                'message': f'任务已放弃',
                'data': {'penalty': penalty}
            }
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def fail_mission_combat(self, save_id: int) -> Dict[str, Any]:
        try:
            save = self.save_model.get_by_id(save_id)
            if not save:
                return {'code': 1, 'message': '存档不存在', 'data': None}

            mission = self.mission_model.get_active_by_save_id(save_id)
            if not mission:
                return {'code': 0, 'message': '没有进行中的任务', 'data': None}

            self.mission_model.fail(mission['id'])

            if mission['faction'] == 'military':
                penalty = -3
                self.save_model.update(save_id, reputation_military=max(-100, save['reputation_military'] + penalty))
                self.reputation_model.create(save_id, 'military', penalty, f'任务失败：{mission["name"]}')
            elif mission['faction'] == 'pirate':
                penalty = -5
                self.save_model.update(save_id, reputation_pirate=max(-100, save['reputation_pirate'] + penalty))
                self.reputation_model.create(save_id, 'pirate', penalty, f'任务失败：{mission["name"]}')

            return {
                'code': 0,
                'message': '任务失败',
                'data': None
            }
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}
