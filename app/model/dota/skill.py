from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DotaSkillModel:
    TABLE_NAME = 'tb_dota_skills'

    DEFAULT_SKILLS = {
        1: [
            {'id': 101, 'hero_id': 1, 'name': '法力损毁', 'level': 1, 'max_level': 4, 'damage': 15, 'mana_burn': 20, 'cooldown': 0, 'icon': '✨', 'description': '攻击时损毁魔法值'},
            {'id': 102, 'hero_id': 1, 'name': '闪烁', 'level': 0, 'max_level': 4, 'damage': 0, 'cooldown': 5, 'icon': '💫', 'description': '短距离瞬间移动'},
            {'id': 103, 'hero_id': 1, 'name': '法术护盾', 'level': 0, 'max_level': 4, 'defense_bonus': 10, 'cooldown': 0, 'icon': '🛡️', 'description': '被动增加魔法抗性'},
            {'id': 104, 'hero_id': 1, 'name': '虚空', 'level': 0, 'max_level': 3, 'damage': 60, 'stun_duration': 2, 'cooldown': 15, 'icon': '🌌', 'description': '对目标造成伤害并眩晕'},
        ],
        2: [
            {'id': 201, 'hero_id': 2, 'name': '龙破斩', 'level': 1, 'max_level': 4, 'damage': 80, 'cooldown': 4, 'icon': '🐉', 'description': '释放火焰波浪'},
            {'id': 202, 'hero_id': 2, 'name': '光击阵', 'level': 0, 'max_level': 4, 'damage': 50, 'stun_duration': 1.5, 'cooldown': 6, 'icon': '💥', 'description': '召唤火焰柱眩晕敌人'},
            {'id': 203, 'hero_id': 2, 'name': '炽魂', 'level': 0, 'max_level': 4, 'attack_speed_bonus': 10, 'move_speed_bonus': 5, 'cooldown': 0, 'icon': '🔥', 'description': '每次施法提升攻击速度'},
            {'id': 204, 'hero_id': 2, 'name': '神灭斩', 'level': 0, 'max_level': 3, 'damage': 200, 'cooldown': 20, 'icon': '☄️', 'description': '对单个目标造成大量伤害'},
        ],
        3: [
            {'id': 301, 'hero_id': 3, 'name': '狂战士的怒吼', 'level': 1, 'max_level': 4, 'taunt_duration': 2, 'armor_bonus': 5, 'cooldown': 8, 'icon': '😤', 'description': '嘲讽周围敌人并增加护甲'},
            {'id': 302, 'hero_id': 3, 'name': '战斗饥渴', 'level': 0, 'max_level': 4, 'damage_per_second': 15, 'duration': 8, 'cooldown': 10, 'icon': '🔴', 'description': '使敌人持续受到伤害'},
            {'id': 303, 'hero_id': 3, 'name': '反击螺旋', 'level': 0, 'max_level': 4, 'damage': 30, 'chance': 15, 'cooldown': 0, 'icon': '🌀', 'description': '受到攻击时有几率反击'},
            {'id': 304, 'hero_id': 3, 'name': '淘汰之刃', 'level': 0, 'max_level': 3, 'damage': 150, 'execute_threshold': 0.3, 'cooldown': 12, 'icon': '⚔️', 'description': '对低血量敌人造成致命伤害'},
        ],
        4: [
            {'id': 401, 'hero_id': 4, 'name': '寒冰箭', 'level': 1, 'max_level': 4, 'damage': 20, 'slow_duration': 1.5, 'cooldown': 0, 'icon': '❄️', 'description': '攻击附带减速效果'},
            {'id': 402, 'hero_id': 4, 'name': '沉默魔法', 'level': 0, 'max_level': 4, 'silence_duration': 3, 'cooldown': 8, 'icon': '🤫', 'description': '阻止敌人使用技能'},
            {'id': 403, 'hero_id': 4, 'name': '射手天赋', 'level': 0, 'max_level': 4, 'attack_range_bonus': 20, 'damage_bonus': 5, 'cooldown': 0, 'icon': '🏹', 'description': '增加攻击范围和伤害'},
            {'id': 404, 'hero_id': 4, 'name': '精准光环', 'level': 0, 'max_level': 3, 'damage_bonus': 30, 'cooldown': 0, 'icon': '🎯', 'description': '提供攻击力加成光环'},
        ],
        5: [
            {'id': 501, 'hero_id': 5, 'name': '弧形闪电', 'level': 1, 'max_level': 4, 'damage': 65, 'targets': 2, 'cooldown': 2, 'icon': '⚡', 'description': '释放跳跃的闪电链'},
            {'id': 502, 'hero_id': 5, 'name': '雷击', 'level': 0, 'max_level': 4, 'damage': 100, 'mini_stun': 0.2, 'cooldown': 5, 'icon': '⛈️', 'description': '从天空召唤闪电'},
            {'id': 503, 'hero_id': 5, 'name': '静电场', 'level': 0, 'max_level': 4, 'damage_percent': 5, 'cooldown': 0, 'icon': '💠', 'description': '每次施法减少敌人生命值百分比'},
            {'id': 504, 'hero_id': 5, 'name': '雷神之怒', 'level': 0, 'max_level': 3, 'damage': 225, 'cooldown': 30, 'icon': '🌩️', 'description': '对所有敌人造成伤害'},
        ],
        6: [
            {'id': 601, 'hero_id': 6, 'name': '召狼', 'level': 1, 'max_level': 4, 'wolf_count': 2, 'wolf_damage': 15, 'cooldown': 20, 'icon': '🐺', 'description': '召唤幽灵狼协助战斗'},
            {'id': 602, 'hero_id': 6, 'name': '嗥叫', 'level': 0, 'max_level': 4, 'damage_bonus': 10, 'duration': 10, 'cooldown': 15, 'icon': '🌙', 'description': '增加攻击力和护甲'},
            {'id': 603, 'hero_id': 6, 'name': '野性之心', 'level': 0, 'max_level': 4, 'attack_speed_bonus': 15, 'hp_regen_bonus': 2, 'cooldown': 0, 'icon': '❤️', 'description': '增加攻击速度和生命回复'},
            {'id': 604, 'hero_id': 6, 'name': '变身', 'level': 0, 'max_level': 3, 'duration': 18, 'damage_bonus': 40, 'cooldown': 60, 'icon': '🔥', 'description': '变身为狼人，大幅提升能力'},
        ],
    }

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY,
                hero_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                level INTEGER DEFAULT 0,
                max_level INTEGER DEFAULT 4,
                damage INTEGER DEFAULT 0,
                mana_cost INTEGER DEFAULT 0,
                cooldown INTEGER DEFAULT 0,
                stun_duration REAL DEFAULT 0,
                slow_duration REAL DEFAULT 0,
                damage_per_second INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 0,
                defense_bonus INTEGER DEFAULT 0,
                armor_bonus INTEGER DEFAULT 0,
                attack_speed_bonus INTEGER DEFAULT 0,
                move_speed_bonus INTEGER DEFAULT 0,
                damage_bonus INTEGER DEFAULT 0,
                mana_burn INTEGER DEFAULT 0,
                chance INTEGER DEFAULT 0,
                targets INTEGER DEFAULT 1,
                damage_percent INTEGER DEFAULT 0,
                execute_threshold REAL DEFAULT 0,
                silence_duration REAL DEFAULT 0,
                attack_range_bonus INTEGER DEFAULT 0,
                mini_stun REAL DEFAULT 0,
                hp_regen_bonus INTEGER DEFAULT 0,
                taunt_duration REAL DEFAULT 0,
                wolf_count INTEGER DEFAULT 0,
                wolf_damage INTEGER DEFAULT 0,
                icon TEXT DEFAULT '',
                description TEXT DEFAULT ''
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_hero_id ON {cls.TABLE_NAME}(hero_id)"
        db.execute(index_sql)

    @classmethod
    def migrate_add_missing_columns(cls):
        db = get_db()
        columns_info = db.fetch_all(f"PRAGMA table_info({cls.TABLE_NAME})")
        existing_columns = [col.get('name') for col in columns_info]
        
        missing_columns = [
            ('armor_bonus', 'INTEGER DEFAULT 0'),
            ('move_speed_bonus', 'INTEGER DEFAULT 0'),
            ('damage_bonus', 'INTEGER DEFAULT 0'),
            ('silence_duration', 'REAL DEFAULT 0'),
            ('attack_range_bonus', 'INTEGER DEFAULT 0'),
            ('mini_stun', 'REAL DEFAULT 0'),
            ('hp_regen_bonus', 'INTEGER DEFAULT 0'),
            ('taunt_duration', 'REAL DEFAULT 0'),
        ]
        
        migrated = False
        for col_name, col_type in missing_columns:
            if col_name not in existing_columns:
                try:
                    db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN {col_name} {col_type}")
                    print(f"  - Added column {col_name} to {cls.TABLE_NAME}")
                    migrated = True
                except Exception as e:
                    print(f"  - Failed to add column {col_name}: {e}")
        
        return migrated

    @classmethod
    def init_default_skills(cls):
        model = DotaSkillModel()
        for hero_id, skills in cls.DEFAULT_SKILLS.items():
            for skill in skills:
                existing = model.get_by_id(skill['id'])
                if not existing:
                    model.exec.insert(skill)

    def get_by_id(self, skill_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(skill_id)

    def get_by_hero(self, hero_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'hero_id': hero_id}, order_by='id ASC')

    def to_dict(self, skill: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': skill.get('id'),
            'hero_id': skill.get('hero_id'),
            'name': skill.get('name'),
            'level': skill.get('level'),
            'max_level': skill.get('max_level'),
            'damage': skill.get('damage'),
            'cooldown': skill.get('cooldown'),
            'icon': skill.get('icon'),
            'description': skill.get('description')
        }
