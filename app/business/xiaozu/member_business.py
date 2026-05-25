from typing import Dict, Any, List, Optional
from app.model.xiaozu import TeamMemberModel, TeamModel, UserModel, NotificationModel


class XzMemberBusiness:
    def __init__(self):
        self.member_model = TeamMemberModel()
        self.team_model = TeamModel()
        self.user_model = UserModel()
        self.notification_model = NotificationModel()

    def get_members(self, team_id: int, user_id: int) -> Dict[str, Any]:
        if not self.member_model.is_member(team_id, user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        members = self.member_model.get_members_by_team(team_id)
        return {'code': 0, 'msg': 'success', 'data': members}

    def get_member_detail(self, team_id: int, user_id: int, target_user_id: int) -> Dict[str, Any]:
        if not self.member_model.is_member(team_id, user_id):
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        member = self.member_model.get_by_team_and_user(team_id, target_user_id)
        if not member:
            return {'code': 1, 'msg': '成员不存在', 'data': None}

        user = self.user_model.get_by_id(target_user_id)
        result = self.member_model.get_members_by_team(team_id)
        target = next((m for m in result if m['user_id'] == target_user_id), None)
        return {'code': 0, 'msg': 'success', 'data': target}

    def update_role(self, team_id: int, user_id: int, target_user_id: int, role: str) -> Dict[str, Any]:
        current_member = self.member_model.get_by_team_and_user(team_id, user_id)
        if not current_member or current_member['role'] != TeamMemberModel.ROLE_OWNER:
            return {'code': 1, 'msg': '仅组长可操作', 'data': None}

        if role not in [TeamMemberModel.ROLE_ADMIN, TeamMemberModel.ROLE_MEMBER]:
            return {'code': 1, 'msg': '无效角色', 'data': None}

        target_member = self.member_model.get_by_team_and_user(team_id, target_user_id)
        if not target_member:
            return {'code': 1, 'msg': '成员不存在', 'data': None}

        if target_member['role'] == TeamMemberModel.ROLE_OWNER:
            return {'code': 1, 'msg': '不可修改组长角色', 'data': None}

        self.member_model.update_role(team_id, target_user_id, role)
        return {'code': 0, 'msg': '角色更新成功', 'data': None}

    def remove_member(self, team_id: int, user_id: int, target_user_id: int) -> Dict[str, Any]:
        current_member = self.member_model.get_by_team_and_user(team_id, user_id)
        if not current_member:
            return {'code': 1, 'msg': '非小组成员', 'data': None}

        if user_id == target_user_id:
            if current_member['role'] == TeamMemberModel.ROLE_OWNER:
                return {'code': 1, 'msg': '请解散小组而非退出', 'data': None}
            self.member_model.remove_member(team_id, target_user_id)
            return {'code': 0, 'msg': '已退出小组', 'data': None}

        if current_member['role'] == TeamMemberModel.ROLE_OWNER:
            target_member = self.member_model.get_by_team_and_user(team_id, target_user_id)
            if not target_member:
                return {'code': 1, 'msg': '成员不存在', 'data': None}
            if target_member['role'] == TeamMemberModel.ROLE_OWNER:
                return {'code': 1, 'msg': '不可移除组长', 'data': None}
            self.member_model.remove_member(team_id, target_user_id)
            return {'code': 0, 'msg': '已移除成员', 'data': None}

        return {'code': 1, 'msg': '仅组长可移除成员', 'data': None}

    def get_member_count(self, team_id: int) -> Dict[str, Any]:
        count = self.member_model.get_member_count(team_id)
        return {'code': 0, 'msg': 'success', 'data': {'count': count}}
