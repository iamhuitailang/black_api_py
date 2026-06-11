<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Star, ExternalLink, Shuffle, BookOpen } from 'lucide-vue-next'
import type { Project } from '@/types'
import { priorityList } from '@/types'
import { getLanguageColor } from '@/utils/languageColors'

const props = defineProps<{
  visible: boolean
  project: Project | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'reroll'): void
}>()

const isFlipping = ref(false)

watch(() => props.project, () => {
  isFlipping.value = true
  setTimeout(() => {
    isFlipping.value = false
  }, 400)
})

function getLanguageColorWrap(lang: string | null) {
  return getLanguageColor(lang)
}

function getPriorityInfo(priority: string) {
  return priorityList.find(p => p.value === priority) || priorityList[0]
}

function formatStars(stars: number) {
  if (stars >= 1000) {
    return (stars / 1000).toFixed(1) + 'k'
  }
  return stars.toString()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content" :class="{ flipping: isFlipping }">
        <div class="modal-header">
          <div class="header-left">
            <Shuffle :size="18" class="shuffle-icon" />
            <h3 class="modal-title">随机发现</h3>
          </div>
          <button class="close-btn" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>正在挑选惊喜...</p>
          </div>

          <div v-else-if="project" class="project-detail">
            <div class="language-strip" :style="{ backgroundColor: getLanguageColorWrap(project.language) }"></div>

            <div class="detail-content">
              <div class="detail-header">
                <a :href="project.github_url" target="_blank" class="project-name">
                  {{ project.name }}
                  <ExternalLink :size="14" class="link-icon" />
                </a>
                <div class="detail-stars">
                  <Star :size="16" class="star-icon" />
                  <span>{{ formatStars(project.stars) }}</span>
                </div>
              </div>

              <div class="detail-meta">
                <span class="meta-lang">
                  <span class="lang-dot" :style="{ backgroundColor: getLanguageColorWrap(project.language) }"></span>
                  {{ project.language || 'Unknown' }}
                </span>
                <span
                  class="priority-badge"
                  :style="{
                    color: getPriorityInfo(project.priority).color,
                    backgroundColor: getPriorityInfo(project.priority).bgColor
                  }"
                >
                  {{ getPriorityInfo(project.priority).label }}
                </span>
              </div>

              <p class="detail-description">
                {{ project.description || '暂无描述' }}
              </p>

              <div v-if="project.tags.length > 0" class="detail-tags">
                <span v-for="tag in project.tags" :key="tag" class="detail-tag">
                  {{ tag }}
                </span>
              </div>

              <div v-if="project.note" class="detail-note">
                <div class="note-header">
                  <BookOpen :size="14" class="note-icon" />
                  <span>我的笔记</span>
                </div>
                <p class="note-content">{{ project.note }}</p>
              </div>

              <div class="added-date">
                添加于 {{ new Date(project.added_at).toLocaleDateString('zh-CN') }}
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <Shuffle :size="40" class="empty-icon" />
            <p class="empty-text">暂无"想看"的项目</p>
            <p class="empty-hint">先添加一些项目并标记为"想看"吧！</p>
          </div>
        </div>

        <div v-if="project" class="modal-footer">
          <button class="btn btn-reroll" @click="emit('reroll')">
            <Shuffle :size="14" />
            换一个
          </button>
          <a :href="project.github_url" target="_blank" class="btn btn-goto">
            去GitHub看看
          </a>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: #1e1e2e;
  border: 1px solid #313244;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  transform-style: preserve-3d;
}

.modal-content.flipping {
  animation: flipIn 0.4s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes flipIn {
  0% { transform: rotateY(90deg); opacity: 0.3; }
  100% { transform: rotateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  background: linear-gradient(135deg, #1e1e2e 0%, #181825 100%);
  border-bottom: 1px solid #313244;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.shuffle-icon {
  color: #f9e2af;
}

.modal-title {
  margin: 0;
  color: #cdd6f4;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  color: #7f849c;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #313244;
  color: #cdd6f4;
}

.modal-body {
  min-height: 200px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #313244;
  border-top-color: #89b4fa;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #7f849c;
  margin: 0;
  font-size: 14px;
}

.project-detail {
  position: relative;
}

.language-strip {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.detail-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.project-name {
  color: #cdd6f4;
  font-size: 20px;
  font-weight: 700;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s;
}

.project-name:hover {
  color: #89b4fa;
}

.link-icon {
  color: #6c7086;
}

.detail-stars {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #f9e2af;
  font-size: 15px;
  font-weight: 600;
  padding: 6px 12px;
  background: rgba(249, 226, 175, 0.1);
  border-radius: 6px;
}

.star-icon {
  fill: #f9e2af;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-lang {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #bac2de;
  font-size: 13px;
}

.lang-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.priority-badge {
  padding: 3px 10px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 500;
}

.detail-description {
  color: #a6adc8;
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-tag {
  padding: 5px 12px;
  background: rgba(137, 180, 250, 0.1);
  color: #89b4fa;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 500;
}

.detail-note {
  background: #181825;
  border: 1px solid #313244;
  border-radius: 8px;
  padding: 16px;
}

.note-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #fab387;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}

.note-icon {
  color: #fab387;
}

.note-content {
  color: #bac2de;
  font-size: 13px;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

.added-date {
  color: #6c7086;
  font-size: 12px;
  text-align: right;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  text-align: center;
}

.empty-icon {
  color: #45475a;
  margin-bottom: 8px;
}

.empty-text {
  color: #bac2de;
  margin: 0;
  font-size: 15px;
  font-weight: 500;
}

.empty-hint {
  color: #6c7086;
  margin: 0;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 18px 22px;
  border-top: 1px solid #313244;
  background: #181825;
}

.btn {
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
}

.btn-reroll {
  background: #313244;
  color: #cdd6f4;
}

.btn-reroll:hover {
  background: #45475a;
}

.btn-goto {
  background: #89b4fa;
  color: #1e1e2e;
}

.btn-goto:hover {
  background: #74c7ec;
}
</style>
