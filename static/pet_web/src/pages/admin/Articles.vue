<template>
  <div class="admin-articles">
    <h2 class="page-title">文章管理</h2>
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
          发布文章
        </el-button>
      </div>
      <el-table :data="articleList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="author_name" label="作者" />
        <el-table-column prop="view_count" label="浏览量" width="100" />
        <el-table-column prop="created_at" label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row.id)">查看</el-button>
            <el-button type="danger" link @click="deleteArticle(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="发布文章" width="700px">
      <el-form :model="articleForm" label-width="80px">
        <el-form-item label="文章标题">
          <el-input v-model="articleForm.title" placeholder="请输入文章标题" />
        </el-form-item>
        <el-form-item label="文章内容">
          <el-input v-model="articleForm.content" type="textarea" :rows="10" placeholder="请输入文章内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitArticle">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { articleApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const articleList = ref([])
const loading = ref(false)
const showAddDialog = ref(false)
const submitting = ref(false)

const searchForm = reactive({
  keyword: ''
})

const articleForm = reactive({
  title: '',
  content: ''
})

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

function viewDetail(id) {
  router.push(`/article/${id}`)
}

async function deleteArticle(row) {
  try {
    await ElMessageBox.confirm(`确定要删除"${row.title}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await articleApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

async function submitArticle() {
  if (!articleForm.title || !articleForm.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  submitting.value = true
  try {
    await articleApi.create(articleForm, userStore.userId)
    ElMessage.success('发布成功')
    showAddDialog.value = false
    articleForm.title = ''
    articleForm.content = ''
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
    const res = await articleApi.getList(params)
    articleList.value = res.data?.list || []
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
.admin-articles {
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
</style>
