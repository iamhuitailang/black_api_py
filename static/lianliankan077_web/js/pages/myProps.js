const MyPropsPage = {
    props: [],
    loading: true,

    render() {
        const app = document.getElementById('app')
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" onclick="Router.back()">←</div>
                    <div class="header-title">🎒 我的道具</div>
                </div>
                <div class="props-grid" id="propsGrid">
                    <div class="loading-state"><div class="loading-spinner"></div></div>
                </div>
            </div>
        `
        this.loadProps()
    },

    async loadProps() {
        try {
            const result = await GameService.getUserProps()
            if (result.code === 0 && result.data) {
                this.props = result.data
                this.renderProps()
            } else {
                document.getElementById('propsGrid').innerHTML =
                    '<div class="empty-state"><div class="empty-state-icon">🎒</div><div class="empty-state-text">暂无道具<br>去商店购买吧</div></div>'
            }
        } catch (error) {
            document.getElementById('propsGrid').innerHTML =
                '<div class="empty-state"><div class="empty-state-icon">😢</div><div class="empty-state-text">加载失败</div></div>'
        }
    },

    renderProps() {
        const grid = document.getElementById('propsGrid')
        if (!this.props || this.props.length === 0) {
            grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎒</div><div class="empty-state-text">暂无道具<br>去商店购买吧</div></div>'
            return
        }
        grid.innerHTML = this.props.map(prop => `
            <div class="prop-card">
                <div class="prop-card-icon">${prop.prop_icon}</div>
                <div class="prop-card-name">${prop.prop_name}</div>
                <div class="prop-card-desc">${prop.prop_description}</div>
                <div class="prop-card-count">×${prop.quantity}</div>
            </div>
        `).join('')
    }
}
