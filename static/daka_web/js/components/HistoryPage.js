(function() {
const { ref, onMounted, computed } = Vue;

const HistoryPage = {
    template: `
        <div class="history-page">
            <div class="card">
                <div class="calendar-header">
                    <div class="calendar-nav">
                        <button @click="prevMonth">‹</button>
                        <span class="calendar-title">{{ currentYear }}年{{ currentMonth }}月</span>
                        <button @click="nextMonth">›</button>
                    </div>
                </div>

                <div class="calendar-grid">
                    <div v-for="day in weekdays" :key="day" class="calendar-weekday">{{ day }}</div>
                    <template v-for="(week, weekIndex) in calendarDays" :key="weekIndex">
                        <div 
                            v-for="(day, dayIndex) in week" 
                            :key="dayIndex"
                            class="calendar-day"
                            :class="{
                                empty: !day.date,
                                today: day.isToday,
                                'has-record': day.recordCount > 0,
                                ['level-' + day.level]: day.level > 0
                            }"
                            @click="day.date && selectDate(day.date)"
                        >
                            <span v-if="day.date" class="day-number">{{ day.day }}</span>
                            <span v-if="day.recordCount > 0" class="completion-dot"></span>
                        </div>
                    </template>
                </div>
            </div>

            <div class="card">
                <div class="card-title">打卡热力图（最近6个月）</div>
                <div class="heatmap-container">
                    <div class="heatmap">
                        <div v-for="(week, weekIndex) in heatmapData" :key="weekIndex" class="heatmap-week">
                            <div 
                                v-for="(day, dayIndex) in week" 
                                :key="dayIndex"
                                class="heatmap-day"
                                :class="'level-' + day.level"
                                :title="day.date + ': ' + day.count + '次打卡'"
                            ></div>
                        </div>
                    </div>
                </div>
                <div class="heatmap-legend">
                    <span>少</span>
                    <div class="heatmap-day level-1"></div>
                    <div class="heatmap-day level-2"></div>
                    <div class="heatmap-day level-3"></div>
                    <div class="heatmap-day level-4"></div>
                    <span>多</span>
                </div>
            </div>

            <div class="card">
                <div class="card-title">{{ selectedDateText }}打卡记录</div>
                
                <div v-if="loadingRecords" class="empty-state">
                    <div class="empty-icon">⏳</div>
                    <div class="empty-text">加载中...</div>
                </div>
                
                <div v-else-if="!selectedDateRecords.length" class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">当天暂无打卡记录</div>
                </div>
                
                <div v-else>
                    <div v-for="record in selectedDateRecords" :key="record.id" class="history-record">
                        <div class="history-icon">{{ record.task_icon }}</div>
                        <div class="history-content">
                            <div class="history-task-name">{{ record.task_name }}</div>
                            <div class="history-meta">
                                {{ record.checkin_time }} · 
                                {{ record.current_value }}{{ record.unit }}
                                <span v-if="record.streak_days > 0"> · 🔥{{ record.streak_days }}天</span>
                                <span v-if="record.points_earned > 0"> · +{{ record.points_earned }}积分</span>
                            </div>
                        </div>
                        <div 
                            class="history-status"
                            :class="record.is_completed ? 'completed' : 'partial'"
                        >
                            {{ record.is_completed ? '已完成' : '进行中' }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const now = new Date();
        const currentYear = ref(now.getFullYear());
        const currentMonth = ref(now.getMonth() + 1);
        const selectedDate = ref(formatDate(now));
        const calendarDays = ref([]);
        const heatmapData = ref([]);
        const selectedDateRecords = ref([]);
        const loadingRecords = ref(false);

        function formatDate(date) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        const selectedDateText = computed(() => {
            const today = formatDate(new Date());
            if (selectedDate.value === today) {
                return '今天';
            }
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (selectedDate.value === formatDate(yesterday)) {
                return '昨天';
            }
            const parts = selectedDate.value.split('-');
            return `${parts[1]}月${parts[2]}日`;
        });

        const generateCalendar = async () => {
            const year = currentYear.value;
            const month = currentMonth.value - 1;
            
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startWeekday = firstDay.getDay();
            const daysInMonth = lastDay.getDate();
            
            const today = new Date();
            const todayStr = formatDate(today);
            
            const result = await Api.record.getCalendar(year, month + 1);
            const calendarData = {};
            if (result.code === 0 && result.data.calendar) {
                result.data.calendar.forEach(item => {
                    calendarData[item.date] = item;
                });
            }

            const weeks = [];
            let currentWeek = [];
            
            for (let i = 0; i < startWeekday; i++) {
                currentWeek.push({ date: null });
            }
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const record = calendarData[dateStr] || {};
                const recordCount = record.completed_count || 0;
                const totalCount = record.total_count || 1;
                const ratio = recordCount / totalCount;
                let level = 0;
                if (ratio > 0) level = 1;
                if (ratio >= 0.25) level = 2;
                if (ratio >= 0.5) level = 3;
                if (ratio >= 0.75) level = 4;

                currentWeek.push({
                    date: dateStr,
                    day,
                    isToday: dateStr === todayStr,
                    recordCount,
                    level
                });
                
                if (currentWeek.length === 7) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                }
            }
            
            if (currentWeek.length > 0) {
                while (currentWeek.length < 7) {
                    currentWeek.push({ date: null });
                }
                weeks.push(currentWeek);
            }
            
            calendarDays.value = weeks;
        };

        const loadHeatmap = async () => {
            try {
                const result = await Api.record.getHeatmap(6);
                if (result.code === 0) {
                    const heatmap = result.data.heatmap || {};
                    const startDate = new Date(result.data.start_date);
                    const endDate = new Date(result.data.end_date);
                    
                    const weeks = [];
                    let currentWeek = [];
                    
                    const current = new Date(startDate);
                    while (current.getDay() !== 0) {
                        current.setDate(current.getDate() - 1);
                    }
                    
                    while (current <= endDate || currentWeek.length > 0) {
                        const dateStr = formatDate(current);
                        const count = heatmap[dateStr] || 0;
                        let level = 0;
                        if (count > 0) level = 1;
                        if (count >= 2) level = 2;
                        if (count >= 4) level = 3;
                        if (count >= 6) level = 4;
                        
                        currentWeek.push({
                            date: dateStr,
                            count,
                            level
                        });
                        
                        if (currentWeek.length === 7) {
                            weeks.push(currentWeek);
                            currentWeek = [];
                            if (current > endDate) break;
                        }
                        
                        current.setDate(current.getDate() + 1);
                    }
                    
                    heatmapData.value = weeks;
                }
            } catch (e) {
                console.error(e);
            }
        };

        const loadDateRecords = async () => {
            if (!selectedDate.value) return;
            
            loadingRecords.value = true;
            try {
                const result = await Api.record.getHistory(1, 100);
                if (result.code === 0) {
                    selectedDateRecords.value = result.data.items.filter(
                        item => item.checkin_date === selectedDate.value
                    );
                }
            } catch (e) {
                console.error(e);
            } finally {
                loadingRecords.value = false;
            }
        };

        const prevMonth = () => {
            if (currentMonth.value === 1) {
                currentMonth.value = 12;
                currentYear.value--;
            } else {
                currentMonth.value--;
            }
            generateCalendar();
        };

        const nextMonth = () => {
            if (currentMonth.value === 12) {
                currentMonth.value = 1;
                currentYear.value++;
            } else {
                currentMonth.value++;
            }
            generateCalendar();
        };

        const selectDate = (date) => {
            selectedDate.value = date;
            loadDateRecords();
        };

        onMounted(() => {
            generateCalendar();
            loadHeatmap();
            loadDateRecords();
        });

        return {
            weekdays,
            currentYear,
            currentMonth,
            calendarDays,
            heatmapData,
            selectedDate,
            selectedDateText,
            selectedDateRecords,
            loadingRecords,
            prevMonth,
            nextMonth,
            selectDate
        };
    }
};

window.HistoryPage = HistoryPage;
})();
