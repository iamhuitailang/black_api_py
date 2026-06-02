<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">🚗 赛车管理</h2>
      <button @click="showAddModal = true" class="btn-primary">
        ➕ 添加赛车
      </button>
    </div>

    <div class="card p-6">
      <table class="w-full">
        <thead>
          <tr class="text-left text-white/60 border-b border-white/10">
            <th class="pb-4">ID</th>
            <th class="pb-4">名称</th>
            <th class="pb-4">基础属性</th>
            <th class="pb-4">满级属性</th>
            <th class="pb-4">价格</th>
            <th class="pb-4">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="car in cars" :key="car.id" class="border-b border-white/5">
            <td class="py-4">{{ car.id }}</td>
            <td class="py-4">{{ car.name }}</td>
            <td class="py-4 text-sm">
              <div>速度: {{ car.base_speed }}</div>
              <div>加速: {{ car.base_acceleration }}</div>
              <div>操控: {{ car.base_handling }}</div>
              <div>氮气: {{ car.base_nitro }}</div>
            </td>
            <td class="py-4 text-sm text-orange-400">
              <div>{{ car.max_speed }}</div>
              <div>{{ car.max_acceleration }}</div>
              <div>{{ car.max_handling }}</div>
              <div>{{ car.max_nitro }}</div>
            </td>
            <td class="py-4 text-yellow-400">{{ car.price }}</td>
            <td class="py-4">
              <button @click="editCar(car)" class="text-blue-400 hover:text-blue-300 mr-3">
                编辑
              </button>
              <button @click="deleteCar(car.id)" class="text-red-400 hover:text-red-300">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="card p-8 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <h3 class="text-xl font-bold mb-6">{{ showAddModal ? '添加赛车' : '编辑赛车' }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm mb-2 text-white/70">赛车名称</label>
            <input v-model="formData.name" type="text" class="input-field" />
          </div>
          <div>
            <label class="block text-sm mb-2 text-white/70">描述</label>
            <textarea v-model="formData.description" class="input-field" rows="2"></textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="text-sm font-bold mb-3 text-blue-400">基础属性</h4>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs mb-1 text-white/60">基础速度</label>
                  <input v-model.number="formData.base_speed" type="number" class="input-field" />
                </div>
                <div>
                  <label class="block text-xs mb-1 text-white/60">基础加速</label>
                  <input v-model.number="formData.base_acceleration" type="number" class="input-field" />
                </div>
                <div>
                  <label class="block text-xs mb-1 text-white/60">基础操控</label>
                  <input v-model.number="formData.base_handling" type="number" class="input-field" />
                </div>
                <div>
                  <label class="block text-xs mb-1 text-white/60">基础氮气</label>
                  <input v-model.number="formData.base_nitro" type="number" class="input-field" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 class="text-sm font-bold mb-3 text-orange-400">满级属性</h4>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs mb-1 text-white/60">满级速度</label>
                  <input v-model.number="formData.max_speed" type="number" class="input-field" />
                </div>
                <div>
                  <label class="block text-xs mb-1 text-white/60">满级加速</label>
                  <input v-model.number="formData.max_acceleration" type="number" class="input-field" />
                </div>
                <div>
                  <label class="block text-xs mb-1 text-white/60">满级操控</label>
                  <input v-model.number="formData.max_handling" type="number" class="input-field" />
                </div>
                <div>
                  <label class="block text-xs mb-1 text-white/60">满级氮气</label>
                  <input v-model.number="formData.max_nitro" type="number" class="input-field" />
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm mb-2 text-white/70">价格</label>
              <input v-model.number="formData.price" type="number" min="0" class="input-field" />
            </div>
            <div>
              <label class="block text-sm mb-2 text-white/70">升级消耗</label>
              <input v-model.number="formData.upgrade_cost" type="number" min="0" class="input-field" />
            </div>
          </div>
        </div>

        <div class="flex gap-4 mt-8">
          <button @click="closeModal" class="btn-secondary flex-1">取消</button>
          <button @click="saveCar" class="btn-primary flex-1">
            {{ showAddModal ? '添加' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/utils/api'

const cars = ref([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingId = ref(null)

const formData = reactive({
  name: '',
  description: '',
  base_speed: 100,
  base_acceleration: 50,
  base_handling: 50,
  base_nitro: 100,
  max_speed: 180,
  max_acceleration: 90,
  max_handling: 90,
  max_nitro: 180,
  price: 0,
  upgrade_cost: 100
})

onMounted(async () => {
  await loadCars()
})

async function loadCars() {
  const response = await api.get('/saiche/car/list/get?page_size=50')
  if (response.code === 0) {
    cars.value = response.data.items
  }
}

function editCar(car) {
  editingId.value = car.id
  formData.name = car.name
  formData.description = car.description
  formData.base_speed = car.base_speed
  formData.base_acceleration = car.base_acceleration
  formData.base_handling = car.base_handling
  formData.base_nitro = car.base_nitro
  formData.max_speed = car.max_speed
  formData.max_acceleration = car.max_acceleration
  formData.max_handling = car.max_handling
  formData.max_nitro = car.max_nitro
  formData.price = car.price
  formData.upgrade_cost = car.upgrade_cost
  showEditModal.value = true
}

function closeModal() {
  showAddModal.value = false
  showEditModal.value = false
  editingId.value = null
  Object.assign(formData, {
    name: '',
    description: '',
    base_speed: 100,
    base_acceleration: 50,
    base_handling: 50,
    base_nitro: 100,
    max_speed: 180,
    max_acceleration: 90,
    max_handling: 90,
    max_nitro: 180,
    price: 0,
    upgrade_cost: 100
  })
}

async function saveCar() {
  const data = { ...formData }

  let response
  if (showAddModal.value) {
    response = await api.post('/saiche/car/add', data)
  } else {
    response = await api.post(`/saiche/car/update?car_id=${editingId.value}`, data)
  }

  if (response.code === 0) {
    await loadCars()
    closeModal()
  } else {
    alert(response.msg)
  }
}

async function deleteCar(carId) {
  if (!confirm('确定要删除该赛车吗？')) return
  
  const response = await api.post(`/saiche/car/delete?car_id=${carId}`)
  if (response.code === 0) {
    await loadCars()
  } else {
    alert(response.msg)
  }
}
</script>
