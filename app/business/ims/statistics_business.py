from typing import Dict, Any, List, Optional
from datetime import date
from app.model.ims import PurchaseModel, SaleModel, InventoryModel


class StatisticsBusiness:
    def __init__(self):
        self.purchase_model = PurchaseModel()
        self.sale_model = SaleModel()
        self.inventory_model = InventoryModel()

    def get_today_statistics(self) -> Dict[str, Any]:
        try:
            today = date.today().isoformat()

            today_purchase_count = self.purchase_model.count_by_date(today)
            today_purchase_amount = self.purchase_model.get_total_amount_by_date(today)

            today_sale_count = self.sale_model.count_by_date(today)
            today_sale_amount = self.sale_model.get_total_amount_by_date(today)

            total_inventory_quantity = self.inventory_model.get_total_quantity()
            total_inventory_cost = self.inventory_model.get_total_cost()
            warning_items = self.inventory_model.get_warning_items()

            total_profit = today_sale_amount - today_purchase_amount

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'today_purchase': {
                        'count': today_purchase_count,
                        'amount': today_purchase_amount
                    },
                    'today_sale': {
                        'count': today_sale_count,
                        'amount': today_sale_amount
                    },
                    'total_inventory': {
                        'quantity': total_inventory_quantity,
                        'cost': total_inventory_cost,
                        'warning_count': len(warning_items)
                    },
                    'today_profit': total_profit
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_dashboard_statistics(self) -> Dict[str, Any]:
        try:
            today = date.today().isoformat()

            today_purchase_amount = self.purchase_model.get_total_amount_by_date(today)
            today_sale_amount = self.sale_model.get_total_amount_by_date(today)
            total_inventory_quantity = self.inventory_model.get_total_quantity()
            total_inventory_cost = self.inventory_model.get_total_cost()

            today_profit = today_sale_amount - today_purchase_amount

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'today_purchase': today_purchase_amount,
                    'today_sale': today_sale_amount,
                    'total_inventory': total_inventory_quantity,
                    'total_profit': today_profit
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_range_statistics(self, start_date: str, end_date: str) -> Dict[str, Any]:
        try:
            purchase_count = self.purchase_model.get_total_quantity_by_range(start_date, end_date)
            purchase_amount = self.purchase_model.get_total_amount_by_range(start_date, end_date)

            sale_count = self.sale_model.get_total_quantity_by_range(start_date, end_date)
            sale_amount = self.sale_model.get_total_amount_by_range(start_date, end_date)

            profit = sale_amount - purchase_amount

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'start_date': start_date,
                    'end_date': end_date,
                    'purchase': {
                        'quantity': purchase_count,
                        'amount': purchase_amount
                    },
                    'sale': {
                        'quantity': sale_count,
                        'amount': sale_amount
                    },
                    'profit': profit
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
