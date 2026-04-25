from typing import Dict, Any, List, Optional
from datetime import date
from app.model.ims import PurchaseModel, InventoryModel, OperationLogModel, ContactModel, VarietyModel


class PurchaseBusiness:
    def __init__(self):
        self.model = PurchaseModel()
        self.inventory_model = InventoryModel()
        self.log_model = OperationLogModel()
        self.contact_model = ContactModel()
        self.variety_model = VarietyModel()

    def get_purchase_list(self, page: int = 1, page_size: int = 10,
                          variety_id: int = None, supplier_id: int = None,
                          start_date: str = None, end_date: str = None,
                          keyword: str = None) -> Dict[str, Any]:
        try:
            result = self.model.paginate(
                page=page,
                page_size=page_size,
                variety_id=variety_id,
                supplier_id=supplier_id,
                start_date=start_date,
                end_date=end_date,
                keyword=keyword
            )

            items = []
            for item in result['items']:
                items.append({
                    'id': item.get('id'),
                    'variety_id': item.get('variety_id'),
                    'variety_name': item.get('variety_name'),
                    'unit_price': item.get('unit_price'),
                    'quantity': item.get('quantity'),
                    'total_price': item.get('total_price'),
                    'purchase_date': item.get('purchase_date'),
                    'supplier_id': item.get('supplier_id'),
                    'supplier_name': item.get('supplier_name'),
                    'remark': item.get('remark'),
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

    def get_purchase_by_id(self, record_id: int) -> Dict[str, Any]:
        try:
            purchase = self.model.get_by_id(record_id)

            if purchase:
                return {
                    'code': 0,
                    'message': 'success',
                    'data': {
                        'id': purchase.get('id'),
                        'variety_id': purchase.get('variety_id'),
                        'variety_name': purchase.get('variety_name'),
                        'unit_price': purchase.get('unit_price'),
                        'quantity': purchase.get('quantity'),
                        'total_price': purchase.get('total_price'),
                        'purchase_date': purchase.get('purchase_date'),
                        'supplier_id': purchase.get('supplier_id'),
                        'supplier_name': purchase.get('supplier_name'),
                        'remark': purchase.get('remark'),
                        'created_at': purchase.get('created_at'),
                        'updated_at': purchase.get('updated_at')
                    }
                }

            return {
                'code': 1,
                'message': 'Purchase record not found',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def add_purchase(self, variety_id: int, unit_price: float, quantity: int,
                     purchase_date: str = None, supplier_id: int = 0,
                     remark: str = '') -> Dict[str, Any]:
        try:
            if variety_id <= 0:
                return {
                    'code': 1,
                    'message': 'Variety ID is required',
                    'data': None
                }

            if unit_price < 0:
                return {
                    'code': 1,
                    'message': 'Unit price cannot be negative',
                    'data': None
                }

            if quantity <= 0:
                return {
                    'code': 1,
                    'message': 'Quantity must be greater than 0',
                    'data': None
                }

            variety = self.variety_model.get_by_id(variety_id)
            if not variety:
                return {
                    'code': 1,
                    'message': f'Variety with id {variety_id} not found',
                    'data': None
                }

            supplier_name = ''
            if supplier_id > 0:
                supplier = self.contact_model.get_by_id(supplier_id)
                if supplier:
                    supplier_name = supplier.get('name', '')

            new_id = self.model.create(
                variety_id=variety_id,
                variety_name=variety.get('name', ''),
                unit_price=unit_price,
                quantity=quantity,
                purchase_date=purchase_date or date.today().isoformat(),
                supplier_id=supplier_id,
                supplier_name=supplier_name,
                remark=remark
            )

            self.inventory_model.upsert(
                variety_id=variety_id,
                variety_name=variety.get('name', ''),
                quantity=quantity,
                cost_price=unit_price
            )

            self.log_model.log_purchase(
                title=f'进货: {variety.get("name")} x{quantity}, 单价:{unit_price}',
                record_id=new_id
            )

            return self.get_purchase_by_id(new_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_purchase(self, record_id: int, variety_id: int = None,
                        unit_price: float = None, quantity: int = None,
                        purchase_date: str = None, supplier_id: int = None,
                        remark: str = None) -> Dict[str, Any]:
        try:
            existing = self.model.get_by_id(record_id)
            if not existing:
                return {
                    'code': 1,
                    'message': f'Purchase record with id {record_id} not found',
                    'data': None
                }

            supplier_name = None
            if supplier_id is not None and supplier_id > 0:
                supplier = self.contact_model.get_by_id(supplier_id)
                if supplier:
                    supplier_name = supplier.get('name', '')

            variety_name = None
            if variety_id is not None and variety_id > 0:
                variety = self.variety_model.get_by_id(variety_id)
                if variety:
                    variety_name = variety.get('name', '')

            affected = self.model.update(
                record_id=record_id,
                variety_id=variety_id,
                variety_name=variety_name,
                unit_price=unit_price,
                quantity=quantity,
                purchase_date=purchase_date,
                supplier_id=supplier_id,
                supplier_name=supplier_name,
                remark=remark
            )

            if affected > 0:
                current_record = self.model.get_by_id(record_id)
                self.log_model.log_update(
                    module='purchase',
                    title=f'更新进货记录: {current_record.get("variety_name")}',
                    record_id=record_id
                )
                return self.get_purchase_by_id(record_id)

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

    def delete_purchase(self, record_id: int) -> Dict[str, Any]:
        try:
            existing = self.model.get_by_id(record_id)
            if not existing:
                return {
                    'code': 1,
                    'message': f'Purchase record with id {record_id} not found',
                    'data': None
                }

            affected = self.model.delete(record_id)
            if affected > 0:
                self.log_model.log_delete(
                    module='purchase',
                    title=f'删除进货记录: {existing.get("variety_name")}',
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

    def get_today_purchase_stats(self) -> Dict[str, Any]:
        try:
            today = date.today().isoformat()
            count = self.model.count_by_date(today)
            amount = self.model.get_total_amount_by_date(today)

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'count': count,
                    'amount': amount
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
