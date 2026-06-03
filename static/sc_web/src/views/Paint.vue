<template>
  <div class="paint-container">
    <div class="page-header">
      <h1 class="page-title">涂装车间</h1>
      <p class="page-subtitle">为你的赛车定制独特的涂装</p>
    </div>

    <div v-loading="loading" class="paint-layout">
      <div class="main-content">
        <el-card class="preview-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><View /></el-icon>
              <span>实时预览</span>
            </h3>
            <div class="preview-actions">
              <el-button size="small" @click="rotateView">
                <el-icon><RefreshRight /></el-icon>
                切换视角
              </el-button>
            </div>
          </div>

          <div class="car-preview-section">
            <svg class="car-preview-svg" viewBox="0 0 500 250">
              <defs>
                <linearGradient :id="'bodyGrad_' + viewAngle" x1="0%" y1="0%" :x2="viewAngle === 'side' ? '0%' : '100%'" :y2="viewAngle === 'side' ? '100%' : '0%'">
                  <stop offset="0%" :style="{ stopColor: primaryColor }" />
                  <stop offset="50%" :style="{ stopColor: adjustColor(primaryColor, -20) }" />
                  <stop offset="100%" :style="{ stopColor: adjustColor(primaryColor, -40) }" />
                </linearGradient>

                <filter :id="'paintFilter_' + paintType">
                  <feGaussianBlur v-if="paintType === 'metallic'" stdDeviation="0.5" />
                  <feColorMatrix
                    v-if="paintType === 'matte'"
                    type="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0"
                  />
                  <feTurbulence
                    v-if="paintType === 'pearl'"
                    type="fractalNoise"
                    baseFrequency="0.05"
                    numOctaves="2"
                    result="noise"
                  />
                  <feComposite
                    v-if="paintType === 'pearl'"
                    in="SourceGraphic"
                    in2="noise"
                    operator="arithmetic"
                    k1="0"
                    k2="1"
                    k3="1"
                    k4="0"
                  />
                </filter>

                <pattern id="checkerPattern" patternUnits="userSpaceOnUse" width="20" height="20">
                  <rect width="10" height="10" fill="#ffffff" />
                  <rect x="10" y="10" width="10" height="10" fill="#ffffff" />
                </pattern>
              </defs>

              <g :transform="viewAngle === 'front' ? 'scale(0.8, 1) translate(50, 0)' : ''">
                <path
                  :d="getCarBodyPath(viewAngle)"
                  :fill="`url(#bodyGrad_${viewAngle})`"
                  :filter="`url(#paintFilter_${paintType})`"
                  stroke="#333"
                  stroke-width="2"
                  class="car-body"
                />

                <g v-if="patternType === 'stripes'">
                  <path
                    :d="getStripePath(viewAngle, 1)"
                    fill="patternColor"
                    opacity="0.9"
                  />
                  <path
                    :d="getStripePath(viewAngle, 2)"
                    fill="patternColor"
                    opacity="0.9"
                  />
                </g>

                <g v-if="patternType === 'two-tone'">
                  <path
                    :d="getTwoTonePath(viewAngle)"
                    fill="patternColor"
                    opacity="0.85"
                  />
                </g>

                <g v-if="patternType === 'checkered'">
                  <path
                    :d="getCheckeredPath(viewAngle)"
                    fill="url(#checkerPattern)"
                    opacity="0.7"
                  />
                </g>

                <g v-if="patternType === 'flames'">
                  <path
                    :d="getFlamesPath(viewAngle)"
                    fill="patternColor"
                    opacity="0.9"
                  />
                </g>

                <path
                  :d="getWindowPath(viewAngle)"
                  fill="rgba(20, 20, 40, 0.8)"
                  stroke="#444"
                  stroke-width="1"
                />

                <g v-if="viewAngle === 'side'">
                  <circle cx="140" cy="195" r="35" fill="#1a1a2e" stroke="#333" stroke-width="3" />
                  <circle cx="140" cy="195" r="20" fill="#333" />
                  <circle cx="140" cy="195" r="8" fill="#555" />
                  <circle cx="360" cy="195" r="35" fill="#1a1a2e" stroke="#333" stroke-width="3" />
                  <circle cx="360" cy="195" r="20" fill="#333" />
                  <circle cx="360" cy="195" r="8" fill="#555" />

                  <ellipse cx="80" cy="145" rx="18" ry="12" fill="#ffcc00" opacity="0.8" />
                  <ellipse cx="80" cy="145" rx="12" ry="8" fill="#fff" opacity="0.6" />
                  <rect x="430" y="125" width="20" height="40" rx="5" fill="#ff3333" opacity="0.8" />
                </g>

                <g v-else>
                  <ellipse cx="180" cy="200" rx="30" ry="25" fill="#1a1a2e" stroke="#333" stroke-width="3" />
                  <ellipse cx="180" cy="200" rx="18" ry="12" fill="#333" />
                  <ellipse cx="320" cy="200" rx="30" ry="25" fill="#1a1a2e" stroke="#333" stroke-width="3" />
                  <ellipse cx="320" cy="200" rx="18" ry="12" fill="#333" />

                  <ellipse cx="150" cy="120" rx="25" ry="18" fill="#ffcc00" opacity="0.8" />
                  <ellipse cx="350" cy="120" rx="25" ry="18" fill="#ffcc00" opacity="0.8" />
                </g>
              </g>
            </svg>

            <div class="view-indicator">
              <span :class="{ active: viewAngle === 'side' }">侧面</span>
              <el-switch v-model="viewAngle" active-value="front" inactive-value="side" />
              <span :class="{ active: viewAngle === 'front' }">正面</span>
            </div>
          </div>
        </el-card>

        <el-card class="editor-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Brush /></el-icon>
              <span>涂装编辑器</span>
            </h3>
          </div>

          <div class="editor-tabs">
            <el-tabs v-model="editorTab">
              <el-tab-pane label="车漆" name="paint">
                <div class="paint-options">
                  <div class="option-section">
                    <label class="section-label">车漆类型</label>
                    <div class="paint-type-grid">
                      <div
                        v-for="type in paintTypes"
                        :key="type.value"
                        class="paint-type-item"
                        :class="{ active: paintType === type.value }"
                        @click="paintType = type.value"
                      >
                        <div class="paint-swatch" :class="type.value"></div>
                        <span class="paint-type-name">{{ type.label }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="option-section">
                    <label class="section-label">主色调</label>
                    <div class="color-picker-row">
                      <div class="color-preview" :style="{ backgroundColor: primaryColor }"></div>
                      <el-color-picker
                        v-model="primaryColor"
                        show-alpha
                        size="large"
                        class="color-picker"
                      />
                      <div class="quick-colors">
                        <div
                          v-for="color in quickColors"
                          :key="color"
                          class="quick-color"
                          :style="{ backgroundColor: color }"
                          @click="primaryColor = color"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="图案" name="pattern">
                <div class="pattern-options">
                  <div class="option-section">
                    <label class="section-label">图案样式</label>
                    <div class="pattern-type-grid">
                      <div
                        v-for="pattern in patternTypes"
                        :key="pattern.value"
                        class="pattern-type-item"
                        :class="{ active: patternType === pattern.value }"
                        @click="patternType = pattern.value"
                      >
                        <div class="pattern-preview">
                          <svg viewBox="0 0 60 40">
                            <rect width="60" height="40" fill="#333" rx="4" />
                            <path :d="pattern.preview" fill="#ff6b00" opacity="0.8" />
                          </svg>
                        </div>
                        <span class="pattern-type-name">{{ pattern.label }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="patternType !== 'none'" class="option-section">
                    <label class="section-label">图案颜色</label>
                    <div class="color-picker-row">
                      <div class="color-preview" :style="{ backgroundColor: patternColor }"></div>
                      <el-color-picker
                        v-model="patternColor"
                        show-alpha
                        size="large"
                        class="color-picker"
                      />
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="预设" name="presets">
                <div class="presets-grid">
                  <div
                    v-for="(preset, index) in presetSchemes"
                    :key="index"
                    class="preset-item"
                    @click="applyPreset(preset)"
                  >
                    <div class="preset-preview">
                      <svg viewBox="0 0 100 60">
                        <defs>
                          <linearGradient :id="'presetGrad_' + index" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" :style="{ stopColor: preset.primary }" />
                            <stop offset="100%" :style="{ stopColor: adjustColor(preset.primary, -30) }" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M10 45 Q15 25 35 20 L65 20 Q85 25 90 45 L90 55 L10 55 Z"
                          :fill="`url(#presetGrad_${index})`"
                          stroke="#222"
                          stroke-width="1"
                        />
                        <path
                          v-if="preset.pattern !== 'none'"
                          :d="getPresetPatternPath(preset.pattern)"
                          :fill="preset.patternColor"
                          opacity="0.8"
                        />
                        <circle cx="30" cy="55" r="8" fill="#1a1a2e" />
                        <circle cx="70" cy="55" r="8" fill="#1a1a2e" />
                      </svg>
                    </div>
                    <span class="preset-name">{{ preset.name }}</span>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>

          <div class="save-section">
            <el-input
              v-model="paintName"
              placeholder="给你的涂装起个名字"
              class="name-input"
              maxlength="20"
              show-word-limit
            />
            <div class="save-options">
              <el-switch v-model="isPublic" active-text="公开到市场" />
            </div>
            <el-button
              type="primary"
              size="large"
              class="save-btn"
              :disabled="!paintName.trim()"
              @click="savePaint"
            >
              <el-icon><Check /></el-icon>
              保存涂装
            </el-button>
          </div>
        </el-card>
      </div>

      <div class="side-panel">
        <el-card class="marketplace-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Shop /></el-icon>
              <span>涂装市场</span>
            </h3>
          </div>

          <el-tabs v-model="marketTab" class="market-tabs">
            <el-tab-pane label="我的涂装" name="my">
              <div v-if="myPaints.length === 0" class="empty-list">
                <el-icon :size="32" class="empty-icon"><Brush /></el-icon>
                <p>还没有保存的涂装</p>
              </div>
              <div v-else class="paint-list">
                <div
                  v-for="(paint, index) in myPaints"
                  :key="index"
                  class="paint-list-item"
                >
                  <div class="paint-thumb">
                    <svg viewBox="0 0 60 40">
                      <path
                        d="M5 30 Q8 18 20 15 L40 15 Q52 18 55 30 L55 38 L5 38 Z"
                        :fill="paint.primary_color"
                        stroke="#222"
                        stroke-width="1"
                      />
                      <circle cx="18" cy="38" r="5" fill="#1a1a2e" />
                      <circle cx="42" cy="38" r="5" fill="#1a1a2e" />
                    </svg>
                  </div>
                  <div class="paint-info">
                    <div class="paint-name">{{ paint.name }}</div>
                    <div class="paint-meta">
                      <span v-if="paint.is_public" class="public-badge">公开</span>
                    </div>
                  </div>
                  <div class="paint-actions">
                    <el-button type="primary" size="small" @click="applyPaint(paint)">
                      应用
                    </el-button>
                    <el-button type="danger" size="small" text @click="deletePaint(paint)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="市场" name="public">
              <div v-if="publicPaints.length === 0" class="empty-list">
                <el-icon :size="32" class="empty-icon"><Shop /></el-icon>
                <p>暂无公开涂装</p>
              </div>
              <div v-else class="paint-list">
                <div
                  v-for="(paint, index) in publicPaints"
                  :key="index"
                  class="paint-list-item"
                >
                  <div class="paint-thumb">
                    <svg viewBox="0 0 60 40">
                      <path
                        d="M5 30 Q8 18 20 15 L40 15 Q52 18 55 30 L55 38 L5 38 Z"
                        :fill="paint.primary_color"
                        stroke="#222"
                        stroke-width="1"
                      />
                      <circle cx="18" cy="38" r="5" fill="#1a1a2e" />
                      <circle cx="42" cy="38" r="5" fill="#1a1a2e" />
                    </svg>
                  </div>
                  <div class="paint-info">
                    <div class="paint-name">{{ paint.name }}</div>
                    <div class="paint-author">by {{ paint.author || '匿名玩家' }}</div>
                  </div>
                  <div class="paint-price">
                    <span class="price">
                      <el-icon><Coin /></el-icon>
                      {{ paint.price || 100 }}
                    </span>
                    <el-button type="primary" size="small" @click="buyPaint(paint)">
                      购买
                    </el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  View, RefreshRight, Brush, Check, Shop, Coin, Delete
} from '@element-plus/icons-vue'
import { createPaint, getUserPaints, getPublicPaints, deletePaint as deletePaintApi, buyPaint as buyPaintApi } from '@/api/paint'

const loading = ref(false)
const viewAngle = ref('side')
const editorTab = ref('paint')
const marketTab = ref('my')

const paintType = ref('solid')
const primaryColor = ref('#ff6b00')
const patternType = ref('none')
const patternColor = ref('#ffffff')
const paintName = ref('')
const isPublic = ref(false)

const myPaints = ref([])
const publicPaints = ref([])

const paintTypes = [
  { value: 'solid', label: '纯色' },
  { value: 'metallic', label: '金属' },
  { value: 'matte', label: '哑光' },
  { value: 'pearl', label: '珠光' }
]

const patternTypes = [
  { value: 'none', label: '无图案', preview: '' },
  { value: 'stripes', label: '赛车条纹', preview: 'M20 5 L25 35 L35 35 L30 5 Z M40 5 L45 35 L55 35 L50 5 Z' },
  { value: 'two-tone', label: '双色', preview: 'M0 0 L60 0 L60 20 L0 20 Z' },
  { value: 'checkered', label: '方格', preview: 'M0 0 L20 0 L20 20 L0 20 Z M40 20 L60 20 L60 40 L40 40 Z' },
  { value: 'flames', label: '火焰', preview: 'M0 40 Q10 20 20 30 Q30 10 40 25 Q50 15 60 30 L60 40 Z' }
]

const quickColors = [
  '#ff6b00', '#ef4444', '#dc2626', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#f43f5e', '#1f2937', '#ffffff'
]

const presetSchemes = [
  { name: '烈焰橙', primary: '#ff6b00', pattern: 'stripes', patternColor: '#000000' },
  { name: '竞速红', primary: '#dc2626', pattern: 'two-tone', patternColor: '#000000' },
  { name: '深海蓝', primary: '#1e40af', pattern: 'none', patternColor: '#ffffff' },
  { name: '暗夜黑', primary: '#1f2937', pattern: 'stripes', patternColor: '#ff6b00' },
  { name: '翠绿', primary: '#059669', pattern: 'none', patternColor: '#ffffff' },
  { name: '皇家紫', primary: '#7c3aed', pattern: 'flames', patternColor: '#fbbf24' },
  { name: '纯白银', primary: '#e5e7eb', pattern: 'checkered', patternColor: '#1f2937' },
  { name: '日落黄', primary: '#f59e0b', pattern: 'two-tone', patternColor: '#dc2626' }
]

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      loadMyPaints(),
      loadPublicPaints()
    ])
  } catch (error) {
    console.error('Load paint data error:', error)
  } finally {
    loading.value = false
  }
})

async function loadMyPaints() {
  try {
    const res = await getUserPaints()
    if (res.code === 0 || res.code === 200) {
      myPaints.value = res.data || []
    }
  } catch (error) {
    console.error('Load my paints error:', error)
  }
}

async function loadPublicPaints() {
  try {
    const res = await getPublicPaints({ page: 1, page_size: 10 })
    if (res.code === 0 || res.code === 200) {
      publicPaints.value = res.data?.list || res.data || []
    }
  } catch (error) {
    console.error('Load public paints error:', error)
  }
}

function adjustColor(color, amount) {
  const hex = color.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function getCarBodyPath(angle) {
  if (angle === 'front') {
    return 'M100 180 Q120 80 250 60 L250 50 Q200 40 250 30 L350 30 Q400 40 350 50 L350 60 Q480 80 500 180 L500 220 L100 220 Z'
  }
  return 'M60 180 Q80 100 180 80 L320 80 Q420 100 440 180 L470 180 L470 210 L440 210 L430 225 L390 225 L380 210 L160 210 L150 225 L110 225 L100 210 L60 210 Z'
}

function getWindowPath(angle) {
  if (angle === 'front') {
    return 'M180 80 L170 120 L330 120 L320 80 Q250 60 180 80 Z'
  }
  return 'M200 85 L190 120 L310 120 L300 85 Q250 70 200 85 Z'
}

function getStripePath(angle, stripeNum) {
  const offset = stripeNum === 1 ? -25 : 25
  if (angle === 'front') {
    return `M${250 + offset} 60 L${230 + offset} 180 L${270 + offset} 180 L${250 + offset} 60 Z`
  }
  return `M${250 + offset} 80 L${240 + offset} 180 L${260 + offset} 180 L${250 + offset} 80 Z`
}

function getTwoTonePath(angle) {
  if (angle === 'front') {
    return 'M100 180 Q120 130 250 120 L350 120 Q480 130 500 180 L500 220 L100 220 Z'
  }
  return 'M60 180 Q80 140 180 130 L320 130 Q420 140 440 180 L470 180 L470 210 L60 210 Z'
}

function getCheckeredPath(angle) {
  if (angle === 'front') {
    return 'M150 80 Q180 70 250 65 L350 65 Q420 70 450 80 L450 150 L150 150 Z'
  }
  return 'M120 90 Q160 80 250 75 L350 75 Q440 80 480 90 L480 160 L120 160 Z'
}

function getFlamesPath(angle) {
  if (angle === 'front') {
    return 'M120 180 Q150 140 180 160 Q200 120 230 150 Q250 110 280 145 Q300 105 330 150 Q350 120 380 160 L380 180 Z'
  }
  return 'M60 180 Q100 150 130 170 Q160 130 200 160 Q240 120 280 155 Q320 115 360 160 Q400 130 440 180 L440 180 Z'
}

function getPresetPatternPath(pattern) {
  switch (pattern) {
    case 'stripes':
      return 'M40 20 L38 55 L45 55 L47 20 Z M52 20 L50 55 L57 55 L59 20 Z'
    case 'two-tone':
      return 'M0 30 L100 30 L100 55 L0 55 Z'
    case 'flames':
      return 'M10 55 Q25 35 35 45 Q45 25 55 40 Q65 20 75 35 Q85 25 90 45 L90 55 Z'
    case 'checkered':
      return 'M20 15 L40 15 L40 35 L20 35 Z M60 35 L80 35 L80 55 L60 55 Z'
    default:
      return ''
  }
}

function rotateView() {
  viewAngle.value = viewAngle.value === 'side' ? 'front' : 'side'
}

function applyPreset(preset) {
  primaryColor.value = preset.primary
  patternType.value = preset.pattern
  patternColor.value = preset.patternColor
  ElMessage.success(`已应用预设：${preset.name}`)
}

async function savePaint() {
  if (!paintName.value.trim()) {
    ElMessage.warning('请输入涂装名称')
    return
  }

  loading.value = true
  try {
    const res = await createPaint({
      name: paintName.value.trim(),
      primary_color: primaryColor.value,
      pattern_type: patternType.value,
      pattern_color: patternColor.value,
      paint_type: paintType.value,
      is_public: isPublic.value
    })

    if (res.code === 0 || res.code === 200) {
      ElMessage.success('涂装保存成功')
      paintName.value = ''
      isPublic.value = false
      await loadMyPaints()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}

function applyPaint(paint) {
  primaryColor.value = paint.primary_color || '#ff6b00'
  patternType.value = paint.pattern_type || 'none'
  patternColor.value = paint.pattern_color || '#ffffff'
  paintType.value = paint.paint_type || 'solid'
  ElMessage.success('已应用涂装')
}

async function deletePaint(paint) {
  try {
    await ElMessageBox.confirm(
      `确定要删除涂装"${paint.name}"吗？`,
      '删除涂装',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  loading.value = true
  try {
    const res = await deletePaintApi(paint.id)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('删除成功')
      await loadMyPaints()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error) {
    ElMessage.error('删除失败')
  } finally {
    loading.value = false
  }
}

async function buyPaint(paint) {
  try {
    await ElMessageBox.confirm(
      `确定要花费 ${paint.price || 100} 金币购买"${paint.name}"吗？`,
      '购买涂装',
      {
        confirmButtonText: '确定购买',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
  } catch {
    return
  }

  loading.value = true
  try {
    const res = await buyPaintApi(paint.id)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('购买成功')
      await loadMyPaints()
    } else {
      ElMessage.error(res.msg || '购买失败')
    }
  } catch (error) {
    ElMessage.error('购买失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.paint-container {
  padding: 24px;
  min-height: calc(100vh - 60px);
  background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  margin-bottom: 32px;
  animation: fadeInDown 0.6s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.paint-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  align-items: start;
}

.main-content,
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.preview-card,
.editor-card,
.marketplace-card {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%) !important;
  border: 1px solid #2a2a4a !important;
  border-radius: 16px !important;
  animation: fadeInUp 0.6s ease-out backwards;
}

.preview-card {
  animation-delay: 0.1s;
}

.editor-card {
  animation-delay: 0.2s;
}

.marketplace-card {
  animation-delay: 0.3s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.card-title .el-icon {
  color: #ff6b00;
}

.car-preview-section {
  padding: 20px;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
  border-radius: 12px;
  border: 1px solid #2a2a4a;
}

.car-preview-svg {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 12px 32px rgba(0, 0, 0, 0.5));
}

.car-body {
  transition: all 0.3s ease;
}

.view-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.view-indicator span {
  font-size: 13px;
  color: #666;
  transition: color 0.3s ease;
}

.view-indicator span.active {
  color: #ff6b00;
  font-weight: 600;
}

.section-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 12px;
}

.option-section {
  margin-bottom: 24px;
}

.paint-type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.paint-type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.paint-type-item:hover {
  border-color: rgba(255, 107, 0, 0.3);
  transform: translateY(-2px);
}

.paint-type-item.active {
  border-color: #ff6b00;
  background: rgba(255, 107, 0, 0.1);
}

.paint-swatch {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b00 0%, #cc5500 100%);
  border: 2px solid #333;
}

.paint-swatch.metallic {
  background: linear-gradient(135deg, #c0c0c0 0%, #808080 50%, #c0c0c0 100%);
}

.paint-swatch.matte {
  background: linear-gradient(135deg, #666 0%, #444 100%);
  filter: saturate(0.8);
}

.paint-swatch.pearl {
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 30%, #c084fc 70%, #ff6b00 100%);
}

.paint-type-name {
  font-size: 12px;
  color: #fff;
  font-weight: 500;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.color-preview {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  border: 2px solid #3a3a5e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.quick-colors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.quick-color {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #3a3a5e;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-color:hover {
  transform: scale(1.2);
  border-color: #ff6b00;
}

.pattern-type-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.pattern-type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pattern-type-item:hover {
  border-color: rgba(255, 107, 0, 0.3);
  transform: translateY(-2px);
}

.pattern-type-item.active {
  border-color: #ff6b00;
  background: rgba(255, 107, 0, 0.1);
}

.pattern-preview {
  width: 60px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
}

.pattern-preview svg {
  width: 100%;
  height: 100%;
}

.pattern-type-name {
  font-size: 11px;
  color: #fff;
  font-weight: 500;
  text-align: center;
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.preset-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.preset-item:hover {
  border-color: rgba(255, 107, 0, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 107, 0, 0.15);
}

.preset-preview {
  aspect-ratio: 16/10;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
}

.preset-preview svg {
  width: 100%;
  height: 100%;
}

.preset-name {
  display: block;
  text-align: center;
  font-size: 12px;
  color: #fff;
  font-weight: 500;
}

.save-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #2a2a4a;
}

.name-input {
  margin-bottom: 16px;
}

.save-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.save-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 0, 0.4);
}

.empty-list {
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

.empty-icon {
  color: #444;
  margin-bottom: 12px;
}

.paint-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.paint-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.paint-list-item:hover {
  background: rgba(255, 107, 0, 0.05);
  border-color: rgba(255, 107, 0, 0.3);
}

.paint-thumb {
  width: 60px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  background: #0a0a0f;
  flex-shrink: 0;
}

.paint-thumb svg {
  width: 100%;
  height: 100%;
}

.paint-info {
  flex: 1;
  min-width: 0;
}

.paint-name {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 2px;
}

.paint-author {
  font-size: 11px;
  color: #666;
}

.paint-meta {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.public-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border-radius: 4px;
}

.paint-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.paint-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.price {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 700;
  color: #fbbf24;
}

.market-tabs {
  margin-top: -16px;
}

:deep(.el-tabs__item) {
  font-size: 13px;
}

:deep(.el-tabs__active-bar) {
  background-color: #ff6b00;
}

:deep(.el-tabs__item.is-active) {
  color: #ff6b00;
}

:deep(.el-switch__label) {
  color: #fff;
}

:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #ff6b00 !important;
  border-color: #ff6b00 !important;
}

@media (max-width: 1200px) {
  .paint-layout {
    grid-template-columns: 1fr;
  }

  .paint-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .pattern-type-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .presets-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .paint-container {
    padding: 16px;
  }

  .color-picker-row {
    flex-wrap: wrap;
  }

  .paint-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .pattern-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .presets-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .paint-list-item {
    flex-wrap: wrap;
  }

  .paint-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
