import random
from typing import Dict, Any, List, Optional, Tuple
from app.model.vault import VaultSaveModel, VaultResidentModel, VaultFacilityModel, VaultLogModel


NAMES = ['张伟', '李娜', '王强', '刘洋', '陈静', '杨帆', '赵磊', '周敏', '吴浩', '徐丽',
         '孙浩', '马超', '朱琳', '胡军', '郭雪', '何勇', '罗婷', '梁波', '宋佳', '郑凯']

ASSIGNMENTS = {
    'idle': '待命',
    'scavenge': '地表搜寻',
    'maintenance': '维护设施',
    'farming': '种植食物',
    'guard': '守卫大门'
}

FACILITY_TYPES = {
    'water_cycler': {
        'name': '水循环器',
        'description': '净化并循环水资源',
        'base_output': 10,
        'upgrade_cost_base': {'energy': 10},
        'max_level': 5
    },
    'generator': {
        'name': '发电机',
        'description': '为避难所提供电力',
        'base_output': 10,
        'upgrade_cost_base': {'food': 10},
        'max_level': 5
    },
    'medbay': {
        'name': '医疗站',
        'description': '治疗受伤的居民',
        'base_output': 5,
        'upgrade_cost_base': {'water': 10},
        'max_level': 5
    }
}


class VaultBusiness:
    def __init__(self):
        self.save_model = VaultSaveModel()
        self.resident_model = VaultResidentModel()
        self.facility_model = VaultFacilityModel()
        self.log_model = VaultLogModel()

    def _get_random_name(self, used_names: List[str]) -> str:
        available = [n for n in NAMES if n not in used_names]
        if not available:
            return f'幸存者{random.randint(100, 999)}'
        return random.choice(available)

    def _clamp(self, value: int, min_val: int = 0, max_val: int = 100) -> int:
        return max(min_val, min(max_val, value))

    def create_new_game(self, name: str = 'Vault 101') -> Dict[str, Any]:
        save_id = self.save_model.create(name)

        self.facility_model.create(save_id, 'water_cycler', 1)
        self.facility_model.create(save_id, 'generator', 1)
        self.facility_model.create(save_id, 'medbay', 1)

        used_names = []
        for _ in range(3):
            resident_name = self._get_random_name(used_names)
            used_names.append(resident_name)
            self.resident_model.create(save_id, resident_name, 80, 100, 80, 'idle')

        self.save_model.update_save(save_id, current_food=80, current_water=60)
        self.log_model.create(save_id, 1, 'info', f'避难所 "{name}" 启动运行。初始居民已安置。')

        return self._build_state(save_id)

    def list_saves(self) -> Dict[str, Any]:
        saves = self.save_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': saves
        }

    def get_game_state(self, save_id: int) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        if not save:
            return {'code': 1, 'message': '存档不存在', 'data': None}
        return self._build_state(save_id)

    def _build_state(self, save_id: int) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        residents = self.resident_model.get_by_save(save_id)
        facilities = self.facility_model.get_by_save(save_id)
        logs = self.log_model.get_by_save(save_id, 30)

        capacity = 4
        for f in facilities:
            if f['type'] == 'water_cycler':
                capacity += f['level'] * 2
            if f['type'] == 'generator':
                capacity += f['level'] * 2

        facility_info = []
        for f in facilities:
            info = dict(f)
            if f['level'] < FACILITY_TYPES[f['type']]['max_level']:
                info['upgrade_cost'] = self._calculate_upgrade_cost(f['type'], f['level'])
            else:
                info['upgrade_cost'] = None
            facility_info.append(info)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'save': save,
                'residents': residents,
                'facilities': facility_info,
                'logs': logs,
                'capacity': capacity
            }
        }

    def assign_resident(self, save_id: int, resident_id: int, assignment: str) -> Dict[str, Any]:
        if assignment not in ASSIGNMENTS:
            return {'code': 1, 'message': '无效的工作分配', 'data': None}

        resident = self.resident_model.get_by_id(resident_id)
        if not resident or resident['save_id'] != save_id:
            return {'code': 1, 'message': '居民不存在', 'data': None}

        self.resident_model.update_resident(resident_id, assignment=assignment)
        self.log_model.create(save_id, self.save_model.get_by_id(save_id)['day'], 'info',
                              f'{resident["name"]} 被分配去{ASSIGNMENTS[assignment]}。')

        return self._build_state(save_id)

    def _calculate_upgrade_cost(self, facility_type: str, current_level: int) -> Dict[str, int]:
        cfg = FACILITY_TYPES[facility_type]
        cost = {}
        for resource, base_amount in cfg['upgrade_cost_base'].items():
            cost[resource] = base_amount * (current_level + 1)
        return cost

    def upgrade_facility(self, save_id: int, facility_type: str) -> Dict[str, Any]:
        if facility_type not in FACILITY_TYPES:
            return {'code': 1, 'message': '无效的设施类型', 'data': None}

        save = self.save_model.get_by_id(save_id)
        facility = self.facility_model.get_by_type(save_id, facility_type)

        if not facility:
            return {'code': 1, 'message': '设施不存在', 'data': None}

        cfg = FACILITY_TYPES[facility_type]
        if facility['level'] >= cfg['max_level']:
            return {'code': 1, 'message': f'{cfg["name"]}已达到最高等级', 'data': None}

        cost = self._calculate_upgrade_cost(facility_type, facility['level'])
        for resource, amount in cost.items():
            current = save[f'current_{resource}']
            if current < amount:
                return {'code': 1, 'message': f'{resource}不足，需要{amount}', 'data': None}

        updates = {}
        for resource, amount in cost.items():
            updates[f'current_{resource}'] = save[f'current_{resource}'] - amount

        self.save_model.update_save(save_id, **updates)
        self.facility_model.update_facility(facility['id'], level=facility['level'] + 1)
        self.log_model.create(save_id, save['day'], 'success',
                              f'{cfg["name"]}升级至 {facility["level"] + 1} 级！')

        return self._build_state(save_id)

    def advance_day(self, save_id: int) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        if not save:
            return {'code': 1, 'message': '存档不存在', 'data': None}

        residents = self.resident_model.get_by_save(save_id)
        facilities = self.facility_model.get_by_save(save_id)

        new_day = save['day'] + 1
        current_energy = save['current_energy']
        current_water = save['current_water']
        current_food = save['current_food']
        current_medicine = save['current_medicine']

        day_logs = []

        assignment_counts = {k: 0 for k in ASSIGNMENTS}
        for r in residents:
            assignment_counts[r['assignment']] += 1

        energy_output = 0
        water_output = 0
        food_output = 5
        medicine_output = 0

        for f in facilities:
            cfg = FACILITY_TYPES[f['type']]
            if f['type'] == 'generator':
                energy_output += cfg['base_output'] * f['level'] + assignment_counts['maintenance'] * 3
            elif f['type'] == 'water_cycler':
                water_output += cfg['base_output'] * f['level'] + assignment_counts['maintenance'] * 3
            elif f['type'] == 'medbay':
                medicine_output += cfg['base_output'] * f['level'] + assignment_counts['maintenance'] * 2

        food_output += assignment_counts['farming'] * 12

        scavengers = [r for r in residents if r['assignment'] == 'scavenge']
        for scavenger in scavengers:
            if random.random() < 0.7:
                loot = random.choice(['food', 'water', 'energy', 'medicine'])
                loot_amount = random.randint(5, 15)
                if loot == 'food':
                    current_food += loot_amount
                    day_logs.append(('success', f'{scavenger["name"]} 从地表带回了 {loot_amount} 单位食物。'))
                elif loot == 'water':
                    current_water += loot_amount
                    day_logs.append(('success', f'{scavenger["name"]} 从地表带回了 {loot_amount} 单位净水。'))
                elif loot == 'energy':
                    current_energy += loot_amount
                    day_logs.append(('success', f'{scavenger["name"]} 从地表带回了 {loot_amount} 单位能源。'))
                elif loot == 'medicine':
                    current_medicine += loot_amount // 2
                    day_logs.append(('success', f'{scavenger["name"]} 从地表带回了 {loot_amount // 2} 单位药品。'))
            else:
                radiation_damage = random.randint(5, 25)
                new_health = self._clamp(scavenger['health'] - radiation_damage)
                self.resident_model.update_resident(scavenger['id'], health=new_health)
                day_logs.append(('danger', f'{scavenger["name"]} 在地表遭受辐射，健康值下降 {radiation_damage}！'))

        guards = assignment_counts['guard']

        for resident in residents:
            if not resident['is_alive']:
                continue

            hunger = self._clamp(resident['hunger'] - random.randint(3, 8))
            mood = self._clamp(resident['mood'] - random.randint(1, 4))
            health = resident['health']

            if current_food >= 4:
                current_food -= 4
                hunger = self._clamp(hunger + 20)
            else:
                hunger = self._clamp(hunger - 3)
                health = self._clamp(health - 5)
                day_logs.append(('warning', f'{resident["name"]} 没有足够的食物，健康受损。'))

            if current_water >= 3:
                current_water -= 3
                mood = self._clamp(mood + 5)
            else:
                mood = self._clamp(mood - 8)

            if hunger <= 0:
                health = self._clamp(health - 15)
                day_logs.append(('danger', f'{resident["name"]} 因饥饿濒临死亡！'))

            if health < 50 and current_medicine >= 2:
                medbay_level = next((f['level'] for f in facilities if f['type'] == 'medbay'), 0)
                if medbay_level > 0 and assignment_counts['maintenance'] > 0:
                    current_medicine -= 2
                    health = self._clamp(health + 20 + medbay_level * 5)
                    day_logs.append(('info', f'{resident["name"]} 在医疗站接受了治疗。'))

            if health <= 0:
                self.resident_model.update_resident(resident['id'], is_alive=0, health=0)
                day_logs.append(('danger', f'{resident["name"]} 不幸去世了...'))
                for other in residents:
                    if other['id'] != resident['id'] and other['is_alive']:
                        new_mood = self._clamp(other['mood'] - 15)
                        self.resident_model.update_resident(other['id'], mood=new_mood)
                continue

            if mood < 30:
                day_logs.append(('warning', f'{resident["name"]} 士气低落。'))

            self.resident_model.update_resident(
                resident['id'],
                hunger=hunger,
                health=health,
                mood=mood
            )

        current_energy = self._clamp(current_energy + energy_output - len(residents) * 2, 0, save['max_energy'])
        current_water = self._clamp(current_water + water_output, 0, save['max_water'])
        current_food = self._clamp(current_food + food_output, 0, save['max_food'])
        current_medicine = self._clamp(current_medicine + medicine_output, 0, save['max_medicine'])

        event_counter = save['event_counter'] + 1
        wanderer_event = None

        if event_counter >= random.randint(2, 4):
            capacity = self._calculate_capacity(facilities)
            alive_residents = [r for r in residents if r['is_alive']]
            if len(alive_residents) < capacity:
                wanderer_name = self._get_random_name([r['name'] for r in residents])
                wanderer_stats = {
                    'name': wanderer_name,
                    'hunger': random.randint(20, 60),
                    'health': random.randint(30, 80),
                    'mood': random.randint(40, 70)
                }
                wanderer_event = wanderer_stats
                day_logs.append(('info', f'一名流浪者 {wanderer_name} 敲响了避难所的大门，请求入住。'))
                event_counter = 0

        if guards == 0 and len(residents) > 0 and random.random() < 0.15:
            raid_loss = random.randint(5, 15)
            current_food = max(0, current_food - raid_loss)
            day_logs.append(('danger', f'避难所遭到突袭！损失了 {raid_loss} 单位食物。建议设置守卫。'))

        for log_type, msg in day_logs:
            self.log_model.create(save_id, new_day, log_type, msg)

        self.save_model.update_save(
            save_id,
            day=new_day,
            current_energy=current_energy,
            current_water=current_water,
            current_food=current_food,
            current_medicine=current_medicine,
            event_counter=event_counter
        )

        result = self._build_state(save_id)
        if wanderer_event:
            result['data']['wanderer_event'] = wanderer_event

        return result

    def _calculate_capacity(self, facilities: List[Dict[str, Any]]) -> int:
        capacity = 4
        for f in facilities:
            if f['type'] == 'water_cycler':
                capacity += f['level'] * 2
            if f['type'] == 'generator':
                capacity += f['level'] * 2
        return capacity

    def accept_wanderer(self, save_id: int, wanderer_name: str, hunger: int, health: int, mood: int) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        facilities = self.facility_model.get_by_save(save_id)
        residents = self.resident_model.get_by_save(save_id)

        capacity = self._calculate_capacity(facilities)
        if len(residents) >= capacity:
            return {'code': 1, 'message': f'避难所已满（{len(residents)}/{capacity}），无法接纳更多居民。', 'data': None}

        self.resident_model.create(save_id, wanderer_name, hunger, health, mood, 'idle')
        self.log_model.create(save_id, save['day'], 'success', f'{wanderer_name} 加入了避难所！')

        return self._build_state(save_id)

    def reject_wanderer(self, save_id: int, wanderer_name: str) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        residents = self.resident_model.get_by_save(save_id)

        for r in residents:
            if r['is_alive']:
                new_mood = self._clamp(r['mood'] - 8)
                self.resident_model.update_resident(r['id'], mood=new_mood)

        self.log_model.create(save_id, save['day'], 'warning',
                              f'{wanderer_name} 被拒之门外。居民们心情受到影响。')

        return self._build_state(save_id)

    def delete_save(self, save_id: int) -> Dict[str, Any]:
        save = self.save_model.get_by_id(save_id)
        if not save:
            return {'code': 1, 'message': '存档不存在', 'data': None}
        self.save_model.delete(save_id)
        return {'code': 0, 'message': '删除成功', 'data': None}
