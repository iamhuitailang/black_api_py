const EditProfilePage = {
    render() {
        const user = AuthService.getCurrentUser();
        const app = document.getElementById('app');
        app.className = 'page has-header no-tabbar';
        app.innerHTML = `
            <div class="header">
                <div class="header-back" onclick="Router.back()">←</div>
                <div class="header-title">编辑资料</div>
            </div>
            <div style="padding: 16px;">
                <form id="editProfileForm">
                    <div class="form-group">
                        <label class="form-label">用户名</label>
                        <input type="text" class="form-input" value="${user?.username || ''}" disabled>
                    </div>
                    <div class="form-group">
                        <label class="form-label">真实姓名</label>
                        <input type="text" class="form-input" id="realName" value="${user?.real_name || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">手机号</label>
                        <input type="tel" class="form-input" id="phone" value="${user?.phone || ''}">
                    </div>
                    ${user?.role === 'student' ? `
                    <div class="form-group">
                        <label class="form-label">学号</label>
                        <input type="text" class="form-input" id="studentNo" value="${user?.detail?.student_no || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">宿舍楼</label>
                        <select class="form-select" id="dormitoryId">
                            <option value="0">请选择宿舍楼</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">房间号</label>
                        <input type="text" class="form-input" id="roomNumber" value="${user?.detail?.room_number || ''}">
                    </div>
                    ` : ''}
                    ${user?.role === 'repairman' ? `
                    <div class="form-group">
                        <label class="form-label">工号</label>
                        <input type="text" class="form-input" id="workerNo" value="${user?.detail?.worker_no || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">维修专长</label>
                        <select class="form-select" id="specialty">
                            <option value="">请选择专长</option>
                            <option value="水电维修" ${user?.detail?.specialty === '水电维修' ? 'selected' : ''}>水电维修</option>
                            <option value="门窗维修" ${user?.detail?.specialty === '门窗维修' ? 'selected' : ''}>门窗维修</option>
                            <option value="家具维修" ${user?.detail?.specialty === '家具维修' ? 'selected' : ''}>家具维修</option>
                            <option value="电器维修" ${user?.detail?.specialty === '电器维修' ? 'selected' : ''}>电器维修</option>
                            <option value="管道维修" ${user?.detail?.specialty === '管道维修' ? 'selected' : ''}>管道维修</option>
                            <option value="其他" ${user?.detail?.specialty === '其他' ? 'selected' : ''}>其他</option>
                        </select>
                    </div>
                    ` : ''}
                    <button type="submit" class="btn btn-primary btn-block" id="saveBtn">保 存</button>
                </form>
            </div>
        `;

        this.bindEvents();
        if (user?.role === 'student') {
            this.loadDormitories(user?.detail?.dormitory_id);
        }
    },

    async loadDormitories(selectedId) {
        try {
            const result = await ApiService.get('/baoxiu/dormitory/list/get', { page_size: 100 });
            if (result.code === 0 && result.data.items) {
                const select = document.getElementById('dormitoryId');
                result.data.items.forEach(d => {
                    const option = document.createElement('option');
                    option.value = d.id;
                    option.textContent = d.name;
                    if (selectedId && d.id === selectedId) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            }
        } catch (e) {
            console.error('Load dormitories error:', e);
        }
    },

    bindEvents() {
        document.getElementById('editProfileForm').onsubmit = async (e) => {
            e.preventDefault();

            const phone = document.getElementById('phone').value.trim();
            if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
                Utils.showToast('手机号格式不正确');
                return;
            }

            const btn = document.getElementById('saveBtn');
            btn.disabled = true;
            btn.textContent = '保存中...';

            const data = {
                real_name: document.getElementById('realName').value.trim(),
                phone: document.getElementById('phone').value.trim()
            };

            const user = AuthService.getCurrentUser();
            if (user.role === 'student') {
                data.student_no = document.getElementById('studentNo')?.value.trim() || '';
                data.dormitory_id = parseInt(document.getElementById('dormitoryId')?.value) || 0;
                data.room_number = document.getElementById('roomNumber')?.value.trim() || '';
            } else if (user.role === 'repairman') {
                data.worker_no = document.getElementById('workerNo')?.value.trim() || '';
                data.specialty = document.getElementById('specialty')?.value || '';
            }

            try {
                const result = await AuthService.updateProfile(data);
                if (result.code === 0) {
                    Utils.showToast('保存成功');
                    setTimeout(() => {
                        Router.back();
                    }, 500);
                } else {
                    Utils.showToast(result.msg);
                }
            } catch (error) {
                Utils.showToast('保存失败，请重试');
            } finally {
                btn.disabled = false;
                btn.textContent = '保 存';
            }
        };
    }
};
