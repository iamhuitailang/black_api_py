from datetime import datetime, date
from typing import Dict, Any, List, Optional
from app.model.bookclub import UserModel, BookModel, CheckinModel


class BookClubBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.book_model = BookModel()
        self.checkin_model = CheckinModel()

    def register_or_get_user(self, nickname: str, avatar_url: str = '') -> Dict[str, Any]:
        if not nickname or not nickname.strip():
            return {
                'code': 1,
                'message': '昵称不能为空',
                'data': None
            }

        nickname = nickname.strip()
        avatar = avatar_url.strip() if avatar_url else self._generate_avatar(nickname)
        user_id = self.user_model.create(nickname, avatar)
        user = self.user_model.get_by_id(user_id)
        return {
            'code': 0,
            'message': '注册成功',
            'data': self._build_user_info(user)
        }

    def get_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'message': '用户不存在',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': self._build_user_info(user)
        }

    def get_user_homepage(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'message': '用户不存在',
                'data': None
            }

        books = self.book_model.get_by_user(user_id)
        reading_books = [b for b in books if not b.get('end_date')]
        finished_books = [b for b in books if b.get('end_date')]

        streak = self.checkin_model.get_streak(user_id)
        total_days = self.checkin_model.get_total_days(user_id)

        now = datetime.now()
        year_month = now.strftime('%Y-%m')
        monthly_finished = self.book_model.count_finished_by_user_in_month(user_id, year_month)

        total_pages = sum(b.get('pages', 0) for b in finished_books)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'user': self._build_user_info(user),
                'stats': {
                    'total_books': len(books),
                    'reading_count': len(reading_books),
                    'finished_count': len(finished_books),
                    'monthly_finished': monthly_finished,
                    'streak_days': streak,
                    'total_checkin_days': total_days,
                    'total_pages': total_pages
                },
                'reading_books': reading_books,
                'finished_books': finished_books
            }
        }

    def add_book(self, user_id: int, title: str, author: str, pages: int = 0,
                 start_date: str = '', end_date: str = '', rating: int = 0, review: str = '') -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'message': '用户不存在',
                'data': None
            }

        if not title or not title.strip():
            return {
                'code': 1,
                'message': '书名不能为空',
                'data': None
            }
        if not author or not author.strip():
            return {
                'code': 1,
                'message': '作者不能为空',
                'data': None
            }

        book_id = self.book_model.create(
            user_id=user_id,
            title=title.strip(),
            author=author.strip(),
            pages=pages or 0,
            start_date=start_date or '',
            end_date=end_date or '',
            rating=min(max(rating or 0, 0), 5),
            review=review or ''
        )

        book = self.book_model.get_by_id(book_id)
        return {
            'code': 0,
            'message': '添加成功',
            'data': book
        }

    def update_book(self, user_id: int, book_id: int, **kwargs) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'message': '用户不存在',
                'data': None
            }

        book = self.book_model.get_by_id(book_id)
        if not book:
            return {
                'code': 1,
                'message': '书籍不存在',
                'data': None
            }

        if book['user_id'] != user_id:
            return {
                'code': 1,
                'message': '无权限修改',
                'data': None
            }

        if 'title' in kwargs and kwargs['title']:
            kwargs['title'] = kwargs['title'].strip()
        if 'author' in kwargs and kwargs['author']:
            kwargs['author'] = kwargs['author'].strip()
        if 'rating' in kwargs:
            kwargs['rating'] = min(max(kwargs['rating'] or 0, 0), 5)
        if 'pages' in kwargs:
            kwargs['pages'] = kwargs['pages'] or 0

        self.book_model.update(book_id, **kwargs)
        book = self.book_model.get_by_id(book_id)
        return {
            'code': 0,
            'message': '更新成功',
            'data': book
        }

    def delete_book(self, user_id: int, book_id: int) -> Dict[str, Any]:
        book = self.book_model.get_by_id(book_id)
        if not book:
            return {
                'code': 1,
                'message': '书籍不存在',
                'data': None
            }
        if book['user_id'] != user_id:
            return {
                'code': 1,
                'message': '无权限删除',
                'data': None
            }

        self.book_model.delete(book_id)
        return {
            'code': 0,
            'message': '删除成功',
            'data': None
        }

    def checkin(self, user_id: int, checkin_date: str = None) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'message': '用户不存在',
                'data': None
            }

        if not checkin_date:
            checkin_date = date.today().isoformat()

        existing = self.checkin_model.get_by_user_and_date(user_id, checkin_date)
        if existing:
            return {
                'code': 0,
                'message': '今日已打卡',
                'data': {
                    'date': checkin_date,
                    'streak_days': self.checkin_model.get_streak(user_id),
                    'already_checked': True
                }
            }

        try:
            self.checkin_model.checkin(user_id, checkin_date)
        except Exception:
            return {
                'code': 0,
                'message': '今日已打卡',
                'data': {
                    'date': checkin_date,
                    'streak_days': self.checkin_model.get_streak(user_id),
                    'already_checked': True
                }
            }

        return {
            'code': 0,
            'message': '打卡成功',
            'data': {
                'date': checkin_date,
                'streak_days': self.checkin_model.get_streak(user_id),
                'already_checked': False
            }
        }

    def get_checkin_calendar(self, user_id: int, year_month: str = None) -> Dict[str, Any]:
        if not year_month:
            year_month = datetime.now().strftime('%Y-%m')

        checkins = self.checkin_model.get_by_user_in_month(user_id, year_month)
        dates = [c['date'] for c in checkins]

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'year_month': year_month,
                'checkin_dates': dates,
                'count': len(dates)
            }
        }

    def get_leaderboard(self, year_month: str = None) -> Dict[str, Any]:
        if not year_month:
            year_month = datetime.now().strftime('%Y-%m')

        all_users = self.user_model.get_all(limit=200)
        rankings = []

        for user in all_users:
            uid = user['id']
            finished_count = self.book_model.count_finished_by_user_in_month(uid, year_month)
            streak = self.checkin_model.get_streak(uid)
            total_checkin = self.checkin_model.get_total_days(uid)

            rankings.append({
                'user': self._build_user_info(user),
                'finished_count': finished_count,
                'streak_days': streak,
                'total_checkin_days': total_checkin
            })

        rankings.sort(key=lambda x: (-x['finished_count'], -x['streak_days'], -x['total_checkin_days']))

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'year_month': year_month,
                'rankings': rankings
            }
        }

    def get_recent_activity(self, limit: int = 20) -> Dict[str, Any]:
        latest_books = self.book_model.get_latest_all(limit=limit)
        result = []

        for book in latest_books:
            user = self.user_model.get_by_id(book['user_id'])
            if user:
                result.append({
                    'book': book,
                    'user': self._build_user_info(user)
                })

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def _build_user_info(self, user: Dict[str, Any]) -> Dict[str, Any]:
        if not user:
            return None
        return {
            'id': user['id'],
            'nickname': user['nickname'],
            'avatar_url': user.get('avatar_url', '') or self._generate_avatar(user['nickname']),
            'created_at': user.get('created_at')
        }

    def _generate_avatar(self, nickname: str) -> str:
        colors = ['#F4A460', '#DEB887', '#D2691E', '#8B7355', '#CD853F',
                  '#A0522D', '#B8860B', '#DAA520', '#8B4513', '#BC8F8F']
        idx = sum(ord(c) for c in nickname) % len(colors)
        initial = nickname[0] if nickname else '书'
        color = colors[idx]
        return f'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="{color}" rx="40"/><text x="40" y="52" font-size="36" text-anchor="middle" fill="white" font-family="serif">{initial}</text></svg>'
