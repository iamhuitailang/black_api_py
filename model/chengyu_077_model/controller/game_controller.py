from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import (
    GameCreate, 
    GameUpdate, 
    GameResponse,
    GamePlayRequest,
    GamePlayResponse,
    ScoreResponse,
    LeaderboardItem
)
from utils.response import ResponseModel, success_response, error_response
from business.game_business import (
    get_game,
    get_games_by_user,
    get_active_game,
    create_game,
    update_game,
    play_idiom,
    end_game,
    delete_game,
    get_score,
    get_scores_by_user,
    get_leaderboard
)
from business.user_business import get_current_user
from business.achievement_business import check_and_unlock_achievements
from models import User

router = APIRouter(prefix="/api/game", tags=["游戏管理"])


@router.post("/start", response_model=ResponseModel[GameResponse])
def start_game(
    game_type: str = "classic",
    mode: str = "single",
    time_limit: int = 60,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        game_data = GameCreate(
            user_id=current_user.id,
            game_type=game_type,
            mode=mode,
            time_limit=time_limit
        )
        db_game = create_game(db, game=game_data)
        return success_response(db_game, "游戏开始")
    except ValueError as e:
        return error_response(code=400, message=str(e))
    except Exception as e:
        return error_response(code=500, message=f"创建游戏失败: {str(e)}")


@router.post("/play", response_model=ResponseModel[GamePlayResponse])
def play_game_turn(
    play_data: GamePlayRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = play_idiom(db, game_id=play_data.game_id, player_idiom=play_data.idiom)
        
        if result.get("game_over"):
            check_and_unlock_achievements(db, current_user.id)
        
        return success_response(GamePlayResponse(**result), result["message"])
    except Exception as e:
        return error_response(code=500, message=f"游戏出错: {str(e)}")


@router.post("/end/{game_id}", response_model=ResponseModel[GameResponse])
def end_game_endpoint(
    game_id: int,
    won: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_game = get_game(db, game_id=game_id)
    if not db_game:
        return error_response(code=404, message="游戏不存在")
    
    if db_game.user_id != current_user.id:
        return error_response(code=403, message="无权操作此游戏")
    
    ended_game = end_game(db, game_id=game_id, won=won)
    if ended_game:
        check_and_unlock_achievements(db, current_user.id)
    
    return success_response(ended_game, "游戏结束")


@router.get("/active", response_model=ResponseModel[Optional[GameResponse]])
def get_active_game_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    active_game = get_active_game(db, user_id=current_user.id)
    return success_response(active_game, "获取成功")


@router.get("/{game_id}", response_model=ResponseModel[GameResponse])
def read_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_game = get_game(db, game_id=game_id)
    if not db_game:
        return error_response(code=404, message="游戏不存在")
    
    if db_game.user_id != current_user.id:
        return error_response(code=403, message="无权查看此游戏")
    
    return success_response(db_game, "获取成功")


@router.get("/", response_model=ResponseModel[List[GameResponse]])
def read_user_games(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    games = get_games_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return success_response(games, "获取成功")


@router.delete("/{game_id}", response_model=ResponseModel)
def delete_game_endpoint(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_game = get_game(db, game_id=game_id)
    if not db_game:
        return error_response(code=404, message="游戏不存在")
    
    if db_game.user_id != current_user.id:
        return error_response(code=403, message="无权删除此游戏")
    
    success = delete_game(db, game_id=game_id)
    if not success:
        return error_response(code=404, message="游戏不存在")
    return success_response(message="删除成功")


@router.get("/score/{score_id}", response_model=ResponseModel[ScoreResponse])
def read_score(
    score_id: int,
    db: Session = Depends(get_db)
):
    db_score = get_score(db, score_id=score_id)
    if not db_score:
        return error_response(code=404, message="成绩不存在")
    return success_response(db_score, "获取成功")


@router.get("/scores/user", response_model=ResponseModel[List[ScoreResponse]])
def read_user_scores(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scores = get_scores_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return success_response(scores, "获取成功")


@router.get("/leaderboard", response_model=ResponseModel[List[LeaderboardItem]])
def get_leaderboard_endpoint(
    game_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    leaderboard = get_leaderboard(db, game_type=game_type, limit=limit)
    return success_response(leaderboard, "获取成功")
