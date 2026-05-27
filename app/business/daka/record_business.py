from typing import Dict, Any, List, Optional
from datetime import date, timedelta
from app.model.daka import RecordModel, TaskModel, UserModel, UserAchievementModel


class DakaRecordBusiness:
    def __init__(self):
        self.record_model = RecordModel()
        self.task_model = TaskModel()
        self.user_model = UserModel()
        self.user_achievement_model = UserAchievementModel()

    def _get_motivation_message(self) -> str:
        messages = [
            '太棒了！继续保持！💪',
            '今天的你超棒的！🌟',
            '坚持就是胜利！🔥',
            '你正在变得更好！✨',
            '每一次打卡都是进步！🎯',
            '自律给你自由！🌈',
            '好习惯正在养成！🌱',
            '今天的努力，明天的收获！💎',
            '你比想象中更强大！👊',
            '完美的一天又近了一步！🎉',
        ]
        import random
        return random.choice(messages)

    def get_today_checkin_status(self, user_id: int) -> Dict[str, Any]:
        today = date.today().strftime('%Y-%m-%d')
        user_tasks = self.task_model.get_user_tasks(user_id)
        today_records = self.record_model.get_user_date_records(user_id, today)

        record_map = {r.get('task_id'): r for r in today_records}
        tasks_with_status = []

        for task in user_tasks:
            task_dict = self.task_model.to_dict(task)
            record = record_map.get(task.get('id'))

            if record:
                task_dict['current_value'] = record.get('current_value', 0)
                task_dict['is_completed'] = record.get('is_completed', 0)
                task_dict['record_id'] = record.get('id')
                task_dict['checkin_time'] = record.get('checkin_time', '')
                task_dict['streak_days'] = record.get('streak_days', 0)
                task_dict['points_earned'] = record.get('points_earned', 0)
            else:
                task_dict['current_value'] = 0
                task_dict['is_completed'] = 0
                task_dict['record_id'] = None
                task_dict['checkin_time'] = ''
                task_dict['streak_days'] = 0
                task_dict['points_earned'] = 0

            progress = 0
            target = task_dict.get('target_value', 1)
            if target > 0:
                progress = min(100, int(task_dict['current_value'] / target * 100))
            task_dict['progress'] = progress

            streak_info = self.record_model.get_task_streak(user_id, task.get('id'))
            task_dict['current_streak'] = streak_info.get('current_streak', 0)
            task_dict['max_streak'] = streak_info.get('max_streak', 0)

            tasks_with_status.append(task_dict)

        completed_count = sum(1 for t in tasks_with_status if t['is_completed'] == 1)
        total_count = len(tasks_with_status)
        overall_progress = 0
        if total_count > 0:
            overall_progress = int(completed_count / total_count * 100)

        result = {
            'date': today,
            'total_tasks': total_count,
            'completed_tasks': completed_count,
            'overall_progress': overall_progress,
            'is_all_completed': completed_count == total_count and total_count > 0,
            'tasks': tasks_with_status,
            'motivation_message': self._get_motivation_message()
        }

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def checkin(self, user_id: int, task_id: int, current_value: int = None, note: str = '') -> Dict[str, Any]:
        task = self.task_model.get_by_id(task_id)
        if not task:
            return {
                'code': 1,
                'msg': '任务不存在',
                'data': None
            }

        if task.get('is_system') != 1 and task.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限打卡此任务',
                'data': None
            }

        today = date.today().strftime('%Y-%m-%d')
        existing_record = self.record_model.get_user_task_date_record(user_id, task_id, today)

        target_value = task.get('target_value', 1)
        if current_value is None:
            current_value = target_value

        is_completed = 1 if current_value >= target_value else 0
        points_earned = 0

        if existing_record:
            if existing_record.get('is_completed') == 1:
                return {
                    'code': 1,
                    'msg': '今日已完成此任务打卡',
                    'data': None
                }

            self.record_model.update_current_value(
                existing_record.get('id'), current_value, is_completed
            )
            record_id = existing_record.get('id')
        else:
            record_id = self.record_model.create(
                user_id=user_id,
                task_id=task_id,
                task_name=task.get('name', ''),
                task_icon=task.get('icon', ''),
                target_value=target_value,
                current_value=current_value,
                unit=task.get('unit', '次'),
                checkin_date=today,
                is_completed=is_completed,
                note=note
            )

        if is_completed:
            streak_days = self.record_model.calculate_streak(user_id, task_id)
            points_earned = self._calculate_points(task, streak_days)

            self.record_model.update_streak_and_points(record_id, streak_days, points_earned)
            self.user_model.update_points(user_id, points_earned)

            self._update_user_streak(user_id)

            new_achievements = self.user_achievement_model.check_and_unlock_achievements(user_id)

            return {
                'code': 0,
                'msg': '打卡成功',
                'data': {
                    'record_id': record_id,
                    'is_completed': is_completed,
                    'streak_days': streak_days,
                    'points_earned': points_earned,
                    'motivation_message': self._get_motivation_message(),
                    'new_achievements': new_achievements
                }
            }

        return {
            'code': 0,
            'msg': '打卡进度已更新',
            'data': {
                'record_id': record_id,
                'is_completed': is_completed,
                'current_value': current_value,
                'target_value': target_value,
                'progress': min(100, int(current_value / target_value * 100))
            }
        }

    def _calculate_points(self, task: Dict[str, Any], streak_days: int) -> int:
        base_points = 10
        task_type = task.get('type', 1)

        if task_type == 2:
            base_points = 20
        elif task_type == 3:
            base_points = 30
        elif task_type == 4:
            base_points = 15

        streak_bonus = 0
        if streak_days >= 7:
            streak_bonus = 5
        if streak_days >= 30:
            streak_bonus = 15
        if streak_days >= 100:
            streak_bonus = 50

        return base_points + streak_bonus

    def _update_user_streak(self, user_id: int):
        user = self.user_model.get_by_id(user_id)
        if not user:
            return

        today = date.today()
        current_streak = 0

        for i in range(365):
            check_date = (today - timedelta(days=i)).strftime('%Y-%m-%d')
            records = self.record_model.get_user_date_records(user_id, check_date)
            completed_records = [r for r in records if r.get('is_completed') == 1]

            if len(completed_records) > 0:
                current_streak += 1
            else:
                break

        max_streak = max(user.get('max_streak', 0), current_streak)
        self.user_model.update_streak(user_id, current_streak, max_streak)

        if current_streak > 0:
            self.user_model.increment_total_days(user_id)

    def get_checkin_history(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        sql = f"""
            SELECT * FROM {self.record_model.TABLE_NAME} 
            WHERE user_id = ? 
            ORDER BY checkin_date DESC, created_at DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        records = self.record_model.db.fetch_all(sql, (user_id,))

        count_sql = f"SELECT COUNT(*) as total FROM {self.record_model.TABLE_NAME} WHERE user_id = ?"
        total_result = self.record_model.db.fetch_one(count_sql, (user_id,))
        total = total_result.get('total', 0) if total_result else 0

        result = [self.record_model.to_dict(r) for r in records]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': result,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }
        }

    def get_heatmap_data(self, user_id: int, months: int = 6) -> Dict[str, Any]:
        end_date = date.today()
        start_date = end_date - timedelta(days=months * 30)

        heatmap = self.record_model.get_user_heatmap_data(
            user_id,
            start_date.strftime('%Y-%m-%d'),
            end_date.strftime('%Y-%m-%d')
        )

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'heatmap': heatmap
            }
        }

    def get_monthly_calendar(self, user_id: int, year: int, month: int) -> Dict[str, Any]:
        records = self.record_model.get_user_month_records(user_id, year, month)

        calendar_data = {}
        for record in records:
            if record.get('is_completed') == 1:
                date_str = record.get('checkin_date', '')
                if date_str not in calendar_data:
                    calendar_data[date_str] = {
                        'date': date_str,
                        'completed_count': 0,
                        'total_count': 0,
                        'tasks': []
                    }
                calendar_data[date_str]['completed_count'] += 1
                calendar_data[date_str]['tasks'].append({
                    'task_id': record.get('task_id'),
                    'task_name': record.get('task_name'),
                    'task_icon': record.get('task_icon')
                })

        user_tasks = self.task_model.get_user_tasks(user_id)
        for date_str in calendar_data:
            calendar_data[date_str]['total_count'] = len(user_tasks)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'year': year,
                'month': month,
                'calendar': list(calendar_data.values())
            }
        }

    def get_statistics(self, user_id: int) -> Dict[str, Any]:
        stats = self.record_model.get_user_statistics(user_id)
        user = self.user_model.get_by_id(user_id)

        if user:
            stats['current_streak'] = user.get('current_streak', 0)
            stats['max_streak'] = user.get('max_streak', 0)
            stats['level'] = user.get('level', 1)
            stats['points'] = user.get('points', 0)

        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }

    def delete_record(self, record_id: int, user_id: int) -> Dict[str, Any]:
        record = self.record_model.get_by_id(record_id)
        if not record:
            return {
                'code': 1,
                'msg': '记录不存在',
                'data': None
            }

        if record.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限删除此记录',
                'data': None
            }

        affected = self.record_model.delete(record_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }
