from typing import Dict, Any, List
from app.model.jn import SkillModel, ExchangeModel, UserModel, ReviewModel, CategoryModel


class JnStatisticsBusiness:
    def __init__(self):
        self.skill_model = SkillModel()
        self.exchange_model = ExchangeModel()
        self.user_model = UserModel()
        self.review_model = ReviewModel()
        self.category_model = CategoryModel()

    def get_dashboard_stats(self) -> Dict[str, Any]:
        total_users = self._get_total_users()
        total_skills = self._get_total_skills()
        total_exchanges = self._get_total_exchanges()
        completed_exchanges = self._get_completed_exchanges()
        success_rate = self._calculate_success_rate(total_exchanges, completed_exchanges)

        hot_skills = self.get_hot_skills(limit=5)
        recent_exchanges = self._get_recent_exchanges(limit=5)
        category_stats = self.get_category_stats()

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'total_skills': total_skills,
                'total_exchanges': total_exchanges,
                'completed_exchanges': completed_exchanges,
                'success_rate': success_rate,
                'hot_skills': hot_skills,
                'recent_exchanges': recent_exchanges,
                'category_stats': category_stats
            }
        }

    def _get_total_users(self) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.user_model.TABLE_NAME}"
        result = self.user_model.db.fetch_one(sql)
        return result.get('total', 0) if result else 0

    def _get_total_skills(self) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.skill_model.TABLE_NAME} WHERE is_active = 1"
        result = self.skill_model.db.fetch_one(sql)
        return result.get('total', 0) if result else 0

    def _get_total_exchanges(self) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.exchange_model.TABLE_NAME}"
        result = self.exchange_model.db.fetch_one(sql)
        return result.get('total', 0) if result else 0

    def _get_completed_exchanges(self) -> int:
        sql = f"SELECT COUNT(*) as total FROM {self.exchange_model.TABLE_NAME} WHERE status = ?"
        result = self.exchange_model.db.fetch_one(sql, (ExchangeModel.STATUS_COMPLETED,))
        return result.get('total', 0) if result else 0

    def _calculate_success_rate(self, total: int, completed: int) -> float:
        if total == 0:
            return 0.0
        return round((completed / total) * 100, 1)

    def get_hot_skills(self, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT name, category, type, COUNT(*) as count
            FROM {self.skill_model.TABLE_NAME}
            WHERE is_active = 1
            GROUP BY name, category, type
            ORDER BY count DESC
            LIMIT ?
        """
        results = self.skill_model.db.fetch_all(sql, (limit,))
        
        hot_skills = []
        for row in results:
            category_info = self.category_model.get_by_code(row.get('category'))
            hot_skills.append({
                'name': row.get('name'),
                'category': row.get('category'),
                'category_name': category_info.get('name') if category_info else row.get('category'),
                'type': row.get('type'),
                'type_text': '提供' if row.get('type') == SkillModel.TYPE_OFFER else '需求',
                'count': row.get('count')
            })

        return hot_skills

    def get_category_stats(self) -> List[Dict[str, Any]]:
        parent_categories = self.category_model.get_parents(only_active=True)
        
        stats = []
        for parent in parent_categories:
            children = self.category_model.get_children(parent.get('code'), only_active=True)
            all_codes = [parent.get('code')] + [c.get('code') for c in children]
            
            placeholders = ','.join(['?' for _ in all_codes])
            
            sql_offer = f"""
                SELECT COUNT(*) as total FROM {self.skill_model.TABLE_NAME}
                WHERE category IN ({placeholders}) AND type = ? AND is_active = 1
            """
            sql_need = f"""
                SELECT COUNT(*) as total FROM {self.skill_model.TABLE_NAME}
                WHERE category IN ({placeholders}) AND type = ? AND is_active = 1
            """
            
            params = tuple(all_codes + [SkillModel.TYPE_OFFER])
            offer_result = self.skill_model.db.fetch_one(sql_offer, params)
            
            params_need = tuple(all_codes + [SkillModel.TYPE_NEED])
            need_result = self.skill_model.db.fetch_one(sql_need, params_need)
            
            offer_count = offer_result.get('total', 0) if offer_result else 0
            need_count = need_result.get('total', 0) if need_result else 0
            
            stats.append({
                'code': parent.get('code'),
                'name': parent.get('name'),
                'offer_count': offer_count,
                'need_count': need_count,
                'total_count': offer_count + need_count
            })

        stats.sort(key=lambda x: x['total_count'], reverse=True)
        return stats

    def _get_recent_exchanges(self, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.exchange_model.TABLE_NAME}
            ORDER BY id DESC
            LIMIT ?
        """
        results = self.exchange_model.db.fetch_all(sql, (limit,))
        
        exchanges = []
        for row in results:
            item = self.exchange_model.to_dict(row)
            
            from_user = self.user_model.get_by_id(row.get('from_user'))
            to_user = self.user_model.get_by_id(row.get('to_user'))
            
            item['from_user_nickname'] = from_user.get('nickname') if from_user else '未知'
            item['to_user_nickname'] = to_user.get('nickname') if to_user else '未知'
            
            exchanges.append(item)

        return exchanges

    def get_exchange_statistics(self) -> Dict[str, Any]:
        status_stats = []
        statuses = [
            ExchangeModel.STATUS_PENDING,
            ExchangeModel.STATUS_ACCEPTED,
            ExchangeModel.STATUS_IN_PROGRESS,
            ExchangeModel.STATUS_COMPLETED,
            ExchangeModel.STATUS_REJECTED,
            ExchangeModel.STATUS_CANCELLED
        ]

        for status in statuses:
            sql = f"SELECT COUNT(*) as total FROM {self.exchange_model.TABLE_NAME} WHERE status = ?"
            result = self.exchange_model.db.fetch_one(sql, (status,))
            count = result.get('total', 0) if result else 0
            status_stats.append({
                'status': status,
                'count': count
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'status_stats': status_stats
            }
        }

    def get_user_statistics(self, user_id: int) -> Dict[str, Any]:
        offer_skills = self.skill_model.get_by_user(user_id, SkillModel.TYPE_OFFER)
        need_skills = self.skill_model.get_by_user(user_id, SkillModel.TYPE_NEED)
        
        exchanges = self.exchange_model.get_by_user(user_id)
        
        completed_count = 0
        pending_count = 0
        for ex in exchanges:
            status = ex.get('status')
            if status == ExchangeModel.STATUS_COMPLETED:
                completed_count += 1
            elif status in [ExchangeModel.STATUS_PENDING, ExchangeModel.STATUS_ACCEPTED, ExchangeModel.STATUS_IN_PROGRESS]:
                pending_count += 1

        avg_score = self.review_model.get_user_avg_score(user_id)
        review_count = self.review_model.get_user_review_count(user_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'offer_skill_count': len(offer_skills),
                'need_skill_count': len(need_skills),
                'total_exchange_count': len(exchanges),
                'completed_exchange_count': completed_count,
                'pending_exchange_count': pending_count,
                'avg_score': avg_score,
                'review_count': review_count
            }
        }
