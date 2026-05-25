from typing import Dict, Any, List, Optional
from app.model.xiaozu import TeamModel, TeamMemberModel, UserModel, NotificationModel


class XzTeamBusiness:
    def __init__(self):
        self.team_model = TeamModel()
        self.member_model = TeamMemberModel()
        self.user_model = UserModel()
        self.notification_model = NotificationModel()

    def _check_permission(self, team_id: int, user_id: int, roles: List[str] = None) -> bool:
        member = self.member_model.get_by_team_and_user(team_id, user_id)
        if not member:
            return False
        if roles is None:
            return True
        return member['role'] in roles

    def create_team(self, user_id: int, name: str, description: str = '') -> Dict[str, Any]:
        if not name:
            return {'code': 1, 'msg': '小组名称不能为空', 'data': None}

        team_id = self.team_model.create(name, description, user_id)
        if team_id > 0:
            self.member_model.create(team_id, user_id, TeamMemberModel.ROLE_OWNER)
            team = self.team_model.get_by_id(team_id)
            return {'code': 0, 'msg': '创建成功', 'data': team}

        return {'code': 1, 'msg': '创建失败', 'data': None}

    def get_team(self, team_id: int, user_id: int) -> Dict[str, Any]:
        team = self.team_model.get_by_id(team_id)
        if not team:
            return {'code': 1, 'msg': '小组不存在', 'data': None}

        if not self.member_model.is_member(team_id, user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        member = self.member_model.get_by_team_and_user(team_id, user_id)
        team['my_role'] = member['role'] if member else None
        return {'code': 0, 'msg': 'success', 'data': team}

    def update_team(self, team_id: int, user_id: int, name: str, description: str) -> Dict[str, Any]:
        if not self._check_permission(team_id, user_id, [TeamMemberModel.ROLE_OWNER]):
            return {'code': 1, 'msg': '无权限操作', 'data': None}

        data = {}
        if name:
            data['name'] = name
        if description is not None:
            data['description'] = description

        if not data:
            return {'code': 1, 'msg': '无更新内容', 'data': None}

        self.team_model.update(team_id, data)
        team = self.team_model.get_by_id(team_id)
        return {'code': 0, 'msg': '更新成功', 'data': team}

    def delete_team(self, team_id: int, user_id: int) -> Dict[str, Any]:
        team = self.team_model.get_by_id(team_id)
        if not team:
            return {'code': 1, 'msg': '小组不存在', 'data': None}

        if team['owner_id'] != user_id:
            return {'code': 1, 'msg': '仅创建者可解散小组', 'data': None}

        self.team_model.delete(team_id)
        return {'code': 0, 'msg': '小组已解散', 'data': None}

    def get_my_teams(self, user_id: int) -> Dict[str, Any]:
        teams = self.member_model.get_teams_by_user(user_id)
        return {'code': 0, 'msg': 'success', 'data': teams}

    def get_team_members(self, team_id: int, user_id: int) -> Dict[str, Any]:
        if not self.member_model.is_member(team_id, user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        members = self.member_model.get_members_by_team(team_id)
        return {'code': 0, 'msg': 'success', 'data': members}

    def join_team_by_code(self, user_id: int, invite_code: str) -> Dict[str, Any]:
        team = self.team_model.get_by_invite_code(invite_code)
        if not team:
            return {'code': 1, 'msg': '邀请码无效', 'data': None}

        if self.member_model.is_member(team['id'], user_id):
            return {'code': 1, 'msg': '已在小组中', 'data': None}

        self.member_model.create(team['id'], user_id, TeamMemberModel.ROLE_MEMBER)
        return {'code': 0, 'msg': '加入成功', 'data': team}

    def update_member_role(self, team_id: int, user_id: int,
                           target_user_id: int, role: str) -> Dict[str, Any]:
        if not self._check_permission(team_id, user_id, [TeamMemberModel.ROLE_OWNER]):
            return {'code': 1, 'msg': '仅组长可操作', 'data': None}

        if role not in [TeamMemberModel.ROLE_ADMIN, TeamMemberModel.ROLE_MEMBER]:
            return {'code': 1, 'msg': '无效角色', 'data': None}

        self.member_model.update_role(team_id, target_user_id, role)
        return {'code': 0, 'msg': '角色更新成功', 'data': None}

    def remove_member(self, team_id: int, user_id: int, target_user_id: int) -> Dict[str, Any]:
        current_member = self.member_model.get_by_team_and_user(team_id, user_id)
        if not current_member:
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        if current_member['role'] == TeamMemberModel.ROLE_OWNER:
            if target_user_id == user_id:
                return {'code': 1, 'msg': '请解散小组而非退出', 'data': None}
        elif current_member['role'] == TeamMemberModel.ROLE_ADMIN:
            if target_user_id != user_id:
                return {'code': 1, 'msg': '管理员仅可退出自己', 'data': None}
        else:
            if target_user_id != user_id:
                return {'code': 1, 'msg': '无权限操作', 'data': None}

        self.member_model.remove_member(team_id, target_user_id)
        return {'code': 0, 'msg': '操作成功', 'data': None}

    def regenerate_invite_code(self, team_id: int, user_id: int) -> Dict[str, Any]:
        if not self._check_permission(team_id, user_id, [TeamMemberModel.ROLE_OWNER]):
            return {'code': 1, 'msg': '仅组长可操作', 'data': None}

        new_code = self.team_model.regenerate_invite_code(team_id)
        return {'code': 0, 'msg': '邀请码已更新', 'data': {'invite_code': new_code}}
