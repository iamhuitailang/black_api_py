from fastapi import Request, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.business.racing import RacingBusiness


class NewGameRequest(BaseModel):
    player_name: Optional[str] = 'Player'


class StartRaceRequest(BaseModel):
    vehicle_id: int
    track_index: int


class RecordCheckpointRequest(BaseModel):
    race_id: int
    checkpoint_index: int
    segment_time: float
    is_shortcut: Optional[bool] = False
    has_rollover: Optional[bool] = False
    penalty_time: Optional[float] = 0.0


class FinishRaceRequest(BaseModel):
    race_id: int
    total_time: float
    shortcuts_found: Optional[int] = 0
    rollovers: Optional[int] = 0


class ApplyUpgradeRequest(BaseModel):
    vehicle_id: int
    upgrade_type: str


class UpdateTireWearRequest(BaseModel):
    vehicle_id: int
    wear_increase: int


class RacingController:
    def __init__(self):
        self.racing_business = RacingBusiness()

    def ActionRacingNewGamePost(self, request: NewGameRequest):
        """
        开始新游戏，创建新车辆
        """
        vehicle = self.racing_business.new_game(request.player_name)
        return {
            'code': 0,
            'message': 'success',
            'data': vehicle
        }

    def ActionRacingVehicleGet(self, vehicle_id: int = Query(None)):
        """
        获取车辆信息
        """
        if vehicle_id:
            vehicle = self.racing_business.vehicle_model.get_by_id(vehicle_id)
        else:
            vehicle = self.racing_business.get_active_vehicle()

        return {
            'code': 0,
            'message': 'success',
            'data': vehicle
        }

    def ActionRacingStartPost(self, request: StartRaceRequest):
        """
        开始比赛
        """
        try:
            race = self.racing_business.start_race(request.vehicle_id, request.track_index)
            return {
                'code': 0,
                'message': 'success',
                'data': race
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def ActionRacingCheckpointPost(self, request: RecordCheckpointRequest):
        """
        记录检查点
        """
        try:
            result = self.racing_business.record_checkpoint(
                request.race_id,
                request.checkpoint_index,
                request.segment_time,
                request.is_shortcut,
                request.has_rollover,
                request.penalty_time
            )
            return {
                'code': 0,
                'message': 'success',
                'data': result
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def ActionRacingFinishPost(self, request: FinishRaceRequest):
        """
        完成比赛
        """
        try:
            result = self.racing_business.finish_race(
                request.race_id,
                request.total_time,
                request.shortcuts_found,
                request.rollovers
            )
            return {
                'code': 0,
                'message': 'success',
                'data': result
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def ActionRacingUpgradePost(self, request: ApplyUpgradeRequest):
        """
        应用改装
        """
        try:
            vehicle = self.racing_business.apply_upgrade(request.vehicle_id, request.upgrade_type)
            return {
                'code': 0,
                'message': 'success',
                'data': vehicle
            }
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def ActionRacingUpgradeOptionsGet(self):
        """
        获取改装选项
        """
        options = self.racing_business.get_upgrade_options()
        return {
            'code': 0,
            'message': 'success',
            'data': options
        }

    def ActionRacingTracksGet(self):
        """
        获取赛道列表
        """
        tracks = self.racing_business.get_tracks()
        return {
            'code': 0,
            'message': 'success',
            'data': tracks
        }

    def ActionRacingProgressGet(self, vehicle_id: int):
        """
        获取比赛进度
        """
        progress = self.racing_business.get_race_progress(vehicle_id)
        return {
            'code': 0,
            'message': 'success',
            'data': progress
        }

    def ActionRacingLeaderboardGet(self, limit: int = Query(10)):
        """
        获取排行榜
        """
        leaderboard = self.racing_business.get_leaderboard(limit)
        return {
            'code': 0,
            'message': 'success',
            'data': leaderboard
        }

    def ActionRacingTireWearPost(self, request: UpdateTireWearRequest):
        """
        更新轮胎磨损
        """
        try:
            vehicle = self.racing_business.update_vehicle_tire_wear(request.vehicle_id, request.wear_increase)
            return {
                'code': 0,
                'message': 'success',
                'data': vehicle
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def ActionRacingUpgradeHistoryGet(self, vehicle_id: int):
        """
        获取改装历史
        """
        history = self.racing_business.get_upgrade_history(vehicle_id)
        return {
            'code': 0,
            'message': 'success',
            'data': history
        }
