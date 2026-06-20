const CalendarPage = {
    currentWeekStart: null,
    courses: [],
    HOUR_START: 8,
    HOUR_END: 22,

    async render() {
        if (!AuthService.requireAuth()) return;

        if (!this.currentWeekStart) {
            this.currentWeekStart = this.getMonday(new Date());
        }

        CommonLayout.render(`
            <div class="page-header">
                <div class="flex-between">
                    <div>
                        <div class="page-title">课程日历</div>
                        <div class="page-subtitle">查看并管理您的课程安排</div>
                    </div>
                    <button class="btn btn-primary" id="btn-add-course">+ 新增课程</button>
                </div>
            </div>
            <div id="calendar-content">
                <div class="text-center" style="padding: 60px;"><span class="loading"></span> 加载中...</div>
            </div>
        `, 'calendar', '课程日历');

        document.getElementById('btn-add-course').addEventListener('click', () => this.showAddCourseModal());

        await this.loadWeekCourses();
    },

    getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    getWeekDates() {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(this.currentWeekStart);
            d.setDate(d.getDate() + i);
            dates.push(d);
        }
        return dates;
    },

    getWeekLabel() {
        const dates = this.getWeekDates();
        const start = dates[0];
        const end = dates[6];
        const sameMonth = start.getMonth() === end.getMonth();
        if (sameMonth) {
            return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日 - ${end.getDate()}日`;
        }
        return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
    },

    async loadWeekCourses() {
        const dates = this.getWeekDates();
        const weekStart = this.formatDate(dates[0]);
        const weekEnd = this.formatDate(dates[6]);

        try {
            const result = await TutorService.getWeekCourses(weekStart, weekEnd);
            if (result.code === 0) {
                this.courses = result.data || [];
            }
        } catch (e) {}

        this.renderCalendar();
    },

    renderCalendar() {
        const weekDates = this.getWeekDates();
        const weekLabel = this.getWeekLabel();
        const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const todayStr = this.formatDate(new Date());
        const user = AuthService.getUser();
        const role = user && user.profile ? user.profile.role : 'parent';

        let timeSlotsHtml = '';
        for (let h = this.HOUR_START; h < this.HOUR_END; h++) {
            const timeLabel = `${String(h).padStart(2, '0')}:00`;
            timeSlotsHtml += `<div class="calendar-time-slot">${timeLabel}</div>`;
        }

        let weekDaysHtml = '';
        weekDates.forEach((date, idx) => {
            const dateStr = this.formatDate(date);
            const isToday = dateStr === todayStr;

            let cellsHtml = '';
            for (let h = this.HOUR_START; h < this.HOUR_END; h++) {
                cellsHtml += `<div class="calendar-cell" data-date="${dateStr}" data-hour="${h}"></div>`;
            }

            const dayCourses = this.courses.filter(c => c.course_date === dateStr);

            let eventsHtml = '';
            dayCourses.forEach(course => {
                const [startH, startM] = course.start_time.split(':').map(Number);
                const [endH, endM] = course.end_time.split(':').map(Number);
                const topMinutes = (startH - this.HOUR_START) * 60 + startM;
                const durationMinutes = (endH - startH) * 60 + (endM - startM);
                const top = (topMinutes / 60) * 60;
                const height = Math.max((durationMinutes / 60) * 60 - 4, 28);

                if (top < 0) return;

                const personName = role === 'parent'
                    ? (course.teacher_name || course.teacher_username || '')
                    : (course.parent_name || course.parent_username || '');

                eventsHtml += `
                    <div class="calendar-event ${course.status}"
                         style="top: ${top}px; height: ${height}px;"
                         onclick="CalendarPage.showCourseDetail(${course.id})">
                        <div class="event-title">${course.subject}</div>
                        <div class="event-time">${course.start_time}-${course.end_time}</div>
                        <div class="event-person">${personName}</div>
                    </div>
                `;
            });

            weekDaysHtml += `
                <div class="calendar-day-col">
                    <div class="calendar-day-header ${isToday ? 'today' : ''}">
                        <div class="day-name">${dayNames[idx]}</div>
                        <div class="day-date">${date.getDate()}</div>
                    </div>
                    <div style="position: relative;">
                        ${cellsHtml}
                        ${eventsHtml}
                    </div>
                </div>
            `;
        });

        const html = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <div class="calendar-nav">
                        <button onclick="CalendarPage.prevWeek()" title="上一周">‹</button>
                        <div class="calendar-title">${weekLabel}</div>
                        <button onclick="CalendarPage.nextWeek()" title="下一周">›</button>
                    </div>
                    <div class="gap-2" style="display: flex;">
                        <button class="btn btn-sm btn-secondary" onclick="CalendarPage.goToday()">今天</button>
                    </div>
                </div>
                <div class="week-view">
                    <div class="calendar-grid">
                        <div class="calendar-time-col">
                            <div class="calendar-day-header"></div>
                            ${timeSlotsHtml}
                        </div>
                        ${weekDaysHtml}
                    </div>
                </div>
            </div>

            ${this.courses.length === 0 ? `
                <div class="card mt-3">
                    <div class="card-body">
                        <div class="empty-state">
                            <div class="icon">📅</div>
                            <p>本周暂无课程安排</p>
                            <p class="hint">点击"新增课程"添加您的第一个课程</p>
                            <div class="mt-2">
                                <button class="btn btn-primary" onclick="CalendarPage.showAddCourseModal()">新增课程</button>
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;

        document.getElementById('calendar-content').innerHTML = html;

        document.querySelectorAll('.calendar-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const date = cell.dataset.date;
                const hour = parseInt(cell.dataset.hour);
                this.showAddCourseModal({
                    date,
                    startTime: `${String(hour).padStart(2, '0')}:00`,
                    endTime: `${String(hour + 1).padStart(2, '0')}:00`
                });
            });
        });
    },

    prevWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
        this.loadWeekCourses();
    },

    nextWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
        this.loadWeekCourses();
    },

    goToday() {
        this.currentWeekStart = this.getMonday(new Date());
        this.loadWeekCourses();
    },

    showAddCourseModal(defaults = {}) {
        const user = AuthService.getUser();
        const role = user && user.profile ? user.profile.role : 'parent';
        const today = new Date().toISOString().split('T')[0];
        const defaultDate = defaults.date || today;
        const defaultStart = defaults.startTime || '09:00';
        const defaultEnd = defaults.endTime || '10:00';

        const userField = role === 'parent'
            ? `
                <div class="form-group">
                    <label class="form-label">选择教师<span class="required">*</span></label>
                    <select class="form-control" name="teacher_id" id="select-teacher" required>
                        <option value="">加载中...</option>
                    </select>
                </div>
                <input type="hidden" name="parent_id" value="${user.id}">
            `
            : `
                <div class="form-group">
                    <label class="form-label">填写家长ID<span class="required">*</span></label>
                    <input type="number" class="form-control" name="parent_id" placeholder="请输入家长的用户ID" required>
                </div>
                <input type="hidden" name="teacher_id" value="${user.id}">
            `;

        const contentHtml = `
            <form id="course-form">
                ${userField}
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">科目<span class="required">*</span></label>
                        <select class="form-control" name="subject" required>
                            <option value="">请选择</option>
                            ${SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">年级</label>
                        <select class="form-control" name="grade">
                            <option value="">请选择</option>
                            ${GRADES.map(g => `<option value="${g}">${g}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">上课日期<span class="required">*</span></label>
                    <input type="date" class="form-control" name="course_date" value="${defaultDate}" min="${today}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">开始时间<span class="required">*</span></label>
                        <input type="time" class="form-control" name="start_time" value="${defaultStart}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">结束时间<span class="required">*</span></label>
                        <input type="time" class="form-control" name="end_time" value="${defaultEnd}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">课时费(元)</label>
                        <input type="number" class="form-control" name="price" min="0" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">上课地点</label>
                        <input type="text" class="form-control" name="location" placeholder="如：学生家中">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">备注</label>
                    <textarea class="form-control" name="notes"></textarea>
                </div>
            </form>
        `;

        const footerHtml = `
            <button class="btn btn-secondary" onclick="Modal.close()">取消</button>
            <button class="btn btn-primary" id="btn-submit-course">确认添加</button>
        `;

        Modal.show(contentHtml, { title: '新增课程', footerHtml });

        if (role === 'parent') {
            this.loadTeacherOptions();
        }

        document.getElementById('btn-submit-course').addEventListener('click', async () => {
            const form = document.getElementById('course-form');
            const formData = new FormData(form);

            const startTime = formData.get('start_time');
            const endTime = formData.get('end_time');

            if (startTime >= endTime) {
                Toast.warning('结束时间必须晚于开始时间');
                return;
            }

            const data = {
                parent_id: parseInt(formData.get('parent_id')),
                teacher_id: parseInt(formData.get('teacher_id')),
                subject: formData.get('subject'),
                grade: formData.get('grade') || '',
                course_date: formData.get('course_date'),
                start_time: startTime,
                end_time: endTime,
                price: parseInt(formData.get('price')) || 0,
                location: formData.get('location') || '',
                notes: formData.get('notes') || ''
            };

            if (!data.parent_id || !data.teacher_id || !data.subject || !data.course_date) {
                Toast.warning('请填写必要信息');
                return;
            }

            const btn = document.getElementById('btn-submit-course');
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"></span> 提交中...';

            try {
                const result = await TutorService.createCourse(data);
                if (result.code === 0) {
                    Toast.success('课程已添加，等待对方确认');
                    Modal.close();
                    await this.loadWeekCourses();
                } else {
                    Toast.error(result.message);
                }
            } catch (e) {}

            btn.disabled = false;
            btn.textContent = '确认添加';
        });
    },

    async loadTeacherOptions() {
        try {
            const result = await TutorService.listTeachers();
            const select = document.getElementById('select-teacher');
            if (result.code === 0 && result.data && result.data.length) {
                select.innerHTML = `<option value="">请选择教师</option>` +
                    result.data.map(t => `<option value="${t.user_id}">${t.real_name || t.username} - ${t.subjects_list ? t.subjects_list.join('/') : ''}</option>`).join('');
            } else {
                select.innerHTML = `<option value="">暂无教师可选</option>`;
            }
        } catch (e) {
            const select = document.getElementById('select-teacher');
            if (select) select.innerHTML = `<option value="">加载失败</option>`;
        }
    },

    async showCourseDetail(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        const user = AuthService.getUser();
        const role = user && user.profile ? user.profile.role : 'parent';
        const isOwner = course.parent_id === user.id || course.teacher_id === user.id;

        const statusMap = {
            pending: { class: 'badge-warning', text: '待确认' },
            confirmed: { class: 'badge-success', text: '已确认' },
            cancelled: { class: 'badge-secondary', text: '已取消' },
            completed: { class: 'badge-info', text: '已完成' }
        };
        const s = statusMap[course.status] || { class: 'badge-secondary', text: course.status };

        const personName = role === 'parent'
            ? (course.teacher_name || course.teacher_username || '未知')
            : (course.parent_name || course.parent_username || '未知');
        const personLabel = role === 'parent' ? '教师' : '家长';

        const html = `
            <div class="course-detail">
                <p><span class="detail-label">科目</span><span class="detail-value">${course.subject}</span></p>
                <p><span class="detail-label">年级</span><span class="detail-value">${course.grade || '未填'}</span></p>
                <p><span class="detail-label">${personLabel}</span><span class="detail-value">${personName}</span></p>
                <p><span class="detail-label">日期</span><span class="detail-value">${course.course_date}</span></p>
                <p><span class="detail-label">时间</span><span class="detail-value">${course.start_time} - ${course.end_time}</span></p>
                <p><span class="detail-label">课时费</span><span class="detail-value">${course.price > 0 ? '¥' + course.price : '未设置'}</span></p>
                <p><span class="detail-label">地点</span><span class="detail-value">${course.location || '未填'}</span></p>
                <p><span class="detail-label">状态</span><span class="detail-value"><span class="badge ${s.class}">${s.text}</span></span></p>
                ${course.notes ? `<p><span class="detail-label">备注</span><span class="detail-value">${course.notes}</span></p>` : ''}
            </div>
        `;

        const canConfirm = isOwner && course.status === 'pending';
        const canCancel = isOwner && (course.status === 'pending' || course.status === 'confirmed');

        let footerHtml = '';
        if (canConfirm || canCancel) {
            footerHtml = `
                <button class="btn btn-secondary" onclick="Modal.close()">关闭</button>
                ${canConfirm ? `<button class="btn btn-success" id="btn-confirm-course">确认课程</button>` : ''}
                ${canCancel ? `<button class="btn btn-danger" id="btn-cancel-course">取消课程</button>` : ''}
            `;
        } else {
            footerHtml = `<button class="btn btn-secondary" onclick="Modal.close()">关闭</button>`;
        }

        Modal.show(html, { title: '课程详情', footerHtml });

        const btnConfirm = document.getElementById('btn-confirm-course');
        if (btnConfirm) {
            btnConfirm.addEventListener('click', async () => {
                try {
                    const result = await TutorService.confirmCourse(courseId);
                    if (result.code === 0) {
                        Toast.success('课程已确认');
                        Modal.close();
                        await this.loadWeekCourses();
                    } else {
                        Toast.error(result.message);
                    }
                } catch (e) {}
            });
        }

        const btnCancel = document.getElementById('btn-cancel-course');
        if (btnCancel) {
            btnCancel.addEventListener('click', async () => {
                if (!confirm('确定要取消这个课程吗？')) return;
                try {
                    const result = await TutorService.cancelCourse(courseId);
                    if (result.code === 0) {
                        Toast.success('课程已取消');
                        Modal.close();
                        await this.loadWeekCourses();
                    } else {
                        Toast.error(result.message);
                    }
                } catch (e) {}
            });
        }
    }
};

window.CalendarPage = CalendarPage;
