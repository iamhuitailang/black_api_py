from typing import Dict, Any, List, Optional
import random
from app.model.maomi_model import CatModel, GameRecordModel


class CatBusiness:
    def __init__(self):
        self.model = CatModel()
        self.record_model = GameRecordModel()

    def get_all_cats(self, user_id: int, include_visitors: bool = False) -> Dict[str, Any]:
        try:
            cats = self.model.get_by_user_id(user_id, include_visitors)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': cats,
                    'count': len(cats)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_cat(self, cat_id: int) -> Dict[str, Any]:
        cat = self.model.get_by_id(cat_id)
        if cat:
            return {
                'code': 0,
                'message': 'success',
                'data': cat
            }
        return {
            'code': 1,
            'message': '猫咪不存在',
            'data': None
        }

    def add_cat(self, user_id: int, name: str, breed: str, color: str, personality: str,
                favorite_food: str = '', favorite_toy: str = '', cuteness: int = 50) -> Dict[str, Any]:
        breeds = ['英短', '美短', '布偶', '橘猫', '暹罗', '波斯', '缅因', '田园猫', '折耳', '无毛']
        personalities = ['黏人', '独立', '调皮', '懒癌', '傲娇', '胆小', '活泼', '安静']

        if breed not in breeds:
            breed = random.choice(breeds)
        if personality not in personalities:
            personality = random.choice(personalities)

        try:
            cat_id = self.model.create(
                user_id=user_id,
                name=name,
                breed=breed,
                color=color,
                personality=personality,
                favorite_food=favorite_food,
                favorite_toy=favorite_toy,
                cuteness=cuteness
            )
            self.record_model.add_cat_record(user_id, name, '添加')
            return self.get_cat(cat_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def feed_cat(self, user_id: int, cat_id: int) -> Dict[str, Any]:
        cat = self.model.get_by_id(cat_id)
        if not cat:
            return {
                'code': 1,
                'message': '猫咪不存在',
                'data': None
            }
        if cat.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此猫咪',
                'data': None
            }
        try:
            self.model.feed_cat(cat_id)
            self.record_model.add_cat_record(user_id, cat.get('name'), '喂食')
            return self.get_cat(cat_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def play_with_cat(self, user_id: int, cat_id: int) -> Dict[str, Any]:
        cat = self.model.get_by_id(cat_id)
        if not cat:
            return {
                'code': 1,
                'message': '猫咪不存在',
                'data': None
            }
        if cat.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此猫咪',
                'data': None
            }
        if cat.get('energy', 0) < 10:
            return {
                'code': 1,
                'message': '猫咪太累了，让它休息一下吧',
                'data': None
            }
        try:
            self.model.play_with_cat(cat_id)
            self.record_model.add_cat_record(user_id, cat.get('name'), '陪玩')
            return self.get_cat(cat_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def clean_cat(self, user_id: int, cat_id: int) -> Dict[str, Any]:
        cat = self.model.get_by_id(cat_id)
        if not cat:
            return {
                'code': 1,
                'message': '猫咪不存在',
                'data': None
            }
        if cat.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此猫咪',
                'data': None
            }
        try:
            self.model.clean_cat(cat_id)
            self.record_model.add_cat_record(user_id, cat.get('name'), '清洁')
            return self.get_cat(cat_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_cat(self, user_id: int, cat_id: int, name: str = None, favorite_food: str = None,
                   favorite_toy: str = None) -> Dict[str, Any]:
        cat = self.model.get_by_id(cat_id)
        if not cat:
            return {
                'code': 1,
                'message': '猫咪不存在',
                'data': None
            }
        if cat.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此猫咪',
                'data': None
            }
        try:
            self.model.update(cat_id, name=name, favorite_food=favorite_food, favorite_toy=favorite_toy)
            return self.get_cat(cat_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def delete_cat(self, user_id: int, cat_id: int) -> Dict[str, Any]:
        cat = self.model.get_by_id(cat_id)
        if not cat:
            return {
                'code': 1,
                'message': '猫咪不存在',
                'data': None
            }
        if cat.get('user_id') != user_id:
            return {
                'code': 1,
                'message': '无权限操作此猫咪',
                'data': None
            }
        try:
            affected = self.model.delete(cat_id)
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

    def create_initial_cats(self, user_id: int) -> Dict[str, Any]:
        initial_cats = [
            {'name': '小橘', 'breed': '橘猫', 'color': '橘色', 'personality': '懒癌', 'favorite_food': '小鱼干', 'favorite_toy': '毛线球', 'cuteness': 60},
            {'name': '雪球', 'breed': '布偶', 'color': '白色', 'personality': '黏人', 'favorite_food': '高级猫粮', 'favorite_toy': '逗猫棒', 'cuteness': 75},
        ]
        try:
            for cat_data in initial_cats:
                self.model.create(user_id=user_id, **cat_data)
            return self.get_all_cats(user_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def add_visitor_cat(self, user_id: int, owner_name: str) -> Dict[str, Any]:
        breeds = ['英短', '美短', '布偶', '橘猫', '暹罗', '波斯', '缅因', '田园猫']
        colors = ['黑色', '白色', '灰色', '橘色', '三花', '奶牛', '虎斑']
        personalities = ['黏人', '独立', '调皮', '懒癌', '傲娇', '胆小']
        names = ['咪咪', '小白', '豆豆', '花花', '团子', '奶茶', '布丁', '芝麻']

        name = random.choice(names)
        breed = random.choice(breeds)
        color = random.choice(colors)
        personality = random.choice(personalities)

        try:
            cat_id = self.model.create(
                user_id=user_id,
                name=name,
                breed=breed,
                color=color,
                personality=personality,
                cuteness=random.randint(40, 80),
                is_visitor=1,
                visitor_owner=owner_name
            )
            return self.get_cat(cat_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
