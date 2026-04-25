from typing import Dict, Any, List, Optional
from app.model.ims import InventoryModel, OperationLogModel, VarietyModel


class InventoryBusiness:
    def __init__(self):
        self.model = InventoryModel()
        self.log_model = OperationLogModel()
        self.variety_model = VarietyModel()

    def get_inventory_list(self, page: int = 1, page_size: int = 10,
                           variety_id: int = None, show_warning: bool = False,
                           keyword: str = None) -> Dict[str, Any]:
        try:
            result = self.model.paginate(
                page=page,
                page_size=page_size,
                variety_id=variety_id,
                show_warning=show_warning,
                keyword=keyword
            )

            items = []
            for item in result['items']:
                items.append({
                    'id': item.get('id'),
                    'variety_id': item.get('variety_id'),
                    'variety_name': item.get('variety_name'),
                    'current_quantity': item.get('current_quantity'),
                    'purchase_location': item.get('purchase_location'),
                    'avg_cost_price': item.get('avg_cost_price'),
                    'total_cost': item.get('total_cost'),
                    'warning_threshold': item.get('warning_threshold'),
                    'is_warning': item.get('is_warning', False),
                    'created_at': item.get('created_at'),
                    'updated_at': item.get('updated_at')
                })

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': items,
                    'total': result['total'],
                    'page': result['page'],
                    'page_size': result['page_size'],
                    'total_pages': result['total_pages']
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_inventory_by_id(self, record_id: int) -> Dict[str, Any]:
        try:
            inventory = self.model.get_by_id(record_id)

            if inventory:
                return {
                    'code': 0,
                    'message': 'success',
                    'data': {
                        'id': inventory.get('id'),
                        'variety_id': inventory.get('variety_id'),
                        'variety_name': inventory.get('variety_name'),
                        'current_quantity': inventory.get('current_quantity'),
                        'purchase_location': inventory.get('purchase_location'),
                        'avg_cost_price': inventory.get('avg_cost_price'),
                        'total_cost': inventory.get('total_cost'),
                        'warning_threshold': inventory.get('warning_threshold'),
                        'is_warning': inventory.get('current_quantity', 0) <= inventory.get('warning_threshold', 10),
                        'created_at': inventory.get('created_at'),
                        'updated_at': inventory.get('updated_at')
                    }
                }

            return {
                'code': 1,
                'message': 'Inventory record not found',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_inventory_by_variety(self, variety_id: int) -> Dict[str, Any]:
        try:
            inventory = self.model.get_by_variety(variety_id)

            if inventory:
                return {
                    'code': 0,
                    'message': 'success',
                    'data': {
                        'id': inventory.get('id'),
                        'variety_id': inventory.get('variety_id'),
                        'variety_name': inventory.get('variety_name'),
                        'current_quantity': inventory.get('current_quantity'),
                        'purchase_location': inventory.get('purchase_location'),
                        'avg_cost_price': inventory.get('avg_cost_price'),
                        'total_cost': inventory.get('total_cost'),
                        'warning_threshold': inventory.get('warning_threshold'),
                        'is_warning': inventory.get('current_quantity', 0) <= inventory.get('warning_threshold', 10)
                    }
                }

            return {
                'code': 0,
                'message': 'success',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_inventory(self, record_id: int, current_quantity: int = None,
                         purchase_location: str = None, avg_cost_price: float = None,
                         total_cost: float = None, warning_threshold: int = None) -> Dict[str, Any]:
        try:
            existing = self.model.get_by_id(record_id)
            if not existing:
                return {
                    'code': 1,
                    'message': f'Inventory record with id {record_id} not found',
                    'data': None
                }

            affected = self.model.update(
                record_id=record_id,
                current_quantity=current_quantity,
                purchase_location=purchase_location,
                avg_cost_price=avg_cost_price,
                total_cost=total_cost,
                warning_threshold=warning_threshold
            )

            if affected > 0:
                self.log_model.log_update(
                    module='inventory',
                    title=f'更新库存: {existing.get("variety_name")}',
                    record_id=record_id
                )
                return self.get_inventory_by_id(record_id)

            return {
                'code': 1,
                'message': 'Update failed',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def delete_inventory(self, record_id: int) -> Dict[str, Any]:
        try:
            existing = self.model.get_by_id(record_id)
            if not existing:
                return {
                    'code': 1,
                    'message': f'Inventory record with id {record_id} not found',
                    'data': None
                }

            affected = self.model.delete(record_id)
            if affected > 0:
                self.log_model.log_delete(
                    module='inventory',
                    title=f'删除库存记录: {existing.get("variety_name")}',
                    record_id=record_id
                )
                return {
                    'code': 0,
                    'message': 'Delete success',
                    'data': None
                }

            return {
                'code': 1,
                'message': 'Delete failed',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_warning_items(self) -> Dict[str, Any]:
        try:
            items = self.model.get_warning_items()
            result = []
            for item in items:
                result.append({
                    'id': item.get('id'),
                    'variety_id': item.get('variety_id'),
                    'variety_name': item.get('variety_name'),
                    'current_quantity': item.get('current_quantity'),
                    'warning_threshold': item.get('warning_threshold')
                })

            return {
                'code': 0,
                'message': 'success',
                'data': result
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_total_inventory_stats(self) -> Dict[str, Any]:
        try:
            total_quantity = self.model.get_total_quantity()
            total_cost = self.model.get_total_cost()
            warning_count = len(self.model.get_warning_items())

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'total_quantity': total_quantity,
                    'total_cost': total_cost,
                    'warning_count': warning_count
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
