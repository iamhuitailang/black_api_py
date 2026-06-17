from typing import Optional
from fastapi import Request, Query
from pydantic import BaseModel
from app.business.parkour import ParkourBusiness


class ParkourScoreSetRequest(BaseModel):
    player_name: str
    distance: float
    letters_collected: int


class ParkourLetterCollectRequest(BaseModel):
    player_name: str
    letter_id: int
    fragment_index: int


class ParkourController:
    def __init__(self):
        self.business = ParkourBusiness()

    def ActionParkourScoreSet(self, request: Request, body: ParkourScoreSetRequest):
        result = self.business.submit_score(body.player_name, body.distance, body.letters_collected)
        return result

    def ActionParkourScoreGetleaderboard(self, request: Request):
        result = self.business.get_leaderboard()
        return result

    def ActionParkourScoreGetbest(self, request: Request, player_name: str = Query(...)):
        result = self.business.get_best_score(player_name)
        return result

    def ActionParkourLetterGetstatus(self, request: Request, player_name: str = Query(...)):
        result = self.business.get_letter_status(player_name)
        return result

    def ActionParkourLetterCollectPost(self, request: Request, body: ParkourLetterCollectRequest):
        result = self.business.collect_letter(body.player_name, body.letter_id, body.fragment_index)
        return result
