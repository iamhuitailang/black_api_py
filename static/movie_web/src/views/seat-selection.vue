<template>
  <div class="container" style="margin-top: 20px">
    <el-button link @click="$router.back()" style="margin-bottom: 20px">
      <el-icon><ArrowLeft /></el-icon> 返回
    </el-button>

    <div v-loading="loading">
      <div v-if="showtime">
        <el-card style="margin-bottom: 20px">
          <div style="display: flex; justify-content: space-between; align-items: center">
            <div>
              <h2 style="margin: 0">{{ showtime.movie_title }}</h2>
              <div style="color: #909399; margin-top: 8px">
                {{ showtime.show_date }} {{ showtime.show_time }} · {{ showtime.hall_name }}
              </div>
            </div>
            <div style="text-align: right">
              <div style="font-size: 24px; color: #f56c6c; font-weight: bold">¥{{ showtime.price }}</div>
              <div style="color: #909399; font-size: 13px">剩余 {{ showtime.available_seats }} 座</div>
            </div>
          </div>
        </el-card>

        <el-card>
          <h3 style="text-align: center">选择座位</h3>
          <div class="seat-map">
            <div class="screen">SCREEN 银幕</div>
            <div v-for="(row, rowIndex) in seatMap" :key="rowIndex" class="seat-row">
              <span style="width: 30px; text-align: center; color: #909399; font-size: 12px">{{ String.fromCharCode(65 + rowIndex) }}</span>
              <div
                v-for="(seat, seatIndex) in row"
                :key="seatIndex"
                class="seat"
                :class="getSeatClass(rowIndex, seatIndex)"
                @click="toggleSeat(rowIndex, seatIndex)"
              >
                {{ seatIndex + 1 }}
              </div>
            </div>
            <div class="seat-legend">
              <div class="seat-legend-item">
                <div class="legend-box" style="background: #e8f5e9; border: 1px solid #4caf50"></div>
                <span>可选</span>
              </div>
              <div class="seat-legend-item">
                <div class="legend-box" style="background: #4caf50; border: 1px solid #4caf50"></div>
                <span>已选</span>
              </div>
              <div class="seat-legend-item">
                <div class="legend-box" style="background: #e0e0e0; border: 1px solid #e0e0e0"></div>
                <span>已售</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 20px">
          <div style="display: flex; justify-content: space-between; align-items: center">
            <div>
              <div>已选座位: <strong>{{ selectedSeats.length > 0 ? selectedSeats.join(', ') : '未选择' }}</strong></div>
              <div style="color: #909399; font-size: 13px; margin-top: 4px">
                共 {{ selectedSeats.length }} 张，总价 <span style="color: #f56c6c; font-weight: bold; font-size: 18px">¥{{ totalPrice }}</span>
              </div>
            </div>
            <el-button type="primary" size="large" :disabled="selectedSeats.length === 0" :loading="submitting" @click="handleOrder">
              确认下单
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { api } from '@/api/request'
import { useUserStore } from '@/stores/user'
import type { Showtime } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const showtimeId = computed(() => Number(route.params.showtimeId))

const loading = ref(false)
const submitting = ref(false)
const showtime = ref<Showtime | null>(null)
const selectedSeats = ref<string[]>([])
const soldSeats = ref<Set<string>>(new Set())

const totalRows = 8
const totalCols = 12
const seatMap = computed(() => Array.from({ length: totalRows }, () => Array(totalCols).fill(0)))

const totalPrice = computed(() => {
  if (!showtime.value) return 0
  return Math.round(showtime.value.price * selectedSeats.value.length * 100) / 100
})

function getSeatClass(row: number, col: number) {
  const seatName = `${String.fromCharCode(65 + row)}${col + 1}`
  if (soldSeats.value.has(seatName)) return 'seat-sold'
  if (selectedSeats.value.includes(seatName)) return 'seat-selected'
  return 'seat-available'
}

function toggleSeat(row: number, col: number) {
  const seatName = `${String.fromCharCode(65 + row)}${col + 1}`
  if (soldSeats.value.has(seatName)) return

  const idx = selectedSeats.value.indexOf(seatName)
  if (idx > -1) {
    selectedSeats.value.splice(idx, 1)
  } else {
    if (selectedSeats.value.length >= 6) {
      ElMessage.warning('最多选择6个座位')
      return
    }
    selectedSeats.value.push(seatName)
  }
}

async function fetchShowtime() {
  loading.value = true
  try {
    const res = await api.get<Showtime & { sold_seats: string[] }>('/movie/showtime/detail/get', { showtime_id: showtimeId.value })
    showtime.value = res.data
    if (res.data.sold_seats) {
      soldSeats.value = new Set(res.data.sold_seats)
    }
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

async function handleOrder() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  if (selectedSeats.value.length === 0) return

  submitting.value = true
  try {
    const res = await api.post<{ id: number; order_no: string }>('/movie/order/create', {
      showtime_id: showtimeId.value,
      seats: selectedSeats.value
    })
    ElMessage.success('下单成功！请完成支付')
    router.push('/orders')
  } catch (e) {
    // handled
  } finally {
    submitting.value = false
  }
}

onMounted(fetchShowtime)
</script>