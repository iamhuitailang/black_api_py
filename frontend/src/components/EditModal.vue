<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X } from 'lucide-vue-next'
import type { Project, Priority, UpdateProjectRequest } from '@/types'
import { priorityList } from '@/types'

const props = defineProps<{
  visible: boolean
  project: Project | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', id: number, data: Omit<UpdateProjectRequest, 'id'>): void
}>()

const tagsInput = ref('')
const priority = ref<Priority>('want_to_read')
const note = ref('')

watch(() => props.project, (newProject) => {
  if (newProject) {
    tagsInput.value = newProject.tags.join(', ')
    priority.value = newProject.priority
    note.value = newProject.note || ''
  }
}, { immediate: true })

const parsedTags = computed(() => {
  return tagsInput.value
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
})

function handleSave() {
  if (!props.project) return
  emit('save', props.project.id, {
    tags: parsedTags.value,
    priority: priority.value,
    note: note.value || null,
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">编辑项目</h3>
          <button class="close-btn" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <div v-if="project" class="modal-body">
          <div class="form-group">
            <label class="form-label">项目名称</label>
            <input type="text" class="form-input readonly" :value="project.name" readonly />
          </div>

          <div class="form-group">
            <label class="form-label">标签（用逗号分隔）</label>
            <input
              v-model="tagsInput"
              type="text"
              class="form-input"
              placeholder="例如: AI工具, Vue组件库, 面试复习"
            />
            <div v-if="parsedTags.length > 0" class="tags-preview">
              <span v-for="tag in parsedTags" :key="tag" class="preview-tag">
                {{ tag }}
              </span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">优先级</label>
            <div class="priority-options">
              <label
                v-for="p in priorityList"
                :key="p.value"
                class="priority-option"
                :class="{ active: priority === p.value }"
                :style="{ '--p-color': p.color, '--p-bg': p.bgColor }"
              >
                <input
                  type="radio"
                  :value="p.value"
                  v-model="priority"
                  class="priority-radio"
                />
                <span class="priority-label">{{ p.label }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">私人笔记</label>
            <textarea
              v-model="note"
              class="form-textarea"
              rows="4"
              placeholder="记录你对这个项目的想法、用途、学习笔记..."
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="emit('close')">取消</button>
          <button class="btn btn-primary" @click="handleSave">保存</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
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
  border-radius: 8px;
  width: 90%;
  max-width: 520px;
  max-height: 85vh;
  overflow-y: auto;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid #313244;
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
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  color: #bac2de;
  font-size: 13px;
  font-weight: 500;
}

.form-input {
  padding: 10px 14px;
  background: #181825;
  border: 1px solid #313244;
  border-radius: 6px;
  color: #cdd6f4;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  outline: none;
}

.form-input:focus {
  border-color: #89b4fa;
  box-shadow: 0 0 0 3px rgba(137, 180, 250, 0.15);
}

.form-input.readonly {
  background: #1e1e2e;
  color: #7f849c;
  cursor: not-allowed;
}

.form-textarea {
  padding: 10px 14px;
  background: #181825;
  border: 1px solid #313244;
  border-radius: 6px;
  color: #cdd6f4;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
  outline: none;
  line-height: 1.6;
}

.form-textarea:focus {
  border-color: #89b4fa;
  box-shadow: 0 0 0 3px rgba(137, 180, 250, 0.15);
}

.tags-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preview-tag {
  padding: 3px 10px;
  background: rgba(137, 180, 250, 0.1);
  color: #89b4fa;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.priority-options {
  display: flex;
  gap: 10px;
}

.priority-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  background: #181825;
  border: 1px solid #313244;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.priority-option:hover {
  border-color: #45475a;
}

.priority-option.active {
  border-color: var(--p-color);
  background: var(--p-bg);
}

.priority-radio {
  accent-color: var(--p-color);
}

.priority-label {
  color: var(--p-color);
  font-size: 13px;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 22px;
  border-top: 1px solid #313244;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #313244;
  color: #cdd6f4;
}

.btn-secondary:hover {
  background: #45475a;
}

.btn-primary {
  background: #89b4fa;
  color: #1e1e2e;
}

.btn-primary:hover {
  background: #74c7ec;
}
</style>
