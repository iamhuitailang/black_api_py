<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">🏁 赛道管理</h2>
      <button @click="showAddModal = true" class="btn-primary">
        ➕ 添加赛道
      </button>
    </div>

    <div class="card p-6">
      <table class="w-full">
        <thead>
          <tr class="text-left text-white/60 border-b border-white/10">
            <th class="pb-4">ID</th>
            <th class="pb-4">名称</th>
            <th class="pb-4">难度</th>
            <th class="pb-4">圈数</th>
            <th class="pb-4">奖励金币</th>
            <th class="pb-4">状态</th>
            <th class="pb-4">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="track in tracks" :key="track.id" class="border-b border-white/5">
            <td class="py-4">{{ track.id }}</td>
            <td class="py-4">{{ track.name }}</td>
            <td class="py-4">
              <span v-for="i in 5" :key="i"
                    :class="i <= track.difficulty ? 'text-yellow-400' : 'text-white/20'">★</span>
            </td>
            <td class="py-4">{{ track.laps }}圈</td>
            <td class="py-4 text-yellow-400">{{ track.reward_coins }}</td>
            <td class="py-4">
              <span :class="track.is_active ? 'text-green-400' : 'text-red-400'">
                {{ track.is_active ? '启用' : '禁用' }}
              </span>
            </td>
            <td class="py-4">
              <button @click="editTrack(track)" class="text-blue-400 hover:text-blue-300 mr-3">
                编辑
              </button>
              <button @click="deleteTrack(track.id)" class="text-red-400 hover:text-red-300">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="card p-8 w-full max-w-md">
        <h3 class="text-xl font-bold mb-6">{{ showAddModal ? '添加赛道' : '编辑赛道' }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm mb-2 text-white/70">赛道名称</label>
            <input v-model="formData.name" type="text" class="input-field" />
          </div>
          <div>
            <label class="block text-sm mb-2 text-white/70">描述</label>
            <textarea v-model="formData.description" class="input-field" rows="3"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm mb-2 text-white/70">难度 (1-5)</label>
              <input v-model.number="formData.difficulty" type="number" min="1" max="5" class="input-field" />
            </div>
            <div>
              <label class="block text-sm mb-2 text-white/70">圈数</label>
              <input v-model.number="formData.laps" type="number" min="1" class="input-field" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm mb-2 text-white/70">奖励金币</label>
              <input v-model.number="formData.reward_coins" type="number" min="0" class="input-field" />
            </div>
            <div>
              <label class="block text-sm mb-2 text-white/70">奖励经验</label>
              <input v-model.number="formData.reward_exp" type="number" min="0" class="input-field" />
            </div>
          </div>
          <div>
            <label class="block text-sm mb-2 text-white/70">状态</label>
            <select v-model="formData.is_active" class="input-field">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
        </div>

        <div class="flex gap-4 mt-8">
          <button @click="closeModal" class="btn-secondary flex-1">取消</button>
          <button @click="saveTrack" class="btn-primary flex-1">
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

const tracks = ref([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingId = ref(null)

const formData = reactive({
  name: '',
  description: '',
  difficulty: 1,
  laps: 3,
  reward_coins: 100,
  reward_exp: 50,
  is_active: 1,
  track_data: { width: 120, checkpoints: [] }
})

onMounted(async () => {
  await loadTracks()
})

async function loadTracks() {
  const response = await api.get('/saiche/track/list/get?page_size=50')
  if (response.code === 0) {
    tracks.value = response.data.items
  }
}

function editTrack(track) {
  editingId.value = track.id
  formData.name = track.name
  formData.description = track.description
  formData.difficulty = track.difficulty
  formData.laps = track.laps
  formData.reward_coins = track.reward_coins
  formData.reward_exp = track.reward_exp
  formData.is_active = track.is_active
  showEditModal.value = true
}

function closeModal() {
  showAddModal.value = false
  showEditModal.value = false
  editingId.value = null
  Object.assign(formData, {
    name: '',
    description: '',
    difficulty: 1,
    laps: 3,
    reward_coins: 100,
    reward_exp: 50,
    is_active: 1
  })
}

async function saveTrack() {
  const data = {
    name: formData.name,
    description: formData.description,
    difficulty: formData.difficulty,
    laps: formData.laps,
    reward_coins: formData.reward_coins,
    reward_exp: formData.reward_exp,
    is_active: formData.is_active,
    track_data: formData.track_data
  }

  let response
  if (showAddModal.value) {
    response = await api.post('/saiche/track/add', data)
  } else {
    response = await api.post(`/saiche/track/update?track_id=${editingId.value}`, data)
  }

  if (response.code === 0) {
    await loadTracks()
    closeModal()
  } else {
    alert(response.msg)
  }
}

async function deleteTrack(trackId) {
  if (!confirm('确定要删除该赛道吗？')) return
  
  const response = await api.post(`/saiche/track/delete?track_id=${trackId}`)
  if (response.code === 0) {
    await loadTracks()
  } else {
    alert(response.msg)
  }
}
</script>
