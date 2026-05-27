<template>
  <div class="character-container">
    <div class="header">
      <router-link to="/home" class="back-btn">← 返回首页</router-link>
      <h1>🎭 选择角色</h1>
      <div></div>
    </div>

    <div class="content">
      <div class="character-grid">
        <div 
          v-for="char in characters" 
          :key="char.id"
          class="character-card"
          :class="{ selected: isSelected(char.id) }"
          @click="selectCharacter(char.id)"
        >
          <div class="character-preview" :style="{ backgroundColor: char.color }">
            <div class="doll">
              <div class="head" :style="{ backgroundColor: char.head_color }"></div>
              <div class="body" :style="{ backgroundColor: char.body_color }"></div>
              <div class="arms">
                <div class="arm left" :style="{ backgroundColor: char.body_color }"></div>
                <div class="arm right" :style="{ backgroundColor: char.body_color }"></div>
              </div>
              <div class="legs">
                <div class="leg left" :style="{ backgroundColor: char.body_color }"></div>
                <div class="leg right" :style="{ backgroundColor: char.body_color }"></div>
              </div>
            </div>
          </div>
          <div class="character-info">
            <h3>{{ char.name }}</h3>
            <p>{{ char.description }}</p>
          </div>
          <div v-if="isSelected(char.id)" class="selected-badge">✓ 已选择</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()

const characters = ref([])
const selectedId = ref(null)

onMounted(async () => {
  await userStore.getCharacters()
  characters.value = userStore.characters
  selectedId.value = userStore.userInfo?.current_character_id
})

const isSelected = (id) => selectedId.value === id

const selectCharacter = async (id) => {
  selectedId.value = id
  await userStore.setCharacter(id)
}
</script>

<style scoped>
.character-container {
  min-height: 100vh;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto 30px;
  color: white;
}

.back-btn {
  color: white;
  text-decoration: none;
  font-weight: 600;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header h1 {
  font-size: 28px;
}

.content {
  max-width: 1000px;
  margin: 0 auto;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.character-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border: 3px solid transparent;
}

.character-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}

.character-card.selected {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.3);
}

.character-preview {
  width: 120px;
  height: 160px;
  margin: 0 auto 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
  position: relative;
  overflow: hidden;
}

.doll {
  position: relative;
  width: 60px;
  height: 120px;
}

.doll .head {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.doll .body {
  width: 35px;
  height: 50px;
  border-radius: 12px;
  position: absolute;
  top: 38px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.doll .arms {
  position: absolute;
  top: 42px;
  width: 100%;
}

.doll .arm {
  width: 12px;
  height: 40px;
  border-radius: 6px;
  position: absolute;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.doll .arm.left {
  left: 0;
  transform: rotate(20deg);
}

.doll .arm.right {
  right: 0;
  transform: rotate(-20deg);
}

.doll .legs {
  position: absolute;
  top: 85px;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.doll .leg {
  width: 12px;
  height: 35px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.character-info h3 {
  color: #333;
  margin-bottom: 8px;
  font-size: 16px;
}

.character-info p {
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}

.selected-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

@media (max-width: 900px) {
  .character-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .character-grid {
    grid-template-columns: 1fr;
  }
}
</style>
