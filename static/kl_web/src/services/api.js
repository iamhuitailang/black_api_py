import request from '@/utils/request'

export const login = (data) => {
  return request({
    url: '/api/v1/users/login',
    method: 'post',
    data
  })
}

export const register = (data) => {
  return request({
    url: '/api/v1/users/register',
    method: 'post',
    data
  })
}

export const getUserInfo = () => {
  return request({
    url: '/api/v1/users/me',
    method: 'get'
  })
}

export const updateUserInfo = (data) => {
  return request({
    url: '/api/v1/users/me',
    method: 'put',
    data
  })
}

export const getParks = () => {
  return request({
    url: '/api/v1/parks',
    method: 'get'
  })
}

export const createPark = (data) => {
  return request({
    url: '/api/v1/parks',
    method: 'post',
    data
  })
}

export const getPark = (id) => {
  return request({
    url: `/api/v1/parks/${id}`,
    method: 'get'
  })
}

export const getFossils = (params) => {
  return request({
    url: '/api/v1/fossils',
    method: 'get',
    params
  })
}

export const excavateFossil = (data) => {
  return request({
    url: '/api/v1/fossils/excavate',
    method: 'post',
    data
  })
}

export const combineFossils = (fossilIds) => {
  return request({
    url: '/api/v1/fossils/combine',
    method: 'post',
    data: fossilIds
  })
}

export const getDinosaurs = (params) => {
  return request({
    url: '/api/v1/dinosaurs',
    method: 'get',
    params
  })
}

export const cloneDinosaur = (data) => {
  return request({
    url: '/api/v1/dinosaurs/clone',
    method: 'post',
    data
  })
}

export const feedDinosaur = (data) => {
  return request({
    url: '/api/v1/dinosaurs/feed',
    method: 'post',
    data
  })
}

export const getDinosaurSpecies = () => {
  return request({
    url: '/api/v1/dinosaurs/species',
    method: 'get'
  })
}

export const getHabitats = (params) => {
  return request({
    url: '/api/v1/habitats',
    method: 'get',
    params
  })
}

export const createHabitat = (data) => {
  return request({
    url: '/api/v1/habitats',
    method: 'post',
    data
  })
}

export const upgradeHabitat = (id) => {
  return request({
    url: `/api/v1/habitats/${id}/upgrade`,
    method: 'post'
  })
}

export const getFacilities = (params) => {
  return request({
    url: '/api/v1/facilities',
    method: 'get',
    params
  })
}

export const createFacility = (data) => {
  return request({
    url: '/api/v1/facilities',
    method: 'post',
    data
  })
}

export const upgradeFacility = (id) => {
  return request({
    url: `/api/v1/facilities/${id}/upgrade`,
    method: 'post'
  })
}

export const collectIncome = (id) => {
  return request({
    url: `/api/v1/facilities/${id}/collect`,
    method: 'post'
  })
}

export const getEvents = (params) => {
  return request({
    url: '/api/v1/events',
    method: 'get',
    params
  })
}

export const getUnresolvedEvents = () => {
  return request({
    url: '/api/v1/events/unresolved',
    method: 'get'
  })
}

export const generateEvent = (parkId) => {
  return request({
    url: `/api/v1/events/generate/${parkId}`,
    method: 'post'
  })
}

export const resolveEvent = (data) => {
  return request({
    url: '/api/v1/events/resolve',
    method: 'post',
    data
  })
}

export const getGenes = () => {
  return request({
    url: '/api/v1/genes',
    method: 'get'
  })
}

export const applyGene = (data) => {
  return request({
    url: '/api/v1/genes/apply',
    method: 'post',
    data
  })
}

export const getDinosaurGenes = (dinosaurId) => {
  return request({
    url: `/api/v1/genes/dinosaur/${dinosaurId}`,
    method: 'get'
  })
}

export const getFriends = (status) => {
  return request({
    url: '/api/v1/friends',
    method: 'get',
    params: { status }
  })
}

export const getFriendRequests = () => {
  return request({
    url: '/api/v1/friends/requests',
    method: 'get'
  })
}

export const sendFriendRequest = (friendId) => {
  return request({
    url: `/api/v1/friends/request/${friendId}`,
    method: 'post'
  })
}

export const acceptFriendRequest = (friendId) => {
  return request({
    url: `/api/v1/friends/accept/${friendId}`,
    method: 'post'
  })
}

export const rejectFriendRequest = (friendId) => {
  return request({
    url: `/api/v1/friends/reject/${friendId}`,
    method: 'post'
  })
}

export const removeFriend = (friendId) => {
  return request({
    url: `/api/v1/friends/${friendId}`,
    method: 'delete'
  })
}

export const createInvite = (data) => {
  return request({
    url: '/api/v1/friends/invite',
    method: 'post',
    data
  })
}

export const getInvites = () => {
  return request({
    url: '/api/v1/friends/invites',
    method: 'get'
  })
}

export const acceptInvite = (data) => {
  return request({
    url: '/api/v1/friends/invite/accept',
    method: 'post',
    data
  })
}

export const interactFriend = (data) => {
  return request({
    url: '/api/v1/friends/interact',
    method: 'post',
    data
  })
}

export const getShares = (params) => {
  return request({
    url: '/api/v1/shares',
    method: 'get',
    params
  })
}

export const getPublicShares = (params) => {
  return request({
    url: '/api/v1/shares/public',
    method: 'get',
    params
  })
}

export const createShare = (data) => {
  return request({
    url: '/api/v1/shares',
    method: 'post',
    data
  })
}

export const interactShare = (data) => {
  return request({
    url: '/api/v1/shares/interact',
    method: 'post',
    data
  })
}

export const changePassword = (data) => {
  return request({
    url: '/api/v1/users/change-password',
    method: 'post',
    data
  })
}
