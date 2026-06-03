<template>
  <div class="parts-shop-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">零件商店</h1>
        <p class="page-subtitle">购买高性能零件，升级你的赛车</p>
      </div>
      <div class="coins-display">
        <span class="coins-icon">💰</span>
        <span class="coins-label">我的金币：</span>
        <span class="coins-amount">{{ userStore.user?.coins || 0 }}</span>
      </div>
    </div>

    <div class="shop-container">
      <el-tabs v-model="activeTab" class="shop-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="零件商店" name="shop">
          <div class="filter-bar">
            <div class="filter-group">
              <span class="filter-label">类型：</span>
              <el-radio-group v-model="filters.type" size="default" class="type-filter">
                <el-radio-button value="all">全部</el-radio-button>
                <el-radio-button v-for="type in partTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </el-radio-button>
              </el-radio-group>
            </div>
            
            <div class="filter-group">
              <span class="filter-label">等级：</span>
              <div class="tier-filter">
                <el-button
                  v-for="tier in 5"
                  :key="tier"
                  :type="filters.tier === tier ? 'primary' : 'default'"
                  size="small"
                  class="tier-btn"
                  :class="{ active: filters.tier === tier }"
                  @click="filters.tier = filters.tier === tier ? null : tier"
                >
                  <span v-for="s in tier" :key="s">⭐</span>
                </el-button>
                <el-button
                  v-if="filters.tier"
                  size="small"
                  text
                  @click="filters.tier = null"
                >
                  清除
                </el-button>
              </div>
            </div>
            
            <div class="filter-group">
              <span class="filter-label">排序：</span>
              <el-select v-model="filters.sort" size="default" class="sort-select">
                <el-option label="价格从低到高" value="price-asc" />
                <el-option label="价格从高到低" value="price-desc" />
                <el-option label="动力最高" value="power-desc" />
                <el-option label="重量最低" value="weight-asc" />
                <el-option label="抓地力最高" value="grip-desc" />
                <el-option label="空气动力学最高" value="aerodynamics-desc" />
              </el-select>
            </div>
          </div>

          <div v-loading="gameStore.loading" class="parts-grid">
            <div
              v-for="part in filteredParts"
              :key="part.id"
              class="part-card"
              :class="{ 'can-afford': (userStore.user?.coins || 0) >= part.price }"
            >
              <div class="part-header">
                <span class="part-type-badge">{{ getPartTypeName(part.type) }}</span>
                <span :class="['tier-badge', 'tier-' + part.tier]">
                  <span v-for="s in part.tier" :key="s">⭐</span>
                  T{{ part.tier }}
                </span>
              </div>
              
              <h3 class="part-name">{{ part.name }}</h3>
              <p class="part-desc">{{ part.description || '高性能改装零件' }}</p>
              
              <div class="part-stats">
                <div v-if="part.stats?.power" class="stat-row">
                  <span class="stat-icon">⚡</span>
                  <span class="stat-label">动力</span>
                  <span class="stat-value positive">+{{ part.stats.power }}</span>
                </div>
                <div v-if="part.stats?.grip" class="stat-row">
                  <span class="stat-icon">🎯</span>
                  <span class="stat-label">抓地力</span>
                  <span class="stat-value positive">+{{ part.stats.grip }}</span>
                </div>
                <div v-if="part.stats?.weight" class="stat-row">
                  <span class="stat-icon">⚖️</span>
                  <span class="stat-label">重量</span>
                  <span :class="['stat-value', part.stats.weight > 0 ? 'negative' : 'positive']">
                    {{ part.stats.weight > 0 ? '+' : '' }}{{ part.stats.weight }}
                  </span>
                </div>
                <div v-if="part.stats?.aerodynamics" class="stat-row">
                  <span class="stat-icon">🌪️</span>
                  <span class="stat-label">空气动力学</span>
                  <span class="stat-value positive">+{{ part.stats.aerodynamics }}</span>
                </div>
              </div>
              
              <div class="part-footer">
                <div class="part-price">
                  <span class="price-icon">💰</span>
                  <span class="price-value">{{ part.price }}</span>
                </div>
                <el-button
                  type="primary"
                  class="btn-primary buy-btn"
                  :disabled="(userStore.user?.coins || 0) < part.price"
                  @click="handleBuy(part)"
                >
                  购买
                </el-button>
              </div>
            </div>

            <div v-if="filteredParts.length === 0 && !gameStore.loading" class="empty-state">
              <div class="empty-icon">🔍</div>
              <h3 class="empty-title">没有找到零件</h3>
              <p class="empty-desc">试试调整筛选条件</p>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="我的零件" name="inventory">
          <div class="inventory-header">
            <p class="inventory-desc">你拥有 <strong>{{ gameStore.userParts.length }}</strong> 个零件</p>
          </div>
          
          <div v-loading="gameStore.loading" class="parts-grid">
            <div
              v-for="userPart in gameStore.userParts"
              :key="userPart.id"
              class="part-card inventory-card"
            >
              <div class="part-header">
                <span class="part-type-badge">{{ getPartTypeName(userPart.type) }}</span>
                <span :class="['tier-badge', 'tier-' + userPart.tier]">
                  <span v-for="s in userPart.tier" :key="s">⭐</span>
                  T{{ userPart.tier }}
                </span>
              </div>
              
              <h3 class="part-name">{{ userPart.name }}</h3>
              <p class="part-desc">{{ userPart.description || '高性能改装零件' }}</p>
              
              <div class="part-stats">
                <div v-if="userPart.stats?.power" class="stat-row">
                  <span class="stat-icon">⚡</span>
                  <span class="stat-label">动力</span>
                  <span class="stat-value positive">+{{ userPart.stats.power }}</span>
                </div>
                <div v-if="userPart.stats?.grip" class="stat-row">
                  <span class="stat-icon">🎯</span>
                  <span class="stat-label">抓地力</span>
                  <span class="stat-value positive">+{{ userPart.stats.grip }}</span>
                </div>
                <div v-if="userPart.stats?.weight" class="stat-row">
                  <span class="stat-icon">⚖️</span>
                  <span class="stat-label">重量</span>
                  <span :class="['stat-value', userPart.stats.weight > 0 ? 'negative' : 'positive']">
                    {{ userPart.stats.weight > 0 ? '+' : '' }}{{ userPart.stats.weight }}
                  </span>
                </div>
                <div v-if="userPart.stats?.aerodynamics" class="stat-row">
                  <span class="stat-icon">🌪️</span>
                  <span class="stat-label">空气动力学</span>
                  <span class="stat-value positive">+{{ userPart.stats.aerodynamics }}</span>
                </div>
              </div>
              
              <div class="part-footer">
                <div class="part-price">
                  <span class="price-icon">💰</span>
                  <span class="price-value sell-price">{{ Math.floor(userPart.price * 0.7) }}</span>
                  <span class="sell-label">（卖出价）</span>
                </div>
                <el-button
                  type="warning"
                  class="sell-btn"
                  @click="handleSell(userPart)"
                >
                  卖出
                </el-button>
              </div>
              
              <div v-if="userPart.installed" class="installed-badge">
                <el-icon><Check /></el-icon>
                已安装
              </div>
            </div>

            <div v-if="gameStore.userParts.length === 0 && !gameStore.loading" class="empty-state">
              <div class="empty-icon">📦</div>
              <h3 class="empty-title">你还没有零件</h3>
              <p class="empty-desc">去商店购买一些零件吧！</p>
              <el-button type="primary" class="btn-primary" @click="activeTab = 'shop'">
                去购买
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog
      v-model="buyDialogVisible"
      title="确认购买"
      width="420px"
      class="buy-dialog"
    >
      <div v-if="partToBuy" class="buy-content">
        <div class="buy-part-preview">
          <span :class="['tier-badge', 'tier-' + partToBuy.tier, 'large']">
            <span v-for="s in partToBuy.tier" :key="s">⭐</span>
            T{{ partToBuy.tier }}
          </span>
          <h3 class="buy-part-name">{{ partToBuy.name }}</h3>
          <p class="buy-part-type">{{ getPartTypeName(partToBuy.type) }}</p>
        </div>
        
        <div class="buy-stats">
          <div v-if="partToBuy.stats?.power" class="buy-stat">
            <span>⚡ 动力 +{{ partToBuy.stats.power }}</span>
          </div>
          <div v-if="partToBuy.stats?.grip" class="buy-stat">
            <span>🎯 抓地力 +{{ partToBuy.stats.grip }}</span>
          </div>
          <div v-if="partToBuy.stats?.weight" class="buy-stat">
            <span>⚖️ 重量 {{ partToBuy.stats.weight > 0 ? '+' : '' }}{{ partToBuy.stats.weight }}</span>
          </div>
          <div v-if="partToBuy.stats?.aerodynamics" class="buy-stat">
            <span>🌪️ 空气动力学 +{{ partToBuy.stats.aerodynamics }}</span>
          </div>
        </div>
        
        <div class="buy-price-section">
          <div class="current-coins">
            <span>当前金币：</span>
            <span class="coins-amount">{{ userStore.user?.coins || 0 }}</span>
          </div>
          <div class="buy-price">
            <span>购买价格：</span>
            <span class="price-amount">{{ partToBuy.price }}</span>
          </div>
          <div class="remaining-coins">
            <span>购买后剩余：</span>
            <span class="remaining-amount">{{ (userStore.user?.coins || 0) - partToBuy.price }}</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="buyDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          class="btn-primary"
          :disabled="(userStore.user?.coins || 0) < (partToBuy?.price || 0)"
          @click="confirmBuy"
        >
          确认购买
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="sellDialogVisible"
      title="确认卖出"
      width="400px"
      class="sell-dialog"
    >
      <div v-if="partToSell" class="sell-content">
        <el-icon class="warning-icon"><Warning /></el-icon>
        <p>确定要卖出 <strong>{{ partToSell.name }}</strong> 吗？</p>
        <div class="sell-price-info">
          <span>卖出价格：</span>
          <span class="sell-price">💰 {{ Math.floor(partToSell.price * 0.7) }}</span>
        </div>
        <p class="warning-text">卖出后将无法恢复，确定要继续吗？</p>
      </div>
      
      <template #footer>
        <el-button @click="sellDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmSell">确认卖出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Warning } from '@element-plus/icons-vue'
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import { buyPart, sellPart as sellPartApi } from '@/api/part'

const gameStore = useGameStore()
const userStore = useUserStore()

const activeTab = ref('shop')
const buyDialogVisible = ref(false)
const sellDialogVisible = ref(false)
const partToBuy = ref(null)
const partToSell = ref(null)

const filters = reactive({
  type: 'all',
  tier: null,
  sort: 'price-asc'
})

const partTypes = [
  { value: 'engine', label: '引擎', icon: '⚙️' },
  { value: 'chassis', label: '底盘', icon: '🔩' },
  { value: 'suspension', label: '悬挂', icon: '🔧' },
  { value: 'tires', label: '轮胎', icon: '🛞' },
  { value: 'body', label: '车身', icon: '🚘' },
  { value: 'aerodynamics', label: '空力', icon: '🌬️' }
]

const partTypeNames = {
  engine: '引擎',
  chassis: '底盘',
  suspension: '悬挂',
  tires: '轮胎',
  body: '车身',
  aerodynamics: '空气动力学套件'
}

const filteredParts = computed(() => {
  let parts = [...gameStore.parts]
  
  if (filters.type !== 'all') {
    parts = parts.filter(p => p.type === filters.type)
  }
  
  if (filters.tier !== null) {
    parts = parts.filter(p => p.tier === filters.tier)
  }
  
  switch (filters.sort) {
    case 'price-asc':
      parts.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      parts.sort((a, b) => b.price - a.price)
      break
    case 'power-desc':
      parts.sort((a, b) => (b.stats?.power || 0) - (a.stats?.power || 0))
      break
    case 'weight-asc':
      parts.sort((a, b) => (a.stats?.weight || 0) - (b.stats?.weight || 0))
      break
    case 'grip-desc':
      parts.sort((a, b) => (b.stats?.grip || 0) - (a.stats?.grip || 0))
      break
    case 'aerodynamics-desc':
      parts.sort((a, b) => (b.stats?.aerodynamics || 0) - (a.stats?.aerodynamics || 0))
      break
  }
  
  return parts
})

onMounted(async () => {
  await gameStore.fetchUserParts()
  await userStore.fetchCurrentUser()
})

function handleTabChange(tab) {
  if (tab === 'inventory') {
    gameStore.fetchUserParts()
  }
}

function getPartTypeName(type) {
  return partTypeNames[type] || type
}

function handleBuy(part) {
  if ((userStore.user?.coins || 0) < part.price) {
    ElMessage.warning('金币不足！')
    return
  }
  partToBuy.value = part
  buyDialogVisible.value = true
}

async function confirmBuy() {
  if (!partToBuy.value) return
  
  try {
    const res = await buyPart(partToBuy.value.id)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('购买成功！')
      userStore.user.coins -= partToBuy.value.price
      userStore.setUser(userStore.user)
      await gameStore.fetchUserParts()
      buyDialogVisible.value = false
      partToBuy.value = null
    } else {
      ElMessage.error(res.msg || '购买失败')
    }
  } catch (error) {
    ElMessage.error('购买失败')
  }
}

function handleSell(part) {
  partToSell.value = part
  sellDialogVisible.value = true
}

async function confirmSell() {
  if (!partToSell.value) return
  
  try {
    const res = await sellPartApi(partToSell.value.id)
    if (res.code === 0 || res.code === 200) {
      const sellPrice = Math.floor(partToSell.value.price * 0.7)
      ElMessage.success(`卖出成功，获得 ${sellPrice} 金币！`)
      userStore.user.coins += sellPrice
      userStore.setUser(userStore.user)
      gameStore.userParts = gameStore.userParts.filter(p => p.id !== partToSell.value.id)
      sellDialogVisible.value = false
      partToSell.value = null
    } else {
      ElMessage.error(res.msg || '卖出失败')
    }
  } catch (error) {
    ElMessage.error('卖出失败')
  }
}
</script>

<style scoped>
.parts-shop-page {
  padding: 24px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.coins-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
}

.coins-icon {
  font-size: 24px;
}

.coins-label {
  color: #888;
  font-size: 14px;
}

.coins-amount {
  font-size: 24px;
  font-weight: 700;
  color: #ffd700;
}

.shop-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #2a2a4a;
  border-radius: 16px;
  padding: 24px;
}

.shop-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  color: #888;
  font-size: 13px;
  white-space: nowrap;
}

.type-filter :deep(.el-radio-button__inner) {
  background: rgba(255, 255, 255, 0.02);
  border-color: #2a2a4a;
  color: #888;
}

.type-filter :deep(.el-radio-button__inner:hover) {
  border-color: #ff6b00;
  color: #ff6b00;
}

.type-filter :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  border-color: #ff6b00;
  color: #fff;
}

.tier-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tier-btn {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  color: #888;
}

.tier-btn:hover {
  border-color: #ff6b00;
  color: #ff6b00;
}

.tier-btn.active {
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  border-color: #ff6b00;
  color: #fff;
}

.sort-select {
  min-width: 180px;
}

.parts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.part-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.part-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.part-card.can-afford {
  border-color: rgba(255, 107, 0, 0.3);
}

.part-card.can-afford:hover {
  border-color: rgba(255, 107, 0, 0.6);
  box-shadow: 0 12px 32px rgba(255, 107, 0, 0.2);
}

.part-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.part-type-badge {
  font-size: 11px;
  color: #888;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 4px;
}

.tier-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.tier-badge.large {
  padding: 6px 12px;
  font-size: 13px;
  margin-bottom: 12px;
}

.tier-1 { background: rgba(128, 128, 128, 0.2); color: #aaa; }
.tier-2 { background: rgba(0, 255, 0, 0.2); color: #4ade80; }
.tier-3 { background: rgba(0, 112, 255, 0.2); color: #60a5fa; }
.tier-4 { background: rgba(147, 51, 234, 0.2); color: #c084fc; }
.tier-5 { background: rgba(255, 215, 0, 0.2); color: #fbbf24; }

.part-name {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 6px;
}

.part-desc {
  font-size: 13px;
  color: #888;
  margin: 0 0 16px;
}

.part-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.stat-icon {
  font-size: 14px;
}

.stat-label {
  color: #888;
  flex: 1;
}

.stat-value {
  font-weight: 600;
}

.stat-value.positive {
  color: #4ade80;
}

.stat-value.negative {
  color: #f87171;
}

.part-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #2a2a4a;
}

.part-price {
  display: flex;
  align-items: center;
  gap: 6px;
}

.price-icon {
  font-size: 18px;
}

.price-value {
  font-size: 20px;
  font-weight: 700;
  color: #ffd700;
}

.sell-price {
  color: #fbbf24;
}

.sell-label {
  font-size: 12px;
  color: #888;
}

.buy-btn {
  min-width: 80px;
}

.sell-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  color: #fff;
  font-weight: 600;
  min-width: 80px;
}

.sell-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.installed-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #4ade80;
  background: rgba(74, 222, 128, 0.1);
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.inventory-header {
  margin-bottom: 20px;
}

.inventory-desc {
  color: #888;
  font-size: 14px;
  margin: 0;
}

.inventory-desc strong {
  color: #ff6b00;
  font-size: 18px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  font-size: 20px;
  color: #fff;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #888;
  margin-bottom: 20px;
}

.buy-content,
.sell-content {
  color: #fff;
  text-align: center;
  padding: 20px 0;
}

.buy-part-preview {
  margin-bottom: 20px;
}

.buy-part-name {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 4px;
}

.buy-part-type {
  color: #888;
  margin: 0;
}

.buy-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.buy-stat {
  font-size: 14px;
  color: #fff;
}

.buy-price-section {
  text-align: left;
  padding: 16px;
  background: rgba(255, 215, 0, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 8px;
}

.current-coins,
.buy-price,
.remaining-coins {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  color: #fff;
}

.current-coins {
  border-bottom: 1px solid #2a2a4a;
}

.buy-price {
  border-bottom: 1px solid #2a2a4a;
}

.price-amount {
  font-weight: 700;
  color: #ffd700;
}

.remaining-amount {
  font-weight: 700;
  color: #4ade80;
}

.sell-content .warning-icon {
  font-size: 48px;
  color: #f59e0b;
  margin-bottom: 16px;
}

.sell-price-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #fff;
  margin: 16px 0;
}

.sell-price {
  font-size: 24px;
  font-weight: 700;
  color: #fbbf24;
}

.warning-text {
  color: #f56c6c;
  font-size: 13px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .coins-display {
    width: 100%;
    justify-content: center;
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-group {
    flex-wrap: wrap;
  }
  
  .parts-grid {
    grid-template-columns: 1fr;
  }
  
  .buy-stats {
    grid-template-columns: 1fr;
  }
}
</style>
