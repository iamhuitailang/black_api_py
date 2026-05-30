from typing import Dict, Any, List, Optional
from app.model.heka_model import HolidayModel, TemplateModel, StickerModel, BackgroundModel


class HekaBusiness:
    def __init__(self):
        self.holiday_model = HolidayModel()
        self.template_model = TemplateModel()
        self.sticker_model = StickerModel()
        self.background_model = BackgroundModel()

    def get_holidays(self) -> Dict[str, Any]:
        holidays = self.holiday_model.get_all()
        result = []
        for holiday in holidays:
            result.append({
                'id': holiday.get('id'),
                'name': holiday.get('name'),
                'emoji': holiday.get('emoji'),
                'primary_color': holiday.get('primary_color'),
                'secondary_color': holiday.get('secondary_color'),
                'elements': holiday.get('elements'),
                'sort_order': holiday.get('sort_order')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_holiday_by_id(self, holiday_id: int) -> Dict[str, Any]:
        holiday = self.holiday_model.get_by_id(holiday_id)
        if holiday:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': holiday.get('id'),
                    'name': holiday.get('name'),
                    'emoji': holiday.get('emoji'),
                    'primary_color': holiday.get('primary_color'),
                    'secondary_color': holiday.get('secondary_color'),
                    'elements': holiday.get('elements'),
                    'sort_order': holiday.get('sort_order')
                }
            }
        return {
            'code': 1,
            'message': 'Holiday not found',
            'data': None
        }

    def get_templates_by_holiday(self, holiday_id: int) -> Dict[str, Any]:
        templates = self.template_model.get_by_holiday_id(holiday_id)
        result = []
        for template in templates:
            result.append({
                'id': template.get('id'),
                'holiday_id': template.get('holiday_id'),
                'name': template.get('name'),
                'image_url': template.get('image_url'),
                'preview_url': template.get('preview_url'),
                'width': template.get('width'),
                'height': template.get('height'),
                'sort_order': template.get('sort_order')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_stickers_by_holiday(self, holiday_id: int) -> Dict[str, Any]:
        stickers = self.sticker_model.get_by_holiday_id(holiday_id)
        result = []
        for sticker in stickers:
            result.append({
                'id': sticker.get('id'),
                'holiday_id': sticker.get('holiday_id'),
                'name': sticker.get('name'),
                'image_url': sticker.get('image_url'),
                'category': sticker.get('category'),
                'width': sticker.get('width'),
                'height': sticker.get('height'),
                'sort_order': sticker.get('sort_order')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_backgrounds_by_holiday(self, holiday_id: int) -> Dict[str, Any]:
        backgrounds = self.background_model.get_by_holiday_id(holiday_id)
        result = []
        for bg in backgrounds:
            result.append({
                'id': bg.get('id'),
                'holiday_id': bg.get('holiday_id'),
                'name': bg.get('name'),
                'image_url': bg.get('image_url'),
                'color': bg.get('color'),
                'sort_order': bg.get('sort_order')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_holiday_all_data(self, holiday_id: int) -> Dict[str, Any]:
        holiday_result = self.get_holiday_by_id(holiday_id)
        if holiday_result.get('code') != 0:
            return holiday_result

        templates_result = self.get_templates_by_holiday(holiday_id)
        stickers_result = self.get_stickers_by_holiday(holiday_id)
        backgrounds_result = self.get_backgrounds_by_holiday(holiday_id)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'holiday': holiday_result.get('data'),
                'templates': templates_result.get('data', []),
                'stickers': stickers_result.get('data', []),
                'backgrounds': backgrounds_result.get('data', [])
            }
        }
