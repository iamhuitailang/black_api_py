<template>
  <div class="resume-edit-page">
    <header class="edit-header">
      <div class="container header-content">
        <div class="header-left">
          <el-button :icon="ArrowLeft" text @click="goBack">返回</el-button>
          <h2 class="resume-title">{{ resume?.title || '新建简历' }}</h2>
        </div>
        <div class="header-right">
          <el-button @click="previewResume">预览</el-button>
          <el-button type="primary" @click="downloadPDF">下载PDF</el-button>
        </div>
      </div>
    </header>

    <div class="container edit-container">
      <div class="edit-sidebar">
        <el-menu
          :default-active="activeTab"
          class="edit-menu"
          @select="handleTabChange"
        >
          <el-menu-item index="basic">
            <el-icon><User /></el-icon>
            <span>基础信息</span>
          </el-menu-item>
          <el-menu-item index="education">
            <el-icon><Reading /></el-icon>
            <span>教育经历</span>
          </el-menu-item>
          <el-menu-item index="work">
            <el-icon><Briefcase /></el-icon>
            <span>工作经历</span>
          </el-menu-item>
          <el-menu-item index="project">
            <el-icon><Files /></el-icon>
            <span>项目经验</span>
          </el-menu-item>
          <el-menu-item index="skill">
            <el-icon><Medal /></el-icon>
            <span>技能特长</span>
          </el-menu-item>
          <el-menu-item index="evaluation">
            <el-icon><EditPen /></el-icon>
            <span>自我评价</span>
          </el-menu-item>
        </el-menu>
      </div>

      <div class="edit-content">
        <div v-if="activeTab === 'basic'" class="tab-content">
          <h3>基础信息</h3>
          <el-form :model="basicForm" label-width="100px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="姓名">
                  <el-input v-model="basicForm.name" placeholder="请输入姓名" @blur="saveBasicInfo" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="性别">
                  <el-select v-model="basicForm.gender" placeholder="请选择性别" @change="saveBasicInfo">
                    <el-option label="男" value="男" />
                    <el-option label="女" value="女" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手机号">
                  <el-input v-model="basicForm.phone" placeholder="请输入手机号" @blur="saveBasicInfo" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="邮箱">
                  <el-input v-model="basicForm.email" placeholder="请输入邮箱" @blur="saveBasicInfo" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="出生日期">
                  <el-date-picker
                    v-model="basicForm.birthday"
                    type="date"
                    placeholder="选择日期"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                    @change="saveBasicInfo"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="所在城市">
                  <el-input v-model="basicForm.address" placeholder="请输入所在城市" @blur="saveBasicInfo" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="求职意向">
                  <el-input v-model="basicForm.job_intention" placeholder="请输入求职意向" @blur="saveBasicInfo" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="工作年限">
                  <el-input v-model="basicForm.work_years" placeholder="请输入工作年限" @blur="saveBasicInfo" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="期望薪资">
                  <el-input v-model="basicForm.salary_expectation" placeholder="请输入期望薪资" @blur="saveBasicInfo" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div v-if="activeTab === 'education'" class="tab-content">
          <div class="tab-header">
            <h3>教育经历</h3>
            <el-button type="primary" :icon="Plus" @click="addEducation">添加</el-button>
          </div>
          <div v-for="(item, index) in educationList" :key="item.id || index" class="experience-card">
            <div class="card-header">
              <span class="card-title">{{ item.school || '未填写' }}</span>
              <div class="card-actions">
                <el-button text type="primary" @click="editEducation(item)">编辑</el-button>
                <el-button text type="danger" @click="deleteEducation(item.id)">删除</el-button>
              </div>
            </div>
            <div class="card-content">
              <p><strong>专业：</strong>{{ item.major }}</p>
              <p><strong>学历：</strong>{{ item.degree }}</p>
              <p><strong>时间：</strong>{{ item.start_time }} - {{ item.end_time }}</p>
              <p v-if="item.description"><strong>描述：</strong>{{ item.description }}</p>
            </div>
          </div>
          <el-empty v-if="educationList.length === 0" description="暂无教育经历" />
        </div>

        <div v-if="activeTab === 'work'" class="tab-content">
          <div class="tab-header">
            <h3>工作经历</h3>
            <el-button type="primary" :icon="Plus" @click="addWork">添加</el-button>
          </div>
          <div v-for="(item, index) in workList" :key="item.id || index" class="experience-card">
            <div class="card-header">
              <span class="card-title">{{ item.company || '未填写' }}</span>
              <div class="card-actions">
                <el-button text type="primary" @click="editWork(item)">编辑</el-button>
                <el-button text type="danger" @click="deleteWork(item.id)">删除</el-button>
              </div>
            </div>
            <div class="card-content">
              <p><strong>职位：</strong>{{ item.position }}</p>
              <p><strong>时间：</strong>{{ item.start_time }} - {{ item.end_time }}</p>
              <p v-if="item.description"><strong>描述：</strong>{{ item.description }}</p>
            </div>
          </div>
          <el-empty v-if="workList.length === 0" description="暂无工作经历" />
        </div>

        <div v-if="activeTab === 'project'" class="tab-content">
          <div class="tab-header">
            <h3>项目经验</h3>
            <el-button type="primary" :icon="Plus" @click="addProject">添加</el-button>
          </div>
          <div v-for="(item, index) in projectList" :key="item.id || index" class="experience-card">
            <div class="card-header">
              <span class="card-title">{{ item.name || '未填写' }}</span>
              <div class="card-actions">
                <el-button text type="primary" @click="editProject(item)">编辑</el-button>
                <el-button text type="danger" @click="deleteProject(item.id)">删除</el-button>
              </div>
            </div>
            <div class="card-content">
              <p><strong>角色：</strong>{{ item.role }}</p>
              <p><strong>时间：</strong>{{ item.start_time }} - {{ item.end_time }}</p>
              <p v-if="item.technologies"><strong>技术栈：</strong>{{ item.technologies }}</p>
              <p v-if="item.description"><strong>描述：</strong>{{ item.description }}</p>
            </div>
          </div>
          <el-empty v-if="projectList.length === 0" description="暂无项目经验" />
        </div>

        <div v-if="activeTab === 'skill'" class="tab-content">
          <div class="tab-header">
            <h3>技能特长</h3>
            <el-button type="primary" :icon="Plus" @click="addSkill">添加</el-button>
          </div>
          <div v-for="(item, index) in skillList" :key="item.id || index" class="skill-card">
            <div class="skill-header">
              <span class="skill-name">{{ item.name || '未填写' }}</span>
              <div class="skill-actions">
                <el-button text type="primary" @click="editSkill(item)">编辑</el-button>
                <el-button text type="danger" @click="deleteSkill(item.id)">删除</el-button>
              </div>
            </div>
            <div class="skill-content">
              <el-progress :percentage="item.level * 20" :status="item.level >= 4 ? 'success' : ''" />
              <p v-if="item.description" class="skill-desc">{{ item.description }}</p>
            </div>
          </div>
          <el-empty v-if="skillList.length === 0" description="暂无技能特长" />
        </div>

        <div v-if="activeTab === 'evaluation'" class="tab-content">
          <h3>自我评价</h3>
          <el-form label-width="100px">
            <el-form-item>
              <el-input
                v-model="basicForm.self_evaluation"
                type="textarea"
                :rows="8"
                placeholder="请输入自我评价，介绍自己的优势、特长等..."
                @blur="saveBasicInfo"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="dialogForm" label-width="100px">
        <template v-if="dialogType === 'education'">
          <el-form-item label="学校" required>
            <el-input v-model="dialogForm.school" placeholder="请输入学校名称" />
          </el-form-item>
          <el-form-item label="专业" required>
            <el-input v-model="dialogForm.major" placeholder="请输入专业名称" />
          </el-form-item>
          <el-form-item label="学历" required>
            <el-select v-model="dialogForm.degree" placeholder="请选择学历" style="width: 100%">
              <el-option label="大专" value="大专" />
              <el-option label="本科" value="本科" />
              <el-option label="硕士" value="硕士" />
              <el-option label="博士" value="博士" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="开始时间" required>
            <el-date-picker
              v-model="dialogForm.start_time"
              type="month"
              placeholder="选择开始时间"
              value-format="YYYY-MM"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="结束时间" required>
            <el-date-picker
              v-model="dialogForm.end_time"
              type="month"
              placeholder="选择结束时间"
              value-format="YYYY-MM"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="dialogForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入在校经历描述..."
            />
          </el-form-item>
        </template>

        <template v-if="dialogType === 'work'">
          <el-form-item label="公司" required>
            <el-input v-model="dialogForm.company" placeholder="请输入公司名称" />
          </el-form-item>
          <el-form-item label="职位" required>
            <el-input v-model="dialogForm.position" placeholder="请输入职位名称" />
          </el-form-item>
          <el-form-item label="开始时间" required>
            <el-date-picker
              v-model="dialogForm.start_time"
              type="month"
              placeholder="选择开始时间"
              value-format="YYYY-MM"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="结束时间" required>
            <el-date-picker
              v-model="dialogForm.end_time"
              type="month"
              placeholder="选择结束时间"
              value-format="YYYY-MM"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="dialogForm.description"
              type="textarea"
              :rows="4"
              placeholder="请输入工作内容描述..."
            />
          </el-form-item>
        </template>

        <template v-if="dialogType === 'project'">
          <el-form-item label="项目名称" required>
            <el-input v-model="dialogForm.name" placeholder="请输入项目名称" />
          </el-form-item>
          <el-form-item label="担任角色" required>
            <el-input v-model="dialogForm.role" placeholder="请输入担任角色" />
          </el-form-item>
          <el-form-item label="开始时间" required>
            <el-date-picker
              v-model="dialogForm.start_time"
              type="month"
              placeholder="选择开始时间"
              value-format="YYYY-MM"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="结束时间" required>
            <el-date-picker
              v-model="dialogForm.end_time"
              type="month"
              placeholder="选择结束时间"
              value-format="YYYY-MM"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="技术栈">
            <el-input v-model="dialogForm.technologies" placeholder="请输入使用的技术栈，如：Vue3, Node.js, MySQL" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="dialogForm.description"
              type="textarea"
              :rows="4"
              placeholder="请输入项目描述..."
            />
          </el-form-item>
        </template>

        <template v-if="dialogType === 'skill'">
          <el-form-item label="技能名称" required>
            <el-input v-model="dialogForm.name" placeholder="请输入技能名称" />
          </el-form-item>
          <el-form-item label="掌握程度" required>
            <el-slider v-model="dialogForm.level" :min="1" :max="5" :marks="{1: '了解', 2: '熟悉', 3: '掌握', 4: '精通', 5: '专家'}" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="dialogForm.description"
              type="textarea"
              :rows="2"
              placeholder="请输入技能描述..."
            />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDialog">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  User,
  Reading,
  Briefcase,
  Files,
  Medal,
  EditPen,
  Plus
} from '@element-plus/icons-vue'
import { resumeApi } from '@/api'
import type {
  ResumeDetail,
  ResumeBasicInfo,
  ResumeEducation,
  ResumeWork,
  ResumeProject,
  ResumeSkill
} from '@/types'

const route = useRoute()
const router = useRouter()

const resumeId = ref<number>(parseInt(route.params.id as string))
const resume = ref<ResumeDetail | null>(null)
const activeTab = ref('basic')
const dialogVisible = ref(false)
const dialogType = ref('')
const dialogTitle = ref('')
const editingId = ref<number | null>(null)

const basicForm = reactive<Partial<ResumeBasicInfo>>({
  name: '',
  gender: '',
  phone: '',
  email: '',
  birthday: '',
  address: '',
  avatar: '',
  job_intention: '',
  work_years: '',
  salary_expectation: '',
  self_evaluation: ''
})

const educationList = ref<ResumeEducation[]>([])
const workList = ref<ResumeWork[]>([])
const projectList = ref<ResumeProject[]>([])
const skillList = ref<ResumeSkill[]>([])

const dialogForm = reactive<any>({})

const loadResumeDetail = async () => {
  try {
    const res = await resumeApi.getResumeDetail({ resume_id: resumeId.value })
    resume.value = res
    if (res.basic_info) {
      Object.assign(basicForm, res.basic_info)
    }
    educationList.value = res.education_list || []
    workList.value = res.work_list || []
    projectList.value = res.project_list || []
    skillList.value = res.skill_list || []
  } catch (error) {
    console.error('Load resume detail error:', error)
  }
}

const saveBasicInfo = async () => {
  try {
    await resumeApi.updateBasicInfo(
      { resume_id: resumeId.value },
      basicForm
    )
  } catch (error) {
    console.error('Save basic info error:', error)
  }
}

const handleTabChange = (tab: string) => {
  activeTab.value = tab
}

const goBack = () => {
  router.push('/center')
}

const previewResume = () => {
  router.push(`/resume/preview/${resumeId.value}`)
}

const downloadPDF = async () => {
  try {
    await resumeApi.incrementDownload({ resume_id: resumeId.value })
    ElMessage.success('PDF下载功能开发中...')
  } catch (error) {
    console.error('Download PDF error:', error)
  }
}

const addEducation = () => {
  editingId.value = null
  dialogType.value = 'education'
  dialogTitle.value = '添加教育经历'
  Object.assign(dialogForm, {
    school: '',
    major: '',
    degree: '',
    start_time: '',
    end_time: '',
    description: ''
  })
  dialogVisible.value = true
}

const editEducation = (item: ResumeEducation) => {
  editingId.value = item.id
  dialogType.value = 'education'
  dialogTitle.value = '编辑教育经历'
  Object.assign(dialogForm, item)
  dialogVisible.value = true
}

const deleteEducation = async (id: number) => {
  ElMessageBox.confirm('确定要删除这条教育经历吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await resumeApi.deleteEducation({ education_id: id })
      educationList.value = educationList.value.filter(item => item.id !== id)
      ElMessage.success('删除成功')
    } catch (error) {
      console.error('Delete education error:', error)
    }
  }).catch(() => {})
}

const addWork = () => {
  editingId.value = null
  dialogType.value = 'work'
  dialogTitle.value = '添加工作经历'
  Object.assign(dialogForm, {
    company: '',
    position: '',
    start_time: '',
    end_time: '',
    description: ''
  })
  dialogVisible.value = true
}

const editWork = (item: ResumeWork) => {
  editingId.value = item.id
  dialogType.value = 'work'
  dialogTitle.value = '编辑工作经历'
  Object.assign(dialogForm, item)
  dialogVisible.value = true
}

const deleteWork = async (id: number) => {
  ElMessageBox.confirm('确定要删除这条工作经历吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await resumeApi.deleteWork({ work_id: id })
      workList.value = workList.value.filter(item => item.id !== id)
      ElMessage.success('删除成功')
    } catch (error) {
      console.error('Delete work error:', error)
    }
  }).catch(() => {})
}

const addProject = () => {
  editingId.value = null
  dialogType.value = 'project'
  dialogTitle.value = '添加项目经验'
  Object.assign(dialogForm, {
    name: '',
    role: '',
    start_time: '',
    end_time: '',
    technologies: '',
    description: ''
  })
  dialogVisible.value = true
}

const editProject = (item: ResumeProject) => {
  editingId.value = item.id
  dialogType.value = 'project'
  dialogTitle.value = '编辑项目经验'
  Object.assign(dialogForm, item)
  dialogVisible.value = true
}

const deleteProject = async (id: number) => {
  ElMessageBox.confirm('确定要删除这条项目经验吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await resumeApi.deleteProject({ project_id: id })
      projectList.value = projectList.value.filter(item => item.id !== id)
      ElMessage.success('删除成功')
    } catch (error) {
      console.error('Delete project error:', error)
    }
  }).catch(() => {})
}

const addSkill = () => {
  editingId.value = null
  dialogType.value = 'skill'
  dialogTitle.value = '添加技能特长'
  Object.assign(dialogForm, {
    name: '',
    level: 3,
    description: ''
  })
  dialogVisible.value = true
}

const editSkill = (item: ResumeSkill) => {
  editingId.value = item.id
  dialogType.value = 'skill'
  dialogTitle.value = '编辑技能特长'
  Object.assign(dialogForm, item)
  dialogVisible.value = true
}

const deleteSkill = async (id: number) => {
  ElMessageBox.confirm('确定要删除这条技能吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await resumeApi.deleteSkill({ skill_id: id })
      skillList.value = skillList.value.filter(item => item.id !== id)
      ElMessage.success('删除成功')
    } catch (error) {
      console.error('Delete skill error:', error)
    }
  }).catch(() => {})
}

const saveDialog = async () => {
  try {
    const params = { resume_id: resumeId.value }
    let res: any

    if (dialogType.value === 'education') {
      if (editingId.value) {
        res = await resumeApi.updateEducation({ education_id: editingId.value }, dialogForm)
        const index = educationList.value.findIndex(item => item.id === editingId.value)
        if (index !== -1) {
          educationList.value[index] = res
        }
      } else {
        res = await resumeApi.addEducation(params, dialogForm)
        educationList.value.push(res)
      }
    } else if (dialogType.value === 'work') {
      if (editingId.value) {
        res = await resumeApi.updateWork({ work_id: editingId.value }, dialogForm)
        const index = workList.value.findIndex(item => item.id === editingId.value)
        if (index !== -1) {
          workList.value[index] = res
        }
      } else {
        res = await resumeApi.addWork(params, dialogForm)
        workList.value.push(res)
      }
    } else if (dialogType.value === 'project') {
      if (editingId.value) {
        res = await resumeApi.updateProject({ project_id: editingId.value }, dialogForm)
        const index = projectList.value.findIndex(item => item.id === editingId.value)
        if (index !== -1) {
          projectList.value[index] = res
        }
      } else {
        res = await resumeApi.addProject(params, dialogForm)
        projectList.value.push(res)
      }
    } else if (dialogType.value === 'skill') {
      if (editingId.value) {
        res = await resumeApi.updateSkill({ skill_id: editingId.value }, dialogForm)
        const index = skillList.value.findIndex(item => item.id === editingId.value)
        if (index !== -1) {
          skillList.value[index] = res
        }
      } else {
        res = await resumeApi.addSkill(params, dialogForm)
        skillList.value.push(res)
      }
    }

    ElMessage.success('保存成功')
    dialogVisible.value = false
  } catch (error) {
    console.error('Save dialog error:', error)
  }
}

onMounted(() => {
  loadResumeDetail()
})
</script>

<style scoped>
.resume-edit-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.edit-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.resume-title {
  font-size: 18px;
  margin: 0;
  color: #333;
}

.edit-container {
  display: flex;
  gap: 24px;
  padding: 24px 0;
}

.edit-sidebar {
  width: 200px;
  flex-shrink: 0;
}

.edit-menu {
  border-right: none;
  background: #fff;
  border-radius: 8px;
  padding: 12px 0;
}

.edit-content {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-height: 600px;
}

.tab-content h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.tab-header h3 {
  margin: 0;
  padding: 0;
  border: none;
}

.experience-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.card-content p {
  margin: 6px 0;
  color: #666;
  font-size: 14px;
}

.skill-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.skill-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.skill-desc {
  margin-top: 8px;
  color: #999;
  font-size: 13px;
}
</style>
