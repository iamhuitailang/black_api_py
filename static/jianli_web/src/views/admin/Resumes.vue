<template>
  <div class="resumes-page">
    <div class="page-header">
      <h2>简历管理</h2>
      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索简历标题"
          style="width: 240px"
          clearable
          @keyup.enter="loadResumes"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="loadResumes">搜索</el-button>
      </div>
    </div>

    <div class="table-card">
      <el-table :data="resumeList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="简历标题" min-width="180" show-overflow-tooltip />
        <el-table-column label="用户" width="120">
          <template #default="scope">
            {{ scope.row.user_id }}
          </template>
        </el-table-column>
        <el-table-column prop="template_name" label="使用模板" width="140" show-overflow-tooltip />
        <el-table-column prop="download_count" label="下载次数" width="100">
          <template #default="scope">
            <el-tag type="primary">{{ scope.row.download_count }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 0 ? 'success' : 'info'">
              {{ scope.row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180">
          <template #default="scope">
            {{ scope.row.updated_at?.split('T')[0] }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ scope.row.created_at?.split('T')[0] }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button size="small" type="danger" @click="deleteResume(scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next, jumper"
          @current-change="loadResumes"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { resumeApi } from '@/api'
import type { Resume } from '@/types'

const resumeList = ref<Resume[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const keyword = ref('')

const loadResumes = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      page_size: pageSize.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }
    const res = await resumeApi.getAllResumes(params)
    resumeList.value = res.items
    total.value = res.total
  } catch (error) {
    console.error('Load resumes error:', error)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = () => {
  page.value = 1
  loadResumes()
}

const deleteResume = async (resumeId: number) => {
  ElMessageBox.confirm('确定要删除该简历吗？删除后无法恢复。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await resumeApi.deleteResume({ resume_id: resumeId })
      ElMessage.success('删除成功')
      loadResumes()
    } catch (error) {
      console.error('Delete resume error:', error)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadResumes()
})
</script>

<style scoped>
.resumes-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  color: #333;
  margin: 0;
}

.search-bar {
  display: flex;
  gap: 12px;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
