const API_BASE = '/api/rift';
const STORAGE_KEY = 'rift_game_cache_v3';
const STORAGE_VERSION = 3;

class RiftGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = null;
        this.gameId = null;
        this.selectedMode = 'slow';
        this.selectedSegmentId = null;
        this.isDragging = false;
        this.vortexAngle = 0;
        this.animationFrame = 0;
        this.pulsePhase = 0;
        this.logs = [];
        this._saveTimer = null;

        this.init();
    }

    init() {
        const hasCache = this.restoreFromCache();
        this.setupEventListeners();
        this.restoreModeButtons();
        this.restoreLogPanel();
        this.loadActiveGame();
        this.animate();

        if (hasCache) {
            const anchorCount = this.gameState ? this.gameState.anchors.filter(a => a.status === 'active').length : 0;
            console.log('[RiftGame] Cache restored, active anchors:', anchorCount);
        }
    }

    _serializeState() {
        if (!this.gameState) return null;
        const s = this.gameState;

        const segments = s.segments.map(seg => ({
            id: seg.id,
            game_id: seg.game_id,
            x: seg.x,
            y: seg.y,
            prev_x: seg.prev_x,
            prev_y: seg.prev_y,
            branch_id: seg.branch_id,
            is_sealed: seg.is_sealed,
            is_node: seg.is_node,
            turn_created: seg.turn_created,
            turn_sealed: seg.turn_sealed,
            has_anchor: seg.has_anchor,
            anchor_turns_left: seg.anchor_turns_left,
            created_at: seg.created_at
        }));

        const anchors = s.anchors.map(a => ({
            id: a.id,
            game_id: a.game_id,
            segment_id: a.segment_id,
            x: a.x,
            y: a.y,
            turn_deployed: a.turn_deployed,
            turns_remaining: a.turns_remaining,
            status: a.status,
            created_at: a.created_at
        }));

        const vortices = s.vortices.map(v => ({
            id: v.id,
            game_id: v.game_id,
            x: v.x,
            y: v.y,
            segment_id: v.segment_id,
            turn_created: v.turn_created,
            turns_remaining: v.turns_remaining,
            status: v.status,
            anchors_produced: v.anchors_produced,
            created_at: v.created_at
        }));

        return {
            version: STORAGE_VERSION,
            savedAt: Date.now(),
            game: { ...s.game },
            segments: segments,
            anchors: anchors,
            vortices: vortices,
            total_length: s.total_length,
            is_out_of_control: s.is_out_of_control,
            is_shaking: s.is_shaking,
            branch_count: s.branch_count,
            selectedMode: this.selectedMode,
            selectedSegmentId: this.selectedSegmentId,
            logs: this.logs.slice(0, 50)
        };
    }

    saveToCache() {
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
        }
        this._saveTimer = setTimeout(() => {
            this._doSave();
        }, 50);
    }

    _doSave() {
        try {
            const data = this._serializeState();
            if (!data) return;
            const json = JSON.stringify(data);
            localStorage.setItem(STORAGE_KEY, json);
            console.debug('[RiftGame] Saved to cache, size:', Math.round(json.length / 1024), 'KB, anchors:',
                data.anchors.filter(a => a.status === 'active').length);
        } catch (e) {
            console.warn('[RiftGame] Save to cache failed:', e);
            try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
        }
    }

    restoreFromCache() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                console.log('[RiftGame] No cache found');
                return false;
            }

            const data = JSON.parse(raw);
            if (!data || data.version !== STORAGE_VERSION) {
                console.warn('[RiftGame] Cache version mismatch, clearing');
                localStorage.removeItem(STORAGE_KEY);
                return false;
            }

            if (!data.game || data.game.status !== 'playing') {
                console.warn('[RiftGame] Cache game not playing, skipping');
                return false;
            }

            const activeAnchors = (data.anchors || []).filter(a => a.status === 'active');
            const activeVortices = (data.vortices || []).filter(v => v.status === 'active');
            const anchoredSegs = (data.segments || []).filter(s => s.has_anchor);

            console.log('[RiftGame] Restoring from cache:');
            console.log('  - Game ID:', data.game.id, 'Turn:', data.game.turn);
            console.log('  - Tracker:', data.game.tracker_x, data.game.tracker_y);
            console.log('  - Segments:', data.segments ? data.segments.length : 0);
            console.log('  - Anchors (active):', activeAnchors.length);
            console.log('  - Anchored segments:', anchoredSegs.length);
            console.log('  - Vortices (active):', activeVortices.length);

            activeAnchors.forEach((a, i) => {
                console.log(`    Anchor ${i}: id=${a.id}, x=${a.x}, y=${a.y}, status=${a.status}, turns=${a.turns_remaining}`);
            });
            anchoredSegs.forEach(s => {
                console.log(`    Anchored seg ${s.id}: x=${s.x}, y=${s.y}, has_anchor=${s.has_anchor}, turns=${s.anchor_turns_left}`);
            });

            this.gameState = {
                game: data.game,
                segments: data.segments || [],
                anchors: data.anchors || [],
                vortices: data.vortices || [],
                total_length: data.total_length || 0,
                is_out_of_control: data.is_out_of_control || false,
                is_shaking: data.is_shaking || false,
                branch_count: data.branch_count || 1,
                operations: [],
                canvas_width: 800,
                canvas_height: 600,
                segment_distance: 20,
                max_length: 80,
                seal_modes: {
                    slow: { rate: 0.95, coverage: 1, name: '慢速精准' },
                    medium: { rate: 0.75, coverage: 2, name: '中速平衡' },
                    fast: { rate: 0.50, coverage: 3, name: '快速粗略' },
                },
                max_anchors: 5,
            };

            this.gameId = data.game.id;
            this.selectedMode = data.selectedMode || 'slow';
            this.selectedSegmentId = data.selectedSegmentId || null;
            this.logs = data.logs || [];

            this.updateUI();

            const savedAgo = data.savedAt ? Math.round((Date.now() - data.savedAt) / 1000) : 0;
            console.log('[RiftGame] Cache restored successfully (saved', savedAgo, 'seconds ago)');

            return true;
        } catch (e) {
            console.warn('[RiftGame] Restore from cache failed:', e);
            console.warn('[RiftGame] Error details:', e.message, e.stack);
            return false;
        }
    }

    restoreModeButtons() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.selectedMode);
        });
    }

    restoreLogPanel() {
        const panel = document.getElementById('logPanel');
        if (!panel) return;
        panel.innerHTML = '';
        for (const log of this.logs) {
            const entry = document.createElement('div');
            entry.className = `log-entry ${log.type}`;
            entry.innerHTML = `<span class="turn">[T${log.turn}]</span>${log.message}`;
            panel.appendChild(entry);
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => { this.isDragging = false; });

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedMode = btn.dataset.mode;
                this.saveToCache();
            });
        });

        document.getElementById('sealBtn').addEventListener('click', () => this.executeSeal());
        document.getElementById('anchorBtn').addEventListener('click', () => this.deployAnchor());
        document.getElementById('newGameBtn').addEventListener('click', () => this.startNewGame());

        window.addEventListener('beforeunload', () => this._doSave());
        window.addEventListener('pagehide', () => this._doSave());
    }

    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    onMouseDown(e) {
        this.isDragging = true;
        const coords = this.getCanvasCoords(e);
        this._setTrackerLocal(coords.x, coords.y);
        this.handleTrackerMove(coords.x, coords.y);
    }

    onMouseMove(e) {
        const coords = this.getCanvasCoords(e);
        if (this.isDragging) {
            this._setTrackerLocal(coords.x, coords.y);
            this.handleTrackerMove(coords.x, coords.y);
        }
    }

    onMouseUp(e) {
        this.isDragging = false;
        const coords = this.getCanvasCoords(e);
        this.detectNearbySegment(coords.x, coords.y);
    }

    _setTrackerLocal(x, y) {
        if (!this.gameState || !this.gameState.game) return;
        x = Math.max(0, Math.min(800, Math.round(x)));
        y = Math.max(0, Math.min(600, Math.round(y)));
        this.gameState.game.tracker_x = x;
        this.gameState.game.tracker_y = y;
        this.saveToCache();
    }

    detectNearbySegment(x, y) {
        if (!this.gameState || !this.gameState.segments) return;

        let nearestDist = Infinity;
        let nearestSeg = null;

        for (const seg of this.gameState.segments) {
            if (seg.is_sealed) continue;
            const dist = Math.sqrt((seg.x - x) ** 2 + (seg.y - y) ** 2);
            if (dist < nearestDist && dist < 25) {
                nearestDist = dist;
                nearestSeg = seg;
            }
        }

        this.selectedSegmentId = nearestSeg ? nearestSeg.id : null;
        this.saveToCache();
    }

    async handleTrackerMove(x, y) {
        if (!this.gameId) return;

        try {
            const response = await fetch(`${API_BASE}/movetracker`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_id: this.gameId,
                    tracker_x: Math.round(x),
                    tracker_y: Math.round(y)
                })
            });
            const result = await response.json();
            if (result.code === 0 && result.data && result.data.game) {
                this.gameState = result.data;
                this.updateUI();
                this.saveToCache();
            }
        } catch (err) {
            console.error('Move tracker failed:', err);
        }
    }

    async loadActiveGame() {
        try {
            const response = await fetch(`${API_BASE}/active`);
            const result = await response.json();
            if (result.code === 0 && result.data && result.data.game) {
                const newGameId = result.data.game.id;

                if (this.gameId && this.gameId !== newGameId) {
                    console.log('[RiftGame] Game ID changed, resetting logs');
                    this.logs = [];
                    this.restoreLogPanel();
                    this.addLog('info', '游戏已就绪，开始封堵裂隙！');
                }

                const hadState = !!this.gameState;
                this.gameState = result.data;
                this.gameId = newGameId;

                if (!hadState) {
                    this.addLog('info', '游戏已就绪，开始封堵裂隙！');
                }

                this.updateUI();
                this.saveToCache();
                console.log('[RiftGame] Synced with server, turn:', result.data.game.turn,
                    'active anchors:', result.data.anchors.filter(a => a.status === 'active').length);
            } else {
                this.startNewGame();
            }
        } catch (err) {
            console.error('Load game failed:', err);
        }
    }

    async startNewGame() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            const response = await fetch(`${API_BASE}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            if (result.code === 0) {
                this.gameState = result.data;
                this.gameId = result.data.game.id;
                this.selectedSegmentId = null;
                this.logs = [];
                this.restoreLogPanel();
                this.addLog('info', '新游戏开始！守护时空稳定。');
                this.updateUI();
                this.saveToCache();
            }
        } catch (err) {
            console.error('Start game failed:', err);
        }
    }

    async executeSeal() {
        if (!this.gameId || !this.gameState) return;

        const game = this.gameState.game;
        const sealBtn = document.getElementById('sealBtn');
        sealBtn.disabled = true;
        sealBtn.style.opacity = '0.6';

        try {
            const response = await fetch(`${API_BASE}/seal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_id: this.gameId,
                    mode: this.selectedMode,
                    tracker_x: game.tracker_x,
                    tracker_y: game.tracker_y
                })
            });
            const result = await response.json();
            if (result.code === 0) {
                this.gameState = result.data;
                const op = result.data.last_operation || {};
                const modeNames = { slow: '慢速精准', medium: '中速平衡', fast: '快速粗略' };

                if (op.success) {
                    this.addLog('success', `使用${modeNames[op.mode]}封堵成功！修复${op.sealed_count}格裂隙`);
                } else {
                    this.addLog('fail', `${modeNames[op.mode]}封堵失败！裂隙反向扩张${op.expansion_count}格`);
                }

                if (result.data.expanded_this_turn > 0) {
                    this.addLog('warning', `裂隙自然扩张${result.data.expanded_this_turn}格`);
                }

                this.updateUI();
                this.saveToCache();
            } else {
                this.addLog('fail', result.message || '操作失败');
            }
        } catch (err) {
            console.error('Seal failed:', err);
            this.addLog('fail', '网络错误，操作失败');
        } finally {
            sealBtn.disabled = false;
            sealBtn.style.opacity = '1';
        }
    }

    async deployAnchor() {
        if (!this.gameId || !this.selectedSegmentId) {
            this.addLog('warning', '请先点击选中一个裂隙节点');
            return;
        }

        const seg = this.gameState.segments.find(s => s.id === this.selectedSegmentId);
        if (!seg || seg.is_sealed) {
            this.addLog('warning', '该裂隙已被封堵');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/anchor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_id: this.gameId,
                    segment_id: this.selectedSegmentId
                })
            });
            const result = await response.json();
            if (result.code === 0) {
                this.gameState = result.data;
                this.addLog('success', `时空锚点已部署，3回合内该节点停止扩张`);
                this.selectedSegmentId = null;
                this.updateUI();
                this.saveToCache();
            } else {
                this.addLog('warning', result.message || '部署锚点失败');
            }
        } catch (err) {
            console.error('Deploy anchor failed:', err);
            this.addLog('fail', '网络错误，部署失败');
        }
    }

    updateUI() {
        if (!this.gameState) return;

        const game = this.gameState.game;
        document.getElementById('turnValue').textContent = game.turn;
        document.getElementById('lengthValue').textContent = this.gameState.total_length || 0;
        document.getElementById('sealedValue').textContent = game.total_sealed;
        document.getElementById('anchorValue').textContent = game.anchors_deployed;
        document.getElementById('anchorAvailValue').textContent = game.anchors_available;
        document.getElementById('branchValue').textContent = this.gameState.branch_count || 1;
        document.getElementById('scoreValue').textContent = game.score;

        document.getElementById('outOfControlBanner').style.display =
            this.gameState.is_out_of_control ? 'block' : 'none';
        document.getElementById('shakeBanner').style.display =
            this.gameState.is_shaking ? 'block' : 'none';
    }

    addLog(type, message) {
        const turn = this.gameState ? this.gameState.game.turn : 0;
        const logEntry = { type, message, turn };
        this.logs.unshift(logEntry);
        if (this.logs.length > 50) this.logs.pop();

        const panel = document.getElementById('logPanel');
        if (!panel) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="turn">[T${turn}]</span>${message}`;
        panel.insertBefore(entry, panel.firstChild);

        while (panel.children.length > 50) {
            panel.removeChild(panel.lastChild);
        }

        this.saveToCache();
    }

    animate() {
        this.animationFrame++;
        this.vortexAngle = (this.vortexAngle + 0.03) % (Math.PI * 2);
        this.pulsePhase = (this.pulsePhase + 0.05) % (Math.PI * 2);
        this.render();
        requestAnimationFrame(() => this.animate());
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBackground();
        if (!this.gameState) return;

        this.drawRiftSegments();
        this.drawVortices();
        this.drawAnchors();
        this.drawTracker();
        this.drawSelectionHighlight();
    }

    drawBackground() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        const gradient = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h) / 1.2);
        gradient.addColorStop(0, '#1a0933');
        gradient.addColorStop(0.5, '#0f0420');
        gradient.addColorStop(1, '#05010d');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5 + this.animationFrame * 0.05) % w;
            const y = (i * 89.3) % h;
            const size = (Math.sin(this.pulsePhase + i) + 1) * 1.2;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawRiftSegments() {
        if (!this.gameState || !this.gameState.segments) return;

        const ctx = this.ctx;
        const segments = this.gameState.segments;

        for (const seg of segments) {
            if (seg.prev_x !== null && seg.prev_y !== null) {
                this.drawRiftLine(seg.prev_x, seg.prev_y, seg.x, seg.y, seg.is_sealed);
            }
        }

        for (const seg of segments) {
            if (seg.is_sealed) {
                this.drawSealedSegment(seg);
            } else if (seg.is_node) {
                this.drawNodeSegment(seg);
            } else {
                this.drawUnsealedSegment(seg);
            }
        }
    }

    drawRiftLine(x1, y1, x2, y2, isSealed) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 1;

        if (isSealed) {
            ctx.strokeStyle = 'rgba(74, 61, 107, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        } else {
            ctx.save();
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15 * pulse;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            const steps = Math.max(2, Math.floor(len / 5));

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const px = x1 + dx * t;
                const py = y1 + dy * t;
                const wobble = Math.sin(t * Math.PI * 4 + this.animationFrame * 0.1) * 1.5;
                const nx = -dy / len * wobble;
                const ny = dx / len * wobble;
                ctx.lineTo(px + nx, py + ny);
            }
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#fff8dc';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }
    }

    drawUnsealedSegment(seg) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.pulsePhase + seg.x * 0.01) * 0.4 + 1;

        ctx.save();
        ctx.shadowColor = '#ffa500';
        ctx.shadowBlur = 12 * pulse;

        const gradient = ctx.createRadialGradient(seg.x, seg.y, 0, seg.x, seg.y, 8);
        gradient.addColorStop(0, '#fff8dc');
        gradient.addColorStop(0.4, '#ffd700');
        gradient.addColorStop(1, '#ff8c00');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(seg.x, seg.y, 5 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawNodeSegment(seg) {
        const ctx = this.ctx;
        const pulse = Math.sin(this.pulsePhase * 1.5) * 0.3 + 1;

        ctx.save();
        ctx.shadowColor = '#ff4500';
        ctx.shadowBlur = 20 * pulse;

        const gradient = ctx.createRadialGradient(seg.x, seg.y, 0, seg.x, seg.y, 14);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#ffd700');
        gradient.addColorStop(0.6, '#ff8c00');
        gradient.addColorStop(1, '#ff4500');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(seg.x, seg.y, 9 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 69, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, 14 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        if (seg.has_anchor) {
            ctx.strokeStyle = 'rgba(0, 191, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, 20 * pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }

    drawSealedSegment(seg) {
        const ctx = this.ctx;
        ctx.save();

        ctx.fillStyle = 'rgba(74, 61, 107, 0.6)';
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(150, 130, 180, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(seg.x - 5, seg.y - 5);
        ctx.lineTo(seg.x + 5, seg.y + 5);
        ctx.moveTo(seg.x + 5, seg.y - 5);
        ctx.lineTo(seg.x - 5, seg.y + 5);
        ctx.stroke();
        ctx.restore();
    }

    drawAnchors() {
        if (!this.gameState || !this.gameState.anchors) return;

        const ctx = this.ctx;
        const activeAnchors = this.gameState.anchors.filter(a => a.status === 'active');

        if (activeAnchors.length > 0) {
            console.debug('[RiftGame] Drawing', activeAnchors.length, 'active anchors');
        }

        for (const anchor of activeAnchors) {
            const x = anchor.x;
            const y = anchor.y;
            const pulse = Math.sin(this.pulsePhase * 2) * 0.2 + 1;
            const turnsLeft = anchor.turns_remaining != null ? anchor.turns_remaining : 3;

            console.debug('[RiftGame] Drawing anchor at', x, y, 'turnsLeft:', turnsLeft);

            ctx.save();
            ctx.shadowColor = '#00bfff';
            ctx.shadowBlur = 25 * pulse;

            ctx.strokeStyle = `rgba(0, 191, 255, ${0.4 * turnsLeft / 3})`;
            ctx.lineWidth = 2;
            for (let r = 15; r <= 15 + (3 - turnsLeft) * 8; r += 8) {
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.fillStyle = '#1e90ff';
            ctx.beginPath();
            const spikeCount = 4;
            for (let i = 0; i < spikeCount * 2; i++) {
                const angle = (i * Math.PI) / spikeCount - Math.PI / 2;
                const radius = i % 2 === 0 ? 12 * pulse : 5;
                const px = x + Math.cos(angle) * radius;
                const py = y + Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#00ffff');
            gradient.addColorStop(1, '#1e90ff');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(turnsLeft.toString(), x, y);
            ctx.restore();
        }
    }

    drawVortices() {
        if (!this.gameState || !this.gameState.vortices) return;

        const ctx = this.ctx;

        for (const vortex of this.gameState.vortices) {
            if (vortex.status !== 'active') continue;

            const x = vortex.x;
            const y = vortex.y;
            const turnsLeft = vortex.turns_remaining != null ? vortex.turns_remaining : 2;

            ctx.save();
            ctx.translate(x, y);

            ctx.strokeStyle = 'rgba(255, 0, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, 50, 0, Math.PI * 2);
            ctx.stroke();

            for (let ring = 0; ring < 3; ring++) {
                const ringRadius = 12 + ring * 10;
                const ringAngle = this.vortexAngle + ring * (Math.PI / 3);

                ctx.save();
                ctx.rotate(ringAngle);

                const spiralGradient = ctx.createConicGradient
                    ? ctx.createConicGradient(0, 0, 0)
                    : ctx.createLinearGradient(-ringRadius, -ringRadius, ringRadius, ringRadius);

                const alpha = (turnsLeft / 2) * (0.8 - ring * 0.2);
                if (ctx.createConicGradient) {
                    spiralGradient.addColorStop(0, `rgba(255, 0, 255, ${alpha})`);
                    spiralGradient.addColorStop(0.25, `rgba(128, 0, 255, ${alpha * 0.8})`);
                    spiralGradient.addColorStop(0.5, `rgba(0, 191, 255, ${alpha})`);
                    spiralGradient.addColorStop(0.75, `rgba(128, 0, 255, ${alpha * 0.8})`);
                    spiralGradient.addColorStop(1, `rgba(255, 0, 255, ${alpha})`);
                } else {
                    spiralGradient.addColorStop(0, `rgba(255, 0, 255, ${alpha})`);
                    spiralGradient.addColorStop(0.5, `rgba(0, 191, 255, ${alpha})`);
                    spiralGradient.addColorStop(1, `rgba(255, 0, 255, ${alpha})`);
                }

                ctx.strokeStyle = spiralGradient;
                ctx.lineWidth = 4 - ring;
                ctx.lineCap = 'round';
                ctx.shadowColor = '#ff00ff';
                ctx.shadowBlur = 15;

                ctx.beginPath();
                const spiralTurns = 1.5;
                for (let t = 0; t <= Math.PI * 2 * spiralTurns; t += 0.1) {
                    const r = (ringRadius / (Math.PI * 2 * spiralTurns)) * t;
                    const px = Math.cos(t) * r;
                    const py = Math.sin(t) * r;
                    if (t === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.restore();
            }

            const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
            coreGradient.addColorStop(0, '#ffffff');
            coreGradient.addColorStop(0.3, '#ff00ff');
            coreGradient.addColorStop(1, '#8000ff');
            ctx.fillStyle = coreGradient;
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 25;
            ctx.beginPath();
            ctx.arc(0, 0, 6 + Math.sin(this.pulsePhase * 3) * 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    drawTracker() {
        if (!this.gameState || !this.gameState.game) return;

        const ctx = this.ctx;
        const x = this.gameState.game.tracker_x;
        const y = this.gameState.game.tracker_y;
        const pulse = Math.sin(this.pulsePhase * 2) * 0.25 + 1;

        ctx.save();

        ctx.strokeStyle = `rgba(0, 255, 136, ${0.2 + Math.sin(this.pulsePhase) * 0.1})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, 30 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 25;

        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 14, -Math.PI / 2 - 0.4, -Math.PI / 2 + 0.4);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fillStyle = '#00ff88';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 14, Math.PI / 2 - 0.4, Math.PI / 2 + 0.4);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();

        const crossSize = 7;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - crossSize, y);
        ctx.lineTo(x + crossSize, y);
        ctx.moveTo(x, y - crossSize);
        ctx.lineTo(x, y + crossSize);
        ctx.stroke();

        const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, 5);
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(1, '#00ff88');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(x, y, 3.5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawSelectionHighlight() {
        if (!this.selectedSegmentId || !this.gameState || !this.gameState.segments) return;

        const seg = this.gameState.segments.find(s => s.id === this.selectedSegmentId);
        if (!seg || seg.is_sealed) return;

        const ctx = this.ctx;
        const pulse = Math.sin(this.pulsePhase * 3) * 0.3 + 1;

        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.arc(seg.x, seg.y, 16 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new RiftGame();
});
