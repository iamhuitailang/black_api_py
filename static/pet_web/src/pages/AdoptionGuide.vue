<template>
  <Layout>
    <div class="guide-page page-container">
      <h2 class="page-title">领养指南</h2>
      <el-card class="guide-card">
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in guideSteps"
            :key="index"
            :timestamp="item.title"
            :type="item.type"
          >
            <h4>{{ item.subtitle }}</h4>
            <p v-for="(text, i) in item.contents" :key="i">{{ text }}</p>
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <el-row :gutter="20" class="mt-20">
        <el-col :span="12">
          <el-card class="info-card">
            <template #header>
              <h3>领养条件</h3>
            </template>
            <ul class="info-list">
              <li>年满18周岁，具有完全民事行为能力</li>
              <li>有稳定的居住环境和经济来源</li>
              <li>了解宠物饲养知识，有足够的时间照顾宠物</li>
              <li>家庭成员同意饲养宠物</li>
              <li>承诺不虐待、不遗弃宠物</li>
              <li>愿意接受送养人的回访</li>
            </ul>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="info-card">
            <template #header>
              <h3>注意事项</h3>
            </template>
            <ul class="info-list">
              <li>请仔细阅读宠物信息，确保符合您的饲养条件</li>
              <li>线下见面请选择公共场所，注意人身安全</li>
              <li>领养前请与送养人充分沟通，了解宠物习性</li>
              <li>请按期为宠物接种疫苗、进行驱虫</li>
              <li>如遇困难请及时与送养人或平台联系</li>
              <li>文明养宠，遵守相关法律法规</li>
            </ul>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </Layout>
</template>

<script setup>
import Layout from '@/components/Layout.vue'

const guideSteps = [
  {
    title: '第一步',
    subtitle: '浏览宠物',
    type: 'primary',
    contents: ['在平台上浏览可领养的宠物', '根据您的喜好和条件筛选合适的宠物', '点击查看宠物详细信息']
  },
  {
    title: '第二步',
    subtitle: '申请领养',
    type: 'success',
    contents: ['点击"申请领养"按钮', '填写领养申请表单', '提交真实有效的个人信息']
  },
  {
    title: '第三步',
    subtitle: '等待审核',
    type: 'warning',
    contents: ['送养人会审核您的申请', '可能会与您联系进行沟通', '请保持电话畅通']
  },
  {
    title: '第四步',
    subtitle: '线下见面',
    type: 'info',
    contents: ['审核通过后约定见面时间地点', '当面了解宠物情况', '确认领养意向']
  },
  {
    title: '第五步',
    subtitle: '签署协议',
    type: 'primary',
    contents: ['签署领养协议', '明确双方权利义务', '完成领养手续']
  },
  {
    title: '第六步',
    subtitle: '带它回家',
    type: 'success',
    contents: ['准备好宠物生活用品', '给它一个温暖的家', '定期反馈宠物生活情况']
  }
]
</script>

<style scoped>
.guide-page {
  padding-top: 20px;
}

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #303133;
}

.guide-card {
  padding: 20px;
}

.info-card {
  height: 100%;
}

.info-card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-list li {
  padding: 8px 0;
  color: #606266;
  position: relative;
  padding-left: 20px;
}

.info-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #409eff;
  font-weight: bold;
}

.mt-20 {
  margin-top: 20px;
}
</style>
