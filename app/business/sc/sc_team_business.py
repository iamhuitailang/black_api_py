from typing import Dict, Any, List
from app.model.sc import ScTeamModel, ScTeamMemberModel, ScUserModel


class ScTeamBusiness:
    def __init__(self):
        self.team_model = ScTeamModel()
        self.team_member_model = ScTeamMemberModel()
        self.user_model = ScUserModel()
        self.CREATE_TEAM_COST = 5000
        self.BASE_MAX_MEMBERS = 5
        self.MEMBERS_PER_LEVEL = 2

    def _get_max_members(self, team_level: int) -> int:
        return self.BASE_MAX_MEMBERS + (team_level - 1) * self.MEMBERS_PER_LEVEL

    def _is_owner(self, user_id: int, team: Dict[str, Any]) -> bool:
        return team.get('owner_id') == user_id

    def create_team(self, user_id: int, name: str, description: str = '', logo: str = '') -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        if not name or len(name.strip()) == 0:
            return {
                'code': 1,
                'msg': '团队名称不能为空',
                'data': None
            }

        if len(name) > 50:
            return {
                'code': 1,
                'msg': '团队名称不能超过50个字符',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if user.get('coins', 0) < self.CREATE_TEAM_COST:
            return {
                'code': 1,
                'msg': f'金币不足，创建团队需要 {self.CREATE_TEAM_COST} 金币',
                'data': None
            }

        existing_owner_team = self.team_model.get_by_owner_id(user_id)
        if existing_owner_team:
            return {
                'code': 1,
                'msg': '您已创建过团队，不能重复创建',
                'data': None
            }

        user_teams = self.team_member_model.get_by_user_id(user_id)
        if user_teams and len(user_teams) > 0:
            return {
                'code': 1,
                'msg': '您已加入其他团队，请先退出后再创建',
                'data': None
            }

        self.user_model.update_coins(user_id, -self.CREATE_TEAM_COST)

        initial_level = 1
        max_members = self._get_max_members(initial_level)
        team_id = self.team_model.create(
            name=name.strip(),
            owner_id=user_id,
            description=description,
            logo=logo,
            team_level=initial_level,
            max_members=max_members
        )

        if team_id > 0:
            self.team_member_model.create(
                team_id=team_id,
                user_id=user_id,
                role=self.team_member_model.ROLE_OWNER
            )

            team = self.team_model.get_by_id(team_id)
            return {
                'code': 0,
                'msg': '团队创建成功',
                'data': team
            }

        self.user_model.update_coins(user_id, self.CREATE_TEAM_COST)
        return {
            'code': 1,
            'msg': '团队创建失败',
            'data': None
        }

    def get_team_detail(self, team_id: int) -> Dict[str, Any]:
        if not team_id or team_id <= 0:
            return {
                'code': 1,
                'msg': '团队ID无效',
                'data': None
            }

        team = self.team_model.get_by_id(team_id)
        if not team:
            return {
                'code': 1,
                'msg': '团队不存在',
                'data': None
            }

        members = self.team_member_model.get_by_team_id(team_id)
        members_detail = []
        for member in members:
            user = self.user_model.get_by_id(member['user_id'])
            if user:
                member_info = {
                    'id': member['id'],
                    'user_id': member['user_id'],
                    'username': user.get('username'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar'),
                    'role': member['role'],
                    'role_text': self.team_member_model.get_role_text(member['role']),
                    'joined_at': member['joined_at'],
                    'contribution_points': member.get('contribution_points', 0)
                }
                members_detail.append(member_info)

        team['members'] = members_detail
        team['member_count'] = len(members_detail)
        team['max_members'] = self._get_max_members(team.get('team_level', 1))

        owner = self.user_model.get_by_id(team['owner_id'])
        if owner:
            team['owner_name'] = owner.get('nickname') or owner.get('username')
            team['owner_avatar'] = owner.get('avatar')

        return {
            'code': 0,
            'msg': 'success',
            'data': team
        }

    def get_user_teams(self, user_id: int) -> Dict[str, Any]:
        if not user_id or user_id <= 0:
            return {
                'code': 1,
                'msg': '用户ID无效',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        memberships = self.team_member_model.get_by_user_id(user_id)
        teams = []
        for membership in memberships:
            team = self.team_model.get_by_id(membership['team_id'])
            if team:
                team_info = {
                    'team_id': team['id'],
                    'name': team['name'],
                    'logo': team.get('logo', ''),
                    'team_level': team.get('team_level', 1),
                    'role': membership['role'],
                    'role_text': self.team_member_model.get_role_text(membership['role']),
                    'joined_at': membership['joined_at'],
                    'is_owner': team['owner_id'] == user_id
                }
                teams.append(team_info)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': teams,
                'total': len(teams)
            }
        }

    def update_team(self, user_id: int, team_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not team_id or team_id <= 0:
            return {
                'code': 1,
                'msg': '团队ID无效',
                'data': None
            }

        team = self.team_model.get_by_id(team_id)
        if not team:
            return {
                'code': 1,
                'msg': '团队不存在',
                'data': None
            }

        if not self._is_owner(user_id, team):
            return {
                'code': 1,
                'msg': '只有队长可以修改团队信息',
                'data': None
            }

        if 'name' in data:
            if not data['name'] or len(data['name'].strip()) == 0:
                return {
                    'code': 1,
                    'msg': '团队名称不能为空',
                    'data': None
                }
            if len(data['name']) > 50:
                return {
                    'code': 1,
                    'msg': '团队名称不能超过50个字符',
                    'data': None
                }

        update_data = {}
        for key in ['name', 'description', 'logo']:
            if key in data:
                update_data[key] = data[key]

        if len(update_data) == 0:
            return {
                'code': 1,
                'msg': '没有有效的更新字段',
                'data': None
            }

        affected = self.team_model.update(team_id, update_data)
        if affected >= 0:
            updated_team = self.team_model.get_by_id(team_id)
            return {
                'code': 0,
                'msg': '团队信息更新成功',
                'data': updated_team
            }

        return {
            'code': 1,
            'msg': '团队信息更新失败',
            'data': None
        }

    def disband_team(self, user_id: int, team_id: int) -> Dict[str, Any]:
        if not team_id or team_id <= 0:
            return {
                'code': 1,
                'msg': '团队ID无效',
                'data': None
            }

        team = self.team_model.get_by_id(team_id)
        if not team:
            return {
                'code': 1,
                'msg': '团队不存在',
                'data': None
            }

        if not self._is_owner(user_id, team):
            return {
                'code': 1,
                'msg': '只有队长可以解散团队',
                'data': None
            }

        members = self.team_member_model.get_by_team_id(team_id)
        for member in members:
            self.team_member_model.delete(member['id'])

        affected = self.team_model.delete(team_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '团队解散成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '团队解散失败',
            'data': None
        }

    def invite_member(self, user_id: int, team_id: int, invitee_user_id: int, role: str) -> Dict[str, Any]:
        if not team_id or team_id <= 0:
            return {
                'code': 1,
                'msg': '团队ID无效',
                'data': None
            }

        if not invitee_user_id or invitee_user_id <= 0:
            return {
                'code': 1,
                'msg': '被邀请用户ID无效',
                'data': None
            }

        if user_id == invitee_user_id:
            return {
                'code': 1,
                'msg': '不能邀请自己',
                'data': None
            }

        valid_roles = [
            self.team_member_model.ROLE_ENGINEER,
            self.team_member_model.ROLE_DRIVER,
            self.team_member_model.ROLE_MECHANIC
        ]
        if role not in valid_roles:
            return {
                'code': 1,
                'msg': f'角色无效，有效值为：{", ".join(valid_roles)}',
                'data': None
            }

        team = self.team_model.get_by_id(team_id)
        if not team:
            return {
                'code': 1,
                'msg': '团队不存在',
                'data': None
            }

        if not self._is_owner(user_id, team):
            return {
                'code': 1,
                'msg': '只有队长可以邀请成员',
                'data': None
            }

        invitee = self.user_model.get_by_id(invitee_user_id)
        if not invitee:
            return {
                'code': 1,
                'msg': '被邀请用户不存在',
                'data': None
            }

        current_members = self.team_member_model.get_by_team_id(team_id)
        max_members = self._get_max_members(team.get('team_level', 1))
        if len(current_members) >= max_members:
            return {
                'code': 1,
                'msg': f'团队成员已达上限（{max_members}人），请先升级团队',
                'data': None
            }

        existing_member = self.team_member_model.get_by_team_and_user(team_id, invitee_user_id)
        if existing_member:
            return {
                'code': 1,
                'msg': '该用户已在团队中',
                'data': None
            }

        invitee_teams = self.team_member_model.get_by_user_id(invitee_user_id)
        if invitee_teams and len(invitee_teams) > 0:
            return {
                'code': 1,
                'msg': '该用户已加入其他团队',
                'data': None
            }

        member_id = self.team_member_model.create(team_id, invitee_user_id, role)
        if member_id > 0:
            member = self.team_member_model.get_by_id(member_id)
            return {
                'code': 0,
                'msg': '成员邀请成功',
                'data': member
            }

        return {
            'code': 1,
            'msg': '成员邀请失败',
            'data': None
        }

    def remove_member(self, user_id: int, team_id: int, member_id: int) -> Dict[str, Any]:
        if not team_id or team_id <= 0:
            return {
                'code': 1,
                'msg': '团队ID无效',
                'data': None
            }

        if not member_id or member_id <= 0:
            return {
                'code': 1,
                'msg': '成员ID无效',
                'data': None
            }

        team = self.team_model.get_by_id(team_id)
        if not team:
            return {
                'code': 1,
                'msg': '团队不存在',
                'data': None
            }

        if not self._is_owner(user_id, team):
            return {
                'code': 1,
                'msg': '只有队长可以移除成员',
                'data': None
            }

        member = self.team_member_model.get_by_id(member_id)
        if not member:
            return {
                'code': 1,
                'msg': '成员不存在',
                'data': None
            }

        if member.get('team_id') != team_id:
            return {
                'code': 1,
                'msg': '该成员不属于此团队',
                'data': None
            }

        if member.get('role') == self.team_member_model.ROLE_OWNER:
            return {
                'code': 1,
                'msg': '不能移除队长',
                'data': None
            }

        affected = self.team_member_model.delete(member_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '成员移除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '成员移除失败',
            'data': None
        }

    def update_member_role(self, user_id: int, team_id: int, member_id: int, new_role: str) -> Dict[str, Any]:
        if not team_id or team_id <= 0:
            return {
                'code': 1,
                'msg': '团队ID无效',
                'data': None
            }

        if not member_id or member_id <= 0:
            return {
                'code': 1,
                'msg': '成员ID无效',
                'data': None
            }

        valid_roles = [
            self.team_member_model.ROLE_OWNER,
            self.team_member_model.ROLE_ENGINEER,
            self.team_member_model.ROLE_DRIVER,
            self.team_member_model.ROLE_MECHANIC
        ]
        if new_role not in valid_roles:
            return {
                'code': 1,
                'msg': f'角色无效，有效值为：{", ".join(valid_roles)}',
                'data': None
            }

        team = self.team_model.get_by_id(team_id)
        if not team:
            return {
                'code': 1,
                'msg': '团队不存在',
                'data': None
            }

        if not self._is_owner(user_id, team):
            return {
                'code': 1,
                'msg': '只有队长可以修改成员角色',
                'data': None
            }

        member = self.team_member_model.get_by_id(member_id)
        if not member:
            return {
                'code': 1,
                'msg': '成员不存在',
                'data': None
            }

        if member.get('team_id') != team_id:
            return {
                'code': 1,
                'msg': '该成员不属于此团队',
                'data': None
            }

        if new_role == self.team_member_model.ROLE_OWNER:
            old_owner_member = self.team_member_model.get_by_team_and_user(team_id, team['owner_id'])
            if old_owner_member:
                self.team_member_model.update_role(old_owner_member['id'], self.team_member_model.ROLE_DRIVER)
            self.team_model.update(team_id, {'owner_id': member['user_id']})

        affected = self.team_member_model.update_role(member_id, new_role)
        if affected > 0:
            updated_member = self.team_member_model.get_by_id(member_id)
            return {
                'code': 0,
                'msg': '成员角色更新成功',
                'data': updated_member
            }

        return {
            'code': 1,
            'msg': '成员角色更新失败',
            'data': None
        }

    def contribute_points(self, user_id: int, team_id: int, points: int) -> Dict[str, Any]:
        if not team_id or team_id <= 0:
            return {
                'code': 1,
                'msg': '团队ID无效',
                'data': None
            }

        if not points or points <= 0:
            return {
                'code': 1,
                'msg': '贡献点数必须大于0',
                'data': None
            }

        team = self.team_model.get_by_id(team_id)
        if not team:
            return {
                'code': 1,
                'msg': '团队不存在',
                'data': None
            }

        member = self.team_member_model.get_by_team_and_user(team_id, user_id)
        if not member:
            return {
                'code': 1,
                'msg': '您不是该团队成员',
                'data': None
            }

        affected = self.team_member_model.update_contribution(member['id'], points)
        if affected > 0:
            self.team_model.update_reputation(team_id, points)
            updated_member = self.team_member_model.get_by_id(member['id'])
            return {
                'code': 0,
                'msg': '贡献点数添加成功',
                'data': {
                    'member_id': member['id'],
                    'added_points': points,
                    'total_points': updated_member.get('contribution_points', 0)
                }
            }

        return {
            'code': 1,
            'msg': '贡献点数添加失败',
            'data': None
        }
