<script setup lang="ts">
import { useGameStore } from '../stores/gameStore';
import { useUiStore } from '../stores/uiStore';
import { Play, Pause, FastForward, Save, FolderOpen, Settings, FileText, Share2, RotateCcw } from 'lucide-vue-next';

const gameStore = useGameStore();
const uiStore = useUiStore();

function togglePause() {
  gameStore.isPaused = !gameStore.isPaused;
}

function setSpeed(speed: number) {
  gameStore.gameSpeed = speed;
  gameStore.isPaused = false;
}
</script>

<template>
  <div class="control-bar">
    <div class="time-controls">
      <button
        class="control-btn"
        :class="{ active: gameStore.isPaused }"
        @click="togglePause"
        :title="gameStore.isPaused ? '继续' : '暂停'"
      >
        <Pause v-if="!gameStore.isPaused" class="w-5 h-5" />
        <Play v-else class="w-5 h-5" />
      </button>
      <button
        class="control-btn"
        :class="{ active: gameStore.gameSpeed === 1 && !gameStore.isPaused }"
        @click="setSpeed(1)"
        title="1x 速度"
      >
        1x
      </button>
      <button
        class="control-btn"
        :class="{ active: gameStore.gameSpeed === 2 && !gameStore.isPaused }"
        @click="setSpeed(2)"
        title="2x 速度"
      >
        <FastForward class="w-4 h-4" />
      </button>
      <button
        class="control-btn"
        :class="{ active: gameStore.gameSpeed === 3 && !gameStore.isPaused }"
        @click="setSpeed(3)"
        title="3x 速度"
      >
        3x
      </button>
    </div>

    <div class="action-controls">
      <button
        class="control-btn"
        @click="gameStore.saveGame()"
        title="保存游戏"
      >
        <Save class="w-5 h-5" />
        <span>保存</span>
      </button>
      <button
        class="control-btn"
        @click="gameStore.loadGame()"
        title="加载游戏"
      >
        <FolderOpen class="w-5 h-5" />
        <span>加载</span>
      </button>
      <button
        class="control-btn"
        @click="uiStore.openPolicyModal()"
        title="政策管理"
      >
        <FileText class="w-5 h-5" />
        <span>政策</span>
      </button>
      <button
        class="control-btn"
        @click="uiStore.openSocialModal()"
        title="分享城市"
      >
        <Share2 class="w-5 h-5" />
        <span>分享</span>
      </button>
      <button
        class="control-btn"
        @click="gameStore.expandMap()"
        :disabled="gameStore.mapSize >= 30"
        title="扩建地图"
      >
        <span>🗺️</span>
        <span>扩建</span>
      </button>
      <button
        class="control-btn"
        @click="gameStore.requestFitMap = Date.now()"
        title="居中适配地图"
      >
        <span>🎯</span>
        <span>居中</span>
      </button>
      <button
        class="control-btn reset"
        @click="gameStore.resetGame()"
        title="重置游戏"
      >
        <RotateCcw class="w-5 h-5" />
        <span>重置</span>
      </button>
      <button
        class="control-btn"
        @click="uiStore.openSettingsModal()"
        title="设置"
      >
        <Settings class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.control-bar {
  height: 48px;
  background: linear-gradient(90deg, #1e293b 0%, #0f172a 50%, #1e293b 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.time-controls,
.action-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.control-btn:hover {
  background: rgba(74, 144, 217, 0.2);
  color: #e2e8f0;
  border-color: rgba(74, 144, 217, 0.4);
}

.control-btn.active {
  background: rgba(74, 144, 217, 0.3);
  color: #4A90D9;
  border-color: #4A90D9;
}

.control-btn.reset:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}
</style>
