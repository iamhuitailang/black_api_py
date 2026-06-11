<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Search, Plus, Shuffle, Trash2, Filter, ChevronDown, ChevronRight,
  X, CheckSquare, Square, Loader2, GitBranch, Tag, Star, BookOpen, User, LogOut
} from 'lucide-vue-next'
import type { Project, Priority, UpdateProjectRequest } from '@/types'
import { priorityList } from '@/types'
import { api, clearToken } from '@/utils/api'
import ProjectCard from '@/components/ProjectCard.vue'
import EditModal from '@/components/EditModal.vue'
import RandomModal from '@/components/RandomModal.vue'

const route = useRoute()
const router = useRouter()

const projects = ref<Project[]>([])
const languages = ref<string[]>([])
const loading = ref(false)
const addingProject = ref(false)
const addingProjectUrl = ref('')
const addingError = ref('')

const searchQuery = ref((route.query.search as string) || '')
const selectedLanguage = ref((route.query.language as string) || '')
const selectedPriority = ref((route.query.priority as string) || '')
const activeTagFilter = ref((route.query.tag as string) || '')

const selectedIds = ref<number[]>([])
const selectMode = ref(false)

const editModalVisible = ref(false)
const editingProject = ref<Project | null>(null)

const randomModalVisible = ref(false)
const randomProject = ref<Project | null>(null)
const randomLoading = ref(false)

const expandedGroups = ref<Record<string, boolean>>({})

const currentUser = ref('')

async function fetchCurrentUser() {
  try {
    const res = await api.checkAuth()
    if (res.code === 0) {
      currentUser.value = res.data.username
    }
  } catch {}
}

async function handleLogout() {
  try {
    await api.logout()
  } catch {}
  clearToken()
  router.push('/login')
}

async function fetchProjects() {
  loading.value = true
  try {
    const res = await api.getProjects({
      search: searchQuery.value || undefined,
      language: selectedLanguage.value || undefined,
      priority: selectedPriority.value || undefined,
      tag: activeTagFilter.value || undefined,
    })
    if (res.code === 0) {
      projects.value = res.data.items
    }
  } catch (e) {
    console.error('Failed to fetch projects:', e)
  } finally {
    loading.value = false
  }
}

async function fetchLanguages() {
  try {
    const res = await api.getLanguages()
    if (res.code === 0) {
      languages.value = res.data
    }
  } catch (e) {
    console.error('Failed to fetch languages:', e)
  }
}

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

const debouncedFetch = debounce(fetchProjects, 300)

function syncFiltersToUrl() {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.search = searchQuery.value
  if (selectedLanguage.value) query.language = selectedLanguage.value
  if (selectedPriority.value) query.priority = selectedPriority.value
  if (activeTagFilter.value) query.tag = activeTagFilter.value
  router.replace({ query })
}

watch([searchQuery, selectedLanguage, selectedPriority, activeTagFilter], () => {
  syncFiltersToUrl()
  debouncedFetch()
})

onMounted(() => {
  fetchCurrentUser()
  fetchProjects()
  fetchLanguages()
})

async function handleAddProject() {
  const url = addingProjectUrl.value.trim()
  if (!url) {
    addingError.value = '请输入GitHub URL'
    return
  }
  if (!url.includes('github.com')) {
    addingError.value = '请输入有效的GitHub URL'
    return
  }

  addingError.value = ''
  addingProject.value = true

  try {
    const res = await api.addProject({ github_url: url })
    if (res.code === 0) {
      addingProjectUrl.value = ''
      fetchProjects()
      fetchLanguages()
    } else {
      addingError.value = res.message
    }
  } catch (e) {
    addingError.value = '添加失败，请稍后重试'
  } finally {
    addingProject.value = false
  }
}

function handleEdit(project: Project) {
  editingProject.value = project
  editModalVisible.value = true
}

async function handleSaveEdit(id: number, data: Omit<UpdateProjectRequest, 'id'>) {
  try {
    const res = await api.updateProject({ id, ...data })
    if (res.code === 0) {
      editModalVisible.value = false
      editingProject.value = null
      fetchProjects()
    }
  } catch (e) {
    console.error('Failed to update project:', e)
  }
}

async function handleDelete(id: number) {
  if (!confirm('确定要删除这个项目吗？')) return
  try {
    const res = await api.deleteProject(id)
    if (res.code === 0) {
      fetchProjects()
      fetchLanguages()
      selectedIds.value = selectedIds.value.filter(i => i !== id)
    }
  } catch (e) {
    console.error('Failed to delete project:', e)
  }
}

const visibleProjectIds = computed(() => new Set(projects.value.map(p => p.id)))

const allVisibleSelected = computed(() => {
  if (projects.value.length === 0) return false
  return projects.value.every(p => selectedIds.value.includes(p.id))
})

function toggleSelect(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
  selectMode.value = selectedIds.value.length > 0
}

function toggleSelectAll() {
  const visibleIds = projects.value.map(p => p.id)
  if (allVisibleSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !visibleProjectIds.value.has(id))
    selectMode.value = selectedIds.value.length > 0
  } else {
    const existingSet = new Set(selectedIds.value)
    visibleIds.forEach(id => {
      if (!existingSet.has(id)) {
        selectedIds.value.push(id)
      }
    })
    selectMode.value = true
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  if (!confirm(`确定要删除选中的 ${selectedIds.value.length} 个项目吗？此操作不可恢复。`)) return

  try {
    const res = await api.batchDelete(selectedIds.value)
    if (res.code === 0) {
      selectedIds.value = []
      selectMode.value = false
      fetchProjects()
      fetchLanguages()
    }
  } catch (e) {
    console.error('Failed to batch delete:', e)
  }
}

async function handleRandomProject() {
  randomLoading.value = true
  randomModalVisible.value = true
  randomProject.value = null

  try {
    const res = await api.getRandomProject()
    if (res.code === 0) {
      randomProject.value = res.data
    }
  } catch (e) {
    console.error('Failed to get random project:', e)
  } finally {
    randomLoading.value = false
  }
}

function toggleGroup(tag: string) {
  expandedGroups.value[tag] = !expandedGroups.value[tag]
}

function setTagFilter(tag: string) {
  activeTagFilter.value = activeTagFilter.value === tag ? '' : tag
}

const allTags = computed(() => {
  const tagSet = new Set<string>()
  projects.value.forEach(p => {
    p.tags.forEach(t => tagSet.add(t))
  })
  return Array.from(tagSet).sort()
})

const groupedProjects = computed(() => {
  const groups: Record<string, Project[]> = {}
  const ungrouped: Project[] = []
  const assigned = new Set<number>()

  projects.value.forEach(project => {
    if (project.tags.length === 0) {
      ungrouped.push(project)
      assigned.add(project.id)
    }
  })

  const allTagList = allTags.value
  allTagList.forEach(tag => {
    projects.value.forEach(project => {
      if (assigned.has(project.id)) return
      if (project.tags.includes(tag)) {
        if (!groups[tag]) groups[tag] = []
        groups[tag].push(project)
        assigned.add(project.id)
      }
    })
  })

  projects.value.forEach(project => {
    if (!assigned.has(project.id)) {
      ungrouped.push(project)
    }
  })

  const result = Object.entries(groups)
    .map(([tag, items]) => ({ tag, items }))
    .sort((a, b) => a.tag.localeCompare(b.tag))

  if (ungrouped.length > 0) {
    result.push({ tag: '未分类', items: ungrouped })
  }

  return result
})

const hasActiveFilters = computed(() => {
  return searchQuery.value || selectedLanguage.value || selectedPriority.value || activeTagFilter.value
})

function clearFilters() {
  searchQuery.value = ''
  selectedLanguage.value = ''
  selectedPriority.value = ''
  activeTagFilter.value = ''
}
</script>

<template>
  <div class="home-page">
    <header class="app-header">
      <div class="header-content">
        <div class="logo-section">
          <GitBranch :size="24" class="logo-icon" />
          <div>
            <h1 class="app-title">GitHub Star Favorites</h1>
            <p class="app-subtitle">比GitHub Star更好用的项目收藏夹</p>
          </div>
        </div>
        <div class="stats-section">
          <div class="stat-item">
            <Star :size="14" />
            <span>{{ projects.length }} 个项目</span>
          </div>
          <div class="stat-item">
            <Tag :size="14" />
            <span>{{ allTags.length }} 个标签</span>
          </div>
        </div>
        <div class="user-section">
          <div class="user-info">
            <User :size="16" class="user-icon" />
            <span class="user-name">{{ currentUser }}</span>
          </div>
          <button class="btn-logout" @click="handleLogout">
            <LogOut :size="14" />
            退出
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <section class="toolbar">
        <div class="toolbar-row">
          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="搜索项目名称或笔记内容..."
            />
            <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
              <X :size="14" />
            </button>
          </div>

          <div class="filters">
            <div class="filter-group">
              <Filter :size="14" class="filter-icon" />
              <select v-model="selectedLanguage" class="filter-select">
                <option value="">全部语言</option>
                <option v-for="lang in languages" :key="lang" :value="lang">{{ lang }}</option>
              </select>
            </div>

            <div class="filter-group">
              <BookOpen :size="14" class="filter-icon" />
              <select v-model="selectedPriority" class="filter-select">
                <option value="">全部优先级</option>
                <option v-for="p in priorityList" :key="p.value" :value="p.value">{{ p.label }}</option>
              </select>
            </div>

            <button class="btn btn-random" @click="handleRandomProject">
              <Shuffle :size="14" />
              随机发现
            </button>
          </div>
        </div>

        <div class="toolbar-row">
          <div class="add-project-section">
            <input
              v-model="addingProjectUrl"
              @keyup.enter="handleAddProject"
              type="text"
              class="add-input"
              placeholder="粘贴GitHub URL快速添加项目..."
            />
            <button
              class="btn btn-add"
              :disabled="addingProject"
              @click="handleAddProject"
            >
              <Loader2 v-if="addingProject" :size="16" class="spin" />
              <Plus v-else :size="16" />
              添加项目
            </button>
          </div>

          <div class="batch-actions">
            <button
              class="btn btn-select-all"
              @click="toggleSelectAll"
              :disabled="projects.length === 0"
            >
              <CheckSquare v-if="allVisibleSelected" :size="14" />
              <Square v-else :size="14" />
              {{ allVisibleSelected ? '取消全选' : '全选' }}
            </button>

            <button
              v-if="selectMode"
              class="btn btn-delete-batch"
              @click="handleBatchDelete"
              :disabled="selectedIds.length === 0"
            >
              <Trash2 :size="14" />
              删除选中 ({{ selectedIds.length }})
            </button>
          </div>
        </div>

        <div v-if="addingError" class="error-message">
          {{ addingError }}
        </div>

        <div v-if="allTags.length > 0" class="tags-filter-bar">
          <span class="tags-label">标签筛选:</span>
          <button
            v-for="tag in allTags"
            :key="tag"
            class="tag-filter-btn"
            :class="{ active: activeTagFilter === tag }"
            @click="setTagFilter(tag)"
          >
            {{ tag }}
          </button>
          <button v-if="hasActiveFilters" class="clear-filters-btn" @click="clearFilters">
            清除筛选
          </button>
        </div>
      </section>

      <section class="content-area">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="projects.length === 0" class="empty-state">
          <div class="empty-icon-wrapper">
            <Star :size="48" class="empty-icon" />
          </div>
          <h3 class="empty-title">还没有收藏任何项目</h3>
          <p class="empty-desc">在上方输入框粘贴GitHub URL，开始收藏你感兴趣的项目吧！</p>
          <div class="empty-hints">
            <span class="hint-item">💡 可以为项目添加自定义标签分类</span>
            <span class="hint-item">📝 记录私人学习笔记</span>
            <span class="hint-item">🎯 标记优先级：想看/在看/已看</span>
          </div>
        </div>

        <div v-else-if="hasActiveFilters && groupedProjects.length === 0" class="no-results">
          <p>没有找到匹配的项目</p>
          <button class="btn btn-secondary" @click="clearFilters">清除筛选条件</button>
        </div>

        <div v-else class="projects-container">
          <template v-if="!hasActiveFilters">
            <div v-for="group in groupedProjects" :key="group.tag" class="tag-group">
              <div class="group-header" @click="toggleGroup(group.tag)">
                <component
                  :is="expandedGroups[group.tag] !== false ? ChevronDown : ChevronRight"
                  :size="16"
                  class="chevron"
                />
                <Tag :size="14" class="group-tag-icon" />
                <span class="group-title">{{ group.tag }}</span>
                <span class="group-count">{{ group.items.length }} 个项目</span>
              </div>
              <div
                v-show="expandedGroups[group.tag] !== false"
                class="group-content"
              >
                <div class="projects-grid">
                  <ProjectCard
                    v-for="project in group.items"
                    :key="project.id"
                    :project="project"
                    :selected="selectedIds.includes(project.id)"
                    @edit="handleEdit"
                    @delete="handleDelete"
                    @toggle-select="toggleSelect"
                  />
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="projects-grid">
              <ProjectCard
                v-for="project in projects"
                :key="project.id"
                :project="project"
                :selected="selectedIds.includes(project.id)"
                @edit="handleEdit"
                @delete="handleDelete"
                @toggle-select="toggleSelect"
              />
            </div>
          </template>
        </div>
      </section>
    </main>

    <EditModal
      :visible="editModalVisible"
      :project="editingProject"
      @close="editModalVisible = false; editingProject = null"
      @save="handleSaveEdit"
    />

    <RandomModal
      :visible="randomModalVisible"
      :project="randomProject"
      :loading="randomLoading"
      @close="randomModalVisible = false; randomProject = null"
      @reroll="handleRandomProject"
    />
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #1e1e2e 0%, #181825 100%);
  border-bottom: 1px solid #313244;
  padding: 20px 32px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-icon {
  color: #89b4fa;
}

.app-title {
  margin: 0;
  color: #cdd6f4;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.app-subtitle {
  margin: 2px 0 0 0;
  color: #7f849c;
  font-size: 12px;
}

.stats-section {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #bac2de;
  font-size: 13px;
}

.stat-item svg {
  color: #89b4fa;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #bac2de;
  font-size: 13px;
}

.user-icon {
  color: #89b4fa;
}

.user-name {
  color: #cdd6f4;
  font-weight: 500;
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(243, 139, 168, 0.1);
  border: 1px solid rgba(243, 139, 168, 0.3);
  border-radius: 6px;
  color: #f38ba8;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(243, 139, 168, 0.2);
  border-color: #f38ba8;
}

.main-content {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 32px;
}

.toolbar {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.toolbar-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 280px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #6c7086;
}

.search-input {
  width: 100%;
  padding: 11px 40px 11px 42px;
  background: #1e1e2e;
  border: 1px solid #313244;
  border-radius: 6px;
  color: #cdd6f4;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s;
  outline: none;
}

.search-input:focus {
  border-color: #89b4fa;
  box-shadow: 0 0 0 3px rgba(137, 180, 250, 0.15);
}

.clear-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: #6c7086;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #313244;
  color: #cdd6f4;
}

.filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1e1e2e;
  border: 1px solid #313244;
  border-radius: 6px;
  padding: 0 10px;
  height: 42px;
}

.filter-icon {
  color: #6c7086;
}

.filter-select {
  background: transparent;
  border: none;
  color: #cdd6f4;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  min-width: 100px;
}

.filter-select option {
  background: #1e1e2e;
  color: #cdd6f4;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  height: 42px;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-random {
  background: linear-gradient(135deg, #f9e2af 0%, #fab387 100%);
  color: #1e1e2e;
}

.btn-random:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 226, 175, 0.3);
}

.add-project-section {
  flex: 1;
  display: flex;
  gap: 10px;
  min-width: 300px;
}

.add-input {
  flex: 1;
  padding: 10px 14px;
  background: #1e1e2e;
  border: 1px solid #313244;
  border-radius: 6px;
  color: #cdd6f4;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s;
  outline: none;
}

.add-input:focus {
  border-color: #89b4fa;
  box-shadow: 0 0 0 3px rgba(137, 180, 250, 0.15);
}

.btn-add {
  background: #89b4fa;
  color: #1e1e2e;
}

.btn-add:hover:not(:disabled) {
  background: #74c7ec;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.batch-actions {
  display: flex;
  gap: 10px;
}

.btn-select-all {
  background: #313244;
  color: #cdd6f4;
}

.btn-select-all:hover:not(:disabled) {
  background: #45475a;
}

.btn-delete-batch {
  background: #f38ba8;
  color: #1e1e2e;
}

.btn-delete-batch:hover:not(:disabled) {
  background: #eba0ac;
}

.btn-secondary {
  background: #313244;
  color: #cdd6f4;
}

.btn-secondary:hover {
  background: #45475a;
}

.error-message {
  background: rgba(243, 139, 168, 0.1);
  border: 1px solid rgba(243, 139, 168, 0.3);
  color: #f38ba8;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
}

.tags-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 4px;
}

.tags-label {
  color: #7f849c;
  font-size: 12px;
  margin-right: 4px;
}

.tag-filter-btn {
  padding: 4px 12px;
  background: #1e1e2e;
  border: 1px solid #313244;
  border-radius: 12px;
  color: #bac2de;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-filter-btn:hover {
  border-color: #89b4fa;
  color: #89b4fa;
}

.tag-filter-btn.active {
  background: rgba(137, 180, 250, 0.15);
  border-color: #89b4fa;
  color: #89b4fa;
}

.clear-filters-btn {
  padding: 4px 12px;
  background: transparent;
  border: 1px dashed #6c7086;
  border-radius: 12px;
  color: #7f849c;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 8px;
}

.clear-filters-btn:hover {
  border-color: #f38ba8;
  color: #f38ba8;
}

.content-area {
  flex: 1;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #313244;
  border-top-color: #89b4fa;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-state p {
  color: #7f849c;
  margin: 0;
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(137, 180, 250, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-icon {
  color: #89b4fa;
  opacity: 0.6;
}

.empty-title {
  color: #bac2de;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.empty-desc {
  color: #7f849c;
  font-size: 14px;
  margin: 0 0 24px 0;
}

.empty-hints {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint-item {
  color: #6c7086;
  font-size: 13px;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  text-align: center;
}

.no-results p {
  color: #7f849c;
  margin: 0;
  font-size: 14px;
}

.projects-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tag-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(137, 180, 250, 0.05);
  border: 1px solid rgba(137, 180, 250, 0.15);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.group-header:hover {
  background: rgba(137, 180, 250, 0.1);
}

.chevron {
  color: #89b4fa;
  transition: transform 0.2s;
}

.group-tag-icon {
  color: #89b4fa;
}

.group-title {
  color: #cdd6f4;
  font-size: 14px;
  font-weight: 600;
  flex: 1;
}

.group-count {
  color: #6c7086;
  font-size: 12px;
}

.group-content {
  animation: fadeSlide 0.3s ease;
}

@keyframes fadeSlide {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}

@media (max-width: 900px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stats-section {
    width: 100%;
    justify-content: flex-start;
  }

  .main-content {
    padding: 20px 16px;
  }

  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box,
  .add-project-section {
    min-width: 100%;
  }

  .filters {
    flex-wrap: wrap;
  }

  .filter-group {
    flex: 1;
    min-width: 140px;
  }

  .filter-select {
    flex: 1;
  }

  .batch-actions {
    width: 100%;
  }

  .btn-select-all,
  .btn-delete-batch {
    flex: 1;
    justify-content: center;
  }

  .projects-grid {
    grid-template-columns: 1fr;
  }
}
</style>
