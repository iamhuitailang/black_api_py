import request from '@/utils/request'

export function createItem(data) {
  return request({
    url: '/item',
    method: 'post',
    data
  })
}

export function getItem(id) {
  return request({
    url: `/item/${id}`,
    method: 'get'
  })
}

export function getItemList(params) {
  return request({
    url: '/item',
    method: 'get',
    params: {
      page: params.page,
      page_size: params.page_size,
      rarity: params.rarity,
      item_type: params.item_type
    }
  })
}

export function updateItem(data) {
  return request({
    url: '/item',
    method: 'put',
    data
  })
}

export function deleteItem(id) {
  return request({
    url: `/item/${id}`,
    method: 'delete'
  })
}

export function getUserItems(userId) {
  return request({
    url: `/item/user/${userId}`,
    method: 'get'
  })
}

export function addUserItem(userId, itemId, quantity = 1) {
  return request({
    url: `/item/user/${userId}/${itemId}/add`,
    method: 'post',
    params: { quantity }
  })
}

export function useUserItem(userId, itemId, quantity = 1) {
  return request({
    url: `/item/user/${userId}/${itemId}/use`,
    method: 'post',
    params: { quantity }
  })
}
