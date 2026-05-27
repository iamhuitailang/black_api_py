<template>
  <Layout>
    <div class="pet-list-page page-container">
      <div class="search-section card">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="搜索">
            <el-input v-model="searchForm.keyword" placeholder="搜索宠物名称、品种" clearable />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="searchForm.type" placeholder="全部" clearable>
              <el-option label="狗狗" value="dog" />
              <el-option label="猫咪" value="cat" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="性别">
            <el-select v-model="searchForm.gender" placeholder="全部" clearable>
              <el-option label="公" value="male" />
              <el-option label="母" value="female" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="全部" clearable>
              <el-option label="可领养" value="available" />
              <el-option label="待审核" value="pending" />
              <el-option label="已领养" value="adopted" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="pet-list">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="8" :md="6" :lg="6" v-for="pet in petList" :key="pet.id">
            <div class="pet-card" @click="viewPetDetail(pet.id)">
              <div class="pet-image-wrapper">
                <img :src="getFirstImage(pet.images)" class="pet-image" :alt="pet.name" />
                <span :class="['status-tag', `status-${pet.status}`]">{{ getStatusText(pet.status) }}</span>
              </div>
              <div class="pet-info">
                <h3 class="pet-name">{{ pet.name }}</h3>
                <p class="pet-desc">{{ pet.breed }} · {{ pet.gender === 'male' ? '公' : '母' }} · {{ pet.age }}个月</p>
                <p class="pet-address">
                  <el-icon size="14"><Location /></el-icon>
                  {{ pet.address }}
                </p>
                <div class="pet-stats">
                  <span><el-icon size="14"><View /></el-icon> {{ pet.view_count }}</span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 48]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>

      <el-empty v-else-if="!loading" description="暂无宠物数据" />
    </div>
  </Layout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { petApi } from '@/api'
import Layout from '@/components/Layout.vue'

const router = useRouter()
const petList = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(12)
const loading = ref(false)

const searchForm = reactive({
  keyword: '',
  type: '',
  gender: '',
  status: 'available'
})

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

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      page_size: pageSize.value,
      ...searchForm
    }
    if (!params.keyword) delete params.keyword
    if (!params.type) delete params.type
    if (!params.gender) delete params.gender
    if (!params.status) delete params.status
    const res = await petApi.getList(params)
    petList.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchData()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.type = ''
  searchForm.gender = ''
  searchForm.status = 'available'
  page.value = 1
  fetchData()
}

function handlePageChange(val) {
  page.value = val
  fetchData()
}

function handleSizeChange(val) {
  pageSize.value = val
  page.value = 1
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.pet-list-page {
  padding-top: 20px;
}

.search-section {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.pet-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
  margin-bottom: 20px;
}

.pet-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.pet-image-wrapper {
  position: relative;
  height: 200px;
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
  padding: 16px;
}

.pet-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.pet-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.pet-address {
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.pet-stats {
  font-size: 12px;
  color: #c0c4cc;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
