<template>
  <Layout>
    <div class="not-found-page">
      <div class="not-found-content">
      <h1>404</h1>
      <p class="description">页面不存在或已被移除</p>
      <el-button type="primary" @click="$router.push('/home')">返回首页</el-button>
    </div>
    </div>
  </Layout>
</template>

<script setup>
import Layout from '@/components/Layout.vue'
</script>

<style scoped>
.not-found-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.not-found-content {
  text-align: center;
}

.not-found-content h1 {
  font-size: 120px;
  font-weight: 700;
  color: #409eff;
  margin: 0;
  line-height: 1;
}

.description {
  font-size: 18px;
  color: #606266;
  margin: 20px 0 30px;
}
</style>
