from typing import Dict, Any, List, Optional
from datetime import datetime
from app.model.meeting import ActionItemModel, MeetingModel, ProjectModel


class ActionItemBusiness:
    def __init__(self):
        self.model = ActionItemModel()
        self.meeting_model = MeetingModel()
        self.project_model = ProjectModel()

    def get_list(self, completed: bool = None, overdue: bool = None,
                 project_id: int = None) -> Dict[str, Any]:
        items = self.model.get_all(completed=completed, overdue=overdue)

        if project_id is not None:
            meeting_ids = set()
            meetings = self.meeting_model.get_by_project(project_id)
            for m in meetings:
                meeting_ids.add(m['id'])
            items = [item for item in items if item['meeting_id'] in meeting_ids]

        today = datetime.now().strftime('%Y-%m-%d')
        for item in items:
            item = self._enrich_action_item(item, today)

        return {
            'code': 0,
            'message': 'success',
            'data': items
        }

    def _enrich_action_item(self, item: Dict[str, Any], today: str) -> Dict[str, Any]:
        due_date = item.get('due_date', '')
        if due_date and not item.get('completed'):
            try:
                due = datetime.strptime(due_date, '%Y-%m-%d')
                today_dt = datetime.strptime(today, '%Y-%m-%d')
                days_left = (due - today_dt).days

                if days_left < 0:
                    item['status'] = 'overdue'
                    item['days_left'] = days_left
                elif days_left <= 3:
                    item['status'] = 'urgent'
                    item['days_left'] = days_left
                else:
                    item['status'] = 'normal'
                    item['days_left'] = days_left
            except (ValueError, TypeError):
                item['status'] = 'normal'
                item['days_left'] = None
        elif item.get('completed'):
            item['status'] = 'completed'
            item['days_left'] = None
        else:
            item['status'] = 'normal'
            item['days_left'] = None

        meeting = self.meeting_model.get_by_id(item['meeting_id'])
        if meeting:
            item['meeting_title'] = meeting.get('title', '')
            item['project_id'] = meeting.get('project_id', 0)
            project = self.project_model.get_by_id(meeting.get('project_id', 0))
            if project:
                item['project_name'] = project.get('name', '')
            else:
                item['project_name'] = ''
        else:
            item['meeting_title'] = ''
            item['project_id'] = 0
            item['project_name'] = ''

        return item

    def update_status(self, action_id: int, completed: bool) -> Dict[str, Any]:
        existing = self.model.get_by_id(action_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Action item not found',
                'data': None
            }

        affected = self.model.update(action_id, completed=completed)
        if affected > 0:
            record = self.model.get_by_id(action_id)
            return {
                'code': 0,
                'message': 'update success',
                'data': record
            }
        return {
            'code': 1,
            'message': 'update failed',
            'data': None
        }

    def set_reminder(self, action_id: int, reminder_time: str = '',
                     reminder_email: str = '') -> Dict[str, Any]:
        existing = self.model.get_by_id(action_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Action item not found',
                'data': None
            }

        if reminder_time:
            try:
                datetime.strptime(reminder_time, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                try:
                    datetime.strptime(reminder_time, '%Y-%m-%dT%H:%M')
                    reminder_time = reminder_time.replace('T', ' ') + ':00'
                except ValueError:
                    try:
                        datetime.strptime(reminder_time, '%Y-%m-%d')
                        reminder_time = reminder_time + ' 09:00:00'
                    except ValueError:
                        return {
                            'code': 1,
                            'message': 'Invalid reminder time format, use YYYY-MM-DD HH:MM:SS',
                            'data': None
                        }

        if reminder_email:
            import re
            if not re.match(r'^[^@]+@[^@]+\.[^@]+$', reminder_email):
                return {
                    'code': 1,
                    'message': 'Invalid email format',
                    'data': None
                }

        affected = self.model.update(
            action_id,
            reminder_time=reminder_time,
            reminder_email=reminder_email
        )
        if affected > 0:
            record = self.model.get_by_id(action_id)
            return {
                'code': 0,
                'message': 'reminder set success',
                'data': record
            }
        return {
            'code': 1,
            'message': 'set reminder failed',
            'data': None
        }

    def check_and_send_reminders(self) -> Dict[str, Any]:
        pending = self.model.get_pending_reminders()
        sent_count = 0
        errors = []

        for item in pending:
            try:
                self._send_reminder_email(item)
                self.model.mark_reminder_sent(item['id'])
                sent_count += 1
            except Exception as e:
                errors.append(f"ID {item['id']}: {str(e)}")

        return {
            'code': 0,
            'message': 'check complete',
            'data': {
                'sent_count': sent_count,
                'pending_count': len(pending),
                'errors': errors
            }
        }

    def _send_reminder_email(self, item: Dict[str, Any]):
        import smtplib
        from email.mime.text import MIMEText
        from email.header import Header
        import os

        smtp_host = os.environ.get('SMTP_HOST', '')
        smtp_port = int(os.environ.get('SMTP_PORT', '465'))
        smtp_user = os.environ.get('SMTP_USER', '')
        smtp_pass = os.environ.get('SMTP_PASS', '')
        sender = os.environ.get('SMTP_FROM', smtp_user)

        to_email = item.get('reminder_email', '')
        if not to_email:
            return

        if not smtp_host or not smtp_user:
            print(f"[Reminder] 待办事项提醒 (未配置邮件服务，打印日志):")
            print(f"  收件人: {to_email}")
            print(f"  待办: {item.get('content', '')}")
            print(f"  所属会议: {item.get('meeting_title', '')}")
            print(f"  责任人: {item.get('assignee', '')}")
            print(f"  截止日期: {item.get('due_date', '')}")
            return

        subject = f"[待办提醒] {item.get('content', '')}"
        body = f"""
        <h3>待办事项提醒</h3>
        <p><strong>待办内容：</strong>{item.get('content', '')}</p>
        <p><strong>所属会议：</strong>{item.get('meeting_title', '')}</p>
        <p><strong>责任人：</strong>{item.get('assignee', '')}</p>
        <p><strong>截止日期：</strong>{item.get('due_date', '')}</p>
        <p>请及时处理！</p>
        """

        msg = MIMEText(body, 'html', 'utf-8')
        msg['From'] = Header(sender, 'utf-8')
        msg['To'] = Header(to_email, 'utf-8')
        msg['Subject'] = Header(subject, 'utf-8')

        try:
            if smtp_port == 465:
                server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=30)
            else:
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=30)
                server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(sender, [to_email], msg.as_string())
            server.quit()
        except Exception as e:
            print(f"[Reminder] 发送邮件失败: {e}")
            raise

    def create(self, meeting_id: int, content: str, assignee: str = '',
               due_date: str = '', completed: bool = False) -> Dict[str, Any]:
        if not content or not content.strip():
            return {
                'code': 1,
                'message': 'Action item content cannot be empty',
                'data': None
            }

        new_id = self.model.create(meeting_id, content.strip(), assignee, due_date, completed)
        record = self.model.get_by_id(new_id)
        return {
            'code': 0,
            'message': 'create success',
            'data': record
        }

    def update(self, action_id: int, content: str = None, assignee: str = None,
               due_date: str = None) -> Dict[str, Any]:
        existing = self.model.get_by_id(action_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Action item not found',
                'data': None
            }

        if content is not None and not content.strip():
            return {
                'code': 1,
                'message': 'Action item content cannot be empty',
                'data': None
            }

        update_data = {}
        if content is not None:
            update_data['content'] = content.strip()
        if assignee is not None:
            update_data['assignee'] = assignee
        if due_date is not None:
            update_data['due_date'] = due_date

        if not update_data:
            return {
                'code': 1,
                'message': 'No fields to update',
                'data': None
            }

        affected = self.model.update(action_id, **update_data)
        if affected > 0:
            record = self.model.get_by_id(action_id)
            return {
                'code': 0,
                'message': 'update success',
                'data': record
            }
        return {
            'code': 1,
            'message': 'update failed',
            'data': None
        }

    def delete(self, action_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(action_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Action item not found',
                'data': None
            }

        affected = self.model.delete(action_id)
        if affected > 0:
            return {
                'code': 0,
                'message': 'delete success',
                'data': None
            }
        return {
            'code': 1,
            'message': 'delete failed',
            'data': None
        }

    def get_project_stats(self) -> Dict[str, Any]:
        projects = self.project_model.get_all()
        stats = []

        for project in projects:
            project_id = project['id']
            meeting_count = self.meeting_model.count_by_project(project_id)
            action_stats = self.model.get_stats_by_project(project_id)
            attendee_stats = self.model.get_attendee_stats_by_project(project_id)

            stats.append({
                'project_id': project_id,
                'project_name': project['name'],
                'project_description': project.get('description', ''),
                'meeting_count': meeting_count,
                'action_total': action_stats['total'],
                'action_completed': action_stats['completed'],
                'completion_rate': action_stats['completion_rate'],
                'top_assignees': attendee_stats[:5]
            })

        return {
            'code': 0,
            'message': 'success',
            'data': stats
        }
