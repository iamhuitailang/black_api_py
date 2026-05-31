const ChangePasswordPage = {
    render() {
        const app = document.getElementById('app')
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" onclick="Router.back()">←</div>
                    <div class="header-title">修改密码</div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <form id="changePasswordForm">
                            <div class="form-group">
                                <label class="form-label">原密码</label>
                                <input type="password" class="form-control" id="oldPassword" placeholder="请输入原密码">
                            </div>
                            <div class="form-group">
                                <label class="form-label">新密码</label>
                                <input type="password" class="form-control" id="newPassword" placeholder="请输入新密码（至少6位）">
                            </div>
                            <div class="form-group">
                                <label class="form-label">确认新密码</label>
                                <input type="password" class="form-control" id="newPassword2" placeholder="请再次输入新密码">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block" id="submitBtn">确认修改</button>
                        </form>
                    </div>
                </div>
            </div>
        `
        this.bindEvents()
    },

    bindEvents() {
        document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
            e.preventDefault()
            this.handleSubmit()
        })
    },

    async handleSubmit() {
        const oldPassword = document.getElementById('oldPassword').value
        const newPassword = document.getElementById('newPassword').value
        const newPassword2 = document.getElementById('newPassword2').value
        const submitBtn = document.getElementById('submitBtn')

        if (!oldPassword) { Toast.error('请输入原密码'); return }
        if (!newPassword) { Toast.error('请输入新密码'); return }
        if (newPassword !== newPassword2) { Toast.error('两次密码不一致'); return }

        submitBtn.disabled = true
        submitBtn.innerHTML = '<span class="loading"></span> 提交中...'

        try {
            const result = await AuthService.changePassword(oldPassword, newPassword)
            if (result.code === 0) {
                Toast.success('密码修改成功，请重新登录')
                setTimeout(() => Router.navigate('login'), 1000)
            } else {
                Toast.error(result.msg || '修改失败')
            }
        } catch (error) {
            Toast.error('修改失败，请检查网络')
        } finally {
            submitBtn.disabled = false
            submitBtn.innerHTML = '确认修改'
        }
    }
}
