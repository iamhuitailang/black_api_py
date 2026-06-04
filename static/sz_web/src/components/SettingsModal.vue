<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { useUiStore } from '../stores/uiStore';
import { X, Volume2, VolumeX, Sun, Moon } from 'lucide-vue-next';

const gameStore = useGameStore();
const uiStore = useUiStore();

const cityName = ref(gameStore.cityName);

onMounted(() => {
  cityName.value = gameStore.cityName;
});

function updateCityName() {
  if (cityName.value.trim()) {
    gameStore.cityName = cityName.value.trim();
    gameStore.addNotification('✅ 城市名称已更新', 'success');
  }
}
</script>

<template>
  <div v-if="uiStore.showSettingsModal" class="modal-overlay" @click.self="uiStore.closeAllModals()">
    <div class="modal">
      <div class="modal-header">
        <h2>⚙️ 设置</h2>
        <button class="close-btn" @click="uiStore.closeAllModals()">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="modal-content">
        <div class="setting-group">
          <h3>城市设置</h3>
          <div class="setting-item">
            <label>城市名称</label>
            <div class="name-input">
              <input
                v-model="cityName"
                type="text"
                maxlength="20"
                class="input"
                @keyup.enter="updateCityName"
              />
              <button class="save-btn" @click="updateCityName">保存</button>
            </div>
          </div>
        </div>

        <div class="setting-group">
          <h3>游戏设置</h3>

          <div class="setting-item">
            <div class="setting-label">
              <span class="setting-icon">
                <Volume2 v-if="uiStore.soundEnabled" class="w-5 h-5" />
                <VolumeX v-else class="w-5 h-5" />
              </span>
              <span>音效</span>
            </div>
            <button
              class="toggle-switch"
              :class="{ active: uiStore.soundEnabled }"
              @click="uiStore.toggleSound()"
            >
              <span class="toggle-knob"></span>
            </button>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="setting-icon">
                <Sun v-if="!uiStore.darkMode" class="w-5 h-5" />
                <Moon v-else class="w-5 h-5" />
              </span>
              <span>深色模式</span>
            </div>
            <button
              class="toggle-switch"
              :class="{ active: uiStore.darkMode }"
              @click="uiStore.toggleDarkMode()"
            >
              <span class="toggle-knob"></span>
            </button>
          </div>

          <div class="setting-item">
            <div class="setting-label">
              <span class="setting-icon">💾</span>
              <span>自动保存</span>
            </div>
            <button
              class="toggle-switch"
              :class="{ active: uiStore.autoSave }"
              @click="uiStore.toggleAutoSave()"
            >
              <span class="toggle-knob"></span>
            </button>
          </div>
        </div>

        <div class="setting-group">
          <h3>快捷键</h3>
          <div class="shortcuts-list">
            <div class="shortcut-item">
              <span class="keys">
                <kbd>空格</kbd>
              </span>
              <span>暂停/继续</span>
            </div>
            <div class="shortcut-item">
              <span class="keys">
                <kbd>Shift</kbd> + <kbd>拖拽</kbd>
              </span>
              <span>移动地图</span>
            </div>
            <div class="shortcut-item">
              <span class="keys">
                <kbd>滚轮</kbd>
              </span>
              <span>缩放地图</span>
            </div>
            <div class="shortcut-item">
              <span class="keys">
                <kbd>1</kbd>-<kbd>3</kbd>
              </span>
              <span>游戏速度</span>
            </div>
          </div>
        </div>

        <div class="about-section">
          <p class="version">城市建设游戏 v1.0.0</p>
          <p class="credit">使用 Vue 3 + Pinia 构建</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  width: 90%;
  max-width: 450px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.modal-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.setting-group {
  margin-bottom: 28px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-group h3 {
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94a3b8;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #e2e8f0;
}

.setting-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.name-input {
  display: flex;
  gap: 8px;
  width: 100%;
}

.input {
  flex: 1;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
}

.input:focus {
  outline: none;
  border-color: #4A90D9;
}

.save-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #4A90D9 0%, #3b82f6 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 217, 0.4);
}

.toggle-switch {
  width: 48px;
  height: 28px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.toggle-switch.active {
  background: rgba(74, 144, 217, 0.5);
  border-color: #4A90D9;
}

.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.toggle-switch.active .toggle-knob {
  left: 23px;
  background: #4A90D9;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #94a3b8;
  font-size: 13px;
}

.keys {
  display: flex;
  gap: 4px;
}

kbd {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  color: #e2e8f0;
}

.about-section {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.version {
  color: #64748b;
  font-size: 12px;
  margin: 0 0 4px 0;
}

.credit {
  color: #475569;
  font-size: 11px;
  margin: 0;
}
</style>
