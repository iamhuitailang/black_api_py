<template>
  <div class="game-container">
    <div class="status-bar">
      <div class="status-item">
        <span class="status-icon">💰</span>
        <span class="status-value">{{ gameStatus?.profile?.coins || 0 }}</span>
      </div>
      <div class="status-item">
        <span class="status-icon">⭐</span>
        <span class="status-value">Lv.{{ gameStatus?.profile?.level || 1 }}</span>
      </div>
      <div class="status-item">
        <span class="status-icon">🌟</span>
        <span class="status-value">{{ gameStatus?.profile?.reputation || 0 }}</span>
      </div>
      <div class="status-item">
        <span class="status-icon">❤️</span>
        <span class="status-value">{{ gameStatus?.cafe?.atmosphere || 0 }}</span>
      </div>
      <button class="logout-btn" @click="handleLogout">退出</button>
    </div>

    <div class="game-scene">
      <div class="scene-header">
        <h2 class="scene-title">🏠 {{ gameStatus?.cafe?.name || '猫咪咖啡馆' }}</h2>
        <div class="scene-actions">
          <button class="action-btn" :class="{ active: gameStatus?.cafe?.is_open }" @click="handleToggleCafeOpen" :disabled="togglingOpen">
            {{ gameStatus?.cafe?.is_open ? '🔓 营业中' : '🔒 已打烊' }}
          </button>
          <button class="action-btn" @click="handleCheckin" :disabled="checkingIn">
            📅 {{ checkingIn ? '签到中...' : '每日签到' }}
          </button>
          <button class="action-btn" @click="handleGenerateVisitor" :disabled="generating">
            👋 {{ generating ? '召唤中...' : '召唤访客' }}
          </button>
          <button class="action-btn" @click="handleShare">
            📤 分享
          </button>
        </div>
      </div>

      <div class="cafe-scene">
        <div class="cats-area">
          <h3 class="area-title">🐱 店里的猫咪们</h3>
          <div class="cats-display">
            <span v-for="cat in gameStatus?.cats || displayCats" :key="cat.id" class="cat-emoji" :title="cat.name">
              {{ cat.emoji || '🐱' }}
            </span>
          </div>
        </div>

        <div class="visitors-area">
          <h3 class="area-title">👥 客人</h3>
          <div class="visitors-display">
            <div v-for="visitor in displayVisitors" :key="visitor.id" class="visitor-item" :title="visitor.name">
              <span class="visitor-emoji">{{ visitor.emoji || '🧑' }}</span>
              <span v-if="visitor.name" class="visitor-name">{{ visitor.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="orders-section">
        <div class="section-header">
          <h3 class="section-title">📋 待处理订单</h3>
          <button class="add-order-btn" @click="handleGenerateOrder" :disabled="generatingOrder">
            + 新订单
          </button>
        </div>
        <div class="orders-list" v-if="orders.length > 0">
          <OrderCard 
            v-for="order in orders" 
            :key="order.id" 
            :order="order"
            @complete="handleCompleteOrder"
            @cancel="handleCancelOrder"
            @updated="handleOrderUpdated"
          />
        </div>
        <div v-else class="empty-orders">
          <span class="empty-emoji">☕</span>
          <p>暂无订单，点击上方按钮生成新订单~</p>
        </div>
      </div>
    </div>

    <div class="bottom-nav">
      <router-link to="/" class="nav-item active">
        <span class="nav-icon">🏠</span>
        <span class="nav-text">主页</span>
      </router-link>
      <router-link to="/cats" class="nav-item">
        <span class="nav-icon">🐱</span>
        <span class="nav-text">猫咪</span>
      </router-link>
      <router-link to="/menu" class="nav-item">
        <span class="nav-icon">🍰</span>
        <span class="nav-text">菜单</span>
      </router-link>
      <router-link to="/shop" class="nav-item">
        <span class="nav-icon">🛒</span>
        <span class="nav-text">商店</span>
      </router-link>
      <router-link to="/activities" class="nav-item">
        <span class="nav-icon">🎉</span>
        <span class="nav-text">活动</span>
      </router-link>
    </div>

    <div v-if="showShareModal" class="share-modal-overlay" @click.self="showShareModal = false">
      <div class="share-modal">
        <div class="share-header">
          <h3 class="share-title">🎉 分享我的咖啡馆</h3>
          <button class="close-btn" @click="showShareModal = false">✕</button>
        </div>
        
        <div class="share-content">
          <div class="share-cafe-info">
            <div class="cafe-avatar">☕</div>
            <div class="cafe-details">
              <h4 class="cafe-name">{{ shareData?.cafe_name || '猫咪咖啡馆' }}</h4>
              <p class="cafe-owner">店长：{{ shareData?.nickname || '匿名店长' }}</p>
            </div>
          </div>
          
          <div class="share-stats">
            <div class="stat-card">
              <span class="stat-icon">⭐</span>
              <span class="stat-label">等级</span>
              <span class="stat-value">Lv.{{ shareData?.level || 1 }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-icon">💰</span>
              <span class="stat-label">金币</span>
              <span class="stat-value">{{ shareData?.coins || 0 }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-icon">🐱</span>
              <span class="stat-label">猫咪</span>
              <span class="stat-value">{{ shareData?.cat_count || 0 }}只</span>
            </div>
            <div class="stat-card">
              <span class="stat-icon">📋</span>
              <span class="stat-label">订单</span>
              <span class="stat-value">{{ shareData?.completed_orders || 0 }}单</span>
            </div>
          </div>
          
          <div v-if="shareData?.cat_names?.length > 0" class="share-cats">
            <p class="cats-label">我的猫咪：</p>
            <div class="cats-list">
              <span v-for="(cat, index) in shareData.cat_names" :key="index" class="cat-tag">
                🐱 {{ cat }}
              </span>
            </div>
          </div>
          
          <div class="share-text-section">
            <p class="text-label">分享文案：</p>
            <div class="share-text-box">
              <p class="share-text">{{ shareData?.share_text || '快来和我一起经营猫咪咖啡馆吧！' }}</p>
            </div>
          </div>
          
          <div v-if="shareData?.reward_coins || shareData?.reward" class="share-reward">
            <span class="reward-icon">🎁</span>
            <span class="reward-text">分享成功，获得 {{ shareData.reward_coins || shareData.reward }} 金币奖励！</span>
          </div>
        </div>
        
        <div class="share-actions">
          <button class="share-btn copy-btn" @click="handleCopyShareText">
            📋 复制文案
          </button>
          <button class="share-btn close-share-btn" @click="showShareModal = false">
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store'
import { api } from '../api'
import OrderCard from '../components/OrderCard.vue'

const router = useRouter()
const userStore = useUserStore()

const gameStatus = ref(null)
const orders = ref([])
const displayCats = ref([
  { id: 1, name: '小橘', emoji: '🐱' },
  { id: 2, name: '花花', emoji: '😺' },
  { id: 3, name: '雪球', emoji: '😸' }
])
const displayVisitors = ref([
  { id: 1, emoji: '👩' },
  { id: 2, emoji: '👨' }
])

const checkingIn = ref(false)
const generating = ref(false)
const generatingOrder = ref(false)
const togglingOpen = ref(false)
const showShareModal = ref(false)
const shareData = ref(null)

const loadGameStatus = async () => {
  try {
    const res = await api.getGameState()
    if (res?.code === 0) {
      gameStatus.value = res.data
      userStore.setGameStatus(res.data)
      if (res.data.pending_orders) {
        orders.value = res.data.pending_orders
      }
      if (res.data.cats) {
        displayCats.value = res.data.cats.map(cat => ({
          ...cat,
          emoji: cat.emoji || '🐱'
        }))
      }
      if (res.data.active_visitors) {
        displayVisitors.value = res.data.active_visitors.map(visitor => ({
          ...visitor,
          emoji: visitor.emoji || getVisitorEmoji(visitor.name)
        }))
      }
    }
  } catch (error) {
    console.error('Load game status error:', error)
    gameStatus.value = userStore.gameStatus || {
      profile: { coins: 100, level: 1, reputation: 0, nickname: '' },
      cafe: { name: '猫咪咖啡馆', level: 1, is_open: false, atmosphere: 5, cleanliness: 100 },
      cats: [],
      drinks: [],
      pending_orders: [],
      order_stats: {}
    }
    if (gameStatus.value?.cats) {
      displayCats.value = gameStatus.value.cats.map(cat => ({
        ...cat,
        emoji: cat.emoji || '🐱'
      }))
    }
  }
}

const getVisitorEmoji = (name) => {
  const visitorEmojis = ['👩', '👨', '👧', '👦', '🧑', '👴', '👵', '🧔', '👱', '👩‍🦰', '👨‍🦱']
  if (!name) return visitorEmojis[Math.floor(Math.random() * visitorEmojis.length)]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return visitorEmojis[hash % visitorEmojis.length]
}

const loadPendingOrders = async () => {
  try {
    const res = await api.getPendingOrders()
    if (res?.code === 0) {
      const orderList = res.data.items || res.data || []
      orders.value = orderList
      if (gameStatus.value) {
        gameStatus.value.pending_orders = orderList
        userStore.updateGameStatus({ pending_orders: orderList })
      }
    }
  } catch (error) {
    console.error('Load pending orders error:', error)
  }
}

const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    router.push('/login')
  }
}

const handleToggleCafeOpen = async () => {
  togglingOpen.value = true
  try {
    const res = await api.toggleCafeOpen()
    if (res?.code === 0) {
      if (gameStatus.value) {
        gameStatus.value.cafe.is_open = res.data.is_open
        userStore.updateGameStatus({
          cafe: { ...gameStatus.value.cafe, is_open: res.data.is_open }
        })
      }
      alert(res.data.is_open ? '咖啡馆开始营业啦！' : '咖啡馆已打烊~')
    }
  } catch (error) {
    console.error('Toggle cafe open error:', error)
  } finally {
    togglingOpen.value = false
  }
}

const handleCheckin = async () => {
  checkingIn.value = true
  try {
    const res = await api.dailyCheckin()
    if (res?.code === 0) {
      alert(`签到成功！获得 ${res.data.coins || 10} 金币`)
      loadGameStatus()
    } else {
      alert(res?.message || '签到失败')
    }
  } catch (error) {
    console.error('Checkin error:', error)
  } finally {
    checkingIn.value = false
  }
}

const handleGenerateVisitor = async () => {
  generating.value = true
  try {
    const res = await api.generateVisitor()
    if (res?.code === 0) {
      const newVisitor = res.data?.visitor || res.data
      if (newVisitor) {
        const visitorWithEmoji = {
          ...newVisitor,
          emoji: newVisitor.emoji || getVisitorEmoji(newVisitor.name)
        }
        displayVisitors.value.unshift(visitorWithEmoji)
        
        if (gameStatus.value) {
          if (!gameStatus.value.active_visitors) {
            gameStatus.value.active_visitors = []
          }
          gameStatus.value.active_visitors.unshift(visitorWithEmoji)
          userStore.updateGameStatus({
            active_visitors: gameStatus.value.active_visitors
          })
        }
      }
      alert(res.message || `新访客「${newVisitor?.name || '来了'}」！欢迎光临~`)
    }
  } catch (error) {
    console.error('Generate visitor error:', error)
  } finally {
    generating.value = false
  }
}

const handleShare = async () => {
  try {
    const res = await api.share()
    if (res?.code === 0) {
      shareData.value = res.data
      showShareModal.value = true
      loadGameStatus()
    }
  } catch (error) {
    console.error('Share error:', error)
  }
}

const handleCopyShareText = async () => {
  const text = shareData.value?.share_text || '快来和我一起经营猫咪咖啡馆吧！'
  try {
    await navigator.clipboard.writeText(text)
    alert('分享文案已复制到剪贴板！')
  } catch (err) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    alert('分享文案已复制到剪贴板！')
  }
}

const handleGenerateOrder = async () => {
  generatingOrder.value = true
  try {
    const res = await api.generateOrder()
    if (res?.code === 0) {
      orders.value.unshift(res.data)
      if (gameStatus.value) {
        gameStatus.value.pending_orders = orders.value
        userStore.updateGameStatus({ pending_orders: orders.value })
      }
    }
  } catch (error) {
    console.error('Generate order error:', error)
  } finally {
    generatingOrder.value = false
  }
}

const handleCompleteOrder = async (orderId) => {
  try {
    const res = await api.completeOrder(orderId)
    if (res?.code === 0) {
      orders.value = orders.value.filter(o => o.id !== orderId)
      const totalIncome = res.data.total_income || (res.data.order?.total_amount || 0) + (res.data.tip_amount || 0)
      const tipAmount = res.data.tip_amount || 0
      const satisfaction = res.data.satisfaction || 0
      let message = `订单完成！获得 ${totalIncome} 金币`
      if (tipAmount > 0) {
        message += `（含小费 ${tipAmount} 金币）`
      }
      if (satisfaction > 0) {
        message += `\n客人满意度：${satisfaction}%`
      }
      alert(message)
      loadGameStatus()
    } else {
      alert(res?.message || '完成订单失败')
    }
  } catch (error) {
    console.error('Complete order error:', error)
  }
}

const handleCancelOrder = async (orderId) => {
  if (confirm('确定要取消这个订单吗？')) {
    try {
      const res = await api.cancelOrder(orderId)
      if (res?.code === 0) {
        orders.value = orders.value.filter(o => o.id !== orderId)
        if (gameStatus.value) {
          gameStatus.value.pending_orders = orders.value
          userStore.updateGameStatus({ pending_orders: orders.value })
        }
      }
    } catch (error) {
      console.error('Cancel order error:', error)
    }
  }
}

const handleOrderUpdated = (orderId, action, data) => {
  if (action === 'complete' || action === 'cancel') {
    orders.value = orders.value.filter(o => o.id !== orderId)
    if (gameStatus.value) {
      gameStatus.value.pending_orders = orders.value
      userStore.updateGameStatus({ pending_orders: orders.value })
      if (data?.game_status) {
        userStore.updateGameStatus(data.game_status)
      }
    }
  }
}

onMounted(() => {
  loadGameStatus()
})
</script>

<style scoped>
.game-container {
  min-height: 100vh;
  padding-bottom: 80px;
}

.status-bar {
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.25);
  padding: 8px 14px;
  border-radius: 20px;
}

.status-icon {
  font-size: 18px;
}

.status-value {
  color: white;
  font-weight: 600;
  font-size: 15px;
}

.logout-btn {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}

.game-scene {
  padding: 20px;
}

.scene-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.scene-title {
  font-size: 24px;
  color: #FF69B4;
  margin: 0;
}

.scene-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  background: #fff;
  border: 2px solid #FFB6C1;
  color: #FF69B4;
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.action-btn:hover:not(:disabled) {
  background: #FFB6C1;
  color: white;
}

.action-btn.active {
  background: #FF69B4;
  color: white;
  border-color: #FF69B4;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cafe-scene {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(255, 182, 193, 0.2);
}

.area-title {
  font-size: 16px;
  color: #666;
  margin: 0 0 12px 0;
}

.cats-area, .visitors-area {
  margin-bottom: 20px;
}

.cats-display, .visitors-display {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.visitor-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.cat-emoji, .visitor-emoji {
  font-size: 40px;
  cursor: pointer;
  transition: transform 0.3s;
}

.cat-emoji:hover, .visitor-emoji:hover {
  transform: scale(1.2);
}

.visitor-name {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.orders-section {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(255, 182, 193, 0.2);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.add-order-btn {
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.add-order-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.add-order-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-orders {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-emoji {
  font-size: 48px;
  display: block;
  margin-bottom: 10px;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #999;
  padding: 5px 15px;
  border-radius: 12px;
  transition: all 0.3s;
}

.nav-item.active, .nav-item:hover {
  color: #FF69B4;
  background: rgba(255, 182, 193, 0.1);
}

.nav-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.nav-text {
  font-size: 12px;
  font-weight: 500;
}

.share-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.share-modal {
  background: #fff;
  border-radius: 20px;
  max-width: 450px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.share-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.share-title {
  font-size: 20px;
  color: #FF69B4;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 5px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #666;
}

.share-content {
  padding: 20px;
}

.share-cafe-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.cafe-avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
}

.cafe-details {
  flex: 1;
}

.cafe-name {
  font-size: 18px;
  color: #333;
  margin: 0 0 5px 0;
  font-weight: 600;
}

.cafe-owner {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.share-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: #FFF5EE;
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-icon {
  font-size: 24px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.stat-value {
  font-size: 16px;
  color: #FF69B4;
  font-weight: 600;
}

.share-cats {
  margin-bottom: 20px;
}

.cats-label {
  font-size: 14px;
  color: #666;
  margin: 0 0 10px 0;
}

.cats-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cat-tag {
  background: #FFF0F5;
  color: #FF69B4;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 13px;
  font-weight: 500;
}

.share-text-section {
  margin-bottom: 20px;
}

.text-label {
  font-size: 14px;
  color: #666;
  margin: 0 0 10px 0;
}

.share-text-box {
  background: #FFF9E6;
  border-radius: 12px;
  padding: 15px;
  border: 1px dashed #FFD700;
}

.share-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.share-reward {
  background: linear-gradient(135deg, #FFE4B5 0%, #FFD700 100%);
  border-radius: 12px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.reward-icon {
  font-size: 24px;
}

.reward-text {
  font-size: 14px;
  color: #8B4513;
  font-weight: 600;
}

.share-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #f0f0f0;
}

.share-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.copy-btn {
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  color: white;
}

.copy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 105, 180, 0.4);
}

.close-share-btn {
  background: #f0f0f0;
  color: #666;
}

.close-share-btn:hover {
  background: #e0e0e0;
}
</style>
