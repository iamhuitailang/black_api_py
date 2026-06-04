<template>
  <div class="cats-container">
    <div class="page-header">
      <h1 class="page-title">🐱 猫咪管理</h1>
      <p class="page-desc">照顾好每一只可爱的猫咪~</p>
    </div>

    <div class="cats-grid">
      <CatCard 
        v-for="cat in cats" 
        :key="cat.id" 
        :cat="cat"
        @feed="handleFeedCat"
        @play="handlePlayCat"
        @clean="handleCleanCat"
        @updated="handleCatUpdated"
      />
    </div>

    <div v-if="cats.length === 0" class="empty-state">
      <span class="empty-emoji">😿</span>
      <p>还没有猫咪，快去领养一只吧~</p>
    </div>

    <div class="bottom-nav">
      <router-link to="/" class="nav-item">
        <span class="nav-icon">🏠</span>
        <span class="nav-text">主页</span>
      </router-link>
      <router-link to="/cats" class="nav-item active">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../store'
import { api } from '../api'
import CatCard from '../components/CatCard.vue'

const userStore = useUserStore()
const cats = ref([])

const loadCats = async () => {
  try {
    const res = await api.getCats()
    if (res?.code === 0) {
      const catList = res.data.items || res.data || []
      cats.value = catList.map(cat => ({
        ...cat,
        emoji: cat.emoji || getCatEmoji(cat.breed, cat.name)
      }))
      if (userStore.gameStatus) {
        userStore.updateGameStatus({ cats: cats.value })
      }
    }
  } catch (error) {
    console.error('Load cats error:', error)
    cats.value = [
      { id: 1, name: '小橘', emoji: '🐱', breed: '橘猫', personality: '活泼', mood: 90, energy: 80, hunger: 80, cleanliness: 70, cuteness: 85 },
      { id: 2, name: '花花', emoji: '😺', breed: '三花猫', personality: '温顺', mood: 85, energy: 70, hunger: 60, cleanliness: 90, cuteness: 90 },
      { id: 3, name: '雪球', emoji: '😸', breed: '白猫', personality: '高冷', mood: 70, energy: 60, hunger: 40, cleanliness: 60, cuteness: 95 }
    ]
  }
}

const getCatEmoji = (breed, name) => {
  const emojiMap = {
    '橘猫': '🐱',
    '三花猫': '😺',
    '白猫': '😸',
    '黑猫': '�‍⬛',
    '狸花猫': '😻',
    '布偶': '😽',
    '英短': '🙀',
    '美短': '😿'
  }
  if (breed && emojiMap[breed]) return emojiMap[breed]
  if (name && name.includes('橘')) return '🐱'
  if (name && name.includes('花')) return '😺'
  if (name && name.includes('雪') || name.includes('白')) return '😸'
  return '🐱'
}

const updateCat = (catId, updates) => {
  const index = cats.value.findIndex(c => c.id === catId)
  if (index !== -1) {
    cats.value[index] = { ...cats.value[index], ...updates }
    if (userStore.gameStatus) {
      userStore.updateGameStatus({ cats: [...cats.value] })
    }
  }
}

const handleFeedCat = async (catId) => {
  try {
    const res = await api.feedCat(catId)
    if (res?.code === 0) {
      alert(res.message || '喂食成功！猫咪很开心~')
      const updatedCat = res.data?.cat || res.data
      if (updatedCat && updatedCat.id) {
        updateCat(catId, {
          ...updatedCat,
          emoji: updatedCat.emoji || getCatEmoji(updatedCat.breed, updatedCat.name)
        })
      } else {
        updateCat(catId, { hunger: Math.min(100, (cats.value.find(c => c.id === catId)?.hunger || 0) + 20) })
      }
    }
  } catch (error) {
    console.error('Feed cat error:', error)
  }
}

const handlePlayCat = async (catId) => {
  try {
    const res = await api.playCat(catId)
    if (res?.code === 0) {
      alert(res.message || '陪玩成功！猫咪很快乐~')
      const updatedCat = res.data?.cat || res.data
      if (updatedCat && updatedCat.id) {
        updateCat(catId, {
          ...updatedCat,
          emoji: updatedCat.emoji || getCatEmoji(updatedCat.breed, updatedCat.name)
        })
      } else {
        updateCat(catId, { mood: Math.min(100, (cats.value.find(c => c.id === catId)?.mood || 0) + 15), energy: Math.max(0, (cats.value.find(c => c.id === catId)?.energy || 100) - 10) })
      }
    }
  } catch (error) {
    console.error('Play cat error:', error)
  }
}

const handleCleanCat = async (catId) => {
  try {
    const res = await api.cleanCat(catId)
    if (res?.code === 0) {
      alert(res.message || '清洁成功！猫咪干干净净~')
      const updatedCat = res.data?.cat || res.data
      if (updatedCat && updatedCat.id) {
        updateCat(catId, {
          ...updatedCat,
          emoji: updatedCat.emoji || getCatEmoji(updatedCat.breed, updatedCat.name)
        })
      } else {
        updateCat(catId, { cleanliness: 100 })
      }
    }
  } catch (error) {
    console.error('Clean cat error:', error)
  }
}

const handleCatUpdated = (updatedCat) => {
  if (updatedCat && updatedCat.id) {
    updateCat(updatedCat.id, updatedCat)
  }
}

onMounted(() => {
  loadCats()
})
</script>

<style scoped>
.cats-container {
  min-height: 100vh;
  padding: 20px 20px 100px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
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

.cats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
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
