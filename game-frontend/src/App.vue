<template>
  <div id="game-root">
    <HomeView
      v-if="currentView === 'home'"
      @start="goToLevelSelect"
      @ranking="goToRanking"
    />
    <LevelSelectView
      v-else-if="currentView === 'levelSelect'"
      @select="startLevel"
      @back="goToHome"
    />
    <GameView
      v-else-if="currentView === 'game'"
      :level-id="selectedLevel"
      @complete="onLevelComplete"
      @back="handleGameBack"
      ref="gameViewRef"
    />
    <RankingView
      v-else-if="currentView === 'ranking'"
      @back="goToHome"
    />
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import HomeView from './views/HomeView.vue'
import LevelSelectView from './views/LevelSelectView.vue'
import GameView from './views/GameView.vue'
import RankingView from './views/RankingView.vue'

export default {
  name: 'App',
  components: { HomeView, LevelSelectView, GameView, RankingView },
  setup() {
    const VIEW_SAVE_KEY = 'ink_sword_view_state'
    const currentView = ref('home')
    const selectedLevel = ref(1)
    const gameViewRef = ref(null)

    function _saveViewState() {
      try {
        localStorage.setItem(VIEW_SAVE_KEY, JSON.stringify({
          view: currentView.value,
          level: selectedLevel.value,
          timestamp: Date.now()
        }))
      } catch (e) {}
    }

    function _restoreViewState() {
      try {
        const raw = localStorage.getItem(VIEW_SAVE_KEY)
        if (!raw) return false
        const save = JSON.parse(raw)
        const age = Date.now() - (save.timestamp || 0)
        if (age > 1000 * 60 * 10) {
          localStorage.removeItem(VIEW_SAVE_KEY)
          return false
        }
        if (save.view === 'game' && save.level >= 1 && save.level <= 10) {
          selectedLevel.value = save.level
          currentView.value = 'game'
          return true
        } else if (save.view === 'levelSelect' || save.view === 'ranking') {
          currentView.value = save.view
          return true
        }
        return false
      } catch (e) {
        localStorage.removeItem(VIEW_SAVE_KEY)
        return false
      }
    }

    function _clearViewState() {
      try {
        localStorage.removeItem(VIEW_SAVE_KEY)
      } catch (e) {}
    }

    function startLevel(levelId) {
      selectedLevel.value = levelId
      currentView.value = 'game'
      _saveViewState()
    }

    function onLevelComplete() {
      currentView.value = 'levelSelect'
      _clearViewState()
    }

    function handleNextLevel(e) {
      const nextId = e.detail
      if (nextId >= 1 && nextId <= 10) {
        startLevel(nextId)
      }
    }

    function handleGameBack() {
      currentView.value = 'levelSelect'
      _saveViewState()
    }

    function goToLevelSelect() {
      currentView.value = 'levelSelect'
      _saveViewState()
    }

    function goToRanking() {
      currentView.value = 'ranking'
      _saveViewState()
    }

    function goToHome() {
      currentView.value = 'home'
      _clearViewState()
    }

    onMounted(() => {
      window.addEventListener('next-level', handleNextLevel)
      _restoreViewState()
    })

    onBeforeUnmount(() => {
      window.removeEventListener('next-level', handleNextLevel)
    })

    return { 
      currentView, selectedLevel, gameViewRef, startLevel, onLevelComplete, handleGameBack,
      goToLevelSelect, goToRanking, goToHome
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;700&display=swap');

#game-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #0a0a0a;
  font-family: 'Ma Shan Zheng', 'Noto Serif SC', serif;
  color: #e8e0d0;
  user-select: none;
  overflow: hidden;
}

.ink-title {
  font-size: 3.5rem;
  color: #f0e8d8;
  text-shadow: 0 0 30px rgba(240, 232, 216, 0.3), 0 0 60px rgba(240, 232, 216, 0.1);
  letter-spacing: 0.3em;
  margin-bottom: 1rem;
}

.ink-subtitle {
  font-size: 1.2rem;
  color: #a09880;
  letter-spacing: 0.2em;
  margin-bottom: 2rem;
}

.ink-btn {
  display: block;
  width: 220px;
  margin: 0.6rem auto;
  padding: 0.8rem 1.5rem;
  background: transparent;
  border: 1px solid #5a4a3a;
  color: #d8d0c0;
  font-family: 'Ma Shan Zheng', serif;
  font-size: 1.3rem;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.ink-btn:hover {
  border-color: #c8b898;
  color: #f0e8d8;
  background: rgba(200, 184, 152, 0.08);
  text-shadow: 0 0 10px rgba(240, 232, 216, 0.5);
}

.ink-btn:active {
  transform: scale(0.97);
}

.screen-container {
  width: 960px;
  height: 540px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  background: radial-gradient(ellipse at center, #1a1510 0%, #0a0a0a 100%);
  border: 1px solid #2a2218;
}
</style>
