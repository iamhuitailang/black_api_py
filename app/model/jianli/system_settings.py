from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SystemSettingsModel:
    TABLE_NAME = 'tb_jianli_system_settings'

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
                setting_key TEXT NOT NULL UNIQUE,
                setting_value TEXT DEFAULT '',
                setting_name TEXT DEFAULT '',
                description TEXT DEFAULT '',
                group_name TEXT DEFAULT 'default',
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_setting_key ON {cls.TABLE_NAME}(setting_key)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_group_name ON {cls.TABLE_NAME}(group_name)"
        db.execute(index_sql)

    @classmethod
    def init_default_settings(cls):
        settings_model = cls()
        default_settings = [
            {
                'setting_key': 'site_name',
                'setting_value': '简历在线制作平台',
                'setting_name': '网站名称',
                'description': '网站显示的名称',
                'group_name': 'basic',
                'sort_order': 1
            },
            {
                'setting_key': 'site_description',
                'setting_value': '专业简历在线制作平台，提供多模板选择、在线编辑、一键导出PDF',
                'setting_name': '网站描述',
                'description': '网站的描述信息',
                'group_name': 'basic',
                'sort_order': 2
            },
            {
                'setting_key': 'max_resume_per_user',
                'setting_value': '10',
                'setting_name': '最大简历数',
                'description': '每个用户最多可创建的简历数量',
                'group_name': 'user',
                'sort_order': 1
            },
            {
                'setting_key': 'enable_registration',
                'setting_value': '1',
                'setting_name': '开放注册',
                'description': '是否开放用户注册功能',
                'group_name': 'user',
                'sort_order': 2
            },
            {
                'setting_key': 'pdf_export_enabled',
                'setting_value': '1',
                'setting_name': 'PDF导出',
                'description': '是否启用PDF导出功能',
                'group_name': 'feature',
                'sort_order': 1
            }
        ]

        for setting in default_settings:
            existing = settings_model.get_by_key(setting['setting_key'])
            if not existing:
                settings_model.exec.insert(setting)
                print(f"  - Created default setting: {setting['setting_name']}")

    def create(self, setting_key: str, setting_value: str = '', setting_name: str = '',
               description: str = '', group_name: str = 'default', sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'setting_key': setting_key,
            'setting_value': setting_value,
            'setting_name': setting_name,
            'description': description,
            'group_name': group_name,
            'sort_order': sort_order,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_key(self, setting_key: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'setting_key': setting_key})

    def get_value(self, setting_key: str, default_value: str = '') -> str:
        setting = self.get_by_key(setting_key)
        return setting.get('setting_value', default_value) if setting else default_value

    def get_all(self, page: int = 1, page_size: int = 100, group_name: str = None) -> Dict[str, Any]:
        conditions = {}
        if group_name:
            conditions['group_name'] = group_name
        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, id ASC')

    def get_all_dict(self) -> Dict[str, str]:
        items = self.query.find_all(order_by='sort_order ASC')
        return {item['setting_key']: item['setting_value'] for item in items}

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'setting_value', 'setting_name', 'description', 'group_name', 'sort_order'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_value(self, setting_key: str, setting_value: str) -> int:
        setting = self.get_by_key(setting_key)
        if not setting:
            return 0
        now = datetime.now().isoformat()
        data = {
            'setting_value': setting_value,
            'updated_at': now
        }
        return self.exec.update_by_id(setting['id'], data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_public_dict(self, setting: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': setting.get('id'),
            'setting_key': setting.get('setting_key'),
            'setting_value': setting.get('setting_value'),
            'setting_name': setting.get('setting_name'),
            'description': setting.get('description'),
            'group_name': setting.get('group_name'),
            'sort_order': setting.get('sort_order'),
            'created_at': setting.get('created_at'),
            'updated_at': setting.get('updated_at')
        }
