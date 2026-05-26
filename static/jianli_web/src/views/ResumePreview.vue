<template>
  <div class="resume-preview-page">
    <header class="preview-header">
      <div class="container header-content">
        <div class="header-left">
          <el-button :icon="ArrowLeft" text @click="goBack">返回编辑</el-button>
          <h2 class="title">简历预览</h2>
        </div>
        <div class="header-right">
          <el-button @click="downloadPDF" type="primary" :icon="Download">下载PDF</el-button>
        </div>
      </div>
    </header>

    <div class="container preview-container">
      <div ref="resumeRef" class="resume-content" id="resume-content">
        <div v-if="resume" class="resume-paper">
          <header class="resume-header">
            <div class="header-info">
              <h1 class="name">{{ resume.basic_info?.name || '未填写姓名' }}</h1>
              <div class="info-row">
                <span v-if="resume.basic_info?.job_intention" class="job-intention">
                  <el-icon><Suitcase /></el-icon> {{ resume.basic_info.job_intention }}
                </span>
                <span v-if="resume.basic_info?.phone" class="info-item">
                  <el-icon><Phone /></el-icon> {{ resume.basic_info.phone }}
                </span>
                <span v-if="resume.basic_info?.email" class="info-item">
                  <el-icon><Message /></el-icon> {{ resume.basic_info.email }}
                </span>
              </div>
              <div class="info-row">
                <span v-if="resume.basic_info?.gender" class="info-item">
                  <el-icon><User /></el-icon> {{ resume.basic_info.gender }}
                </span>
                <span v-if="resume.basic_info?.birthday" class="info-item">
                  <el-icon><Calendar /></el-icon> {{ resume.basic_info.birthday }}
                </span>
                <span v-if="resume.basic_info?.address" class="info-item">
                  <el-icon><Location /></el-icon> {{ resume.basic_info.address }}
                </span>
                <span v-if="resume.basic_info?.work_years" class="info-item">
                  <el-icon><Clock /></el-icon> {{ resume.basic_info.work_years }}
                </span>
                <span v-if="resume.basic_info?.salary_expectation" class="info-item">
                  <el-icon><Money /></el-icon> {{ resume.basic_info.salary_expectation }}
                </span>
              </div>
            </div>
          </header>

          <section v-if="resume.basic_info?.self_evaluation" class="resume-section">
            <h3 class="section-title">自我评价</h3>
            <p class="section-content">{{ resume.basic_info.self_evaluation }}</p>
          </section>

          <section v-if="educationList.length > 0" class="resume-section">
            <h3 class="section-title">教育经历</h3>
            <div v-for="item in educationList" :key="item.id" class="experience-item">
              <div class="item-header">
                <span class="item-title">{{ item.school }}</span>
                <span class="item-date">{{ item.start_time }} - {{ item.end_time }}</span>
              </div>
              <div class="item-subtitle">
                {{ item.major }} · {{ item.degree }}
              </div>
              <p v-if="item.description" class="item-description">{{ item.description }}</p>
            </div>
          </section>

          <section v-if="workList.length > 0" class="resume-section">
            <h3 class="section-title">工作经历</h3>
            <div v-for="item in workList" :key="item.id" class="experience-item">
              <div class="item-header">
                <span class="item-title">{{ item.company }}</span>
                <span class="item-date">{{ item.start_time }} - {{ item.end_time }}</span>
              </div>
              <div class="item-subtitle">{{ item.position }}</div>
              <p v-if="item.description" class="item-description">{{ item.description }}</p>
            </div>
          </section>

          <section v-if="projectList.length > 0" class="resume-section">
            <h3 class="section-title">项目经验</h3>
            <div v-for="item in projectList" :key="item.id" class="experience-item">
              <div class="item-header">
                <span class="item-title">{{ item.name }}</span>
                <span class="item-date">{{ item.start_time }} - {{ item.end_time }}</span>
              </div>
              <div class="item-subtitle">
                角色：{{ item.role }}
                <span v-if="item.technologies"> · 技术栈：{{ item.technologies }}</span>
              </div>
              <p v-if="item.description" class="item-description">{{ item.description }}</p>
            </div>
          </section>

          <section v-if="skillList.length > 0" class="resume-section">
            <h3 class="section-title">技能特长</h3>
            <div class="skills-grid">
              <div v-for="item in skillList" :key="item.id" class="skill-item">
                <div class="skill-name">{{ item.name }}</div>
                <div class="skill-bar">
                  <div class="skill-fill" :style="{ width: item.level * 20 + '%' }"></div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <el-empty v-else description="加载中..." />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Download,
  Suitcase,
  Phone,
  Message,
  User,
  Calendar,
  Location,
  Clock,
  Money
} from '@element-plus/icons-vue'
import { resumeApi } from '@/api'
import type { ResumeDetail, ResumeEducation, ResumeWork, ResumeProject, ResumeSkill } from '@/types'

const route = useRoute()
const router = useRouter()
const resumeRef = ref<HTMLElement>()

const resumeId = ref<number>(parseInt(route.params.id as string))
const resume = ref<ResumeDetail | null>(null)
const educationList = ref<ResumeEducation[]>([])
const workList = ref<ResumeWork[]>([])
const projectList = ref<ResumeProject[]>([])
const skillList = ref<ResumeSkill[]>([])

const loadResumeDetail = async () => {
  try {
    const res = await resumeApi.getResumeDetail({ resume_id: resumeId.value })
    resume.value = res
    educationList.value = res.education_list || []
    workList.value = res.work_list || []
    projectList.value = res.project_list || []
    skillList.value = res.skill_list || []
  } catch (error) {
    console.error('Load resume detail error:', error)
  }
}

const goBack = () => {
  router.push(`/resume/edit/${resumeId.value}`)
}

const downloadPDF = async () => {
  try {
    await resumeApi.incrementDownload({ resume_id: resumeId.value })
    ElMessage.success('PDF下载功能开发中...')
  } catch (error) {
    console.error('Download PDF error:', error)
  }
}

onMounted(() => {
  loadResumeDetail()
})
</script>

<style scoped>
.resume-preview-page {
  min-height: 100vh;
  background: #f0f2f5;
}

.preview-header {
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

.title {
  font-size: 18px;
  margin: 0;
  color: #333;
}

.preview-container {
  padding: 30px 0;
  display: flex;
  justify-content: center;
}

.resume-content {
  width: 100%;
  max-width: 850px;
}

.resume-paper {
  background: #fff;
  padding: 60px 50px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  min-height: 1100px;
}

.resume-header {
  border-bottom: 2px solid #409eff;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.name {
  font-size: 32px;
  color: #333;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 8px;
}

.info-item,
.job-intention {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
}

.job-intention {
  color: #409eff;
  font-weight: 500;
}

.resume-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 18px;
  color: #333;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
  position: relative;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 60px;
  height: 2px;
  background: #409eff;
}

.section-content {
  color: #666;
  line-height: 1.8;
  font-size: 14px;
}

.experience-item {
  margin-bottom: 20px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.item-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.item-date {
  font-size: 14px;
  color: #999;
}

.item-subtitle {
  font-size: 14px;
  color: #409eff;
  margin-bottom: 8px;
}

.item-description {
  color: #666;
  line-height: 1.6;
  font-size: 14px;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.skill-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skill-name {
  width: 100px;
  font-size: 14px;
  color: #333;
  flex-shrink: 0;
}

.skill-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.skill-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #66b1ff);
  border-radius: 4px;
  transition: width 0.3s;
}

@media print {
  .preview-header {
    display: none;
  }
  
  .preview-container {
    padding: 0;
  }
  
  .resume-paper {
    box-shadow: none;
    padding: 40px;
  }
}
</style>
