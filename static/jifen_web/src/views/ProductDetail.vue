<template>
  <div class="detail-container">
    <div class="page-header">
      <div class="header-content">
        <el-button text @click="goBack" :icon="ArrowLeft">返回</el-button>
        <div class="points-badge" v-if="userStore.isLogin">
          <span>💰</span>
          <span>{{ userStore.userInfo?.points || 0 }}</span>
        </div>
      </div>
    </div>

    <div class="detail-content" v-if="product">
      <div class="product-showcase">
        <div class="product-image-large">
          <span>{{ getEmoji(product) }}</span>
        </div>
        <div class="product-badges" v-if="product.is_hot">
          <span class="badge hot">🔥 热门</span>
          <span class="badge virtual" v-if="product.is_virtual">🎫 虚拟</span>
          <span class="badge entity" v-else>📦 实体</span>
        </div>
      </div>

      <div class="product-detail">
        <h1 class="product-title">{{ product.name }}</h1>
        <div class="product-price-section">
          <span class="current-price">💰 {{ product.price }}</span>
          <span class="original-price" v-if="product.original_price">
            {{ product.original_price }}
          </span>
          <span class="discount-tag" v-if="product.original_price">
            省{{ product.original_price - product.price }}积分
          </span>
        </div>

        <div class="product-info-row">
          <div class="info-item">
            <span class="label">分类</span>
            <span class="value">{{ product.category_name }}</span>
          </div>
          <div class="info-item">
            <span class="label">库存</span>
            <span class="value">{{ product.stock }}</span>
          </div>
          <div class="info-item">
            <span class="label">已兑</span>
            <span class="value">{{ product.exchange_count }}</span>
          </div>
        </div>

        <div class="limit-info" v-if="product.limit_type !== 'none'">
          <span>⏰ 限购: </span>
          <span>{{ getLimitText(product) }}</span>
        </div>

        <div class="product-description">
          <h3>商品描述</h3>
          <p>{{ product.description || '暂无描述' }}</p>
        </div>

        <div class="exchange-section">
          <el-button 
            type="warning" 
            size="large" 
            class="exchange-btn"
            @click="handleExchange"
            :disabled="!canExchange"
            :loading="loading"
          >
            {{ getButtonText() }}
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="showExchangeDialog" title="确认兑换" width="400px">
      <div class="exchange-dialog-content">
        <p>确定要兑换 <strong>{{ product?.name }}</strong> 吗？</p>
        <p>将消耗 <strong>💰 {{ product?.price }}</strong> 积分</p>
        <p>当前积分: <strong>💰 {{ userStore.userInfo?.points || 0 }}</strong></p>
      </div>
      <template #footer>
        <el-button @click="showExchangeDialog = false">取消</el-button>
        <el-button type="warning" @click="confirmExchange" :loading="exchanging">
          确认兑换
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddressDialog" title="填写收货地址" width="500px">
      <el-form :model="addressForm" label-width="100px">
        <el-form-item label="收件人">
          <el-input v-model="addressForm.receiver_name" placeholder="请输入收件人姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="addressForm.receiver_phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="addressForm.receiver_address" type="textarea" :rows="3" placeholder="请输入详细地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddressDialog = false">取消</el-button>
        <el-button type="warning" @click="submitWithAddress" :loading="exchanging">
          确认兑换
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { productApi } from '@/api/product'
import { orderApi } from '@/api/order'
import { addressApi } from '@/api/address'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const product = ref<any>(null)
const loading = ref(false)
const exchanging = ref(false)
const showExchangeDialog = ref(false)
const showAddressDialog = ref(false)

const addressForm = ref({
  receiver_name: '',
  receiver_phone: '',
  receiver_address: ''
})

const canExchange = computed(() => {
  if (!userStore.isLogin) return false
  if (!product.value) return false
  if (product.value.stock <= 0) return false
  if (userStore.userInfo?.points < product.value.price) return false
  return true
})

onMounted(async () => {
  const id = route.params.id as string
  await loadProduct(Number(id))
  if (userStore.isLogin) {
    await loadDefaultAddress()
  }
})

async function loadProduct(id: number) {
  loading.value = true
  try {
    const res: any = await productApi.getById(id)
    product.value = res.data
  } catch (error) {
    console.error(error)
    ElMessage.error('加载商品失败')
  } finally {
    loading.value = false
  }
}

async function loadDefaultAddress() {
  try {
    const res: any = await addressApi.getDefault()
    if (res.data) {
      addressForm.value = {
        receiver_name: res.data.receiver_name,
        receiver_phone: res.data.phone,
        receiver_address: `${res.data.province}${res.data.city}${res.data.district}${res.data.detail}`
      }
    }
  } catch (error) {
    console.error(error)
  }
}

function getEmoji(p: any) {
  const emojis: Record<number, string> = {
    1: '🎫', 2: '🎫', 3: '🎫', 4: '🎫', 5: '🏅', 6: '🎨',
    7: '🎁', 8: '🔑', 9: '🎖️', 10: '👜', 11: '🧸', 12: '👕', 13: '☕',
    14: '💰', 15: '⚡', 16: '🎮',
    17: '📚', 18: '🎬',
    19: '🎰', 20: '📦'
  }
  return emojis[p.id] || '🎁'
}

function getLimitText(p: any) {
  const texts: Record<string, string> = {
    day: `每日${p.limit_count}次`,
    week: `每周${p.limit_count}次`,
    month: `每月${p.limit_count}次`,
    lifetime: '终身1次'
  }
  return texts[p.limit_type] || '不限'
}

function getButtonText() {
  if (!userStore.isLogin) return '请先登录'
  if (product.value?.stock <= 0) return '已兑完'
  if (userStore.userInfo?.points < product.value?.price) return '积分不足'
  return '立即兑换'
}

function handleExchange() {
  if (!userStore.isLogin) {
    router.push('/login')
    return
  }
  if (product.value?.is_virtual) {
    showExchangeDialog.value = true
  } else {
    showAddressDialog.value = true
  }
}

async function confirmExchange() {
  exchanging.value = true
  try {
    const res: any = await orderApi.create({
      product_id: product.value.id,
      quantity: 1
    })
    ElMessage.success('兑换成功！')
    userStore.updatePoints(userStore.userInfo?.points! - product.value.price)
    showExchangeDialog.value = false
    router.push('/my-orders')
  } catch (error) {
    console.error(error)
  } finally {
    exchanging.value = false
  }
}

async function submitWithAddress() {
  if (!addressForm.value.receiver_name || !addressForm.value.receiver_phone || !addressForm.value.receiver_address) {
    ElMessage.warning('请填写完整的收货信息')
    return
  }
  exchanging.value = true
  try {
    await orderApi.create({
      product_id: product.value.id,
      quantity: 1,
      ...addressForm.value
    })
    ElMessage.success('兑换成功！')
    userStore.updatePoints(userStore.userInfo?.points! - product.value.price)
    showAddressDialog.value = false
    router.push('/my-orders')
  } catch (error) {
    console.error(error)
  } finally {
    exchanging.value = false
  }
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF8DC, #FFE4B5);
}

.page-header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.points-badge {
  background: linear-gradient(135deg, #FF8C00, #FF6600);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.product-showcase {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  margin-bottom: 20px;
  position: relative;
}

.product-image-large {
  font-size: 120px;
  margin-bottom: 20px;
}

.product-badges {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge.hot {
  background: #FF4500;
  color: white;
}

.badge.virtual {
  background: #409EFF;
  color: white;
}

.badge.entity {
  background: #67C23A;
  color: white;
}

.product-detail {
  background: white;
  border-radius: 20px;
  padding: 30px;
}

.product-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 15px;
}

.product-price-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.current-price {
  color: #FF8C00;
  font-size: 28px;
  font-weight: 700;
}

.original-price {
  color: #999;
  text-decoration: line-through;
}

.discount-tag {
  background: #FF4500;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.product-info-row {
  display: flex;
  gap: 30px;
  padding: 15px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  color: #999;
  font-size: 13px;
}

.info-item .value {
  font-weight: 600;
}

.limit-info {
  padding: 10px 15px;
  background: #FFF8DC;
  border-radius: 8px;
  margin: 15px 0;
  color: #FF8C00;
}

.product-description {
  margin-top: 20px;
}

.product-description h3 {
  font-size: 16px;
  margin-bottom: 10px;
}

.product-description p {
  color: #666;
  line-height: 1.6;
}

.exchange-section {
  margin-top: 30px;
  text-align: center;
}

.exchange-btn {
  width: 100%;
  font-size: 18px;
  font-weight: 600;
  height: 50px;
}

.exchange-dialog-content {
  text-align: center;
  padding: 20px 0;
}

.exchange-dialog-content p {
  margin-bottom: 10px;
}

.exchange-dialog-content strong {
  color: #FF8C00;
}
</style>
