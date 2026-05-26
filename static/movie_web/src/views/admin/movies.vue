<template>
  <div class="admin-layout">
    <div class="admin-header" style="height: 60px">
      <div class="admin-logo">🎬 影院管理系统</div>
      <div style="display: flex; align-items: center; gap: 16px">
        <span>{{ user?.nickname || '管理员' }}</span>
        <el-button type="danger" link @click="handleLogout">退出</el-button>
      </div>
    </div>
    <el-menu mode="horizontal" :default-active="activeMenu" @select="handleMenuSelect" style="background: #001529; border: none">
      <el-menu-item index="dashboard" style="color: white">数据统计</el-menu-item>
      <el-menu-item index="movies" style="color: white">影片管理</el-menu-item>
      <el-menu-item index="showtimes" style="color: white">场次管理</el-menu-item>
      <el-menu-item index="orders" style="color: white">订单管理</el-menu-item>
    </el-menu>
    <div class="admin-content">
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px">
        <h2>影片管理</h2>
        <div style="display: flex; gap: 12px">
          <el-input v-model="keyword" placeholder="搜索影片" style="width: 200px" clearable @input="handleSearch" />
          <el-button type="primary" @click="showDialog = true">+ 添加影片</el-button>
        </div>
      </div>

      <el-card>
        <el-table :data="movies" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="海报" width="100">
            <template #default="{ row }">
              <el-avatar :size="60" :src="row.poster" shape="square" />
            </template>
          </el-table-column>
          <el-table-column prop="title" label="影片名称" min-width="150" />
          <el-table-column prop="genre" label="类型" width="100" />
          <el-table-column prop="duration" label="时长" width="80">
            <template #default="{ row }">{{ row.duration }}分钟</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 0 ? 'success' : row.status === 1 ? 'warning' : 'info'">
                {{ row.status_text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="评分" width="100">
            <template #default="{ row }">{{ row.avg_rating }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="editMovie(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteMovie(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="display: flex; justify-content: center; margin-top: 20px">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="fetchMovies"
            @size-change="fetchMovies"
          />
        </div>
      </el-card>
    </div>

    <el-dialog v-model="showDialog" :title="editingMovie ? '编辑影片' : '添加影片'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="影片标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="海报URL">
          <el-input v-model="form.poster" />
        </el-form-item>
        <el-form-item label="影片描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="时长(分钟)">
              <el-input-number v-model="form.duration" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型">
              <el-input v-model="form.genre" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="导演">
              <el-input v-model="form.director" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主演">
              <el-input v-model="form.actors" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="语言">
              <el-input v-model="form.language" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上映日期">
              <el-date-picker v-model="form.release_date" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="评分">
              <el-input-number v-model="form.rating" :min="0" :max="10" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="上映中" :value="0" />
                <el-option label="即将上映" :value="1" />
                <el-option label="已下映" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="预告片URL">
          <el-input v-model="form.trailer_url" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveMovie">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/api/request'
import { useUserStore } from '@/stores/user'
import type { User, Movie, PaginatedData } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const activeMenu = ref('movies')
const user = ref<User | null>(userStore.user)

const loading = ref(false)
const saving = ref(false)
const movies = ref<Movie[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const keyword = ref('')
const showDialog = ref(false)
const editingMovie = ref<Movie | null>(null)

const form = reactive({
  title: '',
  poster: '',
  description: '',
  duration: 0,
  genre: '',
  director: '',
  actors: '',
  language: '',
  rating: 0,
  trailer_url: '',
  status: 0,
  release_date: ''
})

function resetForm() {
  form.title = ''
  form.poster = ''
  form.description = ''
  form.duration = 0
  form.genre = ''
  form.director = ''
  form.actors = ''
  form.language = ''
  form.rating = 0
  form.trailer_url = ''
  form.status = 0
  form.release_date = ''
}

function handleMenuSelect(index: string) {
  router.push(`/admin/${index}`)
}

async function fetchMovies() {
  loading.value = true
  try {
    const res = await api.get<PaginatedData<Movie>>('/movie/admin/movie/list/get', {
      page: page.value,
      page_size: pageSize.value,
      keyword: keyword.value || undefined
    })
    movies.value = res.data.items
    total.value = res.data.total
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchMovies()
}

function editMovie(movie: Movie) {
  editingMovie.value = movie
  form.title = movie.title
  form.poster = movie.poster
  form.description = movie.description
  form.duration = movie.duration
  form.genre = movie.genre
  form.director = movie.director
  form.actors = movie.actors
  form.language = movie.language
  form.rating = movie.rating
  form.trailer_url = movie.trailer_url
  form.status = movie.status
  form.release_date = movie.release_date
  showDialog.value = true
}

async function saveMovie() {
  if (!form.title) {
    ElMessage.warning('请输入影片标题')
    return
  }
  saving.value = true
  try {
    if (editingMovie.value) {
      await api.post('/movie/admin/movie/update', form, { params: { movie_id: editingMovie.value.id } })
      ElMessage.success('更新成功')
    } else {
      await api.post('/movie/admin/movie/create', form)
      ElMessage.success('添加成功')
    }
    showDialog.value = false
    resetForm()
    editingMovie.value = null
    fetchMovies()
  } catch (e) {
    // handled
  } finally {
    saving.value = false
  }
}

async function deleteMovie(movie: Movie) {
  try {
    await ElMessageBox.confirm(`确定删除影片「${movie.title}」吗？`, '删除确认', { type: 'warning' })
    await api.post('/movie/admin/movie/delete', {}, { params: { movie_id: movie.id } })
    ElMessage.success('删除成功')
    fetchMovies()
  } catch (e: any) {
    if (e !== 'cancel') {
      // handled
    }
  }
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确认退出登录？', '提示', { type: 'warning' })
    await api.post('/movie/admin/logout')
  } catch (e: any) {
    // ignore
  }
  userStore.logout()
  router.push('/admin/login')
}

onMounted(fetchMovies)
</script>