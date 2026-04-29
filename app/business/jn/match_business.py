from typing import Dict, Any, List, Optional
from app.model.jn import SkillModel, UserModel, CategoryModel


class JnMatchBusiness:
    def __init__(self):
        self.skill_model = SkillModel()
        self.user_model = UserModel()
        self.category_model = CategoryModel()

    def find_matches(self, user_id: int, page: int = 1, page_size: int = 10,
                      keyword: str = None, category: str = None) -> Dict[str, Any]:
        user_offer_skills = self.skill_model.get_by_user(user_id, SkillModel.TYPE_OFFER)
        user_need_skills = self.skill_model.get_by_user(user_id, SkillModel.TYPE_NEED)

        if not user_offer_skills or not user_need_skills:
            return {
                'code': 0,
                'msg': 'success',
                'data': {
                    'items': [],
                    'total': 0,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': 0
                }
            }

        user_offer_categories = set(s.get('category') for s in user_offer_skills)
        user_need_categories = set(s.get('category') for s in user_need_skills)

        if category:
            user_need_categories = {category}

        matches = []
        matched_user_ids = set()

        for need_category in user_need_categories:
            potential_users = self._find_potential_users(
                user_id, need_category, user_offer_categories
            )
            
            for potential_user_id in potential_users:
                if potential_user_id in matched_user_ids:
                    continue
                
                match_score = self._calculate_match_score(
                    user_id, potential_user_id,
                    user_offer_skills, user_need_skills
                )
                
                if match_score > 0:
                    matched_user_ids.add(potential_user_id)
                    user_info = self.user_model.get_by_id(potential_user_id)
                    if user_info:
                        matches.append({
                            'user': self.user_model.to_public_dict(user_info),
                            'match_score': match_score,
                            'common_categories': list(self._find_common_categories(
                                user_offer_categories, user_need_categories,
                                potential_user_id
                            ))
                        })

        if keyword:
            keyword_lower = keyword.lower()
            matches = [m for m in matches if (
                keyword_lower in (m.get('user', {}).get('nickname') or '').lower() or
                keyword_lower in (m.get('user', {}).get('phone') or '').lower()
            )]

        matches.sort(key=lambda x: x['match_score'], reverse=True)

        start = (page - 1) * page_size
        end = start + page_size
        paginated_items = matches[start:end]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': paginated_items,
                'total': len(matches),
                'page': page,
                'page_size': page_size,
                'total_pages': (len(matches) + page_size - 1) // page_size
            }
        }

    def _find_potential_users(self, user_id: int, need_category: str,
                               offer_categories: set) -> List[int]:
        potential_users = set()

        need_skills = self.skill_model.get_offer_skills_by_category(need_category, user_id)
        for skill in need_skills:
            skill_user_id = skill.get('user_id')
            if skill_user_id == user_id:
                continue
            
            user_offers = self.skill_model.get_by_user(skill_user_id, SkillModel.TYPE_OFFER)
            user_needs = self.skill_model.get_by_user(skill_user_id, SkillModel.TYPE_NEED)
            
            user_need_categories = set(s.get('category') for s in user_needs)
            
            if offer_categories & user_need_categories:
                potential_users.add(skill_user_id)

        return list(potential_users)

    def _calculate_match_score(self, user_id: int, other_user_id: int,
                                user_offers: List[Dict], user_needs: List[Dict]) -> int:
        score = 0

        other_offers = self.skill_model.get_by_user(other_user_id, SkillModel.TYPE_OFFER)
        other_needs = self.skill_model.get_by_user(other_user_id, SkillModel.TYPE_NEED)

        user_offer_categories = set(s.get('category') for s in user_offers)
        user_need_categories = set(s.get('category') for s in user_needs)
        other_offer_categories = set(s.get('category') for s in other_offers)
        other_need_categories = set(s.get('category') for s in other_needs)

        for need_cat in user_need_categories:
            if need_cat in other_offer_categories:
                score += 30

        for need_cat in other_need_categories:
            if need_cat in user_offer_categories:
                score += 30

        user_offer_names = set(s.get('name', '').lower() for s in user_offers)
        user_need_names = set(s.get('name', '').lower() for s in user_needs)
        other_offer_names = set(s.get('name', '').lower() for s in other_offers)
        other_need_names = set(s.get('name', '').lower() for s in other_needs)

        for need_name in user_need_names:
            if need_name in other_offer_names:
                score += 20

        for need_name in other_need_names:
            if need_name in user_offer_names:
                score += 20

        return min(score, 100)

    def _find_common_categories(self, user_offer_cats: set, user_need_cats: set,
                                 other_user_id: int) -> set:
        other_offers = self.skill_model.get_by_user(other_user_id, SkillModel.TYPE_OFFER)
        other_needs = self.skill_model.get_by_user(other_user_id, SkillModel.TYPE_NEED)

        other_offer_cats = set(s.get('category') for s in other_offers)
        other_need_cats = set(s.get('category') for s in other_needs)

        common = set()
        for need_cat in user_need_cats:
            if need_cat in other_offer_cats:
                common.add(need_cat)

        for need_cat in other_need_cats:
            if need_cat in user_offer_cats:
                common.add(need_cat)

        return common

    def get_match_detail(self, user_id: int, other_user_id: int) -> Dict[str, Any]:
        if user_id == other_user_id:
            return {
                'code': 1,
                'msg': '不能查看自己的匹配详情',
                'data': None
            }

        other_user = self.user_model.get_by_id(other_user_id)
        if not other_user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        user_offers = self.skill_model.get_by_user(user_id, SkillModel.TYPE_OFFER)
        user_needs = self.skill_model.get_by_user(user_id, SkillModel.TYPE_NEED)
        other_offers = self.skill_model.get_by_user(other_user_id, SkillModel.TYPE_OFFER)
        other_needs = self.skill_model.get_by_user(other_user_id, SkillModel.TYPE_NEED)

        match_score = self._calculate_match_score(user_id, other_user_id, user_offers, user_needs)

        user_offer_cats = set(s.get('category') for s in user_offers)
        user_need_cats = set(s.get('category') for s in user_needs)
        other_offer_cats = set(s.get('category') for s in other_offers)
        other_need_cats = set(s.get('category') for s in other_needs)

        i_can_teach = [self.skill_model.to_dict(s) for s in user_offers if s.get('category') in other_need_cats]
        i_can_learn = [self.skill_model.to_dict(s) for s in other_offers if s.get('category') in user_need_cats]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'user': self.user_model.to_public_dict(other_user),
                'match_score': match_score,
                'i_can_teach': i_can_teach,
                'i_can_learn': i_can_learn,
                'user_offers': [self.skill_model.to_dict(s) for s in user_offers],
                'user_needs': [self.skill_model.to_dict(s) for s in user_needs],
                'other_offers': [self.skill_model.to_dict(s) for s in other_offers],
                'other_needs': [self.skill_model.to_dict(s) for s in other_needs]
            }
        }
