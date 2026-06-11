from typing import Dict, Any, List, Optional
from datetime import datetime
from app.model.restaurant import OrderModel, OrderItemModel, DishModel
from app.common.sqlite.orm_exec import ORMExec


class OrderBusiness:
    def __init__(self):
        self.order_model = OrderModel()
        self.order_item_model = OrderItemModel()
        self.dish_model = DishModel()

    def get_order(self, order_id: int) -> Dict[str, Any]:
        order = self.order_model.get_by_id(order_id)
        if not order:
            return {
                'code': 1,
                'message': 'Order not found',
                'data': None
            }

        items = self.order_item_model.get_by_order_id(order_id)
        order['items'] = items
        order['total'] = sum(item['price'] * item['quantity'] for item in items)

        return {
            'code': 0,
            'message': 'success',
            'data': order
        }

    def get_orders_by_table(self, table_number: int) -> Dict[str, Any]:
        if table_number < 1 or table_number > 20:
            return {
                'code': 1,
                'message': 'Table number must be between 1 and 20',
                'data': None
            }

        orders = self.order_model.get_by_table(table_number)
        for order in orders:
            items = self.order_item_model.get_by_order_id(order['id'])
            order['items'] = items
            order['total'] = sum(item['price'] * item['quantity'] for item in items)

        return {
            'code': 0,
            'message': 'success',
            'data': orders
        }

    def get_all_orders(self, status: str = None, table_number: int = None) -> Dict[str, Any]:
        orders = self.order_model.get_all(status, table_number)
        for order in orders:
            items = self.order_item_model.get_by_order_id(order['id'])
            order['items'] = items
            order['total'] = sum(item['price'] * item['quantity'] for item in items)

        return {
            'code': 0,
            'message': 'success',
            'data': orders
        }

    def create_order(self, table_number: int, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        if table_number < 1 or table_number > 20:
            return {
                'code': 1,
                'message': 'Table number must be between 1 and 20',
                'data': None
            }

        if not items or len(items) == 0:
            return {
                'code': 1,
                'message': 'Order items cannot be empty',
                'data': None
            }

        for item in items:
            dish_id = item.get('dish_id')
            quantity = item.get('quantity', 1)
            if not dish_id:
                return {
                    'code': 1,
                    'message': 'Invalid order item: missing dish_id',
                    'data': None
                }
            if quantity < 1:
                return {
                    'code': 1,
                    'message': 'Quantity must be at least 1',
                    'data': None
                }
            dish = self.dish_model.get_by_id(dish_id)
            if not dish:
                return {
                    'code': 1,
                    'message': f'Dish with id {dish_id} not found',
                    'data': None
                }
            if dish.get('is_active', 1) == 0:
                return {
                    'code': 1,
                    'message': f'Dish "{dish["name"]}" is not available',
                    'data': None
                }

        try:
            order_id = self.order_model.create(table_number)

            order_items = []
            for item in items:
                order_items.append({
                    'order_id': order_id,
                    'dish_id': item['dish_id'],
                    'quantity': item.get('quantity', 1)
                })

            self.order_item_model.create_many(order_items)

            return self.get_order(order_id)
        except Exception as e:
            return {
                'code': 1,
                'message': f'Failed to create order: {str(e)}',
                'data': None
            }

    def update_order_status(self, order_id: int, status: str) -> Dict[str, Any]:
        valid_statuses = [OrderModel.STATUS_PENDING, OrderModel.STATUS_COOKING, OrderModel.STATUS_SERVED]
        if status not in valid_statuses:
            return {
                'code': 1,
                'message': f'Invalid status. Must be one of: {valid_statuses}',
                'data': None
            }

        existing = self.order_model.get_by_id(order_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Order not found',
                'data': None
            }

        affected = self.order_model.update_status(order_id, status)
        if affected > 0:
            return self.get_order(order_id)
        return {
            'code': 1,
            'message': 'Update failed',
            'data': None
        }

    def delete_order(self, order_id: int) -> Dict[str, Any]:
        existing = self.order_model.get_by_id(order_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Order not found',
                'data': None
            }

        self.order_item_model.delete_by_order_id(order_id)
        affected = self.order_model.delete(order_id)
        if affected > 0:
            return {
                'code': 0,
                'message': 'Order deleted successfully',
                'data': None
            }
        return {
            'code': 1,
            'message': 'Delete failed',
            'data': None
        }

    def get_daily_summary(self, date_str: str = None) -> Dict[str, Any]:
        if date_str is None:
            date_str = datetime.now().strftime('%Y-%m-%d')

        try:
            datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            return {
                'code': 1,
                'message': 'Invalid date format. Use YYYY-MM-DD',
                'data': None
            }

        raw_data = self.order_model.get_daily_summary(date_str)

        total_revenue = 0
        dish_sales = {}
        table_spending = {}
        order_details = {}

        for row in raw_data:
            order_id = row['order_id']
            table_number = row['table_number']
            price = row['price']
            quantity = row['quantity']
            dish_name = row['dish_name']
            item_total = price * quantity

            total_revenue += item_total

            if dish_name not in dish_sales:
                dish_sales[dish_name] = {
                    'name': dish_name,
                    'category': row['category'],
                    'quantity': 0,
                    'revenue': 0
                }
            dish_sales[dish_name]['quantity'] += quantity
            dish_sales[dish_name]['revenue'] += item_total

            if table_number not in table_spending:
                table_spending[table_number] = 0
            table_spending[table_number] += item_total

            if order_id not in order_details:
                order_details[order_id] = {
                    'order_id': order_id,
                    'table_number': table_number,
                    'status': row['status'],
                    'created_at': row['created_at'],
                    'items': [],
                    'total': 0
                }
            order_details[order_id]['items'].append({
                'dish_name': dish_name,
                'quantity': quantity,
                'price': price,
                'subtotal': item_total
            })
            order_details[order_id]['total'] += item_total

        dish_ranking = sorted(dish_sales.values(), key=lambda x: x['quantity'], reverse=True)
        table_ranking = sorted(
            [{'table_number': k, 'total': v} for k, v in table_spending.items()],
            key=lambda x: x['total'],
            reverse=True
        )

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'date': date_str,
                'total_revenue': total_revenue,
                'order_count': len(order_details),
                'dish_ranking': dish_ranking,
                'table_ranking': table_ranking,
                'orders': list(order_details.values())
            }
        }
