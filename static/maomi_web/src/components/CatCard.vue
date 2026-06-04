<template>
  <div class="cat-card">
    <div class="cat-header">
      <span class="cat-emoji">{{ catEmoji }}</span>
      <div class="cat-info">
        <h3 class="cat-name">{{ cat.name }}</h3>
        <div class="cat-meta">
          <span class="cat-breed">{{ cat.breed || '猫咪' }}</span>
          <span class="cat-personality">{{ cat.personality || '' }}</span>
        </div>
      </div>
    </div>

    <div class="cat-stats">
      <div class="stat-item">
        <div class="stat-label">
          <span>🍖 饱腹</span>
          <span class="stat-value">{{ cat.hunger || 0 }}%</span>
        </div>
        <div class="stat-bar">
          <div class="stat-fill hunger" :style="{ width: (cat.hunger || 0) + '%' }"></div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-label">
          <span>💖 心情</span>
          <span class="stat-value">{{ cat.mood || 0 }}%</span>
        </div>
        <div class="stat-bar">
          <div class="stat-fill happiness" :style="{ width: (cat.mood || 0) + '%' }"></div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-label">
          <span>⚡ 精力</span>
          <span class="stat-value">{{ cat.energy || 0 }}%</span>
        </div>
        <div class="stat-bar">
          <div class="stat-fill energy" :style="{ width: (cat.energy || 0) + '%' }"></div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-label">
          <span>✨ 清洁</span>
          <span class="stat-value">{{ cat.cleanliness || 0 }}%</span>
        </div>
        <div class="stat-bar">
          <div class="stat-fill cleanliness" :style="{ width: (cat.cleanliness || 0) + '%' }"></div>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-label">
          <span>💕 可爱度</span>
          <span class="stat-value">{{ cat.cuteness || 0 }}%</span>
        </div>
        <div class="stat-bar">
          <div class="stat-fill cuteness" :style="{ width: (cat.cuteness || 0) + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="cat-actions">
      <button class="action-btn feed" @click="handleFeed">
        🍖 喂食
      </button>
      <button class="action-btn play" @click="handlePlay">
        🎾 陪玩
      </button>
      <button class="action-btn clean" @click="handleClean">
        🧼 清洁
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { api } from '../api'

const props = defineProps({
  cat: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['feed', 'play', 'clean', 'updated'])

const catEmoji = computed(() => {
  if (props.cat.emoji) return props.cat.emoji
  return getCatEmoji(props.cat.breed, props.cat.name)
})

const getCatEmoji = (breed, name) => {
  const emojiMap = {
    '橘猫': '🐱',
    '三花猫': '😺',
    '白猫': '😸',
    '黑猫': '🐈‍⬛',
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

const handleFeed = async () => {
  emit('feed', props.cat.id)
}

const handlePlay = async () => {
  emit('play', props.cat.id)
}

const handleClean = async () => {
  emit('clean', props.cat.id)
}
</script>

<style scoped>
.cat-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(255, 182, 193, 0.2);
  transition: all 0.3s;
}

.cat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 182, 193, 0.3);
}

.cat-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 18px;
}

.cat-emoji {
  font-size: 56px;
}

.cat-info {
  flex: 1;
}

.cat-name {
  font-size: 20px;
  color: #333;
  margin: 0 0 4px 0;
  font-weight: 600;
}

.cat-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.cat-breed {
  display: inline-block;
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  color: white;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.cat-personality {
  color: #999;
  font-size: 12px;
}

.cat-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: #FF69B4;
}

.stat-bar {
  height: 8px;
  background: #FFF0F5;
  border-radius: 4px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.stat-fill.hunger {
  background: linear-gradient(90deg, #FFB6C1, #FF69B4);
}

.stat-fill.happiness {
  background: linear-gradient(90deg, #FFD700, #FFA500);
}

.stat-fill.cleanliness {
  background: linear-gradient(90deg, #87CEEB, #4169E1);
}

.stat-fill.energy {
  background: linear-gradient(90deg, #98FB98, #32CD32);
}

.stat-fill.cuteness {
  background: linear-gradient(90deg, #FFB6C1, #FF1493);
}

.cat-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 10px 8px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.feed {
  background: #FFF0F5;
  color: #FF69B4;
}

.action-btn.feed:hover {
  background: #FFB6C1;
  color: white;
}

.action-btn.play {
  background: #FFF8DC;
  color: #FFA500;
}

.action-btn.play:hover {
  background: #FFD700;
  color: white;
}

.action-btn.clean {
  background: #E6F3FF;
  color: #4169E1;
}

.action-btn.clean:hover {
  background: #87CEEB;
  color: white;
}
</style>
