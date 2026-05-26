from typing import Dict, Any
from app.model.jianli import UserModel, TemplateModel, ResumeModel
from datetime import datetime, timedelta


class StatisticsBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.template_model = TemplateModel()
        self.resume_model = ResumeModel()

    def get_overview(self) -> Dict[str, Any]:
        total_users = self.user_model.count()
        total_templates = self.template_model.count()
        published_templates = self.template_model.count_published()
        total_resumes = self.resume_model.count()

        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        today_str = today.isoformat()
        yesterday_str = yesterday.isoformat()

        sql = f"""
            SELECT COUNT(*) as count FROM {self.user_model.TABLE_NAME}
            WHERE DATE(created_at) = ?
        """
        today_new_users = self.user_model.db.fetch_one(sql, (today_str,))
        today_new_users = today_new_users.get('count', 0) if today_new_users else 0

        sql = f"""
            SELECT COUNT(*) as count FROM {self.resume_model.TABLE_NAME}
            WHERE DATE(created_at) = ?
        """
        today_new_resumes = self.resume_model.db.fetch_one(sql, (today_str,))
        today_new_resumes = today_new_resumes.get('count', 0) if today_new_resumes else 0

        sql = f"""
            SELECT COUNT(*) as count FROM {self.user_model.TABLE_NAME}
            WHERE DATE(created_at) BETWEEN ? AND ?
        """
        week_new_users = self.user_model.db.fetch_one(sql, (yesterday_str, today_str))
        week_new_users = week_new_users.get('count', 0) if week_new_users else 0

        sql = f"""
            SELECT SUM(download_count) as total FROM {self.resume_model.TABLE_NAME}
        """
        total_downloads = self.resume_model.db.fetch_one(sql)
        total_downloads = total_downloads.get('total', 0) if total_downloads else 0

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'total_templates': total_templates,
                'published_templates': published_templates,
                'total_resumes': total_resumes,
                'total_downloads': total_downloads or 0,
                'today_new_users': today_new_users,
                'today_new_resumes': today_new_resumes,
                'week_new_users': week_new_users
            }
        }

    def get_user_trend(self, days: int = 7) -> Dict[str, Any]:
        dates = []
        counts = []

        for i in range(days - 1, -1, -1):
            date = (datetime.now() - timedelta(days=i)).date().isoformat()
            dates.append(date)

            sql = f"""
                SELECT COUNT(*) as count FROM {self.user_model.TABLE_NAME}
                WHERE DATE(created_at) = ?
            """
            result = self.user_model.db.fetch_one(sql, (date,))
            counts.append(result.get('count', 0) if result else 0)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'dates': dates,
                'counts': counts
            }
        }

    def get_resume_trend(self, days: int = 7) -> Dict[str, Any]:
        dates = []
        counts = []

        for i in range(days - 1, -1, -1):
            date = (datetime.now() - timedelta(days=i)).date().isoformat()
            dates.append(date)

            sql = f"""
                SELECT COUNT(*) as count FROM {self.resume_model.TABLE_NAME}
                WHERE DATE(created_at) = ?
            """
            result = self.resume_model.db.fetch_one(sql, (date,))
            counts.append(result.get('count', 0) if result else 0)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'dates': dates,
                'counts': counts
            }
        }

    def get_template_statistics(self) -> Dict[str, Any]:
        sql = f"""
            SELECT t.id, t.name, t.category_code, t.use_count,
                   COUNT(r.id) as resume_count
            FROM {self.template_model.TABLE_NAME} t
            LEFT JOIN {self.resume_model.TABLE_NAME} r ON t.id = r.template_id
            WHERE t.status = 1
            GROUP BY t.id, t.name, t.category_code, t.use_count
            ORDER BY t.use_count DESC
            LIMIT 10
        """
        items = self.template_model.db.fetch_all(sql)

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_category_statistics(self) -> Dict[str, Any]:
        from app.model.jianli import TemplateCategoryModel
        category_model = TemplateCategoryModel()

        sql = f"""
            SELECT tc.id, tc.name, tc.code,
                   COUNT(t.id) as template_count
            FROM {category_model.TABLE_NAME} tc
            LEFT JOIN {self.template_model.TABLE_NAME} t ON tc.id = t.category_id AND t.status = 1
            WHERE tc.status = 0
            GROUP BY tc.id, tc.name, tc.code
            ORDER BY tc.sort_order ASC
        """
        items = category_model.db.fetch_all(sql)

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }
