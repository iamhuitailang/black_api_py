from typing import Dict, Any
from app.model.ershoushu_077_model import (
    ErshoushuTradeModel, ErshoushuBookModel, ErshoushuUserModel,
    ErshoushuNotificationModel
)


class ErshoushuTradeBusiness:
    def __init__(self):
        self.trade_model = ErshoushuTradeModel()
        self.book_model = ErshoushuBookModel()
        self.user_model = ErshoushuUserModel()
        self.notification_model = ErshoushuNotificationModel()

    def create_trade(self, buyer_id: int, book_id: int) -> Dict[str, Any]:
        buyer = self.user_model.get_by_id(buyer_id)
        if not buyer:
            return {'code': 1, 'msg': '买家不存在', 'data': None}

        book = self.book_model.get_by_id(book_id)
        if not book:
            return {'code': 1, 'msg': '书籍不存在', 'data': None}

        if book.get('user_id') == buyer_id:
            return {'code': 1, 'msg': '不能购买自己的书籍', 'data': None}

        if book.get('status') != ErshoushuBookModel.STATUS_APPROVED:
            return {'code': 1, 'msg': '该书籍当前不可购买', 'data': None}

        existing_trade = self.trade_model.get_by_book(book_id)
        if existing_trade and existing_trade.get('status') in [
            ErshoushuTradeModel.STATUS_PENDING,
            ErshoushuTradeModel.STATUS_CONFIRMED
        ]:
            return {'code': 1, 'msg': '该书籍已有进行中的交易', 'data': None}

        seller_id = book.get('user_id')
        price = book.get('price')

        trade_id = self.trade_model.create(
            book_id=book_id,
            buyer_id=buyer_id,
            seller_id=seller_id,
            price=price
        )

        if trade_id > 0:
            self.book_model.update_status(book_id, ErshoushuBookModel.STATUS_ONSALE)

            self.notification_model.create(
                user_id=seller_id,
                title='收到购买请求',
                content=f'用户 {buyer.get("nickname", buyer.get("username"))} 想购买您的《{book.get("title")}》',
                ntype=ErshoushuNotificationModel.TYPE_TRADE,
                related_id=trade_id
            )

            self.notification_model.create(
                user_id=buyer_id,
                title='购买请求已发送',
                content=f'您已向卖家发起购买《{book.get("title")}》的请求，请等待卖家确认',
                ntype=ErshoushuNotificationModel.TYPE_TRADE,
                related_id=trade_id
            )

            trade = self.trade_model.get_by_id(trade_id)
            return {'code': 0, 'msg': '交易发起成功', 'data': self.trade_model.to_dict(trade)}

        return {'code': 1, 'msg': '交易发起失败', 'data': None}

    def confirm_trade(self, user_id: int, trade_id: int) -> Dict[str, Any]:
        trade = self.trade_model.get_by_id(trade_id)
        if not trade:
            return {'code': 1, 'msg': '交易不存在', 'data': None}

        if trade.get('status') != ErshoushuTradeModel.STATUS_PENDING:
            return {'code': 1, 'msg': '当前交易状态无法确认', 'data': None}

        if user_id not in [trade.get('buyer_id'), trade.get('seller_id')]:
            return {'code': 1, 'msg': '无权确认此交易', 'data': None}

        self.trade_model.update_status(trade_id, ErshoushuTradeModel.STATUS_CONFIRMED)

        book_title = self._get_book_title(trade.get('book_id'))
        buyer_id = trade.get('buyer_id')
        seller_id = trade.get('seller_id')

        if user_id == seller_id:
            self.notification_model.create(
                user_id=buyer_id,
                title='交易已确认',
                content=f'卖家已确认《{book_title}》的交易，请等待完成',
                ntype=ErshoushuNotificationModel.TYPE_TRADE,
                related_id=trade_id
            )
        else:
            self.notification_model.create(
                user_id=seller_id,
                title='买家已确认',
                content=f'买家已确认《{book_title}》的交易',
                ntype=ErshoushuNotificationModel.TYPE_TRADE,
                related_id=trade_id
            )

        return {'code': 0, 'msg': '确认成功', 'data': self.trade_model.to_dict(self.trade_model.get_by_id(trade_id))}

    def complete_trade(self, user_id: int, trade_id: int) -> Dict[str, Any]:
        trade = self.trade_model.get_by_id(trade_id)
        if not trade:
            return {'code': 1, 'msg': '交易不存在', 'data': None}

        if trade.get('status') != ErshoushuTradeModel.STATUS_CONFIRMED:
            return {'code': 1, 'msg': '当前交易状态无法完成', 'data': None}

        if user_id not in [trade.get('buyer_id'), trade.get('seller_id')]:
            return {'code': 1, 'msg': '无权操作此交易', 'data': None}

        affected = self.trade_model.update_status(trade_id, ErshoushuTradeModel.STATUS_COMPLETED)
        if affected > 0:
            self.book_model.update_status(trade.get('book_id'), ErshoushuBookModel.STATUS_SOLD)

            other_user_id = trade.get('seller_id') if user_id == trade.get('buyer_id') else trade.get('buyer_id')
            self.notification_model.create(
                user_id=other_user_id,
                title='交易已完成',
                content=f'《{self._get_book_title(trade.get("book_id"))}》的交易已完成，请及时评价',
                ntype=ErshoushuNotificationModel.TYPE_TRADE,
                related_id=trade_id
            )

            return {'code': 0, 'msg': '交易已完成', 'data': None}
        return {'code': 1, 'msg': '操作失败', 'data': None}

    def cancel_trade(self, user_id: int, trade_id: int) -> Dict[str, Any]:
        trade = self.trade_model.get_by_id(trade_id)
        if not trade:
            return {'code': 1, 'msg': '交易不存在', 'data': None}

        if trade.get('status') not in [ErshoushuTradeModel.STATUS_PENDING, ErshoushuTradeModel.STATUS_CONFIRMED]:
            return {'code': 1, 'msg': '当前交易状态无法取消', 'data': None}

        if user_id not in [trade.get('buyer_id'), trade.get('seller_id')]:
            return {'code': 1, 'msg': '无权取消此交易', 'data': None}

        affected = self.trade_model.update_status(trade_id, ErshoushuTradeModel.STATUS_CANCELLED)
        if affected > 0:
            self.book_model.update_status(trade.get('book_id'), ErshoushuBookModel.STATUS_APPROVED)

            other_user_id = trade.get('seller_id') if user_id == trade.get('buyer_id') else trade.get('buyer_id')
            self.notification_model.create(
                user_id=other_user_id,
                title='交易已取消',
                content=f'《{self._get_book_title(trade.get("book_id"))}》的交易已被取消',
                ntype=ErshoushuNotificationModel.TYPE_TRADE,
                related_id=trade_id
            )

            return {'code': 0, 'msg': '交易已取消', 'data': None}
        return {'code': 1, 'msg': '取消失败', 'data': None}

    def get_trade_detail(self, trade_id: int) -> Dict[str, Any]:
        trade = self.trade_model.get_by_id(trade_id)
        if not trade:
            return {'code': 1, 'msg': '交易不存在', 'data': None}

        trade_data = self.trade_model.to_dict(trade)

        book = self.book_model.get_by_id(trade.get('book_id'))
        if book:
            trade_data['book'] = self.book_model.to_dict(book)

        buyer = self.user_model.get_by_id(trade.get('buyer_id'))
        if buyer:
            trade_data['buyer'] = self.user_model.to_public_dict(buyer)

        seller = self.user_model.get_by_id(trade.get('seller_id'))
        if seller:
            trade_data['seller'] = self.user_model.to_public_dict(seller)

        return {'code': 0, 'msg': 'success', 'data': trade_data}

    def get_my_trades(self, user_id: int, page: int = 1, page_size: int = 10,
                      status: int = None) -> Dict[str, Any]:
        result = self.trade_model.get_by_user(user_id, page, page_size, status)

        items = []
        for trade in result.get('items', []):
            trade_data = self.trade_model.to_dict(trade)

            book = self.book_model.get_by_id(trade.get('book_id'))
            if book:
                trade_data['book'] = {
                    'id': book.get('id'),
                    'title': book.get('title'),
                    'cover_image': book.get('cover_image'),
                    'price': book.get('price')
                }

            other_user_id = trade.get('seller_id') if user_id == trade.get('buyer_id') else trade.get('buyer_id')
            other_user = self.user_model.get_by_id(other_user_id)
            if other_user:
                trade_data['other_user'] = self.user_model.to_public_dict(other_user)

            items.append(trade_data)

        return {
            'code': 0, 'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_all_trades(self, page: int = 1, page_size: int = 10,
                       status: int = None) -> Dict[str, Any]:
        result = self.trade_model.get_all(page, page_size, status)

        items = []
        for trade in result.get('items', []):
            trade_data = self.trade_model.to_dict(trade)

            book = self.book_model.get_by_id(trade.get('book_id'))
            if book:
                trade_data['book'] = {
                    'id': book.get('id'),
                    'title': book.get('title'),
                    'price': book.get('price')
                }

            buyer = self.user_model.get_by_id(trade.get('buyer_id'))
            if buyer:
                trade_data['buyer'] = {
                    'id': buyer.get('id'),
                    'nickname': buyer.get('nickname'),
                    'username': buyer.get('username')
                }

            seller = self.user_model.get_by_id(trade.get('seller_id'))
            if seller:
                trade_data['seller'] = {
                    'id': seller.get('id'),
                    'nickname': seller.get('nickname'),
                    'username': seller.get('username')
                }

            items.append(trade_data)

        return {
            'code': 0, 'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_statistics(self) -> Dict[str, Any]:
        stats = self.trade_model.get_statistics()
        return {'code': 0, 'msg': 'success', 'data': stats}

    def _get_book_title(self, book_id: int) -> str:
        book = self.book_model.get_by_id(book_id)
        return book.get('title', '未知书籍') if book else '未知书籍'
