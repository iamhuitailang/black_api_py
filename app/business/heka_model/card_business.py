from typing import Dict, Any, List, Optional
import uuid
import json
from app.model.heka_model import CardModel


class CardBusiness:
    def __init__(self):
        self.card_model = CardModel()

    def create_card(self, holiday_id: int, template_id: int, background_id: int = 0,
                    title: str = '', message: str = '', signature: str = '', date: str = '',
                    font_family: str = 'Arial', font_size: int = 24, font_color: str = '#000000',
                    stickers: List[Dict[str, Any]] = None, image_url: str = '') -> Dict[str, Any]:
        if not holiday_id or not template_id:
            return {
                'code': 1,
                'message': 'holiday_id and template_id are required',
                'data': None
            }

        stickers_str = json.dumps(stickers) if stickers else '[]'
        share_code = self._generate_share_code()

        try:
            card_id = self.card_model.create(
                holiday_id=holiday_id,
                template_id=template_id,
                background_id=background_id,
                title=title,
                message=message,
                signature=signature,
                date=date,
                font_family=font_family,
                font_size=font_size,
                font_color=font_color,
                stickers=stickers_str,
                image_url=image_url,
                share_code=share_code
            )

            return self.get_card_by_id(card_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_card_by_id(self, card_id: int) -> Dict[str, Any]:
        card = self.card_model.get_by_id(card_id)
        if card:
            return self._format_card_response(card)
        return {
            'code': 1,
            'message': 'Card not found',
            'data': None
        }

    def get_card_by_share_code(self, share_code: str) -> Dict[str, Any]:
        if not share_code:
            return {
                'code': 1,
                'message': 'share_code is required',
                'data': None
            }

        card = self.card_model.get_by_share_code(share_code)
        if card:
            self.card_model.increment_view_count(card.get('id'))
            return self._format_card_response(card)
        return {
            'code': 1,
            'message': 'Card not found',
            'data': None
        }

    def update_card(self, card_id: int, holiday_id: int = None, template_id: int = None,
                    background_id: int = None, title: str = None, message: str = None,
                    signature: str = None, date: str = None, font_family: str = None,
                    font_size: int = None, font_color: str = None,
                    stickers: List[Dict[str, Any]] = None, image_url: str = None) -> Dict[str, Any]:
        existing = self.card_model.get_by_id(card_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Card with id {card_id} not found',
                'data': None
            }

        stickers_str = None
        if stickers is not None:
            stickers_str = json.dumps(stickers)

        try:
            affected = self.card_model.update(
                record_id=card_id,
                holiday_id=holiday_id,
                template_id=template_id,
                background_id=background_id,
                title=title,
                message=message,
                signature=signature,
                date=date,
                font_family=font_family,
                font_size=font_size,
                font_color=font_color,
                stickers=stickers_str,
                image_url=image_url
            )

            if affected > 0:
                return self.get_card_by_id(card_id)

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

    def delete_card(self, card_id: int) -> Dict[str, Any]:
        existing = self.card_model.get_by_id(card_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Card with id {card_id} not found',
                'data': None
            }

        affected = self.card_model.delete(card_id)
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

    def get_all_cards(self) -> Dict[str, Any]:
        cards = self.card_model.get_all()
        result = []
        for card in cards:
            result.append(self._format_card_data(card))

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def _generate_share_code(self) -> str:
        return str(uuid.uuid4()).replace('-', '')[:12]

    def _format_card_data(self, card: Dict[str, Any]) -> Dict[str, Any]:
        stickers_data = []
        try:
            stickers_data = json.loads(card.get('stickers', '[]'))
        except:
            pass

        return {
            'id': card.get('id'),
            'holiday_id': card.get('holiday_id'),
            'template_id': card.get('template_id'),
            'background_id': card.get('background_id'),
            'title': card.get('title'),
            'message': card.get('message'),
            'signature': card.get('signature'),
            'date': card.get('date'),
            'font_family': card.get('font_family'),
            'font_size': card.get('font_size'),
            'font_color': card.get('font_color'),
            'stickers': stickers_data,
            'image_url': card.get('image_url'),
            'share_code': card.get('share_code'),
            'view_count': card.get('view_count'),
            'created_at': card.get('created_at')
        }

    def _format_card_response(self, card: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'code': 0,
            'message': 'success',
            'data': self._format_card_data(card)
        }
