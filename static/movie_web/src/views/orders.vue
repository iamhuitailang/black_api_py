<template>
  <div class="container" style="margin-top: 20px">
    <h1 class="page-title" style="margin-bottom: 20px">我的订单</h1>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="待支付" name="0" />
      <el-tab-pane label="已支付" name="1" />
      <el-tab-pane label="已取消" name="2" />
      <el-tab-pane label="已核销" name="4" />
    </el-tabs>

    <div v-loading="loading">
      <div v-for="order in orders" :key="order.id" style="margin-bottom: 16px">
        <el-card shadow="hover">
          <div style="display: flex; justify-content: space-between; align-items: start">
            <div style="flex: 1">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px">
                <h3 style="margin: 0">{{ order.movie?.title || '影片' }}</h3>
                <el-tag :type="getStatusType(order.status)">{{ order.status_text }}</el-tag>
              </div>
              <div style="color: #606266; margin-bottom: 8px">
                <el-icon><VideoCamera /></el-icon>
                {{ order.showtime?.show_date }} {{ order.showtime?.show_time }} · {{ order.showtime?.hall_name }}
              </div>
              <div style="color: #606266; margin-bottom: 8px">
                <el-icon><Tickets /></el-icon>
                座位: {{ order.seats.join(', ') }}
              </div>
              <div style="color: #909399; font-size: 13px">
                订单号: {{ order.order_no }} · {{ order.created_at }}
              </div>
            </div>
            <div style="text-align: right">
              <div style="font-size: 20px; color: #f56c6c; font-weight: bold">¥{{ order.total_amount }}</div>
              <div style="margin-top: 12px">
                <el-button v-if="order.status === 0" type="primary" size="small" @click="payOrder(order.id)">支付</el-button>
                <el-button v-if="order.status === 0 || order.status === 1" type="danger" size="small" @click="cancelOrder(order.id)">取消</el-button>
                <el-button v-if="order.status === 1" type="success" size="small" @click="viewQR(order)">取票码</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <div v-if="!loading && orders.length === 0" class="empty-container">
        <el-empty description="暂无订单" />
      </div>

      <div v-if="total > 0" style="display: flex; justify-content: center; margin-top: 20px">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoCamera, Tickets } from '@element-plus/icons-vue'
import { api } from '@/api/request'
import type { Order, PaginatedData } from '@/types'

const activeTab = ref('')
const orders = ref<Order[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

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

async function fetchOrders() {
  loading.value = true
  try {
    const status = activeTab.value === '' ? undefined : Number(activeTab.value)
    const res = await api.get<PaginatedData<Order>>('/movie/order/list/get', {
      page: page.value,
      page_size: pageSize.value,
      status
    })
    orders.value = res.data.items
    total.value = res.data.total
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

async function payOrder(orderId: number) {
  try {
    await ElMessageBox.confirm('确认支付该订单？', '支付确认', { type: 'info' })
    await api.post('/movie/order/pay', {}, { params: { order_id: orderId } })
    ElMessage.success('支付成功')
    fetchOrders()
  } catch (e: any) {
    if (e !== 'cancel') {
      // handled
    }
  }
}

async function cancelOrder(orderId: number) {
  try {
    await ElMessageBox.confirm('确认取消该订单？', '取消确认', { type: 'warning' })
    await api.post('/movie/order/cancel', {}, { params: { order_id: orderId } })
    ElMessage.success('取消成功')
    fetchOrders()
  } catch (e: any) {
    if (e !== 'cancel') {
      // handled
    }
  }
}

function viewQR(order: Order) {
  ElMessageBox.alert(
    `订单号: ${order.order_no}\n请凭订单号到影院检票处核销`,
    '取票信息',
    { confirmButtonText: '知道了' }
  )
}

watch(activeTab, () => {
  page.value = 1
  fetchOrders()
})

onMounted(fetchOrders)
</script>