<template>
  <div class="admin-notices">
    <h2 class="page-title">公告管理</h2>
    <el-card>
      <div class="flex-between mb-20">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="标题">
            <el-input v-model="searchForm.keyword" placeholder="请输入标题" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchData">搜索</el-button>
          </el-form-item>
        </el-form>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          发布公告
        </el-button>
      </div>
      <el-table :data="noticeList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="type" label="类型">
          <template #default="{ row }">
            <el-tag :type="row.type === 'important' ? 'danger' : 'primary'">
              {{ row.type === 'important' ? '重要' : '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewNotice(row)">查看</el-button>
            <el-button type="danger" link @click="deleteNotice(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="发布公告" width="600px">
      <el-form :model="noticeForm" label-width="80px">
        <el-form-item label="公告标题">
          <el-input v-model="noticeForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="公告类型">
          <el-select v-model="noticeForm.type">
            <el-option label="普通" value="normal" />
            <el-option label="重要" value="important" />
          </el-select>
        </el-form-item>
        <el-form-item label="公告内容">
          <el-input v-model="noticeForm.content" type="textarea" :rows="6" placeholder="请输入公告内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitNotice">发布</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showViewDialog" title="公告详情" width="600px">
      <div v-if="currentNotice">
        <h3>{{ currentNotice.title }}</h3>
        <p class="notice-meta">
          <el-tag :type="currentNotice.type === 'important' ? 'danger' : 'primary'">
            {{ currentNotice.type === 'important' ? '重要' : '普通' }}
          </el-tag>
          {{ formatDate(currentNotice.created_at) }}
        </p>
        <div class="notice-content">{{ currentNotice.content }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { noticeApi } from '@/api'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const noticeList = ref([])
const loading = ref(false)
const showAddDialog = ref(false)
const showViewDialog = ref(false)
const submitting = ref(false)
const currentNotice = ref(null)

const searchForm = reactive({
  keyword: ''
})

const noticeForm = reactive({
  title: '',
  type: 'normal',
  content: ''
})

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

function viewNotice(row) {
  currentNotice.value = row
  showViewDialog.value = true
}

async function deleteNotice(row) {
  try {
    await ElMessageBox.confirm(`确定要删除"${row.title}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await noticeApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

async function submitNotice() {
  if (!noticeForm.title || !noticeForm.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  submitting.value = true
  try {
    await noticeApi.create(noticeForm, userStore.userId)
    ElMessage.success('发布成功')
    showAddDialog.value = false
    noticeForm.title = ''
    noticeForm.content = ''
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page_size: 100,
      ...(searchForm.keyword && { keyword: searchForm.keyword })
    }
    const res = await noticeApi.getList(params)
    noticeList.value = res.data?.list || []
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
.admin-notices {
  padding: 20px;
}

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #303133;
}

.mb-20 {
  margin-bottom: 20px;
}

.notice-meta {
  color: #909399;
  margin: 12px 0 20px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.notice-content {
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
}
</style>
