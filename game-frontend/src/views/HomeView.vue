<template>
  <div class="screen-container">
    <div class="ink-paper-overlay"></div>

    <div class="title-container">
      <h1 class="ink-title">墨剑闯十关</h1>
      <p class="ink-subtitle">一人 · 一剑 · 十关</p>
    </div>

    <div class="ink-silhouette">
      <svg viewBox="0 0 200 200" width="180" height="180">
        <defs>
          <radialGradient id="silhouetteGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#f0e8d8" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#a09880" stop-opacity="0.3"/>
          </radialGradient>
        </defs>
        <path d="M100 30 L100 90 L85 130 L100 130 L95 170 L115 170 L110 130 L120 130 L105 90 L105 30 Z" fill="url(#silhouetteGrad)"/>
        <line x1="105" y1="50" x2="140" y2="35" stroke="#f0e8d8" stroke-width="3" stroke-linecap="round"/>
        <circle cx="142" cy="33" r="3" fill="#c8a848"/>
      </svg>
    </div>

    <div class="menu-buttons">
      <button class="ink-btn" @click="$emit('start')">开始闯关</button>
      <button class="ink-btn" @click="$emit('ranking')">排行榜</button>
      <div class="name-input">
        <label for="playerName">剑客名号：</label>
        <input 
          id="playerName" 
          v-model="playerName" 
          maxlength="8"
          @blur="saveName"
        />
      </div>
    </div>

    <div class="controls-hint">
      <div class="hint-row">
        <span class="key">J</span><span class="action">挥剑</span>
        <span class="key">K</span><span class="action">跳跃</span>
        <span class="key">L</span><span class="action">冲刺</span>
        <span class="key">P</span><span class="action">暂停</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'HomeView',
  emits: ['start', 'ranking'],
  setup(props, { emit }) {
    const playerName = ref(localStorage.getItem('playerName') || '剑客')

    function saveName() {
      localStorage.setItem('playerName', playerName.value || '剑客')
    }

    onMounted(() => {
      playerName.value = localStorage.getItem('playerName') || '剑客'
    })

    return { playerName, saveName }
  }
}
</script>

<style scoped>
.ink-paper-overlay {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse at 30% 20%, rgba(200, 184, 152, 0.03) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(200, 184, 152, 0.03) 0%, transparent 50%);
  pointer-events: none;
}

.title-container {
  text-align: center;
  margin-bottom: 0.5rem;
}

.ink-silhouette {
  margin: 0.5rem auto 1rem;
  opacity: 0.85;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.menu-buttons {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.name-input {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #a09880;
  font-size: 1rem;
}

.name-input input {
  background: transparent;
  border: 1px solid #3a3028;
  color: #e8e0d0;
  font-family: 'Ma Shan Zheng', serif;
  font-size: 1.1rem;
  padding: 0.3rem 0.6rem;
  width: 120px;
  text-align: center;
  letter-spacing: 0.1em;
}

.name-input input:focus {
  outline: none;
  border-color: #c8b898;
}

.controls-hint {
  position: absolute;
  bottom: 20px;
  width: 100%;
  text-align: center;
}

.hint-row {
  display: inline-flex;
  gap: 0.3rem;
  align-items: center;
  color: #6a5a4a;
  font-size: 0.9rem;
}

.key {
  display: inline-block;
  min-width: 28px;
  padding: 0.15rem 0.4rem;
  border: 1px solid #4a3a2a;
  color: #a09880;
  font-family: monospace;
  font-size: 0.85rem;
  margin-right: 0.2rem;
}

.action {
  margin-right: 1rem;
}
</style>
