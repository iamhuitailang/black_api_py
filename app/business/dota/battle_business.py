from typing import Dict, Any, List, Optional
from app.model.dota import (
    DotaStageModel, DotaUserStageModel, DotaEnemyModel,
    DotaHeroModel, DotaUserHeroModel, DotaUserEquipmentModel,
    DotaBattleLogModel, DotaUserModel, DotaSkillModel
)
import random


class DotaBattleBusiness:
    def __init__(self):
        self.stage_model = DotaStageModel()
        self.user_stage_model = DotaUserStageModel()
        self.enemy_model = DotaEnemyModel()
        self.hero_model = DotaHeroModel()
        self.user_hero_model = DotaUserHeroModel()
        self.user_equipment_model = DotaUserEquipmentModel()
        self.battle_log_model = DotaBattleLogModel()
        self.user_model = DotaUserModel()
        self.skill_model = DotaSkillModel()

    def get_stage_info(self, user_id: int, stage_id: int = None) -> Dict[str, Any]:
        if stage_id is None:
            user_stage = self.user_stage_model.get_or_create(user_id)
            stage_id = user_stage.get('current_stage_id', 101)

        stage = self.stage_model.get_by_id(stage_id)
        if not stage:
            return {
                'code': 1,
                'msg': '关卡不存在',
                'data': None
            }

        user_stage = self.user_stage_model.get_or_create(user_id)
        max_stage_id = user_stage.get('max_stage_id', 101)

        is_unlocked = stage_id <= max_stage_id

        result = {
            **self.stage_model.to_dict(stage),
            'is_unlocked': is_unlocked,
            'can_play': is_unlocked
        }

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_chapter_stages(self, user_id: int, chapter: int = 1) -> Dict[str, Any]:
        stages = self.stage_model.get_by_chapter(chapter)
        user_stage = self.user_stage_model.get_or_create(user_id)
        max_stage_id = user_stage.get('max_stage_id', 101)

        result = []
        for stage in stages:
            stage_dict = self.stage_model.to_dict(stage)
            stage_dict['is_unlocked'] = stage.get('id') <= max_stage_id
            stage_dict['is_cleared'] = stage.get('id') < max_stage_id
            result.append(stage_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_current_stage(self, user_id: int) -> Dict[str, Any]:
        user_stage = self.user_stage_model.get_or_create(user_id)
        stage_id = user_stage.get('current_stage_id', 101)
        return self.get_stage_info(user_id, stage_id)

    def _calculate_damage(self, attacker_attack: int, defender_defense: int) -> int:
        base_damage = max(1, attacker_attack - defender_defense)
        variance = random.uniform(0.9, 1.1)
        return int(base_damage * variance)

    def _get_hero_battle_stats(self, user_id: int, hero_id: int) -> Dict[str, Any]:
        hero = self.hero_model.get_by_id(hero_id)
        if not hero:
            return None

        user_hero = self.user_hero_model.get_by_user_hero(user_id, hero_id)
        if not user_hero:
            return None

        level = user_hero.get('level', 1)
        level_bonus = self.hero_model.get_level_bonus(hero.get('hero_type'), level)
        equipment_bonus = self.user_equipment_model.get_total_bonuses(user_id)

        max_hp = hero.get('base_hp', 500) + level_bonus['hp_bonus'] + equipment_bonus['hp_bonus']
        current_hp = user_hero.get('current_hp', max_hp)
        current_hp = min(current_hp, max_hp)

        return {
            'hero_id': hero_id,
            'name': hero.get('name'),
            'icon': hero.get('icon'),
            'level': level,
            'max_hp': max_hp,
            'current_hp': current_hp,
            'attack': hero.get('base_attack', 20) + level_bonus['attack_bonus'] + equipment_bonus['attack_bonus'],
            'defense': hero.get('base_defense', 5) + level_bonus['defense_bonus'] + equipment_bonus['defense_bonus'],
            'special_effects': equipment_bonus['special_effects']
        }

    def _generate_enemies(self, stage: Dict[str, Any]) -> List[Dict[str, Any]]:
        stage_type = stage.get('stage_type')
        enemy_level = stage.get('enemy_level', 1)
        enemy_count = stage.get('enemy_count', 3)

        enemies = []
        for i in range(enemy_count):
            enemy = self.enemy_model.get_enemy_for_stage(stage_type, enemy_level)
            enemy['index'] = i
            enemies.append(enemy)

        return enemies

    def _check_first_strike(self, hero_effects: List[str]) -> bool:
        if 'first_strike' in hero_effects:
            return random.random() < 0.4
        return False

    def start_battle(self, user_id: int, hero_id: int, stage_id: int) -> Dict[str, Any]:
        stage = self.stage_model.get_by_id(stage_id)
        if not stage:
            return {
                'code': 1,
                'msg': '关卡不存在',
                'data': None
            }

        user_hero = self.user_hero_model.get_by_user_hero(user_id, hero_id)
        if not user_hero:
            return {
                'code': 1,
                'msg': '您未拥有该英雄',
                'data': None
            }

        if user_hero.get('current_hp', 0) <= 0:
            return {
                'code': 1,
                'msg': '英雄生命值不足，请先恢复',
                'data': None
            }

        hero_stats = self._get_hero_battle_stats(user_id, hero_id)
        enemies = self._generate_enemies(stage)

        battle_state = {
            'round': 0,
            'hero': hero_stats,
            'enemies': enemies,
            'battle_log': [],
            'damage_dealt': 0,
            'damage_taken': 0
        }

        return {
            'code': 0,
            'msg': '战斗开始',
            'data': {
                'stage': self.stage_model.to_dict(stage),
                'hero': hero_stats,
                'enemies': enemies,
                'battle_log': []
            }
        }

    def execute_battle_round(self, user_id: int, hero_id: int, stage_id: int,
                             skill_id: int = None, target_index: int = 0) -> Dict[str, Any]:
        stage = self.stage_model.get_by_id(stage_id)
        if not stage:
            return {
                'code': 1,
                'msg': '关卡不存在',
                'data': None
            }

        hero_stats = self._get_hero_battle_stats(user_id, hero_id)
        if not hero_stats:
            return {
                'code': 1,
                'msg': '英雄不存在',
                'data': None
            }

        enemies = self._generate_enemies(stage)

        battle_log = []
        damage_dealt = 0
        damage_taken = 0

        alive_enemies = [e for e in enemies if e['current_hp'] > 0]
        if not alive_enemies:
            return self._end_battle(user_id, hero_id, stage_id, True, enemies, 0, 0, [])

        target = alive_enemies[min(target_index, len(alive_enemies) - 1)]

        if skill_id:
            skill = self.skill_model.get_by_id(skill_id)
            if skill:
                skill_damage = skill.get('damage', 0)
                total_damage = hero_stats['attack'] + skill_damage
                actual_damage = self._calculate_damage(total_damage, target['defense'])
                target['current_hp'] -= actual_damage
                damage_dealt += actual_damage

                battle_log.append({
                    'type': 'skill',
                    'attacker': hero_stats['name'],
                    'skill_name': skill.get('name'),
                    'target': target['name'],
                    'damage': actual_damage,
                    'message': f"{hero_stats['icon']} {hero_stats['name']} 使用 {skill.get('icon')} {skill.get('name')}，对 {target['name']} 造成 {actual_damage} 点伤害！"
                })
        else:
            actual_damage = self._calculate_damage(hero_stats['attack'], target['defense'])
            target['current_hp'] -= actual_damage
            damage_dealt += actual_damage

            battle_log.append({
                'type': 'attack',
                'attacker': hero_stats['name'],
                'target': target['name'],
                'damage': actual_damage,
                'message': f"{hero_stats['icon']} {hero_stats['name']} 普通攻击 {target['name']}，造成 {actual_damage} 点伤害！"
            })

        if target['current_hp'] <= 0:
            battle_log.append({
                'type': 'kill',
                'message': f"{target['icon']} {target['name']} 被击败！"
            })

        alive_enemies = [e for e in enemies if e['current_hp'] > 0]
        if not alive_enemies:
            return self._end_battle(user_id, hero_id, stage_id, True, enemies, damage_dealt, 0, battle_log)

        for enemy in alive_enemies:
            actual_damage = self._calculate_damage(enemy['attack'], hero_stats['defense'])
            damage_taken += actual_damage

            battle_log.append({
                'type': 'enemy_attack',
                'attacker': enemy['name'],
                'damage': actual_damage,
                'message': f"{enemy['icon']} {enemy['name']} 攻击 {hero_stats['name']}，造成 {actual_damage} 点伤害！"
            })

        hero_hp_after = max(0, hero_stats['current_hp'] - damage_taken)
        self.user_hero_model.update_hp(user_id, hero_id, hero_hp_after, hero_stats['max_hp'])

        if hero_hp_after <= 0:
            return self._end_battle(user_id, hero_id, stage_id, False, enemies, damage_dealt, damage_taken, battle_log)

        return {
            'code': 0,
            'msg': '回合结束',
            'data': {
                'hero': {
                    **hero_stats,
                    'current_hp': hero_hp_after
                },
                'enemies': enemies,
                'battle_log': battle_log,
                'is_battle_over': False
            }
        }

    def _end_battle(self, user_id: int, hero_id: int, stage_id: int, is_win: bool,
                    enemies: List[Dict[str, Any]], damage_dealt: int, damage_taken: int,
                    battle_log: List[Dict[str, Any]]) -> Dict[str, Any]:
        stage = self.stage_model.get_by_id(stage_id)

        result = 'win' if is_win else 'lose'
        gold_earned = 0
        exp_earned = 0

        if is_win:
            gold_earned = stage.get('gold_reward', 50)
            exp_earned = stage.get('exp_reward', 30)

            self.user_model.update_gold(user_id, gold_earned)
            self.user_model.update_exp(user_id, exp_earned)
            self.user_hero_model.update_exp(user_id, hero_id, exp_earned)

            user_stage = self.user_stage_model.get_or_create(user_id)
            current_max = user_stage.get('max_stage_id', 101)
            if stage_id >= current_max:
                stage_model = DotaStageModel()
                stage_info = stage_model.get_by_id(stage_id)
                if stage_info:
                    next_stage = stage_model.get_by_chapter_stage(
                        stage_info.get('chapter', 1),
                        stage_info.get('stage_num', 1) + 1
                    )
                    if next_stage:
                        self.user_stage_model.update_current(user_id, next_stage.get('id'))
                    else:
                        self.user_stage_model.update_max(user_id, stage_id)
                else:
                    self.user_stage_model.update_max(user_id, stage_id)

            battle_log.append({
                'type': 'victory',
                'message': f"🎉 战斗胜利！获得 {gold_earned} 金币，{exp_earned} 经验！"
            })
        else:
            battle_log.append({
                'type': 'defeat',
                'message': f"💀 战斗失败...英雄倒下了。"
            })

        self.battle_log_model.create(
            user_id=user_id,
            stage_id=stage_id,
            hero_id=hero_id,
            result=result,
            gold_earned=gold_earned,
            exp_earned=exp_earned,
            damage_dealt=damage_dealt,
            damage_taken=damage_taken,
            rounds=1,
            battle_log=battle_log
        )

        user = self.user_model.get_by_id(user_id)

        return {
            'code': 0,
            'msg': '战斗结束',
            'data': {
                'is_win': is_win,
                'gold_earned': gold_earned,
                'exp_earned': exp_earned,
                'user_gold': user.get('gold', 0) if user else 0,
                'battle_log': battle_log,
                'is_battle_over': True
            }
        }

    def auto_battle(self, user_id: int, hero_id: int, stage_id: int) -> Dict[str, Any]:
        stage = self.stage_model.get_by_id(stage_id)
        if not stage:
            return {
                'code': 1,
                'msg': '关卡不存在',
                'data': None
            }

        user_hero = self.user_hero_model.get_by_user_hero(user_id, hero_id)
        if not user_hero:
            return {
                'code': 1,
                'msg': '您未拥有该英雄',
                'data': None
            }

        if user_hero.get('current_hp', 0) <= 0:
            return {
                'code': 1,
                'msg': '英雄生命值不足，请先恢复',
                'data': None
            }

        hero_stats = self._get_hero_battle_stats(user_id, hero_id)
        enemies = self._generate_enemies(stage)

        battle_log = []
        damage_dealt = 0
        damage_taken = 0
        round_count = 0

        current_hero_hp = hero_stats['current_hp']

        while current_hero_hp > 0 and any(e['current_hp'] > 0 for e in enemies):
            round_count += 1
            battle_log.append({
                'type': 'round',
                'message': f"--- 第 {round_count} 回合 ---"
            })

            alive_enemies = [e for e in enemies if e['current_hp'] > 0]
            for target in alive_enemies[:]:
                if target['current_hp'] <= 0:
                    continue

                actual_damage = self._calculate_damage(hero_stats['attack'], target['defense'])
                target['current_hp'] -= actual_damage
                damage_dealt += actual_damage

                battle_log.append({
                    'type': 'attack',
                    'message': f"{hero_stats['icon']} {hero_stats['name']} 攻击 {target['name']}，造成 {actual_damage} 点伤害！"
                })

                if target['current_hp'] <= 0:
                    battle_log.append({
                        'type': 'kill',
                        'message': f"{target['icon']} {target['name']} 被击败！"
                    })

            alive_enemies = [e for e in enemies if e['current_hp'] > 0]
            if not alive_enemies:
                break

            for enemy in alive_enemies:
                actual_damage = self._calculate_damage(enemy['attack'], hero_stats['defense'])
                current_hero_hp -= actual_damage
                damage_taken += actual_damage

                battle_log.append({
                    'type': 'enemy_attack',
                    'message': f"{enemy['icon']} {enemy['name']} 攻击 {hero_stats['name']}，造成 {actual_damage} 点伤害！"
                })

                if current_hero_hp <= 0:
                    break

            if current_hero_hp <= 0:
                break

        is_win = current_hero_hp > 0

        self.user_hero_model.update_hp(user_id, hero_id, max(0, current_hero_hp), hero_stats['max_hp'])

        return self._end_battle(user_id, hero_id, stage_id, is_win, enemies, damage_dealt, damage_taken, battle_log)

    def get_battle_history(self, user_id: int, limit: int = 20) -> Dict[str, Any]:
        logs = self.battle_log_model.get_by_user(user_id, limit)

        result = []
        for log in logs:
            log_dict = self.battle_log_model.to_dict(log)
            stage = self.stage_model.get_by_id(log.get('stage_id'))
            if stage:
                log_dict['stage_name'] = stage.get('name')
                log_dict['stage_type'] = stage.get('stage_type')
            result.append(log_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_user_battle_stats(self, user_id: int) -> Dict[str, Any]:
        stats = self.battle_log_model.get_user_stats(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }
