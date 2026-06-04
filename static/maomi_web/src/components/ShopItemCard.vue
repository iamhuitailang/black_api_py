<template>
  <div class="shop-item-card">
    <div class="item-header">
      <span class="item-emoji">{{ item.emoji || '📦' }}</span>
      <span v-if="item.owned > 0" class="owned-badge">x{{ item.owned }}</span>
    </div>
    
    <div class="item-body">
      <h3 class="item-name">{{ item.name }}</h3>
      <p class="item-desc">{{ item.description }}</p>
    </div>

    <div class="item-footer">
      <span class="item-price">💰 {{ item.price || 0 }}</span>
      <div class="item-actions">
        <button 
          v-if="item.owned > 0" 
          class="action-btn use"
          @click="handleUse"
        >
          使用
        </button>
        <button 
          class="action-btn buy"
          @click="handleBuy"
        >
          购买
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['buy', 'use', 'updated'])

const handleBuy = () => {
  emit('buy', props.item.id)
}

const handleUse = () => {
  emit('use', props.item.id)
}
</script>

<style scoped>
.shop-item-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 15px rgba(255, 182, 193, 0.15);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.shop-item-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 182, 193, 0.25);
}

.item-header {
  position: relative;
  text-align: center;
  margin-bottom: 12px;
}

.item-emoji {
  font-size: 48px;
  display: inline-block;
}

.owned-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.item-body {
  flex: 1;
  margin-bottom: 12px;
}

.item-name {
  font-size: 15px;
  color: #333;
  margin: 0 0 6px 0;
  font-weight: 600;
  text-align: center;
}

.item-desc {
  font-size: 12px;
  color: #888;
  margin: 0;
  line-height: 1.4;
  text-align: center;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-price {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: #FF69B4;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.buy {
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  color: white;
}

.action-btn.buy:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.4);
}

.action-btn.use {
  background: #E6F3FF;
  color: #4169E1;
}

.action-btn.use:hover {
  background: #87CEEB;
  color: white;
}
</style>
