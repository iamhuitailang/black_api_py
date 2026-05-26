from typing import Dict, Any, List, Optional
from app.model.todo import TodoTaskModel, TodoProjectModel, TodoTaskTagModel


class TodoStatisticsBusiness:
    def __init__(self):
        self.task_model = TodoTaskModel()
        self.project_model = TodoProjectModel()
        self.tag_model = TodoTaskTagModel()

    def get_overview(self, user_id: int, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        stats = self.task_model.get_statistics(user_id, start_date, end_date)

        projects = self.project_model.get_by_user_id(user_id)
        active_projects = [p for p in projects if p.get('status') == TodoProjectModel.STATUS_ACTIVE]

        today_tasks = self.task_model.get_today_tasks(user_id)
        overdue_tasks = self.task_model.get_overdue_tasks(user_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                **stats,
                'total_projects': len(projects),
                'active_projects': len(active_projects),
                'today_tasks': len(today_tasks),
                'overdue_tasks': len(overdue_tasks)
            }
        }

    def get_trend(self, user_id: int, days: int = 30) -> Dict[str, Any]:
        trend_data = self.task_model.get_trend_data(user_id, days)
        return {
            'code': 0,
            'msg': 'success',
            'data': trend_data
        }

    def get_tag_distribution(self, user_id: int) -> Dict[str, Any]:
        distribution = self.task_model.get_tag_distribution(user_id)

        tag_map = {}
        tags = self.tag_model.get_by_user_id(user_id)
        for tag in tags:
            tag_map[tag.get('name')] = tag.get('color')

        result = []
        for item in distribution:
            tag_names = item.get('tags', '').split(',')
            for tag_name in tag_names:
                if tag_name:
                    existing = next((r for r in result if r['name'] == tag_name), None)
                    if existing:
                        existing['count'] += item.get('count', 0)
                    else:
                        result.append({
                            'name': tag_name,
                            'count': item.get('count', 0),
                            'color': tag_map.get(tag_name, '#909399')
                        })

        result.sort(key=lambda x: x['count'], reverse=True)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_project_distribution(self, user_id: int) -> Dict[str, Any]:
        distribution = self.task_model.get_project_distribution(user_id)

        project_map = {}
        projects = self.project_model.get_by_user_id(user_id)
        for project in projects:
            project_map[project.get('id')] = {
                'name': project.get('name'),
                'color': project.get('color')
            }

        result = []
        for item in distribution:
            project_id = item.get('project_id', 0)
            project_info = project_map.get(project_id, {'name': '未分类', 'color': '#909399'})
            result.append({
                'project_id': project_id,
                'name': project_info['name'],
                'color': project_info['color'],
                'total': item.get('total', 0),
                'completed': item.get('completed', 0),
                'progress': (item.get('completed', 0) / item.get('total', 1) * 100) if item.get('total', 0) > 0 else 0
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_calendar_data(self, user_id: int, year: int, month: int) -> Dict[str, Any]:
        calendar_data = self.task_model.get_calendar_data(user_id, year, month)
        return {
            'code': 0,
            'msg': 'success',
            'data': calendar_data
        }

    def get_kanban_data(self, user_id: int, project_id: int = None) -> Dict[str, Any]:
        kanban_data = self.task_model.get_kanban_data(user_id, project_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': kanban_data
        }

    def get_personal_stats(self, user_id: int) -> Dict[str, Any]:
        from datetime import datetime, timedelta

        all_stats = self.task_model.get_statistics(user_id)

        today = datetime.now()
        week_ago = (today - timedelta(days=7)).strftime('%Y-%m-%d')
        month_ago = (today - timedelta(days=30)).strftime('%Y-%m-%d')

        week_stats = self.task_model.get_statistics(user_id, start_date=week_ago)
        month_stats = self.task_model.get_statistics(user_id, start_date=month_ago)

        projects = self.project_model.get_by_user_id(user_id)
        completed_projects = [p for p in projects if p.get('status') == TodoProjectModel.STATUS_ARCHIVED]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'all_time': all_stats,
                'last_7_days': week_stats,
                'last_30_days': month_stats,
                'total_projects': len(projects),
                'completed_projects': len(completed_projects),
                'active_projects': len(projects) - len(completed_projects)
            }
        }
