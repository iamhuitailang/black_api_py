<template>
  <div class="home-container">
    <div class="page-header">
      <div class="header-content">
        <div class="logo">🎁 积分商城</div>
        <div class="header-actions">
          <div class="points-badge" v-if="userStore.isLogin">
            <span>💰</span>
            <span>{{ userStore.userInfo?.points || 0 }}</span>
          </div>
          <router-link to="/rank" class="rank-link">
            <span>🏆</span> 排行榜
          </router-link>
          <template v-if="userStore.isLogin">
            <el-dropdown>
              <span class="user-info">
                <el-avatar :size="32" :src="userStore.userInfo?.avatar">
                  {{ userStore.userInfo?.nickname?.[0] || 'U' }}
                </el-avatar>
                <span class="username">{{ userStore.userInfo?.nickname }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="goTo('/tasks')">
                    <span>📋</span> 每日任务
                  </el-dropdown-item>
                  <el-dropdown-item @click="goTo('/my-points')">
                    <span>💰</span> 我的积分
                  </el-dropdown-item>
                  <el-dropdown-item @click="goTo('/my-orders')">
                    <span>📦</span> 我的兑换
                  </el-dropdown-item>
                  <el-dropdown-item @click="goTo('/address')">
                    <span>📍</span> 地址管理
                  </el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin" @click="goTo('/admin')">
                    <span>⚙️</span> 管理后台
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    <span>🚪</span> 退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <router-link to="/login" class="login-link">登录</router-link>
          </template>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="banner">
        <div class="banner-content">
          <h2>🎉 每日签到，赢取积分</h2>
          <p>连续签到7天额外奖励50积分！</p>
          <el-button type="warning" size="large" @click="goTo('/tasks')" v-if="userStore.isLogin">
            立即签到
          </el-button>
          <el-button type="warning" size="large" @click="goTo('/login')" v-else>
            登录签到
          </el-button>
        </div>
      </div>

      <div class="hot-products">
        <h3 class="section-title">🔥 热门兑换</h3>
        <div class="product-grid">
          <div 
            v-for="product in hotProducts" 
            :key="product.id" 
            class="product-card"
            @click="goToProduct(product.id)"
          >
            <div class="product-image">
              <div class="placeholder-image">{{ getEmoji(product) }}</div>
              <span class="hot-tag" v-if="product.is_hot">🔥 热</span>
            </div>
            <div class="product-info">
              <h4 class="product-name">{{ product.name }}</h4>
              <div class="product-price">
                <span class="price">💰 {{ product.price }}</span>
                <span class="original" v-if="product.original_price">
                  {{ product.original_price }}
                </span>
              </div>
              <div class="product-stock">
                <span>库存: {{ product.stock }}</span>
                <span class="exchange-count">已兑 {{ product.exchange_count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="category-section">
        <h3 class="section-title">🎯 商品分类</h3>
        <div class="category-tabs">
          <div 
            v-for="cat in categories" 
            :key="cat.id"
            class="category-tab"
            :class="{ active: activeCategory === cat.id }"
            @click="selectCategory(cat.id)"
          >
            <span class="cat-icon">{{ cat.icon }}</span>
            <span>{{ cat.name }}</span>
          </div>
        </div>
        <div class="product-grid">
          <div 
            v-for="product in categoryProducts" 
            :key="product.id" 
            class="product-card"
            @click="goToProduct(product.id)"
          >
            <div class="product-image">
              <div class="placeholder-image">{{ getEmoji(product) }}</div>
              <span class="hot-tag" v-if="product.is_hot">🔥 热</span>
            </div>
            <div class="product-info">
              <h4 class="product-name">{{ product.name }}</h4>
              <div class="product-price">
                <span class="price">💰 {{ product.price }}</span>
              </div>
              <div class="product-stock">
                <span>库存: {{ product.stock }}</span>
                <span class="exchange-count">已兑 {{ product.exchange_count }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="categoryProducts.length === 0" class="empty-state">
          暂无商品
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { categoryApi } from '@/api/category'
import { productApi, type ProductItem } from '@/api/product'

const router = useRouter()
const userStore = useUserStore()

const categories = ref<any[]>([])
const hotProducts = ref<ProductItem[]>([])
const categoryProducts = ref<ProductItem[]>([])
const activeCategory = ref(1)

onMounted(async () => {
  await loadCategories()
  await loadHotProducts()
  if (userStore.isLogin) {
    await userStore.getUserInfo()
  }
})

async function loadCategories() {
  try {
    const res: any = await categoryApi.getList()
    categories.value = res.data
  } catch (error) {
    console.error(error)
  }
}

async function loadHotProducts() {
  try {
    const res: any = await productApi.getHot(8)
    hotProducts.value = res.data
    selectCategory(activeCategory.value)
  } catch (error) {
    console.error(error)
  }
}

async function selectCategory(categoryId: number) {
  activeCategory.value = categoryId
  try {
    const res: any = await productApi.getByCategory(categoryId, { page: 1, page_size: 20 })
    categoryProducts.value = res.data
  } catch (error) {
    console.error(error)
  }
}

function getEmoji(product: ProductItem) {
  const emojis: Record<number, string> = {
    1: '🎫', 2: '🎫', 3: '🎫', 4: '🎫', 5: '🏅', 6: '🎨',
    7: '🎁', 8: '🔑', 9: '🎖️', 10: '👜', 11: '🧸', 12: '👕', 13: '☕',
    14: '💰', 15: '⚡', 16: '🎮',
    17: '📚', 18: '🎬',
    19: '🎰', 20: '📦'
  }
  return emojis[product.id] || '🎁'
}

function goTo(path: string) {
  router.push(path)
}

function goToProduct(id: number) {
  router.push(`/product/${id}`)
}

function handleLogout() {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/home')
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #FF8C00, #FF6600);
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 24px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.points-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rank-link, .login-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-weight: 500;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.banner {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 30px;
  text-align: center;
  color: white;
}

.banner h2 {
  font-size: 28px;
  margin-bottom: 10px;
}

.banner p {
  font-size: 16px;
  margin-bottom: 20px;
  opacity: 0.9;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  margin: 30px 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.product-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(255, 140, 0, 0.2);
}

.product-image {
  height: 160px;
  background: linear-gradient(135deg, #FFF8DC, #FFE4B5);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.placeholder-image {
  font-size: 64px;
}

.hot-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #FF4500;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.product-info {
  padding: 15px;
}

.product-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.price {
  color: #FF8C00;
  font-size: 18px;
  font-weight: 700;
}

.original {
  color: #999;
  font-size: 13px;
  text-decoration: line-through;
}

.product-stock {
  display: flex;
  justify-content: space-between;
  color: #999;
  font-size: 12px;
}

.exchange-count {
  color: #FF8C00;
}

.category-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.category-tab:hover {
  background: #FFF8DC;
}

.category-tab.active {
  background: linear-gradient(135deg, #FF8C00, #FF6600);
  color: white;
}

.cat-icon {
  font-size: 18px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}
</style>
