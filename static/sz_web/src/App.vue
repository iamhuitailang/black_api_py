<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useGameStore } from './stores/gameStore';
import { hasSavedGame } from './utils/storage';
import { initAudioOnUserGesture } from './utils/sounds';
import StatusBar from './components/StatusBar.vue';
import ToolBar from './components/ToolBar.vue';
import GameMap from './components/GameMap.vue';
import InfoPanel from './components/InfoPanel.vue';
import ControlBar from './components/ControlBar.vue';
import LandmarkModal from './components/LandmarkModal.vue';
import PolicyModal from './components/PolicyModal.vue';
import SocialModal from './components/SocialModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import Notifications from './components/Notifications.vue';

const gameStore = useGameStore();
const showNewGameModal = ref(false);
const isFirstLoad = ref(true);

let gameLoopId: number | null = null;
let lastTickTime = 0;
const TICK_INTERVAL = 1000;

function gameLoop(timestamp: number) {
  if (!lastTickTime) lastTickTime = timestamp;

  const elapsed = timestamp - lastTickTime;
  const tickDuration = TICK_INTERVAL / gameStore.gameSpeed;

  if (elapsed >= tickDuration && !gameStore.isPaused) {
    gameStore.gameTick();
    lastTickTime = timestamp;
  }

  gameLoopId = requestAnimationFrame(gameLoop);
}

function startGameLoop() {
  lastTickTime = 0;
  gameLoopId = requestAnimationFrame(gameLoop);
}

function stopGameLoop() {
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault();
    gameStore.isPaused = !gameStore.isPaused;
  } else if (e.code === 'Digit1') {
    gameStore.gameSpeed = 1;
    gameStore.isPaused = false;
  } else if (e.code === 'Digit2') {
    gameStore.gameSpeed = 2;
    gameStore.isPaused = false;
  } else if (e.code === 'Digit3') {
    gameStore.gameSpeed = 3;
    gameStore.isPaused = false;
  }
}

function startNewGame() {
  showNewGameModal.value = false;
  gameStore.resetGame();
  gameStore.addNotification('🏙️ 欢迎来到城市建设游戏！开始建造你的梦想城市吧！', 'success');
}

function continueGame() {
  showNewGameModal.value = false;
  gameStore.loadGame();
  gameStore.addNotification('📂 游戏已继续', 'success');
}

onMounted(() => {
  const loadedFromShare = gameStore.loadFromShare();

  if (!loadedFromShare) {
    if (hasSavedGame()) {
      gameStore.loadGame();
    } else {
      gameStore.addNotification('🏙️ 欢迎来到城市建设游戏！开始建造你的梦想城市吧！', 'success');
    }
  }

  startGameLoop();
  window.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', initAudioOnUserGesture, { once: true });

  window.addEventListener('beforeunload', () => {
    gameStore.saveGame(true);
  });

  const autoSaveInterval = setInterval(() => {
    gameStore.saveGame(true);
  }, 30000);

  onUnmounted(() => {
    clearInterval(autoSaveInterval);
  });
});

onUnmounted(() => {
  stopGameLoop();
  window.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('click', initAudioOnUserGesture);
});
</script>

<template>
  <div class="game-container">
    <StatusBar />

    <div class="game-main">
      <ToolBar />
      <GameMap />
      <InfoPanel />
    </div>

    <ControlBar />

    <LandmarkModal />
    <PolicyModal />
    <SocialModal />
    <SettingsModal />
    <Notifications />

    <Transition name="fade">
      <div v-if="showNewGameModal" class="start-modal-overlay">
        <div class="start-modal">
          <div class="start-modal-header">
            <span class="logo">🏙️</span>
            <h1>城市建设游戏</h1>
            <p>从零开始建造你的梦想城市</p>
          </div>

          <div class="start-modal-actions">
            <button class="btn-primary" @click="startNewGame">
              🚀 开始新游戏
            </button>
            <button class="btn-secondary" @click="continueGame">
              📂 继续游戏
            </button>
          </div>

          <div class="start-modal-tips">
            <h3>游戏提示</h3>
            <ul>
              <li>💡 先建造发电站和水塔提供基础设施</li>
              <li>🏠 建造住宅区吸引人口入驻</li>
              <li>🏪 商业区和工业区增加收入</li>
              <li>🏥 医院、学校等设施提升幸福度</li>
              <li>🏛️ 地标建筑大幅提升城市形象</li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

.dark-theme {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-overlay: rgba(0, 0, 0, 0.85);
  --text-primary: #ffffff;
  --text-secondary: #e2e8f0;
  --text-muted: #94a3b8;
  --text-dim: #64748b;
  --border-color: rgba(255, 255, 255, 0.1);
  --card-bg: rgba(255, 255, 255, 0.05);
  --hover-bg: rgba(74, 144, 217, 0.2);
  --active-bg: rgba(74, 144, 217, 0.4);
  --input-bg: rgba(255, 255, 255, 0.05);
  --input-border: rgba(255, 255, 255, 0.1);
  --map-bg: linear-gradient(135deg, #87CEEB 0%, #98D8C8 100%);
  --grass-bg: #86efac;
  --shadow-color: rgba(0, 0, 0, 0.5);
}

.light-theme {
  --bg-primary: #f1f5f9;
  --bg-secondary: #ffffff;
  --bg-overlay: rgba(0, 0, 0, 0.5);
  --text-primary: #0f172a;
  --text-secondary: #334155;
  --text-muted: #64748b;
  --text-dim: #94a3b8;
  --border-color: rgba(0, 0, 0, 0.1);
  --card-bg: rgba(0, 0, 0, 0.03);
  --hover-bg: rgba(74, 144, 217, 0.1);
  --active-bg: rgba(74, 144, 217, 0.2);
  --input-bg: rgba(0, 0, 0, 0.04);
  --input-border: rgba(0, 0, 0, 0.15);
  --map-bg: linear-gradient(135deg, #bae6fd 0%, #bbf7d0 100%);
  --grass-bg: #4ade80;
  --shadow-color: rgba(0, 0, 0, 0.15);
}

.game-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.game-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.start-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
}

.start-modal {
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-radius: 20px;
  padding: 48px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 50px -12px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.start-modal-header .logo {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.start-modal-header h1 {
  color: var(--text-primary);
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.start-modal-header p {
  color: var(--text-muted);
  font-size: 16px;
  margin-bottom: 32px;
}

.start-modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.btn-primary {
  padding: 16px 32px;
  background: linear-gradient(135deg, #4A90D9 0%, #3b82f6 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(74, 144, 217, 0.4);
}

.btn-secondary {
  padding: 16px 32px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--hover-bg);
  border-color: rgba(74, 144, 217, 0.5);
}

.start-modal-tips {
  text-align: left;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
}

.start-modal-tips h3 {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.start-modal-tips ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.start-modal-tips li {
  color: var(--text-muted);
  font-size: 13px;
  padding: 6px 0;
}

.light-theme .status-bar,
.light-theme .control-bar,
.light-theme .toolbar,
.light-theme .info-panel,
.light-theme .modal {
  transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.light-theme .status-bar {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
}

.light-theme .city-name {
  color: #0f172a !important;
}

.light-theme .resource-item {
  color: #334155 !important;
}

.light-theme .resource-max {
  color: #94a3b8 !important;
}

.light-theme .control-bar {
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%) !important;
  border-top: 1px solid rgba(0, 0, 0, 0.1) !important;
}

.light-theme .control-btn {
  color: #334155 !important;
  background: rgba(0, 0, 0, 0.04) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
}

.light-theme .control-btn:hover {
  color: #4A90D9 !important;
  background: rgba(74, 144, 217, 0.08) !important;
}

.light-theme .control-btn.active {
  color: #4A90D9 !important;
  background: rgba(74, 144, 217, 0.12) !important;
}

.light-theme .toolbar {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
  border-right: 1px solid rgba(0, 0, 0, 0.1) !important;
}

.light-theme .toolbar-header {
  color: #0f172a !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
}

.light-theme .tool-group {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
}

.light-theme .group-title {
  color: #64748b !important;
}

.light-theme .tool-btn {
  background: rgba(0, 0, 0, 0.04) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  color: #334155 !important;
}

.light-theme .tool-btn:hover {
  background: rgba(74, 144, 217, 0.08) !important;
  border-color: rgba(74, 144, 217, 0.3) !important;
}

.light-theme .tool-btn.active {
  background: rgba(74, 144, 217, 0.12) !important;
}

.light-theme .info-panel {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
}

.light-theme .panel-tabs {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
}

.light-theme .tab-btn {
  color: #64748b !important;
}

.light-theme .tab-content {
  color: #334155 !important;
}

.light-theme .tile-info {
  background: rgba(0, 0, 0, 0.04) !important;
}

.light-theme .stat .label {
  color: #64748b !important;
}

.light-theme .empty-tile {
  color: #94a3b8 !important;
}

.light-theme .stat-item {
  background: rgba(0, 0, 0, 0.04) !important;
}

.light-theme .stat-label {
  color: #64748b !important;
}

.light-theme .stat-card {
  background: rgba(0, 0, 0, 0.04) !important;
}

.light-theme .stat-card-title {
  color: #64748b !important;
}

.light-theme .progress-bar {
  background: rgba(0, 0, 0, 0.08) !important;
}

.light-theme .hint-box {
  background: rgba(74, 144, 217, 0.06) !important;
  border: 1px solid rgba(74, 144, 217, 0.15) !important;
  color: #334155 !important;
}

.light-theme .building-item {
  border-color: rgba(0, 0, 0, 0.08) !important;
}

.light-theme .landmark-card {
  background: rgba(0, 0, 0, 0.04) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}

.light-theme .effect-tag {
  background: rgba(74, 144, 217, 0.1) !important;
  color: #334155 !important;
}

.light-theme .map-container {
  background: linear-gradient(135deg, #bae6fd 0%, #bbf7d0 100%) !important;
}

.light-theme .modal-overlay {
  background: rgba(0, 0, 0, 0.5) !important;
}

.light-theme .modal {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
}

.light-theme .modal-header h2 {
  color: #0f172a !important;
}

.light-theme .modal-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
}

.light-theme .close-btn {
  color: #64748b !important;
}

.light-theme .close-btn:hover {
  background: rgba(0, 0, 0, 0.06) !important;
  color: #0f172a !important;
}

.light-theme .modal-description {
  color: #64748b !important;
}

.light-theme .landmark-card,
.light-theme .policy-card {
  background: rgba(0, 0, 0, 0.04) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}

.light-theme .landmark-content h3 {
  color: #0f172a !important;
}

.light-theme .toggle-btn {
  color: #334155 !important;
  background: rgba(0, 0, 0, 0.04) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
}

.light-theme .toggle-btn:hover {
  color: #4A90D9 !important;
}

.light-theme .toggle-btn.active {
  color: #4A90D9 !important;
  background: rgba(74, 144, 217, 0.12) !important;
}

.light-theme .setting-label {
  color: #334155 !important;
}

.light-theme .input {
  background: rgba(0, 0, 0, 0.04) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  color: #0f172a !important;
}

.light-theme .setting-group h3 {
  color: #0f172a !important;
}

.light-theme .toggle-switch {
  background: rgba(0, 0, 0, 0.15) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
}

.light-theme .section h3 {
  color: #0f172a !important;
}

.light-theme .link-input {
  background: rgba(0, 0, 0, 0.04) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  color: #0f172a !important;
}

.light-theme .copy-btn {
  color: #334155 !important;
  background: rgba(0, 0, 0, 0.04) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
}

.light-theme .share-btn {
  color: #334155 !important;
  background: rgba(0, 0, 0, 0.04) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
}

.light-theme .email-input {
  background: rgba(0, 0, 0, 0.04) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  color: #0f172a !important;
}

.light-theme .tips {
  color: #64748b !important;
}
</style>
