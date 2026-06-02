<template>
  <div class="min-h-screen p-8">
    <nav class="flex justify-between items-center mb-8">
      <div class="flex items-center gap-4">
        <router-link to="/lobby" class="text-white/60 hover:text-white">← 返回大厅</router-link>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          🚗 我的车库
        </h1>
      </div>
      <div class="card px-4 py-2 flex items-center gap-2">
        <span class="text-yellow-400">💰</span>
        <span class="font-bold">{{ userStore.user?.coins || 0 }}</span>
      </div>
    </nav>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="userCar in userCars" :key="userCar.id" 
           class="card p-6"
           :class="{ 'ring-2 ring-orange-400': userCar.is_active }">
        <div class="text-center mb-4">
          <div class="text-6xl mb-2">🏎️</div>
          <h3 class="text-xl font-bold">{{ userCar.car_name }}</h3>
          <div v-if="userCar.is_active" class="inline-block mt-2 px-3 py-1 bg-orange-500/30 text-orange-400 rounded-full text-sm">
            使用中
          </div>
        </div>

        <div class="space-y-3 mb-6">
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>速度</span>
              <span class="text-orange-400">{{ userCar.current_speed }}</span>
            </div>
            <div class="h-2 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                   :style="{ width: `${(userCar.current_speed / userCar.max_speed) * 100}%` }"></div>
            </div>
            <div class="text-xs text-white/40 mt-1">
              Lv.{{ userCar.speed_level }}/10
            </div>
          </div>

          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>加速</span>
              <span class="text-orange-400">{{ userCar.current_acceleration }}</span>
            </div>
            <div class="h-2 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                   :style="{ width: `${(userCar.current_acceleration / userCar.max_acceleration) * 100}%` }"></div>
            </div>
            <div class="text-xs text-white/40 mt-1">
              Lv.{{ userCar.acceleration_level }}/10
            </div>
          </div>

          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>操控</span>
              <span class="text-orange-400">{{ userCar.current_handling }}</span>
            </div>
            <div class="h-2 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all"
                   :style="{ width: `${(userCar.current_handling / userCar.max_handling) * 100}%` }"></div>
            </div>
            <div class="text-xs text-white/40 mt-1">
              Lv.{{ userCar.handling_level }}/10
            </div>
          </div>

          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>氮气</span>
              <span class="text-orange-400">{{ userCar.current_nitro }}</span>
            </div>
            <div class="h-2 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                   :style="{ width: `${(userCar.current_nitro / userCar.max_nitro) * 100}%` }"></div>
            </div>
            <div class="text-xs text-white/40 mt-1">
              Lv.{{ userCar.nitro_level }}/10
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <button v-for="attr in attributes" :key="attr.key"
                    @click="upgradeAttribute(userCar.id, attr.key)"
                    :disabled="upgrading || userCar[`${attr.key}_level`] >= 10"
                    class="px-3 py-2 text-sm rounded-lg transition-all"
                    :class="userCar[`${attr.key}_level`] >= 10 
                      ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                      : 'bg-white/10 hover:bg-white/20'">
              {{ attr.name }}
              <span v-if="userCar[`${attr.key}_level`] < 10" class="text-yellow-400 ml-1">
                💰{{ getUpgradeCost(userCar, attr.key) }}
              </span>
            </button>
          </div>

          <button v-if="!userCar.is_active"
                  @click="setActiveCar(userCar.id)"
                  :disabled="activating"
                  class="w-full btn-secondary text-sm">
            {{ activating ? '设置中...' : '设为当前' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="userCars.length === 0" class="text-center py-20">
      <div class="text-6xl mb-4">🚗</div>
      <p class="text-white/60">暂无赛车，快去获取吧！</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const userStore = useUserStore()
const userCars = ref([])
const upgrading = ref(false)
const activating = ref(false)

const attributes = [
  { key: 'speed', name: '速度' },
  { key: 'acceleration', name: '加速' },
  { key: 'handling', name: '操控' },
  { key: 'nitro', name: '氮气' }
]

onMounted(async () => {
  await loadUserCars()
})

async function loadUserCars() {
  const response = await api.get('/saiche/car/user/list/get')
  if (response.code === 0) {
    userCars.value = response.data
  }
}

function getUpgradeCost(car, attribute) {
  const level = car[`${attribute}_level`] || 0
  return Math.floor(car.upgrade_cost * (1 + level * 0.5))
}

async function upgradeAttribute(userCarId, attribute) {
  upgrading.value = true
  const response = await api.post(`/saiche/car/upgrade?user_car_id=${userCarId}&attribute=${attribute}`)
  if (response.code === 0) {
    await loadUserCars()
    await userStore.updateUser()
  } else {
    alert(response.msg)
  }
  upgrading.value = false
}

async function setActiveCar(userCarId) {
  activating.value = true
  const response = await api.post(`/saiche/car/active/set?user_car_id=${userCarId}`)
  if (response.code === 0) {
    await loadUserCars()
  } else {
    alert(response.msg)
  }
  activating.value = false
}
</script>
