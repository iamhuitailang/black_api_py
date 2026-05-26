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
        <h2>订单管理</h2>
        <div style="display: flex; gap: 12px">
          <el-input v-model="keyword" placeholder="搜索订单号" style="width: 200px" clearable @input="handleSearch" />
          <el-select v-model="statusFilter" placeholder="订单状态" style="width: 140px" clearable @change="fetchOrders">
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="已取消" :value="2" />
            <el-option label="已核销" :value="4" />
          </el-select>
        </div>
      </div>

      <el-card>
        <el-table :data="orders" v-loading="loading" stripe>
          <el-table-column prop="order_no" label="订单号" width="180" />
          <el-table-column label="影片" min-width="120">
            <template #default="{ row }">{{ row.movie?.title || '-' }}</template>
          </el-table-column>
          <el-table-column label="场次" min-width="150">
            <template #default="{ row }">
              {{ row.showtime?.show_date }} {{ row.showtime?.show_time }}
            </template>
          </el-table-column>
          <el-table-column label="用户" min-width="120">
            <template #default="{ row }">{{ row.user?.nickname || row.user?.username || '-' }}</template>
          </el-table-column>
          <el-table-column label="座位" min-width="120">
            <template #default="{ row }">{{ row.seats.join(', ') }}</template>
          </el-table-column>
          <el-table-column label="金额" width="100">
            <template #default="{ row }">¥{{ row.total_amount }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ row.status_text }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="下单时间" width="160" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 1" size="small" type="success" @click="verifyOrder(row)">核销</el-button>
              <el-button size="small" @click="viewDetail(row)">详情</el-button>
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
            @current-change="fetchOrders"
            @size-change="fetchOrders"
          />
        </div>
      </el-card>
    </div>

    <el-dialog v-model="detailDialog" title="订单详情" width="500px">
      <div v-if="currentOrder">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ currentOrder.order_no }}</el-descriptions-item>
          <el-descriptions-item label="影片">{{ currentOrder.movie?.title || '-' }}</el-descriptions-item>
          <el-descriptions-item label="场次">
            {{ currentOrder.showtime?.show_date }} {{ currentOrder.showtime?.show_time }} · {{ currentOrder.showtime?.hall_name }}
          </el-descriptions-item>
          <el-descriptions-item label="座位">{{ currentOrder.seats.join(', ') }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentOrder.user?.nickname || currentOrder.user?.username }}</el-descriptions-item>
          <el-descriptions-item label="金额">¥{{ currentOrder.total_amount }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentOrder.status_text }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ currentOrder.created_at }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.pay_time" label="支付时间">{{ currentOrder.pay_time }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.verified_at" label="核销时间">{{ currentOrder.verified_at }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/api/request'
import { useUserStore } from '@/stores/user'
import type { User, Order, PaginatedData } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const activeMenu = ref('orders')
const user = ref<User | null>(userStore.user)

const loading = ref(false)
const orders = ref<Order[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const keyword = ref('')
const statusFilter = ref<number | undefined>(undefined)
const detailDialog = ref(false)
const currentOrder = ref<Order | null>(null)

function getStatusType(status: number) {
  const map: Record<number, string> = {
    0: 'warning',
    1: 'primary',
    2: 'info',
    3: 'danger',
    4: 'success'
  }
  return map[status] || ''
}

function handleMenuSelect(index: string) {
  router.push(`/admin/${index}`)
}

async function fetchOrders() {
  loading.value = true
  try {
    const res = await api.get<PaginatedData<Order>>('/movie/admin/order/list/get', {
      page: page.value,
      page_size: pageSize.value,
      status: statusFilter.value,
      keyword: keyword.value || undefined
    })
    orders.value = res.data.items
    total.value = res.data.total
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchOrders()
}

async function verifyOrder(order: Order) {
  try {
    await ElMessageBox.confirm(`确认核销订单 ${order.order_no}？`, '核销确认', { type: 'warning' })
    await api.post('/movie/admin/order/verify', {}, { params: { order_id: order.id } })
    ElMessage.success('核销成功')
    fetchOrders()
  } catch (e: any) {
    if (e !== 'cancel') {
      // handled
    }
  }
}

function viewDetail(order: Order) {
  currentOrder.value = order
  detailDialog.value = true
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

onMounted(fetchOrders)
</script>