from typing import Dict, Any, List, Optional
from datetime import datetime
from app.model.groupbuy import GroupBuyModel, OrderModel
from app.model.groupbuy.group_buy import GroupBuyStatus


class GroupBuyBusiness:
    def __init__(self):
        self.group_buy_model = GroupBuyModel()
        self.order_model = OrderModel()

    def _check_deadline_and_close(self, group_buy: Dict[str, Any]) -> Dict[str, Any]:
        if group_buy.get('status') == GroupBuyStatus.ACTIVE:
            deadline_str = group_buy.get('deadline', '')
            try:
                deadline = datetime.fromisoformat(deadline_str)
                now = datetime.now()
                if now >= deadline:
                    self.group_buy_model.close(group_buy['id'])
                    group_buy['status'] = GroupBuyStatus.CLOSED
            except Exception:
                pass
        return group_buy

    def create_group_buy(self, title: str, spec: str = '', price: float = 0.0,
                         description: str = '', image_url: str = '',
                         deadline: str = None) -> Dict[str, Any]:
        if not title or not title.strip():
            return {
                'code': 1,
                'message': '商品名称不能为空',
                'data': None
            }
        if price is None or price < 0:
            return {
                'code': 1,
                'message': '价格不能为负数',
                'data': None
            }
        if not deadline:
            return {
                'code': 1,
                'message': '请设置截单时间',
                'data': None
            }

        try:
            new_id = self.group_buy_model.create(
                title=title.strip(),
                spec=spec.strip() if spec else '',
                price=price,
                description=description.strip() if description else '',
                image_url=image_url.strip() if image_url else '',
                deadline=deadline
            )
            return self.get_group_buy_detail(new_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_group_buy(self, group_buy_id: int, title: str = None, spec: str = None,
                         price: float = None, description: str = None,
                         image_url: str = None, deadline: str = None) -> Dict[str, Any]:
        existing = self.group_buy_model.get_by_id(group_buy_id)
        if not existing:
            return {
                'code': 1,
                'message': '团购不存在',
                'data': None
            }

        existing = self._check_deadline_and_close(existing)

        if existing.get('status') != GroupBuyStatus.ACTIVE:
            return {
                'code': 1,
                'message': '已截单的团购不能编辑',
                'data': None
            }

        try:
            affected = self.group_buy_model.update(
                record_id=group_buy_id,
                title=title.strip() if title else None,
                spec=spec.strip() if spec else None,
                price=price,
                description=description.strip() if description else None,
                image_url=image_url.strip() if image_url else None,
                deadline=deadline
            )
            if affected > 0:
                return self.get_group_buy_detail(group_buy_id)
            return {
                'code': 1,
                'message': '更新失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def close_group_buy(self, group_buy_id: int) -> Dict[str, Any]:
        existing = self.group_buy_model.get_by_id(group_buy_id)
        if not existing:
            return {
                'code': 1,
                'message': '团购不存在',
                'data': None
            }

        try:
            affected = self.group_buy_model.close(group_buy_id)
            if affected > 0:
                return self.get_group_buy_detail(group_buy_id)
            return {
                'code': 1,
                'message': '截单失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_group_buy_list(self, include_closed: bool = True) -> Dict[str, Any]:
        try:
            if include_closed:
                group_buys = self.group_buy_model.get_all()
            else:
                group_buys = self.group_buy_model.get_active_list()

            result = []
            for gb in group_buys:
                gb = self._check_deadline_and_close(gb)
                stats = self.order_model.get_statistics(gb['id'])
                total_amount = round(stats['total_quantity'] * gb.get('price', 0), 2)
                result.append({
                    'id': gb.get('id'),
                    'title': gb.get('title'),
                    'spec': gb.get('spec'),
                    'price': gb.get('price'),
                    'description': gb.get('description'),
                    'image_url': gb.get('image_url'),
                    'deadline': gb.get('deadline'),
                    'status': gb.get('status'),
                    'order_count': stats['order_count'],
                    'total_quantity': stats['total_quantity'],
                    'total_amount': total_amount,
                    'created_at': gb.get('created_at')
                })

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': result
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_group_buy_detail(self, group_buy_id: int) -> Dict[str, Any]:
        group_buy = self.group_buy_model.get_by_id(group_buy_id)
        if not group_buy:
            return {
                'code': 1,
                'message': '团购不存在',
                'data': None
            }

        group_buy = self._check_deadline_and_close(group_buy)

        stats = self.order_model.get_statistics(group_buy_id)
        orders = self.order_model.get_by_group_buy_id(group_buy_id)
        total_amount = round(stats['total_quantity'] * group_buy.get('price', 0), 2)

        order_list = []
        for order in orders:
            order_amount = round(order.get('quantity', 0) * group_buy.get('price', 0), 2)
            order_list.append({
                'id': order.get('id'),
                'building': order.get('building'),
                'room': order.get('room'),
                'phone': order.get('phone'),
                'quantity': order.get('quantity'),
                'amount': order_amount,
                'created_at': order.get('created_at')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': group_buy.get('id'),
                'title': group_buy.get('title'),
                'spec': group_buy.get('spec'),
                'price': group_buy.get('price'),
                'description': group_buy.get('description'),
                'image_url': group_buy.get('image_url'),
                'deadline': group_buy.get('deadline'),
                'status': group_buy.get('status'),
                'order_count': stats['order_count'],
                'total_quantity': stats['total_quantity'],
                'total_amount': total_amount,
                'created_at': group_buy.get('created_at'),
                'orders': order_list
            }
        }

    def create_order(self, group_buy_id: int, building: str = '', room: str = '',
                     phone: str = '', quantity: int = 1) -> Dict[str, Any]:
        group_buy = self.group_buy_model.get_by_id(group_buy_id)
        if not group_buy:
            return {
                'code': 1,
                'message': '团购不存在',
                'data': None
            }

        group_buy = self._check_deadline_and_close(group_buy)

        if group_buy.get('status') != GroupBuyStatus.ACTIVE:
            return {
                'code': 1,
                'message': '该团购已截单，不能再接龙',
                'data': None
            }

        if not quantity or quantity < 1:
            return {
                'code': 1,
                'message': '数量至少为1',
                'data': None
            }

        if not building or not building.strip():
            return {
                'code': 1,
                'message': '请填写楼栋号',
                'data': None
            }

        if not phone or not phone.strip():
            return {
                'code': 1,
                'message': '请填写手机号',
                'data': None
            }

        try:
            new_id = self.order_model.create(
                group_buy_id=group_buy_id,
                building=building.strip(),
                room=room.strip() if room else '',
                phone=phone.strip(),
                quantity=quantity
            )
            return self.get_group_buy_detail(group_buy_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def export_orders_csv(self, group_buy_id: int) -> Optional[bytes]:
        result = self.get_group_buy_detail(group_buy_id)
        if result.get('code') != 0:
            return None

        data = result.get('data', {})
        orders = data.get('orders', [])

        import csv
        import io

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            '序号', '楼栋号', '房间号', '手机号', '数量', '金额(元)', '接龙时间'
        ])

        for idx, order in enumerate(orders, 1):
            writer.writerow([
                idx,
                order.get('building', ''),
                order.get('room', ''),
                order.get('phone', ''),
                order.get('quantity', 0),
                f"{order.get('amount', 0):.2f}",
                order.get('created_at', '')
            ])

        writer.writerow([])
        writer.writerow([
            '合计', '', '', '',
            data.get('total_quantity', 0),
            f"{data.get('total_amount', 0):.2f}",
            ''
        ])

        return output.getvalue().encode('utf-8-sig')

    def delete_group_buy(self, group_buy_id: int) -> Dict[str, Any]:
        existing = self.group_buy_model.get_by_id(group_buy_id)
        if not existing:
            return {
                'code': 1,
                'message': '团购不存在',
                'data': None
            }

        try:
            affected = self.group_buy_model.delete(group_buy_id)
            if affected > 0:
                return {
                    'code': 0,
                    'message': '删除成功',
                    'data': None
                }
            return {
                'code': 1,
                'message': '删除失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
