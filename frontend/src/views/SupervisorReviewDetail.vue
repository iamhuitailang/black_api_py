<template>
  <div>
    <div v-if="record" class="card">
      <div class="card-title">
        <div>
          <span style="font-size:16px;">上级评分</span>
          <span style="margin-left:12px; color:var(--text-secondary); font-size:13px;">
            {{ record.cycle?.name || '考核周期' }} · {{ record.employee?.name || '' }} · {{ record.employee?.department || '' }} · {{ record.employee?.position || '' }}
          </span>
        </div>
        <span class="tag tag-status tag-status-{{record.status}}">{{ statusText[record.status] }}</span>
      </div>

      <div class="form-row" style="background:#fffbe6; padding:14px; border-radius:6px; border:1px solid #ffe58f;">
        <label class="form-label" style="color:#ad6800;">员工自评总结</label>
        <div style="line-height:1.8; color:#333;">{{ record.self_review_comment || '（员工未填写总结）' }}</div>
      </div>

      <div v-for="s in scores" :key="s.id" class="dimension-item">
        <div class="dimension-header">
          <span class="dimension-name">{{ s.dimension_name }}</span>
          <span class="dimension-weight">权重 {{ s.weight }}%</span>
        </div>
        <div v-if="s.dimension_description" class="dimension-desc">{{ s.dimension_description }}</div>

        <div class="score-row">
          <span class="score-label">员工自评</span>
          <div class="slider-wrap">
            <input type="range" min="1" max="10" step="1" class="score-slider" :value="s.self_score || 0" disabled>
            <span class="score-value self">{{ s.self_score || 0 }}</span>
          </div>
        </div>
        <div v-if="s.self_comment" class="comment-box"><strong>员工说明：</strong>{{ s.self_comment }}</div>

        <div style="margin-top:16px;">
          <div class="score-row">
            <span class="score-label">上级评分</span>
            <div class="slider-wrap">
              <input type="range" min="1" max="10" step="1" class="score-slider"
                v-model.number="s.supervisor_score" :disabled="record.status === 'completed'">
              <span class="score-value supervisor">{{ s.supervisor_score || 0 }}</span>
            </div>
          </div>
          <div class="form-row" style="margin-top:12px; margin-bottom:0;">
            <label class="form-label">本维度评语</label>
            <textarea class="form-textarea" v-model="s.supervisor_comment"
              placeholder="请给出本维度的评分依据和改进建议..."
              :disabled="record.status === 'completed'"></textarea>
          </div>
        </div>
      </div>

      <div class="form-row">
        <label class="form-label">上级总体评语</label>
        <textarea class="form-textarea" v-model="supervisorComment"
          placeholder="请综合评价员工本季度的整体表现，肯定成绩、指出不足并明确下季度努力方向..."
          :disabled="record.status === 'completed'" style="min-height:120px;"></textarea>
      </div>

      <div class="score-summary">
        <div class="summary-item">
          <div class="summary-label">自评加权得分</div>
          <div class="summary-value">{{ record.self_total_score || '0.00' }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">上级加权得分</div>
          <div class="summary-value">{{ supervisorWeightedScore }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">最终得分（自评40%+上级60%）</div>
          <div class="summary-value final" :style="{color: previewScore>=8 ? 'var(--grade-a)' : previewScore>=6 ? 'var(--grade-b)' : 'var(--grade-c)'}">
            {{ previewScore }}
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-label">预计等级</div>
          <div class="summary-grade" :style="{color: gradeColor[previewGrade]}">{{ previewGrade }}</div>
        </div>
      </div>

      <div v-if="record.final_score" style="margin-top:20px; padding:16px; background:#e6f7ee; border-radius:8px;">
        <div class="flex-between">
          <div>
            <span style="font-weight:600;">已完成评分 · 最终得分：</span>
            <span style="font-size:22px; font-weight:700; color:var(--grade-a);">{{ record.final_score }}</span>
            <span class="summary-grade" style="margin-left:12px; font-size:28px;" :style="{color: gradeColor[record.grade]}">{{ record.grade }}</span>
          </div>
        </div>
      </div>

      <div class="mt-20" style="text-align:right;">
        <button class="btn" @click="$router.back()">返回</button>
        <button v-if="record.status !== 'completed'" class="btn btn-primary" @click="submit">提交评分（完成）</button>
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
const supervisorComment = ref('')
const statusText = { pending: '待自评', self_reviewed: '待评分', completed: '已完成' }
const gradeColor = { S: '#d4a017', A: '#26a269', B: '#1c71d8', C: '#e66100', D: '#c01c28' }

const supervisorWeightedScore = computed(() => {
  let total = 0, totalW = 0
  for (const s of scores.value) {
    total += (s.supervisor_score || 0) * (s.weight || 0)
    totalW += (s.weight || 0)
  }
  return totalW ? (total / totalW).toFixed(2) : '0.00'
})

const previewScore = computed(() => {
  const selfSc = parseFloat(record.value?.self_total_score || 0)
  const supSc = parseFloat(supervisorWeightedScore.value)
  return (selfSc * 0.4 + supSc * 0.6).toFixed(2)
})

const calcGrade = (score) => {
  if (score >= 9) return 'S'
  if (score >= 8) return 'A'
  if (score >= 7) return 'B'
  if (score >= 6) return 'C'
  return 'D'
}

const previewGrade = computed(() => calcGrade(parseFloat(previewScore.value)))

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
      self_score: s.self_score || 0,
      self_comment: s.self_comment || '',
      supervisor_score: s.supervisor_score || 5,
      supervisor_comment: s.supervisor_comment || ''
    }))
    supervisorComment.value = d.supervisor_comment || ''
  } catch (e) { console.error(e) }
})

const submit = async () => {
  for (const s of scores.value) {
    if (!s.supervisor_score) { alert('请完成所有维度的上级评分'); return }
  }
  if (!supervisorComment.value.trim()) {
    if (!confirm('建议填写上级总体评语，确认提交？')) return
  }
  try {
    await api.submitSupervisorReview(route.params.recordId, {
      supervisor_comment: supervisorComment.value,
      scores: scores.value.map(s => ({
        id: s.id,
        supervisor_score: s.supervisor_score,
        supervisor_comment: s.supervisor_comment
      }))
    })
    alert('评分提交成功，考核已完成！')
    const res = await api.getRecord(route.params.recordId)
    record.value = res.data
  } catch (e) { alert('提交失败') }
}
</script>
