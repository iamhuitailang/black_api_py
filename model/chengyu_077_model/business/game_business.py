from typing import Optional, List
from datetime import datetime
import json
from sqlalchemy.orm import Session

from models import Game, Score, Idiom
from schemas import GameCreate, GameUpdate, ScoreCreate
from business.idiom_business import (
    get_random_idiom, 
    get_idiom_by_word, 
    validate_idiom_chain,
    get_next_idiom
)
from business.user_business import update_user_stats


def get_game(db: Session, game_id: int) -> Optional[Game]:
    return db.query(Game).filter(Game.id == game_id).first()


def get_games_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Game]:
    return db.query(Game).filter(Game.user_id == user_id).order_by(Game.created_at.desc()).offset(skip).limit(limit).all()


def get_active_game(db: Session, user_id: int) -> Optional[Game]:
    return db.query(Game).filter(
        Game.user_id == user_id,
        Game.status == "playing"
    ).first()


def create_game(db: Session, game: GameCreate) -> Game:
    active_game = get_active_game(db, user_id=game.user_id)
    if active_game:
        active_game.status = "cancelled"
        db.commit()
    
    start_idiom = get_random_idiom(db)
    if not start_idiom:
        raise ValueError("成语库为空，请先添加成语")
    
    used_idioms = [start_idiom.word]
    
    db_game = Game(
        user_id=game.user_id,
        game_type=game.game_type,
        mode=game.mode,
        status="playing",
        current_idiom=start_idiom.word,
        used_idioms=json.dumps(used_idioms, ensure_ascii=False),
        score=0,
        combo=0,
        max_combo=0,
        time_limit=game.time_limit,
        time_used=0,
        start_time=datetime.utcnow()
    )
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game


def update_game(db: Session, game_id: int, game_update: GameUpdate) -> Optional[Game]:
    db_game = get_game(db, game_id=game_id)
    if not db_game:
        return None
    
    update_data = game_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_game, key, value)
    
    db.commit()
    db.refresh(db_game)
    return db_game


def play_idiom(db: Session, game_id: int, player_idiom: str) -> dict:
    db_game = get_game(db, game_id=game_id)
    if not db_game:
        return {"success": False, "message": "游戏不存在", "score": 0, "combo": 0, "game_over": False}
    
    if db_game.status != "playing":
        return {"success": False, "message": "游戏已结束", "score": db_game.score, "combo": db_game.combo, "game_over": True}
    
    used_words = set(json.loads(db_game.used_idioms)) if db_game.used_idioms else set()
    
    if player_idiom in used_words:
        db_game.combo = 0
        db_game.wrong_count = (db_game.wrong_count or 0) + 1
        db.commit()
        return {"success": False, "message": "这个成语已经用过了", "score": db_game.score, "combo": 0, "game_over": False}
    
    current_idiom_obj = get_idiom_by_word(db, db_game.current_idiom)
    if not current_idiom_obj:
        return {"success": False, "message": "系统错误", "score": db_game.score, "combo": db_game.combo, "game_over": False}
    
    is_valid, message, player_idiom_obj = validate_idiom_chain(db, current_idiom_obj, player_idiom)
    
    if not is_valid:
        db_game.combo = 0
        db.commit()
        return {"success": False, "message": message, "score": db_game.score, "combo": 0, "game_over": False}
    
    used_words.add(player_idiom)
    db_game.used_idioms = json.dumps(list(used_words), ensure_ascii=False)
    db_game.combo += 1
    db_game.max_combo = max(db_game.max_combo, db_game.combo)
    
    base_score = 10
    combo_bonus = min(db_game.combo * 2, 20)
    total_score = base_score + combo_bonus
    db_game.score += total_score
    db_game.correct_count = (db_game.correct_count or 0) + 1
    
    ai_idiom, has_next = get_next_idiom(db, player_idiom_obj, used_words)
    
    if not has_next:
        db_game.status = "finished"
        db_game.end_time = datetime.utcnow()
        db.commit()
        
        score_data = ScoreCreate(
            user_id=db_game.user_id,
            game_id=db_game.id,
            game_type=db_game.game_type,
            score=db_game.score,
            combo=db_game.max_combo,
            correct_count=db_game.correct_count or 0,
            wrong_count=db_game.wrong_count or 0,
            time_used=db_game.time_used,
            is_win=True
        )
        create_score(db, score_data)
        update_user_stats(db, db_game.user_id, db_game.score, True)
        
        return {
            "success": True, 
            "message": "恭喜你赢了！AI接不上来了", 
            "score": db_game.score, 
            "combo": db_game.combo,
            "next_idiom": None,
            "game_over": True
        }
    
    db_game.current_idiom = ai_idiom.word
    used_words.add(ai_idiom.word)
    db_game.used_idioms = json.dumps(list(used_words), ensure_ascii=False)
    db.commit()
    
    return {
        "success": True,
        "message": message,
        "score": db_game.score,
        "combo": db_game.combo,
        "next_idiom": ai_idiom.word,
        "game_over": False
    }


def end_game(db: Session, game_id: int, won: bool = False) -> Optional[Game]:
    db_game = get_game(db, game_id=game_id)
    if not db_game:
        return None
    
    db_game.status = "finished"
    db_game.end_time = datetime.utcnow()
    db.commit()
    db.refresh(db_game)
    
    score_data = ScoreCreate(
        user_id=db_game.user_id,
        game_id=db_game.id,
        game_type=db_game.game_type,
        score=db_game.score,
        combo=db_game.max_combo,
        correct_count=db_game.correct_count or 0,
        wrong_count=db_game.wrong_count or 0,
        time_used=db_game.time_used,
        is_win=won
    )
    create_score(db, score_data)
    update_user_stats(db, db_game.user_id, db_game.score, won)
    
    return db_game


def delete_game(db: Session, game_id: int) -> bool:
    db_game = get_game(db, game_id=game_id)
    if not db_game:
        return False
    db.delete(db_game)
    db.commit()
    return True


def create_score(db: Session, score: ScoreCreate) -> Score:
    db_score = Score(
        user_id=score.user_id,
        game_id=score.game_id,
        game_type=score.game_type,
        score=score.score,
        combo=score.combo,
        correct_count=score.correct_count,
        wrong_count=score.wrong_count,
        time_used=score.time_used,
        is_win=score.is_win
    )
    db.add(db_score)
    db.commit()
    db.refresh(db_score)
    return db_score


def get_score(db: Session, score_id: int) -> Optional[Score]:
    return db.query(Score).filter(Score.id == score_id).first()


def get_scores_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Score]:
    return db.query(Score).filter(Score.user_id == user_id).order_by(Score.created_at.desc()).offset(skip).limit(limit).all()


def get_leaderboard(db: Session, game_type: Optional[str] = None, limit: int = 100) -> List[dict]:
    from models import User
    
    query = db.query(
        User.id,
        User.username,
        User.nickname,
        User.avatar,
        User.total_score,
        User.total_wins,
        User.total_games
    )
    
    scores = query.order_by(User.total_score.desc()).limit(limit).all()
    
    result = []
    for i, (user_id, username, nickname, avatar, total_score, total_wins, total_games) in enumerate(scores):
        result.append({
            "rank": i + 1,
            "user_id": user_id,
            "username": username,
            "nickname": nickname,
            "avatar": avatar,
            "total_score": total_score,
            "total_wins": total_wins,
            "total_games": total_games
        })
    
    return result
