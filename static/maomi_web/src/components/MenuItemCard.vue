<template>
  <div class="menu-item-card">
    <div class="item-emoji">{{ item.emoji || '🍽️' }}</div>
    <div class="item-info">
      <h3 class="item-name">{{ item.name }}</h3>
      <p class="item-desc">{{ item.description }}</p>
      <div class="item-footer">
        <span class="item-price">💰 {{ item.price || 0 }} 金币</span>
        <span class="item-type" :class="item.type">
          {{ item.type === 'drink' ? '☕ 饮品' : '🍰 甜点' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.menu-item-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  gap: 16px;
  box-shadow: 0 4px 15px rgba(255, 182, 193, 0.15);
  transition: all 0.3s;
}

.menu-item-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 182, 193, 0.25);
}

.item-emoji {
  font-size: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: #FFF5EE;
  border-radius: 12px;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.item-name {
  font-size: 17px;
  color: #333;
  margin: 0 0 6px 0;
  font-weight: 600;
}

.item-desc {
  font-size: 13px;
  color: #888;
  margin: 0 0 12px 0;
  line-height: 1.4;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price {
  font-size: 16px;
  font-weight: 700;
  color: #FF69B4;
}

.item-type {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.item-type.drink {
  background: #E6F3FF;
  color: #4169E1;
}

.item-type.dessert {
  background: #FFE4E1;
  color: #FF69B4;
}
</style>
