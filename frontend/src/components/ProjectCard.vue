<script setup lang="ts">
import { computed } from 'vue'
import { Star, Edit2, Trash2, ExternalLink, CheckSquare, Square } from 'lucide-vue-next'
import type { Project } from '@/types'
import { priorityList } from '@/types'
import { getLanguageColor } from '@/utils/languageColors'

const props = defineProps<{
  project: Project
  selected: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', project: Project): void
  (e: 'delete', id: number): void
  (e: 'toggleSelect', id: number): void
}>()

const languageColor = computed(() => getLanguageColor(props.project.language))

const priorityInfo = computed(() => {
  return priorityList.find(p => p.value === props.project.priority) || priorityList[0]
})

const formattedStars = computed(() => {
  const stars = props.project.stars
  if (stars >= 1000) {
    return (stars / 1000).toFixed(1) + 'k'
  }
  return stars.toString()
})
</script>

<template>
  <div class="project-card">
    <div class="language-bar" :style="{ backgroundColor: languageColor }"></div>
    <div class="card-content">
      <div class="card-header">
        <div class="select-box" @click.stop="emit('toggleSelect', project.id)">
          <CheckSquare v-if="selected" :size="16" class="icon-selected" />
          <Square v-else :size="16" class="icon-unselected" />
        </div>
        <div class="title-section">
          <a :href="project.github_url" target="_blank" class="project-title" @click.stop>
            {{ project.name }}
            <ExternalLink :size="12" class="link-icon" />
          </a>
          <span class="priority-badge" :style="{ color: priorityInfo.color, backgroundColor: priorityInfo.bgColor }">
            {{ priorityInfo.label }}
          </span>
        </div>
        <div class="stars">
          <Star :size="14" class="star-icon" />
          <span>{{ formattedStars }}</span>
        </div>
      </div>

      <p class="description" :title="project.description || ''">
        {{ project.description || 'No description' }}
      </p>

      <div class="card-footer">
        <div class="meta-info">
          <span class="language" :title="project.language || 'Unknown'">
            <span class="lang-dot" :style="{ backgroundColor: languageColor }"></span>
            {{ project.language || 'Unknown' }}
          </span>
        </div>
        <div class="tags">
          <span v-for="tag in project.tags.slice(0, 3)" :key="tag" class="tag">
            {{ tag }}
          </span>
          <span v-if="project.tags.length > 3" class="tag-more">
            +{{ project.tags.length - 3 }}
          </span>
        </div>
        <div class="actions">
          <button class="action-btn edit-btn" @click.stop="emit('edit', project)" title="Edit">
            <Edit2 :size="14" />
          </button>
          <button class="action-btn delete-btn" @click.stop="emit('delete', project.id)" title="Delete">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  position: relative;
  display: flex;
  background: #1e1e2e;
  border: 1px solid #313244;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border-color: #45475a;
}

.language-bar {
  width: 4px;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.select-box {
  flex-shrink: 0;
  padding-top: 2px;
}

.icon-selected {
  color: #89b4fa;
}

.icon-unselected {
  color: #6c7086;
}

.title-section {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.project-title {
  color: #cdd6f4;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s;
}

.project-title:hover {
  color: #89b4fa;
}

.link-icon {
  color: #6c7086;
  flex-shrink: 0;
}

.priority-badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.stars {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f9e2af;
  font-size: 13px;
  font-weight: 500;
}

.star-icon {
  fill: #f9e2af;
}

.description {
  color: #a6adc8;
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.language {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #7f849c;
  font-size: 11px;
}

.lang-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.tags {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.tag {
  padding: 2px 8px;
  background: rgba(137, 180, 250, 0.1);
  color: #89b4fa;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
}

.tag-more {
  padding: 2px 6px;
  color: #6c7086;
  font-size: 10px;
}

.actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn {
  color: #7f849c;
}

.edit-btn:hover {
  background: rgba(137, 180, 250, 0.15);
  color: #89b4fa;
}

.delete-btn {
  color: #7f849c;
}

.delete-btn:hover {
  background: rgba(243, 139, 168, 0.15);
  color: #f38ba8;
}
</style>
