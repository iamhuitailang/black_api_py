from typing import Dict, Any, List, Optional
from app.model.mudan import CommercialModel, ProductModel


class CommercialBusiness:
    def __init__(self):
        self.commercial_model = CommercialModel()
        self.product_model = ProductModel()

    def get_commercial(self) -> Dict[str, Any]:
        contact = self.commercial_model.get_latest()
        products = self.product_model.get_all()
        
        contact_data = {
            'id': None,
            'phone': '',
            'wechat': '',
            'created_at': None,
            'updated_at': None
        }
        
        if contact:
            contact_data = {
                'id': contact.get('id'),
                'phone': contact.get('phone'),
                'wechat': contact.get('wechat'),
                'created_at': contact.get('created_at'),
                'updated_at': contact.get('updated_at')
            }
        
        products_data = []
        for product in products:
            products_data.append({
                'id': product.get('id'),
                'name': product.get('name'),
                'price': product.get('price'),
                'quantity': product.get('quantity'),
                'description': product.get('description'),
                'image_url': product.get('image_url'),
                'sort_order': product.get('sort_order'),
                'created_at': product.get('created_at'),
                'updated_at': product.get('updated_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'contact': contact_data,
                'products': products_data
            }
        }

    def set_commercial(self, contact: Dict[str, Any] = None, products: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        try:
            if contact is not None:
                existing_contact = self.commercial_model.get_latest()
                phone = contact.get('phone', '')
                wechat = contact.get('wechat', '')
                
                if existing_contact:
                    self.commercial_model.update(existing_contact.get('id'), phone, wechat)
                else:
                    self.commercial_model.create(phone, wechat)
            
            if products is not None:
                self.product_model.delete_all()
                
                for index, product in enumerate(products):
                    product['sort_order'] = index
                
                if products:
                    self.product_model.create_many(products)
            
            return self.get_commercial()
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_products(self) -> Dict[str, Any]:
        products = self.product_model.get_all()
        
        result = []
        for product in products:
            result.append({
                'id': product.get('id'),
                'name': product.get('name'),
                'price': product.get('price'),
                'quantity': product.get('quantity'),
                'description': product.get('description'),
                'image_url': product.get('image_url'),
                'sort_order': product.get('sort_order'),
                'created_at': product.get('created_at'),
                'updated_at': product.get('updated_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def set_products(self, products: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not isinstance(products, list):
            return {
                'code': 1,
                'message': 'Products must be a list',
                'data': None
            }
        
        for index, product in enumerate(products):
            if not isinstance(product, dict):
                return {
                    'code': 1,
                    'message': f'Product at index {index} must be an object',
                    'data': None
                }
            if 'name' not in product or not product.get('name'):
                return {
                    'code': 1,
                    'message': f'Product at index {index} must have name',
                    'data': None
                }
        
        try:
            self.product_model.delete_all()
            
            for index, product in enumerate(products):
                product['sort_order'] = index
            
            if products:
                self.product_model.create_many(products)
            
            return self.get_products()
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_contact(self) -> Dict[str, Any]:
        contact = self.commercial_model.get_latest()
        
        if contact:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': contact.get('id'),
                    'phone': contact.get('phone'),
                    'wechat': contact.get('wechat'),
                    'created_at': contact.get('created_at'),
                    'updated_at': contact.get('updated_at')
                }
            }
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': None,
                'phone': '',
                'wechat': '',
                'created_at': None,
                'updated_at': None
            }
        }

    def set_contact(self, phone: str = None, wechat: str = None) -> Dict[str, Any]:
        try:
            existing = self.commercial_model.get_latest()
            
            if existing:
                self.commercial_model.update(existing.get('id'), phone, wechat)
            else:
                self.commercial_model.create(phone if phone else '', wechat if wechat else '')
            
            return self.get_contact()
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_product_by_id(self, record_id: int) -> Dict[str, Any]:
        product = self.product_model.get_by_id(record_id)
        
        if product:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': product.get('id'),
                    'name': product.get('name'),
                    'price': product.get('price'),
                    'quantity': product.get('quantity'),
                    'description': product.get('description'),
                    'image_url': product.get('image_url'),
                    'sort_order': product.get('sort_order'),
                    'created_at': product.get('created_at'),
                    'updated_at': product.get('updated_at')
                }
            }
        
        return {
            'code': 1,
            'message': 'Product not found',
            'data': None
        }

    def delete_product(self, record_id: int) -> Dict[str, Any]:
        existing = self.product_model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Product with id {record_id} not found',
                'data': None
            }
        
        affected = self.product_model.delete(record_id)
        if affected > 0:
            return {
                'code': 0,
                'message': 'delete success',
                'data': None
            }
        
        return {
            'code': 1,
            'message': 'delete failed',
            'data': None
        }

    def add_product(self, name: str, price: float = 0.0, quantity: int = 0,
                    description: str = '', image_url: str = '') -> Dict[str, Any]:
        if not name or not name.strip():
            return {
                'code': 1,
                'message': 'Product name is required',
                'data': None
            }
        
        existing_products = self.product_model.get_all()
        sort_order = len(existing_products)
        
        try:
            new_id = self.product_model.create(
                name=name.strip(),
                price=price,
                quantity=quantity,
                description=description.strip() if description else '',
                image_url=image_url.strip() if image_url else '',
                sort_order=sort_order
            )
            
            return self.get_product_by_id(new_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_product(self, record_id: int, name: str = None, price: float = None,
                       quantity: int = None, description: str = None, image_url: str = None) -> Dict[str, Any]:
        existing = self.product_model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Product with id {record_id} not found',
                'data': None
            }
        
        try:
            affected = self.product_model.update(
                record_id=record_id,
                name=name.strip() if name else None,
                price=price,
                quantity=quantity,
                description=description.strip() if description else None,
                image_url=image_url.strip() if image_url else None
            )
            
            if affected > 0:
                return self.get_product_by_id(record_id)
            
            return {
                'code': 1,
                'message': 'update failed',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
