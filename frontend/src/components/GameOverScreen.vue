<template>
  <div class="gameover-screen">
    <div class="smoke-overlay"></div>

    <div class="content">
      <h1 class="gameover-title">游戏结束</h1>
      <p class="gameover-subtitle">Game Over</p>

      <div class="stats-card">
        <h2 class="stats-title">战斗报告</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">波次达到</span>
            <span class="stat-value wave">{{ finalStats.wave_reached }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">击杀敌人</span>
            <span class="stat-value kills">{{ finalStats.enemies_killed }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最终得分</span>
            <span class="stat-value score">{{ finalStats.score }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">火焰等级</span>
            <span class="stat-value flame">Lv.{{ dragonStatus.flame_level }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">精华收集</span>
            <span class="stat-value essence">{{ dragonStatus.total_essence }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">伤害加成</span>
            <span class="stat-value dmg">+{{ Math.round((dragonStatus.flame_damage_multiplier - 1) * 100) }}%</span>
          </div>
        </div>
      </div>

      <div class="grade-display">
        <span :class="['grade', gradeClass]">{{ grade }}</span>
        <p class="grade-desc">{{ gradeDesc }}</p>
      </div>

      <div class="buttons">
        <button class="btn-restart" @click="$emit('restart')">
          🔥 再来一局
        </button>
        <button class="btn-menu" @click="$emit('backToMenu')">
          📋 返回主菜单
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  finalStats: {
    type: Object,
    default: () => ({ wave_reached: 1, enemies_killed: 0, score: 0 })
  },
  dragonStatus: {
    type: Object,
    default: () => ({ flame_level: 1, total_essence: 0, flame_damage_multiplier: 1.0 })
  }
})
defineEmits(['restart', 'backToMenu'])

const grade = computed(() => {
  const score = props.finalStats.score
  if (score >= 10000) return 'S+'
  if (score >= 7000) return 'S'
  if (score >= 5000) return 'A'
  if (score >= 3000) return 'B'
  if (score >= 1500) return 'C'
  if (score >= 500) return 'D'
  return 'E'
})

const gradeClass = computed(() => {
  const g = grade.value
  if (g.startsWith('S')) return 'grade-s'
  if (g === 'A') return 'grade-a'
  if (g === 'B') return 'grade-b'
  if (g === 'C') return 'grade-c'
  return 'grade-low'
})

const gradeDesc = computed(() => {
  const g = grade.value
  if (g === 'S+') return '传奇龙骑士！你是真正的火龙王者！'
  if (g === 'S') return '卓越表现！峡谷因你而震颤！'
  if (g === 'A') return '出色的战斗！你是勇者中的强者！'
  if (g === 'B') return '不错的表现！继续磨砺你的火焰！'
  if (g === 'C') return '合格的战绩，但你可以做得更好！'
  if (g === 'D') return '勉强通关，多加练习吧！'
  return '初出茅庐，勇敢地再战一次吧！'
})
</script>

<style scoped>
.gameover-screen {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1a0505 0%, #2a0a0a 50%, #0a0a0a 100%);
  overflow: hidden;
}

.smoke-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(255, 100, 0, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(100, 0, 0, 0.2) 0%, transparent 50%);
  animation: smokeMove 10s ease-in-out infinite alternate;
}

@keyframes smokeMove {
  from { opacity: 0.6; transform: scale(1); }
  to { opacity: 1; transform: scale(1.1); }
}

.content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 40px;
  max-width: 550px;
  width: 90%;
}

.gameover-title {
  font-size: 3.5rem;
  color: #ff3333;
  text-shadow: 0 0 30px #ff0000, 0 0 60px #ff0000;
  letter-spacing: 10px;
  margin-bottom: 5px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.gameover-subtitle {
  color: #aa5555;
  letter-spacing: 6px;
  font-size: 1rem;
  margin-bottom: 30px;
}

.stats-card {
  background: rgba(30, 10, 10, 0.95);
  border: 2px solid rgba(255, 60, 0, 0.4);
  border-radius: 16px;
  padding: 25px 30px;
  margin-bottom: 25px;
  backdrop-filter: blur(10px);
}

.stats-title {
  color: #ffcc00;
  margin-bottom: 20px;
  letter-spacing: 3px;
  font-size: 1.3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 18px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

.stat-label {
  color: #888;
  font-size: 0.75rem;
  letter-spacing: 1px;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: bold;
}

.stat-value.wave { color: #87ceeb; }
.stat-value.kills { color: #ff6b6b; }
.stat-value.score { color: #ffd700; }
.stat-value.flame { color: #ff6347; }
.stat-value.essence { color: #ff8c00; }
.stat-value.dmg { color: #7fff7f; }

.grade-display {
  margin-bottom: 30px;
}

.grade {
  display: inline-block;
  font-size: 5rem;
  font-weight: 900;
  letter-spacing: 5px;
  margin-bottom: 10px;
  animation: gradeBounce 2s ease-in-out infinite;
}

@keyframes gradeBounce {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-8px) rotate(2deg); }
}

.grade-s {
  background: linear-gradient(180deg, #ffd700, #ff8c00, #ff4500);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 20px #ffd700);
}

.grade-a { color: #ff8c00; text-shadow: 0 0 20px #ff8c00; }
.grade-b { color: #87ceeb; text-shadow: 0 0 15px #87ceeb; }
.grade-c { color: #90ee90; text-shadow: 0 0 10px #90ee90; }
.grade-low { color: #888; }

.grade-desc {
  color: #aaa;
  font-size: 1rem;
  letter-spacing: 1px;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}

.btn-restart,
.btn-menu {
  padding: 15px 50px;
  font-size: 1.1rem;
  font-weight: bold;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  letter-spacing: 2px;
  transition: all 0.3s;
  width: 260px;
}

.btn-restart {
  background: linear-gradient(135deg, #ff4500, #ff6347);
  color: #fff;
  box-shadow: 0 5px 25px rgba(255, 69, 0, 0.5);
}

.btn-restart:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 35px rgba(255, 69, 0, 0.7);
}

.btn-menu {
  background: linear-gradient(135deg, #2a2a4a, #1a1a3a);
  color: #ffa07a;
  border: 1px solid rgba(255, 99, 71, 0.4);
}

.btn-menu:hover {
  transform: translateY(-3px);
  border-color: rgba(255, 99, 71, 0.8);
  box-shadow: 0 5px 20px rgba(255, 99, 71, 0.3);
}
</style>
