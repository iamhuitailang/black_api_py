from app.model.renovation import RoomModel, ExpenseModel, BudgetModel


class RenovationBusiness:
    def __init__(self):
        self.room_model = RoomModel()
        self.expense_model = ExpenseModel()
        self.budget_model = BudgetModel()

    def get_rooms(self):
        rooms = self.room_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': rooms
        }

    def add_room(self, name: str, status: str = 'not_started', budget: float = 0):
        if not name or not name.strip():
            return {'code': 1, 'message': '房间名称不能为空', 'data': None}
        try:
            new_id = self.room_model.create(name=name.strip(), status=status, budget=budget)
            room = self.room_model.get_by_id(new_id)
            return {'code': 0, 'message': 'success', 'data': room}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def update_room(self, room_id: int, name: str = None, status: str = None, budget: float = None):
        existing = self.room_model.get_by_id(room_id)
        if not existing:
            return {'code': 1, 'message': f'房间 {room_id} 不存在', 'data': None}
        try:
            self.room_model.update(room_id, name=name, status=status, budget=budget)
            room = self.room_model.get_by_id(room_id)
            return {'code': 0, 'message': 'success', 'data': room}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def delete_room(self, room_id: int):
        existing = self.room_model.get_by_id(room_id)
        if not existing:
            return {'code': 1, 'message': f'房间 {room_id} 不存在', 'data': None}
        self.room_model.delete(room_id)
        return {'code': 0, 'message': '删除成功', 'data': None}

    def get_expenses(self, room_id: int = None, category: str = None, start_date: str = None, end_date: str = None):
        expenses = self.expense_model.get_filtered(room_id=room_id, category=category, start_date=start_date, end_date=end_date)
        rooms = self.room_model.get_all()
        room_map = {r['id']: r['name'] for r in rooms}
        for exp in expenses:
            exp['room_name'] = room_map.get(exp['room_id'], '未知房间')
        return {
            'code': 0,
            'message': 'success',
            'data': expenses
        }

    def add_expense(self, room_id: int, category: str, amount: float, date: str, note: str = '', image_url: str = ''):
        if not room_id:
            return {'code': 1, 'message': '请选择房间', 'data': None}
        if not category or not category.strip():
            return {'code': 1, 'message': '请选择类别', 'data': None}
        if amount <= 0:
            return {'code': 1, 'message': '金额必须大于0', 'data': None}
        if not date:
            return {'code': 1, 'message': '请选择日期', 'data': None}
        room = self.room_model.get_by_id(room_id)
        if not room:
            return {'code': 1, 'message': '房间不存在', 'data': None}
        try:
            new_id = self.expense_model.create(
                room_id=room_id, category=category.strip(), amount=amount,
                date=date, note=note, image_url=image_url
            )
            expense = self.expense_model.get_by_id(new_id)
            rooms = self.room_model.get_all()
            room_map = {r['id']: r['name'] for r in rooms}
            expense['room_name'] = room_map.get(expense['room_id'], '未知房间')
            return {'code': 0, 'message': 'success', 'data': expense}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def update_expense(self, expense_id: int, room_id: int = None, category: str = None, amount: float = None, date: str = None, note: str = None, image_url: str = None):
        existing = self.expense_model.get_by_id(expense_id)
        if not existing:
            return {'code': 1, 'message': f'花销记录 {expense_id} 不存在', 'data': None}
        try:
            self.expense_model.update(expense_id, room_id=room_id, category=category, amount=amount, date=date, note=note, image_url=image_url)
            expense = self.expense_model.get_by_id(expense_id)
            rooms = self.room_model.get_all()
            room_map = {r['id']: r['name'] for r in rooms}
            expense['room_name'] = room_map.get(expense['room_id'], '未知房间')
            return {'code': 0, 'message': 'success', 'data': expense}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def delete_expense(self, expense_id: int):
        existing = self.expense_model.get_by_id(expense_id)
        if not existing:
            return {'code': 1, 'message': f'花销记录 {expense_id} 不存在', 'data': None}
        self.expense_model.delete(expense_id)
        return {'code': 0, 'message': '删除成功', 'data': None}

    def get_budget(self):
        budget = self.budget_model.get()
        total_spent = self.expense_model.total_amount()
        total_budget = budget['total_budget'] if budget else 0
        remaining = total_budget - total_spent
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'total_budget': total_budget,
                'total_spent': total_spent,
                'remaining': remaining
            }
        }

    def set_budget(self, total_budget: float):
        if total_budget < 0:
            return {'code': 1, 'message': '预算不能为负数', 'data': None}
        try:
            self.budget_model.set_budget(total_budget)
            return self.get_budget()
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def stats_by_room(self):
        rooms = self.room_model.get_all()
        room_spending = self.expense_model.sum_by_room()
        room_map = {r['id']: r for r in rooms}
        spending_map = {s['room_id']: s['total_amount'] for s in room_spending}

        result = []
        for room in rooms:
            result.append({
                'room_id': room['id'],
                'room_name': room['name'],
                'status': room['status'],
                'budget': room['budget'],
                'total_spent': spending_map.get(room['id'], 0)
            })

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def stats_by_category(self):
        category_spending = self.expense_model.sum_by_category()
        return {
            'code': 0,
            'message': 'success',
            'data': category_spending
        }
