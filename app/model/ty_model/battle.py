from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import random
import json


class BattleModel:
    TABLE_NAME = 'tb_ty_model_battles'

    STATUS_WAITING = 0
    STATUS_IN_PROGRESS = 1
    STATUS_COMPLETED = 2
    STATUS_CANCELLED = 3

    MODE_PVE = 'pve'
    MODE_PVP = 'pvp'
    MODE_RANKED = 'ranked'

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player1_id INTEGER NOT NULL,
                player2_id INTEGER,
                player1_weapon_id INTEGER,
                player2_weapon_id INTEGER,
                mode TEXT DEFAULT 'pve',
                status INTEGER DEFAULT 0,
                player1_hp INTEGER DEFAULT 100,
                player2_hp INTEGER DEFAULT 100,
                max_hp INTEGER DEFAULT 100,
                winner_id INTEGER,
                rounds INTEGER DEFAULT 0,
                battle_log TEXT,
                reward_gold INTEGER DEFAULT 0,
                reward_exp INTEGER DEFAULT 0,
                reward_paint INTEGER DEFAULT 0,
                reward_canvas INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player1 ON {cls.TABLE_NAME}(player1_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_player2 ON {cls.TABLE_NAME}(player2_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_mode ON {cls.TABLE_NAME}(mode)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_winner ON {cls.TABLE_NAME}(winner_id)"
        db.execute(index_sql)

    def create_battle(self, player1_id: int, player1_weapon_id: int,
                      mode: str = 'pve', player2_id: int = None,
                      player2_weapon_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'player1_id': player1_id,
            'player2_id': player2_id,
            'player1_weapon_id': player1_weapon_id,
            'player2_weapon_id': player2_weapon_id,
            'mode': mode,
            'status': self.STATUS_WAITING,
            'player1_hp': 100,
            'player2_hp': 100,
            'max_hp': 100,
            'rounds': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, battle_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(battle_id)

    def get_user_battles(self, user_id: int, page: int = 1, page_size: int = 10,
                         status: int = None, mode: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["(player1_id = ? OR player2_id = ?)"]
        params = [user_id, user_id]

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)
        if mode:
            where_clauses.append("mode = ?")
            params.append(mode)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([page_size, offset])
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def start_battle(self, battle_id: int) -> bool:
        battle = self.get_by_id(battle_id)
        if not battle or battle.get('status') != self.STATUS_WAITING:
            return False

        now = datetime.now().isoformat()
        affected = self.exec.update_by_id(battle_id, {
            'status': self.STATUS_IN_PROGRESS,
            'updated_at': now
        })
        return affected > 0

    def calculate_damage(self, attacker_weapon: Dict[str, Any],
                         defender_weapon: Dict[str, Any],
                         attacker_skills: List[Dict[str, Any]] = None,
                         defender_skills: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        attacker_skills = attacker_skills or []
        defender_skills = defender_skills or []

        base_attack = attacker_weapon.get('attack', 10)
        base_defense = defender_weapon.get('defense', 5)
        attacker_speed = attacker_weapon.get('speed', 5)
        defender_speed = defender_weapon.get('speed', 5)

        attack_bonus = 0
        defense_bonus = 0
        crit_chance = 0.05
        crit_multiplier = 1.5

        for skill in attacker_skills:
            effect = skill.get('current_effect', {})
            attack_bonus += effect.get('attack', 0)
            crit_chance += effect.get('crit_chance', 0)
            crit_multiplier += effect.get('crit_multiplier', 0)

        for skill in defender_skills:
            effect = skill.get('current_effect', {})
            defense_bonus += effect.get('defense', 0)

        total_attack = base_attack + attack_bonus
        total_defense = base_defense + defense_bonus

        speed_diff = attacker_speed - defender_speed
        if speed_diff > 0:
            total_attack += speed_diff * 0.5

        base_damage = max(1, total_attack - total_defense * 0.5)

        is_crit = random.random() < crit_chance
        if is_crit:
            damage = int(base_damage * crit_multiplier)
        else:
            damage = int(base_damage * (0.8 + random.random() * 0.4))

        damage = max(1, damage)

        return {
            'damage': damage,
            'is_crit': is_crit,
            'base_attack': base_attack,
            'total_attack': total_attack,
            'base_defense': base_defense,
            'total_defense': total_defense
        }

    def execute_round(self, battle_id: int) -> Dict[str, Any]:
        from app.model.ty_model.weapon import WeaponModel
        from app.model.ty_model.user_skill import UserSkillModel
        from app.model.ty_model.user import UserModel

        battle = self.get_by_id(battle_id)
        if not battle or battle.get('status') != self.STATUS_IN_PROGRESS:
            return {'success': False, 'msg': '战斗状态无效'}

        weapon_model = WeaponModel()
        user_skill_model = UserSkillModel()
        user_model = UserModel()

        player1_weapon = weapon_model.get_by_id(battle.get('player1_weapon_id', 0))
        player2_weapon = weapon_model.get_by_id(battle.get('player2_weapon_id', 0))

        if not player1_weapon or not player2_weapon:
            return {'success': False, 'msg': '武器数据缺失'}

        player1_skills = user_skill_model.get_equipped_skills(battle.get('player1_id', 0))
        player2_skills = user_skill_model.get_equipped_skills(battle.get('player2_id', 0))

        battle_log = json.loads(battle.get('battle_log', '[]')) if battle.get('battle_log') else []
        rounds = battle.get('rounds', 0) + 1

        player1_hp = battle.get('player1_hp', 100)
        player2_hp = battle.get('player2_hp', 100)

        round_log = {'round': rounds, 'actions': []}

        player1_first = player1_weapon.get('speed', 5) >= player2_weapon.get('speed', 5)

        if player1_first:
            p1_attack = self.calculate_damage(player1_weapon, player2_weapon, player1_skills, player2_skills)
            player2_hp = max(0, player2_hp - p1_attack['damage'])
            round_log['actions'].append({
                'attacker': 'player1',
                'defender': 'player2',
                **p1_attack,
                'remaining_hp': player2_hp
            })

            if player2_hp > 0:
                p2_attack = self.calculate_damage(player2_weapon, player1_weapon, player2_skills, player1_skills)
                player1_hp = max(0, player1_hp - p2_attack['damage'])
                round_log['actions'].append({
                    'attacker': 'player2',
                    'defender': 'player1',
                    **p2_attack,
                    'remaining_hp': player1_hp
                })
        else:
            p2_attack = self.calculate_damage(player2_weapon, player1_weapon, player2_skills, player1_skills)
            player1_hp = max(0, player1_hp - p2_attack['damage'])
            round_log['actions'].append({
                'attacker': 'player2',
                'defender': 'player1',
                **p2_attack,
                'remaining_hp': player1_hp
            })

            if player1_hp > 0:
                p1_attack = self.calculate_damage(player1_weapon, player2_weapon, player1_skills, player2_skills)
                player2_hp = max(0, player2_hp - p1_attack['damage'])
                round_log['actions'].append({
                    'attacker': 'player1',
                    'defender': 'player2',
                    **p1_attack,
                    'remaining_hp': player2_hp
                })

        battle_log.append(round_log)

        battle_complete = player1_hp <= 0 or player2_hp <= 0 or rounds >= 10
        winner_id = None

        if battle_complete:
            if player1_hp > player2_hp:
                winner_id = battle.get('player1_id')
            elif player2_hp > player1_hp:
                winner_id = battle.get('player2_id')
            else:
                winner_id = None

            reward_gold = 0
            reward_exp = 0
            reward_paint = 0
            reward_canvas = 0

            if winner_id:
                reward_gold = random.randint(20, 50)
                reward_exp = random.randint(10, 30)
                reward_paint = random.randint(0, 2)
                reward_canvas = random.randint(0, 1)

                user_model.add_gold(winner_id, reward_gold)
                user_model.add_exp(winner_id, reward_exp)
                if reward_paint > 0:
                    user_model.add_paint(winner_id, reward_paint)
                if reward_canvas > 0:
                    user_model.add_canvas(winner_id, reward_canvas)

                loser_id = battle.get('player1_id') if winner_id == battle.get('player2_id') else battle.get('player2_id')
                user_model.update_battle_result(winner_id, True)
                if loser_id:
                    user_model.update_battle_result(loser_id, False)
                    user_model.add_exp(loser_id, 5)

            weapon_model.add_exp(battle.get('player1_weapon_id'), random.randint(5, 15))
            if battle.get('player2_weapon_id'):
                weapon_model.add_exp(battle.get('player2_weapon_id'), random.randint(5, 15))

            weapon_model.decrease_durability(battle.get('player1_weapon_id'), random.randint(5, 15))
            if battle.get('player2_weapon_id'):
                weapon_model.decrease_durability(battle.get('player2_weapon_id'), random.randint(5, 15))

        now = datetime.now().isoformat()
        update_data = {
            'player1_hp': player1_hp,
            'player2_hp': player2_hp,
            'rounds': rounds,
            'battle_log': json.dumps(battle_log),
            'updated_at': now
        }

        if battle_complete:
            update_data['status'] = self.STATUS_COMPLETED
            update_data['winner_id'] = winner_id
            update_data['reward_gold'] = reward_gold
            update_data['reward_exp'] = reward_exp
            update_data['reward_paint'] = reward_paint
            update_data['reward_canvas'] = reward_canvas
            update_data['completed_at'] = now

        self.exec.update_by_id(battle_id, update_data)

        return {
            'success': True,
            'battle_id': battle_id,
            'round': rounds,
            'player1_hp': player1_hp,
            'player2_hp': player2_hp,
            'round_log': round_log,
            'battle_complete': battle_complete,
            'winner_id': winner_id,
            'rewards': {
                'gold': reward_gold if battle_complete else 0,
                'exp': reward_exp if battle_complete else 0,
                'paint': reward_paint if battle_complete else 0,
                'canvas': reward_canvas if battle_complete else 0
            } if battle_complete else None
        }

    def cancel_battle(self, battle_id: int) -> bool:
        battle = self.get_by_id(battle_id)
        if not battle or battle.get('status') not in [self.STATUS_WAITING, self.STATUS_IN_PROGRESS]:
            return False

        now = datetime.now().isoformat()
        affected = self.exec.update_by_id(battle_id, {
            'status': self.STATUS_CANCELLED,
            'updated_at': now
        })
        return affected > 0

    def create_pve_enemy(self, player_level: int) -> Dict[str, Any]:
        from app.model.ty_model.weapon import WeaponModel
        weapon_model = WeaponModel()

        enemy_names = ['木人桩', '训练机器人', '野生涂鸦怪', '火焰涂鸦兽', '冰霜涂鸦灵']
        enemy_name = random.choice(enemy_names)

        base_stats = 5 + player_level * 2
        enemy_weapon_data = {
            'id': 0,
            'name': f'{enemy_name}的武器',
            'attack': base_stats + random.randint(0, 5),
            'defense': max(1, base_stats - 3 + random.randint(0, 3)),
            'speed': base_stats + random.randint(-2, 3),
            'level': player_level,
            'rarity': 1
        }

        return {
            'user_id': -1,
            'nickname': enemy_name,
            'level': player_level,
            'weapon': enemy_weapon_data
        }

    def to_public_dict(self, battle: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': battle.get('id'),
            'player1_id': battle.get('player1_id'),
            'player2_id': battle.get('player2_id'),
            'player1_weapon_id': battle.get('player1_weapon_id'),
            'player2_weapon_id': battle.get('player2_weapon_id'),
            'mode': battle.get('mode'),
            'mode_text': self.get_mode_text(battle.get('mode', 'pve')),
            'status': battle.get('status'),
            'status_text': self.get_status_text(battle.get('status', 0)),
            'player1_hp': battle.get('player1_hp'),
            'player2_hp': battle.get('player2_hp'),
            'max_hp': battle.get('max_hp'),
            'winner_id': battle.get('winner_id'),
            'rounds': battle.get('rounds'),
            'battle_log': json.loads(battle.get('battle_log', '[]')) if battle.get('battle_log') else [],
            'reward_gold': battle.get('reward_gold'),
            'reward_exp': battle.get('reward_exp'),
            'reward_paint': battle.get('reward_paint'),
            'reward_canvas': battle.get('reward_canvas'),
            'created_at': battle.get('created_at'),
            'completed_at': battle.get('completed_at')
        }

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_WAITING: '等待中',
            self.STATUS_IN_PROGRESS: '进行中',
            self.STATUS_COMPLETED: '已完成',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def get_mode_text(self, mode: str) -> str:
        mode_map = {
            self.MODE_PVE: '人机对战',
            self.MODE_PVP: '玩家对战',
            self.MODE_RANKED: '排位赛'
        }
        return mode_map.get(mode, '其他')
