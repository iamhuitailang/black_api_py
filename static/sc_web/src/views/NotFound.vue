<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">
        <span class="digit">4</span>
        <el-icon :size="80" color="#ff6b00"><Warning /></el-icon>
        <span class="digit">4</span>
      </div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-desc">抱歉，您访问的页面不存在或已被移除。</p>
      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome">
          <el-icon><House /></el-icon>
          <span>返回首页</span>
        </el-button>
        <el-button size="large" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回上一页</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Warning, House, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
  position: relative;
  overflow: hidden;
}

.not-found-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(255, 107, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 107, 0, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}

.not-found-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 40px;
}

.error-code {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.digit {
  font-size: 120px;
  font-weight: 900;
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.error-title {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
}

.error-desc {
  font-size: 16px;
  color: #888;
  margin-bottom: 32px;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.error-actions .el-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
}

.error-actions .el-button--primary {
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  border: none;
}

.error-actions .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 0, 0.4);
}
</style>
