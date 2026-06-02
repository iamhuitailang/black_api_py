from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class StartGameRequest(BaseModel):
    case_id: int = Field(..., description="案件ID")


class CollectClueRequest(BaseModel):
    case_id: int = Field(..., description="案件ID")
    clue_id: int = Field(..., description="线索ID")


class TalkCharacterRequest(BaseModel):
    case_id: int = Field(..., description="案件ID")
    character_id: int = Field(..., description="角色ID")
    message: Optional[str] = Field('', description="玩家发送的消息")


class SubmitEvidenceRequest(BaseModel):
    case_id: int = Field(..., description="案件ID")
    clue_ids: str = Field(..., description="线索ID列表，逗号分隔")
    conclusion: str = Field(..., description="推理结论")


class AnswerQuizRequest(BaseModel):
    case_id: int = Field(..., description="案件ID")
    quiz_id: int = Field(..., description="问答题ID")
    answer: str = Field(..., description="答案")


class SubmitEndingRequest(BaseModel):
    case_id: int = Field(..., description="案件ID")
    ending_type: str = Field(..., description="结局类型")


class PoanGameController:
    def __init__(self):
        from app.business.poan.game_business import PoanGameBusiness
        from app.business.poan.user_business import PoanUserBusiness
        self.game_business = PoanGameBusiness()
        self.user_business = PoanUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionPoanGameStartPost(self, request: Request, body: StartGameRequest,
                                 authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.start_game(
            user_id=user.get('id'),
            case_id=body.case_id
        )

    def ActionPoanGameProgressGet(self, request: Request, case_id: int = Query(..., description="案件ID"),
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_progress(
            user_id=user.get('id'),
            case_id=case_id
        )

    def ActionPoanGameCluesGet(self, request: Request, case_id: int = Query(..., description="案件ID"),
                                authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_case_clues(
            user_id=user.get('id'),
            case_id=case_id
        )

    def ActionPoanGameClueCollectPost(self, request: Request, body: CollectClueRequest,
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.collect_clue(
            user_id=user.get('id'),
            case_id=body.case_id,
            clue_id=body.clue_id
        )

    def ActionPoanGameCharactersGet(self, request: Request, case_id: int = Query(..., description="案件ID"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_case_characters(
            case_id=case_id
        )

    def ActionPoanGameCharacterTalkPost(self, request: Request, body: TalkCharacterRequest,
                                         authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.talk_to_character(
            user_id=user.get('id'),
            case_id=body.case_id,
            character_id=body.character_id,
            message=body.message
        )

    def ActionPoanGameDialoguesGet(self, request: Request,
                                    character_id: int = Query(..., description="角色ID"),
                                    case_id: int = Query(..., description="案件ID"),
                                    authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_character_dialogues(
            character_id=character_id,
            case_id=case_id
        )

    def ActionPoanGameTimelineGet(self, request: Request, case_id: int = Query(..., description="案件ID"),
                                   authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_timeline(
            user_id=user.get('id'),
            case_id=case_id
        )

    def ActionPoanGameEvidenceSubmitPost(self, request: Request, body: SubmitEvidenceRequest,
                                          authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        clue_id_list = [int(x.strip()) for x in body.clue_ids.split(',') if x.strip()]
        return self.game_business.submit_evidence(
            user_id=user.get('id'),
            case_id=body.case_id,
            clue_ids=clue_id_list,
            conclusion=body.conclusion
        )

    def ActionPoanGameQuizGet(self, request: Request, case_id: int = Query(..., description="案件ID"),
                               authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_quiz(
            case_id=case_id
        )

    def ActionPoanGameQuizAnswerPost(self, request: Request, body: AnswerQuizRequest,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.answer_quiz(
            user_id=user.get('id'),
            case_id=body.case_id,
            quiz_id=body.quiz_id,
            answer=body.answer
        )

    def ActionPoanGameEndingSubmitPost(self, request: Request, body: SubmitEndingRequest,
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.submit_ending(
            user_id=user.get('id'),
            case_id=body.case_id,
            ending_type=body.ending_type
        )

    def ActionPoanGameMyCasesGet(self, request: Request,
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_my_cases(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )
