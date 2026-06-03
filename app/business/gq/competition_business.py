from typing import Dict, Any
from app.model.gq_model import GqCompetitionModel, GqCompetitionEntryModel, GqUserModel, GqScoreModel


class GqCompetitionBusiness:
    def __init__(self):
        self.competition_model = GqCompetitionModel()
        self.entry_model = GqCompetitionEntryModel()
        self.user_model = GqUserModel()
        self.score_model = GqScoreModel()

    def get_competition_list(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        result = self.competition_model.get_all(page, page_size, status)
        items = []
        for item in result.get('items', []):
            item['participant_count'] = self.competition_model.get_participant_count(item.get('id'))
            items.append(item)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_competition_detail(self, competition_id: int) -> Dict[str, Any]:
        competition = self.competition_model.get_by_id(competition_id)
        if not competition:
            return {
                'code': 1,
                'msg': '竞赛不存在',
                'data': None
            }

        competition['participant_count'] = self.competition_model.get_participant_count(competition_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': competition
        }

    def join_competition(self, user_id: int, competition_id: int) -> Dict[str, Any]:
        competition = self.competition_model.get_by_id(competition_id)
        if not competition:
            return {
                'code': 1,
                'msg': '竞赛不存在',
                'data': None
            }

        if competition.get('status') != self.competition_model.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '竞赛未在进行中',
                'data': None
            }

        participant_count = self.competition_model.get_participant_count(competition_id)
        if participant_count >= competition.get('max_participants', 100):
            return {
                'code': 1,
                'msg': '竞赛人数已满',
                'data': None
            }

        existing_entry = self.entry_model.get_by_competition_and_user(competition_id, user_id)
        if existing_entry:
            return {
                'code': 1,
                'msg': '已报名该竞赛',
                'data': None
            }

        entry_id = self.entry_model.create(competition_id, user_id)
        if entry_id > 0:
            entry = self.entry_model.get_by_id(entry_id)
            return {
                'code': 0,
                'msg': '报名成功',
                'data': entry
            }

        return {
            'code': 1,
            'msg': '报名失败',
            'data': None
        }

    def submit_competition_score(self, user_id: int, competition_id: int, score: int,
                                  max_combo: int, accuracy: float, stars: int) -> Dict[str, Any]:
        entry = self.entry_model.get_by_competition_and_user(competition_id, user_id)
        if not entry:
            return {
                'code': 1,
                'msg': '未报名该竞赛',
                'data': None
            }

        competition = self.competition_model.get_by_id(competition_id)
        if not competition:
            return {
                'code': 1,
                'msg': '竞赛不存在',
                'data': None
            }

        if competition.get('status') != self.competition_model.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '竞赛未在进行中',
                'data': None
            }

        affected = self.entry_model.update_entry(entry.get('id'), {
            'score': score,
            'max_combo': max_combo,
            'accuracy': accuracy,
            'stars': stars
        })

        if affected >= 0:
            self.score_model.create(
                user_id=user_id,
                track_id=competition.get('track_id'),
                score=score,
                max_combo=max_combo,
                accuracy=accuracy,
                stars=stars
            )

            updated_entry = self.entry_model.get_by_id(entry.get('id'))
            return {
                'code': 0,
                'msg': '成绩提交成功',
                'data': updated_entry
            }

        return {
            'code': 1,
            'msg': '成绩提交失败',
            'data': None
        }

    def get_competition_leaderboard(self, competition_id: int, page: int = 1,
                                     page_size: int = 10) -> Dict[str, Any]:
        competition = self.competition_model.get_by_id(competition_id)
        if not competition:
            return {
                'code': 1,
                'msg': '竞赛不存在',
                'data': None
            }

        result = self.entry_model.get_competition_entries(competition_id, page, page_size)
        items = []
        for item in result.get('items', []):
            user = self.user_model.get_by_id(item.get('user_id'))
            if user:
                item['nickname'] = user.get('nickname', '')
                item['avatar'] = user.get('avatar', '')
            items.append(item)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_user_competitions(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.entry_model.get_user_entries(user_id, page, page_size)
        items = []
        for item in result.get('items', []):
            competition = self.competition_model.get_by_id(item.get('competition_id'))
            if competition:
                item['competition_title'] = competition.get('title', '')
                item['competition_status'] = competition.get('status')
                item['track_id'] = competition.get('track_id')
            items.append(item)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def create_competition(self, title: str, description: str, track_id: int, start_time: str,
                           end_time: str, max_participants: int = 100, reward_coins: int = 0,
                           reward_gems: int = 0, reward_magic_id: int = 0) -> Dict[str, Any]:
        competition_id = self.competition_model.create(
            title=title,
            description=description,
            track_id=track_id,
            start_time=start_time,
            end_time=end_time,
            max_participants=max_participants,
            reward_coins=reward_coins,
            reward_gems=reward_gems,
            reward_magic_id=reward_magic_id
        )

        if competition_id > 0:
            competition = self.competition_model.get_by_id(competition_id)
            return {
                'code': 0,
                'msg': '竞赛创建成功',
                'data': competition
            }

        return {
            'code': 1,
            'msg': '竞赛创建失败',
            'data': None
        }

    def update_competition(self, competition_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        competition = self.competition_model.get_by_id(competition_id)
        if not competition:
            return {
                'code': 1,
                'msg': '竞赛不存在',
                'data': None
            }

        affected = self.competition_model.update(competition_id, data)
        if affected >= 0:
            updated_competition = self.competition_model.get_by_id(competition_id)
            return {
                'code': 0,
                'msg': '竞赛更新成功',
                'data': updated_competition
            }

        return {
            'code': 1,
            'msg': '竞赛更新失败',
            'data': None
        }
