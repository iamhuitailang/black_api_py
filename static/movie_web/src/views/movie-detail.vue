<template>
  <div class="container" style="margin-top: 20px">
    <el-button link @click="$router.back()" style="margin-bottom: 20px">
      <el-icon><ArrowLeft /></el-icon> 返回
    </el-button>

    <div v-loading="loading">
      <el-row :gutter="20" v-if="movie">
        <el-col :span="8">
          <img v-if="movie.poster" :src="movie.poster" class="detail-poster" />
          <div v-else class="movie-poster-placeholder" style="height: 400px; border-radius: 8px;">
            {{ movie.title }}
          </div>
        </el-col>
        <el-col :span="16">
          <h1 style="margin: 0 0 16px; font-size: 28px">{{ movie.title }}</h1>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px">
            <el-tag type="success" v-if="movie.status === 0">上映中</el-tag>
            <el-tag type="warning" v-else-if="movie.status === 1">即将上映</el-tag>
            <el-tag v-else>已下映</el-tag>
            <div>
              <el-rate :model-value="movie.avg_rating / 2" disabled />
              <span style="color: #f56c6c; font-weight: bold; margin-left: 8px">
                {{ movie.avg_rating }}
              </span>
              <span style="color: #909399">({{ movie.review_count }}条评价)</span>
            </div>
          </div>
          <el-descriptions :column="2" border style="margin-bottom: 20px">
            <el-descriptions-item label="类型">{{ movie.genre || '-' }}</el-descriptions-item>
            <el-descriptions-item label="时长">{{ movie.duration }}分钟</el-descriptions-item>
            <el-descriptions-item label="导演">{{ movie.director || '-' }}</el-descriptions-item>
            <el-descriptions-item label="主演">{{ movie.actors || '-' }}</el-descriptions-item>
            <el-descriptions-item label="语言">{{ movie.language || '-' }}</el-descriptions-item>
            <el-descriptions-item label="上映日期">{{ movie.release_date || '-' }}</el-descriptions-item>
          </el-descriptions>
          <div style="margin-bottom: 20px">
            <h3>剧情简介</h3>
            <p style="color: #606266; line-height: 1.8">{{ movie.description || '暂无简介' }}</p>
          </div>
          <div v-if="movie.trailer_url">
            <h3>预告片</h3>
            <video :src="movie.trailer_url" controls style="max-width: 100%; border-radius: 8px" />
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <div v-if="movie">
        <h2 style="margin-bottom: 20px">选择场次</h2>
        <div v-loading="showtimesLoading" style="margin-bottom: 20px">
          <el-radio-group v-model="selectedDate" @change="fetchShowtimes" style="margin-bottom: 16px">
            <el-radio-button v-for="d in dates" :key="d" :value="d">{{ formatDate(d) }}</el-radio-button>
          </el-radio-group>
          <div style="display: flex; gap: 12px; flex-wrap: wrap">
            <el-card
              v-for="st in showtimes"
              :key="st.id"
              :body-style="{ padding: '16px', cursor: 'pointer', width: '200px' }"
              shadow="hover"
              @click="goSelectSeat(st.id)"
            >
              <div style="font-size: 18px; font-weight: bold">{{ st.show_time }}</div>
              <div style="color: #909399; font-size: 13px">{{ st.hall_name }}</div>
              <div style="color: #f56c6c; font-size: 16px; font-weight: bold; margin-top: 8px">
                ¥{{ st.price }}
              </div>
              <el-tag size="small" :type="st.status === 0 ? 'success' : 'info'" style="margin-top: 8px">
                {{ st.status_text }}
              </el-tag>
            </el-card>
          </div>
          <div v-if="!showtimesLoading && showtimes.length === 0" class="empty-container">
            <el-empty description="该日期暂无场次" />
          </div>
        </div>
      </div>

      <el-divider />

      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
          <h2>影片评价</h2>
          <el-button v-if="isLoggedIn && !myReview" type="primary" @click="showReviewDialog = true">
            写评价
          </el-button>
        </div>

        <div v-if="myReview" style="background: #f5f7fa; padding: 16px; border-radius: 8px; margin-bottom: 20px">
          <div style="color: #909399; font-size: 13px; margin-bottom: 8px">我的评价</div>
          <div style="display: flex; align-items: center; gap: 12px">
            <el-rate :model-value="myReview.rating / 2" disabled />
            <span style="color: #f56c6c; font-weight: bold">{{ myReview.rating }}</span>
          </div>
          <p style="margin-top: 8px">{{ myReview.content }}</p>
          <div style="margin-top: 8px">
            <el-button size="small" @click="showReviewDialog = true">修改</el-button>
            <el-button size="small" type="danger" @click="deleteReview">删除</el-button>
          </div>
        </div>

        <div v-loading="reviewsLoading">
          <div v-for="review in reviews" :key="review.id" style="padding: 16px 0; border-bottom: 1px solid #e4e7ed">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px">
              <strong>{{ review.user?.nickname || '用户' }}</strong>
              <div>
                <el-rate :model-value="review.rating / 2" disabled size="small" />
                <span style="color: #f56c6c; margin-left: 8px">{{ review.rating }}</span>
              </div>
            </div>
            <p style="color: #606266">{{ review.content }}</p>
            <div style="color: #c0c4cc; font-size: 12px; margin-top: 8px">
              {{ review.created_at }}
            </div>
          </div>
          <div v-if="!reviewsLoading && reviews.length === 0" class="empty-container">
            <el-empty description="暂无评价" />
          </div>
          <div v-if="reviewTotal > 10" style="display: flex; justify-content: center; margin-top: 20px">
            <el-pagination
              v-model:current-page="reviewPage"
              :page-size="10"
              :total="reviewTotal"
              layout="prev, pager, next"
              @current-change="fetchReviews"
            />
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showReviewDialog" title="写评价" width="500px">
      <el-form :model="reviewForm">
        <el-form-item label="评分">
          <el-rate v-model="reviewForm.rating" />
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input v-model="reviewForm.content" type="textarea" :rows="4" placeholder="分享你的观影感受..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReview">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { api } from '@/api/request'
import { useUserStore } from '@/stores/user'
import type { Movie, Showtime, Review, PaginatedData } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const movieId = computed(() => Number(route.params.id))

const isLoggedIn = computed(() => userStore.isLoggedIn)

const loading = ref(false)
const movie = ref<Movie | null>(null)
const showtimesLoading = ref(false)
const showtimes = ref<Showtime[]>([])
const dates = ref<string[]>([])
const selectedDate = ref('')

const reviewsLoading = ref(false)
const reviews = ref<Review[]>([])
const reviewPage = ref(1)
const reviewTotal = ref(0)
const myReview = ref<Review | null>(null)

const showReviewDialog = ref(false)
const reviewForm = ref({ rating: 5, content: '' })

function generateDates() {
  const result: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    result.push(d.toISOString().split('T')[0])
  }
  return result
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === 2) return '后天'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

async function fetchMovie() {
  loading.value = true
  try {
    const res = await api.get<Movie>('/movie/detail/get', { movie_id: movieId.value })
    movie.value = res.data
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

async function fetchShowtimes() {
  showtimesLoading.value = true
  try {
    const res = await api.get<Showtime[]>('/movie/showtime/list/get', {
      movie_id: movieId.value,
      show_date: selectedDate.value
    })
    showtimes.value = res.data
  } catch (e) {
    // handled
  } finally {
    showtimesLoading.value = false
  }
}

async function fetchReviews() {
  reviewsLoading.value = true
  try {
    const res = await api.get<PaginatedData<Review>>('/movie/review/list/get', {
      movie_id: movieId.value,
      page: reviewPage.value,
      page_size: 10
    })
    reviews.value = res.data.items
    reviewTotal.value = res.data.total
  } catch (e) {
    // handled
  } finally {
    reviewsLoading.value = false
  }
}

async function checkMyReview() {
  if (!userStore.isLoggedIn) return
  try {
    const res = await api.get<Review | null>('/movie/review/check/get', { movie_id: movieId.value })
    myReview.value = res.data
    if (myReview.value) {
      reviewForm.value.rating = myReview.value.rating
      reviewForm.value.content = myReview.value.content || ''
    }
  } catch (e) {
    // handled
  }
}

async function submitReview() {
  if (!reviewForm.value.rating) {
    ElMessage.warning('请选择评分')
    return
  }
  try {
    if (myReview.value) {
      await api.post('/movie/review/update', reviewForm.value, { params: { review_id: myReview.value.id } })
      ElMessage.success('更新成功')
    } else {
      await api.post('/movie/review/create', {
        movie_id: movieId.value,
        ...reviewForm.value
      })
      ElMessage.success('评价成功')
    }
    showReviewDialog.value = false
    fetchReviews()
    checkMyReview()
    fetchMovie()
  } catch (e) {
    // handled
  }
}

async function deleteReview() {
  if (!myReview.value) return
  try {
    await ElMessageBox.confirm('确定删除你的评价吗？', '提示', { type: 'warning' })
    await api.post('/movie/review/delete', {}, { params: { review_id: myReview.value.id } })
    ElMessage.success('删除成功')
    myReview.value = null
    reviewForm.value = { rating: 5, content: '' }
    fetchReviews()
    fetchMovie()
  } catch (e: any) {
    if (e !== 'cancel') {
      // handled
    }
  }
}

function goSelectSeat(showtimeId: number) {
  router.push(`/seat/${showtimeId}`)
}

onMounted(() => {
  dates.value = generateDates()
  selectedDate.value = dates.value[0]
  fetchMovie()
  fetchShowtimes()
  fetchReviews()
  checkMyReview()
})
</script>