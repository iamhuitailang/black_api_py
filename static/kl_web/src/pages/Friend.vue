<template>
  <div class="friend-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>添加好友</span>
          </template>
          <el-form :model="searchForm" @submit.prevent="searchUser">
            <el-form-item>
              <el-input 
                v-model="searchForm.keyword" 
                placeholder="输入用户名搜索"
                clearable
              >
                <template #append>
                  <el-button type="primary" @click="searchUser">搜索</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
          
          <div v-if="searchResult" class="search-result">
            <div class="user-item">
              <el-avatar :size="48" class="user-avatar">
                {{ searchResult.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <div class="user-info">
                <div class="username">{{ searchResult.username }}</div>
                <div class="user-level">Lv.{{ searchResult.level || 1 }}</div>
              </div>
              <el-button 
                size="small" 
                type="primary"
                :disabled="searchResult.is_friend"
                @click="sendRequest(searchResult.id)"
              >
                {{ searchResult.is_friend ? '已是好友' : '添加好友' }}
              </el-button>
            </div>
          </div>
          
          <el-divider />
          
          <div>
            <h4>好友请求 
              <el-badge :value="friendRequests.length" class="ml-2">
                <el-tag size="small" type="info">新请求</el-tag>
              </el-badge>
            </h4>
            <div v-if="friendRequests.length > 0" class="request-list">
              <div v-for="req in friendRequests" :key="req.id" class="request-item">
                <el-avatar :size="40" class="user-avatar">
                  {{ req.from_username?.charAt(0)?.toUpperCase() }}
                </el-avatar>
                <div class="request-info">
                  <div class="username">{{ req.from_username }}</div>
                  <div class="request-time">{{ formatTime(req.created_at) }}</div>
                </div>
                <div class="request-actions">
                  <el-button size="small" type="success" @click="acceptRequest(req.from_user_id)">
                    接受
                  </el-button>
                  <el-button size="small" @click="rejectRequest(req.from_user_id)">
                    拒绝
                  </el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无好友请求" :image-size="80" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>我的好友</span>
              <el-tag type="info">共 {{ friends.length }} 位</el-tag>
            </div>
          </template>
          <div v-if="friends.length > 0" class="friend-grid">
            <div v-for="friend in friends" :key="friend.id" class="friend-card">
              <div class="friend-header">
                <el-avatar :size="56" class="friend-avatar">
                  {{ friend.friend_username?.charAt(0)?.toUpperCase() }}
                </el-avatar>
                <div class="friend-info">
                  <h4>{{ friend.friend_username }}</h4>
                  <el-tag size="small">Lv.{{ friend.level || 1 }}</el-tag>
                </div>
              </div>
              <div class="friend-stats">
                <div class="stat">
                  <span>公园等级</span>
                  <span>Lv.{{ friend.park_level || 1 }}</span>
                </div>
                <div class="stat">
                  <span>恐龙数量</span>
                  <span>{{ friend.dinosaur_count || 0 }}</span>
                </div>
                <div class="stat">
                  <span>亲密度</span>
                  <span>{{ friend.intimacy || 0 }}</span>
                </div>
              </div>
              <div class="friend-actions">
                <el-button size="small" type="primary" @click="inviteFriend(friend)">
                  邀请游园
                </el-button>
                <el-button size="small" type="success" @click="interactFriend(friend)">
                  互动
                </el-button>
                <el-button size="small" @click="visitPark(friend)">
                  参观
                </el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="还没有好友，快去添加吧！" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  getFriends, 
  getFriendRequests, 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest,
  createInvite,
  interactFriend as interactFriendApi
} from '@/services/api'

const friends = ref([])
const friendRequests = ref([])
const searchForm = ref({
  keyword: ''
})
const searchResult = ref(null)

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN')
}

const loadFriends = async () => {
  const res = await getFriends('accepted')
  if (res.code === 200) {
    friends.value = res.data || []
  }
}

const loadRequests = async () => {
  const res = await getFriendRequests()
  if (res.code === 200) {
    friendRequests.value = res.data || []
  }
}

const searchUser = async () => {
  if (!searchForm.value.keyword) {
    ElMessage.warning('请输入用户名')
    return
  }
  ElMessage.info('搜索功能开发中...')
  searchResult.value = {
    id: 999,
    username: searchForm.value.keyword,
    level: 5,
    is_friend: false
  }
}

const sendRequest = async (userId) => {
  const res = await sendFriendRequest(userId)
  if (res.code === 200) {
    ElMessage.success('好友请求已发送！')
    searchResult.value = null
    searchForm.value.keyword = ''
  } else {
    ElMessage.error(res.message || '发送失败')
  }
}

const acceptRequest = async (friendId) => {
  const res = await acceptFriendRequest(friendId)
  if (res.code === 200) {
    ElMessage.success('已添加好友！')
    loadRequests()
    loadFriends()
  } else {
    ElMessage.error(res.message || '操作失败')
  }
}

const rejectRequest = async (friendId) => {
  const res = await rejectFriendRequest(friendId)
  if (res.code === 200) {
    ElMessage.success('已拒绝请求')
    loadRequests()
  } else {
    ElMessage.error(res.message || '操作失败')
  }
}

const inviteFriend = async (friend) => {
  const res = await createInvite({
    friend_id: friend.friend_id || friend.id,
    message: '来我的公园玩吧！'
  })
  if (res.code === 200) {
    ElMessage.success('邀请已发送！')
  } else {
    ElMessage.error(res.message || '邀请失败')
  }
}

const interactFriend = async (friend) => {
  const res = await interactFriendApi({
    friend_id: friend.friend_id || friend.id,
    type: 'like'
  })
  if (res.code === 200) {
    ElMessage.success('互动成功！亲密度+1')
    loadFriends()
  } else {
    ElMessage.error(res.message || '互动失败')
  }
}

const visitPark = (friend) => {
  ElMessage.info(`正在前往 ${friend.friend_username} 的公园...`)
}

onMounted(() => {
  loadFriends()
  loadRequests()
})
</script>

<style scoped>
.friend-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-result {
  margin-top: 15px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-info {
  flex: 1;
}

.username {
  font-weight: 600;
  margin-bottom: 2px;
}

.user-level {
  font-size: 12px;
  color: #666;
}

.request-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.request-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.request-info {
  flex: 1;
}

.request-time {
  font-size: 12px;
  color: #999;
}

.request-actions {
  display: flex;
  gap: 5px;
}

.friend-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.friend-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;
}

.friend-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.friend-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.friend-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.friend-info h4 {
  margin: 0 0 5px 0;
}

.friend-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 10px;
  background: white;
  border-radius: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.stat span:last-child {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.friend-actions {
  display: flex;
  gap: 8px;
}

.friend-actions .el-button {
  flex: 1;
}
</style>
