<template>
  <div class="event-page">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>突发事件</span>
              <el-button type="primary" size="small" @click="generateEvent">
                模拟突发事件
              </el-button>
            </div>
          </template>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="待处理" name="pending">
              <div v-if="pendingEvents.length > 0" class="event-list">
                <div 
                  v-for="event in pendingEvents" 
                  :key="event.id" 
                  class="event-card pending"
                >
                  <div class="event-header">
                    <span class="event-icon">{{ getEventIcon(event.type) }}</span>
                    <div class="event-info">
                      <h4>{{ event.title }}</h4>
                      <el-tag size="small" :type="getSeverityType(event.severity)">
                        {{ getSeverityText(event.severity) }}
                      </el-tag>
                    </div>
                    <div class="event-time">
                      {{ formatTime(event.created_at) }}
                    </div>
                  </div>
                  <div class="event-desc">{{ event.description }}</div>
                  <div class="event-actions">
                    <el-button size="small" type="success" @click="resolveEvent(event, 'handle')">
                      处理事件
                    </el-button>
                    <el-button size="small" type="warning" @click="resolveEvent(event, 'ignore')">
                      忽略
                    </el-button>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无待处理事件" />
            </el-tab-pane>
            <el-tab-pane label="已处理" name="resolved">
              <div v-if="resolvedEvents.length > 0" class="event-list">
                <div 
                  v-for="event in resolvedEvents" 
                  :key="event.id" 
                  class="event-card resolved"
                >
                  <div class="event-header">
                    <span class="event-icon">{{ getEventIcon(event.type) }}</span>
                    <div class="event-info">
                      <h4>{{ event.title }}</h4>
                      <el-tag size="small" type="info">
                        {{ getResolutionText(event.resolution) }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="event-desc">{{ event.description }}</div>
                </div>
              </div>
              <el-empty v-else description="暂无已处理事件" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>事件统计</span>
          </template>
          <div class="event-stats">
            <div class="stat-item">
              <div class="stat-icon warning">⚠️</div>
              <div class="stat-content">
                <div class="stat-value">{{ pendingEvents.length }}</div>
                <div class="stat-label">待处理</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon success">✅</div>
              <div class="stat-content">
                <div class="stat-value">{{ resolvedEvents.length }}</div>
                <div class="stat-label">已处理</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon danger">🔥</div>
              <div class="stat-content">
                <div class="stat-value">{{ highRiskCount }}</div>
                <div class="stat-label">高风险</div>
              </div>
            </div>
          </div>
          
          <el-divider />
          
          <div class="event-tips">
            <h4>突发事件处理建议</h4>
            <ul>
              <li>🦖 恐龙逃脱：立即派遣安保人员</li>
              <li>🏥 游客受伤：提供医疗救助</li>
              <li>⚡ 电力故障：尽快修复设施</li>
              <li>🌧️ 恶劣天气：疏散游客到室内</li>
              <li>🦠 疾病爆发：隔离受感染恐龙</li>
            </ul>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getEvents, getUnresolvedEvents, generateEvent as generateEventApi, resolveEvent as resolveEventApi } from '@/services/api'

const activeTab = ref('pending')
const pendingEvents = ref([])
const resolvedEvents = ref([])

const highRiskCount = computed(() => {
  return pendingEvents.value.filter(e => e.severity === 'high').length
})

const getEventIcon = (type) => {
  const icons = {
    escape: '🦖',
    injury: '🏥',
    power: '⚡',
    weather: '🌧️',
    disease: '🦠',
    breakout: '🔥',
    visitor: '👥'
  }
  return icons[type] || '⚠️'
}

const getSeverityText = (severity) => {
  const map = {
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  }
  return map[severity] || severity
}

const getSeverityType = (severity) => {
  const map = {
    low: 'success',
    medium: 'warning',
    high: 'danger'
  }
  return map[severity] || ''
}

const getResolutionText = (resolution) => {
  const map = {
    handled: '已处理',
    ignored: '已忽略'
  }
  return map[resolution] || '已解决'
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const loadEvents = async () => {
  const [pendingRes, allRes] = await Promise.all([
    getUnresolvedEvents(),
    getEvents()
  ])
  
  if (pendingRes.code === 200) {
    pendingEvents.value = pendingRes.data || []
  }
  if (allRes.code === 200) {
    resolvedEvents.value = (allRes.data || []).filter(e => e.status === 'resolved')
  }
}

const generateEvent = async () => {
  const res = await generateEventApi(1)
  if (res.code === 200) {
    ElMessage.warning('新的突发事件发生了！')
    loadEvents()
  } else {
    ElMessage.error(res.message || '生成失败')
  }
}

const resolveEvent = async (event, action) => {
  const res = await resolveEventApi({
    event_id: event.id,
    resolution: action === 'handle' ? 'handled' : 'ignored'
  })
  
  if (res.code === 200) {
    ElMessage.success(action === 'handle' ? '事件已处理！' : '已忽略事件')
    loadEvents()
  } else {
    ElMessage.error(res.message || '操作失败')
  }
}

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.event-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.event-card {
  padding: 15px;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
}

.event-card.pending {
  background: #fff7e6;
  border-left: 4px solid #e6a23c;
}

.event-card.resolved {
  background: #f6ffed;
  border-left: 4px solid #67c23a;
  opacity: 0.8;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.event-icon {
  font-size: 32px;
}

.event-info {
  flex: 1;
}

.event-info h4 {
  margin: 0 0 5px 0;
}

.event-time {
  font-size: 12px;
  color: #999;
}

.event-desc {
  color: #666;
  margin-bottom: 15px;
  font-size: 14px;
}

.event-actions {
  display: flex;
  gap: 10px;
}

.event-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-icon {
  font-size: 32px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.stat-icon.warning {
  background: #fdf6ec;
}

.stat-icon.success {
  background: #f0f9eb;
}

.stat-icon.danger {
  background: #fef0f0;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.event-tips h4 {
  margin: 0 0 15px 0;
}

.event-tips ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.event-tips li {
  padding: 8px 0;
  font-size: 14px;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
}

.event-tips li:last-child {
  border-bottom: none;
}
</style>
