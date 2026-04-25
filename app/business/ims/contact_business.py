from typing import Dict, Any, List, Optional
from app.model.ims import ContactModel, ContactType, OperationLogModel


class ContactBusiness:
    def __init__(self):
        self.model = ContactModel()
        self.log_model = OperationLogModel()

    def get_contact_list(self, type: str = None, page: int = 1,
                         page_size: int = 10, keyword: str = None) -> Dict[str, Any]:
        try:
            result = self.model.paginate(
                page=page,
                page_size=page_size,
                type=type,
                keyword=keyword
            )

            items = []
            for item in result['items']:
                items.append({
                    'id': item.get('id'),
                    'name': item.get('name'),
                    'phone': item.get('phone'),
                    'wechat': item.get('wechat'),
                    'address': item.get('address'),
                    'type': item.get('type'),
                    'company': item.get('company'),
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

    def get_contact_by_id(self, record_id: int) -> Dict[str, Any]:
        try:
            contact = self.model.get_by_id(record_id)

            if contact:
                return {
                    'code': 0,
                    'message': 'success',
                    'data': {
                        'id': contact.get('id'),
                        'name': contact.get('name'),
                        'phone': contact.get('phone'),
                        'wechat': contact.get('wechat'),
                        'address': contact.get('address'),
                        'type': contact.get('type'),
                        'company': contact.get('company'),
                        'remark': contact.get('remark'),
                        'created_at': contact.get('created_at'),
                        'updated_at': contact.get('updated_at')
                    }
                }

            return {
                'code': 1,
                'message': 'Contact not found',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def add_contact(self, name: str, phone: str = '', wechat: str = '',
                    address: str = '', type: str = 'customer',
                    company: str = '', remark: str = '') -> Dict[str, Any]:
        try:
            if not name or not name.strip():
                return {
                    'code': 1,
                    'message': 'Name is required',
                    'data': None
                }

            new_id = self.model.create(
                name=name.strip(),
                phone=phone,
                wechat=wechat,
                address=address,
                type=type,
                company=company,
                remark=remark
            )

            self.log_model.log_create(
                module='contact',
                title=f'新增联系人: {name}',
                record_id=new_id
            )

            return self.get_contact_by_id(new_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_contact(self, record_id: int, name: str = None, phone: str = None,
                       wechat: str = None, address: str = None, type: str = None,
                       company: str = None, remark: str = None) -> Dict[str, Any]:
        try:
            existing = self.model.get_by_id(record_id)
            if not existing:
                return {
                    'code': 1,
                    'message': f'Contact with id {record_id} not found',
                    'data': None
                }

            affected = self.model.update(
                record_id=record_id,
                name=name.strip() if name else None,
                phone=phone,
                wechat=wechat,
                address=address,
                type=type,
                company=company,
                remark=remark
            )

            if affected > 0:
                self.log_model.log_update(
                    module='contact',
                    title=f'更新联系人: {name or existing.get("name")}',
                    record_id=record_id
                )
                return self.get_contact_by_id(record_id)

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

    def delete_contact(self, record_id: int) -> Dict[str, Any]:
        try:
            existing = self.model.get_by_id(record_id)
            if not existing:
                return {
                    'code': 1,
                    'message': f'Contact with id {record_id} not found',
                    'data': None
                }

            affected = self.model.delete(record_id)
            if affected > 0:
                self.log_model.log_delete(
                    module='contact',
                    title=f'删除联系人: {existing.get("name")}',
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

    def get_suppliers(self, page: int = 1, page_size: int = 10,
                      keyword: str = None) -> Dict[str, Any]:
        return self.get_contact_list(
            type='supplier',
            page=page,
            page_size=page_size,
            keyword=keyword
        )

    def get_customers(self, page: int = 1, page_size: int = 10,
                      keyword: str = None) -> Dict[str, Any]:
        return self.get_contact_list(
            type='customer',
            page=page,
            page_size=page_size,
            keyword=keyword
        )

    def get_all_suppliers(self) -> Dict[str, Any]:
        try:
            items = self.model.get_by_type('supplier')
            result = []
            for item in items:
                result.append({
                    'id': item.get('id'),
                    'name': item.get('name'),
                    'phone': item.get('phone'),
                    'wechat': item.get('wechat'),
                    'address': item.get('address'),
                    'type': item.get('type'),
                    'company': item.get('company')
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

    def get_all_customers(self) -> Dict[str, Any]:
        try:
            items = self.model.get_by_type('customer')
            result = []
            for item in items:
                result.append({
                    'id': item.get('id'),
                    'name': item.get('name'),
                    'phone': item.get('phone'),
                    'wechat': item.get('wechat'),
                    'address': item.get('address'),
                    'type': item.get('type'),
                    'company': item.get('company')
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
