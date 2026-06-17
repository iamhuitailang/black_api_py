<template>
  <div>
    <div v-if="record" class="card">
      <div class="card-title">
        <div>
          <span style="font-size:16px;">员工自评</span>
          <span style="margin-left:12px; color:var(--text-secondary); font-size:13px;">
            {{ record.cycle?.name || '考核周期' }} · {{ record.employee?.name || '' }} · {{ record.employee?.department || '' }}
          </span>
        </div>
        <span class="tag tag-status tag-status-{{record.status}}">{{ statusText[record.status] }}</span>
      </div>

      <div v-for="s in scores" :key="s.id" class="dimension-item">
        <div class="dimension-header">
          <span class="dimension-name">{{ s.dimension_name }}</span>
          <span class="dimension-weight">权重 {{ s.weight }}%</span>
        </div>
        <div v-if="s.dimension_description" class="dimension-desc">{{ s.dimension_description }}</div>

        <div class="score-row">
          <span class="score-label">我的评分</span>
          <div class="slider-wrap">
            <input type="range" min="1" max="10" step="1" class="score-slider"
              v-model.number="s.self_score" :disabled="record.status === 'completed'">
            <span class="score-value self">{{ s.self_score || 0 }}</span>
          </div>
        </div>

        <div class="form-row" style="margin-bottom:0;">
          <label class="form-label">本维度工作完成情况说明</label>
          <textarea class="form-textarea" v-model="s.self_comment"
            placeholder="请详细描述本维度下的工作完成情况、亮点与不足..."
            :disabled="record.status === 'completed'"></textarea>
        </div>

        <div v-if="s.supervisor_score" style="margin-top:16px; padding-top:16px; border-top:1px dashed var(--border-light);">
          <div class="score-row">
            <span class="score-label">上级评分</span>
            <div class="slider-wrap">
              <input type="range" min="1" max="10" step="1" class="score-slider" :value="s.supervisor_score" disabled>
              <span class="score-value supervisor">{{ s.supervisor_score || 0 }}</span>
            </div>
          </div>
          <div v-if="s.supervisor_comment" class="comment-box supervisor"><strong>上级评语：</strong>{{ s.supervisor_comment }}</div>
        </div>
      </div>

      <div class="form-row">
        <label class="form-label">季度总体自评总结</label>
        <textarea class="form-textarea" v-model="selfReviewComment"
          placeholder="请总结本季度的整体工作表现，包括主要成就、遇到的挑战以及未来改进方向..."
          :disabled="record.status === 'completed'" style="min-height:120px;"></textarea>
      </div>

      <div class="score-summary">
        <div class="summary-item">
          <div class="summary-label">自评加权得分</div>
          <div class="summary-value">{{ selfWeightedScore }}</div>
        </div>
        <div v-if="record.supervisor_total_score" class="summary-item">
          <div class="summary-label">上级加权得分</div>
          <div class="summary-value">{{ record.supervisor_total_score }}</div>
        </div>
        <div v-if="record.final_score" class="summary-item">
          <div class="summary-label">最终得分（自评40%+上级60%）</div>
          <div class="summary-value final">{{ record.final_score }}</div>
        </div>
        <div v-if="record.grade" class="summary-item">
          <div class="summary-label">绩效等级</div>
          <div class="summary-grade" :style="{color: gradeColor[record.grade]}">{{ record.grade }}</div>
        </div>
      </div>

      <div v-if="record.supervisor_comment" style="margin-top:20px;">
        <label class="form-label">上级总体评语</label>
        <div class="comment-box supervisor">{{ record.supervisor_comment }}</div>
      </div>

      <div class="mt-20" style="text-align:right;">
        <button class="btn" @click="$router.back()">返回</button>
        <button v-if="record.status !== 'completed'" class="btn btn-primary" @click="submit">提交自评</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineProps } from 'vue'
import { useRoute } from 'vue-router'
import api from '../utils/api'

const route = useRoute()
defineProps({ user: Object })

const record = ref(null)
const scores = ref([])
const selfReviewComment = ref('')
const statusText = { draft: '草稿', active: '进行中', pending: '待自评', self_reviewed: '待上级评', completed: '已完成' }
const gradeColor = { S: '#d4a017', A: '#26a269', B: '#1c71d8', C: '#e66100', D: '#c01c28' }

const selfWeightedScore = computed(() => {
  let total = 0, totalW = 0
  for (const s of scores.value) {
    total += (s.self_score || 0) * (s.weight || 0)
    totalW += (s.weight || 0)
  }
  return totalW ? (total / totalW).toFixed(2) : '0.00'
})

onMounted(async () => {
  try {
    const res = await api.getRecord(route.params.recordId)
    const d = res.data
    record.value = d
    scores.value = (d.scores || []).map(s => ({
      id: s.id,
      dimension_id: s.dimension_id,
      dimension_name: s.dimension_name,
      dimension_description: s.dimension_description,
      weight: s.weight,
      self_score: s.self_score || 5,
      self_comment: s.self_comment || '',
      supervisor_score: s.supervisor_score,
      supervisor_comment: s.supervisor_comment
    }))
    selfReviewComment.value = d.self_review_comment || ''
  } catch (e) { console.error(e) }
})

const submit = async () => {
  for (const s of scores.value) {
    if (!s.self_score) { alert('请完成所有维度评分'); return }
  }
  try {
    await api.submitSelfReview(route.params.recordId, {
      self_review_comment: selfReviewComment.value,
      scores: scores.value.map(s => ({
        id: s.id,
        self_score: s.self_score,
        self_comment: s.self_comment
      }))
    })
    alert('自评提交成功！')
    const res = await api.getRecord(route.params.recordId)
    record.value = res.data
  } catch (e) { alert('提交失败') }
}
</script>
