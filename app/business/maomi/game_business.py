from typing import Dict, Any, List, Optional
import random
from datetime import datetime
from app.model.maomi_model import (
    UserProfileModel, CatModel, CafeModel, DrinkModel,
    OrderModel, ItemModel, ActivityModel, VisitorModel,
    CatItemModel, GameRecordModel
)
from app.model.auth import UserModel


class GameBusiness:
    def __init__(self):
        self.user_profile_model = UserProfileModel()
        self.cat_model = CatModel()
        self.cafe_model = CafeModel()
        self.drink_model = DrinkModel()
        self.order_model = OrderModel()
        self.item_model = ItemModel()
        self.activity_model = ActivityModel()
        self.visitor_model = VisitorModel()
        self.cat_item_model = CatItemModel()
        self.game_record_model = GameRecordModel()
        self.auth_user_model = UserModel()

    def init_game(self, user_id: int, nickname: str = '猫咪店长') -> Dict[str, Any]:
        try:
            profile = self.user_profile_model.get_by_user_id(user_id)
            if not profile:
                self.user_profile_model.create(user_id, nickname)

            cafe = self.cafe_model.get_by_user_id(user_id)
            if not cafe:
                self.cafe_model.create(user_id)

            cat_count = self.cat_model.count_by_user(user_id)
            if cat_count == 0:
                initial_cats = [
                    {'name': '小橘', 'breed': '橘猫', 'color': '橘色', 'personality': '懒癌', 'favorite_food': '小鱼干', 'favorite_toy': '毛线球', 'cuteness': 60},
                    {'name': '雪球', 'breed': '布偶', 'color': '白色', 'personality': '黏人', 'favorite_food': '高级猫粮', 'favorite_toy': '逗猫棒', 'cuteness': 75},
                ]
                for cat_data in initial_cats:
                    self.cat_model.create(user_id=user_id, **cat_data)

            drink_count = len(self.drink_model.get_by_user_id(user_id))
            if drink_count == 0:
                self.drink_model.create_default_drinks(user_id)

            activity_count = len(self.activity_model.get_by_user_id(user_id))
            if activity_count == 0:
                self.activity_model.create_default_activities(user_id)

            item_count = self.item_model.count()
            if item_count == 0:
                self.item_model.create_default_items()

            return self.get_game_state(user_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_game_state(self, user_id: int) -> Dict[str, Any]:
        try:
            profile = self.user_profile_model.get_by_user_id(user_id)
            cafe = self.cafe_model.get_by_user_id(user_id)
            cats = self.cat_model.get_by_user_id(user_id)
            drinks = self.drink_model.get_available(user_id)
            pending_orders = self.order_model.get_pending_orders(user_id)
            active_visitors = self.visitor_model.get_active(user_id)
            user_items = self.cat_item_model.get_by_user_id(user_id)
            order_stats = self.order_model.get_statistics(user_id)
            game_records = self.game_record_model.get_today_records(user_id)

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'profile': profile,
                    'cafe': cafe,
                    'cats': cats,
                    'drinks': drinks,
                    'pending_orders': pending_orders,
                    'active_visitors': active_visitors,
                    'user_items': user_items,
                    'order_stats': order_stats,
                    'today_records': game_records[:10],
                    'current_time': datetime.now().isoformat()
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def register(self, username: str, password: str, nickname: str = '猫咪店长') -> Dict[str, Any]:
        try:
            existing_user = self.auth_user_model.get_by_username(username)
            if existing_user:
                return {
                    'code': 1,
                    'message': '用户名已存在',
                    'data': None
                }

            if len(password) < 6:
                return {
                    'code': 1,
                    'message': '密码长度至少6位',
                    'data': None
                }

            user_id = self.auth_user_model.create(username, password)

            self.init_game(user_id, nickname)

            return {
                'code': 0,
                'message': '注册成功',
                'data': {
                    'user_id': user_id,
                    'username': username
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_game_records(self, user_id: int, limit: int = 50) -> Dict[str, Any]:
        try:
            records = self.game_record_model.get_by_user_id(user_id, limit)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': records,
                    'count': len(records)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_share_data(self, user_id: int) -> Dict[str, Any]:
        try:
            profile = self.user_profile_model.get_by_user_id(user_id)
            cafe = self.cafe_model.get_by_user_id(user_id)
            cats = self.cat_model.get_by_user_id(user_id)
            order_stats = self.order_model.get_statistics(user_id)

            if not profile:
                return {
                    'code': 1,
                    'message': '用户不存在',
                    'data': None
                }

            cat_names = [cat.get('name', '') for cat in cats]
            share_text = f"我在《猫咪咖啡馆》经营了{profile.get('play_days', 1)}天，拥有{len(cats)}只猫咪，总收益{profile.get('total_income', 0)}金币，快来一起玩！"

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'nickname': profile.get('nickname', ''),
                    'cafe_name': cafe.get('name', '') if cafe else '',
                    'level': profile.get('level', 1),
                    'coins': profile.get('coins', 0),
                    'cat_count': len(cats),
                    'cat_names': cat_names,
                    'total_income': profile.get('total_income', 0),
                    'total_customers': profile.get('total_customers', 0),
                    'share_text': share_text,
                    'completed_orders': order_stats.get('completed_orders', 0)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def daily_checkin(self, user_id: int) -> Dict[str, Any]:
        try:
            profile = self.user_profile_model.get_by_user_id(user_id)
            if not profile:
                return {
                    'code': 1,
                    'message': '用户档案不存在',
                    'data': None
                }

            today = datetime.now().strftime('%Y-%m-%d')
            last_login = profile.get('last_login_time', '')
            last_login_date = last_login[:10] if last_login else ''

            reward_coins = 0
            reward_exp = 0
            is_first_login = False

            if last_login_date != today:
                is_first_login = True
                reward_coins = 100
                reward_exp = 20
                new_play_days = profile.get('play_days', 1) + 1

                self.user_profile_model.update(
                    profile.get('id'),
                    coins=profile.get('coins', 0) + reward_coins,
                    experience=profile.get('experience', 0) + reward_exp,
                    play_days=new_play_days,
                    last_login_time=datetime.now().isoformat()
                )
            else:
                self.user_profile_model.update(
                    profile.get('id'),
                    last_login_time=datetime.now().isoformat()
                )

            return {
                'code': 0,
                'message': '签到成功' if is_first_login else '今日已签到',
                'data': {
                    'is_first_login': is_first_login,
                    'reward_coins': reward_coins,
                    'reward_exp': reward_exp
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
