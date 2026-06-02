from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCaseRequest(BaseModel):
    title: str = Field(..., description="案件标题")
    era: str = Field(..., description="时代")
    year: str = Field(..., description="年代")
    description: Optional[str] = Field(None, description="简介")
    background_story: Optional[str] = Field(None, description="背景故事")
    difficulty: int = Field(1, description="难度1-5")
    cover_image: Optional[str] = Field(None, description="封面图")
    order_num: int = Field(0, description="排序")


class UpdateCaseRequest(BaseModel):
    title: Optional[str] = Field(None)
    era: Optional[str] = Field(None)
    year: Optional[str] = Field(None)
    description: Optional[str] = Field(None)
    background_story: Optional[str] = Field(None)
    difficulty: Optional[int] = Field(None)
    cover_image: Optional[str] = Field(None)
    status: Optional[int] = Field(None)
    order_num: Optional[int] = Field(None)


class PoanCaseController:
    def __init__(self):
        from app.business.poan.case_business import PoanCaseBusiness
        from app.business.poan.user_business import PoanUserBusiness
        self.case_business = PoanCaseBusiness()
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

    def ActionPoanCaseCreatePost(self, request: Request, body: CreateCaseRequest,
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.case_business.create_case(
            title=body.title,
            era=body.era,
            year=body.year,
            description=body.description,
            background_story=body.background_story,
            difficulty=body.difficulty,
            cover_image=body.cover_image,
            order_num=body.order_num
        )

    def ActionPoanCaseUpdatePost(self, request: Request, case_id: int = Query(..., description="案件ID"),
                                  body: UpdateCaseRequest = None,
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.title is not None:
            data['title'] = body.title
        if body.era is not None:
            data['era'] = body.era
        if body.year is not None:
            data['year'] = body.year
        if body.description is not None:
            data['description'] = body.description
        if body.background_story is not None:
            data['background_story'] = body.background_story
        if body.difficulty is not None:
            data['difficulty'] = body.difficulty
        if body.cover_image is not None:
            data['cover_image'] = body.cover_image
        if body.status is not None:
            data['status'] = body.status
        if body.order_num is not None:
            data['order_num'] = body.order_num

        return self.case_business.update_case(
            case_id=case_id,
            data=data
        )

    def ActionPoanCaseDeletePost(self, request: Request, case_id: int = Query(..., description="案件ID"),
                                  authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.case_business.delete_case(case_id=case_id)

    def ActionPoanCaseDetailGet(self, request: Request, case_id: int = Query(..., description="案件ID")):
        return self.case_business.get_case_detail(case_id=case_id)

    def ActionPoanCaseListGet(self, request: Request,
                               page: int = Query(1, ge=1, description="页码"),
                               page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                               era: Optional[str] = Query(None, description="时代"),
                               difficulty: Optional[int] = Query(None, description="难度"),
                               keyword: Optional[str] = Query(None, description="搜索关键词"),
                               status: Optional[int] = Query(None, description="状态")):
        return self.case_business.get_case_list(
            page=page,
            page_size=page_size,
            era=era,
            difficulty=difficulty,
            keyword=keyword,
            status=status
        )

    def ActionPoanCaseOnlineListGet(self, request: Request,
                                     page: int = Query(1, ge=1, description="页码"),
                                     page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                     era: Optional[str] = Query(None, description="时代"),
                                     difficulty: Optional[int] = Query(None, description="难度"),
                                     keyword: Optional[str] = Query(None, description="搜索关键词")):
        return self.case_business.get_online_cases(
            page=page,
            page_size=page_size,
            era=era,
            difficulty=difficulty,
            keyword=keyword
        )

    def ActionPoanCaseErasGet(self, request: Request):
        return self.case_business.get_eras()

    def ActionPoanCaseInitPost(self, request: Request,
                                authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.case_business.init_default_cases()
