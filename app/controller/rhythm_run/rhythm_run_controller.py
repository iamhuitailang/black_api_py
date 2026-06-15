from typing import Optional
from fastapi import Query, Request
from pydantic import BaseModel
from app.business.rhythm_run import RhythmRunScoreBusiness


class ScoreSubmitRequest(BaseModel):
    player_name: str
    song: str
    score: int
    max_combo: int
    perfect_count: int
    good_count: int
    miss_count: int


class RhythmRunController:
    def __init__(self):
        self.business = RhythmRunScoreBusiness()

    def ActionRhythmrunsongGetlist(self, request: Request):
        """
        获取歌曲列表
        GET /api/rhythmrunsong/getlist
        """
        return self.business.get_songs()

    def ActionRhythmrunsummarySet(self, request: Request, body: ScoreSubmitRequest):
        """
        提交游戏成绩
        POST /api/rhythmrunsummary/set
        请求体: { player_name, song, score, max_combo, perfect_count, good_count, miss_count }
        """
        return self.business.submit_score(
            player_name=body.player_name,
            song=body.song,
            score=body.score,
            max_combo=body.max_combo,
            perfect_count=body.perfect_count,
            good_count=body.good_count,
            miss_count=body.miss_count
        )

    def ActionRhythmrunleaderboardGet(self, request: Request,
                                       song: Optional[str] = Query(None),
                                       limit: int = Query(10, ge=1, le=100)):
        """
        获取排行榜
        GET /api/rhythmrunleaderboard/get
        参数: song - 歌曲ID (可选), limit - 返回数量
        """
        return self.business.get_leaderboard(song=song, limit=limit)

    def ActionRhythmrunplayerGetbest(self, request: Request,
                                      player_name: str = Query(...),
                                      song: str = Query(...)):
        """
        获取玩家某首歌的最佳成绩
        GET /api/rhythmrunplayer/getbest
        参数: player_name - 玩家名, song - 歌曲ID
        """
        return self.business.get_player_best(player_name=player_name, song=song)
