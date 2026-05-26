<template>
  <div class="orders-container">
    <div class="page-header">
      <div class="header-content">
        <h1>📦 我的兑换</h1>
      </div>
    </div>

    <div class="main-content">
      <div class="filter-tabs">
        <span 
          v-for="tab in tabs" 
          :key="tab.value"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value; loadOrders()"
        >{{ tab.label }}</span>
      </div>

      <div class="orders-list">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-header">
            <span class="order-no">订单号: {{ order.order_no }}</span>
            <span :class="['status', order.status]">{{ getStatusText(order.status) }}</span>
          </div>
          <div class="order-content">
            <div class="order-image">{{ getEmoji(order) }}</div>
            <div class="order-info">
              <h3 class="product-name">{{ order.product_name }}</h3>
              <p class="order-meta">x{{ order.quantity }} · 💰 {{ order.total_price }}</p>
              <p class="order-address" v-if="order.receiver_name">
                {{ order.receiver_name }} {{ order.receiver_phone }}
              </p>
            </div>
          </div>
          <div class="order-footer">
            <span class="order-time">{{ formatTime(order.created_at) }}</span>
            <span class="express" v-if="order.express_no">物流: {{ order.express_no }}</span>
          </div>
        </div>
        <div v-if="orders.length === 0" class="empty-state">
          <span>📭</span>
          <p>暂无兑换记录</p>
          <router-link to="/home" class="go-shopping">去逛逛</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { orderApi } from '@/api/order'

const tabs = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '已发货', value: 'shipped' },
  { label: '已完成', value: 'completed' }
]

const activeTab = ref('')
const orders = ref<any[]>([])

onMounted(() => {
  loadOrders()
})

async function loadOrders() {
  try {
    const params: any = { page: 1, page_size: 50 }
    if (activeTab.value) {
      params.status = activeTab.value
    }
    const res: any = await orderApi.getMyOrders(params)
    orders.value = res.data
  } catch (error) {
    console.error(error)
  }
}

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    pending: '待处理',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

function getEmoji(order: any) {
  if (order.product_name?.includes('优惠券')) return '🎫'
  if (order.product_name?.includes('勋章')) return '🏅'
  if (order.product_name?.includes('边框')) return '🎨'
  if (order.product_name?.includes('贴纸')) return '🎁'
  if (order.product_name?.includes('钥匙扣')) return '🔑'
  if (order.product_name?.includes('徽章')) return '🎖️'
  if (order.product_name?.includes('帆布')) return '👜'
  if (order.product_name?.includes('公仔')) return '🧸'
  if (order.product_name?.includes('T恤')) return '👕'
  if (order.product_name?.includes('马克杯')) return '☕'
  if (order.product_name?.includes('金币')) return '💰'
  if (order.product_name?.includes('经验')) return '⚡'
  if (order.product_name?.includes('皮肤')) return '🎮'
  if (order.product_name?.includes('电子书')) return '📚'
  if (order.product_name?.includes('视频')) return '🎬'
  if (order.product_name?.includes('扭蛋')) return '🎰'
  if (order.product_name?.includes('盲盒')) return '📦'
  return '🎁'
}

function formatTime(time: string) {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.orders-container {
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #FF8C00, #FF6600);
  color: white;
  padding: 20px 0;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-tabs span {
  padding: 8px 20px;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}

.filter-tabs span.active {
  background: linear-gradient(135deg, #FF8C00, #FF6600);
  color: white;
}

.orders-list {
  display: grid;
  gap: 15px;
}

.order-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 15px;
}

.order-no {
  color: #999;
  font-size: 13px;
}

.status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status.pending {
  background: #FFF8DC;
  color: #FF8C00;
}

.status.shipped {
  background: #E6F7FF;
  color: #409EFF;
}

.status.completed {
  background: #F0F9EB;
  color: #67C23A;
}

.status.cancelled {
  background: #FEF0F0;
  color: #F56C6C;
}

.order-content {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.order-image {
  width: 60px;
  height: 60px;
  background: #FFF8DC;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.order-info {
  flex: 1;
}

.product-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}

.order-meta {
  color: #FF8C00;
  font-size: 14px;
  margin-bottom: 4px;
}

.order-address {
  color: #999;
  font-size: 13px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
  color: #999;
  font-size: 13px;
}

.express {
  color: #409EFF;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}

.empty-state span {
  font-size: 64px;
  display: block;
  margin-bottom: 15px;
}

.empty-state p {
  margin-bottom: 20px;
}

.go-shopping {
  display: inline-block;
  padding: 10px 30px;
  background: linear-gradient(135deg, #FF8C00, #FF6600);
  color: white;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
}
</style>
