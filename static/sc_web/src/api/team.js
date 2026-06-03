import request from '@/utils/request'

export function createTeam(data) {
  return request({
    url: '/sc/team/create',
    method: 'post',
    data
  })
}

export function getTeamDetail(teamId) {
  return request({
    url: '/sc/team/detail/get',
    method: 'get',
    params: { team_id: teamId }
  })
}

export function getUserTeams() {
  return request({
    url: '/sc/team/user/list/get',
    method: 'get'
  })
}

export function updateTeam(data) {
  return request({
    url: '/sc/team/update',
    method: 'post',
    data
  })
}

export function disbandTeam(teamId) {
  return request({
    url: '/sc/team/disband',
    method: 'post',
    data: { team_id: teamId }
  })
}

export function inviteMember(data) {
  return request({
    url: '/sc/team/member/invite',
    method: 'post',
    data
  })
}

export function removeMember(data) {
  return request({
    url: '/sc/team/member/remove',
    method: 'post',
    data
  })
}

export function updateMemberRole(data) {
  return request({
    url: '/sc/team/member/role/update',
    method: 'post',
    data
  })
}

export function contributePoints(data) {
  return request({
    url: '/sc/team/contribute',
    method: 'post',
    data
  })
}
