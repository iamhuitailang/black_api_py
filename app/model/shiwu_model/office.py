from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class OfficeModel:
    TABLE_NAME = 'tb_shiwu_model_offices'

    TYPE_OFFICIAL = 'official'
    TYPE_ANNOUNCEMENT = 'announcement'
    TYPE_SUMMARY = 'summary'

    STATUS_DRAFT = 0
    STATUS_PUBLISHED = 1
    STATUS_CLOSED = 2

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
                admin_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT DEFAULT '',
                location TEXT DEFAULT '',
                location_latitude REAL,
                location_longitude REAL,
                open_hours TEXT DEFAULT '',
                contact TEXT DEFAULT '',
                images TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    @classmethod
    def init_default_offices(cls):
        db = get_db()
        model = cls()
        existing = model.get_all_published()
        if not existing.get('items'):
            default_offices = [
                {
                    'type': cls.TYPE_OFFICIAL,
                    'title': '学生会失物招领中心',
                    'content': '学生会官方失物招领服务点，负责收集和管理全校失物招领物品。开放时间内可前来咨询和认领。',
                    'location': '学生活动中心101室',
                    'open_hours': '周一至周五 9:00-18:00',
                    'contact': '13800138000',
                    'sort_order': 1
                },
                {
                    'type': cls.TYPE_OFFICIAL,
                    'title': '保卫处失物招领箱',
                    'content': '学校保卫处设立的失物招领点，主要接收校园内安保人员捡到的物品。',
                    'location': '校门保卫处',
                    'open_hours': '24小时值班',
                    'contact': '13800138001',
                    'sort_order': 2
                },
                {
                    'type': cls.TYPE_OFFICIAL,
                    'title': '图书馆失物招领处',
                    'content': '图书馆服务台设立的失物招领点，接收在图书馆内捡到的物品。',
                    'location': '图书馆一楼服务台',
                    'open_hours': '周一至周日 8:00-22:00',
                    'contact': '13800138002',
                    'sort_order': 3
                },
                {
                    'type': cls.TYPE_ANNOUNCEMENT,
                    'title': '关于规范失物招领信息发布的通知',
                    'content': '为更好地服务广大同学，规范失物招领信息管理，现将有关事项通知如下：1. 发布信息请如实填写物品特征；2. 认领物品需携带有效证件；3. 发布虚假信息将被封号处理。',
                    'sort_order': 1
                },
                {
                    'type': cls.TYPE_SUMMARY,
                    'title': '本周未认领物品汇总',
                    'content': '本周共收到未认领物品15件，包括：钱包3个、手机2部、钥匙5串、书籍2本、其他物品3件。请到各失物招领点查看详细清单。',
                    'sort_order': 1
                }
            ]
            for item in default_offices:
                now = datetime.now().isoformat()
                sql = f"""
                    INSERT INTO {cls.TABLE_NAME} 
                    (admin_id, type, title, content, location, open_hours, contact, 
                     sort_order, status, view_count, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
                db.execute(sql, (1, item['type'], item['title'], item.get('content', ''), 
                               item.get('location', ''), item.get('open_hours', ''), 
                               item.get('contact', ''), item.get('sort_order', 0), 
                               cls.STATUS_PUBLISHED, 0, now, now))
            print("  - Initialized default offices and announcements for shiwu")

    def create(self, admin_id: int, office_type: str, title: str, content: str = '',
               location: str = '', location_latitude: float = None, location_longitude: float = None,
               open_hours: str = '', contact: str = '', images: str = '', 
               sort_order: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'admin_id': admin_id,
            'type': office_type,
            'title': title,
            'content': content,
            'location': location,
            'location_latitude': location_latitude,
            'location_longitude': location_longitude,
            'open_hours': open_hours,
            'contact': contact,
            'images': images,
            'sort_order': sort_order,
            'status': self.STATUS_DRAFT,
            'view_count': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def increment_view_count(self, office_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET view_count = view_count + 1 WHERE id = ?"
        cursor = self.db.execute(sql, (office_id,))
        return cursor.rowcount

    def update_status(self, office_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(office_id, data)

    def publish(self, office_id: int) -> int:
        return self.update_status(office_id, self.STATUS_PUBLISHED)

    def close(self, office_id: int) -> int:
        return self.update_status(office_id, self.STATUS_CLOSED)

    def update(self, office_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'type', 'title', 'content', 'location', 'location_latitude', 
            'location_longitude', 'open_hours', 'contact', 'images', 'sort_order'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(office_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all_published(self) -> Dict[str, Any]:
        conditions = {'status': self.STATUS_PUBLISHED}
        return self.query.paginate(1, 100, conditions, order_by='sort_order ASC, created_at DESC')

    def get_by_type(self, office_type: str, page: int = 1, page_size: int = 10,
                    status: int = None) -> Dict[str, Any]:
        conditions = {'type': office_type}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, created_at DESC')

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                office_type: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if office_type:
            conditions['type'] = office_type
        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, created_at DESC')

    def get_type_text(self, office_type: str) -> str:
        type_map = {
            self.TYPE_OFFICIAL: '官方招领点',
            self.TYPE_ANNOUNCEMENT: '公告通知',
            self.TYPE_SUMMARY: '定期汇总'
        }
        return type_map.get(office_type, '其他')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_DRAFT: '草稿',
            self.STATUS_PUBLISHED: '已发布',
            self.STATUS_CLOSED: '已关闭'
        }
        return status_map.get(status, '未知')

    def to_dict(self, office: Dict[str, Any]) -> Dict[str, Any]:
        images_str = office.get('images', '')
        images = images_str.split(',') if images_str else []
        
        return {
            'id': office.get('id'),
            'admin_id': office.get('admin_id'),
            'type': office.get('type'),
            'type_text': self.get_type_text(office.get('type')),
            'title': office.get('title'),
            'content': office.get('content'),
            'location': office.get('location'),
            'location_latitude': office.get('location_latitude'),
            'location_longitude': office.get('location_longitude'),
            'open_hours': office.get('open_hours'),
            'contact': office.get('contact'),
            'images': images,
            'sort_order': office.get('sort_order'),
            'status': office.get('status'),
            'status_text': self.get_status_text(office.get('status')),
            'view_count': office.get('view_count'),
            'created_at': office.get('created_at'),
            'updated_at': office.get('updated_at')
        }
