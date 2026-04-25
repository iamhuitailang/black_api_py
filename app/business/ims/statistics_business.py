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

    def get_trend_chart_data(self, start_date: str, end_date: str) -> Dict[str, Any]:
        try:
            purchase_daily = self.purchase_model.get_daily_stats(start_date, end_date)
            sale_daily = self.sale_model.get_daily_stats(start_date, end_date)

            purchase_map = {item['date']: item for item in purchase_daily}
            sale_map = {item['date']: item for item in sale_daily}

            all_dates = set(list(purchase_map.keys()) + list(sale_map.keys()))
            sorted_dates = sorted(list(all_dates))

            labels = []
            purchase_amounts = []
            purchase_quantities = []
            sale_amounts = []
            sale_quantities = []
            profits = []

            for d in sorted_dates:
                labels.append(d)
                p = purchase_map.get(d, {'total_amount': 0, 'total_quantity': 0})
                s = sale_map.get(d, {'total_amount': 0, 'total_quantity': 0})
                
                purchase_amounts.append(round(p.get('total_amount', 0), 2))
                purchase_quantities.append(p.get('total_quantity', 0))
                sale_amounts.append(round(s.get('total_amount', 0), 2))
                sale_quantities.append(s.get('total_quantity', 0))
                profits.append(round(s.get('total_amount', 0) - p.get('total_amount', 0), 2))

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'labels': labels,
                    'purchase_amounts': purchase_amounts,
                    'purchase_quantities': purchase_quantities,
                    'sale_amounts': sale_amounts,
                    'sale_quantities': sale_quantities,
                    'profits': profits
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_purchase_variety_chart(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        try:
            data = self.purchase_model.get_variety_stats(start_date, end_date)
            
            labels = []
            amounts = []
            quantities = []
            
            for item in data:
                labels.append(item['variety_name'])
                amounts.append(round(item.get('total_amount', 0), 2))
                quantities.append(item.get('total_quantity', 0))

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'labels': labels,
                    'amounts': amounts,
                    'quantities': quantities
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_sale_variety_chart(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        try:
            data = self.sale_model.get_variety_stats(start_date, end_date)
            
            labels = []
            amounts = []
            quantities = []
            
            for item in data:
                labels.append(item['variety_name'])
                amounts.append(round(item.get('total_amount', 0), 2))
                quantities.append(item.get('total_quantity', 0))

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'labels': labels,
                    'amounts': amounts,
                    'quantities': quantities
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_inventory_distribution_chart(self) -> Dict[str, Any]:
        try:
            data = self.inventory_model.get_variety_distribution()
            
            labels = []
            quantities = []
            total_costs = []
            warning_status = []
            
            for item in data:
                labels.append(item['variety_name'])
                quantities.append(item.get('current_quantity', 0))
                total_costs.append(round(item.get('total_cost', 0), 2))
                warning_status.append(item.get('is_warning', False))

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'labels': labels,
                    'quantities': quantities,
                    'total_costs': total_costs,
                    'warning_status': warning_status
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
