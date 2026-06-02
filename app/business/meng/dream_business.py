from typing import Dict, Any, List, Optional
from app.model.meng_model import DreamModel, UserModel, VisitModel


class MengDreamBusiness:
    def __init__(self):
        self.dream_model = DreamModel()
        self.user_model = UserModel()
        self.visit_model = VisitModel()

    def create_dream(self, user_id: int, name: str, description: str = '') -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if user.get('status') == self.user_model.STATUS_BANNED:
            return {
                'code': 1,
                'msg': '账号已被封禁，无法创建梦境',
                'data': None
            }

        if not name or len(name.strip()) < 2:
            return {
                'code': 1,
                'msg': '梦境名称至少2个字符',
                'data': None
            }

        dream_id = self.dream_model.create(
            user_id=user_id,
            name=name.strip(),
            description=description.strip()
        )

        if dream_id > 0:
            dream = self.dream_model.get_by_id(dream_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.dream_model.to_dict(dream)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def get_dream_detail(self, dream_id: int, visitor_user_id: Optional[int] = None) -> Dict[str, Any]:
        dream = self.dream_model.get_by_id(dream_id)
        if not dream:
            return {
                'code': 1,
                'msg': '梦境不存在',
                'data': None
            }

        if dream.get('is_public') == self.dream_model.IS_PRIVATE:
            if visitor_user_id is None or dream.get('user_id') != visitor_user_id:
                return {
                    'code': 1,
                    'msg': '该梦境为私有，无法访问',
                    'data': None
                }

        self.dream_model.update_visit_count(dream_id)

        if visitor_user_id is not None and visitor_user_id != dream.get('user_id'):
            self.visit_model.create(
                visitor_id=visitor_user_id,
                dream_id=dream_id
            )

        dream_data = self.dream_model.to_dict(dream)
        dream_data['visit_count'] = dream_data.get('visit_count', 0) + 1

        owner = self.user_model.get_by_id(dream.get('user_id'))
        if owner:
            dream_data['owner'] = {
                'id': owner.get('id'),
                'username': owner.get('username'),
                'nickname': owner.get('nickname'),
                'avatar': owner.get('avatar'),
                'level': owner.get('level')
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': dream_data
        }

    def get_my_dreams(self, user_id: int, page: int, page_size: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        result = self.dream_model.get_by_user(
            user_id=user_id,
            page=page,
            page_size=page_size
        )

        items = [self.dream_model.to_dict(dream) for dream in result.get('items', [])]

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

    def get_public_dreams(self, page: int, page_size: int, keyword: str = '',
                          weather: Optional[str] = None, time_of_day: Optional[str] = None) -> Dict[str, Any]:
        if keyword:
            result = self.dream_model.search(
                keyword=keyword,
                page=page,
                page_size=page_size,
                is_public=self.dream_model.IS_PUBLIC
            )
        else:
            result = self.dream_model.get_public_list(
                page=page,
                page_size=page_size,
                weather=weather,
                time_of_day=time_of_day
            )

        items = []
        for dream in result.get('items', []):
            dream_data = self.dream_model.to_dict(dream)
            owner = self.user_model.get_by_id(dream.get('user_id'))
            if owner:
                dream_data['owner'] = {
                    'id': owner.get('id'),
                    'nickname': owner.get('nickname'),
                    'avatar': owner.get('avatar'),
                    'level': owner.get('level')
                }
            items.append(dream_data)

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

    def update_dream(self, user_id: int, dream_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        dream = self.dream_model.get_by_id(dream_id)
        if not dream:
            return {
                'code': 1,
                'msg': '梦境不存在',
                'data': None
            }

        if dream.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能修改自己的梦境',
                'data': None
            }

        if 'name' in data:
            if not data['name'] or len(data['name'].strip()) < 2:
                return {
                    'code': 1,
                    'msg': '梦境名称至少2个字符',
                    'data': None
                }
            data['name'] = data['name'].strip()

        if 'description' in data:
            data['description'] = data['description'].strip() if data['description'] else ''

        affected = self.dream_model.update(dream_id, data)
        if affected >= 0:
            updated_dream = self.dream_model.get_by_id(dream_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.dream_model.to_dict(updated_dream)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_dream(self, user_id: int, dream_id: int) -> Dict[str, Any]:
        dream = self.dream_model.get_by_id(dream_id)
        if not dream:
            return {
                'code': 1,
                'msg': '梦境不存在',
                'data': None
            }

        if dream.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能删除自己的梦境',
                'data': None
            }

        affected = self.dream_model.delete(dream_id)
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

    def toggle_public(self, user_id: int, dream_id: int) -> Dict[str, Any]:
        dream = self.dream_model.get_by_id(dream_id)
        if not dream:
            return {
                'code': 1,
                'msg': '梦境不存在',
                'data': None
            }

        if dream.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能修改自己的梦境状态',
                'data': None
            }

        current_status = dream.get('is_public', self.dream_model.IS_PRIVATE)
        new_status = self.dream_model.IS_PUBLIC if current_status == self.dream_model.IS_PRIVATE else self.dream_model.IS_PRIVATE

        affected = self.dream_model.update(dream_id, {'is_public': new_status})
        if affected >= 0:
            updated_dream = self.dream_model.get_by_id(dream_id)
            return {
                'code': 0,
                'msg': f"已设置为{'公开' if new_status == self.dream_model.IS_PUBLIC else '私有'}",
                'data': self.dream_model.to_dict(updated_dream)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def like_dream(self, user_id: int, dream_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        dream = self.dream_model.get_by_id(dream_id)
        if not dream:
            return {
                'code': 1,
                'msg': '梦境不存在',
                'data': None
            }

        if dream.get('is_public') == self.dream_model.IS_PRIVATE and dream.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无法点赞私有梦境',
                'data': None
            }

        affected = self.dream_model.update_like_count(dream_id, 1)
        if affected > 0:
            updated_dream = self.dream_model.get_by_id(dream_id)
            return {
                'code': 0,
                'msg': '点赞成功',
                'data': {
                    'like_count': updated_dream.get('like_count', 0)
                }
            }

        return {
            'code': 1,
            'msg': '点赞失败',
            'data': None
        }

    def update_settings(self, user_id: int, dream_id: int, gravity: float,
                        weather: str, time_of_day: str) -> Dict[str, Any]:
        dream = self.dream_model.get_by_id(dream_id)
        if not dream:
            return {
                'code': 1,
                'msg': '梦境不存在',
                'data': None
            }

        if dream.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能修改自己的梦境设置',
                'data': None
            }

        valid_weathers = [
            self.dream_model.WEATHER_SUNNY,
            self.dream_model.WEATHER_CLOUDY,
            self.dream_model.WEATHER_RAIN,
            self.dream_model.WEATHER_SNOW,
            self.dream_model.WEATHER_FOG
        ]
        if weather not in valid_weathers:
            return {
                'code': 1,
                'msg': '天气参数不正确',
                'data': None
            }

        valid_times = [
            self.dream_model.TIME_DAWN,
            self.dream_model.TIME_DAY,
            self.dream_model.TIME_DUSK,
            self.dream_model.TIME_SUNSET,
            self.dream_model.TIME_NIGHT
        ]
        if time_of_day not in valid_times:
            return {
                'code': 1,
                'msg': '昼夜参数不正确',
                'data': None
            }

        if gravity < 0 or gravity > 10:
            return {
                'code': 1,
                'msg': '重力参数范围应在0-10之间',
                'data': None
            }

        data = {
            'gravity': gravity,
            'weather': weather,
            'time_of_day': time_of_day
        }

        affected = self.dream_model.update(dream_id, data)
        if affected >= 0:
            updated_dream = self.dream_model.get_by_id(dream_id)
            return {
                'code': 0,
                'msg': '设置更新成功',
                'data': self.dream_model.to_dict(updated_dream)
            }

        return {
            'code': 1,
            'msg': '设置更新失败',
            'data': None
        }

    def get_dream_statistics(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        all_dreams_result = self.dream_model.get_by_user(
            user_id=user_id,
            page=1,
            page_size=1000
        )

        all_dreams = all_dreams_result.get('items', [])
        total_dreams = len(all_dreams)
        total_visits = sum(d.get('visit_count', 0) for d in all_dreams)
        total_likes = sum(d.get('like_count', 0) for d in all_dreams)
        public_count = sum(1 for d in all_dreams if d.get('is_public') == self.dream_model.IS_PUBLIC)
        private_count = total_dreams - public_count

        weather_stats = {}
        time_stats = {}
        for d in all_dreams:
            w = d.get('weather', 'unknown')
            weather_stats[w] = weather_stats.get(w, 0) + 1
            t = d.get('time_of_day', 'unknown')
            time_stats[t] = time_stats.get(t, 0) + 1

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_dreams': total_dreams,
                'public_dreams': public_count,
                'private_dreams': private_count,
                'total_visits': total_visits,
                'total_likes': total_likes,
                'weather_distribution': weather_stats,
                'time_distribution': time_stats
            }
        }
