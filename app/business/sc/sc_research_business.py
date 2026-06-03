from typing import Dict, Any, List, Optional
from app.model.sc import ScResearchModel, ScUserModel, ScPartModel, ScUserPartModel
import random


class ScResearchBusiness:
    def __init__(self):
        self.research_model = ScResearchModel()
        self.user_model = ScUserModel()
        self.part_model = ScPartModel()
        self.user_part_model = ScUserPartModel()

    def _validate_part_type(self, part_type: str) -> bool:
        valid_types = [
            ScResearchModel.PART_TYPE_ENGINE,
            ScResearchModel.PART_TYPE_CHASSIS,
            ScResearchModel.PART_TYPE_AERODYNAMICS,
            ScResearchModel.PART_TYPE_TIRES,
            ScResearchModel.PART_TYPE_GEARBOX
        ]
        return part_type in valid_types

    def _map_research_to_part_type(self, research_type: str) -> str:
        type_map = {
            ScResearchModel.PART_TYPE_ENGINE: ScPartModel.TYPE_ENGINE,
            ScResearchModel.PART_TYPE_CHASSIS: ScPartModel.TYPE_CHASSIS,
            ScResearchModel.PART_TYPE_AERODYNAMICS: ScPartModel.TYPE_AERO,
            ScResearchModel.PART_TYPE_TIRES: ScPartModel.TYPE_TIRE,
            ScResearchModel.PART_TYPE_GEARBOX: ScPartModel.TYPE_SUSPENSION
        }
        return type_map.get(research_type, ScPartModel.TYPE_ENGINE)

    def _generate_part_name(self, part_type: str, tier: int) -> str:
        tier_names = {
            1: '基础',
            2: '进阶',
            3: '专业',
            4: '顶级',
            5: '传奇'
        }
        type_names = {
            ScPartModel.TYPE_ENGINE: '引擎',
            ScPartModel.TYPE_CHASSIS: '底盘',
            ScPartModel.TYPE_SUSPENSION: '变速箱',
            ScPartModel.TYPE_TIRE: '轮胎',
            ScPartModel.TYPE_BODY: '车身',
            ScPartModel.TYPE_AERO: '空气动力学套件'
        }
        tier_name = tier_names.get(min(tier, 5), '传奇')
        type_name = type_names.get(part_type, '零件')
        suffix = random.randint(100, 999)
        return f'{tier_name}{type_name}-{suffix}'

    def _generate_part_stats(self, part_type: str, tier: int) -> Dict[str, int]:
        base_stats = {
            ScPartModel.TYPE_ENGINE: {'weight': 80, 'power': 150, 'grip': 0, 'aerodynamics': 0},
            ScPartModel.TYPE_CHASSIS: {'weight': 180, 'power': 0, 'grip': 15, 'aerodynamics': 0},
            ScPartModel.TYPE_SUSPENSION: {'weight': 60, 'power': 0, 'grip': 20, 'aerodynamics': 0},
            ScPartModel.TYPE_TIRE: {'weight': 35, 'power': 0, 'grip': 30, 'aerodynamics': 0},
            ScPartModel.TYPE_BODY: {'weight': 140, 'power': 0, 'grip': 5, 'aerodynamics': 15},
            ScPartModel.TYPE_AERO: {'weight': 25, 'power': 0, 'grip': 8, 'aerodynamics': 30}
        }

        base = base_stats.get(part_type, base_stats[ScPartModel.TYPE_ENGINE])
        multiplier = 1.0 + (tier - 1) * 0.3

        stats = {}
        for key, value in base.items():
            stats[key] = int(value * multiplier)

        stats['price'] = tier * 1000 + stats.get('power', 0) + stats.get('grip', 0) * 10 + stats.get('aerodynamics', 0) * 10
        stats['durability'] = max(50, 100 - tier * 5)

        return stats

    def _unlock_new_part(self, user_id: int, research: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        research_type = research.get('part_type', '')
        research_level = research.get('research_level', 1)

        part_type = self._map_research_to_part_type(research_type)
        part_name = self._generate_part_name(part_type, research_level)
        stats = self._generate_part_stats(part_type, research_level)

        part_id = self.part_model.create(
            name=part_name,
            type=part_type,
            tier=research_level,
            price=stats['price'],
            weight=stats['weight'],
            power=stats['power'],
            grip=stats['grip'],
            aerodynamics=stats['aerodynamics'],
            durability=stats['durability'],
            description=f'通过研究解锁的{self.research_model.get_part_type_text(research_type)}零件，等级{research_level}',
            is_default=0
        )

        if part_id > 0:
            user_part_id = self.user_part_model.create(user_id, part_id, 1)
            if user_part_id > 0:
                part = self.part_model.get_by_id(part_id)
                return {
                    'part_id': part_id,
                    'user_part_id': user_part_id,
                    'part': part
                }

        return None

    def start_research(self, user_id: int, part_type: str) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        if not self._validate_part_type(part_type):
            return {
                'code': 1,
                'msg': '研究类型无效',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        existing_research = self.research_model.get_by_user_and_type(user_id, part_type, is_complete=0)
        if existing_research:
            return {
                'code': 1,
                'msg': '该类型已有进行中的研究',
                'data': None
            }

        completed_research = self.research_model.get_by_user_and_type(user_id, part_type, is_complete=1)
        current_level = len(completed_research) + 1

        cost_coins = current_level * 1000
        required_exp = current_level * 500

        user_coins = user.get('coins', 0)
        if user_coins < cost_coins:
            return {
                'code': 1,
                'msg': '金币不足',
                'data': {
                    'required_coins': cost_coins,
                    'current_coins': user_coins
                }
            }

        affected = self.user_model.update_coins(user_id, -cost_coins)
        if affected <= 0:
            return {
                'code': 1,
                'msg': '金币扣除失败',
                'data': None
            }

        research_id = self.research_model.create(
            user_id=user_id,
            part_type=part_type,
            research_level=current_level,
            required_exp=required_exp,
            cost_coins=cost_coins
        )

        if research_id > 0:
            research = self.research_model.get_by_id(research_id)
            return {
                'code': 0,
                'msg': '研究开始成功',
                'data': {
                    'research_id': research_id,
                    'part_type': part_type,
                    'part_type_text': self.research_model.get_part_type_text(part_type),
                    'research_level': current_level,
                    'required_exp': required_exp,
                    'cost_coins': cost_coins,
                    'progress': 0.0,
                    'progress_percent': 0.0,
                    'started_at': research.get('started_at') if research else None
                }
            }

        self.user_model.update_coins(user_id, cost_coins)
        return {
            'code': 1,
            'msg': '研究开始失败',
            'data': None
        }

    def get_user_research(self, user_id: int) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': []
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': []
            }

        research_list = self.research_model.get_by_user_id(user_id)
        for research in research_list:
            research['part_type_text'] = self.research_model.get_part_type_text(research.get('part_type', ''))
            required_exp = research.get('required_exp', 1)
            progress = research.get('progress', 0.0)
            research['progress_percent'] = round((progress / required_exp) * 100 if required_exp > 0 else 0, 2)
            research['is_complete_text'] = '已完成' if research.get('is_complete', 0) else '进行中'

        return {
            'code': 0,
            'msg': 'success',
            'data': research_list
        }

    def add_progress(self, user_id: int, research_id: int, exp_amount: float) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        if not research_id or research_id <= 0:
            return {
                'code': 1,
                'msg': '研究项目ID无效',
                'data': None
            }

        if exp_amount <= 0:
            return {
                'code': 1,
                'msg': '经验值必须大于0',
                'data': None
            }

        research = self.research_model.get_by_id(research_id)
        if not research:
            return {
                'code': 1,
                'msg': '研究项目不存在',
                'data': None
            }

        if research.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作该研究项目',
                'data': None
            }

        if research.get('is_complete', 0):
            return {
                'code': 1,
                'msg': '该研究已完成',
                'data': None
            }

        was_complete = research.get('is_complete', 0)
        result = self.research_model.update_progress(research_id, exp_amount)

        if not result.get('success', False):
            return {
                'code': 1,
                'msg': '进度更新失败',
                'data': None
            }

        unlocked_part = None
        if result.get('is_complete', 0) and not was_complete:
            unlocked_part = self._unlock_new_part(user_id, research)

        return {
            'code': 0,
            'msg': '进度更新成功',
            'data': {
                'research_id': research_id,
                'progress': result.get('progress', 0.0),
                'progress_percent': result.get('progress_percent', 0.0),
                'is_complete': result.get('is_complete', 0),
                'unlocked_part': unlocked_part
            }
        }

    def get_research_detail(self, research_id: int, user_id: int) -> Dict[str, Any]:
        if not research_id or research_id <= 0:
            return {
                'code': 1,
                'msg': '研究项目ID无效',
                'data': None
            }

        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        research = self.research_model.get_by_id(research_id)
        if not research:
            return {
                'code': 1,
                'msg': '研究项目不存在',
                'data': None
            }

        if research.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权访问该研究项目',
                'data': None
            }

        research['part_type_text'] = self.research_model.get_part_type_text(research.get('part_type', ''))
        required_exp = research.get('required_exp', 1)
        progress = research.get('progress', 0.0)
        research['progress_percent'] = round((progress / required_exp) * 100 if required_exp > 0 else 0, 2)
        research['is_complete_text'] = '已完成' if research.get('is_complete', 0) else '进行中'
        research['remaining_exp'] = max(0, required_exp - progress)

        return {
            'code': 0,
            'msg': 'success',
            'data': research
        }

    def cancel_research(self, user_id: int, research_id: int) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        if not research_id or research_id <= 0:
            return {
                'code': 1,
                'msg': '研究项目ID无效',
                'data': None
            }

        research = self.research_model.get_by_id(research_id)
        if not research:
            return {
                'code': 1,
                'msg': '研究项目不存在',
                'data': None
            }

        if research.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权取消该研究项目',
                'data': None
            }

        if research.get('is_complete', 0):
            return {
                'code': 1,
                'msg': '已完成的研究无法取消',
                'data': None
            }

        refund_coins = int(research.get('cost_coins', 0) * 0.5)

        affected = self.research_model.delete(research_id)
        if affected <= 0:
            return {
                'code': 1,
                'msg': '取消研究失败',
                'data': None
            }

        if refund_coins > 0:
            self.user_model.update_coins(user_id, refund_coins)

        return {
            'code': 0,
            'msg': '研究已取消，返还50%金币',
            'data': {
                'refund_coins': refund_coins
            }
        }
