from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class TemplateModel:
    TABLE_NAME = 'tb_siwei_077_model_template'

    CATEGORY_WORK = 'work'
    CATEGORY_STUDY = 'study'
    CATEGORY_LIFE = 'life'
    CATEGORY_PROJECT = 'project'
    CATEGORY_MEETING = 'meeting'

    CATEGORIES = [
        {'code': CATEGORY_WORK, 'name': '工作', 'icon': '💼'},
        {'code': CATEGORY_STUDY, 'name': '学习', 'icon': '📚'},
        {'code': CATEGORY_LIFE, 'name': '生活', 'icon': '🏠'},
        {'code': CATEGORY_PROJECT, 'name': '项目', 'icon': '📋'},
        {'code': CATEGORY_MEETING, 'name': '会议', 'icon': '🤝'},
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
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                category TEXT DEFAULT 'work',
                thumbnail TEXT DEFAULT '',
                theme TEXT DEFAULT 'classic',
                layout TEXT DEFAULT 'right',
                nodes_json TEXT DEFAULT '[]',
                edges_json TEXT DEFAULT '[]',
                is_official INTEGER DEFAULT 0,
                use_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_official ON {cls.TABLE_NAME}(is_official)"
        db.execute(index_sql)

    def create(self, name: str, description: str = '', category: str = 'work',
               theme: str = 'classic', layout: str = 'right',
               nodes_json: str = '[]', edges_json: str = '[]',
               is_official: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'category': category,
            'thumbnail': '',
            'theme': theme,
            'layout': layout,
            'nodes_json': nodes_json,
            'edges_json': edges_json,
            'is_official': is_official,
            'use_count': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, template_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'category', 'thumbnail', 'theme',
            'layout', 'nodes_json', 'edges_json', 'is_official'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(template_id, update_data)

    def increment_use_count(self, template_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET use_count = use_count + 1 WHERE id = ?"
        cursor = self.db.execute(sql, (template_id,))
        return cursor.rowcount

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_list(self, page: int = 1, page_size: int = 10, category: str = None) -> Dict[str, Any]:
        conditions = {}
        if category:
            conditions['category'] = category
        return self.query.paginate(page, page_size, conditions, order_by='use_count DESC, id DESC')

    def init_default_templates(self):
        existing = self.get_list(page=1, page_size=1)
        if existing.get('total', 0) > 0:
            return

        templates = [
            {
                'name': '项目规划',
                'description': '适用于项目规划与任务拆解',
                'category': 'project',
                'theme': 'classic',
                'layout': 'right',
                'nodes_json': json.dumps([
                    {'text': '项目规划', 'x': 400, 'y': 300, 'bg_color': '#409eff', 'parent_id': 0},
                    {'text': '需求分析', 'x': 620, 'y': 150, 'bg_color': '#67c23a', 'parent_id': 1},
                    {'text': '技术方案', 'x': 620, 'y': 300, 'bg_color': '#67c23a', 'parent_id': 1},
                    {'text': '测试上线', 'x': 620, 'y': 450, 'bg_color': '#67c23a', 'parent_id': 1},
                    {'text': '用户调研', 'x': 840, 'y': 100, 'bg_color': '#e6a23c', 'parent_id': 2},
                    {'text': '需求文档', 'x': 840, 'y': 200, 'bg_color': '#e6a23c', 'parent_id': 2},
                    {'text': '架构设计', 'x': 840, 'y': 250, 'bg_color': '#e6a23c', 'parent_id': 3},
                    {'text': '编码实现', 'x': 840, 'y': 350, 'bg_color': '#e6a23c', 'parent_id': 3},
                    {'text': '单元测试', 'x': 840, 'y': 400, 'bg_color': '#e6a23c', 'parent_id': 4},
                    {'text': '部署发布', 'x': 840, 'y': 500, 'bg_color': '#e6a23c', 'parent_id': 4},
                ]),
                'edges_json': json.dumps([
                    {'source_id': 1, 'target_id': 2},
                    {'source_id': 1, 'target_id': 3},
                    {'source_id': 1, 'target_id': 4},
                    {'source_id': 2, 'target_id': 5},
                    {'source_id': 2, 'target_id': 6},
                    {'source_id': 3, 'target_id': 7},
                    {'source_id': 3, 'target_id': 8},
                    {'source_id': 4, 'target_id': 9},
                    {'source_id': 4, 'target_id': 10},
                ]),
                'is_official': 1
            },
            {
                'name': '会议记录',
                'description': '适用于会议议题与讨论记录',
                'category': 'meeting',
                'theme': 'business',
                'layout': 'right',
                'nodes_json': json.dumps([
                    {'text': '会议主题', 'x': 400, 'y': 300, 'bg_color': '#909399', 'parent_id': 0},
                    {'text': '议题一', 'x': 620, 'y': 180, 'bg_color': '#409eff', 'parent_id': 1},
                    {'text': '议题二', 'x': 620, 'y': 300, 'bg_color': '#409eff', 'parent_id': 1},
                    {'text': '议题三', 'x': 620, 'y': 420, 'bg_color': '#409eff', 'parent_id': 1},
                    {'text': '讨论', 'x': 840, 'y': 140, 'bg_color': '#67c23a', 'parent_id': 2},
                    {'text': '结论', 'x': 840, 'y': 220, 'bg_color': '#67c23a', 'parent_id': 2},
                    {'text': '讨论', 'x': 840, 'y': 260, 'bg_color': '#67c23a', 'parent_id': 3},
                    {'text': '结论', 'x': 840, 'y': 340, 'bg_color': '#67c23a', 'parent_id': 3},
                    {'text': '讨论', 'x': 840, 'y': 380, 'bg_color': '#67c23a', 'parent_id': 4},
                    {'text': '结论', 'x': 840, 'y': 460, 'bg_color': '#67c23a', 'parent_id': 4},
                ]),
                'edges_json': json.dumps([
                    {'source_id': 1, 'target_id': 2},
                    {'source_id': 1, 'target_id': 3},
                    {'source_id': 1, 'target_id': 4},
                    {'source_id': 2, 'target_id': 5},
                    {'source_id': 2, 'target_id': 6},
                    {'source_id': 3, 'target_id': 7},
                    {'source_id': 3, 'target_id': 8},
                    {'source_id': 4, 'target_id': 9},
                    {'source_id': 4, 'target_id': 10},
                ]),
                'is_official': 1
            },
            {
                'name': '读书笔记',
                'description': '适用于读书笔记与知识梳理',
                'category': 'study',
                'theme': 'fresh',
                'layout': 'right',
                'nodes_json': json.dumps([
                    {'text': '书名', 'x': 400, 'y': 300, 'bg_color': '#67c23a', 'parent_id': 0},
                    {'text': '核心观点', 'x': 620, 'y': 150, 'bg_color': '#409eff', 'parent_id': 1},
                    {'text': '精彩段落', 'x': 620, 'y': 300, 'bg_color': '#409eff', 'parent_id': 1},
                    {'text': '个人感悟', 'x': 620, 'y': 450, 'bg_color': '#409eff', 'parent_id': 1},
                ]),
                'edges_json': json.dumps([
                    {'source_id': 1, 'target_id': 2},
                    {'source_id': 1, 'target_id': 3},
                    {'source_id': 1, 'target_id': 4},
                ]),
                'is_official': 1
            },
            {
                'name': '工作计划',
                'description': '适用于周计划/月计划梳理',
                'category': 'work',
                'theme': 'warm',
                'layout': 'right',
                'nodes_json': json.dumps([
                    {'text': '工作计划', 'x': 400, 'y': 300, 'bg_color': '#f56c6c', 'parent_id': 0},
                    {'text': '本周重点', 'x': 620, 'y': 150, 'bg_color': '#e6a23c', 'parent_id': 1},
                    {'text': '待办事项', 'x': 620, 'y': 300, 'bg_color': '#e6a23c', 'parent_id': 1},
                    {'text': '复盘总结', 'x': 620, 'y': 450, 'bg_color': '#e6a23c', 'parent_id': 1},
                ]),
                'edges_json': json.dumps([
                    {'source_id': 1, 'target_id': 2},
                    {'source_id': 1, 'target_id': 3},
                    {'source_id': 1, 'target_id': 4},
                ]),
                'is_official': 1
            },
        ]

        for t in templates:
            self.create(**t)

    def to_dict(self, template: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': template.get('id'),
            'name': template.get('name'),
            'description': template.get('description'),
            'category': template.get('category'),
            'thumbnail': template.get('thumbnail'),
            'theme': template.get('theme'),
            'layout': template.get('layout'),
            'nodes_json': template.get('nodes_json'),
            'edges_json': template.get('edges_json'),
            'is_official': template.get('is_official'),
            'use_count': template.get('use_count'),
            'created_at': template.get('created_at'),
            'updated_at': template.get('updated_at')
        }
