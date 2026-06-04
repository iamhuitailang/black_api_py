<template>
  <div class="order-card">
    <div class="order-header">
      <div class="order-info">
        <span class="order-id">#{{ order.id }}</span>
        <span class="order-time">{{ formatTime(order.created_at) }}</span>
      </div>
      <span class="order-status" :class="statusClass">{{ statusText }}</span>
    </div>

    <div class="order-customer">
      <span class="customer-emoji">{{ getCustomerEmoji(order.customer_name) }}</span>
      <div class="customer-info">
        <span class="customer-name">{{ order.customer_name || '客人' }}</span>
        <span class="customer-note">{{ getOrderNote() }}</span>
      </div>
    </div>

    <div class="order-items">
      <div v-for="(item, index) in orderItems" :key="index" class="order-item">
        <span class="item-emoji">{{ item.emoji }}</span>
        <span class="item-name">{{ item.name }}</span>
        <span class="item-quantity">x{{ item.quantity }}</span>
      </div>
    </div>

    <div class="order-footer">
      <span class="order-total">💰 {{ order.total_amount || 15 }} 金币</span>
      <div class="order-actions">
        <button v-if="order.status === 'pending'" class="btn-cancel" @click="handleCancel">
          取消
        </button>
        <button v-if="order.status === 'pending'" class="btn-complete" @click="handleComplete">
          ✅ 完成
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { api } from '../api'

const props = defineProps({
  order: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['complete', 'cancel', 'updated'])

const statusClass = computed(() => {
  const status = props.order.status || 'pending'
  return {
    pending: 'status-pending',
    completed: 'status-completed',
    cancelled: 'status-cancelled'
  }[status] || 'status-pending'
})

const statusText = computed(() => {
  const status = props.order.status || 'pending'
  return {
    pending: '待处理',
    completed: '已完成',
    cancelled: '已取消'
  }[status] || '待处理'
})

const orderItems = computed(() => {
  const drinkNames = props.order.drink_names || ''
  if (!drinkNames) return []
  
  const names = drinkNames.split(',')
  const emojis = ['☕', '🧋', '🍵', '🥤', '🍰', '🍮', '🍪', '🥧']
  
  return names.map((name, index) => ({
    name: name.trim(),
    emoji: emojis[index % emojis.length],
    quantity: 1
  }))
})

const getCustomerEmoji = (name) => {
  const emojis = ['👩', '👨', '👧', '👦', '🧑', '👴', '👵', '🧔', '👱', '👩‍🦰', '👨‍🦱']
  if (!name) return '🧑'
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return emojis[hash % emojis.length]
}

const getOrderNote = () => {
  const catName = props.order.cat_name
  if (catName) {
    return `想要和「${catName}」一起玩~`
  }
  const notes = ['请尽快准备~', '谢谢！', '好期待呀~', '要热的哦~', '少糖谢谢~']
  const hash = (props.order.id || 0) % notes.length
  return notes[hash]
}

const formatTime = (timeStr) => {
  if (!timeStr) return '刚刚'
  try {
    const date = new Date(timeStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return '刚刚'
  }
}

const handleComplete = async () => {
  emit('complete', props.order.id)
}

const handleCancel = async () => {
  emit('cancel', props.order.id)
}
</script>

<style scoped>
.order-card {
  background: #FFF5EE;
  border-radius: 16px;
  padding: 16px;
  border: 2px solid #FFE4E1;
  transition: all 0.3s;
}

.order-card:hover {
  border-color: #FFB6C1;
  box-shadow: 0 4px 15px rgba(255, 182, 193, 0.2);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #FFE4E1;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-id {
  font-weight: 600;
  color: #FF69B4;
  font-size: 14px;
}

.order-time {
  color: #999;
  font-size: 12px;
}

.order-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-pending {
  background: #FFE4B5;
  color: #FF8C00;
}

.status-completed {
  background: #98FB98;
  color: #228B22;
}

.status-cancelled {
  background: #FFB6C1;
  color: #DC143C;
}

.order-customer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.customer-emoji {
  font-size: 36px;
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.customer-name {
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.customer-note {
  color: #888;
  font-size: 12px;
}

.order-items {
  background: white;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.order-item:not(:last-child) {
  border-bottom: 1px solid #FFF0F5;
}

.item-emoji {
  font-size: 24px;
}

.item-name {
  flex: 1;
  color: #333;
  font-size: 14px;
}

.item-quantity {
  color: #FF69B4;
  font-weight: 600;
  font-size: 14px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-total {
  font-size: 16px;
  font-weight: 700;
  color: #FF69B4;
}

.order-actions {
  display: flex;
  gap: 10px;
}

.btn-cancel, .btn-complete {
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #FFF0F5;
  color: #999;
}

.btn-cancel:hover {
  background: #FFB6C1;
  color: white;
}

.btn-complete {
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  color: white;
}

.btn-complete:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.4);
}
</style>
