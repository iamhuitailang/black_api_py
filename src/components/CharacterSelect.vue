
<script setup lang="ts">
import { computed } from 'vue'
import { CHARACTER_LIST } from '../data/characters'
import type { CharacterConfig } from '../data/characters'

interface Props {
  p1Selected: string
  p2Selected: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select', player: 1 | 2, id: string): void
  (e: 'start'): void
  (e: 'continue'): void
  (e: 'clearSave'): void
}>()

const canStart = computed(() => !!props.p1Selected && !!props.p2Selected)

const statMax = { hp: 150, attack: 15, defense: 15, speed: 10 }

function statPct(val: number, key: keyof typeof statMax) {
  return Math.min(100, (val / statMax[key]) * 100)
}
</script>

<template>
  <div class="select-wrap">
    <h1 class="game-title">
      <span class="t-red">街</span><span class="t-blue">机</span>
      <span class="t-gold">格</span><span class="t-purple">斗</span>
    </h1>
    <div class="subtitle">FIGHTING LEGENDS · 搓招对决</div>

    <div class="players-row">
      <div class="player-panel p1-panel">
        <div class="panel-title" style="color:#ff2d55;">玩家 1 · P1</div>
        <div class="panel-keys">
          <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动 ·
          <kbd>J</kbd> 攻击 · <kbd>K</kbd> 必杀
        </div>
      </div>
      <div class="vs-label">VS</div>
      <div class="player-panel p2-panel">
        <div class="panel-title" style="color:#00d4ff;">玩家 2 · P2</div>
        <div class="panel-keys">
          <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> 移动 ·
          <kbd>1</kbd> 攻击 · <kbd>2</kbd> 必杀
        </div>
      </div>
    </div>

    <div class="char-grid">
      <div
        v-for="c in CHARACTER_LIST"
        :key="c.id"
        class="char-card"
        :class="{
          'selected-p1': p1Selected === c.id,
          'selected-p2': p2Selected === c.id,
          'both-selected': p1Selected === c.id && p2Selected === c.id
        }"
        :style="{ '--c-color': c.color }"
      >
        <div class="card-portrait">
          <svg viewBox="0 0 80 120" class="mini-stickman">
            <circle cx="40" cy="24" r="14" :fill="c.color" opacity="0.15" stroke="c.color"/>
            <circle cx="40" cy="24" r="12" fill="none" :stroke="c.color" stroke-width="3"/>
            <circle cx="44" cy="22" r="2" :fill="c.color"/>
            <line x1="40" y1="36" x2="40" y2="78" :stroke="c.color" stroke-width="4" stroke-linecap="round"/>
            <line x1="40" y1="46" x2="22" y2="62" :stroke="c.color" stroke-width="4" stroke-linecap="round"/>
            <line x1="40" y1="46" x2="60" y2="58" :stroke="c.color" stroke-width="4" stroke-linecap="round"/>
            <line x1="40" y1="78" x2="26" y2="112" :stroke="c.color" stroke-width="4" stroke-linecap="round"/>
            <line x1="40" y1="78" x2="56" y2="112" :stroke="c.color" stroke-width="4" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="card-name">{{ c.name }}</div>

        <div class="stats">
          <div class="stat-row">
            <span class="stat-label">HP</span>
            <div class="stat-bar"><div class="stat-fill" :style="{ width: statPct(c.hp,'hp')+'%', background:'#ff5577'}"></div></div>
            <span class="stat-val">{{ c.hp }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">攻</span>
            <div class="stat-bar"><div class="stat-fill" :style="{ width: statPct(c.attack,'attack')+'%', background:'#ffaa33'}"></div></div>
            <span class="stat-val">{{ c.attack }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">防</span>
            <div class="stat-bar"><div class="stat-fill" :style="{ width: statPct(c.defense,'defense')+'%', background:'#44aaff'}"></div></div>
            <span class="stat-val">{{ c.defense }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">速</span>
            <div class="stat-bar"><div class="stat-fill" :style="{ width: statPct(c.speed,'speed')+'%', background:'#66ff99'}"></div></div>
            <span class="stat-val">{{ c.speed }}</span>
          </div>
        </div>

        <div class="special-box">
          <div class="special-name" :style="{ color: c.color }">★ {{ c.special.name }}</div>
          <div class="special-desc">{{ c.special.description }}</div>
        </div>

        <div class="select-btns">
          <button class="sel-btn p1-btn" @click="emit('select', 1, c.id)">
            {{ p1Selected === c.id ? '✓ P1 已选' : 'P1 选择' }}
          </button>
          <button class="sel-btn p2-btn" @click="emit('select', 2, c.id)">
            {{ p2Selected === c.id ? '✓ P2 已选' : 'P2 选择' }}
          </button>
        </div>
      </div>
    </div>

    <div class="actions-row">
      <button class="start-btn" :disabled="!canStart" @click="emit('start')">
        开始对战 · FIGHT!
      </button>
      <button class="continue-btn" @click="emit('continue')" title="读取上次存档">
        继续游戏
      </button>
      <button class="clear-btn" @click="emit('clearSave')" title="清除存档">
        清除存档
      </button>
    </div>

    <div class="rules-tip">
      <div>· 3局2胜制，每局60秒，超时血量多者获胜</div>
      <div>· 攻击命中+8%气槽，受击+12%气槽，气满可释放必杀技</div>
      <div>· 按住后退方向键防御，伤害×0.4</div>
    </div>
  </div>
</template>

<style scoped>
.select-wrap {
  width: 100%;
  min-height: 100vh;
  padding: 30px 20px 50px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  background:
    radial-gradient(ellipse at top, #1a1f4a 0%, #0a0e27 60%),
    #0a0e27;
}

.game-title {
  font-family: 'Press Start 2P', VT323, monospace;
  font-size: 44px;
  margin: 0 0 6px;
  letter-spacing: 4px;
  filter: drop-shadow(0 0 12px rgba(255,45,85,0.5));
}
.t-red { color: #ff2d55; }
.t-blue { color: #00d4ff; }
.t-gold { color: #ffd700; }
.t-purple { color: #bb55ff; }

.subtitle {
  font-family: VT323, monospace;
  font-size: 20px;
  color: #888;
  letter-spacing: 6px;
  margin-bottom: 26px;
}

.players-row {
  display: flex;
  align-items: center;
  gap: 40px;
  margin-bottom: 24px;
}

.player-panel {
  border: 2px dashed #444;
  border-radius: 8px;
  padding: 10px 18px;
  min-width: 320px;
  background: rgba(0,0,0,0.3);
}

.p1-panel { border-color: rgba(255,45,85,0.4); }
.p2-panel { border-color: rgba(0,212,255,0.4); }

.panel-title {
  font-family: 'Press Start 2P', VT323, monospace;
  font-size: 13px;
  margin-bottom: 6px;
}

.panel-keys {
  font-family: VT323, monospace;
  font-size: 16px;
  color: #bbb;
}
.panel-keys kbd {
  background: #222;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 13px;
  margin: 0 1px;
  color: #fff;
}

.vs-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 32px;
  color: #ffd700;
  text-shadow: 0 0 16px rgba(255,215,0,0.7);
}

.char-grid {
  display: grid;
  grid-template-columns: repeat(4, 240px);
  gap: 18px;
  margin-bottom: 28px;
}

.char-card {
  border: 3px solid #333;
  border-radius: 10px;
  padding: 14px;
  background: linear-gradient(160deg, #161a33, #0b0f22);
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}
.char-card:hover {
  transform: translateY(-4px);
  border-color: var(--c-color);
  box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 20px color-mix(in srgb, var(--c-color) 40%, transparent);
}

.selected-p1 {
  border-color: #ff2d55;
  box-shadow: 0 0 0 2px #ff2d5555, 0 0 24px rgba(255,45,85,0.5);
}
.selected-p2 {
  border-color: #00d4ff;
  box-shadow: 0 0 0 2px #00d4ff55, 0 0 24px rgba(0,212,255,0.5);
}
.both-selected {
  border-color: #ffd700;
  box-shadow: 0 0 0 2px #ffd70055, 0 0 28px rgba(255,215,0,0.6);
}

.char-card::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, transparent 40%, var(--c-color) 50%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.char-card:hover::before { opacity: 0.12; }

.card-portrait {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}
.mini-stickman {
  width: 80px;
  height: 120px;
}

.card-name {
  font-family: 'Press Start 2P', VT323, monospace;
  font-size: 16px;
  text-align: center;
  color: var(--c-color);
  letter-spacing: 2px;
  margin-bottom: 10px;
  text-shadow: 0 0 8px color-mix(in srgb, var(--c-color) 60%, transparent);
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}
.stat-row {
  display: grid;
  grid-template-columns: 26px 1fr 28px;
  align-items: center;
  gap: 6px;
  font-family: VT323, monospace;
  font-size: 14px;
}
.stat-label {
  color: #aaa;
  text-align: right;
}
.stat-bar {
  height: 8px;
  background: #0a0a0a;
  border: 1px solid #222;
  border-radius: 2px;
  overflow: hidden;
}
.stat-fill {
  height: 100%;
  transition: width 0.3s;
}
.stat-val {
  color: #fff;
  font-weight: bold;
  text-align: right;
}

.special-box {
  background: rgba(0,0,0,0.35);
  border: 1px dashed #333;
  border-radius: 4px;
  padding: 6px 8px;
  margin-bottom: 12px;
  min-height: 46px;
}
.special-name {
  font-family: VT323, monospace;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 1px;
  margin-bottom: 2px;
}
.special-desc {
  font-family: VT323, monospace;
  font-size: 13px;
  color: #aaa;
  line-height: 1.3;
}

.select-btns {
  display: flex;
  gap: 6px;
}
.sel-btn {
  flex: 1;
  padding: 7px 4px;
  border: 2px solid #333;
  border-radius: 5px;
  background: #1a1d33;
  color: #ddd;
  font-family: VT323, monospace;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.sel-btn:hover { background: #2a2d48; }
.p1-btn:hover { border-color: #ff2d55; color: #ff2d55; }
.p1-btn:disabled, .p2-btn:disabled { opacity: 0.9; }
.p1-btn:not(:disabled):active { transform: scale(0.96); }
.p2-btn:not(:disabled):active { transform: scale(0.96); }

.actions-row {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 22px;
}
.start-btn {
  font-family: 'Press Start 2P', VT323, monospace;
  font-size: 18px;
  padding: 16px 42px;
  background: linear-gradient(180deg, #ff4466, #cc1133);
  color: #fff;
  border: 3px solid #ff2d55;
  border-radius: 8px;
  cursor: pointer;
  letter-spacing: 3px;
  box-shadow: 0 6px 0 #77001a, 0 0 30px rgba(255,45,85,0.4);
  transition: all 0.1s;
}
.start-btn:hover:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 4px 0 #77001a, 0 0 40px rgba(255,45,85,0.6);
}
.start-btn:active:not(:disabled) {
  transform: translateY(6px);
  box-shadow: 0 0 0 #77001a, 0 0 20px rgba(255,45,85,0.4);
}
.start-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.continue-btn, .clear-btn {
  font-family: VT323, monospace;
  font-size: 16px;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.continue-btn {
  background: linear-gradient(180deg, #2288cc, #115588);
  color: #fff;
  border: 2px solid #00d4ff;
}
.continue-btn:hover {
  box-shadow: 0 0 20px rgba(0,212,255,0.5);
  transform: translateY(-1px);
}
.clear-btn {
  background: #1a1a1a;
  color: #888;
  border: 1px dashed #444;
}
.clear-btn:hover { color: #ff6666; border-color: #ff6666; }

.rules-tip {
  font-family: VT323, monospace;
  font-size: 15px;
  color: #666;
  text-align: center;
  line-height: 1.8;
  opacity: 0.75;
}
</style>
