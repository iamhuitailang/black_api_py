<template>
  <div class="menu-container">
    <div class="page-header">
      <h1 class="page-title">🍰 菜单管理</h1>
      <p class="page-desc">为客人准备美味的饮品和甜点~</p>
    </div>

    <div class="menu-tabs">
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

    <div class="menu-grid">
      <MenuItemCard 
        v-for="item in filteredMenu" 
        :key="item.id" 
        :item="item"
      />
    </div>

    <div v-if="filteredMenu.length === 0" class="empty-state">
      <span class="empty-emoji">🍽️</span>
      <p>暂无{{ activeTab === 'drink' ? '饮品' : '甜点' }}，快去添加吧~</p>
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
      <router-link to="/menu" class="nav-item active">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../store'
import { api } from '../api'
import MenuItemCard from '../components/MenuItemCard.vue'

const userStore = useUserStore()
const activeTab = ref('drink')
const menuItems = ref([])

const tabs = [
  { key: 'drink', name: '饮品', emoji: '☕' },
  { key: 'dessert', name: '甜点', emoji: '🍰' }
]

const filteredMenu = computed(() => {
  return menuItems.value.filter(item => item.type === activeTab.value)
})

const getItemEmoji = (type, name) => {
  const drinkEmojis = {
    '拿铁': '☕',
    '咖啡': '☕',
    '奶茶': '🧋',
    '抹茶': '🍵',
    '美式': '☕',
    '卡布奇诺': '☕',
    '摩卡': '☕',
    '红茶': '🍵',
    '绿茶': '🍵',
    '果汁': '🧃',
    '苏打': '🥤',
    '牛奶': '🥛'
  }
  const dessertEmojis = {
    '蛋糕': '🍰',
    '慕斯': '🍓',
    '千层': '🥞',
    '曲奇': '🍪',
    '饼干': '🍪',
    '布丁': '🍮',
    '冰淇淋': '🍦',
    '甜甜圈': '🍩',
    '马卡龙': '�',
    '派': '🥧',
    '巧克力': '🍫',
    '糖果': '🍬'
  }
  const emojiMap = type === 'drink' ? drinkEmojis : dessertEmojis
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (name && name.includes(key)) {
      return emoji
    }
  }
  return type === 'drink' ? '☕' : '🍰'
}

const loadMenu = async () => {
  try {
    const res = await api.getMenu()
    if (res?.code === 0) {
      const items = res.data.items || res.data || []
      menuItems.value = items.map(item => ({
        ...item,
        emoji: item.emoji || getItemEmoji(item.type, item.name)
      }))
      if (userStore.gameStatus) {
        userStore.updateGameStatus({ drinks: menuItems.value })
      }
    }
  } catch (error) {
    console.error('Load menu error:', error)
    menuItems.value = [
      { id: 1, name: '猫爪拿铁', type: 'drink', price: 28, emoji: '☕', description: '可爱的猫爪拉花拿铁' },
      { id: 2, name: '草莓奶茶', type: 'drink', price: 22, emoji: '🧋', description: '新鲜草莓制作的香浓奶茶' },
      { id: 3, name: '抹茶拿铁', type: 'drink', price: 25, emoji: '🍵', description: '日式抹茶与牛奶的完美结合' },
      { id: 4, name: '美式咖啡', type: 'drink', price: 18, emoji: '☕', description: '经典美式，醇厚香浓' },
      { id: 5, name: '猫咪蛋糕', type: 'dessert', price: 38, emoji: '🍰', description: '造型可爱的猫咪主题蛋糕' },
      { id: 6, name: '草莓慕斯', type: 'dessert', price: 32, emoji: '🍓', description: '酸甜可口的草莓慕斯' },
      { id: 7, name: '抹茶千层', type: 'dessert', price: 35, emoji: '🥞', description: '层层分明的抹茶千层蛋糕' },
      { id: 8, name: '巧克力曲奇', type: 'dessert', price: 15, emoji: '🍪', description: '酥脆可口的巧克力曲奇' }
    ]
  }
}

onMounted(() => {
  loadMenu()
})
</script>

<style scoped>
.menu-container {
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

.menu-tabs {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 25px;
}

.tab-btn {
  background: #fff;
  border: 2px solid #FFE4E1;
  color: #999;
  padding: 10px 24px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 15px;
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

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
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
