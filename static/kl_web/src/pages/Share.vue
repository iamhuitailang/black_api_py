<template>
  <div class="share-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>发布分享</span>
          </template>
          <el-form :model="shareForm">
            <el-form-item label="分享类型">
              <el-select v-model="shareForm.type" placeholder="选择类型">
                <el-option label="恐龙展示" value="dinosaur" />
                <el-option label="公园展示" value="park" />
                <el-option label="成就达成" value="achievement" />
                <el-option label="攻略心得" value="guide" />
              </el-select>
            </el-form-item>
            <el-form-item label="分享标题">
              <el-input v-model="shareForm.title" placeholder="给分享起个标题" />
            </el-form-item>
            <el-form-item label="分享内容">
              <el-input 
                v-model="shareForm.content" 
                type="textarea" 
                :rows="4"
                placeholder="分享你的精彩内容..."
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="createShare" :loading="publishing">
                发布分享
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <el-card style="margin-top: 20px">
          <template #header>
            <span>我的分享</span>
          </template>
          <div v-if="myShares.length > 0" class="my-shares">
            <div v-for="share in myShares" :key="share.id" class="my-share-item">
              <div class="share-title">{{ share.title }}</div>
              <div class="share-stats">
                <span>👍 {{ share.likes || 0 }}</span>
                <span>💬 {{ share.comments || 0 }}</span>
                <span>{{ formatTime(share.created_at) }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无分享" :image-size="80" />
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>社区动态</span>
              <el-tabs v-model="activeTab" size="small">
                <el-tab-pane label="全部" name="all" />
                <el-tab-pane label="好友" name="friend" />
                <el-tab-pane label="热门" name="hot" />
              </el-tabs>
            </div>
          </template>
          <div v-if="shares.length > 0" class="share-list">
            <div v-for="share in shares" :key="share.id" class="share-card">
              <div class="share-header">
                <el-avatar :size="40" class="user-avatar">
                  {{ share.username?.charAt(0)?.toUpperCase() }}
                </el-avatar>
                <div class="share-user">
                  <div class="username">{{ share.username }}</div>
                  <div class="share-time">{{ formatTime(share.created_at) }}</div>
                </div>
                <el-tag size="small" type="info">{{ getTypeText(share.type) }}</el-tag>
              </div>
              <div class="share-content">
                <h4>{{ share.title }}</h4>
                <p>{{ share.content }}</p>
              </div>
              <div class="share-actions">
                <el-button 
                  size="small" 
                  :type="share.is_liked ? 'primary' : ''"
                  @click="likeShare(share)"
                >
                  <el-icon><Star /></el-icon>
                  点赞 ({{ share.likes || 0 }})
                </el-button>
                <el-button size="small">
                  <el-icon><ChatDotRound /></el-icon>
                  评论 ({{ share.comments || 0 }})
                </el-button>
                <el-button size="small" type="success">
                  <el-icon><Promotion /></el-icon>
                  分享
                </el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无动态，去发布第一条分享吧！" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  getPublicShares, 
  getShares, 
  createShare as createShareApi,
  interactShare
} from '@/services/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const activeTab = ref('all')
const publishing = ref(false)
const shares = ref([])
const myShares = ref([])
const shareForm = ref({
  type: '',
  title: '',
  content: ''
})

const getTypeText = (type) => {
  const map = {
    dinosaur: '恐龙展示',
    park: '公园展示',
    achievement: '成就达成',
    guide: '攻略心得'
  }
  return map[type] || type
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const loadShares = async () => {
  const res = await getPublicShares()
  if (res.code === 200) {
    shares.value = res.data || [
      {
        id: 1,
        username: '恐龙迷',
        type: 'dinosaur',
        title: '我的第一只霸王龙！',
        content: '终于克隆出了霸王龙，太霸气了！大家快来我的公园参观吧~',
        likes: 128,
        comments: 32,
        created_at: new Date().toISOString(),
        is_liked: false
      },
      {
        id: 2,
        username: '公园大亨',
        type: 'park',
        title: '5级公园达成！',
        content: '经过一周的努力，我的公园终于升到5级了，分享一下我的建设心得...',
        likes: 256,
        comments: 45,
        created_at: new Date().toISOString(),
        is_liked: true
      },
      {
        id: 3,
        username: '化石猎人',
        type: 'achievement',
        title: '传说级化石get！',
        content: '今天运气太好了，发掘到了传说级的霸王龙化石，太开心了！',
        likes: 512,
        comments: 89,
        created_at: new Date().toISOString(),
        is_liked: false
      }
    ]
  }
}

const loadMyShares = async () => {
  const res = await getShares()
  if (res.code === 200) {
    myShares.value = res.data || []
  }
}

const createShare = async () => {
  if (!shareForm.value.type || !shareForm.value.title || !shareForm.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  publishing.value = true
  const res = await createShareApi(shareForm.value)
  publishing.value = false
  
  if (res.code === 200) {
    ElMessage.success('分享发布成功！')
    shareForm.value = { type: '', title: '', content: '' }
    loadShares()
    loadMyShares()
  } else {
    ElMessage.error(res.message || '发布失败')
  }
}

const likeShare = async (share) => {
  const res = await interactShare({
    share_id: share.id,
    type: 'like'
  })
  
  if (res.code === 200) {
    share.is_liked = !share.is_liked
    share.likes += share.is_liked ? 1 : -1
    ElMessage.success(share.is_liked ? '点赞成功！' : '已取消点赞')
  } else {
    ElMessage.error(res.message || '操作失败')
  }
}

onMounted(() => {
  loadShares()
  loadMyShares()
})
</script>

<style scoped>
.share-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.my-shares {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.my-share-item {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.share-title {
  font-weight: 600;
  margin-bottom: 5px;
}

.share-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
}

.share-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.share-card {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s;
}

.share-card:hover {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.share-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.share-user {
  flex: 1;
}

.username {
  font-weight: 600;
  margin-bottom: 2px;
}

.share-time {
  font-size: 12px;
  color: #999;
}

.share-content h4 {
  margin: 0 0 10px 0;
}

.share-content p {
  color: #666;
  margin: 0 0 15px 0;
  line-height: 1.6;
}

.share-actions {
  display: flex;
  gap: 10px;
}
</style>
