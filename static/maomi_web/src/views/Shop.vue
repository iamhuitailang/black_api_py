<template>
  <div class="shop-container">
    <div class="page-header">
      <h1 class="page-title">🛒 商店</h1>
      <p class="page-desc">购买道具，让咖啡馆更美好~</p>
    </div>

    <div class="shop-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.key" 
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.emoji }} {{ tab.name }}
      </button>
    </div>

    <div class="shop-grid">
      <ShopItemCard 
        v-for="item in filteredItems" 
        :key="item.id" 
        :item="item"
        @buy="handleBuyItem"
        @use="handleUseItem"
        @updated="handleItemUpdated"
      />
    </div>

    <div v-if="filteredItems.length === 0" class="empty-state">
      <span class="empty-emoji">📦</span>
      <p>暂无商品，敬请期待~</p>
    </div>

    <div class="bottom-nav">
      <router-link to="/" class="nav-item">
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
      <router-link to="/shop" class="nav-item active">
        <span class="nav-icon">🛒</span>
        <span class="nav-text">商店</span>
      </router-link>
      <router-link to="/activities" class="nav-item">
        <span class="nav-icon">🎉</span>
        <span class="nav-text">活动</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../store'
import { api } from '../api'
import ShopItemCard from '../components/ShopItemCard.vue'

const userStore = useUserStore()
const activeTab = ref('all')
const shopItems = ref([])

const tabs = [
  { key: 'all', name: '全部', emoji: '📦' },
  { key: 'cat', name: '猫咪用品', emoji: '🐱' },
  { key: 'decor', name: '装饰', emoji: '🎨' },
  { key: 'food', name: '食材', emoji: '🍳' }
]

const filteredItems = computed(() => {
  if (activeTab.value === 'all') {
    return shopItems.value
  }
  return shopItems.value.filter(item => item.category === activeTab.value)
})

const mergeShopItems = (shopList, userList) => {
  const userItemMap = {}
  userList.forEach(item => {
    userItemMap[item.id] = item
  })
  return shopList.map(item => ({
    ...item,
    owned: userItemMap[item.id]?.quantity || userItemMap[item.id]?.owned || item.owned || 0
  }))
}

const loadShopItems = async () => {
  try {
    const [shopRes, userRes] = await Promise.all([
      api.getShopItems(),
      api.getUserItems()
    ])
    
    if (shopRes?.code === 0) {
      const shopList = shopRes.data.items || shopRes.data || []
      const userList = userRes?.code === 0 ? (userRes.data.items || userRes.data || []) : []
      shopItems.value = mergeShopItems(shopList, userList)
    } else {
      shopItems.value = [
        { id: 1, name: '高级猫粮', category: 'cat', price: 50, emoji: '🍖', description: '营养丰富的高级猫粮', owned: 3 },
        { id: 2, name: '逗猫棒', category: 'cat', price: 30, emoji: '🎣', description: '猫咪最爱的玩具', owned: 5 },
        { id: 3, name: '猫咪香波', category: 'cat', price: 40, emoji: '🧴', description: '让猫咪毛发顺滑', owned: 2 },
        { id: 4, name: '可爱坐垫', category: 'decor', price: 80, emoji: '🪑', description: '温馨的猫咪坐垫', owned: 0 },
        { id: 5, name: '小夜灯', category: 'decor', price: 120, emoji: '💡', description: '营造温馨氛围', owned: 1 },
        { id: 6, name: '新鲜牛奶', category: 'food', price: 20, emoji: '🥛', description: '制作饮品的好材料', owned: 10 },
        { id: 7, name: '有机草莓', category: 'food', price: 35, emoji: '🍓', description: '新鲜有机草莓', owned: 8 },
        { id: 8, name: '抹茶粉', category: 'food', price: 60, emoji: '🍵', description: '优质日式抹茶粉', owned: 4 }
      ]
    }
  } catch (error) {
    console.error('Load shop items error:', error)
    shopItems.value = [
      { id: 1, name: '高级猫粮', category: 'cat', price: 50, emoji: '🍖', description: '营养丰富的高级猫粮', owned: 3 },
      { id: 2, name: '逗猫棒', category: 'cat', price: 30, emoji: '🎣', description: '猫咪最爱的玩具', owned: 5 },
      { id: 3, name: '猫咪香波', category: 'cat', price: 40, emoji: '🧴', description: '让猫咪毛发顺滑', owned: 2 },
      { id: 4, name: '可爱坐垫', category: 'decor', price: 80, emoji: '🪑', description: '温馨的猫咪坐垫', owned: 0 },
      { id: 5, name: '小夜灯', category: 'decor', price: 120, emoji: '💡', description: '营造温馨氛围', owned: 1 },
      { id: 6, name: '新鲜牛奶', category: 'food', price: 20, emoji: '🥛', description: '制作饮品的好材料', owned: 10 },
      { id: 7, name: '有机草莓', category: 'food', price: 35, emoji: '🍓', description: '新鲜有机草莓', owned: 8 },
      { id: 8, name: '抹茶粉', category: 'food', price: 60, emoji: '🍵', description: '优质日式抹茶粉', owned: 4 }
    ]
  }
}

const updateItem = (itemId, updates) => {
  const index = shopItems.value.findIndex(i => i.id === itemId)
  if (index !== -1) {
    shopItems.value[index] = { ...shopItems.value[index], ...updates }
  }
}

const handleBuyItem = async (itemId) => {
  const item = shopItems.value.find(i => i.id === itemId)
  if (!item) return
  
  if (confirm(`确定要花费 ${item.price} 金币购买 ${item.name} 吗？`)) {
    try {
      const res = await api.buyItem(itemId)
      if (res?.code === 0) {
        alert('购买成功！')
        updateItem(itemId, { owned: (item.owned || 0) + 1 })
        if (res.data.game_status) {
          userStore.updateGameStatus(res.data.game_status)
        }
      } else {
        alert(res?.message || '购买失败')
      }
    } catch (error) {
      console.error('Buy item error:', error)
    }
  }
}

const handleUseItem = async (itemId) => {
  const item = shopItems.value.find(i => i.id === itemId)
  if (!item || !item.owned) return
  
  try {
    const res = await api.useItem(itemId)
    if (res?.code === 0) {
      alert(`使用了 ${item.name}！`)
      updateItem(itemId, { owned: Math.max(0, item.owned - 1) })
      if (res.data.game_status) {
        userStore.updateGameStatus(res.data.game_status)
      }
    } else {
      alert(res?.message || '使用失败')
    }
  } catch (error) {
    console.error('Use item error:', error)
  }
}

const handleItemUpdated = (itemId, action) => {
  if (action === 'buy') {
    handleBuyItem(itemId)
  } else if (action === 'use') {
    handleUseItem(itemId)
  }
}

onMounted(() => {
  loadShopItems()
})
</script>

<style scoped>
.shop-container {
  min-height: 100vh;
  padding: 20px 20px 100px;
}

.page-header {
  text-align: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 28px;
  color: #FF69B4;
  margin: 0 0 8px 0;
}

.page-desc {
  color: #999;
  margin: 0;
  font-size: 14px;
}

.shop-tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.tab-btn {
  background: #fff;
  border: 2px solid #FFE4E1;
  color: #999;
  padding: 8px 18px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.tab-btn:hover {
  border-color: #FFB6C1;
}

.tab-btn.active {
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  border-color: transparent;
  color: white;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-emoji {
  font-size: 64px;
  display: block;
  margin-bottom: 15px;
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
</style>
