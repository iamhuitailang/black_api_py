from typing import Optional
from fastapi import Request, Query
from pydantic import BaseModel, Field


class CreateAnimalRequest(BaseModel):
    name: str = Field(..., description="动物名称")
    level: int = Field(..., description="难度等级 1-简单 2-普通 3-进阶 4-困难")
    description: Optional[str] = Field('', description="描述")


class UpdateAnimalRequest(BaseModel):
    name: Optional[str] = Field(None, description="动物名称")
    level: Optional[int] = Field(None, description="难度等级")
    description: Optional[str] = Field(None, description="描述")


class CreateRoomRequest(BaseModel):
    mode: int = Field(..., description="游戏模式 1-单人 2-双人")
    player_name: str = Field(..., description="玩家名称")
    player_id: Optional[int] = Field(0, description="玩家ID")
    max_rounds: Optional[int] = Field(5, description="最大回合数")
    time_limit: Optional[int] = Field(60, description="每轮时间限制秒数")


class JoinRoomRequest(BaseModel):
    room_code: str = Field(..., description="房间号")
    player_name: str = Field(..., description="玩家名称")
    player_id: Optional[int] = Field(0, description="玩家ID")


class RoomIdRequest(BaseModel):
    room_id: int = Field(..., description="房间ID")


class NextRoundRequest(BaseModel):
    room_id: int = Field(..., description="房间ID")
    level: Optional[int] = Field(None, description="难度等级")


class SubmitGuessRequest(BaseModel):
    game_id: int = Field(..., description="游戏记录ID")
    guess_answer: str = Field(..., description="猜题答案")
    time_used: int = Field(..., description="用时秒数")


class UpdateDrawingRequest(BaseModel):
    game_id: int = Field(..., description="游戏记录ID")
    drawing_data: str = Field(..., description="绘画数据")


class GameTimeoutRequest(BaseModel):
    game_id: int = Field(..., description="游戏ID")
    time_used: int = Field(..., description="用时秒数")


class CaiAnimalController:
    def __init__(self):
        from app.business.cai.animal_business import CaiAnimalBusiness
        self.animal_business = CaiAnimalBusiness()

    def ActionCaiAnimalInitPost(self, request: Request):
        """
        初始化动物题库
        POST /api/cai/animal/init
        """
        return self.animal_business.init_data()

    def ActionCaiAnimalCreatePost(self, request: Request, body: CreateAnimalRequest):
        """
        创建动物
        POST /api/cai/animal/create
        """
        return self.animal_business.create_animal(
            name=body.name,
            level=body.level,
            description=body.description or ''
        )

    def ActionCaiAnimalDetailGet(self, request: Request, animal_id: int = Query(..., description="动物ID")):
        """
        获取动物详情
        GET /api/cai/animal/detail
        """
        return self.animal_business.get_animal_by_id(animal_id)

    def ActionCaiAnimalListGet(self, request: Request, page: int = Query(1, description="页码"),
                                page_size: int = Query(10, description="每页数量"),
                                level: Optional[int] = Query(None, description="难度等级"),
                                keyword: Optional[str] = Query(None, description="关键词")):
        """
        获取动物列表
        GET /api/cai/animal/list
        """
        return self.animal_business.get_animal_list(page, page_size, level, keyword)

    def ActionCaiAnimalAllGet(self, request: Request):
        """
        获取所有动物
        GET /api/cai/animal/all
        """
        return self.animal_business.get_all_animals()

    def ActionCaiAnimalRandomGet(self, request: Request, level: Optional[int] = Query(None, description="难度等级")):
        """
        随机获取动物
        GET /api/cai/animal/random
        """
        return self.animal_business.get_random_animal(level)

    def ActionCaiAnimalUpdatePost(self, request: Request, animal_id: int = Query(..., description="动物ID"),
                                   body: UpdateAnimalRequest = None):
        """
        更新动物
        POST /api/cai/animal/update
        """
        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.level is not None:
            data['level'] = body.level
        if body.description is not None:
            data['description'] = body.description
        return self.animal_business.update_animal(animal_id, data)

    def ActionCaiAnimalDeletePost(self, request: Request, animal_id: int = Query(..., description="动物ID")):
        """
        删除动物
        POST /api/cai/animal/delete
        """
        return self.animal_business.delete_animal(animal_id)


class CaiRoomController:
    def __init__(self):
        from app.business.cai.room_business import CaiRoomBusiness
        self.room_business = CaiRoomBusiness()

    def ActionCaiRoomCreatePost(self, request: Request, body: CreateRoomRequest):
        """
        创建房间
        POST /api/cai/room/create
        """
        return self.room_business.create_room(
            mode=body.mode,
            player_name=body.player_name,
            player_id=body.player_id,
            max_rounds=body.max_rounds,
            time_limit=body.time_limit
        )

    def ActionCaiRoomDetailGet(self, request: Request, room_id: int = Query(..., description="房间ID")):
        """
        获取房间详情
        GET /api/cai/room/detail
        """
        return self.room_business.get_room_by_id(room_id)

    def ActionCaiRoomCodeGet(self, request: Request, room_code: str = Query(..., description="房间号")):
        """
        根据房间号获取房间
        GET /api/cai/room/code
        """
        return self.room_business.get_room_by_code(room_code)

    def ActionCaiRoomJoinPost(self, request: Request, body: JoinRoomRequest):
        """
        加入房间
        POST /api/cai/room/join
        """
        return self.room_business.join_room(
            room_code=body.room_code,
            player_name=body.player_name,
            player_id=body.player_id
        )

    def ActionCaiRoomStartPost(self, request: Request, body: RoomIdRequest):
        """
        开始游戏
        POST /api/cai/room/start
        """
        return self.room_business.start_game(body.room_id)

    def ActionCaiRoomNextRoundPost(self, request: Request, body: NextRoundRequest):
        """
        下一轮
        POST /api/cai/room/next-round
        """
        return self.room_business.next_round(body.room_id, body.level)

    def ActionCaiRoomWaitingGet(self, request: Request):
        """
        获取等待中的房间列表
        GET /api/cai/room/waiting
        """
        return self.room_business.get_waiting_rooms()

    def ActionCaiRoomListGet(self, request: Request, page: int = Query(1, description="页码"),
                              page_size: int = Query(10, description="每页数量"),
                              status: Optional[int] = Query(None, description="房间状态")):
        """
        获取房间列表
        GET /api/cai/room/list
        """
        return self.room_business.get_room_list(page, page_size, status)

    def ActionCaiRoomDeletePost(self, request: Request, body: RoomIdRequest):
        """
        删除房间
        POST /api/cai/room/delete
        """
        return self.room_business.delete_room(body.room_id)


class CaiGameController:
    def __init__(self):
        from app.business.cai.game_business import CaiGameBusiness
        self.game_business = CaiGameBusiness()

    def ActionCaiGameCreatePost(self, request: Request, body: RoomIdRequest):
        """
        创建游戏记录
        POST /api/cai/game/create
        """
        return self.game_business.create_game(body.room_id)

    def ActionCaiGameDetailGet(self, request: Request, game_id: int = Query(..., description="游戏记录ID")):
        """
        获取游戏记录详情
        GET /api/cai/game/detail
        """
        return self.game_business.get_game_by_id(game_id)

    def ActionCaiGameRoomGet(self, request: Request, room_id: int = Query(..., description="房间ID")):
        """
        获取房间的所有游戏记录
        GET /api/cai/game/room
        """
        return self.game_business.get_games_by_room(room_id)

    def ActionCaiGameRoundGet(self, request: Request, room_id: int = Query(..., description="房间ID"),
                               round_num: int = Query(..., description="回合数")):
        """
        获取指定回合的游戏记录
        GET /api/cai/game/round
        """
        return self.game_business.get_game_by_room_and_round(room_id, round_num)

    def ActionCaiGameGuessPost(self, request: Request, body: SubmitGuessRequest):
        """
        提交猜题答案
        POST /api/cai/game/guess
        """
        return self.game_business.submit_guess(
            game_id=body.game_id,
            guess_answer=body.guess_answer,
            time_used=body.time_used
        )

    def ActionCaiGameDrawingPost(self, request: Request, body: UpdateDrawingRequest):
        """
        更新绘画数据
        POST /api/cai/game/drawing
        """
        return self.game_business.update_drawing(
            game_id=body.game_id,
            drawing_data=body.drawing_data
        )

    def ActionCaiGameTimeoutPost(self, request: Request, body: GameTimeoutRequest):
        """
        标记超时
        POST /api/cai/game/timeout
        """
        return self.game_business.mark_timeout(body.game_id, body.time_used)

    def ActionCaiGameUserGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                              page: int = Query(1, description="页码"),
                              page_size: int = Query(10, description="每页数量")):
        """
        获取用户的游戏记录
        GET /api/cai/game/user
        """
        return self.game_business.get_user_games(user_id, page, page_size)

    def ActionCaiGameDeletePost(self, request: Request, game_id: int = Query(..., description="游戏记录ID")):
        """
        删除游戏记录
        POST /api/cai/game/delete
        """
        return self.game_business.delete_game(game_id)


class CaiScoreController:
    def __init__(self):
        from app.business.cai.score_business import CaiScoreBusiness
        self.score_business = CaiScoreBusiness()

    def ActionCaiScorePlayerGet(self, request: Request, player_id: int = Query(..., description="玩家ID")):
        """
        获取玩家成绩
        GET /api/cai/score/player
        """
        return self.score_business.get_score_by_player_id(player_id)

    def ActionCaiScoreUpdatePost(self, request: Request, body: RoomIdRequest):
        """
        更新游戏结果到成绩
        POST /api/cai/score/update
        """
        return self.score_business.update_game_result(body.room_id)

    def ActionCaiScoreLeaderboardGet(self, request: Request, limit: int = Query(10, description="数量限制")):
        """
        获取排行榜
        GET /api/cai/score/leaderboard
        """
        return self.score_business.get_leaderboard(limit)

    def ActionCaiScoreListGet(self, request: Request, page: int = Query(1, description="页码"),
                               page_size: int = Query(10, description="每页数量")):
        """
        获取成绩列表
        GET /api/cai/score/list
        """
        return self.score_business.get_score_list(page, page_size)

    def ActionCaiScoreDeletePost(self, request: Request, score_id: int = Query(..., description="成绩ID")):
        """
        删除成绩
        POST /api/cai/score/delete
        """
        return self.score_business.delete_score(score_id)
