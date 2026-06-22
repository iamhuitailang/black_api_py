import json
from typing import Dict, Any, List, Optional
from app.model.opinion import OpinionModel, OpinionTimelineModel, OpinionRatingModel
from app.model.auth import UserModel


class OpinionBusiness:
    def __init__(self):
        self.opinion_model = OpinionModel()
        self.timeline_model = OpinionTimelineModel()
        self.rating_model = OpinionRatingModel()
        self.user_model = UserModel()

    def _auto_assign_handler(self, category: str) -> Optional[Dict[str, Any]]:
        staff_list = self.user_model.get_staff_list()
        if not staff_list:
            return None
        import random
        return random.choice(staff_list)

    def _format_opinion(self, opinion: Dict[str, Any]) -> Dict[str, Any]:
        if not opinion:
            return opinion
        result = dict(opinion)
        if result.get('photos'):
            try:
                result['photos'] = json.loads(result['photos'])
            except:
                result['photos'] = []
        else:
            result['photos'] = []
        result['category_name'] = OpinionModel.CATEGORY_MAP.get(result.get('category', ''), result.get('category', ''))
        result['status_name'] = OpinionModel.STATUS_MAP.get(result.get('status', ''), result.get('status', ''))
        return result

    def create_opinion(self, title: str, category: str, description: str, 
                       photos: List[str] = None, submitter_id: int = None, 
                       submitter_name: str = None, community: str = None) -> Dict[str, Any]:
        if not title or not title.strip():
            return {'code': 1, 'message': '请填写意见标题', 'data': None}
        if not category or category not in OpinionModel.CATEGORY_MAP:
            return {'code': 1, 'message': '请选择正确的意见类别', 'data': None}
        if not description or not description.strip():
            return {'code': 1, 'message': '请填写意见描述', 'data': None}
        if not submitter_id:
            return {'code': 1, 'message': '请先登录', 'data': None}
        
        photos_str = json.dumps(photos or [], ensure_ascii=False)
        
        opinion_id = self.opinion_model.create({
            'title': title.strip(),
            'category': category,
            'description': description.strip(),
            'photos': photos_str,
            'submitter_id': submitter_id,
            'submitter_name': submitter_name,
            'community': community
        })
        
        self.timeline_model.create(
            opinion_id=opinion_id,
            timeline_type=OpinionTimelineModel.TYPE_SUBMIT,
            content=f'提交意见：{title.strip()}',
            operator_id=submitter_id,
            operator_name=submitter_name,
            photos=photos_str
        )
        
        handler = self._auto_assign_handler(category)
        if handler:
            self.opinion_model.assign_handler(opinion_id, handler['id'], handler.get('real_name') or handler['username'])
            self.timeline_model.create(
                opinion_id=opinion_id,
                timeline_type=OpinionTimelineModel.TYPE_ASSIGN,
                content=f'系统自动分配给：{handler.get("real_name") or handler["username"]}',
                operator_id=handler['id'],
                operator_name=handler.get('real_name') or handler['username']
            )
        
        return {'code': 0, 'message': '意见提交成功', 'data': {'id': opinion_id}}

    def get_opinion_detail(self, opinion_id: int, user_id: int = None, user_role: str = None) -> Dict[str, Any]:
        opinion = self.opinion_model.get_by_id(opinion_id)
        if not opinion:
            return {'code': 1, 'message': '意见不存在', 'data': None}
        
        if user_role == 'resident' and opinion.get('submitter_id') != user_id and opinion.get('is_public') != 1:
            return {'code': 1, 'message': '无权限查看', 'data': None}
        
        if user_role == 'staff' and opinion.get('handler_id') != user_id and opinion.get('submitter_id') != user_id:
            if opinion.get('status') != OpinionModel.STATUS_PENDING:
                return {'code': 1, 'message': '无权限查看', 'data': None}
        
        opinion = self._format_opinion(opinion)
        
        timelines = self.timeline_model.get_by_opinion_id(opinion_id)
        for tl in timelines:
            if tl.get('photos'):
                try:
                    tl['photos'] = json.loads(tl['photos'])
                except:
                    tl['photos'] = []
            else:
                tl['photos'] = []
            tl['type_name'] = OpinionTimelineModel.TYPE_MAP.get(tl.get('type', ''), tl.get('type', ''))
        
        rating = self.rating_model.get_by_opinion_id(opinion_id)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'opinion': opinion,
                'timelines': timelines,
                'rating': rating
            }
        }

    def get_opinion_list(self, user_id: int = None, user_role: str = None, 
                         category: str = None, status: str = None, 
                         keyword: str = None, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {}
        
        if user_role == 'resident':
            conditions['submitter_id'] = user_id
        elif user_role == 'staff':
            pass
        elif user_role != 'admin':
            conditions['is_public'] = 1
        
        if category and category in OpinionModel.CATEGORY_MAP:
            conditions['category'] = category
        if status and status in OpinionModel.STATUS_MAP:
            conditions['status'] = status
        
        if keyword:
            result = self._search_with_keyword(conditions, keyword, page, page_size)
        else:
            result = self.opinion_model.get_list(conditions, page, page_size)
        
        result['items'] = [self._format_opinion(item) for item in result.get('items', [])]
        
        return {'code': 0, 'message': 'success', 'data': result}

    def _search_with_keyword(self, conditions: Dict, keyword: str, page: int, page_size: int) -> Dict[str, Any]:
        where_clauses = []
        params = []
        for k, v in conditions.items():
            where_clauses.append(f"{k} = ?")
            params.append(v)
        where_clauses.append("(title LIKE ? OR description LIKE ?)")
        params.extend([f'%{keyword}%', f'%{keyword}%'])
        
        where_sql = " WHERE " + " AND ".join(where_clauses)
        
        count_sql = f"SELECT COUNT(*) as total FROM {OpinionModel.TABLE_NAME}{where_sql}"
        total = self.opinion_model.db.fetch_one(count_sql, tuple(params))['total']
        
        offset = (page - 1) * page_size
        list_sql = f"SELECT * FROM {OpinionModel.TABLE_NAME}{where_sql} ORDER BY created_at DESC LIMIT ? OFFSET ?"
        items = self.opinion_model.db.fetch_all(list_sql, tuple(params + [page_size, offset]))
        
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_pending_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.opinion_model.get_pending_list(page, page_size)
        result['items'] = [self._format_opinion(item) for item in result.get('items', [])]
        return {'code': 0, 'message': 'success', 'data': result}

    def claim_opinion(self, opinion_id: int, handler_id: int, handler_name: str) -> Dict[str, Any]:
        opinion = self.opinion_model.get_by_id(opinion_id)
        if not opinion:
            return {'code': 1, 'message': '意见不存在', 'data': None}
        
        if opinion.get('status') not in [OpinionModel.STATUS_PENDING, OpinionModel.STATUS_ESCALATED]:
            return {'code': 1, 'message': '该意见已被认领或处理', 'data': None}
        
        self.opinion_model.assign_handler(opinion_id, handler_id, handler_name)
        
        self.timeline_model.create(
            opinion_id=opinion_id,
            timeline_type=OpinionTimelineModel.TYPE_CLAIM,
            content='已认领该意见，开始处理',
            operator_id=handler_id,
            operator_name=handler_name
        )
        
        return {'code': 0, 'message': '认领成功', 'data': None}

    def process_opinion(self, opinion_id: int, handler_id: int, handler_name: str, 
                        content: str, photos: List[str] = None, is_resolved: bool = False) -> Dict[str, Any]:
        opinion = self.opinion_model.get_by_id(opinion_id)
        if not opinion:
            return {'code': 1, 'message': '意见不存在', 'data': None}
        
        if opinion.get('handler_id') != handler_id:
            return {'code': 1, 'message': '无权限处理该意见', 'data': None}
        
        if opinion.get('status') in [OpinionModel.STATUS_RESOLVED, OpinionModel.STATUS_CLOSED]:
            return {'code': 1, 'message': '该意见已处理完成', 'data': None}
        
        photos_str = json.dumps(photos or [], ensure_ascii=False)
        
        new_status = OpinionModel.STATUS_RESOLVED if is_resolved else OpinionModel.STATUS_PROCESSING
        self.opinion_model.update_status(opinion_id, new_status)
        
        timeline_type = OpinionTimelineModel.TYPE_RESOLVE if is_resolved else OpinionTimelineModel.TYPE_PROCESS
        self.timeline_model.create(
            opinion_id=opinion_id,
            timeline_type=timeline_type,
            content=content,
            operator_id=handler_id,
            operator_name=handler_name,
            photos=photos_str
        )
        
        msg = '处理完成，等待居民评价' if is_resolved else '处理进度已更新'
        return {'code': 0, 'message': msg, 'data': None}

    def rate_opinion(self, opinion_id: int, rater_id: int, rater_name: str, 
                     rating: int, comment: str = None) -> Dict[str, Any]:
        opinion = self.opinion_model.get_by_id(opinion_id)
        if not opinion:
            return {'code': 1, 'message': '意见不存在', 'data': None}
        
        if opinion.get('submitter_id') != rater_id:
            return {'code': 1, 'message': '只有提交人才能评分', 'data': None}
        
        if opinion.get('status') not in [OpinionModel.STATUS_RESOLVED, OpinionModel.STATUS_CLOSED]:
            return {'code': 1, 'message': '意见尚未处理完成，无法评分', 'data': None}
        
        if rating < 1 or rating > 5:
            return {'code': 1, 'message': '评分必须在1-5之间', 'data': None}
        
        self.rating_model.create(opinion_id, rating, comment, rater_id, rater_name)
        self.opinion_model.set_rating(opinion_id, rating)
        self.opinion_model.update_status(opinion_id, OpinionModel.STATUS_CLOSED)
        
        self.timeline_model.create(
            opinion_id=opinion_id,
            timeline_type=OpinionTimelineModel.TYPE_RATING,
            content=f'{rating}星评价' + (f'，评价：{comment}' if comment else ''),
            operator_id=rater_id,
            operator_name=rater_name
        )
        
        return {'code': 0, 'message': '评分成功', 'data': None}

    def escalate_opinion(self, opinion_id: int, operator_id: int, operator_name: str) -> Dict[str, Any]:
        opinion = self.opinion_model.get_by_id(opinion_id)
        if not opinion:
            return {'code': 1, 'message': '意见不存在', 'data': None}
        
        if opinion.get('escalated'):
            return {'code': 1, 'message': '该意见已升级', 'data': None}
        
        self.opinion_model.set_escalated(opinion_id)
        
        self.timeline_model.create(
            opinion_id=opinion_id,
            timeline_type=OpinionTimelineModel.TYPE_ESCALATE,
            content='街道督办：该意见已升级至街道管理员',
            operator_id=operator_id,
            operator_name=operator_name
        )
        
        return {'code': 0, 'message': '已升级至街道', 'data': None}

    def assign_opinion(self, opinion_id: int, handler_id: int, operator_id: int, operator_name: str) -> Dict[str, Any]:
        opinion = self.opinion_model.get_by_id(opinion_id)
        if not opinion:
            return {'code': 1, 'message': '意见不存在', 'data': None}
        
        handler = self.user_model.get_by_id(handler_id)
        if not handler or handler.get('role') != 'staff':
            return {'code': 1, 'message': '处理人不存在或不是工作人员', 'data': None}
        
        handler_name = handler.get('real_name') or handler.get('username')
        self.opinion_model.assign_handler(opinion_id, handler_id, handler_name)
        
        self.timeline_model.create(
            opinion_id=opinion_id,
            timeline_type=OpinionTimelineModel.TYPE_ASSIGN,
            content=f'管理员分配给：{handler_name}',
            operator_id=operator_id,
            operator_name=operator_name
        )
        
        return {'code': 0, 'message': '分配成功', 'data': None}

    def check_and_escalate_overdue(self) -> Dict[str, Any]:
        overdue_list = self.opinion_model.get_unclaimed_overdue(5)
        count = 0
        for opinion in overdue_list:
            self.opinion_model.set_escalated(opinion['id'])
            self.timeline_model.create(
                opinion_id=opinion['id'],
                timeline_type=OpinionTimelineModel.TYPE_ESCALATE,
                content='系统自动升级：超过5天未认领，已升级至街道',
                operator_id=0,
                operator_name='系统'
            )
            count += 1
        return {'code': 0, 'message': f'已自动升级{count}条逾期意见', 'data': {'count': count}}

    def get_public_list(self, page: int = 1, page_size: int = 20, category: str = None) -> Dict[str, Any]:
        conditions = {'is_public': 1}
        if category and category in OpinionModel.CATEGORY_MAP:
            conditions['category'] = category
        
        result = self.opinion_model.query.paginate(page, page_size, conditions, order_by='closed_at DESC')
        result['items'] = [self._format_opinion(item) for item in result.get('items', [])]
        return {'code': 0, 'message': 'success', 'data': result}

    def get_statistics(self) -> Dict[str, Any]:
        category_stats = self.opinion_model.get_category_stats()
        status_stats = self.opinion_model.get_status_stats()
        monthly_stats = self.opinion_model.get_monthly_stats(6)
        rating_stats = self.opinion_model.get_rating_stats()
        
        category_map = {}
        for item in category_stats:
            cat = item.get('category', '')
            category_map[cat] = {
                'count': item.get('count', 0),
                'name': OpinionModel.CATEGORY_MAP.get(cat, cat)
            }
        
        status_map = {}
        for item in status_stats:
            st = item.get('status', '')
            status_map[st] = {
                'count': item.get('count', 0),
                'name': OpinionModel.STATUS_MAP.get(st, st)
            }
        
        rating_map = {}
        for item in rating_stats:
            rating_map[str(item.get('rating'))] = item.get('count', 0)
        
        total = self.opinion_model.get_total_count()
        resolved = self.opinion_model.get_resolved_count()
        avg_rating = self.opinion_model.get_avg_rating()
        avg_response = self.opinion_model.get_avg_response_days()
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'summary': {
                    'total': total,
                    'resolved': resolved,
                    'resolved_rate': round(resolved / total * 100, 1) if total > 0 else 0,
                    'avg_rating': round(avg_rating, 1),
                    'avg_response_days': round(avg_response, 1)
                },
                'category': category_map,
                'status': status_map,
                'monthly': monthly_stats,
                'rating': rating_map
            }
        }

    def get_categories(self) -> Dict[str, Any]:
        data = [{'key': k, 'name': v} for k, v in OpinionModel.CATEGORY_MAP.items()]
        return {'code': 0, 'message': 'success', 'data': data}

    def get_staff_list(self) -> Dict[str, Any]:
        staff = self.user_model.get_staff_list()
        data = [{
            'id': s.get('id'),
            'username': s.get('username'),
            'real_name': s.get('real_name') or s.get('username'),
            'community': s.get('community')
        } for s in staff]
        return {'code': 0, 'message': 'success', 'data': data}

    def generate_monthly_report(self, year: int, month: int) -> Dict[str, Any]:
        month_str = f"{year}-{month:02d}"
        sql = f"""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved,
                AVG(CASE WHEN response_days IS NOT NULL THEN response_days END) as avg_response,
                AVG(rating) as avg_rating
            FROM {OpinionModel.TABLE_NAME}
            WHERE strftime('%Y-%m', created_at) = ?
        """
        summary = self.opinion_model.db.fetch_one(sql, (month_str,))
        
        category_sql = f"""
            SELECT category, COUNT(*) as count
            FROM {OpinionModel.TABLE_NAME}
            WHERE strftime('%Y-%m', created_at) = ?
            GROUP BY category
        """
        category_data = self.opinion_model.db.fetch_all(category_sql, (month_str,))
        
        rating_sql = f"""
            SELECT rating, COUNT(*) as count
            FROM {OpinionModel.TABLE_NAME}
            WHERE strftime('%Y-%m', created_at) = ? AND rating IS NOT NULL
            GROUP BY rating
        """
        rating_data = self.opinion_model.db.fetch_all(rating_sql, (month_str,))
        
        category_map = {}
        for item in category_data:
            cat = item.get('category', '')
            category_map[cat] = {
                'count': item.get('count', 0),
                'name': OpinionModel.CATEGORY_MAP.get(cat, cat)
            }
        
        rating_map = {}
        for item in rating_data:
            rating_map[str(item.get('rating'))] = item.get('count', 0)
        
        total = summary.get('total', 0) or 0
        resolved = summary.get('resolved', 0) or 0
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'year': year,
                'month': month,
                'summary': {
                    'total': total,
                    'resolved': resolved,
                    'resolved_rate': round(resolved / total * 100, 1) if total > 0 else 0,
                    'avg_response_days': round(summary.get('avg_response') or 0, 1),
                    'avg_rating': round(summary.get('avg_rating') or 0, 1)
                },
                'category': category_map,
                'rating': rating_map
            }
        }
