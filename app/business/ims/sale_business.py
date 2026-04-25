from typing import Dict, Any, List, Optional
from datetime import date
from app.model.ims import SaleModel, InventoryModel, OperationLogModel, ContactModel, VarietyModel


class SaleBusiness:
    def __init__(self):
        self.model = SaleModel()
        self.inventory_model = InventoryModel()
        self.log_model = OperationLogModel()
        self.contact_model = ContactModel()
        self.variety_model = VarietyModel()

    def get_sale_list(self, page: int = 1, page_size: int = 10,
                      variety_id: int = None, customer_id: int = None,
                      start_date: str = None, end_date: str = None,
                      keyword: str = None) -> Dict[str, Any]:
        try:
            result = self.model.paginate(
                page=page,
                page_size=page_size,
                variety_id=variety_id,
                customer_id=customer_id,
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
                    'sale_location': item.get('sale_location'),
                    'customer_id': item.get('customer_id'),
                    'customer_name': item.get('customer_name'),
                    'sale_date': item.get('sale_date'),
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

    def get_sale_by_id(self, record_id: int) -> Dict[str, Any]:
        try:
            sale = self.model.get_by_id(record_id)

            if sale:
                return {
                    'code': 0,
                    'message': 'success',
                    'data': {
                        'id': sale.get('id'),
                        'variety_id': sale.get('variety_id'),
                        'variety_name': sale.get('variety_name'),
                        'unit_price': sale.get('unit_price'),
                        'quantity': sale.get('quantity'),
                        'total_price': sale.get('total_price'),
                        'sale_location': sale.get('sale_location'),
                        'customer_id': sale.get('customer_id'),
                        'customer_name': sale.get('customer_name'),
                        'sale_date': sale.get('sale_date'),
                        'remark': sale.get('remark'),
                        'created_at': sale.get('created_at'),
                        'updated_at': sale.get('updated_at')
                    }
                }

            return {
                'code': 1,
                'message': 'Sale record not found',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def add_sale(self, variety_id: int, unit_price: float, quantity: int,
                 sale_location: str = '', customer_id: int = 0,
                 sale_date: str = None, remark: str = '') -> Dict[str, Any]:
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

            inventory = self.inventory_model.get_by_variety(variety_id)
            if not inventory or inventory['current_quantity'] < quantity:
                current_quantity = inventory['current_quantity'] if inventory else 0
                return {
                    'code': 1,
                    'message': f'Insufficient inventory. Current: {current_quantity}, Requested: {quantity}',
                    'data': None
                }

            customer_name = ''
            if customer_id > 0:
                customer = self.contact_model.get_by_id(customer_id)
                if customer:
                    customer_name = customer.get('name', '')

            new_id = self.model.create(
                variety_id=variety_id,
                variety_name=variety.get('name', ''),
                unit_price=unit_price,
                quantity=quantity,
                sale_location=sale_location,
                customer_id=customer_id,
                customer_name=customer_name,
                sale_date=sale_date or date.today().isoformat(),
                remark=remark
            )

            self.inventory_model.subtract_quantity(variety_id, quantity)

            self.log_model.log_sale(
                title=f'销售: {variety.get("name")} x{quantity}, 单价:{unit_price}',
                record_id=new_id
            )

            return self.get_sale_by_id(new_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_sale(self, record_id: int, variety_id: int = None,
                    unit_price: float = None, quantity: int = None,
                    sale_location: str = None, customer_id: int = None,
                    sale_date: str = None, remark: str = None) -> Dict[str, Any]:
        try:
            existing = self.model.get_by_id(record_id)
            if not existing:
                return {
                    'code': 1,
                    'message': f'Sale record with id {record_id} not found',
                    'data': None
                }

            customer_name = None
            if customer_id is not None and customer_id > 0:
                customer = self.contact_model.get_by_id(customer_id)
                if customer:
                    customer_name = customer.get('name', '')

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
                sale_location=sale_location,
                customer_id=customer_id,
                customer_name=customer_name,
                sale_date=sale_date,
                remark=remark
            )

            if affected > 0:
                current_record = self.model.get_by_id(record_id)
                self.log_model.log_update(
                    module='sale',
                    title=f'更新销售记录: {current_record.get("variety_name")}',
                    record_id=record_id
                )
                return self.get_sale_by_id(record_id)

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

    def delete_sale(self, record_id: int) -> Dict[str, Any]:
        try:
            existing = self.model.get_by_id(record_id)
            if not existing:
                return {
                    'code': 1,
                    'message': f'Sale record with id {record_id} not found',
                    'data': None
                }

            affected = self.model.delete(record_id)
            if affected > 0:
                self.log_model.log_delete(
                    module='sale',
                    title=f'删除销售记录: {existing.get("variety_name")}',
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

    def get_today_sale_stats(self) -> Dict[str, Any]:
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
