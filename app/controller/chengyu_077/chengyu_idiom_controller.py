from typing import Optional
from fastapi import Request, Header
from pydantic import BaseModel, Field
from app.business.chengyu_077.idiom_business import IdiomBusiness
from app.business.chengyu_077.user_business import ChengyuUserBusiness


class IdiomAddRequest(BaseModel):
    word: str = Field(..., description="成语")
    pinyin: str = Field('', description="拼音")
    meaning: str = Field('', description="释义")


class ChengyuIdiomController:
    def __init__(self):
        self.business = IdiomBusiness()
        self.user_business = ChengyuUserBusiness()

    def ActionChengyuIdiomListGet(self, request: Request, page: int = 1, page_size: int = 20):
        """
        获取成语列表
        GET /api/chengyu/idiom/list
        """
        return self.business.get_list(page, page_size)

    def ActionChengyuIdiomSearchGet(self, request: Request, keyword: str = '', page: int = 1, page_size: int = 20):
        """
        搜索成语
        GET /api/chengyu/idiom/search
        """
        return self.business.search(keyword, page, page_size)

    def ActionChengyuIdiomAddPost(self, request: Request, body: IdiomAddRequest, authorization: Optional[str] = Header(None)):
        """
        添加成语
        POST /api/chengyu/idiom/add
        """
        return self.business.add_idiom(body.word, body.pinyin, body.meaning)

    def ActionChengyuIdiomDeleteDelete(self, request: Request, id: int):
        """
        删除成语
        DELETE /api/chengyu/idiom/delete
        """
        return self.business.delete_idiom(id)

    def ActionChengyuIdiomBycharGet(self, request: Request, char: str):
        """
        按首字查询成语
        GET /api/chengyu/idiom/bychar
        """
        return self.business.find_by_first_char(char)
