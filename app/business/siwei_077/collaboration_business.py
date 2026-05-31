from typing import Dict, Any
from app.model.siwei_077_model.collaboration import CollaborationModel
from app.model.siwei_077_model.mind_map import MindMapModel
from app.model.siwei_077_model.user import SiweiUserModel


class SiweiCollaborationBusiness:
    def __init__(self):
        self.collab_model = CollaborationModel()
        self.map_model = MindMapModel()
        self.user_model = SiweiUserModel()

    def add_collaborator(self, owner_id: int, map_id: int, user_id: int, role: str = 'viewer') -> Dict[str, Any]:
        mind_map = self.map_model.get_by_id(map_id)
        if not mind_map:
            return {'code': 1, 'msg': '思维导图不存在', 'data': None}

        if mind_map.get('user_id') != owner_id:
            return {'code': 1, 'msg': '只有所有者可以添加协作者', 'data': None}

        target_user = self.user_model.get_by_id(user_id)
        if not target_user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        if user_id == owner_id:
            return {'code': 1, 'msg': '不能邀请自己', 'data': None}

        existing = self.collab_model.get_by_map_and_user(map_id, user_id)
        if existing:
            self.collab_model.update_role(existing.get('id'), role)
            return {'code': 0, 'msg': '权限已更新', 'data': None}

        if role not in ['editor', 'viewer']:
            return {'code': 1, 'msg': '无效的角色', 'data': None}

        collab_id = self.collab_model.create(
            map_id=map_id,
            user_id=user_id,
            role=role,
            invited_by=owner_id
        )

        if collab_id > 0:
            return {'code': 0, 'msg': '添加协作者成功', 'data': None}
        return {'code': 1, 'msg': '添加失败', 'data': None}

    def remove_collaborator(self, owner_id: int, map_id: int, user_id: int) -> Dict[str, Any]:
        mind_map = self.map_model.get_by_id(map_id)
        if not mind_map:
            return {'code': 1, 'msg': '思维导图不存在', 'data': None}

        if mind_map.get('user_id') != owner_id:
            return {'code': 1, 'msg': '只有所有者可以移除协作者', 'data': None}

        affected = self.collab_model.remove_collaborator(map_id, user_id)
        if affected > 0:
            return {'code': 0, 'msg': '移除成功', 'data': None}
        return {'code': 1, 'msg': '移除失败', 'data': None}

    def update_role(self, owner_id: int, map_id: int, user_id: int, role: str) -> Dict[str, Any]:
        mind_map = self.map_model.get_by_id(map_id)
        if not mind_map:
            return {'code': 1, 'msg': '思维导图不存在', 'data': None}

        if mind_map.get('user_id') != owner_id:
            return {'code': 1, 'msg': '只有所有者可以修改角色', 'data': None}

        if role not in ['editor', 'viewer']:
            return {'code': 1, 'msg': '无效的角色', 'data': None}

        collab = self.collab_model.get_by_map_and_user(map_id, user_id)
        if not collab:
            return {'code': 1, 'msg': '协作者不存在', 'data': None}

        affected = self.collab_model.update_role(collab.get('id'), role)
        if affected > 0:
            return {'code': 0, 'msg': '角色更新成功', 'data': None}
        return {'code': 1, 'msg': '角色更新失败', 'data': None}

    def get_collaborators(self, map_id: int) -> Dict[str, Any]:
        collaborators = self.collab_model.get_collaborators(map_id)
        result = []
        for collab in collaborators:
            user = self.user_model.get_by_id(collab.get('user_id'))
            collab_dict = self.collab_model.to_dict(collab)
            if user:
                collab_dict['user'] = self.user_model.to_public_dict(user)
            result.append(collab_dict)
        return {'code': 0, 'msg': 'success', 'data': result}

    def search_user_by_username(self, username: str) -> Dict[str, Any]:
        if not username:
            return {'code': 1, 'msg': '请输入用户名', 'data': None}
        user = self.user_model.get_by_username(username)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.user_model.to_public_dict(user)}
