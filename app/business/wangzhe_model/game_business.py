from typing import Dict, Any, Optional, List
from app.model.wangzhe_model import (
    GameModel, GamePlayerModel, UserModel, UserHeroModel, 
    HeroModel, AchievementModel, UserAchievementModel, RankingModel
)
import uuid
import random


class WangzheGameBusiness:
    def __init__(self):
        self.game_model = GameModel()
        self.game_player_model = GamePlayerModel()
        self.user_model = UserModel()
        self.user_hero_model = UserHeroModel()
        self.hero_model = HeroModel()
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()
        self.ranking_model = RankingModel()

    def create_room(self, user_id: int, mode: str = '5v5') -> Dict[str, Any]:
        room_id = f"room_{uuid.uuid4().hex[:8]}"
        
        game_id = self.game_model.create(room_id, mode)
        if game_id <= 0:
            return {
                'code': 1,
                'msg': '创建房间失败',
                'data': None
            }

        team = 'blue'
        self.game_player_model.create(game_id, user_id, team)

        return {
            'code': 0,
            'msg': '创建房间成功',
            'data': {
                'game_id': game_id,
                'room_id': room_id,
                'mode': mode
            }
        }

    def join_room(self, user_id: int, room_id: str) -> Dict[str, Any]:
        game = self.game_model.get_by_room_id(room_id)
        if not game:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        if game.get('status') != 'waiting':
            return {
                'code': 1,
                'msg': '游戏已开始或已结束',
                'data': None
            }

        existing_player = self.game_player_model.get_by_game_and_user(game.get('id'), user_id)
        if existing_player:
            return {
                'code': 1,
                'msg': '您已经在房间中',
                'data': None
            }

        players = self.game_player_model.get_by_game_id(game.get('id'))
        blue_count = len([p for p in players if p.get('team') == 'blue'])
        red_count = len([p for p in players if p.get('team') == 'red'])

        team = 'blue' if blue_count <= red_count else 'red'

        self.game_player_model.create(game.get('id'), user_id, team)

        return {
            'code': 0,
            'msg': '加入房间成功',
            'data': {
                'game_id': game.get('id'),
                'room_id': room_id,
                'team': team
            }
        }

    def select_hero(self, game_id: int, user_id: int, hero_id: int) -> Dict[str, Any]:
        player = self.game_player_model.get_by_game_and_user(game_id, user_id)
        if not player:
            return {
                'code': 1,
                'msg': '您不在游戏中',
                'data': None
            }

        hero = self.hero_model.get_by_id(hero_id)
        if not hero or hero.get('status') != 0:
            return {
                'code': 1,
                'msg': '英雄不存在',
                'data': None
            }

        if not self.user_hero_model.owns_hero(user_id, hero_id) and hero.get('price') > 0:
            return {
                'code': 1,
                'msg': '您还没有该英雄',
                'data': None
            }

        game = self.game_model.get_by_id(game_id)
        if game and game.get('status') != 'waiting':
            return {
                'code': 1,
                'msg': '游戏已开始，无法更换英雄',
                'data': None
            }

        affected = self.game_player_model.select_hero(player.get('id'), hero_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '选择英雄成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '选择英雄失败',
            'data': None
        }

    def start_game(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        if game.get('status') != 'waiting':
            return {
                'code': 1,
                'msg': '游戏状态不正确',
                'data': None
            }

        players = self.game_player_model.get_by_game_id(game_id)
        if len(players) < 2:
            return {
                'code': 1,
                'msg': '至少需要2名玩家才能开始游戏',
                'data': None
            }

        for player in players:
            if not player.get('hero_id'):
                return {
                    'code': 1,
                    'msg': '所有玩家都需要选择英雄',
                    'data': None
                }

        affected = self.game_model.start_game(game_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '游戏开始',
                'data': {
                    'game_id': game_id,
                    'status': 'playing'
                }
            }

        return {
            'code': 1,
            'msg': '开始游戏失败',
            'data': None
        }

    def _simulate_battle(self, game_id: int) -> Dict[str, Any]:
        players = self.game_player_model.get_by_game_id(game_id)
        blue_players = [p for p in players if p.get('team') == 'blue']
        red_players = [p for p in players if p.get('team') == 'red']

        blue_power = 0
        red_power = 0

        for player in blue_players:
            hero = self.hero_model.get_by_id(player.get('hero_id'))
            if hero:
                power = hero.get('attack', 100) + hero.get('defense', 50) + random.randint(-50, 50)
                blue_power += power
                kills = random.randint(0, 10)
                deaths = random.randint(0, 8)
                assists = random.randint(0, 12)
                self.game_player_model.update_stats(
                    player.get('id'), kills=kills, deaths=deaths, assists=assists,
                    gold=random.randint(5000, 15000),
                    damage_dealt=random.randint(10000, 50000),
                    damage_taken=random.randint(5000, 30000),
                    healing_done=random.randint(0, 15000)
                )

        for player in red_players:
            hero = self.hero_model.get_by_id(player.get('hero_id'))
            if hero:
                power = hero.get('attack', 100) + hero.get('defense', 50) + random.randint(-50, 50)
                red_power += power
                kills = random.randint(0, 10)
                deaths = random.randint(0, 8)
                assists = random.randint(0, 12)
                self.game_player_model.update_stats(
                    player.get('id'), kills=kills, deaths=deaths, assists=assists,
                    gold=random.randint(5000, 15000),
                    damage_dealt=random.randint(10000, 50000),
                    damage_taken=random.randint(5000, 30000),
                    healing_done=random.randint(0, 15000)
                )

        blue_win = blue_power >= red_power
        result = 'win' if blue_win else 'lose'
        blue_score = random.randint(10, 30) if blue_win else random.randint(5, 20)
        red_score = random.randint(5, 20) if blue_win else random.randint(10, 30)
        duration = random.randint(600, 1800)

        all_players = self.game_player_model.get_by_game_id(game_id)
        mvp_player = max(all_players, key=lambda p: p.get('kills', 0) * 3 + p.get('assists', 0) * 2 - p.get('deaths', 0))
        mvp_user_id = mvp_player.get('user_id')
        self.game_player_model.set_mvp(mvp_player.get('id'))

        self.game_model.end_game(game_id, result, blue_score, red_score, duration, mvp_user_id)

        for player in all_players:
            user_id = player.get('user_id')
            hero_id = player.get('hero_id')
            win = (player.get('team') == 'blue' and blue_win) or (player.get('team') == 'red' and not blue_win)
            points_delta = 15 if win else -10

            self.user_model.update_game_stats(
                user_id, win, player.get('kills', 0), 
                player.get('deaths', 0), player.get('assists', 0), points_delta
            )

            self.user_hero_model.update_stats(
                user_id, hero_id, win, player.get('kills', 0),
                player.get('deaths', 0), player.get('assists', 0),
                mastery_points=random.randint(10, 50)
            )

            self.ranking_model.update_rank(user_id, win, points_delta)

            gold_reward = 100 if win else 50
            exp_reward = 50 if win else 25
            self.user_model.update_gold(user_id, gold_reward)
            self.user_model.add_experience(user_id, exp_reward)

            self._check_game_achievements(user_id, player, win)

        return {
            'blue_win': blue_win,
            'blue_score': blue_score,
            'red_score': red_score,
            'duration': duration,
            'mvp_user_id': mvp_user_id
        }

    def _check_game_achievements(self, user_id: int, player: Dict[str, Any], win: bool):
        achievements = self.achievement_model.get_all(page=1, page_size=100).get('items', [])
        
        for achievement in achievements:
            ach_type = achievement.get('type')
            target = achievement.get('target_value', 0)
            
            if ach_type == 'game':
                self.user_achievement_model.update_progress(user_id, achievement.get('id'), 1, target)
            elif ach_type == 'win' and win:
                self.user_achievement_model.update_progress(user_id, achievement.get('id'), 1, target)
            elif ach_type == 'kill' and player.get('kills', 0) >= target:
                self.user_achievement_model.update_progress(
                    user_id, achievement.get('id'), player.get('kills', 0), target
                )
            elif ach_type == 'special' and player.get('is_mvp'):
                self.user_achievement_model.update_progress(user_id, achievement.get('id'), 1, target)

    def end_game(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        if game.get('status') == 'finished':
            return {
                'code': 0,
                'msg': '游戏已结束',
                'data': self.get_game_result(game_id).get('data')
            }

        if game.get('status') != 'playing':
            return {
                'code': 1,
                'msg': '游戏状态不正确',
                'data': None
            }

        battle_result = self._simulate_battle(game_id)

        return {
            'code': 0,
            'msg': '游戏结束',
            'data': self.get_game_result(game_id).get('data')
        }

    def get_game_result(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        if game.get('status') != 'finished':
            return {
                'code': 1,
                'msg': '游戏尚未结束',
                'data': None
            }

        players = self.game_player_model.get_by_game_id(game_id)
        blue_players = []
        red_players = []

        for player in players:
            player_dict = self.game_player_model.to_public_dict(player)
            user = self.user_model.get_by_id(player.get('user_id'))
            hero = self.hero_model.get_by_id(player.get('hero_id'))
            
            if user:
                player_dict['user'] = {
                    'id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar')
                }
            if hero:
                player_dict['hero'] = {
                    'id': hero.get('id'),
                    'name': hero.get('name'),
                    'avatar': hero.get('avatar')
                }

            if player.get('team') == 'blue':
                blue_players.append(player_dict)
            else:
                red_players.append(player_dict)

        result = {
            'game': self.game_model.to_public_dict(game),
            'blue_team': blue_players,
            'red_team': red_players
        }

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_user_game_history(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.game_model.get_user_games(user_id, page, page_size)
        items = []

        for item in result.get('items', []):
            game = {
                'game_id': item.get('id'),
                'room_id': item.get('room_id'),
                'mode': item.get('mode'),
                'result': item.get('result'),
                'duration': item.get('duration'),
                'blue_team_score': item.get('blue_team_score'),
                'red_team_score': item.get('red_team_score'),
                'team': item.get('team'),
                'hero_id': item.get('hero_id'),
                'kills': item.get('kills'),
                'deaths': item.get('deaths'),
                'assists': item.get('assists'),
                'gold_earned': item.get('gold_earned'),
                'ended_at': item.get('ended_at'),
                'is_win': (item.get('team') == 'blue' and item.get('result') == 'win') or
                          (item.get('team') == 'red' and item.get('result') == 'lose')
            }
            hero = self.hero_model.get_by_id(item.get('hero_id'))
            if hero:
                game['hero_name'] = hero.get('name')
            items.append(game)

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

    def get_game_list(self, page: int = 1, page_size: int = 20, status: str = None,
                      mode: str = None) -> Dict[str, Any]:
        result = self.game_model.get_all(page, page_size, status, mode)
        items = [self.game_model.to_public_dict(item) for item in result.get('items', [])]

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

    def quick_start_game(self, user_id: int, hero_id: int, mode: str = '1v1',
                          game_type: str = 'casual') -> Dict[str, Any]:
        hero = self.hero_model.get_by_id(hero_id)
        if not hero or hero.get('status') != 0:
            return {
                'code': 1,
                'msg': '英雄不存在',
                'data': None
            }

        room_id = f"room_{uuid.uuid4().hex[:8]}"
        game_id = self.game_model.create(room_id, mode)
        if game_id <= 0:
            return {
                'code': 1,
                'msg': '创建游戏失败',
                'data': None
            }

        player_id = self.game_player_model.create(game_id, user_id, 'blue')
        self.game_player_model.select_hero(player_id, hero_id)

        all_heroes = self.hero_model.get_all(page=1, page_size=100).get('items', [])
        available_heroes = [h for h in all_heroes if h.get('id') != hero_id and h.get('status') == 0]

        if mode == '1v1':
            enemy_count = 1
        elif mode == '3v3':
            enemy_count = 3
        else:
            enemy_count = 5

        for i in range(enemy_count):
            ai_user_id = 10000 + i
            ai_hero = random.choice(available_heroes) if available_heroes else hero
            ai_player_id = self.game_player_model.create(game_id, ai_user_id, 'red')
            self.game_player_model.select_hero(ai_player_id, ai_hero.get('id'))

        self.game_model.start_game(game_id)
        battle_result = self._simulate_battle(game_id)

        player = self.game_player_model.get_by_game_and_user(game_id, user_id)
        is_win = False
        if player:
            is_win = (player.get('team') == 'blue' and battle_result.get('blue_win')) or \
                     (player.get('team') == 'red' and not battle_result.get('blue_win'))

        return {
            'code': 0,
            'msg': '游戏结束',
            'data': {
                'game_id': game_id,
                'is_win': is_win,
                'blue_win': battle_result.get('blue_win'),
                'blue_score': battle_result.get('blue_score'),
                'red_score': battle_result.get('red_score'),
                'duration': battle_result.get('duration'),
                'player_stats': self.game_player_model.to_public_dict(player) if player else None
            }
        }

    def get_game_statistics(self) -> Dict[str, Any]:
        stats = self.game_model.get_game_statistics()
        
        user_sql = "SELECT COUNT(*) as total_users FROM tb_wangzhe_model_users WHERE status = 0"
        total_users = self.game_model.db.fetch_one(user_sql) or {}
        
        hero_sql = "SELECT COUNT(*) as total_heroes FROM tb_wangzhe_model_heroes WHERE status = 0"
        total_heroes = self.game_model.db.fetch_one(hero_sql) or {}
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_games': stats.get('total_games', 0),
                'finished_games': stats.get('finished_games', 0),
                'avg_duration': round(stats.get('avg_duration', 0) or 0, 0),
                'mode_5v5_count': stats.get('mode_5v5_count', 0),
                'mode_3v3_count': stats.get('mode_3v3_count', 0),
                'mode_1v1_count': stats.get('mode_1v1_count', 0),
                'total_users': total_users.get('total_users', 0),
                'total_heroes': total_heroes.get('total_heroes', 0)
            }
        }
