<template>
  <div class="hud">
    <div class="hud-top">
      <div class="hud-panel money-panel">
        <span class="icon">💰</span>
        <span class="value">{{ money }}</span>
        <span class="label">金币</span>
      </div>
      
      <div class="hud-panel zone-panel">
        <span class="zone-name">{{ systemName }}</span>
        <span class="zone-sub">{{ zoneName }}</span>
      </div>
      
      <div class="hud-panel score-panel">
        <span class="label">本局收益</span>
        <span class="value positive">+{{ sessionScore }}</span>
      </div>
    </div>
    
    <div class="hud-left">
      <div class="stat-bar">
        <div class="stat-label">
          <span>🔋 燃料</span>
          <span>{{ Math.round(fuel) }} / {{ fuelMax }}</span>
        </div>
        <div class="bar-bg">
          <div class="bar-fill fuel-bar" :style="{ width: fuelPercent + '%' }"></div>
        </div>
      </div>
      
      <div class="stat-bar">
        <div class="stat-label">
          <span>❤️ 生命</span>
          <span>{{ Math.round(hp) }} / {{ hpMax }}</span>
        </div>
        <div class="bar-bg">
          <div class="bar-fill hp-bar" :style="{ width: hpPercent + '%' }"></div>
        </div>
      </div>
      
      <div class="stat-bar">
        <div class="stat-label">
          <span>🚀 速度</span>
          <span>{{ speed.toFixed(1) }} / {{ maxSpeed }}</span>
        </div>
        <div class="bar-bg">
          <div class="bar-fill speed-bar" :style="{ width: speedPercent + '%' }"></div>
        </div>
      </div>
    </div>
    
    <div class="hud-right">
      <div class="mission-progress">
        <div class="mission-title">🎯 任务目标</div>
        <div class="mission-desc">收集价值 {{ requiredValue }} 金币的碎片</div>
        <div class="bar-bg">
          <div class="bar-fill mission-bar" :style="{ width: missionPercent + '%' }"></div>
        </div>
        <div class="mission-text">{{ collectedValue }} / {{ requiredValue }}</div>
        <div v-if="zoneCompleted" class="mission-complete">✓ 任务完成！</div>
      </div>
      
      <div class="debris-count">
        <span>🪨 剩余碎片: {{ remainingDebris }}</span>
      </div>
    </div>
    
    <div class="hud-bottom">
      <div class="controls-hint">
        <span>↑/W 推进</span>
        <span>←→/AD 转向</span>
        <span>P 暂停</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  money: { type: Number, default: 0 },
  fuel: { type: Number, default: 100 },
  fuelMax: { type: Number, default: 100 },
  hp: { type: Number, default: 100 },
  hpMax: { type: Number, default: 100 },
  speed: { type: Number, default: 0 },
  maxSpeed: { type: Number, default: 6 },
  sessionScore: { type: Number, default: 0 },
  systemName: { type: String, default: '' },
  zoneName: { type: String, default: '' },
  collectedValue: { type: Number, default: 0 },
  requiredValue: { type: Number, default: 0 },
  remainingDebris: { type: Number, default: 0 },
  zoneCompleted: { type: Boolean, default: false }
})

const fuelPercent = computed(() => (props.fuel / props.fuelMax) * 100)
const hpPercent = computed(() => (props.hp / props.hpMax) * 100)
const speedPercent = computed(() => (props.speed / props.maxSpeed) * 100)
const missionPercent = computed(() => Math.min(100, (props.collectedValue / props.requiredValue) * 100))
</script>

<style scoped>
.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  color: #fff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.hud-top {
  position: absolute;
  top: 15px;
  left: 15px;
  right: 15px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.hud-panel {
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid rgba(74, 158, 255, 0.5);
  border-radius: 8px;
  padding: 10px 15px;
  backdrop-filter: blur(5px);
}

.money-panel {
  display: flex;
  align-items: center;
  gap: 8px;
}

.money-panel .icon {
  font-size: 20px;
}

.money-panel .value {
  font-size: 22px;
  font-weight: bold;
  color: #ffd700;
}

.money-panel .label {
  font-size: 12px;
  color: #aaa;
}

.zone-panel {
  text-align: center;
}

.zone-name {
  font-size: 18px;
  font-weight: bold;
  color: #4a9eff;
  display: block;
}

.zone-sub {
  font-size: 12px;
  color: #888;
}

.score-panel .label {
  font-size: 12px;
  color: #aaa;
  display: block;
}

.score-panel .value {
  font-size: 18px;
  font-weight: bold;
}

.score-panel .positive {
  color: #4ade80;
}

.hud-left {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 180px;
}

.stat-bar {
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: 6px;
  padding: 8px 10px;
}

.stat-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 5px;
  color: #ccc;
}

.bar-bg {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.2s ease;
}

.fuel-bar {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.hp-bar {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.speed-bar {
  background: linear-gradient(90deg, #22d3ee, #06b6d4);
}

.hud-right {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 200px;
}

.mission-progress {
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid rgba(74, 158, 255, 0.5);
  border-radius: 8px;
  padding: 12px;
}

.mission-title {
  font-size: 14px;
  font-weight: bold;
  color: #4a9eff;
  margin-bottom: 6px;
}

.mission-desc {
  font-size: 11px;
  color: #aaa;
  margin-bottom: 8px;
}

.mission-text {
  font-size: 11px;
  color: #888;
  text-align: right;
  margin-top: 5px;
}

.mission-bar {
  background: linear-gradient(90deg, #4ade80, #22c55e);
}

.mission-complete {
  margin-top: 8px;
  text-align: center;
  color: #4ade80;
  font-weight: bold;
  font-size: 14px;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.debris-count {
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  text-align: center;
}

.hud-bottom {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
}

.controls-hint {
  display: flex;
  gap: 20px;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 12px;
  color: #888;
}
</style>
