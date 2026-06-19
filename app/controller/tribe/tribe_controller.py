from typing import Optional, List
from fastapi import Query, Request
from pydantic import BaseModel, Field
from app.business.tribe import TribeBusiness


class TribeGameCreateRequest(BaseModel):
    name: str = Field(..., description="Tribe name")


class TribeJobAssignRequest(BaseModel):
    tribe_id: int = Field(..., description="Tribe ID")
    person_id: int = Field(..., description="Tribesperson ID")
    job: str = Field(..., description="Job to assign")


class TribeResearchRequest(BaseModel):
    tribe_id: int = Field(..., description="Tribe ID")
    tech_id: str = Field(..., description="Technology ID to research")


class TribeBuildRequest(BaseModel):
    tribe_id: int = Field(..., description="Tribe ID")
    building_type: str = Field(..., description="Building type to construct")


class TribeUpgradeRequest(BaseModel):
    tribe_id: int = Field(..., description="Tribe ID")
    building_id: int = Field(..., description="Building ID to upgrade")


class TribeTurnAdvanceRequest(BaseModel):
    tribe_id: int = Field(..., description="Tribe ID")


class TribeEraAdvanceRequest(BaseModel):
    tribe_id: int = Field(..., description="Tribe ID")


class TribeTradeRequest(BaseModel):
    tribe_id: int = Field(..., description="Tribe ID")
    foreign_tribe_id: int = Field(..., description="Foreign tribe ID to trade with")
    offered_resource: str = Field(..., description="Resource to offer")
    offered_amount: int = Field(..., description="Amount of offered resource")
    requested_resource: str = Field(..., description="Resource to request in return")


class TribeWarDeclareRequest(BaseModel):
    tribe_id: int = Field(..., description="Tribe ID")
    foreign_tribe_id: int = Field(..., description="Foreign tribe ID to declare war on")


class TribePeaceRequest(BaseModel):
    tribe_id: int = Field(..., description="Tribe ID")
    foreign_tribe_id: int = Field(..., description="Foreign tribe ID to make peace with")


class TribeBattleRequest(BaseModel):
    tribe_id: int = Field(..., description="Tribe ID")
    foreign_tribe_id: int = Field(..., description="Foreign tribe ID to battle")


class TribeController:
    def __init__(self):
        self.business = TribeBusiness()

    def ActionTribeGameCreatePost(self, request: Request, body: TribeGameCreateRequest):
        """
        Create a new tribe game
        POST /api/tribe/game/create
        Creates a new tribe with the given name, initial tribespeople, buildings, and foreign tribe relations
        """
        return self.business.create_game(name=body.name)

    def ActionTribeGameListGet(self, request: Request):
        """
        List all tribe games
        GET /api/tribe/game/list/get
        Returns a list of all saved tribe games with basic info
        """
        return self.business.list_games()

    def ActionTribeGameGet(self, request: Request, tribe_id: int = Query(..., ge=1, description="Tribe ID")):
        """
        Get tribe game info
        GET /api/tribe/game/get
        Returns detailed tribe information including computed morale, food consumption, and era/season names
        """
        return self.business.get_tribe_info(tribe_id=tribe_id)

    def ActionTribeGameDelete(self, request: Request, tribe_id: int = Query(..., ge=1, description="Tribe ID")):
        """
        Delete a tribe game
        DELETE /api/tribe/game/delete
        Deletes the tribe and all associated data (tribespeople, buildings, technologies, diplomacy)
        """
        return self.business.delete_game(tribe_id=tribe_id)

    def ActionTribeStateGet(self, request: Request, tribe_id: int = Query(..., ge=1, description="Tribe ID")):
        """
        Get full tribe game state
        GET /api/tribe/state/get
        Returns the complete game state including tribe, tribespeople, buildings, techs, diplomacy, and available actions
        """
        return self.business.get_game_state(tribe_id=tribe_id)

    def ActionTribeTribespeopleGet(self, request: Request, tribe_id: int = Query(..., ge=1, description="Tribe ID")):
        """
        Get tribespeople list
        GET /api/tribe/tribespeople/get
        Returns all tribespeople in the tribe with their skills and current job assignments
        """
        return self.business.get_tribespeople(tribe_id=tribe_id)

    def ActionTribeJobAssignPost(self, request: Request, body: TribeJobAssignRequest):
        """
        Assign a job to a tribesperson
        POST /api/tribe/job/assign
        Assigns the specified job to the tribesperson; valid jobs: idle, gatherer, hunter, builder, researcher, soldier, trader
        """
        return self.business.assign_job(
            tribe_id=body.tribe_id,
            person_id=body.person_id,
            job=body.job,
        )

    def ActionTribeResearchPost(self, request: Request, body: TribeResearchRequest):
        """
        Research a technology
        POST /api/tribe/research
        Spends knowledge to research a technology; prerequisites and era requirements are validated
        """
        return self.business.research_tech(
            tribe_id=body.tribe_id,
            tech_id=body.tech_id,
        )

    def ActionTribeBuildPost(self, request: Request, body: TribeBuildRequest):
        """
        Build a new building
        POST /api/tribe/build
        Spends resources to construct a new building; building type and resource cost are validated
        """
        return self.business.build_building(
            tribe_id=body.tribe_id,
            building_type=body.building_type,
        )

    def ActionTribeUpgradePost(self, request: Request, body: TribeUpgradeRequest):
        """
        Upgrade an existing building
        POST /api/tribe/upgrade
        Spends resources to upgrade a building to the next level; max level and construction status are validated
        """
        return self.business.upgrade_building(
            tribe_id=body.tribe_id,
            building_id=body.building_id,
        )

    def ActionTribeTurnAdvancePost(self, request: Request, body: TribeTurnAdvanceRequest):
        """
        Advance the tribe by one turn
        POST /api/tribe/turn/advance
        Processes resource production, consumption, construction progress, population changes, and diplomacy cooldowns
        """
        return self.business.advance_turn(tribe_id=body.tribe_id)

    def ActionTribeEraAdvancePost(self, request: Request, body: TribeEraAdvanceRequest):
        """
        Advance the tribe to the next era
        POST /api/tribe/era/advance
        Advances era if required technologies have been researched; era progression: stone -> bronze -> iron -> medieval
        """
        return self.business.advance_era(tribe_id=body.tribe_id)

    def ActionTribeDiplomacyGet(self, request: Request, tribe_id: int = Query(..., ge=1, description="Tribe ID")):
        """
        Get diplomacy information
        GET /api/tribe/diplomacy/get
        Returns all diplomatic relations for the tribe including foreign tribe details and trade cooldowns
        """
        return self.business.get_diplomacy(tribe_id=tribe_id)

    def ActionTribeTradePost(self, request: Request, body: TribeTradeRequest):
        """
        Trade resources with a foreign tribe
        POST /api/tribe/trade
        Exchanges offered resource for requested resource with a foreign tribe; trade cooldown and diplomatic status are validated
        """
        return self.business.trade(
            tribe_id=body.tribe_id,
            foreign_tribe_id=body.foreign_tribe_id,
            offered_resource=body.offered_resource,
            offered_amount=body.offered_amount,
            requested_resource=body.requested_resource,
        )

    def ActionTribeWarDeclarePost(self, request: Request, body: TribeWarDeclareRequest):
        """
        Declare war on a foreign tribe
        POST /api/tribe/war/declare
        Changes diplomatic relation to war with the specified foreign tribe
        """
        return self.business.declare_war(
            tribe_id=body.tribe_id,
            foreign_tribe_id=body.foreign_tribe_id,
        )

    def ActionTribePeacePost(self, request: Request, body: TribePeaceRequest):
        """
        Make peace with a foreign tribe
        POST /api/tribe/peace
        Attempts to negotiate peace with a foreign tribe at war; success chance depends on foreign tribe attitude
        """
        return self.business.make_peace(
            tribe_id=body.tribe_id,
            foreign_tribe_id=body.foreign_tribe_id,
        )

    def ActionTribeBattlePost(self, request: Request, body: TribeBattleRequest):
        """
        Initiate a battle with a foreign tribe
        POST /api/tribe/battle
        Resolves a battle against a foreign tribe at war; outcome depends on military strength and morale
        """
        return self.business.battle(
            tribe_id=body.tribe_id,
            foreign_tribe_id=body.foreign_tribe_id,
        )

    def ActionTribeTechTreeGet(self, request: Request):
        """
        Get the full technology tree
        GET /api/tribe/tech/tree/get
        Returns the complete technology tree structure with all techs, their prerequisites, costs, and era requirements
        """
        return self.business.get_tech_tree()

    def ActionTribeBuildingsAvailableGet(self, request: Request, tribe_id: int = Query(..., ge=1, description="Tribe ID")):
        """
        Get available buildings for a tribe
        GET /api/tribe/buildings/available/get
        Returns buildings that can be constructed given the tribe's current era, researched technologies, and resources
        """
        return self.business.get_available_buildings(tribe_id=tribe_id)
