from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateActivityRequest(BaseModel):
    title: str = Field(..., description="活动标题")
    type: str = Field(default='hiking', description="活动类型")
    difficulty: str = Field(default='easy', description="难度等级")
    start_time: str = Field(..., description="集合时间")
    location: str = Field(..., description="集合地点")
    location_lng: Optional[float] = Field(None, description="经度")
    location_lat: Optional[float] = Field(None, description="纬度")
    max_people: int = Field(default=20, description="人数上限")
    cost: float = Field(default=0, description="费用（0=免费）")
    route_desc: Optional[str] = Field(None, description="路线描述")


class UpdateActivityRequest(BaseModel):
    title: Optional[str] = Field(None, description="活动标题")
    type: Optional[str] = Field(None, description="活动类型")
    difficulty: Optional[str] = Field(None, description="难度等级")
    start_time: Optional[str] = Field(None, description="集合时间")
    location: Optional[str] = Field(None, description="集合地点")
    location_lng: Optional[float] = Field(None, description="经度")
    location_lat: Optional[float] = Field(None, description="纬度")
    max_people: Optional[int] = Field(None, description="人数上限")
    cost: Optional[float] = Field(None, description="费用")
    route_desc: Optional[str] = Field(None, description="路线描述")


class CheckinRequest(BaseModel):
    activity_id: int = Field(..., description="活动ID")
    user_id: Optional[int] = Field(None, description="用户ID（可选，默认当前用户）")


class YeyouActivityController:
    TYPE_MAP = {
        'hiking': 'hike',
        'camping': 'camp',
        'cycling': 'cycle',
        'picnic': 'picnic',
        'climbing': 'climb',
        'swimming': 'swim',
        'skiing': 'ski',
        'surfing': 'surf'
    }

    TYPE_MAP_REVERSE = {v: k for k, v in TYPE_MAP.items()}

    DIFFICULTY_MAP = {
        'easy': 'beginner',
        'medium': 'intermediate',
        'hard': 'advanced'
    }

    DIFFICULTY_MAP_REVERSE = {v: k for k, v in DIFFICULTY_MAP.items()}

    def __init__(self):
        from app.business.yeyou.activity_business import ActivityBusiness
        from app.business.yeyou.registration_business import RegistrationBusiness
        self.activity_business = ActivityBusiness()
        self.registration_business = RegistrationBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.yeyou.user_business import YeyouUserBusiness
        user_business = YeyouUserBusiness()
        return user_business.verify_token(token)

    def _convert_type_to_db(self, activity_type: str) -> str:
        return self.TYPE_MAP.get(activity_type, activity_type)

    def _convert_type_from_db(self, activity_type: str) -> str:
        return self.TYPE_MAP_REVERSE.get(activity_type, activity_type)

    def _convert_difficulty_to_db(self, difficulty: str) -> str:
        return self.DIFFICULTY_MAP.get(difficulty, difficulty)

    def _convert_difficulty_from_db(self, difficulty: str) -> str:
        return self.DIFFICULTY_MAP_REVERSE.get(difficulty, difficulty)

    def _convert_activity_data(self, data: dict) -> dict:
        if 'type' in data:
            data['type'] = self._convert_type_from_db(data['type'])
        if 'difficulty' in data:
            data['difficulty'] = self._convert_difficulty_from_db(data['difficulty'])
        if 'cost_amount' in data and 'cost' not in data:
            data['cost'] = data['cost_amount']
        return data

    def ActionYeyouActivityList(self, request: Request,
                                page: int = Query(1, description="页码"),
                                page_size: int = Query(20, description="每页数量"),
                                type: Optional[str] = Query(None, description="活动类型"),
                                status: Optional[str] = Query(None, description="活动状态"),
                                difficulty: Optional[str] = Query(None, description="难度等级"),
                                keyword: Optional[str] = Query(None, description="搜索关键词")):
        """
        获取活动列表接口
        GET /api/yeyou/activity/list
        按条件筛选活动列表
        """
        db_type = self._convert_type_to_db(type) if type else None
        db_difficulty = self._convert_difficulty_to_db(difficulty) if difficulty else None

        result = self.activity_business.get_activity_list(
            page=page,
            page_size=page_size,
            activity_type=db_type,
            status=status,
            difficulty=db_difficulty,
            keyword=keyword
        )

        if result.get('code') == 0 and result.get('data'):
            data = result['data']
            items = data.get('items', [])
            converted_items = [self._convert_activity_data(item) for item in items]
            result['data'] = converted_items

        return result

    def ActionYeyouActivityDetail(self, request: Request,
                                      id: int = Query(..., description="活动ID")):
        """
        获取活动详情接口
        GET /api/yeyou/activity/detail
        获取活动的详细信息
        """
        result = self.activity_business.get_activity_detail(id)
        
        if result.get('code') == 0 and result.get('data'):
            result['data'] = self._convert_activity_data(result['data'])

        return result

    def ActionYeyouActivityCreatePost(self, request: Request, body: CreateActivityRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        发起活动接口
        POST /api/yeyou/activity/create
        用户发起新的户外活动
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        cost_type = 'free' if body.cost == 0 else 'aa'
        
        data = {
            'title': body.title,
            'type': self._convert_type_to_db(body.type),
            'difficulty': self._convert_difficulty_to_db(body.difficulty),
            'start_time': body.start_time,
            'location': body.location,
            'max_people': body.max_people,
            'cost_type': cost_type,
            'cost_amount': body.cost or 0,
            'route_desc': body.route_desc or '',
            'meeting_point': ''
        }
        if body.location_lng:
            data['location_lng'] = body.location_lng
        if body.location_lat:
            data['location_lat'] = body.location_lat

        return self.activity_business.create_activity(user.get('id'), data)

    def ActionYeyouActivityUpdatePost(self, request: Request, body: UpdateActivityRequest,
                                        id: int = Query(..., description="活动ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        更新活动接口
        POST /api/yeyou/activity/update
        修改已发起的活动信息
        """
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
        if body.type is not None:
            data['type'] = self._convert_type_to_db(body.type)
        if body.difficulty is not None:
            data['difficulty'] = self._convert_difficulty_to_db(body.difficulty)
        if body.start_time is not None:
            data['start_time'] = body.start_time
        if body.location is not None:
            data['location'] = body.location
        if body.location_lng is not None:
            data['location_lng'] = body.location_lng
        if body.location_lat is not None:
            data['location_lat'] = body.location_lat
        if body.max_people is not None:
            data['max_people'] = body.max_people
        if body.cost is not None:
            data['cost_type'] = 'free' if body.cost == 0 else 'aa'
            data['cost_amount'] = body.cost
        if body.route_desc is not None:
            data['route_desc'] = body.route_desc

        return self.activity_business.update_activity(id, user.get('id'), data)

    def ActionYeyouActivityCancelPost(self, request: Request,
                                        id: int = Query(..., description="活动ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        取消活动接口
        POST /api/yeyou/activity/cancel
        取消已发起的活动
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.cancel_activity(id, user.get('id'))

    def ActionYeyouActivityStartPost(self, request: Request,
                                      id: int = Query(..., description="活动ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        开始活动接口
        POST /api/yeyou/activity/start
        领队标记活动开始
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.start_activity(id, user.get('id'))

    def ActionYeyouActivityEndPost(self, request: Request,
                                       id: int = Query(..., description="活动ID"),
                                       authorization: Optional[str] = Header(None)):
        """
        结束活动接口
        POST /api/yeyou/activity/end
        领队标记活动结束
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.activity_business.finish_activity(id, user.get('id'))

    def ActionYeyouActivityRegistrationCreatePost(self, request: Request,
                                                    activity_id: int = Query(..., description="活动ID"),
                                                    authorization: Optional[str] = Header(None)):
        """
        报名活动接口
        POST /api/yeyou/activity/registration/create
        用户报名参加活动
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.registration_business.register_activity(activity_id, user.get('id'))

    def ActionYeyouActivityRegistrationCancelPost(self, request: Request,
                                                    activity_id: int = Query(..., description="活动ID"),
                                                    authorization: Optional[str] = Header(None)):
        """
        取消报名接口
        POST /api/yeyou/activity/registration/cancel
        用户取消报名活动
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.registration_business.cancel_registration(activity_id, user.get('id'))

    def ActionYeyouActivityRegistrationCheckinPost(self, request: Request,
                                                     activity_id: int = Query(..., description="活动ID"),
                                                     user_id: Optional[int] = Query(None, description="用户ID"),
                                                     authorization: Optional[str] = Header(None)):
        """
        签到接口
        POST /api/yeyou/activity/registration/checkin
        用户签到或领队为用户签到
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        target_user_id = user_id if user_id else user.get('id')

        return self.registration_business.check_in(activity_id, target_user_id, user.get('id'))

    def ActionYeyouActivityRegistrationStatus(self, request: Request,
                                                  activity_id: int = Query(..., description="活动ID"),
                                                  authorization: Optional[str] = Header(None)):
        """
        获取报名状态接口
        GET /api/yeyou/activity/registration/status
        获取当前用户对活动的报名状态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.registration_business.get_registration_status(activity_id, user.get('id'))

    def ActionYeyouActivityParticipants(self, request: Request,
                                            activity_id: int = Query(..., description="活动ID"),
                                            page: int = Query(1, description="页码"),
                                            page_size: int = Query(100, description="每页数量")):
        """
        获取活动参与者接口
        GET /api/yeyou/activity/participants
        获取活动的所有报名用户
        """
        return self.registration_business.get_activity_participants(activity_id, page, page_size)

    def ActionYeyouActivityMy(self, request: Request,
                                  role: str = Query('all', description="角色类型"),
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量"),
                                  authorization: Optional[str] = Header(None)):
        """
        获取我的活动接口
        GET /api/yeyou/activity/my
        获取我发起或参与的活动列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        result = self.activity_business.get_my_activities(
            user_id=user.get('id'),
            role=role,
            page=page,
            page_size=page_size
        )

        if result.get('code') == 0 and result.get('data'):
            data = result['data']
            items = data.get('items', []) if isinstance(data, dict) else data
            converted_items = [self._convert_activity_data(item) for item in items]
            if isinstance(data, dict):
                result['data']['items'] = converted_items
            else:
                result['data'] = converted_items

        return result
