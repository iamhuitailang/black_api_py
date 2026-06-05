<script setup lang="ts">
import { computed, ref } from 'vue'
import { 
  AlertTriangle, Gift, Wrench, Compass, X, 
  CheckCircle, XCircle, Clock, Zap, Percent
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { formatNumber, formatPercentage } from '@/utils/formatters'
import type { EventConfig, ActiveEvent, ResourceType, ResourceState } from '@/config/types'

interface Props {
  config: EventConfig
  activeEvent?: ActiveEvent
  resources: Record<ResourceType, ResourceState>
  show: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  class: ''
})

const emit = defineEmits({
  close: () => true,
  choice: (choiceId: string) => true
})

const selectedResult = ref<'success' | 'failure' | null>(null)
const resultDescription = ref('')

const typeIcon = computed(() => {
  const icons = {
    disaster: AlertTriangle,
    opportunity: Gift,
    malfunction: Wrench,
    discovery: Compass
  }
  return icons[props.config.type]
})

const typeColor = computed(() => {
  const colors = {
    disaster: 'text-mars',
    opportunity: 'text-green-400',
    malfunction: 'text-warning',
    discovery: 'text-tech'
  }
  return colors[props.config.type]
})

const typeBgColor = computed(() => {
  const colors = {
    disaster: 'bg-mars/20',
    opportunity: 'bg-green-500/20',
    malfunction: 'bg-warning/20',
    discovery: 'bg-tech/20'
  }
  return colors[props.config.type]
})

const typeBorderColor = computed(() => {
  const colors = {
    disaster: 'border-mars/50',
    opportunity: 'border-green-500/50',
    malfunction: 'border-warning/50',
    discovery: 'border-tech/50'
  }
  return colors[props.config.type]
})

const typeGlow = computed(() => {
  const glows = {
    disaster: 'shadow-neon-red',
    opportunity: '',
    malfunction: 'shadow-neon-orange',
    discovery: 'shadow-neon-blue'
  }
  return glows[props.config.type]
})

const severityDots = computed(() => {
  const levels = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  }
  return levels[props.config.severity]
})

const severityColor = computed(() => {
  const colors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-warning',
    critical: 'bg-mars'
  }
  return colors[props.config.severity]
})

const typeLabel = computed(() => {
  const labels = {
    disaster: '灾难',
    opportunity: '机遇',
    malfunction: '故障',
    discovery: '发现'
  }
  return labels[props.config.type]
})

const severityLabel = computed(() => {
  const labels = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '危急'
  }
  return labels[props.config.severity]
})

const canAffordChoice = (cost?: Partial<Record<ResourceType, number>>) => {
  if (!cost) return true
  return Object.entries(cost).every(([type, amount]) => {
    return props.resources[type as ResourceType]?.current >= (amount || 0)
  })
}

const handleChoice = (choice: any) => {
  if (!canAffordChoice(choice.cost)) return
  
  const isSuccess = Math.random() < choice.successRate
  selectedResult.value = isSuccess ? 'success' : 'failure'
  resultDescription.value = isSuccess ? choice.successEffect.description : choice.failureEffect.description
  emit('choice', choice.id)
}

const getResourceIcon = (type: ResourceType) => {
  const icons: Record<ResourceType, string> = {
    energy: '⚡',
    water: '💧',
    oxygen: '🌬️',
    food: '🍞',
    iron: '⚙️',
    rareMineral: '💎',
    techFragment: '🔮'
  }
  return icons[type]
}

const closeModal = () => {
  selectedResult.value = null
  resultDescription.value = ''
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="show" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <div class="absolute inset-0 bg-space-900/80 backdrop-blur-sm" />
        
        <div 
          :class="cn(
            'relative w-full max-w-lg rounded-2xl border bg-space-800/95 backdrop-blur-xl',
            'transition-all duration-300 transform',
            typeBorderColor,
            typeGlow,
            props.class
          )"
        >
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tech/30 to-transparent" />
          <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tech/20 to-transparent" />

          <button 
            class="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-space-700/50 text-space-400 hover:text-space-100 hover:bg-space-600/50 transition-all duration-200"
            @click="closeModal"
          >
            <X class="w-5 h-5" />
          </button>

          <div class="relative p-6">
            <div class="flex items-start gap-4 mb-4">
              <div 
                :class="cn(
                  'relative flex items-center justify-center w-16 h-16 rounded-xl border',
                  typeBgColor,
                  typeBorderColor
                )"
              >
                <component :is="typeIcon" :class="cn('w-8 h-8', typeColor)" />
                <div 
                  v-if="config.severity === 'critical'"
                  class="absolute inset-0 rounded-xl animate-ping opacity-20"
                  :class="typeColor.replace('text-', 'bg-')"
                />
              </div>

              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span 
                    :class="cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                      typeBgColor,
                      typeColor
                    )"
                  >
                    {{ typeLabel }}
                  </span>
                  <div class="flex items-center gap-0.5">
                    <div 
                      v-for="i in 4" 
                      :key="i"
                      :class="cn(
                        'w-1.5 h-1.5 rounded-full transition-all duration-300',
                        i <= severityDots ? severityColor : 'bg-space-600'
                      )"
                    />
                  </div>
                  <span class="text-[10px] text-space-400">{{ severityLabel }}</span>
                </div>
                <h3 class="text-xl font-bold text-space-100 mb-1">{{ config.name }}</h3>
                <div v-if="activeEvent" class="flex items-center gap-2 text-xs text-space-400">
                  <Clock class="w-3 h-3" />
                  <span>剩余时间: {{ Math.ceil(activeEvent.timeRemaining) }}s</span>
                </div>
              </div>
            </div>

            <p class="text-sm text-space-300 leading-relaxed mb-6">{{ config.description }}</p>

            <div v-if="selectedResult" class="mb-6">
              <div 
                :class="cn(
                  'p-4 rounded-xl border',
                  selectedResult === 'success' 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-mars/10 border-mars/30'
                )"
              >
                <div class="flex items-center gap-2 mb-2">
                  <CheckCircle v-if="selectedResult === 'success'" class="w-5 h-5 text-green-500" />
                  <XCircle v-else class="w-5 h-5 text-mars" />
                  <span 
                    :class="cn(
                      'font-bold',
                      selectedResult === 'success' ? 'text-green-400' : 'text-mars'
                    )"
                  >
                    {{ selectedResult === 'success' ? '成功！' : '失败...' }}
                  </span>
                </div>
                <p class="text-sm text-space-300">{{ resultDescription }}</p>
              </div>
            </div>

            <div v-if="!selectedResult && !activeEvent?.choiceMade" class="space-y-3">
              <h4 class="text-sm font-semibold text-space-200 mb-3">选择应对方案：</h4>
              
              <button
                v-for="choice in config.choices"
                :key="choice.id"
                :disabled="!canAffordChoice(choice.cost)"
                :class="cn(
                  'relative w-full p-4 rounded-xl border text-left transition-all duration-300',
                  'hover:border-tech/50 hover:bg-space-700/50',
                  canAffordChoice(choice.cost) 
                    ? 'bg-space-700/30 border-space-600/50 cursor-pointer' 
                    : 'bg-space-800/30 border-space-700/30 opacity-50 cursor-not-allowed'
                )"
                @click="handleChoice(choice)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1">
                    <p class="font-semibold text-space-100 mb-2">{{ choice.text }}</p>
                    
                    <div v-if="choice.cost && Object.keys(choice.cost).length > 0" class="flex flex-wrap gap-2 mb-2">
                      <div 
                        v-for="(amount, type) in choice.cost" 
                        :key="type"
                        :class="cn(
                          'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono',
                          resources[type as ResourceType]?.current >= amount!
                            ? 'bg-space-600/50 text-space-200'
                            : 'bg-mars/20 text-mars'
                        )"
                      >
                        <Zap class="w-3 h-3" />
                        <span>{{ getResourceIcon(type as ResourceType) }} {{ formatNumber(amount!) }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-col items-end gap-1">
                    <div class="flex items-center gap-1 px-2 py-1 rounded bg-tech/10 text-tech text-xs font-mono">
                      <Percent class="w-3 h-3" />
                      <span>{{ formatPercentage(choice.successRate) }}</span>
                    </div>
                  </div>
                </div>

                <div 
                  v-if="canAffordChoice(choice.cost)"
                  class="absolute inset-0 rounded-xl bg-gradient-to-r from-tech/0 via-tech/5 to-tech/0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                />
              </button>
            </div>

            <div v-if="activeEvent?.choiceMade" class="text-center py-4">
              <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-space-700/50 text-space-300 text-sm">
                <Clock class="w-4 h-4 animate-spin" />
                <span>等待事件结果...</span>
              </div>
            </div>
          </div>

          <div class="absolute top-3 left-3 w-3 h-3 border-l-2 border-t-2 border-tech/40" />
          <div class="absolute top-3 right-3 w-3 h-3 border-r-2 border-t-2 border-tech/40" />
          <div class="absolute bottom-3 left-3 w-3 h-3 border-l-2 border-b-2 border-tech/40" />
          <div class="absolute bottom-3 right-3 w-3 h-3 border-r-2 border-b-2 border-tech/40" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.9) translateY(20px);
}
</style>
