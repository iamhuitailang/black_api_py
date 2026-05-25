from typing import Dict, Any, List, Optional
from app.model.jianshen import (
    JianshenPlanModel, JianshenUserPlanModel, JianshenUserModel
)
import json
from datetime import datetime, date as date_type, timedelta


class JianshenPlanBusiness:
    def __init__(self):
        self.plan_model = JianshenPlanModel()
        self.user_plan_model = JianshenUserPlanModel()
        self.user_model = JianshenUserModel()

    def create_plan(self, user_id: int, name: str, description: str = '',
                    schedule: List[Dict] = None, difficulty: str = 'beginner',
                    cover: str = '') -> Dict[str, Any]:
        if not name:
            return {'code': 1, 'msg': '计划名称不能为空', 'data': None}
        schedule = schedule or []
        plan_id = self.plan_model.create(
            name=name, description=description,
            plan_type=JianshenPlanModel.TYPE_CUSTOM,
            schedule=json.dumps(schedule, ensure_ascii=False),
            cover=cover, difficulty=difficulty, created_by=user_id
        )
        if plan_id > 0:
            plan = self.plan_model.get_by_id(plan_id)
            return {'code': 0, 'msg': '创建成功', 'data': self.plan_model.to_dict(plan)}
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def get_plan_list(self, page: int = 1, page_size: int = 20,
                      plan_type: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.plan_model.get_all(page, page_size, plan_type, keyword)
        items = [self.plan_model.to_dict(item) for item in result.get('items', [])]
        return {
            'code': 0, 'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_plan(self, plan_id: int) -> Dict[str, Any]:
        plan = self.plan_model.get_by_id(plan_id)
        if not plan:
            return {'code': 1, 'msg': '计划不存在', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.plan_model.to_dict(plan)}

    def get_official_plans(self) -> Dict[str, Any]:
        plans = self.plan_model.get_official(limit=50)
        items = [self.plan_model.to_dict(p) for p in plans]
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_user_plans(self, user_id: int) -> Dict[str, Any]:
        plans = self.plan_model.get_by_user(user_id)
        items = [self.plan_model.to_dict(p) for p in plans]
        return {'code': 0, 'msg': 'success', 'data': items}

    def update_plan(self, plan_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        plan = self.plan_model.get_by_id(plan_id)
        if not plan:
            return {'code': 1, 'msg': '计划不存在', 'data': None}
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'schedule' in data:
            update_data['schedule'] = json.dumps(data['schedule'], ensure_ascii=False)
        if 'difficulty' in data:
            update_data['difficulty'] = data['difficulty']
        if 'cover' in data:
            update_data['cover'] = data['cover']
        self.plan_model.update(plan_id, update_data)
        updated = self.plan_model.get_by_id(plan_id)
        return {'code': 0, 'msg': '更新成功', 'data': self.plan_model.to_dict(updated)}

    def delete_plan(self, plan_id: int) -> Dict[str, Any]:
        plan = self.plan_model.get_by_id(plan_id)
        if not plan:
            return {'code': 1, 'msg': '计划不存在', 'data': None}
        self.plan_model.delete(plan_id)
        return {'code': 0, 'msg': '删除成功', 'data': None}

    def activate_plan(self, user_id: int, plan_id: int, start_date: str = '') -> Dict[str, Any]:
        plan = self.plan_model.get_by_id(plan_id)
        if not plan:
            return {'code': 1, 'msg': '计划不存在', 'data': None}
        if not start_date:
            start_date = date_type.today().isoformat()
        self.user_plan_model.create(user_id, plan_id, start_date)
        return {'code': 0, 'msg': '已激活', 'data': None}

    def deactivate_plan(self, user_id: int) -> Dict[str, Any]:
        self.user_plan_model.deactivate(user_id)
        return {'code': 0, 'msg': '已停用', 'data': None}

    def get_active_plan(self, user_id: int) -> Dict[str, Any]:
        up = self.user_plan_model.get_active_by_user(user_id)
        if not up:
            return {'code': 0, 'msg': 'success', 'data': None}
        plan = self.plan_model.get_by_id(up.get('plan_id'))
        if not plan:
            return {'code': 0, 'msg': 'success', 'data': None}
        data = self.plan_model.to_dict(plan)
        data['start_date'] = up.get('start_date')
        data['user_plan_id'] = up.get('id')
        return {'code': 0, 'msg': 'success', 'data': data}

    def get_today_tasks(self, user_id: int) -> Dict[str, Any]:
        up = self.user_plan_model.get_active_by_user(user_id)
        if not up:
            return {'code': 0, 'msg': 'success', 'data': []}
        plan = self.plan_model.get_by_id(up.get('plan_id'))
        if not plan:
            return {'code': 0, 'msg': 'success', 'data': []}
        start_date_str = up.get('start_date') or date_type.today().isoformat()
        try:
            start_date = date_type.fromisoformat(start_date_str)
        except Exception:
            start_date = date_type.today()
        today = date_type.today()
        day_index = ((today - start_date).days % 7) + 1
        try:
            schedule = json.loads(plan.get('schedule', '[]'))
        except Exception:
            schedule = []
        today_items = []
        for s in schedule:
            if s.get('day') == day_index:
                today_items = s.get('items', [])
                break
        return {'code': 0, 'msg': 'success', 'data': {
            'day': day_index,
            'plan_name': plan.get('name'),
            'items': today_items
        }}
