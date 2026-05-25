from datetime import datetime
from typing import Dict, Any, List, Optional
from app.model.zhuiju import DramaModel, DramaStatus, ReminderModel


class DramaBusiness:
    def __init__(self):
        self.model = DramaModel()
        self.reminder_model = ReminderModel()

    def _serialize(self, d: Dict[str, Any]) -> Dict[str, Any]:
        if not d:
            return d
        total = max(int(d.get('total_episodes', 0) or 0), 1)
        watched = min(int(d.get('watched_episodes', 0) or 0), total)
        progress = round(watched * 100.0 / total, 1) if total > 0 else 0
        tags = d.get('tags', '') or ''
        return {
            **d,
            'watched_episodes': watched,
            'total_episodes': total,
            'progress': progress,
            'tag_list': [t.strip() for t in tags.split(',') if t.strip()] if tags else [],
        }

    def list_dramas(self, status: str = None, genre: str = None, year: int = None,
                    keyword: str = None, sort_by: str = 'updated_at',
                    order: str = 'desc') -> Dict[str, Any]:
        sql = f"SELECT * FROM {self.model.TABLE_NAME} WHERE 1=1"
        params: list = []
        if status:
            sql += " AND status = ?"
            params.append(status)
        if genre:
            sql += " AND genre = ?"
            params.append(genre)
        if year:
            sql += " AND year = ?"
            params.append(year)
        if keyword:
            sql += " AND (name LIKE ? OR review LIKE ? OR tags LIKE ?)"
            like = f"%{keyword}%"
            params.extend([like, like, like])

        allowed_sort = {
            'updated_at': 'updated_at',
            'name': 'name',
            'rating': 'rating',
            'progress': 'watched_episodes * 1.0 / CASE WHEN total_episodes=0 THEN 1 ELSE total_episodes END',
            'sort_order': 'sort_order',
        }
        sort_field = allowed_sort.get(sort_by, 'updated_at')
        order_dir = 'ASC' if order.lower() == 'asc' else 'DESC'
        sql += f" ORDER BY {sort_field} {order_dir}, id ASC"

        rows = self.model.db.fetch_all(sql, tuple(params) if params else None)
        items = [self._serialize(r) for r in rows]
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': items,
                'total': len(items),
            }
        }

    def get_drama(self, drama_id: int) -> Dict[str, Any]:
        d = self.model.get_by_id(drama_id)
        if not d:
            return {'code': 1, 'message': '剧集不存在', 'data': None}
        return {'code': 0, 'message': 'success', 'data': self._serialize(d)}

    def create_drama(self, data: Dict[str, Any]) -> Dict[str, Any]:
        name = (data.get('name') or '').strip()
        if not name:
            return {'code': 1, 'message': '剧名不能为空', 'data': None}
        if 'status' in data and data['status']:
            if data['status'] not in [s.value for s in DramaStatus]:
                data['status'] = DramaStatus.WANT.value
        if 'rating' in data and data['rating'] is not None:
            r = int(data['rating'])
            data['rating'] = max(0, min(5, r))
        data['is_custom'] = 1
        new_id = self.model.create(data)
        return self.get_drama(new_id)

    def update_drama(self, drama_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        existing = self.model.get_by_id(drama_id)
        if not existing:
            return {'code': 1, 'message': '剧集不存在', 'data': None}
        if 'status' in data and data['status']:
            if data['status'] not in [s.value for s in DramaStatus]:
                data.pop('status')
        if 'rating' in data and data['rating'] is not None:
            r = int(data['rating'])
            data['rating'] = max(0, min(5, r))
        if 'watched_episodes' in data and data['watched_episodes'] is not None:
            total = int(existing.get('total_episodes', 0) or 0)
            w = int(data['watched_episodes'])
            if total > 0:
                w = min(w, total)
            data['watched_episodes'] = max(0, w)
            if total > 0 and w >= total:
                data['status'] = DramaStatus.FINISHED.value
        if 'total_episodes' in data and data['total_episodes'] is not None:
            total = int(data['total_episodes'])
            data['total_episodes'] = max(0, total)
            watched = int(data.get('watched_episodes') if 'watched_episodes' in data else existing.get('watched_episodes', 0))
            if total > 0 and watched >= total:
                data['watched_episodes'] = total
                data['status'] = DramaStatus.FINISHED.value
        self.model.update(drama_id, data)
        return self.get_drama(drama_id)

    def delete_drama(self, drama_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(drama_id)
        if not existing:
            return {'code': 1, 'message': '剧集不存在', 'data': None}
        self.model.delete(drama_id)
        return {'code': 0, 'message': '删除成功', 'data': None}

    def change_status(self, drama_id: int, status: str) -> Dict[str, Any]:
        if status not in [s.value for s in DramaStatus]:
            return {'code': 1, 'message': '状态无效', 'data': None}
        return self.update_drama(drama_id, {'status': status})

    def increment_episode(self, drama_id: int, delta: int = 1) -> Dict[str, Any]:
        existing = self.model.get_by_id(drama_id)
        if not existing:
            return {'code': 1, 'message': '剧集不存在', 'data': None}
        total = int(existing.get('total_episodes', 0) or 0)
        watched = int(existing.get('watched_episodes', 0) or 0)
        new_watched = max(0, min(watched + delta, total if total > 0 else watched + delta))
        data = {'watched_episodes': new_watched}
        if new_watched == 0 and existing.get('status') == DramaStatus.WATCHING.value:
            pass
        elif total > 0 and new_watched >= total:
            data['status'] = DramaStatus.FINISHED.value
        elif new_watched > 0 and existing.get('status') == DramaStatus.WANT.value:
            data['status'] = DramaStatus.WATCHING.value
        return self.update_drama(drama_id, data)

    def set_progress(self, drama_id: int, watched_episodes: int) -> Dict[str, Any]:
        return self.update_drama(drama_id, {'watched_episodes': watched_episodes})

    def batch_set_status(self, drama_ids: List[int], status: str) -> Dict[str, Any]:
        if status not in [s.value for s in DramaStatus]:
            return {'code': 1, 'message': '状态无效', 'data': None}
        updated = 0
        for did in drama_ids:
            if self.model.get_by_id(did):
                self.model.update(did, {'status': status})
                updated += 1
        return {'code': 0, 'message': 'success', 'data': {'updated': updated}}

    def set_rating(self, drama_id: int, rating: int, review: str = '',
                   tags: str = '', is_rewatch: int = 0) -> Dict[str, Any]:
        data = {
            'rating': max(0, min(5, int(rating or 0))),
            'review': review or '',
            'tags': tags or '',
            'is_rewatch': 1 if is_rewatch else 0,
        }
        return self.update_drama(drama_id, data)

    def statistics(self) -> Dict[str, Any]:
        s = self.model.sum_watched()
        counts = self.model.count_by_status()
        total_minutes = int(s.get('total_watch_minutes', 0) or 0)
        hours = total_minutes // 60
        minutes = total_minutes % 60
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'total_dramas': int(s.get('total_dramas', 0) or 0),
                'finished_count': int(s.get('finished_count', 0) or 0),
                'watching_count': counts.get(DramaStatus.WATCHING.value, 0),
                'want_count': counts.get(DramaStatus.WANT.value, 0),
                'dropped_count': counts.get(DramaStatus.DROPPED.value, 0),
                'total_watched_episodes': int(s.get('total_watched_episodes', 0) or 0),
                'total_watch_minutes': total_minutes,
                'total_watch_hours': hours,
                'total_watch_minutes_only': minutes,
                'avg_rating': round(float(s.get('avg_rating', 0) or 0), 2),
                'finished_this_month': self.model.count_finished_this_month(),
            }
        }

    def filters(self) -> Dict[str, Any]:
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'statuses': [{'value': s.value, 'label': '想看' if s == DramaStatus.WANT else
                                              '正在追' if s == DramaStatus.WATCHING else
                                              '已看完' if s == DramaStatus.FINISHED else
                                              '弃剧'} for s in DramaStatus],
                'genres': self.model.get_distinct_genres(),
                'years': self.model.get_distinct_years(),
            }
        }

    def export_all(self) -> Dict[str, Any]:
        items = self.model.get_all(order_by='id ASC')
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': items,
                'total': len(items),
                'exported_at': datetime.now().isoformat(),
            }
        }

    def import_all(self, items: List[Dict[str, Any]], mode: str = 'merge') -> Dict[str, Any]:
        if not isinstance(items, list):
            return {'code': 1, 'message': '数据格式错误', 'data': None}
        if mode == 'replace':
            self.model.delete_all()
        count = 0
        for d in items:
            if not isinstance(d, dict):
                continue
            if not (d.get('name') or '').strip():
                continue
            d['is_custom'] = 1
            self.model.create(d)
            count += 1
        return {'code': 0, 'message': '导入成功', 'data': {'imported': count}}

    def clear_all(self) -> Dict[str, Any]:
        self.model.delete_all()
        return {'code': 0, 'message': '清空成功', 'data': None}

    def reset_default(self) -> Dict[str, Any]:
        self.model.delete_all()
        DramaModel.init_default_dramas()
        items = self.model.get_all(order_by='sort_order ASC')
        return {'code': 0, 'message': '重置成功', 'data': {'total': len(items)}}

    def annual_summary(self, year: int = None) -> Dict[str, Any]:
        now = datetime.now()
        y = year or now.year
        finished = self.model.get_all(conditions={'status': DramaStatus.FINISHED.value},
                                      order_by='updated_at DESC')
        year_items = []
        total_watch_minutes = 0
        total_episodes = 0
        ratings = []
        for d in finished:
            updated = d.get('updated_at', '')
            if not updated.startswith(str(y)):
                continue
            year_items.append(d)
            total_episodes += int(d.get('total_episodes', 0) or 0)
            total_watch_minutes += int(d.get('total_episodes', 0) or 0) * int(d.get('episode_duration', 0) or 0)
            if int(d.get('rating', 0) or 0) > 0:
                ratings.append(int(d['rating']))
        top_rated = sorted(year_items, key=lambda x: int(x.get('rating', 0) or 0), reverse=True)[:5]
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'year': y,
                'finished_count': len(year_items),
                'total_episodes': total_episodes,
                'total_watch_minutes': total_watch_minutes,
                'total_watch_hours': total_watch_minutes // 60,
                'avg_rating': round(sum(ratings) / len(ratings), 2) if ratings else 0,
                'top_rated': top_rated,
                'items': year_items,
            }
        }

    def recommend_card(self, drama_id: int) -> Dict[str, Any]:
        d = self.model.get_by_id(drama_id)
        if not d:
            return {'code': 1, 'message': '剧集不存在', 'data': None}
        return {
            'code': 0,
            'message': 'success',
            'data': self._serialize(d),
        }
