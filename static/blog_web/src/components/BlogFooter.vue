<script setup lang="ts">
import { Link } from '@element-plus/icons-vue'
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-left">
        <p class="muted" style="margin: 0">
          © {{ new Date().getFullYear() }} 个人博客 · 用心写作，沉淀思考
        </p>
      </div>
      <div class="footer-right">
        <a href="https://github.com" target="_blank" class="muted" style="display: inline-flex; align-items: center; gap: 6px">
          <el-icon><Link /></el-icon>
          GitHub
        </a>
        <span class="divider-vertical" />
        <span class="muted">极简阅读 · 优雅书写</span>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.site-footer {
  border-top: 1px solid var(--color-border-soft);
  background: var(--color-bg-elevated);
  padding: 28px 0;
  font-size: 13px;
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.divider-vertical {
  width: 1px;
  height: 14px;
  background: var(--color-border);
}
</style>
