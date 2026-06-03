from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import random


class SjEventLogModel:
    TABLE_NAME = 'tb_sj_model_event_log'

    EVENT_TYPE_COMBAT = 'combat'
    EVENT_TYPE_CHOICE = 'choice'
    EVENT_TYPE_DISCOVERY = 'discovery'
    EVENT_TYPE_TIME = 'time'
    EVENT_TYPE_TRADE = 'trade'

    RANDOM_EVENTS = [
        {
            'id': 'time_rift',
            'name': '时间裂隙',
            'description': '你发现了一道时间裂隙，从中传出奇异的光芒。是否尝试触碰？',
            'choices': [
                {'text': '触碰裂隙', 'effect': {'time_energy': 20, 'hp': -15}, 'result': '你获得了时间能量，但受到了伤害'},
                {'text': '绕路而行', 'effect': {'exp': 10}, 'result': '你安全地绕过了裂隙，获得了一点经验'}
            ]
        },
        {
            'id': 'lost_traveler',
            'name': '迷失的旅人',
            'description': '一个迷失在时间中的旅人向你求助。',
            'choices': [
                {'text': '帮助旅人', 'effect': {'gold': -20, 'exp': 30}, 'result': '旅人感激地给了你一些经验心得'},
                {'text': '忽略旅人', 'effect': {'gold': 10}, 'result': '你从旅人身上找到了一些金币'}
            ]
        },
        {
            'id': 'time_chest',
            'name': '时间宝箱',
            'description': '你发现了一个被封印在时间中的宝箱。',
            'choices': [
                {'text': '打开宝箱', 'effect': {'gold': 50, 'hp': -10}, 'result': '宝箱中有金币，但被时间陷阱所伤'},
                {'text': '仔细研究再打开', 'effect': {'gold': 30, 'time_energy': 10}, 'result': '你用时间能力解除了陷阱'}
            ]
        },
        {
            'id': 'time_fountain',
            'name': '时间之泉',
            'description': '你发现了一处散发着时间能量的泉水。',
            'choices': [
                {'text': '饮用泉水', 'effect': {'hp': 30, 'mp': 20, 'time_energy': -10}, 'result': '泉水恢复了你的生命和魔力'},
                {'text': '储存泉水', 'effect': {'time_energy': 30}, 'result': '你将时间能量储存了起来'}
            ]
        },
        {
            'id': 'shadow_merchant',
            'name': '暗影商人',
            'description': '一个神秘的商人出现在你面前，声称来自未来。',
            'choices': [
                {'text': '购买商品', 'effect': {'gold': -40, 'exp': 50}, 'result': '你买到了来自未来的知识'},
                {'text': '询问未来', 'effect': {'time_energy': -20, 'attack': 3}, 'result': '商人给了你一个关于战斗的预言'}
            ]
        },
        {
            'id': 'time_loop',
            'name': '时间循环',
            'description': '你感觉到了时间的扭曲，似乎在重复着什么。',
            'choices': [
                {'text': '打破循环', 'effect': {'exp': 40, 'time_energy': -15}, 'result': '你用意志力打破了循环，获得了经验'},
                {'text': '利用循环', 'effect': {'exp': 20, 'time_energy': 25}, 'result': '你利用循环充能了时间能量'}
            ]
        },
        {
            'id': 'ancient_clock',
            'name': '古老时钟',
            'description': '墙上有一个仍在运转的古老时钟，指针在倒转。',
            'choices': [
                {'text': '调整时钟', 'effect': {'time_energy': 35, 'hp': -20}, 'result': '调整时钟释放了大量时间能量'},
                {'text': '摧毁时钟', 'effect': {'attack': 5, 'time_energy': -10}, 'result': '时钟碎片增强了你的攻击力'}
            ]
        },
        {
            'id': 'memory_echo',
            'name': '记忆回响',
            'description': '你听到了前人的记忆回响，似乎在讲述塔中的秘密。',
            'choices': [
                {'text': '聆听回响', 'effect': {'exp': 35, 'mp': -15}, 'result': '你从回响中获得了珍贵的经验'},
                {'text': '记录回响', 'effect': {'time_energy': 15, 'defense': 3}, 'result': '你记录了信息，获得了防御提升'}
            ]
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
                character_id INTEGER NOT NULL,
                floor_number INTEGER NOT NULL,
                event_type TEXT NOT NULL,
                event_id TEXT DEFAULT '',
                event_description TEXT DEFAULT '',
                choice_made TEXT DEFAULT '',
                result TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_character_id ON {cls.TABLE_NAME}(character_id)"
        db.execute(index_sql)

    def create(self, character_id: int, floor_number: int, event_type: str,
               event_id: str = '', event_description: str = '',
               choice_made: str = '', result: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'character_id': character_id,
            'floor_number': floor_number,
            'event_type': event_type,
            'event_id': event_id,
            'event_description': event_description,
            'choice_made': choice_made,
            'result': result,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_character(self, character_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'character_id': character_id}, order_by='id DESC')

    def get_random_event(self) -> Dict[str, Any]:
        return random.choice(self.RANDOM_EVENTS)

    def to_dict(self, event: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': event.get('id'),
            'character_id': event.get('character_id'),
            'floor_number': event.get('floor_number'),
            'event_type': event.get('event_type'),
            'event_id': event.get('event_id'),
            'event_description': event.get('event_description'),
            'choice_made': event.get('choice_made'),
            'result': event.get('result'),
            'created_at': event.get('created_at')
        }
