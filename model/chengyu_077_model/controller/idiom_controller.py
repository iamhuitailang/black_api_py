from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import IdiomCreate, IdiomResponse
from utils.response import ResponseModel, success_response, error_response
from business.idiom_business import (
    get_idiom,
    get_idioms,
    get_idiom_by_word,
    create_idiom,
    create_idioms_bulk,
    delete_idiom,
    get_random_idiom,
    search_idioms,
    check_idiom_exists,
    get_idioms_by_first_char,
    get_idioms_by_last_char,
    get_idioms_by_first_pinyin,
    get_idioms_by_last_pinyin
)

router = APIRouter(prefix="/api/idiom", tags=["成语库"])


@router.post("/", response_model=ResponseModel[IdiomResponse])
def add_idiom(idiom: IdiomCreate, db: Session = Depends(get_db)):
    try:
        db_idiom = create_idiom(db, idiom=idiom)
        return success_response(db_idiom, "添加成功")
    except Exception as e:
        return error_response(code=500, message=f"添加失败: {str(e)}")


@router.post("/bulk", response_model=ResponseModel[int])
def add_idioms_bulk(idioms: List[IdiomCreate], db: Session = Depends(get_db)):
    try:
        count = create_idioms_bulk(db, idioms=idioms)
        return success_response(count, f"成功添加 {count} 个成语")
    except Exception as e:
        return error_response(code=500, message=f"批量添加失败: {str(e)}")


@router.get("/{idiom_id}", response_model=ResponseModel[IdiomResponse])
def read_idiom(idiom_id: int, db: Session = Depends(get_db)):
    db_idiom = get_idiom(db, idiom_id=idiom_id)
    if not db_idiom:
        return error_response(code=404, message="成语不存在")
    return success_response(db_idiom, "获取成功")


@router.get("/word/{word}", response_model=ResponseModel[IdiomResponse])
def read_idiom_by_word(word: str, db: Session = Depends(get_db)):
    db_idiom = get_idiom_by_word(db, word=word)
    if not db_idiom:
        return error_response(code=404, message="成语不存在")
    return success_response(db_idiom, "获取成功")


@router.get("/", response_model=ResponseModel[List[IdiomResponse]])
def read_idioms(
    skip: int = 0, 
    limit: int = 100, 
    difficulty: Optional[int] = None,
    db: Session = Depends(get_db)
):
    idioms = get_idioms(db, skip=skip, limit=limit, difficulty=difficulty)
    return success_response(idioms, "获取成功")


@router.get("/search/{keyword}", response_model=ResponseModel[List[IdiomResponse]])
def search_idioms_endpoint(keyword: str, limit: int = 20, db: Session = Depends(get_db)):
    idioms = search_idioms(db, keyword=keyword, limit=limit)
    return success_response(idioms, "搜索成功")


@router.get("/random/one", response_model=ResponseModel[IdiomResponse])
def get_random_idiom_endpoint(difficulty: Optional[int] = None, db: Session = Depends(get_db)):
    idiom = get_random_idiom(db, difficulty=difficulty)
    if not idiom:
        return error_response(code=404, message="成语库为空")
    return success_response(idiom, "获取成功")


@router.get("/exists/{word}", response_model=ResponseModel[bool])
def check_idiom_exists_endpoint(word: str, db: Session = Depends(get_db)):
    exists = check_idiom_exists(db, word=word)
    return success_response(exists, "查询成功")


@router.get("/first-char/{char}", response_model=ResponseModel[List[IdiomResponse]])
def get_idioms_by_first_char_endpoint(char: str, db: Session = Depends(get_db)):
    idioms = get_idioms_by_first_char(db, first_char=char)
    return success_response(idioms, "获取成功")


@router.get("/last-char/{char}", response_model=ResponseModel[List[IdiomResponse]])
def get_idioms_by_last_char_endpoint(char: str, db: Session = Depends(get_db)):
    idioms = get_idioms_by_last_char(db, last_char=char)
    return success_response(idioms, "获取成功")


@router.get("/first-pinyin/{pinyin}", response_model=ResponseModel[List[IdiomResponse]])
def get_idioms_by_first_pinyin_endpoint(pinyin: str, db: Session = Depends(get_db)):
    idioms = get_idioms_by_first_pinyin(db, first_pinyin=pinyin)
    return success_response(idioms, "获取成功")


@router.get("/last-pinyin/{pinyin}", response_model=ResponseModel[List[IdiomResponse]])
def get_idioms_by_last_pinyin_endpoint(pinyin: str, db: Session = Depends(get_db)):
    idioms = get_idioms_by_last_pinyin(db, last_pinyin=pinyin)
    return success_response(idioms, "获取成功")


@router.delete("/{idiom_id}", response_model=ResponseModel)
def delete_idiom_endpoint(idiom_id: int, db: Session = Depends(get_db)):
    success = delete_idiom(db, idiom_id=idiom_id)
    if not success:
        return error_response(code=404, message="成语不存在")
    return success_response(message="删除成功")
