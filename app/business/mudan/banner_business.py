from typing import Dict, Any, List, Optional
from app.model.mudan import BannerModel, BannerConfigModel, BannerConfigKeys


class BannerBusiness:
    def __init__(self):
        self.model = BannerModel()
        self.config_model = BannerConfigModel()

    def get_banners(self) -> Dict[str, Any]:
        banners = self.model.get_all()
        aspect_ratio = self.config_model.get_value(BannerConfigKeys.ASPECT_RATIO, '16:9')
        
        result = []
        for banner in banners:
            result.append({
                'id': banner.get('id'),
                'image_url': banner.get('image_url'),
                'jump_url': banner.get('jump_url'),
                'sort_order': banner.get('sort_order'),
                'created_at': banner.get('created_at'),
                'updated_at': banner.get('updated_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'aspect_ratio': aspect_ratio,
                'items': result
            }
        }

    def set_banners(self, banners: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not isinstance(banners, list):
            return {
                'code': 1,
                'message': 'Banners must be a list',
                'data': None
            }
        
        for index, banner in enumerate(banners):
            if not isinstance(banner, dict):
                return {
                    'code': 1,
                    'message': f'Banner at index {index} must be an object',
                    'data': None
                }
            if 'image_url' not in banner or not banner.get('image_url'):
                return {
                    'code': 1,
                    'message': f'Banner at index {index} must have image_url',
                    'data': None
                }
        
        try:
            self.model.delete_all()
            
            for index, banner in enumerate(banners):
                banner['sort_order'] = index
            
            if banners:
                self.model.create_many(banners)
            
            return self.get_banners()
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_banner_config(self) -> Dict[str, Any]:
        aspect_ratio = self.config_model.get_value(BannerConfigKeys.ASPECT_RATIO, '16:9')
        auto_play = self.config_model.get_value(BannerConfigKeys.AUTO_PLAY, 'true')
        interval = self.config_model.get_value(BannerConfigKeys.INTERVAL, '3000')
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'aspect_ratio': aspect_ratio,
                'auto_play': auto_play == 'true',
                'interval': int(interval) if interval.isdigit() else 3000
            }
        }

    def set_banner_config(self, aspect_ratio: str = None, auto_play: bool = None, interval: int = None) -> Dict[str, Any]:
        try:
            if aspect_ratio is not None:
                self.config_model.set_value(BannerConfigKeys.ASPECT_RATIO, aspect_ratio)
            
            if auto_play is not None:
                self.config_model.set_value(BannerConfigKeys.AUTO_PLAY, 'true' if auto_play else 'false')
            
            if interval is not None:
                self.config_model.set_value(BannerConfigKeys.INTERVAL, str(interval))
            
            return self.get_banner_config()
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_banner_by_id(self, record_id: int) -> Dict[str, Any]:
        banner = self.model.get_by_id(record_id)
        
        if banner:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': banner.get('id'),
                    'image_url': banner.get('image_url'),
                    'jump_url': banner.get('jump_url'),
                    'sort_order': banner.get('sort_order'),
                    'created_at': banner.get('created_at'),
                    'updated_at': banner.get('updated_at')
                }
            }
        
        return {
            'code': 1,
            'message': 'Banner not found',
            'data': None
        }

    def delete_banner(self, record_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Banner with id {record_id} not found',
                'data': None
            }
        
        affected = self.model.delete(record_id)
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

    def add_single_banner(self, image_url: str, jump_url: str = '') -> Dict[str, Any]:
        if not image_url or not image_url.strip():
            return {
                'code': 1,
                'message': 'image_url is required',
                'data': None
            }
        
        existing_banners = self.model.get_all()
        sort_order = len(existing_banners)
        
        try:
            new_id = self.model.create(
                image_url=image_url.strip(),
                jump_url=jump_url.strip() if jump_url else '',
                sort_order=sort_order
            )
            
            return self.get_banner_by_id(new_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_single_banner(self, record_id: int, image_url: str = None, jump_url: str = None) -> Dict[str, Any]:
        existing = self.model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Banner with id {record_id} not found',
                'data': None
            }
        
        try:
            affected = self.model.update(
                record_id=record_id,
                image_url=image_url.strip() if image_url else None,
                jump_url=jump_url.strip() if jump_url else None
            )
            
            if affected > 0:
                return self.get_banner_by_id(record_id)
            
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
