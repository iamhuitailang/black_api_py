<template>
  <div class="admin-campsites">
    <div class="page-header flex-between">
      <h1 class="page-title">营地管理</h1>
      <el-button type="primary" @click="$router.push('/admin/campsite/create')">
        <el-icon><Plus /></el-icon>
        添加营地
      </el-button>
    </div>

    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索营地名称"
        clearable
        style="width: 250px"
        @keyup.enter="fetchList"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="fetchList">搜索</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="封面" width="120">
        <template #default="{ row }">
          <el-image
            :src="row.cover_image || placeholderImage"
            :preview-src-list="[row.cover_image || placeholderImage]"
            fit="cover"
            style="width: 80px; height: 50px; border-radius: 4px"
          />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="营地名称" />
      <el-table-column prop="location" label="地点" />
      <el-table-column prop="difficulty" label="难度" width="100">
        <template #default="{ row }">
          <el-tag :type="getDifficultyType(row.difficulty)" size="small">
            {{ row.difficulty || '中等' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="view_count" label="浏览量" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '正常' : '已删除' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminCampsites, deleteAdminCampsite } from '@/api/admin'
import type { Campsite } from '@/types'

const loading = ref(false)
const list = ref<Campsite[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const placeholderImage = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200&h=150&fit=crop'

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getAdminCampsites({
      page: page.value,
      page_size: pageSize.value,
      keyword: keyword.value || undefined
    })
    if (res.code === 200) {
      list.value = res.data.items
      total.value = res.data.total
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定要删除这个营地吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteAdminCampsite(id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchList()
      }
    } catch (error) {
      console.error(error)
    }
  }).catch(() => {})
}

const getDifficultyType = (difficulty?: string) => {
  const map: Record<string, string> = {
    '简单': 'success',
    '中等': 'warning',
    '困难': 'danger'
  }
  return map[difficulty || ''] || 'warning'
}

onMounted(fetchList)
</script>

<style scoped>
.admin-campsites {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
