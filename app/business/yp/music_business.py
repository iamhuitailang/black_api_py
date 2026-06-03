from typing import Dict, Any, Optional
from app.model.yp_model import MusicModel, UserMusicModel, UserModel
import os
import uuid


class YpMusicBusiness:
    def __init__(self):
        self.music_model = MusicModel()
        self.user_music_model = UserMusicModel()
        self.user_model = UserModel()

    def get_all_music(self, user_id: int = 0) -> Dict[str, Any]:
        music_list = self.music_model.get_all_active(include_custom=True, user_id=user_id)
        result = [self.music_model.to_public_dict(m) for m in music_list]
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_user_music(self, user_id: int) -> Dict[str, Any]:
        user_music = self.user_music_model.get_by_user_id(user_id)
        result = [self.user_music_model.to_public_dict(um) for um in user_music]
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_favorites(self, user_id: int) -> Dict[str, Any]:
        favorites = self.user_music_model.get_favorites(user_id)
        result = [self.user_music_model.to_public_dict(f) for f in favorites]
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def toggle_favorite(self, user_id: int, music_id: int) -> Dict[str, Any]:
        affected = self.user_music_model.toggle_favorite(user_id, music_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': 'success',
                'data': {'success': True}
            }
        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def get_music_detail(self, music_id: int) -> Dict[str, Any]:
        music = self.music_model.get_by_id(music_id)
        if not music or music.get('is_active') == 0:
            return {
                'code': 1,
                'msg': '音乐不存在或已下架',
                'data': None
            }
        return {
            'code': 0,
            'msg': 'success',
            'data': self.music_model.to_public_dict(music)
        }

    def upload_custom_music(self, user_id: int, file_data: bytes, filename: str,
                            name: str, artist: str = '', bpm: int = 120) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        ext = os.path.splitext(filename)[1].lower()
        if ext not in ['.mp3', '.wav', '.ogg', '.m4a']:
            return {
                'code': 1,
                'msg': '不支持的音频格式，仅支持mp3、wav、ogg、m4a',
                'data': None
            }

        upload_dir = os.path.join('static', 'yp_web', 'audio', 'custom')
        os.makedirs(upload_dir, exist_ok=True)

        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(upload_dir, unique_name)

        with open(file_path, 'wb') as f:
            f.write(file_data)

        web_path = f"/static/yp_web/audio/custom/{unique_name}"

        music_data = {
            'name': name or os.path.splitext(filename)[0],
            'artist': artist or '自定义',
            'cover': 'custom',
            'file_path': web_path,
            'bpm': bpm,
            'duration': 0,
            'difficulty': self._calculate_difficulty(bpm),
            'beat_data': '[]',
            'is_custom': 1,
            'user_id': user_id
        }

        music_id = self.music_model.create(music_data)
        if music_id > 0:
            self.user_music_model.create(user_id, music_id)
            music = self.music_model.get_by_id(music_id)
            return {
                'code': 0,
                'msg': '上传成功',
                'data': self.music_model.to_public_dict(music) if music else None
            }

        return {
            'code': 1,
            'msg': '上传失败',
            'data': None
        }

    def _calculate_difficulty(self, bpm: int) -> int:
        if bpm < 110:
            return self.music_model.DIFFICULTY_EASY
        elif bpm < 140:
            return self.music_model.DIFFICULTY_NORMAL
        elif bpm < 170:
            return self.music_model.DIFFICULTY_HARD
        else:
            return self.music_model.DIFFICULTY_EXPERT

    def update_music_score(self, user_id: int, music_id: int, score: int) -> Dict[str, Any]:
        self.user_music_model.update_score(user_id, music_id, score)
        return {
            'code': 0,
            'msg': 'success',
            'data': None
        }

    def create_music(self, data: Dict[str, Any]) -> Dict[str, Any]:
        music_id = self.music_model.create(data)
        if music_id > 0:
            music = self.music_model.get_by_id(music_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.music_model.to_public_dict(music) if music else None
            }
        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_music(self, music_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        affected = self.music_model.update(music_id, data)
        if affected > 0:
            music = self.music_model.get_by_id(music_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.music_model.to_public_dict(music) if music else None
            }
        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_music(self, music_id: int, user_id: Optional[int] = None) -> Dict[str, Any]:
        music = self.music_model.get_by_id(music_id)
        if not music:
            return {
                'code': 1,
                'msg': '音乐不存在',
                'data': None
            }

        if music.get('is_custom') == 1 and user_id is not None:
            if music.get('user_id') != user_id:
                return {
                    'code': 1,
                    'msg': '无权限删除',
                    'data': None
                }

        affected = self.music_model.delete(music_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }
        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }
