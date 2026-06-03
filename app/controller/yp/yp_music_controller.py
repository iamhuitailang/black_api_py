from typing import Optional
from fastapi import Request, Header, Query, UploadFile, File, Form
from pydantic import BaseModel, Field


class ToggleFavoriteRequest(BaseModel):
    music_id: int = Field(..., description="音乐ID")


class CreateMusicRequest(BaseModel):
    name: str = Field(..., description="音乐名称")
    artist: Optional[str] = Field(None, description="艺术家")
    cover: Optional[str] = Field(None, description="封面标识")
    file_path: str = Field(..., description="文件路径")
    bpm: Optional[int] = Field(120, description="BPM")
    duration: Optional[int] = Field(0, description="时长（秒）")
    difficulty: Optional[int] = Field(2, description="难度")
    beat_data: Optional[str] = Field(None, description="节拍数据")


class YpMusicController:
    def __init__(self):
        from app.business.yp.music_business import YpMusicBusiness
        self.music_business = YpMusicBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.yp.user_business import YpUserBusiness
        user_business = YpUserBusiness()
        return user_business.verify_token(token)

    def ActionYpMusicListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取音乐列表
        GET /api/yp/music/list/get
        获取所有可用音乐列表，登录后包含自定义音乐
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0

        return self.music_business.get_all_music(user_id)

    def ActionYpMusicMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我的音乐
        GET /api/yp/music/my/get
        获取当前用户已玩过的音乐记录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.music_business.get_user_music(user.get('id'))

    def ActionYpMusicFavoritesGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取收藏音乐
        GET /api/yp/music/favorites/get
        获取当前用户收藏的音乐
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.music_business.get_favorites(user.get('id'))

    def ActionYpMusicFavoriteTogglePost(self, request: Request, body: ToggleFavoriteRequest,
                                         authorization: Optional[str] = Header(None)):
        """
        切换收藏
        POST /api/yp/music/favorite/toggle
        收藏或取消收藏音乐
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.music_business.toggle_favorite(user.get('id'), body.music_id)

    def ActionYpMusicDetailGet(self, request: Request, music_id: int = Query(..., description="音乐ID")):
        """
        获取音乐详情
        GET /api/yp/music/detail/get
        获取指定音乐的详细信息
        """
        return self.music_business.get_music_detail(music_id)

    async def ActionYpMusicUploadPost(self, request: Request,
                                       file: UploadFile = File(..., description="音乐文件"),
                                       name: str = Form(..., description="音乐名称"),
                                       artist: Optional[str] = Form(None, description="艺术家"),
                                       bpm: int = Form(120, description="BPM"),
                                       authorization: Optional[str] = Header(None)):
        """
        上传自定义音乐
        POST /api/yp/music/upload
        上传自定义音乐文件
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        file_data = await file.read()
        filename = file.filename or 'music.mp3'

        return self.music_business.upload_custom_music(
            user_id=user.get('id'),
            file_data=file_data,
            filename=filename,
            name=name,
            artist=artist or '',
            bpm=bpm
        )

    def ActionYpMusicCreatePost(self, request: Request, body: CreateMusicRequest):
        """
        创建音乐（管理员）
        POST /api/yp/music/create
        创建新音乐
        """
        data = {
            'name': body.name,
            'artist': body.artist or '',
            'cover': body.cover or '',
            'file_path': body.file_path,
            'bpm': body.bpm or 120,
            'duration': body.duration or 0,
            'difficulty': body.difficulty or 2,
            'beat_data': body.beat_data or '[]',
            'is_custom': 0,
            'user_id': 0
        }
        return self.music_business.create_music(data)

    def ActionYpMusicDeletePost(self, request: Request, music_id: int = Query(..., description="音乐ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        删除音乐
        POST /api/yp/music/delete
        删除指定音乐（自定义音乐只能删除自己的）
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else None

        return self.music_business.delete_music(music_id, user_id)
