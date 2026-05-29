from typing import Dict, Any
from app.model.huodong import PhotoModel, ActivityModel, HuodongUserModel


class PhotoBusiness:
    def __init__(self):
        self.photo_model = PhotoModel()
        self.activity_model = ActivityModel()
        self.user_model = HuodongUserModel()

    def add_photo(self, user_id: int, activity_id: int, url: str, description: str = '', sort_order: int = 0) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {'code': 1, 'msg': '活动不存在', 'data': None}
        if activity.get('user_id') != user_id:
            return {'code': 1, 'msg': '只能给自己的活动添加照片', 'data': None}
        photo_id = self.photo_model.create(activity_id, user_id, url, description, sort_order)
        if photo_id > 0:
            return {'code': 0, 'msg': '上传成功', 'data': {'id': photo_id}}
        return {'code': 1, 'msg': '上传失败', 'data': None}

    def get_activity_photos(self, activity_id: int) -> Dict[str, Any]:
        photos = self.photo_model.get_by_activity(activity_id)
        items = [self.photo_model.to_dict(p) for p in photos]
        return {'code': 0, 'msg': 'success', 'data': items}

    def delete_photo(self, user_id: int, photo_id: int) -> Dict[str, Any]:
        photo = self.photo_model.query.get_by_id(photo_id)
        if not photo:
            return {'code': 1, 'msg': '照片不存在', 'data': None}
        if photo.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权限删除', 'data': None}
        affected = self.photo_model.delete(photo_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}
