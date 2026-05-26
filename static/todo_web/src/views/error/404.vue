<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <p class="error-message">页面不存在</p>
      <p class="error-desc">抱歉，您访问的页面不存在或已被移除</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.not-found-content {
  text-align: center;
  color: #fff;

  .error-code {
    font-size: 120px;
    font-weight: 700;
    margin: 0;
    text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
  }

  .error-message {
    font-size: 32px;
    font-weight: 600;
    margin: 16px 0;
  }

  .error-desc {
    font-size: 16px;
    opacity: 0.9;
    margin-bottom: 32px;
  }
}
</style>
