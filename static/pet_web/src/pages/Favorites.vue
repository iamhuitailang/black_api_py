<template>
  <Layout>
    <div class="favorites-page page-container">
      <h2 class="page-title">我的收藏</h2>
      <div class="pet-list">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="8" :md="6" :lg="6" v-for="item in favoriteList" :key="item.id">
            <div class="pet-card">
              <div class="pet-image-wrapper" @click="viewPetDetail(item.pet_id)">
                <img :src="getFirstImage(item.pet_images)" class="pet-image" />
                <span :class="['status-tag', `status-${item.pet_status}`]">{{ getStatusText(item.pet_status) }}</span>
              </div>
              <div class="pet-info">
                <h3 class="pet-name" @click="viewPetDetail(item.pet_id)">{{ item.pet_name }}</h3>
                <el-button type="danger" size="small" @click="removeFavorite(item.id)">
                  取消收藏
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      <el-empty v-if="favoriteList.length === 0 && !loading" description="暂无收藏的宠物" />
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchData"
        />
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { favoriteApi } from '@/api'
import { useUserStore } from '@/stores/user'
import Layout from '@/components/Layout.vue'

const router = useRouter()
const userStore = useUserStore()
const favoriteList = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(12)
const loading = ref(false)

const statusMap = {
  pending: '待审核',
  available: '可领养',
  adopted: '已领养',
  rejected: '已拒绝'
}

function getStatusText(status) {
  return statusMap[status] || status
}

function getFirstImage(images) {
  if (!images) return 'https://placehold.co/300x200?text=No+Image'
  return images.split(',')[0]
}

function viewPetDetail(id) {
  router.push(`/pet/${id}`)
}

async function removeFavorite(id) {
  try {
    await ElMessageBox.confirm('确定要取消收藏吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await favoriteApi.delete(id, userStore.userId)
    ElMessage.success('已取消收藏')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await favoriteApi.getList({ user_id: userStore.userId, page: page.value, page_size: pageSize.value })
    favoriteList.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.favorites-page {
  padding-top: 20px;
}

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #303133;
}

.pet-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.pet-image-wrapper {
  position: relative;
  height: 180px;
  cursor: pointer;
}

.pet-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #fff;
}

.status-pending {
  background: #e6a23c;
}

.status-available {
  background: #67c23a;
}

.status-adopted {
  background: #909399;
}

.status-rejected {
  background: #f56c6c;
}

.pet-info {
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pet-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  cursor: pointer;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
