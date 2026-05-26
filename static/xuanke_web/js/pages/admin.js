const AdminPage = {
    template: `
        <div class="page-container">
            <div class="page-card">
                <div class="page-title">系统仪表盘</div>
                
                <div class="admin-dashboard">
                    <div class="admin-stat-card">
                        <div class="admin-stat-icon" style="color: #409eff;">
                            <el-icon :size="36"><UserFilled /></el-icon>
                        </div>
                        <div class="admin-stat-value">{{ stats.total_students || 0 }}</div>
                        <div class="admin-stat-label">学生总数</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="admin-stat-icon" style="color: #67c23a;">
                            <el-icon :size="36"><Collection /></el-icon>
                        </div>
                        <div class="admin-stat-value">{{ stats.total_courses || 0 }}</div>
                        <div class="admin-stat-label">课程总数</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="admin-stat-icon" style="color: #e6a23c;">
                            <el-icon :size="36"><Document /></el-icon>
                        </div>
                        <div class="admin-stat-value">{{ stats.total_enrollments || 0 }}</div>
                        <div class="admin-stat-label">选课记录</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="admin-stat-icon" style="color: #f56c6c;">
                            <el-icon :size="36"><Star /></el-icon>
                        </div>
                        <div class="admin-stat-value">{{ stats.total_reviews || 0 }}</div>
                        <div class="admin-stat-label">课程评价</div>
                    </div>
                </div>
                
                <el-row :gutter="16">
                    <el-col :span="12">
                        <div class="page-card" style="box-shadow: none; border: 1px solid #e4e7ed;">
                            <div class="page-title" style="font-size: 16px;">选课时间线</div>
                            <div class="timeline">
                                <div 
                                    v-for="(phase, index) in phases" 
                                    :key="index"
                                    class="timeline-item"
                                    :class="{ active: currentPhase === phase.key }"
                                >
                                    <div class="timeline-date">{{ phase.time }}</div>
                                    <div class="timeline-title">{{ phase.name }}</div>
                                    <div class="timeline-desc">{{ phase.desc }}</div>
                                </div>
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="12">
                        <div class="page-card" style="box-shadow: none; border: 1px solid #e4e7ed;">
                            <div class="page-title" style="font-size: 16px;">选课规则</div>
                            <el-table :data="rules" border stripe size="small">
                                <el-table-column prop="rule_name" label="规则名称" width="140" />
                                <el-table-column prop="rule_value" label="规则值">
                                    <template #default="{ row }">
                                        <template v-if="typeof row.rule_value === 'boolean'">
                                            {{ row.rule_value ? '是' : '否' }}
                                        </template>
                                        <template v-else>{{ row.rule_value }}</template>
                                    </template>
                                </el-table-column>
                                <el-table-column label="操作" width="120">
                                    <template #default="{ row }">
                                        <el-button type="primary" link size="small" @click="editRule(row)">
                                            编辑
                                        </el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                    </el-col>
                </el-row>
            </div>
            
            <el-tabs v-model="activeTab" style="margin-top: 24px;">
                <el-tab-pane label="课程管理" name="courses">
                    <div class="page-card">
                        <div class="filter-bar">
                            <el-input 
                                v-model="courseFilter.keyword" 
                                placeholder="搜索课程..." 
                                clearable
                                style="width: 240px"
                            />
                            <el-button type="primary" @click="loadCourses">
                                <el-icon><Search /></el-icon> 搜索
                            </el-button>
                            <el-button type="success" @click="addCourse">
                                <el-icon><Plus /></el-icon> 新增课程
                            </el-button>
                            <el-button type="warning" @click="runLottery" v-if="currentPhase === 'preselection'">
                                <el-icon><Cpu /></el-icon> 执行抽签
                            </el-button>
                            <el-button type="primary" @click="setPhaseDialog">
                                <el-icon><Setting /></el-icon> 设置选课阶段
                            </el-button>
                        </div>
                        
                        <el-table :data="courses" border stripe>
                            <el-table-column prop="course_code" label="课程代码" width="120" />
                            <el-table-column prop="course_name" label="课程名称" min-width="180" />
                            <el-table-column prop="teacher" label="教师" width="120" />
                            <el-table-column prop="credits" label="学分" width="80" />
                            <el-table-column prop="max_students" label="人数上限" width="100" />
                            <el-table-column prop="enrolled_count" label="已选人数" width="100" />
                            <el-table-column prop="course_type_text" label="类型" width="80" />
                            <el-table-column prop="status_text" label="状态" width="80" />
                            <el-table-column label="操作" width="160">
                                <template #default="{ row }">
                                    <el-button type="primary" link size="small" @click="editCourse(row)">
                                        编辑
                                    </el-button>
                                    <el-button type="danger" link size="small" @click="deleteCourse(row)">
                                        删除
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        
                        <el-pagination
                            v-model:current-page="coursePagination.page"
                            v-model:page-size="coursePagination.page_size"
                            :total="coursePagination.total"
                            layout="total, prev, pager, next"
                            @current-change="loadCourses"
                            style="margin-top: 16px; justify-content: center; display: flex;"
                        />
                    </div>
                </el-tab-pane>
                
                <el-tab-pane label="学生管理" name="users">
                    <div class="page-card">
                        <div class="filter-bar">
                            <el-input 
                                v-model="userFilter.keyword" 
                                placeholder="搜索用户..." 
                                clearable
                                style="width: 240px"
                            />
                            <el-select v-model="userFilter.role" placeholder="角色" clearable style="width: 140px;">
                                <el-option label="学生" value="student" />
                                <el-option label="教师" value="teacher" />
                                <el-option label="管理员" value="admin" />
                            </el-select>
                            <el-button type="primary" @click="loadUsers">
                                <el-icon><Search /></el-icon> 搜索
                            </el-button>
                            <el-button type="success" @click="addUser">
                                <el-icon><Plus /></el-icon> 新增用户
                            </el-button>
                        </div>
                        
                        <el-table :data="users" border stripe>
                            <el-table-column prop="username" label="用户名" width="140" />
                            <el-table-column prop="real_name" label="姓名" width="120" />
                            <el-table-column prop="role_text" label="角色" width="100" />
                            <el-table-column prop="student_no" label="学号" width="120" />
                            <el-table-column prop="department" label="院系" width="140" />
                            <el-table-column prop="major" label="专业" width="140" />
                            <el-table-column prop="email" label="邮箱" width="180" />
                            <el-table-column prop="status_text" label="状态" width="100" />
                            <el-table-column label="操作" width="180">
                                <template #default="{ row }">
                                    <el-button type="primary" link size="small" @click="editUser(row)">
                                        编辑
                                    </el-button>
                                    <el-button 
                                        v-if="row.status === 0" 
                                        type="warning" 
                                        link 
                                        size="small" 
                                        @click="updateUserStatus(row, 1)"
                                    >
                                        禁用
                                    </el-button>
                                    <el-button 
                                        v-else 
                                        type="success" 
                                        link 
                                        size="small" 
                                        @click="updateUserStatus(row, 0)"
                                    >
                                        启用
                                    </el-button>
                                    <el-button type="danger" link size="small" @click="deleteUser(row)">
                                        删除
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        
                        <el-pagination
                            v-model:current-page="userPagination.page"
                            v-model:page-size="userPagination.page_size"
                            :total="userPagination.total"
                            layout="total, prev, pager, next"
                            @current-change="loadUsers"
                            style="margin-top: 16px; justify-content: center; display: flex;"
                        />
                    </div>
                </el-tab-pane>
                
                <el-tab-pane label="成绩录入" name="grades">
                    <div class="page-card">
                        <div class="filter-bar">
                            <el-select v-model="selectedCourseId" placeholder="选择课程" style="width: 300px;">
                                <el-option 
                                    v-for="course in teacherCourses" 
                                    :key="course.id" 
                                    :label="course.course_name + ' (' + course.course_code + ')'" 
                                    :value="course.id" 
                                />
                            </el-select>
                            <el-button type="primary" @click="loadCourseStudents">
                                <el-icon><Search /></el-icon> 查询
                            </el-button>
                            <el-button type="success" @click="batchInputGrades" :disabled="!selectedCourseId">
                                <el-icon><Upload /></el-icon> 批量录入
                            </el-button>
                        </div>
                        
                        <el-table :data="courseStudents" border stripe>
                            <el-table-column prop="student_no" label="学号" width="140" />
                            <el-table-column prop="real_name" label="姓名" width="120" />
                            <el-table-column prop="department" label="院系" width="140" />
                            <el-table-column prop="major" label="专业" width="140" />
                            <el-table-column label="成绩" width="200">
                                <template #default="{ row }">
                                    <el-input-number 
                                        v-model="row.scoreInput" 
                                        :min="0" 
                                        :max="100" 
                                        size="small"
                                        placeholder="输入成绩"
                                    />
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="120">
                                <template #default="{ row }">
                                    <el-button type="primary" link size="small" @click="inputGrade(row)">
                                        保存
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        
                        <el-empty v-if="courseStudents.length === 0" description="请先选择课程" />
                    </div>
                </el-tab-pane>
                
                <el-tab-pane label="评价管理" name="reviews">
                    <div class="page-card">
                        <el-table :data="allReviews" border stripe>
                            <el-table-column prop="course_name" label="课程名称" min-width="180" />
                            <el-table-column prop="user_name" label="评价用户" width="120" />
                            <el-table-column label="评分" width="120">
                                <template #default="{ row }">
                                    <el-rate v-model="row.rating" disabled show-score />
                                </template>
                            </el-table-column>
                            <el-table-column prop="comment" label="评价内容" min-width="300" />
                            <el-table-column prop="status" label="状态" width="100">
                                <template #default="{ row }">
                                    <el-tag 
                                        :type="row.status === 'approved' ? 'success' : (row.status === 'pending' ? 'warning' : 'danger')"
                                        size="small"
                                    >
                                        {{ row.status === 'approved' ? '已通过' : (row.status === 'pending' ? '待审核' : '已驳回') }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="200">
                                <template #default="{ row }">
                                    <el-button 
                                        v-if="row.status === 'pending'" 
                                        type="success" 
                                        link 
                                        size="small" 
                                        @click="updateReviewStatus(row, 'approved')"
                                    >
                                        通过
                                    </el-button>
                                    <el-button 
                                        v-if="row.status === 'pending'" 
                                        type="danger" 
                                        link 
                                        size="small" 
                                        @click="updateReviewStatus(row, 'rejected')"
                                    >
                                        驳回
                                    </el-button>
                                    <el-button type="danger" link size="small" @click="deleteReview(row)">
                                        删除
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </el-tab-pane>
            </el-tabs>
            
            <el-dialog v-model="courseDialogVisible" :title="editingCourse ? '编辑课程' : '新增课程'" width="600px">
                <el-form ref="courseFormRef" :model="courseForm" :rules="courseRules" label-width="100px">
                    <el-row :gutter="16">
                        <el-col :span="12">
                            <el-form-item label="课程代码" prop="course_code">
                                <el-input v-model="courseForm.course_code" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="课程名称" prop="course_name">
                                <el-input v-model="courseForm.course_name" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="授课教师" prop="teacher">
                                <el-input v-model="courseForm.teacher" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="课程类型" prop="course_type">
                                <el-select v-model="courseForm.course_type" style="width: 100%;">
                                    <el-option label="必修" value="required" />
                                    <el-option label="选修" value="elective" />
                                    <el-option label="通识" value="general" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="学分" prop="credits">
                                <el-input-number v-model="courseForm.credits" :min="1" :max="10" style="width: 100%;" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="学时" prop="hours">
                                <el-input-number v-model="courseForm.hours" :min="1" :max="200" style="width: 100%;" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="人数上限" prop="max_students">
                                <el-input-number v-model="courseForm.max_students" :min="1" :max="500" style="width: 100%;" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="上课时间" prop="schedule">
                                <el-input v-model="courseForm.schedule" placeholder="如：周一1-2节" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="上课地点" prop="location">
                                <el-input v-model="courseForm.location" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="课程简介">
                                <el-input v-model="courseForm.description" type="textarea" :rows="2" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
                <template #footer>
                    <el-button @click="courseDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="saveCourse" :loading="submitting">保存</el-button>
                </template>
            </el-dialog>
            
            <el-dialog v-model="userDialogVisible" :title="editingUser ? '编辑用户' : '新增用户'" width="600px">
                <el-form ref="userForm" :model="userForm" :rules="userRules" label-width="100px">
                    <el-row :gutter="16">
                        <el-col :span="12">
                            <el-form-item label="用户名" prop="username">
                                <el-input v-model="userForm.username" :disabled="!!editingUser" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="密码" prop="password">
                                <el-input v-model="userForm.password" type="password" show-password />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="真实姓名" prop="real_name">
                                <el-input v-model="userForm.real_name" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="角色" prop="role">
                                <el-select v-model="userForm.role" style="width: 100%;">
                                    <el-option label="学生" value="student" />
                                    <el-option label="教师" value="teacher" />
                                    <el-option label="管理员" value="admin" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col v-if="userForm.role === 'student'" :span="12">
                            <el-form-item label="学号">
                                <el-input v-model="userForm.student_no" />
                            </el-form-item>
                        </el-col>
                        <el-col v-if="userForm.role === 'teacher'" :span="12">
                            <el-form-item label="教师号">
                                <el-input v-model="userForm.teacher_no" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="院系">
                                <el-input v-model="userForm.department" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="专业">
                                <el-input v-model="userForm.major" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="邮箱">
                                <el-input v-model="userForm.email" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="手机号">
                                <el-input v-model="userForm.phone" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
                <template #footer>
                    <el-button @click="userDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="saveUser" :loading="submitting">保存</el-button>
                </template>
            </el-dialog>
            
            <el-dialog v-model="phaseDialogVisible" title="设置选课阶段" width="400px">
                <el-form label-width="100px">
                    <el-form-item label="当前阶段">
                        <el-select v-model="selectedPhase" style="width: 100%;">
                            <el-option 
                                v-for="phase in phases" 
                                :key="phase.key" 
                                :label="phase.name" 
                                :value="phase.key" 
                            />
                        </el-select>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="phaseDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="savePhase" :loading="submitting">保存</el-button>
                </template>
            </el-dialog>
            
            <el-dialog v-model="ruleDialogVisible" title="编辑规则" width="400px">
                <el-form label-width="100px">
                    <el-form-item :label="editingRule?.rule_name">
                        <el-switch v-if="typeof editingRule?.rule_value === 'boolean'" v-model="ruleValue" />
                        <el-input-number v-else-if="typeof editingRule?.rule_value === 'number'" v-model="ruleValue" :min="0" style="width: 100%;" />
                        <el-input v-else v-model="ruleValue" />
                    </el-form-item>
                    <el-form-item label="描述">
                        <div style="color: #909399; font-size: 13px;">{{ editingRule?.description }}</div>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="ruleDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="saveRule" :loading="submitting">保存</el-button>
                </template>
            </el-dialog>
        </div>
    `,
    setup() {
        const { ref, reactive, onMounted } = Vue;
        const { UserFilled, Collection, Document, Star, Search, Plus, Cpu, Setting, Upload } = ElementPlusIconsVue;

        const activeTab = ref('courses');
        const submitting = ref(false);
        const currentPhase = ref('regular');
        const selectedPhase = ref('regular');
        
        const stats = reactive({
            total_students: 0,
            total_courses: 0,
            total_enrollments: 0,
            total_reviews: 0
        });
        
        const phases = [
            { key: 'preselection', name: '预选阶段', desc: '选课，超过人数上限需抽签', time: '第1-7天' },
            { key: 'lottery', name: '抽签阶段', desc: '系统随机筛选', time: '第8天' },
            { key: 'regular', name: '正选阶段', desc: '先到先得', time: '第9-14天' },
            { key: 'add_drop', name: '补退选阶段', desc: '退课/补选', time: '第15-21天' },
            { key: 'closed', name: '选课结束', desc: '不可更改', time: '第22天起' }
        ];
        
        const rules = ref([]);
        const courses = ref([]);
        const users = ref([]);
        const allReviews = ref([]);
        const teacherCourses = ref([]);
        const courseStudents = ref([]);
        const selectedCourseId = ref(null);
        
        const courseFilter = reactive({ keyword: '' });
        const userFilter = reactive({ keyword: '', role: '' });
        
        const coursePagination = reactive({ page: 1, page_size: 10, total: 0 });
        const userPagination = reactive({ page: 1, page_size: 10, total: 0 });
        
        const courseDialogVisible = ref(false);
        const userDialogVisible = ref(false);
        const phaseDialogVisible = ref(false);
        const ruleDialogVisible = ref(false);
        
        const editingCourse = ref(null);
        const editingUser = ref(null);
        const editingRule = ref(null);
        const ruleValue = ref('');
        
        const courseForm = reactive({
            id: null,
            course_code: '',
            course_name: '',
            teacher: '',
            course_type: 'required',
            credits: 3,
            hours: 48,
            max_students: 50,
            schedule: '',
            location: '',
            description: ''
        });
        
        const userForm = reactive({
            id: null,
            username: '',
            password: '',
            real_name: '',
            role: 'student',
            student_no: '',
            teacher_no: '',
            department: '',
            major: '',
            email: '',
            phone: ''
        });
        
        const courseRules = {
            course_code: [{ required: true, message: '请输入课程代码', trigger: 'blur' }],
            course_name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
            teacher: [{ required: true, message: '请输入授课教师', trigger: 'blur' }],
            course_type: [{ required: true, message: '请选择课程类型', trigger: 'change' }],
            credits: [{ required: true, message: '请输入学分', trigger: 'change' }],
            hours: [{ required: true, message: '请输入学时', trigger: 'change' }],
            max_students: [{ required: true, message: '请输入人数上限', trigger: 'change' }],
            schedule: [{ required: true, message: '请输入上课时间', trigger: 'blur' }],
            location: [{ required: true, message: '请输入上课地点', trigger: 'blur' }]
        };
        
        const userRules = {
            username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
            password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
            real_name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
            role: [{ required: true, message: '请选择角色', trigger: 'change' }]
        };

        const loadStats = async () => {
            const response = await API.admin.getStatistics();
            if (response.code === 0) {
                Object.assign(stats, response.data);
            }
        };

        const loadRules = async () => {
            const response = await API.admin.getRules();
            if (response.code === 0) {
                rules.value = response.data;
            }
        };

        const loadPhase = async () => {
            const response = await API.enrollment.getPhase();
            if (response.code === 0) {
                currentPhase.value = response.data.phase;
                selectedPhase.value = response.data.phase;
            }
        };

        const loadCourses = async () => {
            const params = {
                page: coursePagination.page,
                page_size: coursePagination.page_size
            };
            if (courseFilter.keyword) params.keyword = courseFilter.keyword;
            
            const response = await API.course.getList(params);
            if (response.code === 0) {
                courses.value = response.data.items;
                coursePagination.total = response.data.total;
            }
        };

        const loadUsers = async () => {
            const params = {
                page: userPagination.page,
                page_size: userPagination.page_size
            };
            if (userFilter.keyword) params.keyword = userFilter.keyword;
            if (userFilter.role) params.role = userFilter.role;
            
            const response = await API.user.getList(params);
            if (response.code === 0) {
                users.value = response.data.items;
                userPagination.total = response.data.total;
            }
        };

        const loadTeacherCourses = async () => {
            const response = await API.course.getAll();
            if (response.code === 0) {
                teacherCourses.value = response.data;
            }
        };

        const loadCourseStudents = async () => {
            if (!selectedCourseId.value) {
                Toast.warning('请先选择课程');
                return;
            }
            const response = await API.enrollment.getCourseStudents(selectedCourseId.value);
            if (response.code === 0) {
                courseStudents.value = response.data.map(s => ({ ...s, scoreInput: s.score || null }));
            }
        };

        const loadReviews = async () => {
            const response = await API.review.getList({ page_size: 100 });
            if (response.code === 0) {
                allReviews.value = response.data.items;
            }
        };

        const addCourse = () => {
            editingCourse.value = null;
            Object.assign(courseForm, {
                id: null,
                course_code: '',
                course_name: '',
                teacher: '',
                course_type: 'required',
                credits: 3,
                hours: 48,
                max_students: 50,
                schedule: '',
                location: '',
                description: ''
            });
            courseDialogVisible.value = true;
        };

        const editCourse = (course) => {
            editingCourse.value = course;
            Object.assign(courseForm, {
                id: course.id,
                course_code: course.course_code,
                course_name: course.course_name,
                teacher: course.teacher,
                course_type: course.course_type,
                credits: course.credits,
                hours: course.hours,
                max_students: course.max_students,
                schedule: course.schedule,
                location: course.location,
                description: course.description
            });
            courseDialogVisible.value = true;
        };

        const courseFormRef = ref(null);
        
        const saveCourse = async () => {
            if (!courseFormRef.value) return;
            
            try {
                await courseFormRef.value.validate();
            } catch (e) {
                return;
            }
            
            submitting.value = true;
            try {
                let data = { ...courseForm };
                let response;
                if (editingCourse.value) {
                    response = await API.course.update(data);
                } else {
                    delete data.id;
                    response = await API.course.create(data);
                }
                
                if (response.code === 0) {
                    Toast.success(editingCourse.value ? '更新成功' : '创建成功');
                    courseDialogVisible.value = false;
                    loadCourses();
                    loadStats();
                } else {
                    Toast.error(response.msg);
                }
            } finally {
                submitting.value = false;
            }
        };

        const deleteCourse = async (course) => {
            try {
                await Toast.confirm(`确定要删除课程"${course.course_name}"吗？`);
            } catch (e) {
                return;
            }
            
            const response = await API.course.delete(course.id);
            if (response.code === 0) {
                Toast.success('删除成功');
                loadCourses();
                loadStats();
            } else {
                Toast.error(response.msg);
            }
        };

        const addUser = () => {
            editingUser.value = null;
            Object.assign(userForm, {
                id: null,
                username: '',
                password: '',
                real_name: '',
                role: 'student',
                student_no: '',
                teacher_no: '',
                department: '',
                major: '',
                email: '',
                phone: ''
            });
            userDialogVisible.value = true;
        };

        const editUser = (user) => {
            editingUser.value = user;
            Object.assign(userForm, {
                id: user.id,
                username: user.username,
                password: '',
                real_name: user.real_name,
                role: user.role,
                student_no: user.student_no,
                teacher_no: user.teacher_no,
                department: user.department,
                major: user.major,
                email: user.email,
                phone: user.phone
            });
            userDialogVisible.value = true;
        };

        const saveUser = async () => {
            submitting.value = true;
            try {
                const data = { ...userForm };
                let response;
                if (editingUser.value) {
                    response = await API.admin.updateUser(data);
                } else {
                    response = await API.admin.createUser(data);
                }
                
                if (response.code === 0) {
                    Toast.success(editingUser.value ? '更新成功' : '创建成功');
                    userDialogVisible.value = false;
                    loadUsers();
                    loadStats();
                } else {
                    Toast.error(response.msg);
                }
            } finally {
                submitting.value = false;
            }
        };

        const updateUserStatus = async (user, status) => {
            const data = { id: user.id, status: status };
            const response = await API.admin.updateUser(data);
            if (response.code === 0) {
                Toast.success('状态更新成功');
                loadUsers();
            } else {
                Toast.error(response.msg);
            }
        };

        const deleteUser = async (user) => {
            try {
                await Toast.confirm(`确定要删除用户"${user.username}"吗？`);
            } catch (e) {
                return;
            }
            
            const response = await API.admin.deleteUser(user.id);
            if (response.code === 0) {
                Toast.success('删除成功');
                loadUsers();
                loadStats();
            } else {
                Toast.error(response.msg);
            }
        };

        const inputGrade = async (student) => {
            if (student.scoreInput === null || student.scoreInput === undefined) {
                Toast.warning('请输入成绩');
                return;
            }
            
            if (!selectedCourseId.value) {
                Toast.warning('请先选择课程');
                return;
            }
            
            try {
                const data = {
                    user_id: student.student_id,
                    course_id: selectedCourseId.value,
                    score: student.scoreInput
                };
                
                const response = await API.grade.input(data);
                if (response.code === 0) {
                    Toast.success('成绩录入成功');
                    loadCourseStudents();
                } else {
                    Toast.error(response.msg);
                }
            } catch (error) {
                Toast.error('录入失败，请稍后重试');
            }
        };

        const batchInputGrades = async () => {
            const validStudents = courseStudents.value.filter(s => s.scoreInput !== null && s.scoreInput !== undefined);
            if (validStudents.length === 0) {
                Toast.warning('请先输入成绩');
                return;
            }
            
            if (!selectedCourseId.value) {
                Toast.warning('请先选择课程');
                return;
            }
            
            try {
                await Toast.confirm(`确定要批量录入${validStudents.length}名学生的成绩吗？`);
            } catch (e) {
                return;
            }
            
            try {
                const grades = validStudents.map(s => ({
                    user_id: s.student_id,
                    course_id: selectedCourseId.value,
                    score: s.scoreInput
                }));
                
                const response = await API.grade.batchInput({ grades });
                if (response.code === 0) {
                    Toast.success(response.msg || '批量录入成功');
                    loadCourseStudents();
                } else {
                    Toast.error(response.msg);
                }
            } catch (error) {
                Toast.error('批量录入失败，请稍后重试');
            }
        };

        const updateReviewStatus = async (review, status) => {
            const response = await API.review.updateStatus({ id: review.id, status });
            if (response.code === 0) {
                Toast.success('状态更新成功');
                loadReviews();
            } else {
                Toast.error(response.msg);
            }
        };

        const deleteReview = async (review) => {
            try {
                await Toast.confirm('确定要删除这条评价吗？');
            } catch (e) {
                return;
            }
            
            const response = await API.review.delete(review.id);
            if (response.code === 0) {
                Toast.success('删除成功');
                loadReviews();
                loadStats();
            } else {
                Toast.error(response.msg);
            }
        };

        const setPhaseDialog = () => {
            selectedPhase.value = currentPhase.value;
            phaseDialogVisible.value = true;
        };

        const savePhase = async () => {
            submitting.value = true;
            try {
                const response = await API.admin.setPhase(selectedPhase.value);
                if (response.code === 0) {
                    Toast.success('选课阶段设置成功');
                    currentPhase.value = selectedPhase.value;
                    phaseDialogVisible.value = false;
                } else {
                    Toast.error(response.msg);
                }
            } finally {
                submitting.value = false;
            }
        };

        const runLottery = async () => {
            try {
                await Toast.confirm('确定要执行抽签操作吗？这将对预选阶段超出人数上限的课程进行随机筛选。');
            } catch (e) {
                return;
            }
            
            const response = await API.admin.runLottery();
            if (response.code === 0) {
                Toast.success(response.msg || '抽签完成');
                loadCourses();
                loadStats();
            } else {
                Toast.error(response.msg);
            }
        };

        const editRule = (rule) => {
            editingRule.value = rule;
            ruleValue.value = rule.rule_value;
            ruleDialogVisible.value = true;
        };

        const saveRule = async () => {
            if (!editingRule.value) return;
            
            submitting.value = true;
            try {
                const response = await API.admin.updateRule({
                    id: editingRule.value.id,
                    rule_value: ruleValue.value
                });
                if (response.code === 0) {
                    Toast.success('规则更新成功');
                    ruleDialogVisible.value = false;
                    loadRules();
                } else {
                    Toast.error(response.msg);
                }
            } finally {
                submitting.value = false;
            }
        };

        onMounted(() => {
            if (!Auth.requireRole('admin')) return;
            loadStats();
            loadRules();
            loadPhase();
            loadCourses();
            loadUsers();
            loadTeacherCourses();
            loadReviews();
        });

        return {
            activeTab,
            submitting,
            currentPhase,
            selectedPhase,
            stats,
            phases,
            rules,
            courses,
            users,
            allReviews,
            teacherCourses,
            courseStudents,
            selectedCourseId,
            courseFilter,
            userFilter,
            coursePagination,
            userPagination,
            courseDialogVisible,
            userDialogVisible,
            phaseDialogVisible,
            ruleDialogVisible,
            editingCourse,
            editingUser,
            editingRule,
            ruleValue,
            courseForm,
            courseFormRef,
            userForm,
            courseRules,
            userRules,
            loadStats,
            loadRules,
            loadPhase,
            loadCourses,
            loadUsers,
            loadTeacherCourses,
            loadCourseStudents,
            loadReviews,
            addCourse,
            editCourse,
            saveCourse,
            deleteCourse,
            addUser,
            editUser,
            saveUser,
            updateUserStatus,
            deleteUser,
            inputGrade,
            batchInputGrades,
            updateReviewStatus,
            deleteReview,
            setPhaseDialog,
            savePhase,
            runLottery,
            editRule,
            saveRule,
            UserFilled,
            Collection,
            Document,
            Star,
            Search,
            Plus,
            Cpu,
            Setting,
            Upload
        };
    }
};
