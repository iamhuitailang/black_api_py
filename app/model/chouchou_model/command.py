from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class CommandModel:
    TABLE_NAME = 'tb_chouchou_model_commands'

    TYPE_FUN = 'fun'
    TYPE_POSITION = 'position'
    TYPE_SPEECH = 'speech'
    TYPE_PERFORMANCE = 'performance'
    TYPE_SPECIAL = 'special'

    STATUS_PENDING = 'pending'
    STATUS_ACTIVE = 'active'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'

    BASE_COMMANDS = [
        {
            'type': TYPE_FUN,
            'name': '趣味互动',
            'content': '模仿马戏动物动作',
            'duration': 3,
            'penalty': 5,
            'description': '全体玩家模仿指定马戏动物的动作，如大象、狮子、猴子等'
        },
        {
            'type': TYPE_POSITION,
            'name': '位置互动',
            'content': '赛场指定站位集结',
            'duration': 2,
            'penalty': 4,
            'description': '在指定时间内移动到指定位置集结'
        },
        {
            'type': TYPE_SPEECH,
            'name': '言语互动',
            'content': '说出马戏趣味台词',
            'duration': 2,
            'penalty': 3,
            'description': '大声说出指定的马戏经典台词'
        },
        {
            'type': TYPE_PERFORMANCE,
            'name': '整活互动',
            'content': '即兴马戏小表演',
            'duration': 5,
            'penalty': 7,
            'description': '即兴表演一个马戏小节目，如杂耍、小丑动作等'
        }
    ]

    SPECIAL_COMMANDS = [
        {
            'type': TYPE_SPECIAL,
            'name': '全员马戏巡游',
            'content': '全体统一移动站位',
            'duration': 5,
            'penalty': 10,
            'trigger_condition': 'king_full_score',
            'cooldown': 1,
            'description': '国王满积分时可触发，全体玩家统一移动站位巡游'
        },
        {
            'type': TYPE_SPECIAL,
            'name': '小丑迷惑术',
            'content': '混淆国王指令',
            'duration': 3,
            'penalty': 8,
            'trigger_condition': 'clown_hidden',
            'cooldown': 2,
            'description': '小丑隐藏状态下可触发，混淆国王发布的指令'
        },
        {
            'type': TYPE_SPECIAL,
            'name': '平民组团护驾',
            'content': '抵消轻度惩罚',
            'duration': 0,
            'penalty': 0,
            'trigger_condition': 'civilian_group',
            'cooldown': 1,
            'description': '3名及以上平民可触发，抵消一次轻度惩罚'
        }
    ]

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                round INTEGER NOT NULL,
                king_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                name TEXT NOT NULL,
                content TEXT NOT NULL,
                duration INTEGER DEFAULT 3,
                penalty INTEGER DEFAULT 5,
                status TEXT DEFAULT 'pending',
                start_at TIMESTAMP,
                end_at TIMESTAMP,
                custom_content TEXT,
                is_special INTEGER DEFAULT 0,
                trigger_player_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_round ON {cls.TABLE_NAME}(game_id, round)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, game_id: int, round_num: int, king_id: int, command_type: str,
               name: str, content: str, duration: int = 3, penalty: int = 5,
               custom_content: str = '', is_special: bool = False,
               trigger_player_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'round': round_num,
            'king_id': king_id,
            'type': command_type,
            'name': name,
            'content': content,
            'duration': duration,
            'penalty': penalty,
            'status': self.STATUS_PENDING,
            'custom_content': custom_content,
            'is_special': 1 if is_special else 0,
            'trigger_player_id': trigger_player_id,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, command_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(command_id)

    def get_by_game(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_id': game_id}, order_by='round DESC, id DESC')

    def get_current_command(self, game_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one(
            {'game_id': game_id, 'status': self.STATUS_ACTIVE},
            order_by='id DESC'
        )

    def get_by_round(self, game_id: int, round_num: int) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'game_id': game_id, 'round': round_num},
            order_by='id ASC'
        )

    def start_command(self, command_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(command_id, {
            'status': self.STATUS_ACTIVE,
            'start_at': now
        })

    def complete_command(self, command_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_id(command_id, {
            'status': self.STATUS_COMPLETED,
            'end_at': now
        })

    def cancel_command(self, command_id: int) -> int:
        return self.exec.update_by_id(command_id, {
            'status': self.STATUS_CANCELLED
        })

    def get_base_commands(self) -> List[Dict[str, Any]]:
        return self.BASE_COMMANDS.copy()

    def get_special_commands(self) -> List[Dict[str, Any]]:
        return self.SPECIAL_COMMANDS.copy()

    def get_all_commands(self) -> List[Dict[str, Any]]:
        return self.BASE_COMMANDS + self.SPECIAL_COMMANDS

    def get_type_text(self, command_type: str) -> str:
        type_map = {
            self.TYPE_FUN: '趣味互动',
            self.TYPE_POSITION: '位置互动',
            self.TYPE_SPEECH: '言语互动',
            self.TYPE_PERFORMANCE: '整活互动',
            self.TYPE_SPECIAL: '专属技能'
        }
        return type_map.get(command_type, '未知')

    def get_status_text(self, status: str) -> str:
        status_map = {
            self.STATUS_PENDING: '待执行',
            self.STATUS_ACTIVE: '执行中',
            self.STATUS_COMPLETED: '已完成',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def delete_by_game(self, game_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE game_id = ?",
            (game_id,)
        )

    def to_dict(self, command: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': command.get('id'),
            'game_id': command.get('game_id'),
            'round': command.get('round'),
            'king_id': command.get('king_id'),
            'type': command.get('type'),
            'type_text': self.get_type_text(command.get('type')),
            'name': command.get('name'),
            'content': command.get('content'),
            'duration': command.get('duration'),
            'penalty': command.get('penalty'),
            'status': command.get('status'),
            'status_text': self.get_status_text(command.get('status')),
            'start_at': command.get('start_at'),
            'end_at': command.get('end_at'),
            'custom_content': command.get('custom_content'),
            'is_special': bool(command.get('is_special', 0)),
            'trigger_player_id': command.get('trigger_player_id'),
            'created_at': command.get('created_at')
        }
