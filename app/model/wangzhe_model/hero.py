from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class HeroModel:
    TABLE_NAME = 'tb_wangzhe_model_heroes'

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1

    POSITION_WARRIOR = 'warrior'
    POSITION_MAGE = 'mage'
    POSITION_ARCHER = 'archer'
    POSITION_TANK = 'tank'
    POSITION_ASSASSIN = 'assassin'
    POSITION_SUPPORT = 'support'

    DIFFICULTY_EASY = 'easy'
    DIFFICULTY_NORMAL = 'normal'
    DIFFICULTY_HARD = 'hard'

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
                name TEXT NOT NULL UNIQUE,
                title TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
                position TEXT DEFAULT 'warrior',
                difficulty TEXT DEFAULT 'normal',
                price INTEGER DEFAULT 6300,
                price_diamond INTEGER DEFAULT 0,
                max_hp INTEGER DEFAULT 3000,
                max_mp INTEGER DEFAULT 1000,
                attack INTEGER DEFAULT 150,
                defense INTEGER DEFAULT 100,
                speed REAL DEFAULT 1.0,
                attack_speed REAL DEFAULT 1.0,
                crit_rate REAL DEFAULT 0.0,
                skill_1_name TEXT DEFAULT '',
                skill_1_desc TEXT DEFAULT '',
                skill_1_cooldown REAL DEFAULT 5.0,
                skill_1_damage INTEGER DEFAULT 100,
                skill_2_name TEXT DEFAULT '',
                skill_2_desc TEXT DEFAULT '',
                skill_2_cooldown REAL DEFAULT 8.0,
                skill_2_damage INTEGER DEFAULT 150,
                skill_3_name TEXT DEFAULT '',
                skill_3_desc TEXT DEFAULT '',
                skill_3_cooldown REAL DEFAULT 30.0,
                skill_3_damage INTEGER DEFAULT 300,
                passive_name TEXT DEFAULT '',
                passive_desc TEXT DEFAULT '',
                description TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_position ON {cls.TABLE_NAME}(position)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    @classmethod
    def init_default_heroes(cls):
        model = cls()
        default_heroes = [
            {
                'name': '铠',
                'title': '破灭刃锋',
                'position': cls.POSITION_WARRIOR,
                'difficulty': cls.DIFFICULTY_NORMAL,
                'price': 13888,
                'max_hp': 3400,
                'max_mp': 800,
                'attack': 180,
                'defense': 120,
                'speed': 1.0,
                'attack_speed': 1.0,
                'skill_1_name': '回旋之刃',
                'skill_1_desc': '铠向前投掷刀刃，在敌人中最多弹射4次，对目标造成物理伤害与减速效果',
                'skill_1_cooldown': 8.0,
                'skill_1_damage': 120,
                'skill_2_name': '极刃风暴',
                'skill_2_desc': '铠向前方连续挥砍，造成物理伤害，第二刀造成额外的击飞效果',
                'skill_2_cooldown': 9.0,
                'skill_2_damage': 180,
                'skill_3_name': '不灭魔躯',
                'skill_3_desc': '铠召唤魔铠，每0.5秒对周围敌人造成法术伤害，并强化自身攻击力与移速',
                'skill_3_cooldown': 50.0,
                'skill_3_damage': 350,
                'passive_name': '修罗之魂',
                'passive_desc': '铠的普攻与二技能如果只命中一个单位，将会造成额外伤害',
                'description': '强大的战士型英雄，擅长单挑和突进'
            },
            {
                'name': '妲己',
                'title': '魅力之狐',
                'position': cls.POSITION_MAGE,
                'difficulty': cls.DIFFICULTY_EASY,
                'price': 2888,
                'max_hp': 2800,
                'max_mp': 1200,
                'attack': 100,
                'defense': 60,
                'speed': 0.9,
                'attack_speed': 0.8,
                'skill_1_name': '灵魂冲击',
                'skill_1_desc': '妲己挥出灵魂冲击波，对命中的敌人造成法术伤害',
                'skill_1_cooldown': 5.0,
                'skill_1_damage': 200,
                'skill_2_name': '偶像魅力',
                'skill_2_desc': '妲己抛出魅力爱心，对命中的敌人造成法术伤害并眩晕',
                'skill_2_cooldown': 12.0,
                'skill_2_damage': 150,
                'skill_3_name': '女王崇拜',
                'skill_3_desc': '妲己放出5团狐火攻击范围内的敌人，每团狐火造成法术伤害',
                'skill_3_cooldown': 18.0,
                'skill_3_damage': 500,
                'passive_name': '失心',
                'passive_desc': '妲己的攻击会减少目标的法术防御，最多叠加3层',
                'description': '高爆发法师，一套技能可以秒杀脆皮'
            },
            {
                'name': '后羿',
                'title': '精灵王',
                'position': cls.POSITION_ARCHER,
                'difficulty': cls.DIFFICULTY_EASY,
                'price': 6888,
                'max_hp': 3000,
                'max_mp': 900,
                'attack': 200,
                'defense': 80,
                'speed': 0.95,
                'attack_speed': 1.2,
                'skill_1_name': '多重箭矢',
                'skill_1_desc': '后羿强化攻击，接下来的3次普攻每次射出3支箭',
                'skill_1_cooldown': 8.0,
                'skill_1_damage': 150,
                'skill_2_name': '落日余晖',
                'skill_2_desc': '后羿射落日之箭，对范围内敌人造成物理伤害和减速',
                'skill_2_cooldown': 10.0,
                'skill_2_damage': 200,
                'skill_3_name': '灼日之矢',
                'skill_3_desc': '后羿向前方射出火焰箭，对命中的敌方英雄造成物理伤害和眩晕',
                'skill_3_cooldown': 45.0,
                'skill_3_damage': 400,
                'passive_name': '迟缓之箭',
                'passive_desc': '后羿的普攻会减少目标的移动速度，可叠加5层',
                'description': '持续输出型射手，攻速快，伤害高'
            },
            {
                'name': '亚瑟',
                'title': '圣骑之力',
                'position': cls.POSITION_TANK,
                'difficulty': cls.DIFFICULTY_EASY,
                'price': 0,
                'max_hp': 4000,
                'max_mp': 500,
                'attack': 140,
                'defense': 180,
                'speed': 0.95,
                'attack_speed': 0.9,
                'skill_1_name': '誓约之盾',
                'skill_1_desc': '亚瑟获得护盾，下一次普攻变为跳斩，造成额外伤害并沉默',
                'skill_1_cooldown': 7.0,
                'skill_1_damage': 140,
                'skill_2_name': '回旋打击',
                'skill_2_desc': '亚瑟召唤圣盾围绕自身旋转，对周围敌人造成持续物理伤害',
                'skill_2_cooldown': 12.0,
                'skill_2_damage': 200,
                'skill_3_name': '圣剑裁决',
                'skill_3_desc': '亚瑟举起圣剑跃向敌方，造成基于目标最大生命值的真实伤害',
                'skill_3_cooldown': 42.0,
                'skill_3_damage': 500,
                'passive_name': '圣光守护',
                'passive_desc': '亚瑟脱离战斗后会持续回复生命值',
                'description': '新手友好的坦克英雄，操作简单，生存能力强'
            },
            {
                'name': '李白',
                'title': '青莲剑仙',
                'position': cls.POSITION_ASSASSIN,
                'difficulty': cls.DIFFICULTY_HARD,
                'price': 18888,
                'max_hp': 2800,
                'max_mp': 1000,
                'attack': 220,
                'defense': 70,
                'speed': 1.1,
                'attack_speed': 1.0,
                'skill_1_name': '将进酒',
                'skill_1_desc': '李白向前突进，对路径上的敌人造成物理伤害，可连续使用3次',
                'skill_1_cooldown': 8.0,
                'skill_1_damage': 150,
                'skill_2_name': '神来之笔',
                'skill_2_desc': '李白以自身为中心化剑为青莲剑阵，对范围内敌人造成物理伤害和减速',
                'skill_2_cooldown': 12.0,
                'skill_2_damage': 200,
                'skill_3_name': '青莲剑歌',
                'skill_3_desc': '李白化身为剑气，对范围内敌人进行5次斩击，造成大量物理伤害',
                'skill_3_cooldown': 50.0,
                'skill_3_damage': 600,
                'passive_name': '侠客行',
                'passive_desc': '李白连续普攻4次后，会解锁大招并增加攻击力',
                'description': '高难度刺客，需要技巧才能玩好，但伤害爆炸'
            },
            {
                'name': '蔡文姬',
                'title': '天籁弦音',
                'position': cls.POSITION_SUPPORT,
                'difficulty': cls.DIFFICULTY_NORMAL,
                'price': 13888,
                'max_hp': 3500,
                'max_mp': 1500,
                'attack': 80,
                'defense': 120,
                'speed': 0.9,
                'attack_speed': 0.8,
                'skill_1_name': '思无邪',
                'skill_1_desc': '蔡文姬演奏乐曲，为周围友军回复生命值和增加移速',
                'skill_1_cooldown': 15.0,
                'skill_1_damage': 0,
                'skill_2_name': '胡笳乐',
                'skill_2_desc': '蔡文姬向指定方向弹奏，对敌方造成法术伤害和眩晕',
                'skill_2_cooldown': 10.0,
                'skill_2_damage': 180,
                'skill_3_name': '忘忧曲',
                'skill_3_desc': '蔡文姬放出持续治疗波动，为周围友军回复大量生命值',
                'skill_3_cooldown': 60.0,
                'skill_3_damage': 0,
                'passive_name': '长歌行',
                'passive_desc': '蔡文姬受到伤害时会为自己回复生命值',
                'description': '强大的辅助型英雄，治疗能力出众，保护能力强'
            }
        ]

        for hero in default_heroes:
            existing = model.get_by_name(hero['name'])
            if not existing:
                model.create(**hero)

    def create(self, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = kwargs.copy()
        data['created_at'] = now
        data['updated_at'] = now
        data['status'] = self.STATUS_ACTIVE
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = data.copy()
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, position: str = None,
                difficulty: str = None, keyword: str = None, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if position:
            conditions['position'] = position
        if difficulty:
            conditions['difficulty'] = difficulty
        if status is not None:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, position, difficulty, status)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               position: str = None, difficulty: str = None, status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if position:
            where_clauses.append("position = ?")
            params.append(position)
        if difficulty:
            where_clauses.append("difficulty = ?")
            params.append(difficulty)
        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(name LIKE ? OR title LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY id DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_position_text(self, position: str) -> str:
        position_map = {
            self.POSITION_WARRIOR: '战士',
            self.POSITION_MAGE: '法师',
            self.POSITION_ARCHER: '射手',
            self.POSITION_TANK: '坦克',
            self.POSITION_ASSASSIN: '刺客',
            self.POSITION_SUPPORT: '辅助'
        }
        return position_map.get(position, '未知')

    def get_difficulty_text(self, difficulty: str) -> str:
        difficulty_map = {
            self.DIFFICULTY_EASY: '简单',
            self.DIFFICULTY_NORMAL: '一般',
            self.DIFFICULTY_HARD: '困难'
        }
        return difficulty_map.get(difficulty, '未知')

    def to_public_dict(self, hero: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': hero.get('id'),
            'name': hero.get('name'),
            'title': hero.get('title'),
            'avatar': hero.get('avatar'),
            'position': hero.get('position'),
            'position_text': self.get_position_text(hero.get('position', '')),
            'difficulty': hero.get('difficulty'),
            'difficulty_text': self.get_difficulty_text(hero.get('difficulty', '')),
            'price': hero.get('price'),
            'price_diamond': hero.get('price_diamond'),
            'max_hp': hero.get('max_hp'),
            'max_mp': hero.get('max_mp'),
            'attack': hero.get('attack'),
            'defense': hero.get('defense'),
            'speed': hero.get('speed'),
            'attack_speed': hero.get('attack_speed'),
            'crit_rate': hero.get('crit_rate'),
            'skills': {
                'skill_1': {
                    'name': hero.get('skill_1_name'),
                    'desc': hero.get('skill_1_desc'),
                    'cooldown': hero.get('skill_1_cooldown'),
                    'damage': hero.get('skill_1_damage')
                },
                'skill_2': {
                    'name': hero.get('skill_2_name'),
                    'desc': hero.get('skill_2_desc'),
                    'cooldown': hero.get('skill_2_cooldown'),
                    'damage': hero.get('skill_2_damage')
                },
                'skill_3': {
                    'name': hero.get('skill_3_name'),
                    'desc': hero.get('skill_3_desc'),
                    'cooldown': hero.get('skill_3_cooldown'),
                    'damage': hero.get('skill_3_damage')
                },
                'passive': {
                    'name': hero.get('passive_name'),
                    'desc': hero.get('passive_desc')
                }
            },
            'description': hero.get('description'),
            'status': hero.get('status'),
            'created_at': hero.get('created_at')
        }
