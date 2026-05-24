from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class JobModel:
    TABLE_NAME = 'tb_mxt_job'
    
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
                name TEXT NOT NULL,
                icon TEXT DEFAULT '',
                description TEXT DEFAULT '',
                requirements TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                is_hidden INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_sort_order ON {cls.TABLE_NAME}(sort_order)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql2)

    @classmethod
    def seed_default_data(cls):
        db = get_db()
        count = db.fetch_one(f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}")
        if count and count['total'] > 0:
            return
        
        default_jobs = [
            (1, '狮子驯兽师助理', '🦁', '帮忙给狮子梳毛、剪指甲', '不怕被吼，有指甲钳使用经验', 1),
            (2, '小丑化妆师', '🤡', '给小丑画笑脸（他本人已经会哭了）', '绘画水平不低于幼儿园中班', 2),
            (3, '高空秋千测试员', '🎪', '试坐秋千，测试绳子牢不牢', '体重不超过200斤，不怕高', 3),
            (4, '大象便便清理员', '🐘', '负责清理大象表演后的"礼物"', '嗅觉迟钝，铲子使用熟练', 4),
            (5, '吞剑表演者学徒', '⚔️', '学习吞剑，先从吞勺子开始练', '没有咽反射，不挑食', 5),
            (6, '炮弹人（被发射的那种）', '🎯', '钻进大炮，被发射到海绵垫上', '有弹性，不怕摔', 6),
            (7, '独轮车维修工', '🚲', '修理独轮车，顺便学会骑', '平衡感好，有耐心', 7),
            (8, '魔术师助手', '🎩', '被锯成两半的那个角色', '身体柔软，不怕黑', 8),
            (9, '马戏团门票撕票员', '🎫', '在门口撕票，顺便喊"进来看看"', '嗓门大，手劲足', 9),
            (10, '动物喂食专员', '🍎', '给猴子、鹦鹉、马喂饭', '不被动物抢走自己的饭', 10),
            (11, '帐篷搭建工', '⛺', '搭帐篷、收帐篷、找丢了的钉子', '力气大，会打结', 11),
            (12, '杂耍球捡球童', '🎾', '杂耍演员扔掉的球你负责捡', '跑得快，眼疾手快', 12),
        ]
        
        now = datetime.now().isoformat()
        for job in default_jobs:
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} (id, name, icon, description, requirements, sort_order, is_active, is_hidden, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?)",
                (job[0], job[1], job[2], job[3], job[4], job[5], now, now)
            )

    def create(self, name: str, icon: str = '', description: str = '', requirements: str = '', 
               sort_order: int = 0, is_active: int = 1, is_hidden: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'icon': icon,
            'description': description,
            'requirements': requirements,
            'sort_order': sort_order,
            'is_active': is_active,
            'is_hidden': is_hidden,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, include_hidden: bool = False) -> List[Dict[str, Any]]:
        if include_hidden:
            return self.query.find_all(order_by='sort_order ASC, id ASC')
        return self.query.find_all(conditions={'is_hidden': 0}, order_by='sort_order ASC, id ASC')

    def get_active(self) -> List[Dict[str, Any]]:
        return self.query.find_all(conditions={'is_active': 1, 'is_hidden': 0}, order_by='sort_order ASC, id ASC')

    def update(self, record_id: int, name: str = None, icon: str = None, 
               description: str = None, requirements: str = None,
               sort_order: int = None, is_active: int = None, is_hidden: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        
        if name is not None:
            data['name'] = name
        if icon is not None:
            data['icon'] = icon
        if description is not None:
            data['description'] = description
        if requirements is not None:
            data['requirements'] = requirements
        if sort_order is not None:
            data['sort_order'] = sort_order
        if is_active is not None:
            data['is_active'] = is_active
        if is_hidden is not None:
            data['is_hidden'] = is_hidden
        
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
