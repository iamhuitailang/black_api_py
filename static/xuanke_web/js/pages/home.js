const HomePage = {
    template: `
        <div class="page-container">
            <div class="page-card">
                <div class="page-title">课程列表</div>
                
                <div class="filter-bar">
                    <el-input 
                        v-model="filters.keyword" 
                        placeholder="搜索课程名称、代码、教师..." 
                        clearable
                        style="width: 240px"
                        @keyup.enter="loadCourses"
                    >
                        <template #prefix>
                            <el-icon><Search /></el-icon>
                        </template>
                    </el-input>
                    
                    <el-select v-model="filters.course_type" placeholder="课程类型" clearable style="width: 140px">
                        <el-option label="必修" value="required" />
                        <el-option label="选修" value="elective" />
                        <el-option label="通识" value="general" />
                    </el-select>
                    
                    <el-select v-model="filters.teacher" placeholder="授课教师" clearable style="width: 140px">
                        <el-option v-for="teacher in teachers" :key="teacher" :label="teacher" :value="teacher" />
                    </el-select>
                    
                    <el-select v-model="filters.credits" placeholder="学分" clearable style="width: 120px">
                        <el-option v-for="c in [1,2,3,4,5]" :key="c" :label="c + '学分'" :value="c" />
                    </el-select>
                    
                    <el-select v-model="filters.schedule" placeholder="上课时间" clearable style="width: 140px">
                        <el-option label="周一" value="周一" />
                        <el-option label="周二" value="周二" />
                        <el-option label="周三" value="周三" />
                        <el-option label="周四" value="周四" />
                        <el-option label="周五" value="周五" />
                    </el-select>
                    
                    <el-button type="primary" @click="loadCourses">
                        <el-icon><Search /></el-icon> 搜索
                    </el-button>
                    
                    <el-button @click="resetFilters">重置</el-button>
                </div>
                
                <el-timeline style="margin-bottom: 24px;">
                    <el-timeline-item
                        v-for="(phase, index) in phases"
                        :key="index"
                        :type="currentPhase === phase.key ? 'success' : (isPhasePast(phase.key) ? 'primary' : 'info')"
                    >
                        <template #dot>
                            <el-icon v-if="currentPhase === phase.key" color="#67c23a"><CircleCheckFilled /></el-icon>
                        </template>
                        <h4>{{ phase.name }}</h4>
                        <p>{{ phase.desc }}</p>
                        <p style="color: #909399; font-size: 12px;">{{ phase.time }}</p>
                    </el-timeline-item>
                </el-timeline>
                
                <div v-for="course in courses" :key="course.id" class="course-card">
                    <div class="course-header">
                        <div class="course-title">
                            <el-tag :type="getCourseTypeTag(course.course_type)" size="small">
                                {{ course.course_type_text }}
                            </el-tag>
                            {{ course.course_name }}
                            <span style="font-size: 14px; color: #909399;">({{ course.course_code }})</span>
                        </div>
                        <div>
                            <el-tag v-if="course.user_enrolled" type="success" size="small">已选</el-tag>
                            <el-tag v-else-if="course.status === 'full'" type="danger" size="small">已满</el-tag>
                            <el-tag v-else-if="course.status === 'open'" type="success" size="small">可选</el-tag>
                            <el-tag v-else type="info" size="small">关闭</el-tag>
                        </div>
                    </div>
                    
                    <div class="course-meta">
                        <span class="course-meta-item">
                            <el-icon><User /></el-icon>
                            {{ course.teacher }}
                        </span>
                        <span class="course-meta-item">
                            <el-icon><Collection /></el-icon>
                            {{ course.credits }}学分 / {{ course.hours }}学时
                        </span>
                        <span class="course-meta-item">
                            <el-icon><Calendar /></el-icon>
                            {{ course.schedule }}
                        </span>
                        <span class="course-meta-item">
                            <el-icon><Location /></el-icon>
                            {{ course.location }}
                        </span>
                        <span class="course-meta-item">
                            <el-icon><UserFilled /></el-icon>
                            {{ course.enrolled_count }}/{{ course.max_students }}人
                        </span>
                    </div>
                    
                    <div class="course-desc">{{ course.description }}</div>
                    
                    <div class="course-footer">
                        <div>
                            <el-button type="primary" link @click="showDetail(course)">
                                <el-icon><View /></el-icon> 查看详情
                            </el-button>
                            <el-button type="primary" link @click="showReviews(course)" v-if="course.review_count > 0">
                                <el-icon><ChatDotRound /></el-icon> 评价({{ course.review_count }})
                            </el-button>
                        </div>
                        <div>
                            <el-button 
                                v-if="!course.user_enrolled && canEnroll && course.status === 'open'"
                                type="primary" 
                                @click="enroll(course)"
                            >
                                <el-icon><Plus /></el-icon> 选课
                            </el-button>
                            <el-button 
                                v-if="course.user_enrolled && canDrop"
                                type="danger" 
                                @click="drop(course)"
                            >
                                <el-icon><Delete /></el-icon> 退课
                            </el-button>
                            <el-button 
                                v-if="!canEnroll && !course.user_enrolled"
                                type="info" 
                                disabled
                            >
                                选课已结束
                            </el-button>
                        </div>
                    </div>
                </div>
                
                <el-pagination
                    v-model:current-page="pagination.page"
                    v-model:page-size="pagination.page_size"
                    :total="pagination.total"
                    :page-sizes="[10, 20, 50]"
                    layout="total, sizes, prev, pager, next, jumper"
                    @size-change="loadCourses"
                    @current-change="loadCourses"
                    style="margin-top: 24px; justify-content: center; display: flex;"
                />
            </div>
            
            <el-dialog v-model="detailVisible" title="课程详情" width="600px">
                <div v-if="selectedCourse">
                    <h3 style="margin-bottom: 16px;">{{ selectedCourse.course_name }} ({{ selectedCourse.course_code }})</h3>
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="授课教师">{{ selectedCourse.teacher }}</el-descriptions-item>
                        <el-descriptions-item label="课程类型">{{ selectedCourse.course_type_text }}</el-descriptions-item>
                        <el-descriptions-item label="学分">{{ selectedCourse.credits }}</el-descriptions-item>
                        <el-descriptions-item label="学时">{{ selectedCourse.hours }}</el-descriptions-item>
                        <el-descriptions-item label="上课时间">{{ selectedCourse.schedule }}</el-descriptions-item>
                        <el-descriptions-item label="上课地点">{{ selectedCourse.location }}</el-descriptions-item>
                        <el-descriptions-item label="人数限制">{{ selectedCourse.max_students }}</el-descriptions-item>
                        <el-descriptions-item label="已选人数">{{ selectedCourse.enrolled_count }}</el-descriptions-item>
                    </el-descriptions>
                    
                    <div style="margin-top: 16px;">
                        <h4>课程简介</h4>
                        <p>{{ selectedCourse.description }}</p>
                    </div>
                    
                    <div style="margin-top: 16px;">
                        <h4>课程大纲</h4>
                        <p>{{ selectedCourse.syllabus }}</p>
                    </div>
                    
                    <div style="margin-top: 16px;">
                        <h4>考核方式</h4>
                        <p>{{ selectedCourse.assessment }}</p>
                    </div>
                    
                    <div style="margin-top: 16px;">
                        <h4>参考教材</h4>
                        <p>{{ selectedCourse.textbook }}</p>
                    </div>
                    
                    <div v-if="selectedCourse.prerequisites" style="margin-top: 16px;">
                        <h4>先修课程</h4>
                        <p>{{ selectedCourse.prerequisites }}</p>
                    </div>
                </div>
            </el-dialog>
            
            <el-dialog v-model="reviewsVisible" title="课程评价" width="600px">
                <div v-if="selectedCourse">
                    <div v-if="courseReviews.length > 0">
                        <div v-for="review in courseReviews" :key="review.id" class="review-card">
                            <div class="review-header">
                                <div class="review-user">
                                    <el-avatar :size="40">{{ review.anonymous ? '匿' : review.user_name?.charAt(0) }}</el-avatar>
                                    <div>
                                        <div style="font-weight: 600;">
                                            {{ review.anonymous ? '匿名用户' : review.user_name }}
                                        </div>
                                        <el-rate v-model="review.rating" disabled show-score style="font-size: 12px;" />
                                    </div>
                                </div>
                                <div style="color: #909399; font-size: 12px;">
                                    {{ formatDate(review.created_at) }}
                                </div>
                            </div>
                            <div class="review-content">{{ review.comment }}</div>
                        </div>
                    </div>
                    <el-empty v-else description="暂无评价" />
                </div>
            </el-dialog>
        </div>
    `,
    setup() {
        const { ref, reactive, onMounted } = Vue;
        const { Search, User, Collection, Calendar, Location, UserFilled, Plus, Delete, View, ChatDotRound, CircleCheckFilled } = ElementPlusIconsVue;

        const courses = ref([]);
        const teachers = ref([]);
        const filters = reactive({
            keyword: '',
            course_type: '',
            teacher: '',
            credits: null,
            schedule: ''
        });
        
        const pagination = reactive({
            page: 1,
            page_size: 10,
            total: 0
        });
        
        const detailVisible = ref(false);
        const reviewsVisible = ref(false);
        const selectedCourse = ref(null);
        const courseReviews = ref([]);
        
        const currentPhase = ref('regular');
        const canEnroll = ref(true);
        const canDrop = ref(true);
        
        const phases = [
            { key: 'preselection', name: '预选阶段', desc: '选课，超过人数上限需抽签', time: '第1-7天' },
            { key: 'lottery', name: '抽签阶段', desc: '系统随机筛选', time: '第8天' },
            { key: 'regular', name: '正选阶段', desc: '先到先得', time: '第9-14天' },
            { key: 'add_drop', name: '补退选阶段', desc: '退课/补选', time: '第15-21天' },
            { key: 'closed', name: '选课结束', desc: '不可更改', time: '第22天起' }
        ];

        const isPhasePast = (phaseKey) => {
            const order = ['preselection', 'lottery', 'regular', 'add_drop', 'closed'];
            return order.indexOf(phaseKey) < order.indexOf(currentPhase.value);
        };

        const getCourseTypeTag = (type) => {
            const map = {
                'required': 'danger',
                'elective': 'warning',
                'general': 'info'
            };
            return map[type] || 'info';
        };

        const loadCourses = async () => {
            const params = {
                page: pagination.page,
                page_size: pagination.page_size
            };
            if (filters.keyword) params.keyword = filters.keyword;
            if (filters.course_type) params.course_type = filters.course_type;
            if (filters.teacher) params.teacher = filters.teacher;
            if (filters.credits) params.credits = filters.credits;
            if (filters.schedule) params.schedule = filters.schedule;
            
            const response = await API.course.getList(params);
            if (response.code === 0) {
                courses.value = response.data.items;
                pagination.total = response.data.total;
            }
        };

        const loadTeachers = async () => {
            const response = await API.course.getTeachers();
            if (response.code === 0) {
                teachers.value = response.data;
            }
        };

        const loadPhase = async () => {
            const response = await API.enrollment.getPhase();
            if (response.code === 0) {
                currentPhase.value = response.data.phase;
                canEnroll.value = response.data.can_enroll;
                canDrop.value = response.data.can_drop;
            }
        };

        const resetFilters = () => {
            filters.keyword = '';
            filters.course_type = '';
            filters.teacher = '';
            filters.credits = null;
            filters.schedule = '';
            pagination.page = 1;
            loadCourses();
        };

        const showDetail = (course) => {
            selectedCourse.value = course;
            detailVisible.value = true;
        };

        const showReviews = async (course) => {
            selectedCourse.value = course;
            const response = await API.review.getCourseReviews(course.id);
            if (response.code === 0) {
                courseReviews.value = response.data;
            }
            reviewsVisible.value = true;
        };

        const enroll = async (course) => {
            try {
                await Toast.confirm(`确定要选择"${course.course_name}"吗？`);
            } catch (e) {
                return;
            }
            
            const response = await API.enrollment.enroll(course.id);
            if (response.code === 0) {
                Toast.success('选课成功');
                course.user_enrolled = true;
                course.enrolled_count++;
                if (course.enrolled_count >= course.max_students) {
                    course.status = 'full';
                }
            } else {
                Toast.error(response.msg);
            }
        };

        const drop = async (course) => {
            try {
                await Toast.confirm(`确定要退选"${course.course_name}"吗？退课后名额将释放给其他同学。`);
            } catch (e) {
                return;
            }
            
            const response = await API.enrollment.drop(course.id);
            if (response.code === 0) {
                Toast.success('退课成功');
                course.user_enrolled = false;
                course.enrolled_count--;
                if (course.enrolled_count < course.max_students) {
                    course.status = 'open';
                }
            } else {
                Toast.error(response.msg);
            }
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            return dateStr.replace('T', ' ').substring(0, 16);
        };

        onMounted(() => {
            if (!Auth.requireAuth()) return;
            loadCourses();
            loadTeachers();
            loadPhase();
        });

        return {
            courses,
            teachers,
            filters,
            pagination,
            detailVisible,
            reviewsVisible,
            selectedCourse,
            courseReviews,
            currentPhase,
            canEnroll,
            canDrop,
            phases,
            isPhasePast,
            getCourseTypeTag,
            loadCourses,
            resetFilters,
            showDetail,
            showReviews,
            enroll,
            drop,
            formatDate,
            Search,
            User,
            Collection,
            Calendar,
            Location,
            UserFilled,
            Plus,
            Delete,
            View,
            ChatDotRound,
            CircleCheckFilled
        };
    }
};
