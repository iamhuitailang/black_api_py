from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.helloworld import HelloWorldBusiness


class HelloSetRequest(BaseModel):
    message: str
    id: Optional[int] = None


class HelloController:
    def __init__(self):
        self.business = HelloWorldBusiness()

    def ActionHelloworldGet(self, request: Request, id: Optional[int] = Query(None)):
        """
        获取HelloWorld消息
        GET /api/helloworld/get
        参数: id (可选) - 指定获取某条记录
        """
        result = self.business.get_hello_message(id)
        return result

    def ActionHelloworldGetlist(self, request: Request, page: int = Query(1, ge=1), 
                                  page_size: int = Query(10, ge=1, le=100)):
        """
        获取HelloWorld消息列表（分页）
        GET /api/helloworld/getlist
        参数: page - 页码, page_size - 每页数量
        """
        result = self.business.get_all_messages(page, page_size)
        return result

    def ActionHelloworldSet(self, request: Request, body: HelloSetRequest):
        """
        设置HelloWorld消息
        POST /api/helloworld/set
        请求体: { message: "内容", id: 可选 }
        """
        result = self.business.set_hello_message(body.message, body.id)
        return result

    def ActionHelloworldDelete(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除HelloWorld消息
        DELETE /api/helloworld/delete
        参数: id - 要删除的记录ID
        """
        result = self.business.delete_message(id)
        return result
