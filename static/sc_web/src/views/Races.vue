<template>
  <div class="races-page">
    <div class="page-header">
      <h1 class="page-title">赛事中心</h1>
      <p class="page-subtitle">参加各种比赛，赢取丰厚奖励</p>
    </div>

    <el-tabs v-model="activeTab" class="main-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="即将开始" name="upcoming">
        <div v-loading="loading.upcoming" class="races-list">
          <div
            v-for="(race, index) in upcomingRaces"
            :key="race.id"
            class="race-card"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="race-header">
              <div class="race-info">
                <h3 class="race-name">{{ race.name }}</h3>
                <div class="race-tags">
                  <el-tag :type="getDifficultyType(race.difficulty)" effect="dark" size="small">
                    {{ getDifficultyName(race.difficulty) }}
                  </el-tag>
                  <el-tag effect="dark" size="small" class="track-tag">
                    {{ getTrackTypeName(race.track_type) }}
                  </el-tag>
                  <el-tag v-if="race.min_level > 1" type="info" effect="dark" size="small">
                    Lv.{{ race.min_level }}+
                  </el-tag>
                </div>
              </div>
              <div class="race-time">
                <el-icon :size="20" color="#ff6b00"><Document /></el-icon>
                <span>{{ formatCountdown(race.start_time) }}</span>
              </div>
            </div>

            <div class="race-track">
              <svg class="track-preview" viewBox="0 0 200 120">
                <defs>
                  <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color: #2a2a4a" />
                    <stop offset="100%" style="stop-color: #1a1a3a" />
                  </linearGradient>
                </defs>
                <path
                  :d="getTrackPath(race.track_type)"
                  fill="none"
                  stroke="url(#trackGrad)"
                  stroke-width="12"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  :d="getTrackPath(race.track_type)"
                  fill="none"
                  stroke="#ff6b00"
                  stroke-width="2"
                  stroke-dasharray="8,8"
                  opacity="0.5"
                />
                <circle cx="100" cy="60" r="4" fill="#ff6b00" />
              </svg>
            </div>

            <div class="race-details">
              <div class="detail-item">
                <span class="detail-icon">💰</span>
                <div class="detail-content">
                  <span class="detail-label">报名费</span>
                  <span class="detail-value entry-fee">{{ race.entry_fee || 0 }} 金币</span>
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-icon">🏆</span>
                <div class="detail-content">
                  <span class="detail-label">奖池</span>
                  <span class="detail-value prize-pool">{{ race.prize_pool || 0 }} 金币</span>
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-icon">👥</span>
                <div class="detail-content">
                  <span class="detail-label">参赛人数</span>
                  <span class="detail-value">{{ race.participants_count || 0 }}/{{ race.max_participants || 20 }}</span>
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-icon">🌤️</span>
                <div class="detail-content">
                  <span class="detail-label">天气</span>
                  <span class="detail-value">{{ getWeatherName(race.weather) }}</span>
                </div>
              </div>
            </div>

            <div class="race-actions">
              <el-button class="btn-secondary" size="small" @click="viewRaceDetail(race)">
                查看详情
              </el-button>
              <el-button
                type="primary"
                class="btn-primary"
                size="small"
                :disabled="race.is_registered"
                @click="openEnterRaceDialog(race)"
              >
                {{ race.is_registered ? '已报名' : '报名参赛' }}
              </el-button>
            </div>
          </div>

          <el-empty v-if="upcomingRaces.length === 0 && !loading.upcoming" description="暂无即将开始的比赛" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="正在进行" name="ongoing">
        <div v-loading="loading.ongoing" class="races-list">
          <div
            v-for="(race, index) in ongoingRaces"
            :key="race.id"
            class="race-card ongoing"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="race-header">
              <div class="race-info">
              <h3 class="race-name">
                {{ race.name }}
                <span class="live-badge">
                  <span class="live-dot"></span>
                  直播中
                </span>
              </h3>
              <div class="race-tags">
                <el-tag :type="getDifficultyType(race.difficulty)" effect="dark" size="small">
                  {{ getDifficultyName(race.difficulty) }}
                </el-tag>
                <el-tag effect="dark" size="small">{{ getTrackTypeName(race.track_type) }}</el-tag>
              </div>
            </div>
            </div>
            <div class="race-progress">
              <div class="progress-header">
                <span>比赛进度</span>
                <span>{{ race.current_lap || 1 }}/{{ race.total_laps || 5 }} 圈</span>
              </div>
              <el-progress
                :percentage="((race.current_lap || 1) / (race.total_laps || 5)) * 100"
                :show-text="false"
                :stroke-width="8"
                color="#ff6b00"
              />
            </div>

            <div class="race-actions">
              <el-button class="btn-secondary" size="small" @click="viewRaceDetail(race)">
                实时数据
              </el-button>
            </div>
          </div>
          <el-empty v-if="ongoingRaces.length === 0 && !loading.ongoing" description="暂无正在进行的比赛" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="已结束" name="finished">
        <div v-loading="loading.finished" class="races-list">
          <div
            v-for="(race, index) in finishedRaces"
            :key="race.id"
            class="race-card finished"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="race-header">
              <div class="race-info">
                <h3 class="race-name">{{ race.name }}</h3>
                <div class="race-tags">
                  <el-tag :type="getDifficultyType(race.difficulty)" effect="dark" size="small">
                    {{ getDifficultyName(race.difficulty) }}
                  </el-tag>
                  <el-tag effect="dark" size="small">{{ getTrackTypeName(race.track_type) }}</el-tag>
                  <el-tag type="success" effect="dark" size="small">已结束</el-tag>
                </div>
              </div>
              <div class="race-time">
                <el-icon :size="20"><Document /></el-icon>
                <span>{{ formatDate(race.end_time) }}</span>
              </div>
            </div>

            <div class="race-results-preview">
              <div class="result-item">
                <span class="result-position">1</span>
                <span class="result-name">{{ race.winner || '未知车手' }}</span>
                <span class="result-time">{{ race.winner_time || '--:--:--' }}</span>
              </div>
            </div>

            <div class="race-actions">
              <el-button class="btn-secondary" size="small" @click="viewRaceResults(race)">
                查看完整排名
              </el-button>
            </div>
          </div>
          <el-empty v-if="finishedRaces.length === 0 && !loading.finished" description="暂无已结束的比赛" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="我的赛事" name="my">
        <div v-loading="loading.my" class="my-races">
          <el-table :data="myRaceHistory" style="width: 100%">
            <el-table-column prop="race_name" label="赛事名称" min-width="180" />
            <el-table-column label="赛道" prop="track_type" width="120">
              <template #default="{ row }">
                {{ getTrackTypeName(row.track_type) }}
              </template>
            </el-table-column>
            <el-table-column label="排名" prop="position" width="100">
              <template #default="{ row }">
                <span :class="getPositionClass(row.position)">
                  #{{ row.position || '-' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="finish_time" label="完成时间" width="140" />
            <el-table-column label="获得金币" prop="coins_earned" width="120">
              <template #default="{ row }">
                <span class="coins-earned">+{{ row.coins_earned || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="获得积分" prop="points_earned" width="120">
              <template #default="{ row }">
                <span class="points-earned">+{{ row.points_earned || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="比赛时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="myRaceHistory.length === 0 && !loading.my" description="暂无参赛记录" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="detailDialogVisible"
      title="赛事详情"
      width="900px"
      class="race-detail-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="selectedRace" class="race-detail-content">
        <div class="detail-section">
          <h3 class="section-title">赛道信息</h3>
          <div class="track-visualization">
            <svg class="track-large" viewBox="0 0 500 300">
              <defs>
                <linearGradient id="trackLargeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color: #3a3a5a" />
                  <stop offset="100%" style="stop-color: #2a2a4a" />
                </linearGradient>
                <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color: #1a4a2a" />
                  <stop offset="100%" style="stop-color: #0a2a1a" />
                </linearGradient>
                <filter id="trackShadow">
                  <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.3" />
                </filter>
              </defs>
              <rect width="500" height="300" fill="url(#grassGrad)" />
              <path
                :d="getLargeTrackPath(selectedRace.track_type)"
                fill="none"
                stroke="url(#trackLargeGrad)"
                stroke-width="40"
                stroke-linecap="round"
                stroke-linejoin="round"
                filter="url(#trackShadow)"
              />
              <path
                :d="getLargeTrackPath(selectedRace.track_type)"
                fill="none"
                stroke="#ff6b00"
                stroke-width="2"
                stroke-dasharray="15,15"
                opacity="0.6"
              />
              <path
                :d="getLargeTrackPath(selectedRace.track_type)"
                fill="none"
                stroke="#fff"
                stroke-width="1"
                stroke-dasharray="5,20"
                opacity="0.3"
              />
              <g class="track-markers">
                <circle cx="250" cy="150" r="8" fill="#ff6b00" stroke="#fff" stroke-width="2" />
                <text x="250" y="140" text-anchor="middle" fill="#fff" font-size="12">起点/终点</text>
              </g>
              <g v-for="(marker, i) in getTrackMarkers(selectedRace.track_type)" :key="i">
                <circle :cx="marker.x" :cy="marker.y" r="5" fill="#ff6b00" opacity="0.6" />
              </g>
            </svg>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-section info-section">
            <h3 class="section-title">比赛信息</h3>
            <el-descriptions :column="1" border class="info-desc">
              <el-descriptions-item label="赛事名称">{{ selectedRace.name }}</el-descriptions-item>
              <el-descriptions-item label="赛道类型">{{ getTrackTypeName(selectedRace.track_type) }}</el-descriptions-item>
              <el-descriptions-item label="难度">{{ getDifficultyName(selectedRace.difficulty) }}</el-descriptions-item>
              <el-descriptions-item label="最低等级">Lv.{{ selectedRace.min_level || 1 }}</el-descriptions-item>
              <el-descriptions-item label="总圈数">{{ selectedRace.total_laps || 5 }} 圈</el-descriptions-item>
              <el-descriptions-item label="单圈长度">{{ selectedRace.track_length || 5 }} 公里</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="detail-section weather-section">
            <h3 class="section-title">
              <span class="weather-icon">{{ getWeatherIcon(selectedRace.weather) }}</span>
              天气状况
            </h3>
            <div class="weather-info">
              <div class="weather-main">{{ getWeatherName(selectedRace.weather) }}</div>
              <div class="weather-desc">{{ getWeatherDescription(selectedRace.weather) }}</div>
              <div class="weather-effects">
                <span v-for="effect in getWeatherEffects(selectedRace.weather)" :key="effect" class="weather-effect">
                  {{ effect }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3 class="section-title">奖金分配</h3>
          <div class="prize-distribution">
            <div
              v-for="(prize, index) in getPrizeDistribution(selectedRace)"
              :key="index"
              class="prize-item"
            >
              <span class="prize-rank">{{ index + 1 }}</span>
              <span class="prize-coins">{{ prize.coins }} 金币</span>
              <span class="prize-points">+{{ prize.points }} 积分</span>
              <div class="prize-bar">
                <div
                  class="prize-fill"
                  :style="{ width: `${100 - index * 15}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3 class="section-title">
            已报名车手 ({{ raceEntries.length }})
          </h3>
          <div v-loading="loading.entries" class="entries-list">
            <div
              v-for="(entry, index) in raceEntries"
              :key="entry.id"
              class="entry-item"
            >
              <span class="entry-rank">#{{ index + 1 }}</span>
              <el-avatar :size="40" :src="entry.avatar">
                {{ entry.driver_name?.charAt(0) }}
              </el-avatar>
              <div class="entry-info">
                <span class="entry-name">{{ entry.driver_name }}</span>
                <span class="entry-car">{{ entry.car_name }}</span>
              </div>
              <span class="entry-level">Lv.{{ entry.level }}</span>
            </div>
            <el-empty v-if="raceEntries.length === 0 && !loading.entries" description="暂无报名车手" />
          </div>
        </div>

        <div v-if="activeTab === 'upcoming' && !selectedRace.is_registered" class="simulation-section">
          <el-button
            type="primary"
            class="btn-primary simulate-btn"
            size="large"
            :disabled="simulating"
            @click="startSimulation"
          >
            <el-icon v-if="simulating"><Loading /></el-icon>
            {{ simulating ? '模拟比赛中...' : '模拟比赛' }}
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="enterDialogVisible"
      title="报名参赛"
      width="500px"
      class="enter-race-dialog"
    >
      <div v-if="raceToEnter" class="enter-race-content">
        <div class="enter-info">
          <h4>{{ raceToEnter.name }}</h4>
          <p class="enter-fee">报名费: <strong>{{ raceToEnter.entry_fee || 0 }} 金币</strong></p>
        </div>

        <el-form label-width="100px" class="enter-form">
          <el-form-item label="选择赛车">
            <el-select v-model="selectedCarId" placeholder="请选择参赛赛车">
              <el-option
                v-for="car in availableCars"
                :key="car.id"
                :label="car.name"
                :value="car.id"
              >
                <div class="car-option">
                  <span>{{ car.name }}</span>
                  <span class="car-tier" :class="'tier-' + (car.tier || 1)">
                    Tier {{ car.tier || 1 }}
                  </span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>

        <div v-if="selectedCarId" class="selected-car-preview">
          <CarPreview
            :primary-color="getCarColors(selectedCarId).primary"
            :secondary-color="getCarColors(selectedCarId).secondary"
            :accent-color="getCarColors(selectedCarId).accent"
            :body-style="getCarBodyStyle(selectedCarId)"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="enterDialogVisible = false">取消</el-button>
        <el-button type="primary" class="btn-primary" :disabled="!selectedCarId" @click="confirmEnterRace">
          确认报名
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="resultsDialogVisible"
      title="比赛结果"
      width="800px"
      class="race-results-dialog"
    >
      <div v-if="raceResults.length > 0" class="results-content">
        <div class="results-header">
          <h3>{{ selectedRace?.name }}</h3>
          <p>{{ formatDate(selectedRace?.end_time) }}</p>
        </div>

        <el-table :data="raceResults" style="width: 100%">
          <el-table-column label="排名" width="80">
            <template #default="{ row, $index }">
              <span :class="getPositionClass($index + 1)">
                #{{ $index + 1 }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="车手" min-width="150">
            <template #default="{ row }">
              <div class="result-driver">
                <el-avatar :size="32" :src="row.driver_avatar">
                  {{ row.driver_name?.charAt(0) }}
                </el-avatar>
                <span>{{ row.driver_name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="car_name" label="赛车" min-width="120" />
          <el-table-column prop="finish_time" label="完成时间" width="140" />
          <el-table-column prop="best_lap" label="最佳圈速" width="120" />
          <el-table-column label="金币奖励" width="120">
            <template #default="{ row }">
              <span class="reward-coins">+{{ row.coins_earned || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="积分奖励" width="120">
            <template #default="{ row }">
              <span class="reward-points">+{{ row.points_earned || 0 }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="暂无比赛结果" />
    </el-dialog>

    <el-dialog
      v-model="simulationDialogVisible"
      title="模拟比赛"
      width="600px"
      class="simulation-dialog"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="simulation-content">
        <div class="countdown-display">
          <div class="countdown-number">{{ countdown }}</div>
          <div class="countdown-text">{{ countdownText }}</div>
        </div>
        <div class="simulation-track">
          <svg viewBox="0 0 500 100">
            <defs>
              <linearGradient id="simTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color: #2a2a4a" />
              <stop offset="100%" style="stop-color: #1a1a3a" />
            </linearGradient>
            </defs>
            <rect x="0" y="30" width="500" height="40" fill="url(#simTrackGrad)" rx="20" />
            <line x1="0" y1="50" x2="500" y2="50" stroke="#ff6b00" stroke-width="2" stroke-dasharray="20,10" opacity="0.5" />
            <g
              v-for="(car, index) in simulationCars"
              :key="car.id"
              class="sim-car"
              :style="{ transform: `translateX(${car.position}px)` }"
            >
              <ellipse :cx="30" :cy="35 + index * 15" rx="15" ry="8" :fill="car.color" />
            </g>
          </svg>
        </div>
        <div class="simulation-status">
          <div v-for="(car, index) in simulationCars" :key="car.id" class="sim-status-item">
            <span class="sim-position" :class="getPositionClass(index + 1)">#{{ index + 1 }}</span>
            <span class="sim-name">{{ car.name }}</span>
            <span class="sim-lap">{{ car.lap }}/{{ totalLaps }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Loading } from '@element-plus/icons-vue'
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import CarPreview from '@/components/CarPreview.vue'
import {
  getUpcomingRaces,
  getRaceDetail,
  getRaceEntries,
  enterRace,
  getUserRaces,
  simulateRace,
  getRaceResults,
  getUserResults
} from '@/api/race'

const gameStore = useGameStore()
const userStore = useUserStore()

const activeTab = ref('upcoming')

const loading = reactive({
  upcoming: false,
  ongoing: false,
  finished: false,
  my: false,
  entries: false
})

const upcomingRaces = ref([])
const ongoingRaces = ref([])
const finishedRaces = ref([])
const myRaceHistory = ref([])
const raceEntries = ref([])
const raceResults = ref([])
const availableCars = ref([])

const detailDialogVisible = ref(false)
const enterDialogVisible = ref(false)
const resultsDialogVisible = ref(false)
const simulationDialogVisible = ref(false)

const selectedRace = ref(null)
const raceToEnter = ref(null)
const selectedCarId = ref(null)

const simulating = ref(false)
const countdown = ref(3)
const countdownText = ref('准备开始')
const simulationCars = ref([])
const totalLaps = ref(5)
const simulationInterval = ref(null)

const trackPaths = {
  circuit: 'M30,60 Q50,20 100,20 L170,30 Q200,35 230,30 L300,20 Q370,20 390,60 Q400,100 370,100 L300,100 Q230,100 L170,100 Q100,100 30,100 Q10,90 30,60 Z',
  oval: 'M50,60 Q70,20 150,20 L250,20 Q330,20 350,60 Q370,100 350,100 L250,100 Q150,100 50,100 Q30,100 50,60 Z',
  street: 'M30,60 L80,40 L130,60 L180,30 L230,50 L280,40 L330,70 L380,50 L390,90 L340,100 L290,80 L240,100 L190,80 L140,100 L90,80 L40,100 L30,60 Z',
  mountain: 'M30,80 L80,50 L130,70 L180,30 L230,60 L280,40 L330,70 L380,50 L390,90 L350,100 L300,80 L250,100 L200,70 L150,90 L100,70 L50,90 L30,80 Z',
  rally: 'M30,90 Q60,40 100,60 Q140,80 180,50 Q220,30 260,60 Q300,80 340,50 Q370,30 390,80 Q400,100 370,100 L330,100 Q290,100 L250,100 Q210,100 L170,100 Q130,100 L90,100 Q50,100 30,90 Z'
}

const largeTrackPaths = {
  circuit: 'M50,150 Q80,50 180,50 L320,70 Q400,60 450,150 Q470,250 400,250 L300,250 Q200,250 L100,250 Q50,250 50,150 Z',
  oval: 'M80,150 Q120,50 250,50 L350,50 Q430,50 450,150 Q470,250 430,250 L350,250 Q250,250 L150,250 Q100,250 80,150 Z',
  street: 'M50,150 L120,100 L200,150 L280,70 L360,120 L420,90 L450,150 L430,220 L380,250 L300,210 L230,250 L160,220 L90,250 L50,220 L50,150 Z',
  mountain: 'M50,200 L120,130 L200,170 L280,80 L360,140 L420,100 L460,160 L440,230 L380,250 L300,210 L230,250 L160,200 L90,240 L50,200 Z',
  rally: 'M50,200 Q100,100 180,140 Q260,180 320,120 Q380,80 430,150 Q470,220 430,250 L350,250 L270,250 L190,250 L110,250 L50,200 Z'
}

const trackMarkers = {
  circuit: [{ x: 150, y: 80 }, { x: 350, y: 150 }, { x: 250, y: 220 }, { x: 100, y: 200 }],
  oval: [{ x: 200, y: 80 }, { x: 400, y: 150 }, { x: 250, y: 220 }, { x: 100, y: 150 }],
  street: [{ x: 100, y: 120 }, { x: 280, y: 90 }, { x: 400, y: 180 }, { x: 200, y: 230 }],
  mountain: [{ x: 180, y: 140 }, { x: 350, y: 120 }, { x: 380, y: 200 }, { x: 150, y: 220 }],
  rally: [{ x: 120, y: 150 }, { x: 280, y: 130 }, { x: 400, y: 180 }, { x: 250, y: 230 }]
}

const difficultyMap = {
  easy: { name: '初级', type: 'success' },
  medium: { name: '中级', type: 'warning' },
  hard: { name: '高级', type: 'danger' },
  expert: { name: '专家', type: 'danger' }
}

const trackTypeMap = {
  circuit: '环形赛道',
  oval: '椭圆赛道',
  street: '街道赛道',
  mountain: '山地赛道',
  rally: '拉力赛道'
}

const weatherMap = {
  sunny: { name: '晴天', icon: '☀️', desc: '阳光明媚，适合比赛', effects: ['抓地力正常'] },
  cloudy: { name: '多云', icon: '⛅', desc: '多云天气，视野良好', effects: ['抓地力正常'] },
  rainy: { name: '雨天', icon: '🌧️', desc: '路面湿滑，小心驾驶', effects: ['抓地力降低', '刹车距离增加'] },
  foggy: { name: '雾天', icon: '🌫️', desc: '能见度低，注意安全', effects: ['视野受限', '抓地力降低'] },
  snowy: { name: '雪天', icon: '❄️', desc: '路面结冰，极度危险', effects: ['抓地力大幅降低', '操控难度增加'] }
}

function getDifficultyName(difficulty) {
  return difficultyMap[difficulty]?.name || '未知'
}

function getDifficultyType(difficulty) {
  return difficultyMap[difficulty]?.type || 'info'
}

function getTrackTypeName(type) {
  return trackTypeMap[type] || '未知赛道'
}

function getTrackPath(type) {
  return trackPaths[type] || trackPaths.circuit
}

function getLargeTrackPath(type) {
  return largeTrackPaths[type] || largeTrackPaths.circuit
}

function getTrackMarkers(type) {
  return trackMarkers[type] || []
}

function getWeatherName(weather) {
  return weatherMap[weather]?.name || '未知'
}

function getWeatherIcon(weather) {
  return weatherMap[weather]?.icon || '🌤️'
}

function getWeatherDescription(weather) {
  return weatherMap[weather]?.desc || ''
}

function getWeatherEffects(weather) {
  return weatherMap[weather]?.effects || []
}

function getPrizeDistribution(race) {
  const pool = race?.prize_pool || 1000
  return [
    { coins: Math.floor(pool * 0.5), points: 100 },
    { coins: Math.floor(pool * 0.3), points: 70 },
    { coins: Math.floor(pool * 0.15), points: 40 },
    { coins: Math.floor(pool * 0.05), points: 20 }
  ]
}

function getPositionClass(position) {
  if (position === 1) return 'position-1'
  if (position === 2) return 'position-2'
  if (position === 3) return 'position-3'
  return ''
}

function formatCountdown(time) {
  if (!time) return '即将开始'
  const now = new Date().getTime()
  const target = new Date(time).getTime()
  const diff = target - now
  if (diff <= 0) return '即将开始'
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours > 24) return `${Math.floor(hours / 24)}天后`
  if (hours > 0) return `${hours}小时${minutes}分钟`
  return `${minutes}分钟`
}

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getCarColors(carId) {
  const car = gameStore.cars.find(c => c.id === carId)
  return {
    primary: car?.colors?.primary || '#ff6b00',
    secondary: car?.colors?.secondary || '#cc5500',
    accent: car?.colors?.accent || '#ff8c00'
  }
}

function getCarBodyStyle(carId) {
  const car = gameStore.cars.find(c => c.id === carId)
  return car?.body_style || 'sports'
}

async function handleTabChange(tab) {
  activeTab.value = tab
  if (tab === 'upcoming') fetchUpcomingRaces()
  if (tab === 'ongoing') fetchOngoingRaces()
  if (tab === 'finished') fetchFinishedRaces()
  if (tab === 'my') fetchMyRaces()
}

async function fetchUpcomingRaces() {
  loading.upcoming = true
  try {
    const res = await getUpcomingRaces({ status: 'upcoming' })
    if (res.code === 0 || res.code === 200) {
      upcomingRaces.value = res.data || []
    }
  } catch (error) {
    console.error('Fetch upcoming races error:', error)
  } finally {
    loading.upcoming = false
  }
}

async function fetchOngoingRaces() {
  loading.ongoing = true
  try {
    const res = await getUpcomingRaces({ status: 'ongoing' })
    if (res.code === 0 || res.code === 200) {
      ongoingRaces.value = res.data || []
    }
  } catch (error) {
    console.error('Fetch ongoing races error:', error)
  } finally {
    loading.ongoing = false
  }
}

async function fetchFinishedRaces() {
  loading.finished = true
  try {
    const res = await getUpcomingRaces({ status: 'finished' })
    if (res.code === 0 || res.code === 200) {
      finishedRaces.value = res.data || []
    }
  } catch (error) {
    console.error('Fetch finished races error:', error)
  } finally {
    loading.finished = false
  }
}

async function fetchMyRaces() {
  loading.my = true
  try {
    const res = await getUserResults()
    if (res.code === 0 || res.code === 200) {
      myRaceHistory.value = res.data || []
    }
  } catch (error) {
    console.error('Fetch my races error:', error)
  } finally {
    loading.my = false
  }
}

async function viewRaceDetail(race) {
  selectedRace.value = race
  detailDialogVisible.value = true
  loading.entries = true
  try {
    const detailRes = await getRaceDetail(race.id)
    const entriesRes = await getRaceEntries(race.id)
    if (detailRes.code === 0 || detailRes.code === 200) {
      selectedRace.value = { ...selectedRace.value, ...detailRes.data }
    }
    if (entriesRes.code === 0 || entriesRes.code === 200) {
      raceEntries.value = entriesRes.data || []
    }
  } catch (error) {
    console.error('Fetch race detail error:', error)
  } finally {
    loading.entries = false
  }
}

function openEnterRaceDialog(race) {
  if (userStore.user?.coins < (race.entry_fee || 0)) {
    ElMessage.error('金币不足，无法报名')
    return
  }
  raceToEnter.value = race
  availableCars.value = gameStore.cars.filter(c => c.level >= (race.min_level || 1))
  selectedCarId.value = gameStore.activeCar?.id || null
  enterDialogVisible.value = true
}

async function confirmEnterRace() {
  if (!selectedCarId.value || !raceToEnter.value) return
  try {
    const res = await enterRace({
      race_id: raceToEnter.value.id,
      car_id: selectedCarId.value
    })
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('报名成功')
      enterDialogVisible.value = false
      fetchUpcomingRaces()
      userStore.fetchCurrentUser()
    }
  } catch (error) {
    console.error('Enter race error:', error)
  }
}

async function viewRaceResults(race) {
  selectedRace.value = race
  resultsDialogVisible.value = true
  try {
    const res = await getRaceResults(race.id)
    if (res.code === 0 || res.code === 200) {
      raceResults.value = res.data || []
    }
  } catch (error) {
    console.error('Fetch race results error:', error)
  }
}

async function startSimulation() {
  if (!selectedRace.value) return
  simulating.value = true
  try {
    simulationDialogVisible.value = true
    countdown.value = 3
    countdownText.value = '准备开始'
    simulationCars.value = raceEntries.value.slice(0, 8).map((entry, index) => ({
      id: entry.id,
      name: entry.driver_name,
      position: 30,
      lap: 1,
      color: ['#ff6b00', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa', '#fbbf24', '#fb923c', '#34d399'][index]
    }))
    totalLaps.value = selectedRace.value.total_laps || 5

    for (let i = 3; i > 0; i--) {
      countdown.value = i
      await delay(1000)
    }
    countdownText.value = '比赛开始!'
    await delay(1000)
    countdownText.value = ''

    const interval = setInterval(() => {
      simulationCars.value = simulationCars.value.map(car => ({
        ...car,
        position: Math.min(470, car.position + Math.random() * 10 + 5)
      }))
      simulationCars.value.sort((a, b) => b.position - a.position)
      const finished = simulationCars.value.filter(c => c.position >= 470)
      if (finished.length > 0) {
        simulationCars.value = simulationCars.value.map(car => {
          if (car.position >= 470 && car.lap < totalLaps.value) {
            return { ...car, position: 30, lap: car.lap + 1 }
          }
          return car
        })
      }
      const allFinished = simulationCars.value.every(c => c.lap > totalLaps.value)
      if (allFinished) {
        clearInterval(interval)
        finishSimulation()
      }
    }, 100)
    simulationInterval.value = interval
  } catch (error) {
    console.error('Simulation error:', error)
    simulating.value = false
  }
}

async function finishSimulation() {
  countdownText.value = '比赛结束!'
  try {
    const res = await simulateRace(selectedRace.value.id)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('比赛完成!')
      setTimeout(() => {
        simulationDialogVisible.value = false
        simulating.value = false
        viewRaceResults(selectedRace.value)
      }, 2000)
    }
  } catch (error) {
    console.error('Simulate race error:', error)
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

onMounted(() => {
  gameStore.fetchCars()
  fetchUpcomingRaces()
})
</script>

<style scoped>
.races-page {
  padding: 24px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  margin-bottom: 24px;
}

.main-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

.races-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.race-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #2a2a4a;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease backwards;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.race-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255, 107, 0, 0.4);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.race-card.ongoing {
  border-color: rgba(74, 222, 128, 0.4);
}

.race-card.finished {
  opacity: 0.85;
}

.race-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.race-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 4px;
  font-size: 11px;
  color: #ef4444;
  font-weight: 600;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.race-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.track-tag {
  background: rgba(96, 165, 250, 0.2);
  border-color: rgba(96, 165, 250, 0.5);
  color: #60a5fa;
}

.race-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ff6b00;
  font-size: 13px;
  font-weight: 500;
}

.race-track {
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  overflow: hidden;
  position: relative;
}

.track-preview {
  width: 90%;
  height: auto;
}

.race-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #2a2a4a;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-icon {
  font-size: 18px;
}

.detail-content {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 11px;
  color: #888;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.entry-fee {
  color: #fbbf24;
}

.prize-pool {
  color: #ff6b00;
}

.race-actions {
  display: flex;
  gap: 10px;
}

.race-actions .el-button {
  flex: 1;
}

.race-progress {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #2a2a4a;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #888;
}

.race-results-preview {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 107, 0, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 107, 0, 0.2);
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.result-position {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
}

.result-name {
  flex: 1;
  font-weight: 600;
  color: #fff;
}

.result-time {
  color: #888;
  font-size: 13px;
  font-family: 'Courier New', monospace;
}

.my-races {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 20px;
}

.position-1 {
  color: #fbbf24;
  font-weight: 700;
}

.position-2 {
  color: #c0c0c0;
  font-weight: 600;
}

.position-3 {
  color: #cd7f32;
  font-weight: 600;
}

.coins-earned {
  color: #fbbf24;
  font-weight: 600;
}

.points-earned {
  color: #ff6b00;
  font-weight: 600;
}

.race-detail-content {
  color: #fff;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 16px 0;
  padding-left: 12px;
  border-left: 3px solid #ff6b00;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-section {
  margin-bottom: 24px;
}

.track-visualization {
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px 0;
  overflow: hidden;
}

.track-large {
  width: 100%;
  height: auto;
  max-height: 300px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-desc :deep(.el-descriptions__label) {
  color: #888;
  background: rgba(255, 255, 255, 0.02);
}

.info-desc :deep(.el-descriptions__content) {
  color: #fff;
}

.info-desc :deep(.el-descriptions__cell) {
  border-color: #2a2a4a;
}

.weather-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 20px;
}

.weather-icon {
  font-size: 24px;
}

.weather-info {
  text-align: center;
}

.weather-main {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.weather-desc {
  color: #888;
  font-size: 14px;
  margin-bottom: 12px;
}

.weather-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.weather-effect {
  padding: 4px 10px;
  background: rgba(255, 107, 0, 0.1);
  border: 1px solid rgba(255, 107, 0, 0.3);
  border-radius: 6px;
  font-size: 12px;
  color: #ff6b00;
}

.prize-distribution {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prize-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.prize-rank {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  z-index: 1;
}

.prize-coins {
  font-weight: 700;
  color: #fbbf24;
  font-size: 16px;
  z-index: 1;
}

.prize-points {
  color: #ff6b00;
  font-weight: 600;
  z-index: 1;
}

.prize-bar {
  flex: 1;
  height: 4px;
  background: #2a2a4a;
  border-radius: 2px;
  overflow: hidden;
  z-index: 1;
}

.prize-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b00 0%, #ff8c00 100%);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.entries-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.entry-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.entry-item:hover {
  border-color: rgba(255, 107, 0, 0.3);
  background: rgba(255, 107, 0, 0.05);
}

.entry-rank {
  width: 28px;
  text-align: center;
  color: #888;
  font-weight: 600;
  font-size: 14px;
}

.entry-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.entry-name {
  font-weight: 600;
  color: #fff;
  font-size: 14px;
}

.entry-car {
  font-size: 12px;
  color: #888;
}

.entry-level {
  color: #ff6b00;
  font-size: 13px;
  font-weight: 600;
}

.simulation-section {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #2a2a4a;
}

.simulate-btn {
  min-width: 200px;
}

.enter-race-content {
  color: #fff;
}

.enter-info {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #2a2a4a;
}

.enter-info h4 {
  font-size: 20px;
  color: #fff;
  margin: 0 0 8px 0;
}

.enter-fee {
  color: #888;
  margin: 0;
}

.enter-fee strong {
  color: #fbbf24;
  font-size: 18px;
}

.selected-car-preview {
  margin-top: 16px;
  padding: 16px;
  background: rgba(255, 107, 0, 0.05);
  border: 1px solid rgba(255, 107, 0, 0.2);
  border-radius: 12px;
}

.car-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.car-tier {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.results-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #2a2a4a;
}

.results-header h3 {
  font-size: 22px;
  color: #fff;
  margin: 0 0 8px 0;
}

.results-header p {
  color: #888;
  margin: 0;
}

.reward-coins {
  color: #fbbf24;
  font-weight: 600;
}

.reward-points {
  color: #ff6b00;
  font-weight: 600;
}

.result-driver {
  display: flex;
  align-items: center;
  gap: 10px;
}

.simulation-content {
  text-align: center;
  padding: 20px;
}

.countdown-display {
  margin-bottom: 24px;
}

.countdown-number {
  font-size: 80px;
  font-weight: 800;
  color: #ff6b00;
  line-height: 1;
  animation: countdownPulse 1s ease-in-out infinite;
}

@keyframes countdownPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.countdown-text {
  font-size: 24px;
  color: #fff;
  margin-top: 8px;
  font-weight: 600;
}

.simulation-track {
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px 0;
  overflow-x: hidden;
}

.sim-car {
  transition: transform 0.1s linear;
}

.simulation-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sim-status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 8px;
}

.sim-position {
  width: 30px;
  font-weight: 700;
}

.sim-name {
  flex: 1;
  color: #fff;
  font-weight: 500;
}

.sim-lap {
  color: #888;
  font-size: 13px;
}

@media (max-width: 768px) {
  .races-list {
    grid-template-columns: 1fr;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .entries-list {
    grid-template-columns: 1fr;
  }
  .race-details {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
