import json
from typing import Dict, Any, List, Optional
from app.model.poan_model import (
    ProgressModel, ClueModel, CharacterModel, DialogueModel,
    TimelineEventModel, EvidenceModel, QuizModel, EndingModel,
    CaseModel, UserModel
)


class PoanGameBusiness:
    def __init__(self):
        self.progress_model = ProgressModel()
        self.clue_model = ClueModel()
        self.character_model = CharacterModel()
        self.dialogue_model = DialogueModel()
        self.timeline_model = TimelineEventModel()
        self.evidence_model = EvidenceModel()
        self.quiz_model = QuizModel()
        self.ending_model = EndingModel()
        self.case_model = CaseModel()
        self.user_model = UserModel()

    def start_game(self, user_id: int, case_id: int) -> Dict[str, Any]:
        case = self.case_model.get_by_id(case_id)
        if not case:
            return {
                'code': 1,
                'msg': '案件不存在',
                'data': None
            }

        if case.get('status') != CaseModel.STATUS_ONLINE:
            return {
                'code': 1,
                'msg': '该案件暂未上线',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        progress = self.progress_model.get_by_user_case(user_id, case_id)
        if progress:
            self.progress_model.exec.delete_by_id(progress.get('id'))

        progress_id = self.progress_model.create(user_id, case_id)
        if progress_id > 0:
            new_progress = self.progress_model.get_by_id(progress_id)
            return {
                'code': 0,
                'msg': '游戏开始',
                'data': {
                    'progress': self.progress_model.to_dict(new_progress),
                    'case': self.case_model.to_dict(case)
                }
            }

        return {
            'code': 1,
            'msg': '开始游戏失败',
            'data': None
        }

    def get_progress(self, user_id: int, case_id: int) -> Dict[str, Any]:
        progress = self.progress_model.get_by_user_case(user_id, case_id)
        if not progress:
            return {
                'code': 1,
                'msg': '游戏进度不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.progress_model.to_dict(progress)
        }

    def get_case_clues(self, user_id: int, case_id: int) -> Dict[str, Any]:
        case = self.case_model.get_by_id(case_id)
        if not case:
            return {
                'code': 1,
                'msg': '案件不存在',
                'data': None
            }

        progress = self.progress_model.get_by_user_case(user_id, case_id)
        collected_clues = []
        if progress:
            collected_clues = self.progress_model.to_dict(progress).get('collected_clues', [])

        clues = self.clue_model.get_by_case(case_id)
        items = []
        for clue in clues:
            clue_dict = self.clue_model.to_dict(clue)
            clue_dict['collected'] = clue.get('id') in collected_clues
            if not clue_dict['collected']:
                clue_dict['description'] = '??? 尚未收集'
            items.append(clue_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def collect_clue(self, user_id: int, case_id: int, clue_id: int) -> Dict[str, Any]:
        progress = self.progress_model.get_by_user_case(user_id, case_id)
        if not progress:
            return {
                'code': 1,
                'msg': '游戏进度不存在',
                'data': None
            }

        if progress.get('is_completed') == 1:
            return {
                'code': 1,
                'msg': '案件已完成，无法收集线索',
                'data': None
            }

        clue = self.clue_model.get_by_id(clue_id)
        if not clue or clue.get('case_id') != case_id:
            return {
                'code': 1,
                'msg': '线索不存在',
                'data': None
            }

        collected_clues = self.progress_model.to_dict(progress).get('collected_clues', [])
        if clue_id in collected_clues:
            return {
                'code': 0,
                'msg': '线索已收集',
                'data': {
                    'clue': self.clue_model.to_dict(clue),
                    'already_collected': True
                }
            }

        affected = self.progress_model.add_collected_clue(progress.get('id'), clue_id)
        if affected > 0:
            updated_progress = self.progress_model.get_by_id(progress.get('id'))
            return {
                'code': 0,
                'msg': '线索收集成功',
                'data': {
                    'clue': self.clue_model.to_dict(clue),
                    'progress': self.progress_model.to_dict(updated_progress),
                    'already_collected': False
                }
            }

        return {
            'code': 1,
            'msg': '线索收集失败',
            'data': None
        }

    def get_case_characters(self, case_id: int) -> Dict[str, Any]:
        case = self.case_model.get_by_id(case_id)
        if not case:
            return {
                'code': 1,
                'msg': '案件不存在',
                'data': None
            }

        characters = self.character_model.get_by_case(case_id)
        items = [self.character_model.to_dict(char) for char in characters]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def talk_to_character(self, user_id: int, case_id: int, character_id: int, message: str = '') -> Dict[str, Any]:
        progress = self.progress_model.get_by_user_case(user_id, case_id)
        if not progress:
            return {
                'code': 1,
                'msg': '游戏进度不存在',
                'data': None
            }

        if progress.get('is_completed') == 1:
            return {
                'code': 1,
                'msg': '案件已完成',
                'data': None
            }

        character = self.character_model.get_by_id(character_id)
        if not character or character.get('case_id') != case_id:
            return {
                'code': 1,
                'msg': '角色不存在',
                'data': None
            }

        talked_characters = self.progress_model.to_dict(progress).get('talked_characters', [])
        already_talked = character_id in talked_characters

        if not already_talked:
            self.progress_model.add_talked_character(progress.get('id'), character_id)

        reply = self._get_character_reply(user_id, message, character_id, case_id)

        updated_progress = self.progress_model.get_by_id(progress.get('id'))

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'character': self.character_model.to_dict(character),
                'already_talked': already_talked,
                'progress': self.progress_model.to_dict(updated_progress),
                'reply': reply
            }
        }

    def _get_character_reply(self, user_id: int, message: str, character_id: int, case_id: int) -> str:
        message = (message or '').strip().lower()

        dialogues = self.dialogue_model.get_by_character(character_id)
        progress = self.progress_model.get_by_user_case(user_id, case_id)
        collected_clues = []
        if progress:
            collected_clues = self.progress_model.to_dict(progress).get('collected_clues', [])

        for d in dialogues:
            d_dict = self.dialogue_model.to_dict(d)
            trigger_type = d_dict.get('trigger_type')
            question = (d_dict.get('question') or '').lower()
            answer = d_dict.get('answer') or ''

            if trigger_type == 'auto' and not message:
                return answer

            if trigger_type == 'keyword' and message:
                if question and question in message:
                    return answer

            if trigger_type == 'clue' and message:
                try:
                    condition = json.loads(d_dict.get('unlock_condition') or '{}')
                    required_clue = condition.get('required_clue_id')
                    if required_clue and required_clue in collected_clues and question in message:
                        return answer
                except:
                    pass

        default_replies = [
            '这个问题我不太清楚...',
            '抱歉，我无可奉告。',
            '我想你应该去问问其他人。',
            '关于这件事，我没什么好说的。',
            '请不要来打扰我。',
            '嗯...让我想想...好像没什么印象了。'
        ]

        return default_replies[len(message) % len(default_replies)]

    def get_character_dialogues(self, character_id: int, case_id: int) -> Dict[str, Any]:
        character = self.character_model.get_by_id(character_id)
        if not character or character.get('case_id') != case_id:
            return {
                'code': 1,
                'msg': '角色不存在',
                'data': None
            }

        dialogues = self.dialogue_model.get_by_character(character_id)
        items = [self.dialogue_model.to_dict(d) for d in dialogues]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_timeline(self, user_id: int, case_id: int) -> Dict[str, Any]:
        case = self.case_model.get_by_id(case_id)
        if not case:
            return {
                'code': 1,
                'msg': '案件不存在',
                'data': None
            }

        progress = self.progress_model.get_by_user_case(user_id, case_id)
        unlocked_events = []
        if progress:
            unlocked_events = self.progress_model.to_dict(progress).get('timeline_unlocked', [])

        all_events = self.timeline_model.get_by_case(case_id)
        items = []

        for event in all_events:
            is_hidden = event.get('is_hidden', 0) == 1
            if is_hidden and event.get('id') not in unlocked_events:
                continue

            event_dict = self.timeline_model.to_dict(event)
            event_dict['is_unlocked'] = True
            items.append(event_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def submit_evidence(self, user_id: int, case_id: int, clue_ids: List[int], conclusion: str) -> Dict[str, Any]:
        progress = self.progress_model.get_by_user_case(user_id, case_id)
        if not progress:
            return {
                'code': 1,
                'msg': '游戏进度不存在',
                'data': None
            }

        if progress.get('is_completed') == 1:
            return {
                'code': 1,
                'msg': '案件已完成',
                'data': None
            }

        collected_clues = self.progress_model.to_dict(progress).get('collected_clues', [])
        for clue_id in clue_ids:
            if clue_id not in collected_clues:
                return {
                    'code': 1,
                    'msg': '存在未收集的线索',
                    'data': None
                }

        check_result = self.evidence_model.check_answer(case_id, clue_ids, conclusion)
        if check_result is None:
            return {
                'code': 0,
                'msg': '证据链不正确',
                'data': {
                    'is_correct': 0,
                    'score': 0,
                    'explanation': '证据链和结论不匹配，请重新整理思路。'
                }
            }

        is_correct = check_result.get('is_correct', 0)
        explanation = check_result.get('explanation', '')

        score = 0
        if is_correct == 1:
            score = 100
        elif is_correct == 0:
            score = 50

        current_score = progress.get('score', 0)
        new_score = max(current_score, score)

        affected = self.progress_model.update_score(progress.get('id'), new_score)
        if affected > 0:
            self.progress_model.update_stage(progress.get('id'), ProgressModel.TIMELINE)

        updated_progress = self.progress_model.get_by_id(progress.get('id'))

        if is_correct == 1:
            exp_reward = 50
            self.user_model.add_experience(user_id, exp_reward)

        return {
            'code': 0,
            'msg': '提交成功',
            'data': {
                'is_correct': is_correct,
                'score': score,
                'explanation': explanation,
                'total_score': new_score,
                'progress': self.progress_model.to_dict(updated_progress),
                'exp_reward': 50 if is_correct == 1 else 0
            }
        }

    def get_quiz(self, case_id: int) -> Dict[str, Any]:
        case = self.case_model.get_by_id(case_id)
        if not case:
            return {
                'code': 1,
                'msg': '案件不存在',
                'data': None
            }

        quizzes = self.quiz_model.get_by_case(case_id)
        items = []
        for quiz in quizzes:
            quiz_dict = self.quiz_model.to_dict(quiz)
            quiz_dict.pop('correct_answer', None)
            quiz_dict.pop('explanation', None)
            items.append(quiz_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def answer_quiz(self, user_id: int, case_id: int, quiz_id: int, answer: str) -> Dict[str, Any]:
        progress = self.progress_model.get_by_user_case(user_id, case_id)
        if not progress:
            return {
                'code': 1,
                'msg': '游戏进度不存在',
                'data': None
            }

        quiz = self.quiz_model.get_by_id(quiz_id)
        if not quiz or quiz.get('case_id') != case_id:
            return {
                'code': 1,
                'msg': '题目不存在',
                'data': None
            }

        is_correct = answer == quiz.get('correct_answer', '')
        reward_exp = quiz.get('reward_exp', 0) if is_correct else 0

        if reward_exp > 0:
            self.user_model.add_experience(user_id, reward_exp)

        return {
            'code': 0,
            'msg': '提交成功',
            'data': {
                'is_correct': is_correct,
                'correct_answer': quiz.get('correct_answer'),
                'explanation': quiz.get('explanation'),
                'reward_exp': reward_exp
            }
        }

    def submit_ending(self, user_id: int, case_id: int, ending_type: str) -> Dict[str, Any]:
        progress = self.progress_model.get_by_user_case(user_id, case_id)
        if not progress:
            return {
                'code': 1,
                'msg': '游戏进度不存在',
                'data': None
            }

        if progress.get('is_completed') == 1:
            return {
                'code': 1,
                'msg': '案件已完成',
                'data': None
            }

        endings = self.ending_model.get_by_type(case_id, ending_type)
        if not endings:
            return {
                'code': 1,
                'msg': '结局类型不存在',
                'data': None
            }

        ending = endings[0]
        score = progress.get('score', 0)
        total_exp = 0

        if ending_type == EndingModel.TRUTH:
            total_exp = 100
        elif ending_type == EndingModel.PARTIAL:
            total_exp = 50
        elif ending_type == EndingModel.HIDDEN:
            total_exp = 150
        else:
            total_exp = 20

        if total_exp > 0:
            self.user_model.add_experience(user_id, total_exp)

        self.progress_model.complete_case(progress.get('id'), ending_type, score)
        self.progress_model.update_stage(progress.get('id'), ProgressModel.ENDING)

        updated_progress = self.progress_model.get_by_id(progress.get('id'))

        return {
            'code': 0,
            'msg': '案件完成',
            'data': {
                'ending': self.ending_model.to_dict(ending),
                'progress': self.progress_model.to_dict(updated_progress),
                'total_exp': total_exp,
                'final_score': score
            }
        }

    def get_my_cases(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        result = self.progress_model.get_by_user(user_id, page, page_size)
        items = []

        for progress in result.get('items', []):
            case_id = progress.get('case_id')
            case = self.case_model.get_by_id(case_id)
            if case:
                progress_dict = self.progress_model.to_dict(progress)
                progress_dict['case'] = self.case_model.to_dict(case)
                items.append(progress_dict)

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

    def get_evidence_answer(self, case_id: int) -> Dict[str, Any]:
        case = self.case_model.get_by_id(case_id)
        if not case:
            return {
                'code': 1,
                'msg': '案件不存在',
                'data': None
            }

        evidences = self.evidence_model.get_by_case(case_id)
        correct_evidence = None
        for ev in evidences:
            if ev.get('is_correct') == 1:
                correct_evidence = ev
                break

        if correct_evidence:
            return {
                'code': 0,
                'msg': 'success',
                'data': self.evidence_model.to_dict(correct_evidence)
            }

        return {
            'code': 1,
            'msg': '暂无正确答案',
            'data': None
        }
