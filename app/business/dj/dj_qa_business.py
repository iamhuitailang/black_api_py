from typing import Dict, Any, List, Optional
from app.model.dj import QAModel, MarketModel, UserModel


class DjQABusiness:
    def __init__(self):
        self.qa_model = QAModel()
        self.market_model = MarketModel()
        self.user_model = UserModel()

    def create_question(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not data.get('question') or not data.get('question').strip():
            return {
                'code': 1,
                'msg': '问题内容不能为空',
                'data': None
            }

        market_id = data.get('market_id')
        if market_id:
            market = self.market_model.get_by_id(market_id)
            if not market:
                return {
                    'code': 1,
                    'msg': '集市不存在',
                    'data': None
                }

        question_data = {
            'user_id': user_id,
            'market_id': market_id,
            'question': data.get('question').strip(),
            'status': 1
        }

        qa_id = self.qa_model.create(question_data)
        if qa_id > 0:
            return {
                'code': 0,
                'msg': '提问成功',
                'data': {'id': qa_id}
            }

        return {
            'code': 1,
            'msg': '提问失败',
            'data': None
        }

    def get_qa_detail(self, qa_id: int) -> Dict[str, Any]:
        qa = self.qa_model.get_by_id(qa_id)
        if not qa:
            return {
                'code': 1,
                'msg': '问题不存在',
                'data': None
            }

        market = self.market_model.get_by_id(qa.get('market_id')) if qa.get('market_id') else None
        questioner = self.user_model.get_by_id(qa.get('user_id')) if qa.get('user_id') else None
        answerer = self.user_model.get_by_id(qa.get('answerer_id')) if qa.get('answerer_id') else None

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'id': qa.get('id'),
                'user_id': qa.get('user_id'),
                'user_nickname': questioner.get('nickname') if questioner else None,
                'user_avatar': questioner.get('avatar') if questioner else None,
                'market_id': qa.get('market_id'),
                'market_name': market.get('name') if market else None,
                'question': qa.get('question'),
                'best_answer': qa.get('best_answer'),
                'answerer_id': qa.get('answerer_id'),
                'answerer_nickname': answerer.get('nickname') if answerer else None,
                'is_answered': qa.get('is_answered'),
                'status': qa.get('status'),
                'created_at': qa.get('created_at')
            }
        }

    def get_market_questions(self, market_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        market = self.market_model.get_by_id(market_id)
        if not market:
            return {
                'code': 1,
                'msg': '集市不存在',
                'data': None
            }

        result = self.qa_model.paginate(page, page_size, {'market_id': market_id, 'status': 1})

        questions = []
        for item in result.get('items', []):
            questioner = self.user_model.get_by_id(item.get('user_id')) if item.get('user_id') else None
            answerer = self.user_model.get_by_id(item.get('answerer_id')) if item.get('answerer_id') else None

            questions.append({
                'id': item.get('id'),
                'user_id': item.get('user_id'),
                'user_nickname': questioner.get('nickname') if questioner else None,
                'question': item.get('question'),
                'best_answer': item.get('best_answer'),
                'is_answered': item.get('is_answered'),
                'answerer_nickname': answerer.get('nickname') if answerer else None,
                'created_at': item.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': questions,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_user_questions(self, user_id: int) -> Dict[str, Any]:
        questions = self.qa_model.get_by_user_id(user_id)

        result = []
        for qa in questions:
            market = self.market_model.get_by_id(qa.get('market_id')) if qa.get('market_id') else None
            answerer = self.user_model.get_by_id(qa.get('answerer_id')) if qa.get('answerer_id') else None

            result.append({
                'id': qa.get('id'),
                'market_id': qa.get('market_id'),
                'market_name': market.get('name') if market else None,
                'question': qa.get('question'),
                'best_answer': qa.get('best_answer'),
                'is_answered': qa.get('is_answered'),
                'answerer_nickname': answerer.get('nickname') if answerer else None,
                'status': qa.get('status'),
                'created_at': qa.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_pending_questions(self, limit: int = 20) -> Dict[str, Any]:
        questions = self.qa_model.get_pending_questions(limit=limit)

        result = []
        for qa in questions:
            market = self.market_model.get_by_id(qa.get('market_id')) if qa.get('market_id') else None
            questioner = self.user_model.get_by_id(qa.get('user_id')) if qa.get('user_id') else None

            result.append({
                'id': qa.get('id'),
                'user_id': qa.get('user_id'),
                'user_nickname': questioner.get('nickname') if questioner else None,
                'market_id': qa.get('market_id'),
                'market_name': market.get('name') if market else None,
                'question': qa.get('question'),
                'created_at': qa.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_recent_questions(self, limit: int = 20) -> Dict[str, Any]:
        questions = self.qa_model.get_recent_questions(limit=limit)

        result = []
        for qa in questions:
            market = self.market_model.get_by_id(qa.get('market_id')) if qa.get('market_id') else None
            questioner = self.user_model.get_by_id(qa.get('user_id')) if qa.get('user_id') else None

            result.append({
                'id': qa.get('id'),
                'user_id': qa.get('user_id'),
                'user_nickname': questioner.get('nickname') if questioner else None,
                'market_id': qa.get('market_id'),
                'market_name': market.get('name') if market else None,
                'question': qa.get('question'),
                'best_answer': qa.get('best_answer'),
                'is_answered': qa.get('is_answered'),
                'created_at': qa.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def answer_question(self, qa_id: int, answer: str, answerer_id: int) -> Dict[str, Any]:
        if not answer or not answer.strip():
            return {
                'code': 1,
                'msg': '回答内容不能为空',
                'data': None
            }

        qa = self.qa_model.get_by_id(qa_id)
        if not qa:
            return {
                'code': 1,
                'msg': '问题不存在',
                'data': None
            }

        if qa.get('is_answered'):
            return {
                'code': 1,
                'msg': '该问题已有回答',
                'data': None
            }

        affected = self.qa_model.answer(qa_id, answer.strip(), answerer_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '回答成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '回答失败',
            'data': None
        }

    def search_questions(self, keyword: str, limit: int = 20) -> Dict[str, Any]:
        if not keyword or not keyword.strip():
            return {
                'code': 1,
                'msg': '搜索关键词不能为空',
                'data': None
            }

        questions = self.qa_model.search_questions(keyword.strip(), limit=limit)

        result = []
        for qa in questions:
            market = self.market_model.get_by_id(qa.get('market_id')) if qa.get('market_id') else None
            questioner = self.user_model.get_by_id(qa.get('user_id')) if qa.get('user_id') else None

            result.append({
                'id': qa.get('id'),
                'user_id': qa.get('user_id'),
                'user_nickname': questioner.get('nickname') if questioner else None,
                'market_id': qa.get('market_id'),
                'market_name': market.get('name') if market else None,
                'question': qa.get('question'),
                'best_answer': qa.get('best_answer'),
                'is_answered': qa.get('is_answered'),
                'created_at': qa.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def update_status(self, qa_id: int, status: int) -> Dict[str, Any]:
        qa = self.qa_model.get_by_id(qa_id)
        if not qa:
            return {
                'code': 1,
                'msg': '问题不存在',
                'data': None
            }

        affected = self.qa_model.update_status(qa_id, status)
        if affected > 0:
            return {
                'code': 0,
                'msg': '更新成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_question(self, qa_id: int, user_id: int = None) -> Dict[str, Any]:
        qa = self.qa_model.get_by_id(qa_id)
        if not qa:
            return {
                'code': 1,
                'msg': '问题不存在',
                'data': None
            }

        if user_id is not None and qa.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限删除此问题',
                'data': None
            }

        affected = self.qa_model.delete(qa_id)
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

    def get_all_questions(self, page: int = 1, page_size: int = 10, status: int = None, is_answered: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if is_answered is not None:
            conditions['is_answered'] = is_answered

        result = self.qa_model.paginate(page, page_size, conditions)

        questions = []
        for item in result.get('items', []):
            market = self.market_model.get_by_id(item.get('market_id')) if item.get('market_id') else None
            questioner = self.user_model.get_by_id(item.get('user_id')) if item.get('user_id') else None
            answerer = self.user_model.get_by_id(item.get('answerer_id')) if item.get('answerer_id') else None

            questions.append({
                'id': item.get('id'),
                'user_id': item.get('user_id'),
                'user_nickname': questioner.get('nickname') if questioner else None,
                'market_id': item.get('market_id'),
                'market_name': market.get('name') if market else None,
                'question': item.get('question'),
                'best_answer': item.get('best_answer'),
                'is_answered': item.get('is_answered'),
                'answerer_nickname': answerer.get('nickname') if answerer else None,
                'status': item.get('status'),
                'created_at': item.get('created_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': questions,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_statistics(self) -> Dict[str, Any]:
        total = self.qa_model.count()
        active = self.qa_model.count({'status': 1})
        answered = self.qa_model.count({'is_answered': 1})
        pending = self.qa_model.count({'is_answered': 0, 'status': 1})

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_questions': total,
                'active_questions': active,
                'answered_questions': answered,
                'pending_questions': pending
            }
        }
