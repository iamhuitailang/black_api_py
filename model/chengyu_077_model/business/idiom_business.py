from typing import Optional, List, Tuple
import random
from sqlalchemy.orm import Session

from models import Idiom
from schemas import IdiomCreate


def get_idiom(db: Session, idiom_id: int) -> Optional[Idiom]:
    return db.query(Idiom).filter(Idiom.id == idiom_id).first()


def get_idiom_by_word(db: Session, word: str) -> Optional[Idiom]:
    return db.query(Idiom).filter(Idiom.word == word).first()


def get_idioms(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    difficulty: Optional[int] = None
) -> List[Idiom]:
    query = db.query(Idiom)
    if difficulty:
        query = query.filter(Idiom.difficulty == difficulty)
    return query.offset(skip).limit(limit).all()


def get_idioms_by_first_char(db: Session, first_char: str) -> List[Idiom]:
    return db.query(Idiom).filter(Idiom.first_char == first_char).all()


def get_idioms_by_last_char(db: Session, last_char: str) -> List[Idiom]:
    return db.query(Idiom).filter(Idiom.last_char == last_char).all()


def get_idioms_by_first_pinyin(db: Session, first_pinyin: str) -> List[Idiom]:
    return db.query(Idiom).filter(Idiom.first_pinyin == first_pinyin).all()


def get_idioms_by_last_pinyin(db: Session, last_pinyin: str) -> List[Idiom]:
    return db.query(Idiom).filter(Idiom.last_pinyin == last_pinyin).all()


def create_idiom(db: Session, idiom: IdiomCreate) -> Idiom:
    db_idiom = get_idiom_by_word(db, word=idiom.word)
    if db_idiom:
        return db_idiom
    
    word = idiom.word
    first_char = word[0] if word else ""
    last_char = word[-1] if word else ""
    
    pinyin_parts = idiom.pinyin.split() if idiom.pinyin else []
    first_pinyin = pinyin_parts[0] if pinyin_parts else first_char
    last_pinyin = pinyin_parts[-1] if pinyin_parts else last_char
    
    db_idiom = Idiom(
        word=idiom.word,
        pinyin=idiom.pinyin,
        explanation=idiom.explanation,
        example=idiom.example,
        first_char=first_char,
        last_char=last_char,
        first_pinyin=first_pinyin,
        last_pinyin=last_pinyin,
        difficulty=idiom.difficulty
    )
    db.add(db_idiom)
    db.commit()
    db.refresh(db_idiom)
    return db_idiom


def create_idioms_bulk(db: Session, idioms: List[IdiomCreate]) -> int:
    count = 0
    for idiom in idioms:
        try:
            create_idiom(db, idiom)
            count += 1
        except Exception:
            continue
    return count


def delete_idiom(db: Session, idiom_id: int) -> bool:
    db_idiom = get_idiom(db, idiom_id=idiom_id)
    if not db_idiom:
        return False
    db.delete(db_idiom)
    db.commit()
    return True


def get_random_idiom(db: Session, difficulty: Optional[int] = None) -> Optional[Idiom]:
    query = db.query(Idiom)
    if difficulty:
        query = query.filter(Idiom.difficulty == difficulty)
    count = query.count()
    if count == 0:
        return None
    return query.offset(random.randint(0, count - 1)).first()


def get_next_idiom(
    db: Session, 
    current_idiom: Idiom, 
    used_words: set,
    use_pinyin: bool = True
) -> Tuple[Optional[Idiom], bool]:
    if use_pinyin:
        next_idioms = db.query(Idiom).filter(
            Idiom.first_pinyin == current_idiom.last_pinyin,
            Idiom.word.notin_(used_words)
        ).all()
    else:
        next_idioms = db.query(Idiom).filter(
            Idiom.first_char == current_idiom.last_char,
            Idiom.word.notin_(used_words)
        ).all()
    
    if not next_idioms:
        return None, False
    
    return random.choice(next_idioms), True


def search_idioms(db: Session, keyword: str, limit: int = 20) -> List[Idiom]:
    return db.query(Idiom).filter(
        Idiom.word.like(f"%{keyword}%")
    ).limit(limit).all()


def check_idiom_exists(db: Session, word: str) -> bool:
    return db.query(Idiom).filter(Idiom.word == word).first() is not None


def validate_idiom_chain(
    db: Session, 
    prev_idiom: Idiom, 
    next_word: str, 
    use_pinyin: bool = True
) -> Tuple[bool, str, Optional[Idiom]]:
    next_idiom = get_idiom_by_word(db, next_word)
    if not next_idiom:
        return False, f"成语 '{next_word}' 不在成语库中", None
    
    if use_pinyin:
        if prev_idiom.last_pinyin != next_idiom.first_pinyin:
            return False, f"需要以 '{prev_idiom.last_pinyin}' 开头的成语", next_idiom
    else:
        if prev_idiom.last_char != next_idiom.first_char:
            return False, f"需要以 '{prev_idiom.last_char}' 开头的成语", next_idiom
    
    return True, "接龙成功", next_idiom
