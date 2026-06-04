<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
    <div class="panel-border p-8 min-w-80">
      <h2 class="font-wuxia text-4xl text-yellow-500 text-center mb-8">游戏暂停</h2>
      
      <div class="flex flex-col gap-4">
        <button @click="$emit('resume')" class="btn-gold">
          继续游戏
        </button>
        
        <button @click="$emit('restart')" class="btn-gold">
          重新开始
        </button>
        
        <button @click="$emit('levelSelect')" class="btn-gold">
          关卡选择
        </button>
        
        <button @click="$emit('mainMenu')" class="btn-gold">
          返回主菜单
        </button>
      </div>

      <div class="mt-6 pt-4 border-t border-yellow-500/30 text-center">
        <p class="text-yellow-500/60 text-sm">游戏已自动保存</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['resume', 'restart', 'levelSelect', 'mainMenu'])
</script>
