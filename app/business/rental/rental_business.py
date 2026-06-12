from typing import Dict, Any, List, Optional
from app.model.rental import ListingModel, FavoriteModel
from app.model.rental.listing import ListingStatus


class RentalBusiness:
    def __init__(self):
        self.listing_model = ListingModel()
        self.favorite_model = FavoriteModel()

    def _public_listing(self, row: Dict[str, Any], with_contact: bool = False) -> Dict[str, Any]:
        if not row:
            return None
        result = {
            'id': row.get('id'),
            'title': row.get('title'),
            'district': row.get('district'),
            'address': row.get('address'),
            'room_type': row.get('room_type'),
            'area_sqm': row.get('area_sqm'),
            'price_month': row.get('price_month'),
            'deposit': row.get('deposit'),
            'is_shared': row.get('is_shared'),
            'floor': row.get('floor'),
            'has_elevator': row.get('has_elevator'),
            'has_parking': row.get('has_parking'),
            'description': row.get('description'),
            'images': row.get('images', []),
            'status': row.get('status'),
            'created_at': row.get('created_at'),
        }
        if with_contact:
            result['contact_name'] = row.get('contact_name')
            result['contact_phone'] = row.get('contact_phone')
        return result

    def create_listing(self, title: str, district: str, address: str, room_type: str,
                       area_sqm: float, price_month: int, deposit: str, is_shared: bool,
                       floor: str, has_elevator: bool, has_parking: bool,
                       description: str, images: List[str], contact_name: str,
                       contact_phone: str, password: str) -> Dict[str, Any]:
        if not title or not title.strip():
            return {'code': 1, 'message': '标题不能为空', 'data': None}
        if not district or not district.strip():
            return {'code': 1, 'message': '请选择区域', 'data': None}
        if not address or not address.strip():
            return {'code': 1, 'message': '请填写详细地址', 'data': None}
        if not room_type:
            return {'code': 1, 'message': '请选择户型', 'data': None}
        if not contact_name or not contact_name.strip():
            return {'code': 1, 'message': '请填写联系人姓名', 'data': None}
        if not contact_phone or not contact_phone.strip():
            return {'code': 1, 'message': '请填写联系电话', 'data': None}
        if not password or len(password) < 4:
            return {'code': 1, 'message': '密码至少4位', 'data': None}
        if images is None:
            images = []
        if len(images) > 5:
            images = images[:5]

        try:
            new_id = self.listing_model.create(
                title=title.strip(),
                district=district.strip(),
                address=address.strip(),
                room_type=room_type,
                area_sqm=float(area_sqm) if area_sqm else 0,
                price_month=int(price_month) if price_month else 0,
                deposit=deposit or '',
                is_shared=bool(is_shared),
                floor=floor or '',
                has_elevator=bool(has_elevator),
                has_parking=bool(has_parking),
                description=description or '',
                images=images,
                contact_name=contact_name.strip(),
                contact_phone=contact_phone.strip(),
                password=password,
            )
            return self.get_listing_detail(new_id, with_contact=True)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def get_listing_list(self, district: str = None, room_type: str = None,
                         min_price: int = None, max_price: int = None,
                         page: int = 1, page_size: int = 20,
                         session_id: str = None) -> Dict[str, Any]:
        try:
            result = self.listing_model.find_list(
                district=district,
                room_type=room_type,
                min_price=min_price,
                max_price=max_price,
                page=page,
                page_size=page_size,
            )
            items = [self._public_listing(item) for item in result['items']]

            if session_id:
                for item in items:
                    item['is_favorited'] = self.favorite_model.is_favorited(
                        item['id'], session_id
                    )

            result['items'] = items
            return {'code': 0, 'message': 'success', 'data': result}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def get_listing_detail(self, listing_id: int, with_contact: bool = False,
                           session_id: str = None) -> Dict[str, Any]:
        try:
            row = self.listing_model.get_by_id(listing_id)
            if not row:
                return {'code': 1, 'message': '房源不存在', 'data': None}
            data = self._public_listing(row, with_contact=with_contact)
            if session_id:
                data['is_favorited'] = self.favorite_model.is_favorited(
                    listing_id, session_id
                )
            return {'code': 0, 'message': 'success', 'data': data}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def toggle_favorite(self, listing_id: int, session_id: str,
                        favorited: bool) -> Dict[str, Any]:
        if not session_id:
            return {'code': 1, 'message': '无效的会话', 'data': None}
        try:
            row = self.listing_model.get_by_id(listing_id)
            if not row:
                return {'code': 1, 'message': '房源不存在', 'data': None}

            if favorited:
                self.favorite_model.add(listing_id, session_id)
            else:
                self.favorite_model.remove(listing_id, session_id)

            is_fav = self.favorite_model.is_favorited(listing_id, session_id)
            return {'code': 0, 'message': 'success', 'data': {'is_favorited': is_fav}}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def get_favorites(self, session_id: str) -> Dict[str, Any]:
        if not session_id:
            return {'code': 1, 'message': '无效的会话', 'data': None}
        try:
            rows = self.favorite_model.get_list(session_id)
            items = []
            for row in rows:
                item = self._public_listing(row, with_contact=False)
                item['favorited_at'] = row.get('favorited_at')
                item['is_favorited'] = True
                item['is_inactive'] = row.get('status') in (ListingStatus.RENTED, ListingStatus.OFFLINE, ListingStatus.EXPIRED)
                items.append(item)
            return {'code': 0, 'message': 'success', 'data': items}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def update_status(self, listing_id: int, status: str, password: str) -> Dict[str, Any]:
        if status not in (ListingStatus.ACTIVE, ListingStatus.RENTED, ListingStatus.OFFLINE):
            return {'code': 1, 'message': '无效的状态', 'data': None}
        if not password:
            return {'code': 1, 'message': '请输入密码', 'data': None}
        try:
            row = self.listing_model.get_by_id(listing_id)
            if not row:
                return {'code': 1, 'message': '房源不存在', 'data': None}
            if not self.listing_model.verify_password(password, row.get('password_hash', '')):
                return {'code': 1, 'message': '密码错误', 'data': None}

            self.listing_model.update_status(listing_id, status)
            return self.get_listing_detail(listing_id, with_contact=True)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def refresh_listing(self, listing_id: int, password: str) -> Dict[str, Any]:
        if not password:
            return {'code': 1, 'message': '请输入密码', 'data': None}
        try:
            row = self.listing_model.get_by_id(listing_id)
            if not row:
                return {'code': 1, 'message': '房源不存在', 'data': None}
            if not self.listing_model.verify_password(password, row.get('password_hash', '')):
                return {'code': 1, 'message': '密码错误', 'data': None}

            self.listing_model.refresh(listing_id)
            return self.get_listing_detail(listing_id, with_contact=True)
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def delete_listing(self, listing_id: int, password: str) -> Dict[str, Any]:
        if not password:
            return {'code': 1, 'message': '请输入密码', 'data': None}
        try:
            row = self.listing_model.get_by_id(listing_id)
            if not row:
                return {'code': 1, 'message': '房源不存在', 'data': None}
            if not self.listing_model.verify_password(password, row.get('password_hash', '')):
                return {'code': 1, 'message': '密码错误', 'data': None}

            affected = self.listing_model.delete(listing_id)
            if affected > 0:
                return {'code': 0, 'message': '删除成功', 'data': None}
            return {'code': 1, 'message': '删除失败', 'data': None}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}

    def get_districts(self) -> Dict[str, Any]:
        try:
            districts = self.listing_model.get_all_districts()
            return {'code': 0, 'message': 'success', 'data': districts}
        except Exception as e:
            return {'code': 1, 'message': str(e), 'data': None}
