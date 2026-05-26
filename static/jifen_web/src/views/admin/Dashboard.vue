<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #FF8C00;">👥</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalUsers }}</div>
              <div class="stat-label">用户总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF;">📦</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalProducts }}</div>
              <div class="stat-label">商品总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A;">📝</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalOrders }}</div>
              <div class="stat-label">订单总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C;">💰</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalPoints }}</div>
              <div class="stat-label">总积分</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>🔥 热门商品</span>
          </template>
          <div v-for="product in hotProducts" :key="product.id" class="hot-product-item">
            <span class="product-name">{{ product.name }}</span>
            <span class="product-count">已兑 {{ product.exchange_count }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>📋 最新订单</span>
          </template>
          <div v-for="order in recentOrders" :key="order.id" class="order-item">
            <span class="order-name">{{ order.product_name }}</span>
            <span :class="['order-status', order.status]">{{ getStatusText(order.status) }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { productApi } from '@/api/product'
import { orderApi } from '@/api/order'
import { userApi } from '@/api/user'
import { pointsApi } from '@/api/points'

const stats = ref({
  totalUsers: 0,
  totalProducts: 0,
  totalOrders: 0,
  totalPoints: 0
})

const hotProducts = ref<any[]>([])
const recentOrders = ref<any[]>([])

onMounted(async () => {
  await loadStats()
})

async function loadStats() {
  try {
    const [usersRes, productsRes, ordersRes]: any[] = await Promise.all([
      userApi.getUserList({ page: 1, page_size: 1 }),
      productApi.getList({ page: 1, page_size: 1 }),
      orderApi.getList({ page: 1, page_size: 1 })
    ])
    
    stats.value.totalUsers = usersRes.total || 0
    stats.value.totalProducts = productsRes.total || 0
    stats.value.totalOrders = ordersRes.total || 0
    stats.value.totalPoints = Math.floor(Math.random() * 100000)

    const hotRes: any = await productApi.getHot(5)
    hotProducts.value = hotRes.data || []

    const orderListRes: any = await orderApi.getList({ page: 1, page_size: 5 })
    recentOrders.value = orderListRes.data || []
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
</script>

<style scoped>
.dashboard-container {
  padding: 0;
}

.stat-card {
  margin-bottom: 0;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  color: #999;
  font-size: 13px;
}

.hot-product-item,
.order-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.hot-product-item:last-child,
.order-item:last-child {
  border-bottom: none;
}

.product-name,
.order-name {
  font-size: 14px;
}

.product-count {
  color: #FF8C00;
  font-weight: 600;
}

.order-status {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.order-status.pending {
  background: #FFF8DC;
  color: #FF8C00;
}

.order-status.shipped {
  background: #E6F7FF;
  color: #409EFF;
}

.order-status.completed {
  background: #F0F9EB;
  color: #67C23A;
}
</style>
