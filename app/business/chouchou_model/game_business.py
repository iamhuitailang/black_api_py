from typing import Dict, Any, List, Optional
from app.model.chouchou_model import (
    GameModel, PlayerModel, CommandModel, ActionModel, ScoreModel,
    UserModel, HighScoreModel
)
import random
import string
import time


class GameBusiness:
    def __init__(self):
        self.game_model = GameModel()
        self.player_model = PlayerModel()
        self.command_model = CommandModel()
        self.action_model = ActionModel()
        self.score_model = ScoreModel()
        self.user_model = UserModel()
        self.high_score_model = HighScoreModel()
        self._cooldowns = {}

    def _generate_room_code(self) -> str:
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    def _get_ai_names(self) -> List[str]:
        return [
            'AI小丑王', 'AI魔术师', 'AI驯兽师', 'AI杂技演员',
            'AI魔术师', 'AI驯兽师', 'AI小丑王', 'AI杂技演员'
        ]

    def create_game(self, host_id: int, name: str = '', theme: str = 'carnival',
                   max_players: int = 8, min_players: int = 3, total_rounds: int = 5,
                   add_ai: bool = True) -> Dict[str, Any]:
        room_code = self._generate_room_code()

        existing = self.game_model.get_by_room_code(room_code)
        while existing:
            room_code = self._generate_room_code()
            existing = self.game_model.get_by_room_code(room_code)

        host = self.user_model.get_by_id(host_id)
        if not host:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        game_id = self.game_model.create(
            host_id=host_id,
            room_code=room_code,
            name=name,
            theme=theme,
            max_players=max_players,
            min_players=min_players,
            total_rounds=total_rounds,
            settings={'add_ai': add_ai}
        )

        if game_id <= 0:
            return {
                'code': 1,
                'msg': '创建游戏失败',
                'data': None
            }

        self.player_model.create(
            game_id=game_id,
            user_id=host_id,
            nickname=host.get('nickname', f'玩家{host_id}'),
            avatar=host.get('avatar', ''),
            is_ai=False
        )

        if add_ai:
            ai_count = min(3, max_players - 1)
            ai_names = self._get_ai_names()
            for i in range(ai_count):
                self.player_model.create(
                    game_id=game_id,
                    user_id=-(i + 10000),
                    nickname=ai_names[i],
                    avatar='',
                    is_ai=True
                )

        game = self.game_model.get_by_id(game_id)
        players = self.player_model.get_by_game(game_id)

        return {
            'code': 0,
            'msg': '创建成功',
            'data': {
                'game': self.game_model.to_dict(game),
                'players': [self.player_model.to_dict(p) for p in players]
            }
        }

    def join_game(self, user_id: int, room_code: str) -> Dict[str, Any]:
        game = self.game_model.get_by_room_code(room_code)
        if not game:
            return {
                'code': 1,
                'msg': '房间不存在',
                'data': None
            }

        if game.get('status') != GameModel.STATUS_WAITING:
            return {
                'code': 1,
                'msg': '游戏已开始，无法加入',
                'data': None
            }

        existing_player = self.player_model.get_by_game_and_user(game.get('id'), user_id)
        if existing_player:
            players = self.player_model.get_by_game(game.get('id'))
            return {
                'code': 0,
                'msg': '已在房间中',
                'data': {
                    'game': self.game_model.to_dict(game),
                    'players': [self.player_model.to_dict(p) for p in players]
                }
            }

        players = self.player_model.get_by_game(game.get('id'))
        active_count = len([p for p in players if p.get('is_ai', 0) == 0])
        max_players = game.get('max_players', 8)

        if len(players) >= max_players:
            return {
                'code': 1,
                'msg': '房间已满',
                'data': None
            }

        ai_players = [p for p in players if p.get('is_ai', 0) == 1]
        if ai_players and active_count + 1 > max_players - 1:
            self.player_model.delete(ai_players[-1]['id'])

        user = self.user_model.get_by_id(user_id)
        self.player_model.create(
            game_id=game.get('id'),
            user_id=user_id,
            nickname=user.get('nickname', f'玩家{user_id}'),
            avatar=user.get('avatar', ''),
            is_ai=False
        )

        game = self.game_model.get_by_id(game.get('id'))
        players = self.player_model.get_by_game(game.get('id'))

        return {
            'code': 0,
            'msg': '加入成功',
            'data': {
                'game': self.game_model.to_dict(game),
                'players': [self.player_model.to_dict(p) for p in players]
            }
        }

    def start_game(self, game_id: int, user_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        if game.get('host_id') != user_id:
            return {
                'code': 1,
                'msg': '只有房主可以开始游戏',
                'data': None
            }

        players = self.player_model.get_by_game(game_id)
        active_players = [p for p in players if p.get('status') == PlayerModel.STATUS_ACTIVE]

        if len(active_players) < game.get('min_players', 3):
            return {
                'code': 1,
                'msg': f'至少需要{game.get("min_players", 3)}名玩家才能开始',
                'data': None
            }

        self.game_model.update_status(game_id, GameModel.STATUS_PLAYING)
        self.game_model.update_round(game_id, 1)

        players_with_roles = self.player_model.assign_roles(game_id)

        game = self.game_model.get_by_id(game_id)

        king = self.player_model.get_king(game_id)
        if king and king.get('is_ai', 0) == 1:
            self._auto_publish_ai_king_command(game_id, king)

        game = self.game_model.get_by_id(game_id)
        players_with_roles = self.player_model.get_by_game(game_id)
        current_command = self.command_model.get_current_command(game_id)

        return {
            'code': 0,
            'msg': '游戏开始',
            'data': {
                'game': self.game_model.to_dict(game),
                'players': [self.player_model.to_dict(p) for p in players_with_roles],
                'current_command': self.command_model.to_dict(current_command) if current_command else None
            }
        }

    def get_game_info(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        players = self.player_model.get_by_game(game_id)
        current_command = self.command_model.get_current_command(game_id)
        rankings = self.score_model.get_game_rankings(game_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'game': self.game_model.to_dict(game),
                'players': [self.player_model.to_dict(p) for p in players],
                'current_command': self.command_model.to_dict(current_command) if current_command else None,
                'rankings': rankings
            }
        }

    def publish_command(self, game_id: int, king_id: int, command_type: str,
                      custom_content: str = '', duration: int = None) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        if game.get('status') != GameModel.STATUS_PLAYING:
            return {
                'code': 1,
                'msg': '游戏未开始',
                'data': None
            }

        king = self.player_model.get_king(game_id)
        if not king or king.get('user_id') != king_id:
            return {
                'code': 1,
                'msg': '只有国王可以发布指令',
                'data': None
            }

        existing_command = self.command_model.get_current_command(game_id)
        if existing_command and existing_command.get('status') == CommandModel.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '当前已有正在执行',
                'data': None
            }

        base_commands = self.command_model.get_base_commands()
        special_commands = self.command_model.get_special_commands()
        all_commands = base_commands + special_commands

        selected_command = None
        for cmd in all_commands:
            if cmd.get('type') == command_type:
                selected_command = cmd
                break

        if not selected_command:
            return {
                'code': 1,
                'msg': '无效的指令类型',
                'data': None
            }

        if selected_command.get('type') == CommandModel.TYPE_SPECIAL:
            trigger_condition = selected_command.get('trigger_condition')
            if trigger_condition == 'king_full_score':
                if king.get('score', 0) < 50:
                    return {
                        'code': 1,
                        'msg': '国王积分不足，无法使用该技能',
                        'data': None
                    }
            elif trigger_condition == 'clown_hidden':
                clowns = [p for p in self.player_model.get_active_players(game_id) if p.get('role') == PlayerModel.ROLE_CLOWN]
                if not clowns:
                    return {
                        'code': 1,
                        'msg': '没有小丑可以使用该技能',
                        'data': None
                    }
            elif trigger_condition == 'civilian_group':
                civilians = [p for p in self.player_model.get_active_players(game_id) if p.get('role') == PlayerModel.ROLE_CIVILIAN]
                if len(civilians) < 3:
                    return {
                        'code': 1,
                        'msg': '平民人数不足，无法使用该技能',
                        'data': None
                    }

            cooldown_key = f"{game_id}_{command_type}"
            if cooldown_key in self._cooldowns:
                last_used_round = self._cooldowns[cooldown_key]
                if game.get('current_round', 0) - last_used_round < selected_command.get('cooldown', 1):
                    return {
                        'code': 1,
                        'msg': '技能冷却中',
                        'data': None
                    }

            self._cooldowns[cooldown_key] = game.get('current_round', 0)

        command_duration = duration if duration is not None else selected_command.get('duration', 3)
        command_id = self.command_model.create(
            game_id=game_id,
            round_num=game.get('current_round', 1),
            king_id=king.get('id'),
            command_type=selected_command.get('type'),
            name=selected_command.get('name'),
            content=custom_content if custom_content else selected_command.get('content'),
            duration=command_duration,
            penalty=selected_command.get('penalty', 5),
            custom_content=custom_content,
            is_special=selected_command.get('type') == CommandModel.TYPE_SPECIAL,
            trigger_player_id=king.get('id')
        )

        self.command_model.start_command(command_id)

        command = self.command_model.get_by_id(command_id)

        active_players = self.player_model.get_active_players(game_id)
        for player in active_players:
            if player.get('is_ai', 0) == 1:
                self._simulate_ai_action(game_id, command_id, player)

        return {
            'code': 0,
            'msg': '指令发布成功',
            'data': {
                'command': self.command_model.to_dict(command),
                'duration': command_duration
            }
        }

    def _simulate_ai_action(self, game_id: int, command_id: int, player: Dict[str, Any]):
        time.sleep(random.uniform(0.5, 1.5))
        role = player.get('role')
        if role == PlayerModel.ROLE_CIVILIAN:
            action = random.choice([ActionModel.ACTION_OBEY, ActionModel.ACTION_OBEY, ActionModel.ACTION_REFUSE])
        elif role == PlayerModel.ROLE_CLOWN:
            action = random.choice([ActionModel.ACTION_SABOTAGE, ActionModel.ACTION_OBEY, ActionModel.ACTION_REFUSE])
        else:
            action = ActionModel.ACTION_OBEY

        self.submit_action(game_id, command_id, player.get('id'), action, player.get('user_id'))

    def _auto_publish_ai_king_command(self, game_id: int, king: Dict[str, Any]):
        base_commands = self.command_model.get_base_commands()
        selected = random.choice(base_commands)
        game = self.game_model.get_by_id(game_id)
        if not game:
            return
        command_id = self.command_model.create(
            game_id=game_id,
            round_num=game.get('current_round', 1),
            king_id=king.get('id'),
            command_type=selected.get('type'),
            name=selected.get('name'),
            content=selected.get('content'),
            duration=selected.get('duration', 3),
            penalty=selected.get('penalty', 5),
            custom_content='',
            is_special=False,
            trigger_player_id=king.get('id')
        )
        self.command_model.start_command(command_id)
        active_players = self.player_model.get_active_players(game_id)
        for player in active_players:
            if player.get('is_ai', 0) == 1 and player.get('id') != king.get('id'):
                self._simulate_ai_action(game_id, command_id, player)

    def submit_action(self, game_id: int, command_id: int, player_id: int,
                       action: str, user_id: int = None) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        command = self.command_model.get_by_id(command_id)
        if not command:
            return {
                'code': 1,
                'msg': '指令不存在',
                'data': None
            }

        if command.get('status') != CommandModel.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '指令已结束',
                'data': None
            }

        player = self.player_model.get_by_id(player_id)
        if not player:
            return {
                'code': 1,
                'msg': '玩家不存在',
                'data': None
            }

        if user_id is not None and player.get('user_id') != user_id and player.get('is_ai', 0) == 0:
            return {
                'code': 1,
                'msg': '只能提交自己的选择',
                'data': None
            }

        if player.get('status') != PlayerModel.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '已被淘汰，无法参与',
                'data': None
            }

        if self.action_model.has_responded(command_id, player_id):
            return {
                'code': 1,
                'msg': '已经提交过选择',
                'data': None
            }

        action_id = self.action_model.create(
            game_id=game_id,
            command_id=command_id,
            player_id=player_id,
            action=action
        )

        players = self.player_model.get_active_players(game_id)
        king = self.player_model.get_king(game_id)
        responding_players = [p for p in players if p.get('id') != king.get('id')] if king else players
        responded_count = self.action_model.count_responded(command_id)

        if responded_count >= len(responding_players):
            self.resolve_command(game_id, command_id)
            self.next_round(game_id, game.get('host_id'))

        return {
            'code': 0,
            'msg': '提交成功',
            'data': {
                'action_id': action_id,
                'action': action
            }
        }

    def resolve_command(self, game_id: int, command_id: int) -> Dict[str, Any]:
        command = self.command_model.get_by_id(command_id)
        if not command:
            return {
                'code': 1,
                'msg': '指令不存在',
                'data': None
            }

        if command.get('status') == CommandModel.STATUS_COMPLETED:
            return {
                'code': 1,
                'msg': '指令已结算',
                'data': None
            }

        self.command_model.complete_command(command_id)

        actions = self.action_model.get_by_command(command_id)
        players = self.player_model.get_active_players(game_id)
        king = self.player_model.get_king(game_id)

        results = []
        penalties = []
        bonus_scores = {}

        for player in players:
            if player.get('is_ai', 0) == 1:
                continue

            player_action = None
            for a in actions:
                if a.get('player_id') == player.get('id'):
                    player_action = a
                    break

            if not player_action:
                action_type = ActionModel.ACTION_REFUSE

            else:
                action_type = player_action.get('action')

            role = player.get('role')
            score_change = 0
            is_punished = False
            punishment_reason = ''
            result = ActionModel.RESULT_SUCCESS

            if action_type == ActionModel.ACTION_OBEY:
                if role == PlayerModel.ROLE_CIVILIAN:
                    score_change = 10
                elif role == PlayerModel.ROLE_CLOWN:
                    score_change = 5
                else:
                    score_change = 3
            elif action_type == ActionModel.ACTION_REFUSE:
                score_change = -command.get('penalty', 5)
                is_punished = True
                punishment_reason = '拒绝执行指令'
                result = ActionModel.RESULT_FAILED
            elif action_type == ActionModel.ACTION_SABOTAGE:
                if role == PlayerModel.ROLE_CLOWN:
                    score_change = 15
                    if king:
                        king_score = max(0, king.get('score', 0) - 5)
                        self.player_model.update_score(king.get('id'), -5)
                else:
                    score_change = -command.get('penalty', 5) * 2
                    is_punished = True
                    punishment_reason = '非小丑身份捣乱'
                    result = ActionModel.RESULT_FAILED

            current_score = player.get('score', 0) + score_change
            self.player_model.update_score(player.get('id'), score_change)

            self.score_model.create(
                game_id=game_id,
                player_id=player.get('id'),
                score_type=ScoreModel.TYPE_COMMAND if score_change >= 0 else ScoreModel.TYPE_PUNISHMENT,
                score_change=score_change,
                balance_after=current_score,
                round_num=command.get('round'),
                reason=punishment_reason if is_punished else '指令执行',
                related_id=command_id
            )

            if player_action:
                self.action_model.update_result(
                    player_action.get('id'),
                    result=result,
                    score_change=score_change,
                    is_punished=is_punished,
                    punishment_reason=punishment_reason
                )

            results.append({
                'player_id': player.get('id'),
                'nickname': player.get('nickname'),
                'role': player.get('role'),
                'role_text': self.player_model.get_role_text(player.get('role')),
                'action': action_type,
                'action_text': self.action_model.get_action_text(action_type),
                'score_change': score_change,
                'is_punished': is_punished,
                'result': result
            })

        civilians = [p for p in players if p.get('role') == PlayerModel.ROLE_CIVILIAN and p.get('status') == PlayerModel.STATUS_ACTIVE]
        if len(civilians) >= 3:
            bonus = 5
            for civilian in civilians:
                current_balance = civilian.get('score', 0) + bonus
                self.player_model.update_score(civilian.get('id'), bonus)
                self.score_model.create(
                    game_id=game_id,
                    player_id=civilian.get('id'),
                    score_type=ScoreModel.TYPE_BONUS,
                    score_change=bonus,
                    balance_after=current_balance,
                    round_num=command.get('round'),
                    reason='平民阵营加成',
                    related_id=command_id
                )
                bonus_scores[civilian.get('id')] = bonus

        eliminated = []
        for player in players:
            if player.get('is_ai', 0) == 1:
                continue
            if player.get('score', 0) <= 0 and player.get('status') == PlayerModel.STATUS_ACTIVE:
                self.player_model.eliminate_player(player.get('id'))
                eliminated.append({
                    'player_id': player.get('id'),
                    'nickname': player.get('nickname')
                })

        game = self.game_model.get_by_id(game_id)
        active_players = [p for p in self.player_model.get_active_players(game_id) if p.get('is_ai', 0) == 0]

        if len(active_players) <= 1:
            winner = None
            if len(active_players) == 1:
                winner = active_players[0]
                self.player_model.set_winner(winner.get('id'))
                self.game_model.set_winner(game_id, winner.get('user_id'))

                self.user_model.update_score(winner.get('user_id'), winner.get('score', 0), won=True)

                self.high_score_model.check_and_update_high_score(
                    winner.get('user_id'),
                    HighScoreModel.TYPE_SINGLE_GAME,
                    winner.get('score', 0),
                    game_id=game_id
                )
            else:
                self.game_model.update_status(game_id, GameModel.STATUS_FINISHED)

            return {
                'code': 0,
                'msg': '游戏结束',
                'data': {
                    'results': results,
                    'eliminated': eliminated,
                    'bonus_scores': bonus_scores,
                    'game_over': True,
                    'winner': {
                        'player_id': winner.get('id') if winner else None,
                        'nickname': winner.get('nickname') if winner else None,
                        'score': winner.get('score') if winner else 0
                    }
                }
            }

        return {
            'code': 0,
            'msg': '结算完成',
            'data': {
                'results': results,
                'eliminated': eliminated,
                'bonus_scores': bonus_scores,
                'game_over': False
            }
        }

    def next_round(self, game_id: int, user_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        if game.get('host_id') != user_id:
            return {
                'code': 1,
                'msg': '只有房主可以操作',
                'data': None
            }

        if game.get('status') != GameModel.STATUS_PLAYING:
            return {
                'code': 1,
                'msg': '游戏未进行中',
                'data': None
            }

        current_round = game.get('current_round', 0)
        total_rounds = game.get('total_rounds', 5)

        if current_round >= total_rounds:
            players = self.player_model.get_active_players(game_id)
            human_players = [p for p in players if p.get('is_ai', 0) == 0]

            if human_players:
                winner = max(human_players, key=lambda p: p.get('score', 0))
                self.player_model.set_winner(winner.get('id'))
                self.game_model.set_winner(game_id, winner.get('user_id'))

                self.user_model.update_score(winner.get('user_id'), winner.get('score', 0), won=True)

                self.high_score_model.check_and_update_high_score(
                    winner.get('user_id'),
                    HighScoreModel.TYPE_SINGLE_GAME,
                    winner.get('score', 0),
                    game_id=game_id
                )

            rankings = self.score_model.get_game_rankings(game_id)

            return {
                'code': 0,
                'msg': '游戏结束',
                'data': {
                    'game_over': True,
                    'winner': {
                        'player_id': winner.get('id') if human_players else None,
                        'nickname': winner.get('nickname') if human_players else None,
                        'score': winner.get('score') if human_players else 0
                    },
                    'rankings': rankings
                }
            }

        next_round = current_round + 1
        self.game_model.update_round(game_id, next_round)

        players = self.player_model.get_active_players(game_id)
        players_with_roles = self.player_model.assign_roles(game_id)

        game = self.game_model.get_by_id(game_id)

        king = self.player_model.get_king(game_id)
        if king and king.get('is_ai', 0) == 1:
            self._auto_publish_ai_king_command(game_id, king)

        game = self.game_model.get_by_id(game_id)
        players_with_roles = self.player_model.get_by_game(game_id)
        current_command = self.command_model.get_current_command(game_id)

        return {
            'code': 0,
            'msg': '进入下一轮',
            'data': {
                'game': self.game_model.to_dict(game),
                'players': [self.player_model.to_dict(p) for p in players_with_roles],
                'current_command': self.command_model.to_dict(current_command) if current_command else None
            }
        }

    def change_theme(self, game_id: int, theme: str) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        valid_themes = [GameModel.THEME_CARNIVAL, GameModel.THEME_VINTAGE, GameModel.THEME_DARK]
        if theme not in valid_themes:
            return {
                'code': 1,
                'msg': '无效的主题',
                'data': None
            }

        self.game_model.update_theme(game_id, theme)
        game = self.game_model.get_by_id(game_id)

        return {
            'code': 0,
            'msg': '主题切换成功',
            'data': {
                'game': self.game_model.to_dict(game)
            }
        }

    def get_available_commands(self) -> Dict[str, Any]:
        base = self.command_model.get_base_commands()
        special = self.command_model.get_special_commands()

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'base_commands': base,
                'special_commands': special
            }
        }

    def leave_game(self, game_id: int, user_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        player = self.player_model.get_by_game_and_user(game_id, user_id)
        if not player:
            return {
                'code': 1,
                'msg': '不在游戏中',
                'data': None
            }

        if game.get('status') == GameModel.STATUS_PLAYING:
            return {
                'code': 1,
                'msg': '游戏进行中，无法离开',
                'data': None
            }

        self.player_model.delete(player.get('id'))

        players = self.player_model.get_by_game(game_id)
        if not players or len(players) == 0 or all(p.get('is_ai', 0) == 1 for p in players):
            self.game_model.update_status(game_id, GameModel.STATUS_CANCELLED)

        return {
            'code': 0,
            'msg': '离开成功',
            'data': None
        }

    def get_user_games(self, user_id: int, limit: int = 10) -> Dict[str, Any]:
        games = self.game_model.get_user_games(user_id, limit)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.game_model.to_dict(g) for g in games]
        }

    def get_active_games(self, limit: int = 10) -> Dict[str, Any]:
        games = self.game_model.get_active_games(limit)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.game_model.to_dict(g) for g in games]
        }
