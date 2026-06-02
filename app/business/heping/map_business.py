from typing import Dict, Any
from app.model.heping_model import MapModel


class MapBusiness:
    def __init__(self):
        self.map_model = MapModel()

    def create_map(self, name: str, width: int, height: int, terrain_type: str,
                   description: str = '', thumbnail: str = '',
                   safe_zone_speed: float = 1.0, max_players: int = 100) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '地图名称不能为空',
                'data': None
            }

        valid_terrains = ['forest', 'desert', 'city', 'island']
        if terrain_type not in valid_terrains:
            return {
                'code': 1,
                'msg': f'地形类型无效，可选: {", ".join(valid_terrains)}',
                'data': None
            }

        map_id = self.map_model.create(
            name=name, width=width, height=height, terrain_type=terrain_type,
            description=description, thumbnail=thumbnail,
            safe_zone_speed=safe_zone_speed, max_players=max_players
        )

        if map_id > 0:
            map_data = self.map_model.get_by_id(map_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': map_data
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def get_map(self, map_id: int) -> Dict[str, Any]:
        map_data = self.map_model.get_by_id(map_id)
        if not map_data:
            return {
                'code': 1,
                'msg': '地图不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': map_data
        }

    def get_map_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.map_model.get_all(page, page_size)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def update_map(self, map_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        map_data = self.map_model.get_by_id(map_id)
        if not map_data:
            return {
                'code': 1,
                'msg': '地图不存在',
                'data': None
            }

        update_data = {k: v for k, v in data.items() if k in [
            'name', 'width', 'height', 'terrain_type', 'description',
            'thumbnail', 'safe_zone_speed', 'max_players', 'status'
        ]}

        if not update_data:
            return {
                'code': 1,
                'msg': '没有可更新的字段',
                'data': None
            }

        affected = self.map_model.update(map_id, **update_data)
        if affected >= 0:
            updated_map = self.map_model.get_by_id(map_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': updated_map
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_map(self, map_id: int) -> Dict[str, Any]:
        map_data = self.map_model.get_by_id(map_id)
        if not map_data:
            return {
                'code': 1,
                'msg': '地图不存在',
                'data': None
            }

        affected = self.map_model.delete(map_id)
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
