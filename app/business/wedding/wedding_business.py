from typing import Dict, Any, List, Optional
from fastapi import Request
from app.model.wedding import (
    GuestModel, BudgetItemModel, VendorModel, TaskModel, WeddingSettingModel
)
from .auth_permission import RolePermission, get_role_from_request, Role, check_delete_permission


class WeddingBusiness:
    def __init__(self):
        self.guest_model = GuestModel()
        self.budget_model = BudgetItemModel()
        self.vendor_model = VendorModel()
        self.task_model = TaskModel()
        self.setting_model = WeddingSettingModel()

    # ==================== Guests ====================
    def get_guests(self, group_tag: str = None, rsvp_status: str = None) -> Dict[str, Any]:
        guests = self.guest_model.get_all(group_tag, rsvp_status)
        counts = self.guest_model.count_by_status()
        group_counts = self.guest_model.count_by_group()
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'list': guests,
                'status_counts': counts,
                'group_counts': group_counts,
                'total': len(guests)
            }
        }

    def create_guest(self, request: Request, name: str, group_tag: str = '亲友',
                     rsvp_status: str = '待回复', meal_preference: str = '') -> Dict[str, Any]:
        if not name or not name.strip():
            return {'code': 1, 'message': '宾客姓名不能为空', 'data': None}
        valid_groups = ['亲友', '同事', '长辈']
        if group_tag not in valid_groups:
            return {'code': 1, 'message': f'分组必须是以下之一: {valid_groups}', 'data': None}
        valid_status = ['待回复', '已确认', '已拒绝']
        if rsvp_status not in valid_status:
            return {'code': 1, 'message': f'RSVP状态必须是以下之一: {valid_status}', 'data': None}
        try:
            new_id = self.guest_model.create(
                name=name.strip(),
                group_tag=group_tag,
                rsvp_status=rsvp_status,
                meal_preference=meal_preference
            )
            return {
                'code': 0,
                'message': '添加成功',
                'data': self.guest_model.get_by_id(new_id)
            }
        except Exception as e:
            return {'code': 1, 'message': f'添加失败: {e}', 'data': None}

    def update_guest_rsvp(self, request: Request, guest_id: int,
                          rsvp_status: str, meal_preference: str = None) -> Dict[str, Any]:
        valid_status = ['待回复', '已确认', '已拒绝']
        if rsvp_status not in valid_status:
            return {'code': 1, 'message': f'RSVP状态必须是以下之一: {valid_status}', 'data': None}
        guest = self.guest_model.get_by_id(guest_id)
        if not guest:
            return {'code': 1, 'message': '宾客不存在', 'data': None}
        try:
            self.guest_model.update_rsvp(guest_id, rsvp_status, meal_preference)
            return {
                'code': 0,
                'message': 'RSVP状态已更新',
                'data': self.guest_model.get_by_id(guest_id)
            }
        except Exception as e:
            return {'code': 1, 'message': f'更新失败: {e}', 'data': None}

    def update_guest(self, request: Request, guest_id: int, **kwargs) -> Dict[str, Any]:
        guest = self.guest_model.get_by_id(guest_id)
        if not guest:
            return {'code': 1, 'message': '宾客不存在', 'data': None}
        try:
            self.guest_model.update(guest_id, **kwargs)
            return {
                'code': 0,
                'message': '更新成功',
                'data': self.guest_model.get_by_id(guest_id)
            }
        except Exception as e:
            return {'code': 1, 'message': f'更新失败: {e}', 'data': None}

    def delete_guest(self, request: Request, guest_id: int) -> Dict[str, Any]:
        perm_check = check_delete_permission(request, "guests")
        if not perm_check['allowed']:
            return {'code': 1, 'message': perm_check['message'], 'data': None}
        guest = self.guest_model.get_by_id(guest_id)
        if not guest:
            return {'code': 1, 'message': '宾客不存在', 'data': None}
        affected = self.guest_model.delete(guest_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}

    # ==================== Budget ====================
    def get_budget_items(self, category: str = None) -> Dict[str, Any]:
        items = self.budget_model.get_all(category)
        summary = self.budget_model.get_summary()
        from app.model.wedding.budget import CATEGORIES
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'list': items,
                'summary': summary,
                'categories': CATEGORIES,
                'total': len(items)
            }
        }

    def create_budget_item(self, request: Request, category: str, item_name: str,
                           estimated_cost: float = 0, actual_cost: float = 0,
                           paid: int = 0) -> Dict[str, Any]:
        from app.model.wedding.budget import CATEGORIES
        if category not in CATEGORIES:
            return {'code': 1, 'message': f'类别必须是以下之一: {CATEGORIES}', 'data': None}
        if not item_name or not item_name.strip():
            return {'code': 1, 'message': '项目名称不能为空', 'data': None}
        try:
            new_id = self.budget_model.create(
                category=category,
                item_name=item_name.strip(),
                estimated_cost=estimated_cost or 0,
                actual_cost=actual_cost or 0,
                paid=1 if paid else 0
            )
            return {
                'code': 0,
                'message': '添加成功',
                'data': self.budget_model.get_by_id(new_id)
            }
        except Exception as e:
            return {'code': 1, 'message': f'添加失败: {e}', 'data': None}

    def update_budget_item(self, request: Request, item_id: int, **kwargs) -> Dict[str, Any]:
        item = self.budget_model.get_by_id(item_id)
        if not item:
            return {'code': 1, 'message': '预算项目不存在', 'data': None}
        try:
            self.budget_model.update(item_id, **kwargs)
            return {
                'code': 0,
                'message': '更新成功',
                'data': self.budget_model.get_by_id(item_id)
            }
        except Exception as e:
            return {'code': 1, 'message': f'更新失败: {e}', 'data': None}

    def delete_budget_item(self, request: Request, item_id: int) -> Dict[str, Any]:
        perm_check = check_delete_permission(request, "budget_items")
        if not perm_check['allowed']:
            return {'code': 1, 'message': perm_check['message'], 'data': None}
        item = self.budget_model.get_by_id(item_id)
        if not item:
            return {'code': 1, 'message': '预算项目不存在', 'data': None}
        affected = self.budget_model.delete(item_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}

    # ==================== Vendors ====================
    def get_vendors(self) -> Dict[str, Any]:
        vendors = self.vendor_model.get_all()
        upcoming = self.vendor_model.get_upcoming_deadlines(days=3)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'list': vendors,
                'upcoming_deadlines': upcoming,
                'total': len(vendors)
            }
        }

    def create_vendor(self, request: Request, name: str, service: str,
                      contact: str = '', contract_deadline: str = None) -> Dict[str, Any]:
        if not name or not name.strip():
            return {'code': 1, 'message': '供应商名称不能为空', 'data': None}
        if not service or not service.strip():
            return {'code': 1, 'message': '服务类型不能为空', 'data': None}
        try:
            new_id = self.vendor_model.create(
                name=name.strip(),
                service=service.strip(),
                contact=contact or '',
                contract_deadline=contract_deadline or None
            )
            return {
                'code': 0,
                'message': '添加成功',
                'data': self.vendor_model.get_by_id(new_id)
            }
        except Exception as e:
            return {'code': 1, 'message': f'添加失败: {e}', 'data': None}

    def update_vendor(self, request: Request, vendor_id: int, **kwargs) -> Dict[str, Any]:
        vendor = self.vendor_model.get_by_id(vendor_id)
        if not vendor:
            return {'code': 1, 'message': '供应商不存在', 'data': None}
        try:
            self.vendor_model.update(vendor_id, **kwargs)
            return {
                'code': 0,
                'message': '更新成功',
                'data': self.vendor_model.get_by_id(vendor_id)
            }
        except Exception as e:
            return {'code': 1, 'message': f'更新失败: {e}', 'data': None}

    def delete_vendor(self, request: Request, vendor_id: int) -> Dict[str, Any]:
        perm_check = check_delete_permission(request, "vendors")
        if not perm_check['allowed']:
            return {'code': 1, 'message': perm_check['message'], 'data': None}
        vendor = self.vendor_model.get_by_id(vendor_id)
        if not vendor:
            return {'code': 1, 'message': '供应商不存在', 'data': None}
        affected = self.vendor_model.delete(vendor_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}

    # ==================== Tasks ====================
    def get_tasks(self) -> Dict[str, Any]:
        tasks = self.task_model.get_all()
        done_count = sum(1 for t in tasks if t.get('done'))
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'list': tasks,
                'done_count': done_count,
                'pending_count': len(tasks) - done_count,
                'total': len(tasks)
            }
        }

    def create_task(self, request: Request, title: str, deadline: str = None,
                    priority: int = 2) -> Dict[str, Any]:
        if not title or not title.strip():
            return {'code': 1, 'message': '任务标题不能为空', 'data': None}
        if priority not in [1, 2, 3]:
            return {'code': 1, 'message': '优先级必须是 1(高)、2(中)、3(低)', 'data': None}
        try:
            new_id = self.task_model.create(
                title=title.strip(),
                deadline=deadline or None,
                priority=priority
            )
            return {
                'code': 0,
                'message': '添加成功',
                'data': self.task_model.get_by_id(new_id)
            }
        except Exception as e:
            return {'code': 1, 'message': f'添加失败: {e}', 'data': None}

    def toggle_task_done(self, request: Request, task_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {'code': 1, 'message': '任务不存在', 'data': None}
        self.task_model.toggle_done(task_id)
        return {
            'code': 0,
            'message': '状态已切换',
            'data': self.task_model.get_by_id(task_id)
        }

    def update_task(self, request: Request, task_id: int, **kwargs) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {'code': 1, 'message': '任务不存在', 'data': None}
        try:
            self.task_model.update(task_id, **kwargs)
            return {
                'code': 0,
                'message': '更新成功',
                'data': self.task_model.get_by_id(task_id)
            }
        except Exception as e:
            return {'code': 1, 'message': f'更新失败: {e}', 'data': None}

    def delete_task(self, request: Request, task_id: int) -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {'code': 1, 'message': '任务不存在', 'data': None}
        affected = self.task_model.delete(task_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}

    # ==================== Settings & Countdown ====================
    def get_countdown(self) -> Dict[str, Any]:
        countdown = self.setting_model.get_countdown()
        settings = self.setting_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': {
                **countdown,
                'settings': settings
            }
        }

    def update_setting(self, request: Request, key: str, value: str) -> Dict[str, Any]:
        if not key:
            return {'code': 1, 'message': '配置键不能为空', 'data': None}
        try:
            self.setting_model.set(key, value)
            return {
                'code': 0,
                'message': '设置已更新',
                'data': {key: self.setting_model.get(key)}
            }
        except Exception as e:
            return {'code': 1, 'message': f'更新失败: {e}', 'data': None}

    def get_all_settings(self) -> Dict[str, Any]:
        return {
            'code': 0,
            'message': 'success',
            'data': self.setting_model.get_all()
        }

    # ==================== Role Info ====================
    def get_role_info(self, request: Request) -> Dict[str, Any]:
        role = get_role_from_request(request)
        if role is None:
            return {
                'code': 401,
                'message': '请先登录',
                'data': None
            }
        role_names = {
            Role.PLANNER: '策划师',
            Role.PARTNER: '伴侣',
            Role.GUEST: '宾客',
        }
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'role': role.value,
                'role_name': role_names.get(role, '未知'),
                'permissions': RolePermission.ROLE_PERMISSIONS.get(role, {})
            }
        }
