const MyCoursesPage = {
    template: `
        <div class="page-container">
            <div class="credit-stats">
                <div class="credit-card">
                    <div class="credit-card-label">已选学分</div>
                    <div class="credit-card-value" :class="creditStatsClass">
                        {{ creditStats.current_credits }}
                    </div>
                </div>
                <div class="credit-card">
                    <div class="credit-card-label">最低学分要求</div>
                    <div class="credit-card-value">{{ creditStats.min_credits }}</div>
                </div>
                <div class="credit-card">
                    <div class="credit-card-label">最高学分限制</div>
                    <div class="credit-card-value">{{ creditStats.max_credits }}</div>
                </div>
                <div class="credit-card">
                    <div class="credit-card-label">剩余可选学分</div>
                    <div class="credit-card-value">{{ creditStats.remaining_credits }}</div>
                </div>
            </div>
            
            <div class="page-card" style="margin-bottom: 24px;">
                <div class="page-title">学分完成进度</div>
                
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>本学期已选学分</span>
                        <span>{{ creditStats.current_credits }} / {{ creditStats.min_credits }} 学分</span>
                    </div>
                    <div class="progress-bar">
                        <div 
                            class="progress-fill" 
                            :class="creditProgressClass"
                            :style="{ width: creditProgress + '%' }"
                        ></div>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>必修课完成度</span>
                        <span>{{ creditStats.required_enrolled }} / {{ creditStats.required_total }} 门</span>
                    </div>
                    <div class="progress-bar">
                        <div 
                            class="progress-fill success" 
                            :style="{ width: requiredProgress + '%' }"
                        ></div>
                    </div>
                </div>
                
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>通识课完成度</span>
                        <span>{{ creditStats.general_completed }} / {{ creditStats.general_required }} 门</span>
                    </div>
                    <div class="progress-bar">
                        <div 
                            class="progress-fill" 
                            :class="generalProgress >= 100 ? 'success' : 'warning'"
                            :style="{ width: Math.min(generalProgress, 100) + '%' }"
                        ></div>
                    </div>
                </div>
            </div>
            
            <div class="page-card">
                <div class="page-title">我的课表</div>
                
                <div class="view-toggle">
                    <el-radio-group v-model="viewMode" size="default">
                        <el-radio-button value="week">周视图</el-radio-button>
                        <el-radio-button value="list">列表视图</el-radio-button>
                        <el-radio-button value="calendar">日历视图</el-radio-button>
                    </el-radio-group>
                    
                    <el-button 
                        type="primary" 
                        size="small" 
                        @click="batchRequired"
                        v-if="canBatchRequired"
                    >
                        <el-icon><DocumentAdd /></el-icon> 一键选必修课
                    </el-button>
                </div>
                
                <div v-if="viewMode === 'week'">
                    <table class="schedule-table">
                        <thead>
                            <tr>
                                <th>节次</th>
                                <th>周一</th>
                                <th>周二</th>
                                <th>周三</th>
                                <th>周四</th>
                                <th>周五</th>
                                <th>周六</th>
                                <th>周日</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="period in periods" :key="period">
                                <td style="background: #f5f7fa; font-weight: 600;">
                                    第{{ period }}节
                                </td>
                                <td v-for="day in ['周一', '周二', '周三', '周四', '周五', '周六', '周日']" :key="day" class="schedule-cell">
                                    <div 
                                        v-for="course in getCoursesByTime(day, period)" 
                                        :key="course.id"
                                        class="schedule-course"
                                        :class="course.course_type"
                                    >
                                        <div style="font-weight: 600;">{{ course.course_name }}</div>
                                        <div style="opacity: 0.9;">{{ course.location }}</div>
                                        <div style="opacity: 0.8; font-size: 11px;">{{ course.teacher }}</div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div v-else-if="viewMode === 'list'" class="list-view">
                    <div v-for="course in myCourses" :key="course.id" class="list-item">
                        <div>
                            <el-tag :type="getCourseTypeTag(course.course_type)" size="small" style="margin-right: 8px;">
                                {{ course.course_type_text }}
                            </el-tag>
                            <span style="font-weight: 600; font-size: 16px;">{{ course.course_name }}</span>
                            <span style="color: #909399; margin-left: 8px;">({{ course.course_code }})</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 24px;">
                            <span style="color: #606266;">{{ course.teacher }}</span>
                            <span style="color: #606266;">{{ course.schedule }}</span>
                            <span style="color: #606266;">{{ course.location }}</span>
                            <span style="color: #409eff; font-weight: 600;">{{ course.credits }}学分</span>
                            <el-button 
                                type="danger" 
                                size="small" 
                                @click="drop(course)"
                                v-if="canDrop"
                            >
                                退课
                            </el-button>
                        </div>
                    </div>
                    <el-empty v-if="myCourses.length === 0" description="暂无已选课程" />
                </div>
                
                <div v-else class="calendar-view">
                    <div class="calendar-header">
                        <el-button-group>
                            <el-button @click="prevMonth">
                                <el-icon><ArrowLeft /></el-icon>
                            </el-button>
                            <el-button @click="nextMonth">
                                <el-icon><ArrowRight /></el-icon>
                            </el-button>
                        </el-button-group>
                        <h3>{{ currentMonth }}</h3>
                        <el-button @click="today">今天</el-button>
                    </div>
                    
                    <div class="calendar-grid">
                        <div class="calendar-day-header" v-for="d in ['一', '二', '三', '四', '五', '六', '日']" :key="d">
                            {{ d }}
                        </div>
                        <div 
                            v-for="(day, index) in calendarDays" 
                            :key="index"
                            class="calendar-day"
                            :class="{ weekend: day.isWeekend }"
                        >
                            <div class="calendar-day-number" :style="{ color: day.isCurrentMonth ? '#303133' : '#c0c4cc' }">
                                {{ day.day }}
                            </div>
                            <div v-for="course in day.courses" :key="course.id" class="calendar-event">
                                {{ course.course_name }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="page-card" style="margin-top: 24px;">
                <div class="page-title">已选课程列表</div>
                <el-table :data="myCourses" border stripe>
                    <el-table-column prop="course_code" label="课程代码" width="120" />
                    <el-table-column prop="course_name" label="课程名称" min-width="180" />
                    <el-table-column prop="course_type_text" label="类型" width="80" />
                    <el-table-column prop="teacher" label="授课教师" width="120" />
                    <el-table-column prop="credits" label="学分" width="80" />
                    <el-table-column prop="schedule" label="上课时间" width="140" />
                    <el-table-column prop="location" label="上课地点" width="140" />
                    <el-table-column prop="status_text" label="状态" width="100">
                        <template #default="{ row }">
                            <el-tag :type="row.status === 'enrolled' ? 'success' : 'info'" size="small">
                                {{ row.status_text }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="成绩" width="100">
                        <template #default="{ row }">
                            <span v-if="row.grade !== null" style="font-weight: 600;">
                                {{ row.grade }}
                            </span>
                            <span v-else style="color: #909399;">未考试</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="100" v-if="canDrop">
                        <template #default="{ row }">
                            <el-button type="danger" link size="small" @click="drop(row)">
                                退课
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>
    `,
    setup() {
        const { ref, reactive, computed, onMounted } = Vue;
        const { DocumentAdd, ArrowLeft, ArrowRight } = ElementPlusIconsVue;

        const myCourses = ref([]);
        const viewMode = ref('week');
        const canDrop = ref(true);
        const canBatchRequired = ref(true);
        
        const creditStats = reactive({
            current_credits: 0,
            min_credits: 12,
            max_credits: 28,
            remaining_credits: 28,
            required_enrolled: 0,
            required_total: 0,
            general_completed: 0,
            general_required: 4
        });
        
        const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        
        const currentDate = ref(new Date());
        const calendarDays = ref([]);
        
        const creditStatsClass = computed(() => {
            if (creditStats.current_credits < creditStats.min_credits) return 'warning';
            if (creditStats.current_credits > creditStats.max_credits) return 'danger';
            return 'success';
        });
        
        const creditProgress = computed(() => {
            return Math.min((creditStats.current_credits / creditStats.min_credits) * 100, 100);
        });
        
        const creditProgressClass = computed(() => {
            if (creditStats.current_credits < creditStats.min_credits) return 'warning';
            if (creditStats.current_credits > creditStats.max_credits) return 'danger';
            return 'success';
        });
        
        const requiredProgress = computed(() => {
            if (creditStats.required_total === 0) return 100;
            return Math.min((creditStats.required_enrolled / creditStats.required_total) * 100, 100);
        });
        
        const generalProgress = computed(() => {
            if (creditStats.general_required === 0) return 100;
            return (creditStats.general_completed / creditStats.general_required) * 100;
        });
        
        const currentMonth = computed(() => {
            return currentDate.value.getFullYear() + '年' + (currentDate.value.getMonth() + 1) + '月';
        });

        const getCourseTypeTag = (type) => {
            const map = {
                'required': 'danger',
                'elective': 'warning',
                'general': 'info'
            };
            return map[type] || 'info';
        };

        const getCoursesByTime = (day, period) => {
            return myCourses.value.filter(course => {
                if (!course.schedule) return false;
                return course.schedule.includes(day) && course.schedule.includes(period + '-');
            });
        };

        const generateCalendar = () => {
            const year = currentDate.value.getFullYear();
            const month = currentDate.value.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            
            const days = [];
            const startDay = firstDay.getDay() || 7;
            
            for (let i = startDay - 1; i > 0; i--) {
                const date = new Date(year, month, -i + 1);
                days.push({
                    day: date.getDate(),
                    isCurrentMonth: false,
                    isWeekend: date.getDay() === 0 || date.getDay() === 6,
                    date: date,
                    courses: []
                });
            }
            
            for (let i = 1; i <= lastDay.getDate(); i++) {
                const date = new Date(year, month, i);
                const dayOfWeek = date.getDay() || 7;
                const courses = dayOfWeek <= 5 ? getCoursesForDate(date) : [];
                days.push({
                    day: i,
                    isCurrentMonth: true,
                    isWeekend: date.getDay() === 0 || date.getDay() === 6,
                    date: date,
                    courses: courses
                });
            }
            
            const remainingDays = 42 - days.length;
            for (let i = 1; i <= remainingDays; i++) {
                const date = new Date(year, month + 1, i);
                days.push({
                    day: i,
                    isCurrentMonth: false,
                    isWeekend: date.getDay() === 0 || date.getDay() === 6,
                    date: date,
                    courses: []
                });
            }
            
            calendarDays.value = days;
        };

        const getCoursesForDate = (date) => {
            const dayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const dayName = dayMap[date.getDay()];
            return myCourses.value.filter(course => 
                course.schedule && course.schedule.includes(dayName)
            );
        };

        const prevMonth = () => {
            currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
            generateCalendar();
        };

        const nextMonth = () => {
            currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
            generateCalendar();
        };

        const today = () => {
            currentDate.value = new Date();
            generateCalendar();
        };

        const loadMyCourses = async () => {
            const response = await API.enrollment.getMyCourses();
            if (response.code === 0) {
                myCourses.value = response.data.courses || [];
                
                creditStats.current_credits = response.data.current_credits || 0;
                creditStats.min_credits = response.data.min_credits || 12;
                creditStats.max_credits = response.data.max_credits || 28;
                creditStats.remaining_credits = response.data.remaining_credits || 28;
                creditStats.required_enrolled = response.data.required_enrolled || 0;
                creditStats.required_total = response.data.required_total || 0;
                creditStats.general_completed = response.data.general_completed || 0;
                creditStats.general_required = response.data.general_required || 4;
                
                generateCalendar();
            }
        };

        const loadPhase = async () => {
            const response = await API.enrollment.getPhase();
            if (response.code === 0) {
                canDrop.value = response.data.can_drop;
                canBatchRequired.value = response.data.can_enroll;
            }
        };

        const batchRequired = async () => {
            try {
                await Toast.confirm('确定要一键选择所有未选的必修课吗？');
            } catch (e) {
                return;
            }
            
            const response = await API.enrollment.batchRequired();
            if (response.code === 0) {
                Toast.success(response.msg || '一键选课成功');
                loadMyCourses();
            } else {
                Toast.error(response.msg);
            }
        };

        const drop = async (course) => {
            try {
                await Toast.confirm(`确定要退选"${course.course_name}"吗？`);
            } catch (e) {
                return;
            }
            
            const response = await API.enrollment.drop(course.id);
            if (response.code === 0) {
                Toast.success('退课成功');
                loadMyCourses();
            } else {
                Toast.error(response.msg);
            }
        };

        onMounted(() => {
            if (!Auth.requireAuth()) return;
            loadMyCourses();
            loadPhase();
            generateCalendar();
        });

        return {
            myCourses,
            viewMode,
            canDrop,
            canBatchRequired,
            creditStats,
            periods,
            calendarDays,
            currentMonth,
            creditStatsClass,
            creditProgress,
            creditProgressClass,
            requiredProgress,
            generalProgress,
            getCourseTypeTag,
            getCoursesByTime,
            prevMonth,
            nextMonth,
            today,
            loadMyCourses,
            batchRequired,
            drop,
            DocumentAdd,
            ArrowLeft,
            ArrowRight
        };
    }
};
