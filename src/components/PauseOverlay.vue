<template>
  <div class="pause-overlay" v-if="visible">
    <div class="overlay"></div>
    <div class="content">
      <h2>⏸️ 游戏暂停</h2>
      <p class="hint">按 P 键或点击按钮继续</p>
      <button class="resume-btn" @click="$emit('resume')">
        ▶️ 继续游戏
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false }
})

defineEmits(['resume'])
</script>

<style scoped>
.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  pointer-events: none;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.content {
  position: relative;
  text-align: center;
  pointer-events: auto;
}

h2 {
  margin: 0 0 12px 0;
  color: #fff;
  font-size: 32px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.hint {
  margin: 0 0 20px 0;
  color: #aaa;
  font-size: 14px;
}

.resume-btn {
  padding: 14px 32px;
  background: linear-gradient(135deg, #4a9eff, #2a6ecc);
  border: none;
  color: #fff;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  transition: all 0.2s;
}

.resume-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 158, 255, 0.4);
}
</style>
