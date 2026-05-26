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
        <h2>场次管理</h2>
        <el-button type="primary" @click="showDialog = true">+ 添加场次</el-button>
      </div>

      <el-card>
        <el-table :data="showtimes" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="影片" min-width="150">
            <template #default="{ row }">{{ row.movie_title }}</template>
          </el-table-column>
          <el-table-column prop="hall_name" label="影厅" width="100" />
          <el-table-column prop="show_date" label="日期" width="120" />
          <el-table-column prop="show_time" label="时间" width="100" />
          <el-table-column prop="price" label="票价" width="100">
            <template #default="{ row }">¥{{ row.price }}</template>
          </el-table-column>
          <el-table-column label="座位" width="140">
            <template #default="{ row }">
              {{ row.available_seats }} / {{ row.total_seats }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 0 ? 'success' : row.status === 1 ? 'warning' : 'info'">
                {{ row.status_text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="editShowtime(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteShowtime(row)">删除</el-button>
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
            @current-change="fetchShowtimes"
            @size-change="fetchShowtimes"
          />
        </div>
      </el-card>
    </div>

    <el-dialog v-model="showDialog" :title="editingShowtime ? '编辑场次' : '添加场次'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="选择影片">
          <el-select v-model="form.movie_id" style="width: 100%" filterable placeholder="请选择影片">
            <el-option v-for="m in movieList" :key="m.id" :label="m.title" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="影厅名称">
              <el-input v-model="form.hall_name" placeholder="如: 1号厅" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="放映日期">
              <el-date-picker v-model="form.show_date" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="放映时间">
              <el-time-picker v-model="form.show_time" style="width: 100%" format="HH:mm" value-format="HH:mm" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="票价">
              <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="总座位数">
              <el-input-number v-model="form.total_seats" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="开售中" :value="0" />
                <el-option label="已售罄" :value="1" />
                <el-option label="已取消" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveShowtime">保存</el-button>
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
import type { User, Showtime, Movie, PaginatedData } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const activeMenu = ref('showtimes')
const user = ref<User | null>(userStore.user)

const loading = ref(false)
const saving = ref(false)
const showtimes = ref<Showtime[]>([])
const movieList = ref<Movie[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const showDialog = ref(false)
const editingShowtime = ref<Showtime | null>(null)

const form = reactive({
  movie_id: 0,
  hall_name: '',
  show_date: '',
  show_time: '',
  price: 0,
  total_seats: 80,
  status: 0
})

function resetForm() {
  form.movie_id = 0
  form.hall_name = ''
  form.show_date = ''
  form.show_time = ''
  form.price = 0
  form.total_seats = 80
  form.status = 0
}

function handleMenuSelect(index: string) {
  router.push(`/admin/${index}`)
}

async function fetchMovieList() {
  try {
    const res = await api.get<PaginatedData<Movie>>('/movie/list/get', { page_size: 100 })
    movieList.value = res.data.items
  } catch (e) {
    // handled
  }
}

async function fetchShowtimes() {
  loading.value = true
  try {
    const res = await api.get<PaginatedData<Showtime>>('/movie/admin/showtime/list/get', {
      page: page.value,
      page_size: pageSize.value
    })
    showtimes.value = res.data.items
    total.value = res.data.total
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

function editShowtime(st: Showtime) {
  editingShowtime.value = st
  form.movie_id = st.movie_id
  form.hall_name = st.hall_name
  form.show_date = st.show_date
  form.show_time = st.show_time
  form.price = st.price
  form.total_seats = st.total_seats
  form.status = st.status
  showDialog.value = true
}

async function saveShowtime() {
  if (!form.movie_id) {
    ElMessage.warning('请选择影片')
    return
  }
  if (!form.hall_name || !form.show_date || !form.show_time) {
    ElMessage.warning('请填写完整信息')
    return
  }
  saving.value = true
  try {
    if (editingShowtime.value) {
      await api.post('/movie/admin/showtime/update', form, { params: { showtime_id: editingShowtime.value.id } })
      ElMessage.success('更新成功')
    } else {
      await api.post('/movie/admin/showtime/create', form)
      ElMessage.success('添加成功')
    }
    showDialog.value = false
    resetForm()
    editingShowtime.value = null
    fetchShowtimes()
  } catch (e) {
    // handled
  } finally {
    saving.value = false
  }
}

async function deleteShowtime(st: Showtime) {
  try {
    await ElMessageBox.confirm(`确定删除该场次吗？`, '删除确认', { type: 'warning' })
    await api.post('/movie/admin/showtime/delete', {}, { params: { showtime_id: st.id } })
    ElMessage.success('删除成功')
    fetchShowtimes()
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

onMounted(() => {
  fetchMovieList()
  fetchShowtimes()
})
</script>