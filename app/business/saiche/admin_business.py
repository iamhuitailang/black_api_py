from typing import Dict, Any, Optional
from app.model.saiche_model import AdminModel, AdminTokenModel, UserModel, RaceRecordModel, CarModel, TrackModel


class SaicheAdminBusiness:
    def __init__(self):
        self.admin_model = AdminModel()
        self.admin_token_model = AdminTokenModel()
        self.user_model = UserModel()
        self.race_record_model = RaceRecordModel()
        self.car_model = CarModel()
        self.track_model = TrackModel()

    def login(self, username: str, password: str) -> Dict[str, Any]:
        if not username or not password:
            return {
                'code': 1,
                'msg': '用户名和密码不能为空',
                'data': None
            }

        admin = self.admin_model.verify_password(username, password)
        if admin is None:
            return {
                'code': 1,
                'msg': '用户名或密码错误',
                'data': None
            }

        self.admin_token_model.delete_by_admin_id(admin.get('id'))
        token = self.admin_token_model.create_token(admin.get('id'), hours=12)

        return {
            'code': 0,
            'msg': '登录成功',
            'data': {
                'admin': admin,
                'token': token
            }
        }

    def logout(self, token: str) -> Dict[str, Any]:
        if token:
            self.admin_token_model.delete_token(token)
        return {
            'code': 0,
            'msg': '退出成功',
            'data': None
        }

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.admin_token_model.get_admin_by_token(token)

    def get_stats(self) -> Dict[str, Any]:
        total_users = self.user_model.query.count({'status': 0})
        total_races = self.race_record_model.query.count()
        total_cars = self.car_model.query.count()
        total_tracks = self.track_model.query.count({'is_active': 1})

        sql = "SELECT COUNT(*) as total FROM tb_saiche_model_race_records WHERE is_winner = 1"
        total_wins_result = self.race_record_model.db.fetch_one(sql)
        total_wins = total_wins_result.get('total', 0) if total_wins_result else 0

        sql = "SELECT COALESCE(SUM(reward_coins), 0) as total FROM tb_saiche_model_race_records"
        total_coins_result = self.race_record_model.db.fetch_one(sql)
        total_coins = total_coins_result.get('total', 0) if total_coins_result else 0

        today_sql = "SELECT COUNT(*) as total FROM tb_saiche_model_race_records WHERE DATE(created_at) = DATE('now')"
        today_races_result = self.race_record_model.db.fetch_one(today_sql)
        today_races = today_races_result.get('total', 0) if today_races_result else 0

        recent_races = self.race_record_model.query.find_all(
            order_by='created_at DESC',
            limit=10
        )
        recent_races_list = []
        for race in recent_races:
            user = self.user_model.get_by_id(race.get('user_id'))
            track = self.track_model.get_by_id(race.get('track_id'))
            recent_races_list.append({
                'id': race.get('id'),
                'nickname': user.get('nickname') if user else '未知',
                'track_name': track.get('name') if track else '未知',
                'finish_time': race.get('finish_time'),
                'is_winner': race.get('is_winner'),
                'reward_coins': race.get('reward_coins'),
                'created_at': race.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'total_races': total_races,
                'total_cars': total_cars,
                'total_tracks': total_tracks,
                'total_wins': total_wins,
                'total_coins': total_coins,
                'today_races': today_races,
                'recent_races': recent_races_list
            }
        }

    def get_user_list(self, page: int = 1, page_size: int = 10,
                      status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.user_model.get_all(page, page_size, status, keyword)
        items = []
        for item in result.get('items', []):
            user_dict = self.user_model.to_public_dict(item)
            stats = self.race_record_model.get_user_stats(item.get('id'))
            user_dict.update({
                'total_races': stats.get('total_races', 0),
                'win_count': stats.get('win_count', 0),
                'total_coins_earned': stats.get('total_coins', 0)
            })
            items.append(user_dict)

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

    def ban_user(self, user_id: int) -> Dict[str, Any]:
        return self.update_user_status(user_id, self.user_model.STATUS_BANNED)

    def unban_user(self, user_id: int) -> Dict[str, Any]:
        return self.update_user_status(user_id, self.user_model.STATUS_ACTIVE)

    def update_user_status(self, user_id: int, status: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        affected = self.user_model.update_status(user_id, status)
        if affected > 0:
            return {
                'code': 0,
                'msg': '操作成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }
