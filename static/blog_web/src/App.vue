<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useThemeStore } from '@/stores/theme'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const themeStore = useThemeStore()
</script>

<template>
  <el-config-provider :locale="zhCn">
    <div class="app-root" :data-theme="themeStore.currentTheme">
      <DefaultLayout />
    </div>
  </el-config-provider>
</template>

<style lang="scss">
.app-root {
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>
