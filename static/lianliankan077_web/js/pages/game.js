const GamePage = {
    theme: null,
    items: [],
    board: [],
    rows: 0,
    cols: 0,
    selected: null,
    score: 0,
    timeLeft: 180,
    timer: null,
    saveTimer: null,
    hintsUsed: 0,
    propsUsed: 0,
    combo: 0,
    maxCombo: 0,
    pairsCleared: 0,
    isCompleted: 0,
    userProps: [],
    STORAGE_KEY: 'llk_game_state',

    render() {
        const params = Router.getParams()
        const themeId = params.themeId
        if (!themeId) { Router.navigate('home'); return }
        const app = document.getElementById('app')
        app.innerHTML = `
            <div class="page no-tabbar game-page">
                <div class="game-header">
                    <div class="game-back" onclick="GamePage.exitGame()">←</div>
                    <div class="game-info">
                        <div class="game-score">分数: <span id="gameScore">0</span></div>
                        <div class="game-combo">连击: <span id="gameCombo">0</span></div>
                    </div>
                    <div class="game-time">⏱️ <span id="gameTime">03:00</span></div>
                </div>
                <div class="game-theme-title" id="themeTitle">加载中...</div>
                <div class="game-board-wrapper">
                    <div class="game-board" id="gameBoard">
                        <div class="loading-state"><div class="loading-spinner"></div></div>
                    </div>
                </div>
                <div class="game-toolbar" id="gameToolbar" style="display:none">
                    <div class="game-props" id="gameProps"></div>
                    <div class="game-actions">
                        <button class="btn btn-sm btn-outline" onclick="GamePage.useHint()">💡 提示</button>
                        <button class="btn btn-sm btn-outline" onclick="GamePage.shuffleBoard()">🔄 洗牌</button>
                    </div>
                </div>
            </div>
        `
        this.loadTheme(themeId)
    },

    saveGameState() {
        if (this.isCompleted || !this.theme) return
        const state = {
            themeId: this.theme.id,
            board: this.board,
            rows: this.rows,
            cols: this.cols,
            score: this.score,
            timeLeft: this.timeLeft,
            hintsUsed: this.hintsUsed,
            propsUsed: this.propsUsed,
            combo: this.combo,
            maxCombo: this.maxCombo,
            pairsCleared: this.pairsCleared,
            userProps: this.userProps,
            timestamp: Date.now()
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state))
    },

    loadGameState() {
        const saved = localStorage.getItem(this.STORAGE_KEY)
        if (!saved) return null
        try {
            const state = JSON.parse(saved)
            const params = Router.getParams()
            if (state.themeId == params.themeId) {
                const elapsed = Math.floor((Date.now() - state.timestamp) / 1000)
                state.timeLeft = Math.max(0, state.timeLeft - elapsed)
                return state
            }
            return null
        } catch (e) {
            return null
        }
    },

    clearGameState() {
        localStorage.removeItem(this.STORAGE_KEY)
    },

    async loadTheme(themeId) {
        try {
            const [themeResult, propsResult] = await Promise.all([
                GameService.getThemeDetail(themeId),
                GameService.getUserProps()
            ])
            if (themeResult.code === 0 && themeResult.data) {
                this.theme = themeResult.data
                if (propsResult.code === 0 && propsResult.data) {
                    this.userProps = propsResult.data
                }

                const savedState = this.loadGameState()
                if (savedState) {
                    this.showResumeDialog(savedState)
                } else {
                    this.initGame()
                }
            } else {
                Toast.error('加载失败')
                Router.navigate('home')
            }
        } catch (error) {
            Toast.error('加载失败')
            Router.navigate('home')
        }
    },

    showResumeDialog(savedState) {
        const app = document.getElementById('app')
        const overlay = document.createElement('div')
        overlay.className = 'modal-overlay'
        overlay.innerHTML = `
            <div class="modal-content">
                <h3>发现未完成的游戏</h3>
                <p>是否继续上一局游戏？</p>
                <div class="resume-stats">
                    <div class="resume-stat">
                        <div class="resume-value">${savedState.score}</div>
                        <div class="resume-label">当前分数</div>
                    </div>
                    <div class="resume-stat">
                        <div class="resume-value">${Math.floor(savedState.timeLeft / 60)}:${(savedState.timeLeft % 60).toString().padStart(2, '0')}</div>
                        <div class="resume-label">剩余时间</div>
                    </div>
                    <div class="resume-stat">
                        <div class="resume-value">${savedState.pairsCleared}</div>
                        <div class="resume-label">已消除</div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-outline" onclick="GamePage.startNewGame()">新游戏</button>
                    <button class="btn btn-primary" onclick="GamePage.resumeGame()">继续游戏</button>
                </div>
            </div>
        `
        app.appendChild(overlay)
        this._savedState = savedState
    },

    startNewGame() {
        this.clearGameState()
        const overlay = document.querySelector('.modal-overlay')
        if (overlay) overlay.remove()
        this.initGame()
    },

    resumeGame() {
        const state = this._savedState
        if (!state) {
            this.initGame()
            return
        }

        document.getElementById('themeTitle').textContent = `${this.theme.icon} ${this.theme.name}`

        this.rows = state.rows
        this.cols = state.cols
        this.board = state.board
        this.score = state.score
        this.timeLeft = state.timeLeft
        this.hintsUsed = state.hintsUsed
        this.propsUsed = state.propsUsed
        this.combo = state.combo
        this.maxCombo = state.maxCombo
        this.pairsCleared = state.pairsCleared
        this.isCompleted = 0
        this.selected = null

        if (state.userProps) {
            this.userProps = state.userProps
        }

        this.updateScore()
        this.updateTimeDisplay()
        this.renderBoard()
        this.renderProps()
        document.getElementById('gameToolbar').style.display = 'flex'
        this.startTimer()
        this.startAutoSave()

        const overlay = document.querySelector('.modal-overlay')
        if (overlay) overlay.remove()
    },

    updateTimeDisplay() {
        const mins = Math.floor(this.timeLeft / 60)
        const secs = this.timeLeft % 60
        document.getElementById('gameTime').textContent =
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },

    initGame() {
        const theme = this.theme
        document.getElementById('themeTitle').textContent = `${theme.icon} ${theme.name}`

        let items = JSON.parse(theme.items_json)
        const rows = theme.rows
        const cols = theme.cols
        const totalCells = rows * cols
        const pairsNeeded = Math.floor(totalCells / 2)

        const selectedItems = items.slice(0, pairsNeeded)
        const allPairs = [...selectedItems, ...selectedItems]

        for (let i = allPairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[allPairs[i], allPairs[j]] = [allPairs[j], allPairs[i]]
        }

        const board = []
        let idx = 0
        for (let r = 0; r < rows; r++) {
            board[r] = []
            for (let c = 0; c < cols; c++) {
                board[r][c] = { value: allPairs[idx] || null, cleared: false }
                idx++
            }
        }

        this.rows = rows
        this.cols = cols
        this.board = board
        this.score = 0
        this.timeLeft = 180
        this.hintsUsed = 0
        this.propsUsed = 0
        this.combo = 0
        this.maxCombo = 0
        this.pairsCleared = 0
        this.isCompleted = 0
        this.selected = null

        this.updateScore()
        this.updateTimeDisplay()
        this.renderBoard()
        this.renderProps()
        document.getElementById('gameToolbar').style.display = 'flex'
        this.startTimer()
        this.startAutoSave()
    },

    startAutoSave() {
        if (this.saveTimer) clearInterval(this.saveTimer)
        this.saveTimer = setInterval(() => {
            this.saveGameState()
        }, 5000)
    },

    renderBoard() {
        const boardEl = document.getElementById('gameBoard')
        boardEl.className = `game-board cols-${this.cols}`
        boardEl.innerHTML = ''
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.board[r][c]
                const div = document.createElement('div')
                div.className = `game-cell ${cell.cleared ? 'cleared' : ''} ${this.isSelected(r, c) ? 'selected' : ''}`
                div.dataset.row = r
                div.dataset.col = c
                if (!cell.cleared) {
                    div.textContent = cell.value
                    div.onclick = () => this.handleCellClick(r, c)
                }
                boardEl.appendChild(div)
            }
        }
    },

    renderProps() {
        const propsEl = document.getElementById('gameProps')
        propsEl.innerHTML = this.userProps.map(p => `
            <div class="game-prop" onclick="GamePage.useUserProp(${p.prop_id})" title="${p.prop_description}">
                <span class="prop-icon">${p.prop_icon}</span>
                <span class="prop-count">${p.quantity}</span>
            </div>
        `).join('')
    },

    isSelected(row, col) {
        return this.selected && this.selected.row === row && this.selected.col === col
    },

    handleCellClick(row, col) {
        const cell = this.board[row][col]
        if (cell.cleared) return

        if (!this.selected) {
            this.selected = { row, col }
            this.renderBoard()
            return
        }

        if (this.selected.row === row && this.selected.col === col) {
            this.selected = null
            this.renderBoard()
            return
        }

        const first = this.board[this.selected.row][this.selected.col]
        const second = this.board[row][col]

        if (first.value === second.value && this.canConnect(this.selected, { row, col })) {
            this.clearPair(this.selected, { row, col })
        } else {
            this.shakeCell(this.selected.row, this.selected.col)
            this.shakeCell(row, col)
        }
        this.selected = null
    },

    shakeCell(row, col) {
        const index = row * this.cols + col
        const cell = document.querySelectorAll('.game-cell')[index]
        if (cell) {
            cell.classList.add('shake')
            setTimeout(() => cell.classList.remove('shake'), 300)
        }
    },

    canConnect(pos1, pos2) {
        if (this.lineConnect(pos1, pos2)) return true
        if (this.oneCornerConnect(pos1, pos2)) return true
        if (this.twoCornerConnect(pos1, pos2)) return true
        return false
    },

    isPassable(row, col, exclude) {
        if (row < -1 || row > this.rows || col < -1 || col > this.cols) return false
        if (row === -1 || row === this.rows || col === -1 || col === this.cols) return true
        if (this.board[row][col].cleared) return true
        if (exclude && ((exclude.row === row && exclude.col === col))) return true
        return false
    },

    lineConnect(pos1, pos2) {
        if (pos1.row === pos2.row) {
            const minCol = Math.min(pos1.col, pos2.col)
            const maxCol = Math.max(pos1.col, pos2.col)
            for (let c = minCol + 1; c < maxCol; c++) {
                if (!this.board[pos1.row][c].cleared) return false
            }
            return true
        }
        if (pos1.col === pos2.col) {
            const minRow = Math.min(pos1.row, pos2.row)
            const maxRow = Math.max(pos1.row, pos2.row)
            for (let r = minRow + 1; r < maxRow; r++) {
                if (!this.board[r][pos1.col].cleared) return false
            }
            return true
        }
        return false
    },

    oneCornerConnect(pos1, pos2) {
        const corner1 = { row: pos1.row, col: pos2.col }
        if (this.isPassable(corner1.row, corner1.col, pos1) &&
            this.isPassable(corner1.row, corner1.col, pos2) &&
            this.lineConnect(pos1, corner1) &&
            this.lineConnect(corner1, pos2)) {
            return true
        }
        const corner2 = { row: pos2.row, col: pos1.col }
        if (this.isPassable(corner2.row, corner2.col, pos1) &&
            this.isPassable(corner2.row, corner2.col, pos2) &&
            this.lineConnect(pos1, corner2) &&
            this.lineConnect(corner2, pos2)) {
            return true
        }
        return false
    },

    twoCornerConnect(pos1, pos2) {
        for (let r = -1; r <= this.rows; r++) {
            const c1 = { row: r, col: pos1.col }
            const c2 = { row: r, col: pos2.col }
            if (this.canPassThrough(r, pos1.col, pos1) &&
                this.canPassThrough(r, pos2.col, pos2) &&
                this.lineConnect(pos1, c1) &&
                this.lineConnect(c1, c2) &&
                this.lineConnect(c2, pos2)) {
                return true
            }
        }
        for (let c = -1; c <= this.cols; c++) {
            const c1 = { row: pos1.row, col: c }
            const c2 = { row: pos2.row, col: c }
            if (this.canPassThrough(pos1.row, c, pos1) &&
                this.canPassThrough(pos2.row, c, pos2) &&
                this.lineConnect(pos1, c1) &&
                this.lineConnect(c1, c2) &&
                this.lineConnect(c2, pos2)) {
                return true
            }
        }
        return false
    },

    canPassThrough(row, col, exclude) {
        if (exclude && exclude.row === row && exclude.col === col) return true
        if (row < -1 || row > this.rows || col < -1 || col > this.cols) return false
        if (row === -1 || row === this.rows || col === -1 || col === this.cols) return true
        return this.board[row][col].cleared
    },

    clearPair(pos1, pos2) {
        this.board[pos1.row][pos1.col].cleared = true
        this.board[pos2.row][pos2.col].cleared = true
        this.pairsCleared++
        this.combo++
        this.maxCombo = Math.max(this.maxCombo, this.combo)
        const baseScore = 10
        const comboBonus = Math.min(this.combo * 2, 20)
        this.score += baseScore + comboBonus
        this.updateScore()
        this.renderBoard()
        this.saveGameState()
        setTimeout(() => this.checkWin(), 100)
    },

    updateScore() {
        document.getElementById('gameScore').textContent = this.score
        document.getElementById('gameCombo').textContent = this.combo
    },

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--
            const mins = Math.floor(this.timeLeft / 60)
            const secs = this.timeLeft % 60
            document.getElementById('gameTime').textContent =
                `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            if (this.timeLeft <= 0) {
                this.gameOver()
            }
        }, 1000)
    },

    checkWin() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.board[r][c].cleared) return
            }
        }
        this.isCompleted = 1
        this.gameOver()
    },

    gameOver() {
        clearInterval(this.timer)
        clearInterval(this.saveTimer)
        this.clearGameState()
        GameService.saveRecord({
            theme_id: this.theme.id,
            score: this.score,
            duration: 180 - this.timeLeft,
            combo: this.combo,
            max_combo: this.maxCombo,
            pairs_cleared: this.pairsCleared,
            hints_used: this.hintsUsed,
            props_used: this.propsUsed,
            is_completed: this.isCompleted
        })
        setTimeout(() => this.showResult(), 300)
    },

    showResult() {
        const app = document.getElementById('app')
        const isWin = this.isCompleted
        app.innerHTML = `
            <div class="result-page">
                <div class="result-card">
                    <div class="result-icon">${isWin ? '🎉' : '😢'}</div>
                    <h2 class="result-title">${isWin ? '恭喜通关！' : '时间到！'}</h2>
                    <div class="result-stats">
                        <div class="stat-item">
                            <div class="stat-value">${this.score}</div>
                            <div class="stat-label">得分</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.maxCombo}</div>
                            <div class="stat-label">最高连击</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.pairsCleared}</div>
                            <div class="stat-label">消除对数</div>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-outline" onclick="Router.navigate('home')">返回首页</button>
                        <button class="btn btn-primary" onclick="GamePage.restart()">再玩一次</button>
                    </div>
                </div>
            </div>
        `
    },

    restart() {
        this.initGame()
    },

    exitGame() {
        clearInterval(this.timer)
        clearInterval(this.saveTimer)
        this.saveGameState()
        Router.navigate('home')
    },

    findHint() {
        for (let r1 = 0; r1 < this.rows; r1++) {
            for (let c1 = 0; c1 < this.cols; c1++) {
                if (this.board[r1][c1].cleared) continue
                for (let r2 = 0; r2 < this.rows; r2++) {
                    for (let c2 = 0; c2 < this.cols; c2++) {
                        if (r1 === r2 && c1 === c2) continue
                        if (this.board[r2][c2].cleared) continue
                        if (this.board[r1][c1].value === this.board[r2][c2].value) {
                            if (this.canConnect({ row: r1, col: c1 }, { row: r2, col: c2 })) {
                                return [{ row: r1, col: c1 }, { row: r2, col: c2 }]
                            }
                        }
                    }
                }
            }
        }
        return null
    },

    async useHint() {
        const hint = this.findHint()
        if (!hint) {
            Toast.info('暂无可用配对，尝试洗牌')
            return
        }
        this.hintsUsed++
        this.highlightHint(hint[0], hint[1])
    },

    highlightHint(pos1, pos2) {
        const idx1 = pos1.row * this.cols + pos1.col
        const idx2 = pos2.row * this.cols + pos2.col
        const cells = document.querySelectorAll('.game-cell')
        cells[idx1].classList.add('hint')
        cells[idx2].classList.add('hint')
        setTimeout(() => {
            cells[idx1].classList.remove('hint')
            cells[idx2].classList.remove('hint')
        }, 1500)
    },

    shuffleBoard() {
        const remaining = []
        const positions = []
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.board[r][c].cleared) {
                    remaining.push(this.board[r][c].value)
                    positions.push({ r, c })
                }
            }
        }
        for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[remaining[i], remaining[j]] = [remaining[j], remaining[i]]
        }
        positions.forEach((pos, idx) => {
            this.board[pos.r][pos.c].value = remaining[idx]
        })
        this.combo = 0
        this.updateScore()
        this.renderBoard()
        this.saveGameState()
    },

    async useUserProp(propId) {
        const prop = this.userProps.find(p => p.prop_id === propId)
        if (!prop || prop.quantity <= 0) {
            Toast.error('道具不足')
            return
        }

        if (prop.effect_type === 'hint') {
            const result = await GameService.useProp(propId)
            if (result.code === 0) {
                this.propsUsed++
                prop.quantity = result.data.remaining
                this.useHint()
                this.renderProps()
            } else {
                Toast.error(result.msg || '使用失败')
            }
        } else if (prop.effect_type === 'shuffle') {
            const result = await GameService.useProp(propId)
            if (result.code === 0) {
                this.propsUsed++
                prop.quantity = result.data.remaining
                this.shuffleBoard()
                this.renderProps()
            } else {
                Toast.error(result.msg || '使用失败')
            }
        } else if (prop.effect_type === 'add_time') {
            const result = await GameService.useProp(propId)
            if (result.code === 0) {
                this.propsUsed++
                prop.quantity = result.data.remaining
                this.timeLeft += 30
                this.renderProps()
                Toast.success('增加30秒！')
            } else {
                Toast.error(result.msg || '使用失败')
            }
        } else {
            Toast.info('该道具正在开发中')
        }
    }
}
