from typing import Dict, Any, Optional
from app.model.ty_model import WorkshopModel, WeaponModel, UserModel


class TyWorkshopBusiness:
    def __init__(self):
        self.workshop_model = WorkshopModel()
        self.weapon_model = WeaponModel()
        self.user_model = UserModel()

    def publish_work(self, user_id: int, weapon_id: int, title: str,
                     description: str = '', tags: str = '') -> Dict[str, Any]:
        weapon = self.weapon_model.get_by_id(weapon_id)
        if not weapon or weapon.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '武器不存在或不属于当前用户',
                'data': None
            }

        existing = self.workshop_model.get_by_weapon_id(weapon_id)
        if existing:
            return {
                'code': 1,
                'msg': '该武器已发布到创意工坊',
                'data': None
            }

        if not title or len(title) > 100:
            return {
                'code': 1,
                'msg': '标题不能为空且长度不能超过100',
                'data': None
            }

        workshop_id = self.workshop_model.publish(
            user_id=user_id,
            weapon_id=weapon_id,
            title=title,
            description=description,
            tags=tags
        )

        if workshop_id > 0:
            self.weapon_model.update(weapon_id, {'is_shared': 1})
            self.weapon_model.add_share_count(weapon_id)
            workshop = self.workshop_model.get_by_id(workshop_id)
            return {
                'code': 0,
                'msg': '发布成功',
                'data': self.workshop_model.to_public_dict(workshop)
            }

        return {
            'code': 1,
            'msg': '发布失败',
            'data': None
        }

    def get_work_list(self, page: int = 1, page_size: int = 10,
                      user_id: int = None, is_official: int = None,
                      keyword: str = None, tag: str = None,
                      sort_by: str = 'like_count') -> Dict[str, Any]:
        result = self.workshop_model.get_list(
            page=page,
            page_size=page_size,
            user_id=user_id,
            is_official=is_official,
            keyword=keyword,
            tag=tag,
            sort_by=sort_by
        )
        items = [self.workshop_model.to_public_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_work_detail(self, workshop_id: int, current_user_id: int = None) -> Dict[str, Any]:
        workshop = self.workshop_model.get_by_id(workshop_id)
        if not workshop or workshop.get('status') != 1:
            return {
                'code': 1,
                'msg': '作品不存在',
                'data': None
            }

        self.workshop_model.add_view(workshop_id)
        workshop = self.workshop_model.get_by_id(workshop_id)

        result = self.workshop_model.to_public_dict(workshop)
        result['can_copy'] = current_user_id is not None and current_user_id != workshop.get('user_id')

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def like_work(self, workshop_id: int, user_id: int) -> Dict[str, Any]:
        workshop = self.workshop_model.get_by_id(workshop_id)
        if not workshop:
            return {
                'code': 1,
                'msg': '作品不存在',
                'data': None
            }

        affected = self.workshop_model.add_like(workshop_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '点赞成功',
                'data': {'like_count': workshop.get('like_count', 0) + 1}
            }

        return {
            'code': 1,
            'msg': '点赞失败',
            'data': None
        }

    def copy_weapon(self, workshop_id: int, user_id: int) -> Dict[str, Any]:
        workshop = self.workshop_model.get_by_id(workshop_id)
        if not workshop:
            return {
                'code': 1,
                'msg': '作品不存在',
                'data': None
            }

        if workshop.get('user_id') == user_id:
            return {
                'code': 1,
                'msg': '不能复制自己的作品',
                'data': None
            }

        result = self.workshop_model.copy_weapon(workshop_id, user_id)
        if result.get('success'):
            return {
                'code': 0,
                'msg': result.get('msg', '复制成功'),
                'data': {'weapon_id': result.get('weapon_id')}
            }

        return {
            'code': 1,
            'msg': result.get('msg', '复制失败'),
            'data': None
        }

    def update_work(self, workshop_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        workshop = self.workshop_model.get_by_id(workshop_id)
        if not workshop:
            return {
                'code': 1,
                'msg': '作品不存在',
                'data': None
            }

        if workshop.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权修改该作品',
                'data': None
            }

        affected = self.workshop_model.update(workshop_id, data)
        if affected >= 0:
            updated = self.workshop_model.get_by_id(workshop_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.workshop_model.to_public_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_work(self, workshop_id: int, user_id: int) -> Dict[str, Any]:
        workshop = self.workshop_model.get_by_id(workshop_id)
        if not workshop:
            return {
                'code': 1,
                'msg': '作品不存在',
                'data': None
            }

        if workshop.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权删除该作品',
                'data': None
            }

        affected = self.workshop_model.delete(workshop_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }

    def get_user_works(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.get_work_list(page, page_size, user_id=user_id)
