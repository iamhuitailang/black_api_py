const GradesPage = {
    template: `
        <div class="page-container">
            <div class="gpa-card">
                <div class="gpa-label">本学期 GPA</div>
                <div class="gpa-value">{{ gpaData.semester_gpa || '0.00' }}</div>
                <div class="gpa-label" style="margin-top: 8px;">累计 GPA: {{ gpaData.cumulative_gpa || '0.00' }}</div>
            </div>
            
            <div class="page-card" style="margin-bottom: 24px;">
                <div class="page-title">成绩分析</div>
                
                <el-row :gutter="16">
                    <el-col :span="8">
                        <div class="stat-card">
                            <div class="stat-title">成绩统计</div>
                            <div class="stat-row">
                                <span>已修课程</span>
                                <span style="font-weight: 600;">{{ gpaData.total_courses || 0 }} 门</span>
                            </div>
                            <div class="stat-row">
                                <span>已获得学分</span>
                                <span style="font-weight: 600; color: #67c23a;">{{ gpaData.earned_credits || 0 }} 学分</span>
                            </div>
                            <div class="stat-row">
                                <span>平均成绩</span>
                                <span style="font-weight: 600; color: #409eff;">{{ gpaData.average_score || 0 }} 分</span>
                            </div>
                            <div class="stat-row">
                                <span>专业排名</span>
                                <span style="font-weight: 600; color: #e6a23c;">
                                    {{ gpaData.rank || '-' }} / {{ gpaData.total_students || '-' }}
                                </span>
                            </div>
                        </div>
                    </el-col>
                    
                    <el-col :span="8">
                        <div class="stat-card">
                            <div class="stat-title">成绩分布</div>
                            <div class="stat-row">
                                <span>优秀 (90-100)</span>
                                <el-tag type="success">{{ gradeDistribution.excellent || 0 }} 门</el-tag>
                            </div>
                            <div class="stat-row">
                                <span>良好 (80-89)</span>
                                <el-tag type="primary">{{ gradeDistribution.good || 0 }} 门</el-tag>
                            </div>
                            <div class="stat-row">
                                <span>中等 (70-79)</span>
                                <el-tag type="info">{{ gradeDistribution.medium || 0 }} 门</el-tag>
                            </div>
                            <div class="stat-row">
                                <span>及格 (60-69)</span>
                                <el-tag type="warning">{{ gradeDistribution.pass || 0 }} 门</el-tag>
                            </div>
                            <div class="stat-row">
                                <span>不及格 (<60)</span>
                                <el-tag type="danger">{{ gradeDistribution.fail || 0 }} 门</el-tag>
                            </div>
                        </div>
                    </el-col>
                    
                    <el-col :span="8">
                        <div class="stat-card">
                            <div class="stat-title">绩点对照表</div>
                            <table class="point-table">
                                <thead>
                                    <tr>
                                        <th>分数</th>
                                        <th>等级</th>
                                        <th>绩点</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in pointTable" :key="item.range">
                                        <td>{{ item.range }}</td>
                                        <td>{{ item.level }}</td>
                                        <td>{{ item.point }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </el-col>
                </el-row>
            </div>
            
            <div class="page-card">
                <div class="page-title">我的成绩</div>
                
                <div class="filter-bar">
                    <el-select v-model="filter.semester" placeholder="选择学期" clearable style="width: 200px;">
                        <el-option label="2025-2026学年第二学期" value="2025-2026-2" />
                        <el-option label="2025-2026学年第一学期" value="2025-2026-1" />
                        <el-option label="2024-2025学年第二学期" value="2024-2025-2" />
                    </el-select>
                    
                    <el-select v-model="filter.course_type" placeholder="课程类型" clearable style="width: 140px;">
                        <el-option label="必修" value="required" />
                        <el-option label="选修" value="elective" />
                        <el-option label="通识" value="general" />
                    </el-select>
                    
                    <el-button type="primary" @click="loadGrades">查询</el-button>
                </div>
                
                <el-table :data="filteredGrades" border stripe>
                    <el-table-column prop="course_code" label="课程代码" width="120" />
                    <el-table-column prop="course_name" label="课程名称" min-width="180" />
                    <el-table-column prop="course_type_text" label="类型" width="80">
                        <template #default="{ row }">
                            <el-tag :type="getCourseTypeTag(row.course_type)" size="small">
                                {{ row.course_type_text }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="credits" label="学分" width="80" />
                    <el-table-column prop="teacher" label="授课教师" width="120" />
                    <el-table-column label="成绩" width="140">
                        <template #default="{ row }">
                            <div v-if="row.score !== null">
                                <span 
                                    class="score-number" 
                                    :style="{ color: getScoreColor(row.score) }"
                                >
                                    {{ row.score }}
                                </span>
                                <el-tag 
                                    :type="getLevelTagType(row.level)" 
                                    size="small" 
                                    style="margin-left: 8px;"
                                >
                                    {{ row.level }}
                                </el-tag>
                            </div>
                            <el-tag v-else type="info" size="small">未考试</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="grade_point" label="绩点" width="80">
                        <template #default="{ row }">
                            <span v-if="row.grade_point !== null">{{ row.grade_point }}</span>
                            <span v-else style="color: #909399;">-</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="semester" label="学期" width="180" />
                    <el-table-column label="状态" width="100">
                        <template #default="{ row }">
                            <el-tag 
                                v-if="row.score !== null"
                                :type="row.score >= 60 ? 'success' : 'danger'" 
                                size="small"
                            >
                                {{ row.score >= 60 ? '已通过' : '未通过' }}
                            </el-tag>
                            <el-tag v-else type="info" size="small">进行中</el-tag>
                        </template>
                    </el-table-column>
                </el-table>
                
                <el-empty v-if="filteredGrades.length === 0" description="暂无成绩数据" />
            </div>
        </div>
    `,
    setup() {
        const { ref, reactive, computed, onMounted } = Vue;

        const grades = ref([]);
        const gpaData = reactive({
            semester_gpa: 0,
            cumulative_gpa: 0,
            total_courses: 0,
            earned_credits: 0,
            average_score: 0,
            rank: 0,
            total_students: 0
        });
        
        const gradeDistribution = reactive({
            excellent: 0,
            good: 0,
            medium: 0,
            pass: 0,
            fail: 0
        });
        
        const pointTable = ref([
            { range: '90-100', level: '优', point: '4.0' },
            { range: '80-89', level: '良', point: '3.0-3.9' },
            { range: '70-79', level: '中', point: '2.0-2.9' },
            { range: '60-69', level: '及格', point: '1.0-1.9' },
            { range: '<60', level: '不及格', point: '0' }
        ]);
        
        const filter = reactive({
            semester: '',
            course_type: ''
        });

        const filteredGrades = computed(() => {
            let result = grades.value;
            if (filter.semester) {
                result = result.filter(g => g.semester === filter.semester);
            }
            if (filter.course_type) {
                result = result.filter(g => g.course_type === filter.course_type);
            }
            return result;
        });

        const getCourseTypeTag = (type) => {
            const map = {
                'required': 'danger',
                'elective': 'warning',
                'general': 'info'
            };
            return map[type] || 'info';
        };

        const getScoreColor = (score) => {
            if (score >= 90) return '#67c23a';
            if (score >= 80) return '#409eff';
            if (score >= 70) return '#909399';
            if (score >= 60) return '#e6a23c';
            return '#f56c6c';
        };

        const getLevelTagType = (level) => {
            const map = {
                '优': 'success',
                '良': 'primary',
                '中': 'info',
                '及格': 'warning',
                '不及格': 'danger'
            };
            return map[level] || 'info';
        };

        const calculateGradeDistribution = () => {
            gradeDistribution.excellent = grades.value.filter(g => g.score >= 90).length;
            gradeDistribution.good = grades.value.filter(g => g.score >= 80 && g.score < 90).length;
            gradeDistribution.medium = grades.value.filter(g => g.score >= 70 && g.score < 80).length;
            gradeDistribution.pass = grades.value.filter(g => g.score >= 60 && g.score < 70).length;
            gradeDistribution.fail = grades.value.filter(g => g.score !== null && g.score < 60).length;
        };

        const loadGrades = async () => {
            const response = await API.grade.getMyGrades();
            if (response.code === 0) {
                grades.value = response.data.grades || [];
                
                gpaData.semester_gpa = response.data.semester_gpa || 0;
                gpaData.cumulative_gpa = response.data.cumulative_gpa || 0;
                gpaData.total_courses = grades.value.length;
                gpaData.earned_credits = response.data.earned_credits || 0;
                gpaData.average_score = response.data.average_score || 0;
                
                calculateGradeDistribution();
            }
        };

        const loadGpaRanking = async () => {
            const response = await API.grade.getGpaRanking();
            if (response.code === 0) {
                gpaData.rank = response.data.rank || 0;
                gpaData.total_students = response.data.total || 0;
            }
        };

        const loadPointTable = async () => {
            const response = await API.grade.getPointTable();
            if (response.code === 0 && response.data.length > 0) {
                pointTable.value = response.data;
            }
        };

        onMounted(() => {
            if (!Auth.requireAuth()) return;
            loadGrades();
            loadGpaRanking();
            loadPointTable();
        });

        return {
            grades,
            gpaData,
            gradeDistribution,
            pointTable,
            filter,
            filteredGrades,
            getCourseTypeTag,
            getScoreColor,
            getLevelTagType,
            loadGrades
        };
    }
};
