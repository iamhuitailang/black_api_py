const PianoPage = {
    trackId: null,
    track: null,
    isPlaying: false,
    isPaused: false,
    score: 0,
    combo: 0,
    maxCombo: 0,
    totalNotes: 0,
    hitNotes: 0,
    perfectHits: 0,
    greatHits: 0,
    goodHits: 0,
    misses: 0,
    gameTime: 0,
    totalTime: 60,
    noteSpeed: 2.5,
    notes: [],
    activeNotes: [],
    animationFrame: null,
    lastFrameTime: 0,
    hitLineY: 0,
    pixelsPerSecond: 0,
    triggeredMagic: [],

    pianoKeys: [
        { note: 'C4', key: 'a', type: 'white', freq: 261.63, label: 'C' },
        { note: 'C#4', key: 'w', type: 'black', freq: 277.18, label: 'C#' },
        { note: 'D4', key: 's', type: 'white', freq: 293.66, label: 'D' },
        { note: 'D#4', key: 'e', type: 'black', freq: 311.13, label: 'D#' },
        { note: 'E4', key: 'd', type: 'white', freq: 329.63, label: 'E' },
        { note: 'F4', key: 'f', type: 'white', freq: 349.23, label: 'F' },
        { note: 'F#4', key: 't', type: 'black', freq: 369.99, label: 'F#' },
        { note: 'G4', key: 'g', type: 'white', freq: 392.00, label: 'G' },
        { note: 'G#4', key: 'y', type: 'black', freq: 415.30, label: 'G#' },
        { note: 'A4', key: 'h', type: 'white', freq: 440.00, label: 'A' },
        { note: 'A#4', key: 'u', type: 'black', freq: 466.16, label: 'A#' },
        { note: 'B4', key: 'j', type: 'white', freq: 493.88, label: 'B' },
        { note: 'C5', key: 'k', type: 'white', freq: 523.25, label: 'C5' }
    ],

    mockNotes: [
        { time: 0.5, note: 'C4', duration: 0.5 },
        { time: 1.0, note: 'D4', duration: 0.5 },
        { time: 1.5, note: 'E4', duration: 0.5 },
        { time: 2.0, note: 'F4', duration: 0.5 },
        { time: 2.5, note: 'E4', duration: 0.5 },
        { time: 3.0, note: 'D4', duration: 0.5 },
        { time: 3.5, note: 'C4', duration: 1 },
        { time: 5.0, note: 'G4', duration: 0.5 },
        { time: 5.5, note: 'A4', duration: 0.5 },
        { time: 6.0, note: 'B4', duration: 0.5 },
        { time: 6.5, note: 'C5', duration: 1 },
        { time: 8.0, note: 'C4', duration: 0.5 },
        { time: 8.5, note: 'E4', duration: 0.5 },
        { time: 9.0, note: 'G4', duration: 0.5 },
        { time: 9.5, note: 'C5', duration: 1 },
        { time: 11.0, note: 'D4', duration: 0.5 },
        { time: 11.5, note: 'F#4', duration: 0.5 },
        { time: 12.0, note: 'A4', duration: 0.5 },
        { time: 12.5, note: 'B4', duration: 0.5 },
        { time: 13.0, note: 'A4', duration: 0.5 },
        { time: 13.5, note: 'F#4', duration: 0.5 },
        { time: 14.0, note: 'D4', duration: 1 },
        { time: 16.0, note: 'C4', duration: 0.5 },
        { time: 16.5, note: 'D4', duration: 0.5 },
        { time: 17.0, note: 'E4', duration: 0.5 },
        { time: 17.5, note: 'F4', duration: 0.5 },
        { time: 18.0, note: 'G4', duration: 0.5 },
        { time: 18.5, note: 'A4', duration: 0.5 },
        { time: 19.0, note: 'B4', duration: 0.5 },
        { time: 19.5, note: 'C5', duration: 1.5 }
    ],

    audioContext: null,
    _keyHandler: null,

    render() {
        const params = Router.getParams();
        this.trackId = params.track_id || 1;

        this.resetState();

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="piano-page">
                <div class="piano-header">
                    <button class="piano-back" onclick="PianoPage.exitGame()">←</button>
                    <div class="piano-hud">
                        <div class="hud-item">
                            <div class="hud-label">分数</div>
                            <div class="hud-value" id="hudScore">0</div>
                        </div>
                        <div class="hud-item">
                            <div class="hud-label">连击</div>
                            <div class="hud-value hud-combo" id="hudCombo">0</div>
                        </div>
                        <div class="hud-item">
                            <div class="hud-label">准确率</div>
                            <div class="hud-value" id="hudAccuracy">0%</div>
                        </div>
                    </div>
                    <div class="piano-controls">
                        <button class="control-btn" id="pauseBtn" onclick="PianoPage.togglePause()">⏸</button>
                    </div>
                </div>

                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                </div>

                <div class="note-area" id="noteArea">
                    <div class="hit-line" id="hitLine"></div>
                    <div class="combo-display" id="comboDisplay">
                        <div class="combo-number" id="comboNumber">0</div>
                        <div class="combo-label">COMBO</div>
                    </div>
                    <div class="magic-effects" id="magicEffects"></div>
                </div>

                <div class="piano-keyboard">
                    <div class="piano-keys" id="pianoKeys">
                        ${this.renderPianoKeys()}
                    </div>
                </div>
            </div>
        `;

        this.initGame();
        this.bindEvents();
    },

    renderPianoKeys() {
        let html = '';
        const whiteKeys = this.pianoKeys.filter(k => k.type === 'white');
        const blackKeys = this.pianoKeys.filter(k => k.type === 'black');

        whiteKeys.forEach(key => {
            html += `
                <div class="piano-key white" data-note="${key.note}" data-key="${key.key}">
                    <span class="key-label">${key.label}</span>
                    <span class="key-shortcut">${key.key.toUpperCase()}</span>
                </div>
            `;
        });

        blackKeys.forEach(key => {
            html += `
                <div class="piano-key black" data-note="${key.note}" data-key="${key.key}" style="left: ${key.offset}px">
                    <span class="key-label">${key.label}</span>
                </div>
            `;
        });

        return html;
    },

    resetState() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalNotes = 0;
        this.hitNotes = 0;
        this.perfectHits = 0;
        this.greatHits = 0;
        this.goodHits = 0;
        this.misses = 0;
        this.gameTime = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.activeNotes = [];
        this.notes = this.mockNotes.map(n => ({ ...n, spawned: false }));
        this.totalTime = Math.max(...this.notes.map(n => n.time + n.duration)) + 2;
        this.triggeredMagic = [];
    },

    initGame() {
        this.initAudio();
        const noteArea = document.getElementById('noteArea');
        if (noteArea) {
            this.hitLineY = noteArea.offsetHeight - 80;
            this.pixelsPerSecond = (noteArea.offsetHeight / 2) * this.noteSpeed;
        }
        const hitLine = document.getElementById('hitLine');
        if (hitLine) {
            hitLine.style.top = this.hitLineY + 'px';
        }
        this.startGame();
    },

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {}
    },

    playNote(frequency, duration = 0.3) {
        if (!this.audioContext) return;
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {}
    },

    startGame() {
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        this.gameLoop();
    },

    gameLoop() {
        if (!this.isPlaying) return;
        if (this.isPaused) {
            this.lastFrameTime = performance.now();
            this.animationFrame = requestAnimationFrame(() => this.gameLoop());
            return;
        }

        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        if (deltaTime > 0.1) {
            this.animationFrame = requestAnimationFrame(() => this.gameLoop());
            return;
        }

        this.gameTime += deltaTime;
        this.spawnNotes();
        this.updateNotes();
        this.checkMissedNotes();
        this.updateUI();

        if (this.gameTime >= this.totalTime && this.activeNotes.length === 0) {
            this.endGame();
            return;
        }

        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    },

    spawnNotes() {
        if (this.pixelsPerSecond <= 0) return;

        const spawnAheadTime = (this.hitLineY + 100) / this.pixelsPerSecond;

        const notesToSpawn = this.notes.filter(n =>
            n.time <= this.gameTime + spawnAheadTime && !n.spawned
        );

        notesToSpawn.forEach(note => {
            note.spawned = true;
            this.totalNotes++;
            this.createNoteElement(note);
        });
    },

    createNoteElement(note) {
        const noteArea = document.getElementById('noteArea');
        const keyData = this.pianoKeys.find(k => k.note === note.note);
        if (!noteArea || !keyData) return;

        const whiteKeys = this.pianoKeys.filter(k => k.type === 'white');
        const whiteKeyWidth = 38;
        const noteWidth = keyData.type === 'white' ? whiteKeyWidth - 4 : 24;

        let laneX;
        if (keyData.type === 'white') {
            const idx = whiteKeys.findIndex(k => k.note === note.note);
            laneX = idx * whiteKeyWidth + 2;
        } else {
            laneX = keyData.offset - 4;
        }

        const noteEl = document.createElement('div');
        noteEl.className = `note ${keyData.type === 'black' ? 'note-black' : 'note-white'}`;
        noteEl.style.left = laneX + 'px';
        noteEl.style.width = noteWidth + 'px';
        noteEl.dataset.note = note.note;
        noteEl.dataset.targetTime = note.time;

        const noteLabel = document.createElement('span');
        noteLabel.className = 'note-label';
        noteLabel.textContent = keyData.label;
        noteEl.appendChild(noteLabel);

        noteArea.appendChild(noteEl);

        const y = this.hitLineY - (note.time - this.gameTime) * this.pixelsPerSecond;
        noteEl.style.top = y + 'px';

        this.activeNotes.push({
            element: noteEl,
            note: note.note,
            targetTime: note.time,
            hit: false
        });
    },

    updateNotes() {
        this.activeNotes.forEach(noteData => {
            if (noteData.hit) return;
            const y = this.hitLineY - (noteData.targetTime - this.gameTime) * this.pixelsPerSecond;
            noteData.element.style.top = y + 'px';
        });
    },

    checkMissedNotes() {
        const noteArea = document.getElementById('noteArea');
        if (!noteArea) return;
        const areaHeight = noteArea.offsetHeight;

        this.activeNotes = this.activeNotes.filter(noteData => {
            if (noteData.hit) return false;

            const y = this.hitLineY - (noteData.targetTime - this.gameTime) * this.pixelsPerSecond;

            if (y > this.hitLineY + 50) {
                this.misses++;
                this.combo = 0;
                this.showHitText(noteData.element, 'MISS', 'miss');
                noteData.element.classList.add('hit');
                setTimeout(() => noteData.element.remove(), 200);
                return false;
            }

            if (y > areaHeight + 100) {
                noteData.element.remove();
                return false;
            }

            return true;
        });
    },

    handleKeyPress(note) {
        const keyData = this.pianoKeys.find(k => k.note === note);
        if (!keyData) return;

        this.playNote(keyData.freq);

        const keyEl = document.querySelector(`.piano-key[data-note="${note}"]`);
        if (keyEl) {
            keyEl.classList.add('active', 'magic');
            setTimeout(() => {
                keyEl.classList.remove('active', 'magic');
            }, 150);
        }

        const hitZoneTop = this.hitLineY - 60;
        const hitZoneBottom = this.hitLineY + 30;

        let hitNote = null;
        let minDistance = Infinity;

        this.activeNotes.forEach(noteData => {
            if (noteData.hit || noteData.note !== note) return;

            const y = this.hitLineY - (noteData.targetTime - this.gameTime) * this.pixelsPerSecond;
            if (y >= hitZoneTop && y <= hitZoneBottom) {
                const distance = Math.abs(y - this.hitLineY);
                if (distance < minDistance) {
                    minDistance = distance;
                    hitNote = noteData;
                }
            }
        });

        if (hitNote) {
            hitNote.hit = true;
            this.hitNotes++;

            let hitType, points;
            if (minDistance < 15) {
                hitType = 'perfect';
                points = 100;
                this.perfectHits++;
            } else if (minDistance < 30) {
                hitType = 'great';
                points = 75;
                this.greatHits++;
            } else {
                hitType = 'good';
                points = 50;
                this.goodHits++;
            }

            this.combo++;
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }

            const comboBonus = Math.floor(this.combo / 10) * 10;
            this.score += points + comboBonus;

            this.showHitText(hitNote.element, hitType.toUpperCase(), hitType);
            this.createMagicEffect(hitNote.element);
            this.showCombo();

            hitNote.element.classList.add('hit');
            setTimeout(() => hitNote.element.remove(), 200);
        }

        this.updateUI();
    },

    showHitText(element, text, type) {
        const noteArea = document.getElementById('noteArea');
        if (!noteArea) return;

        const y = this.hitLineY - 30;
        const hitText = document.createElement('div');
        hitText.className = `hit-text ${type}`;
        hitText.textContent = text;
        hitText.style.left = element.style.left;
        hitText.style.top = y + 'px';

        noteArea.appendChild(hitText);
        setTimeout(() => hitText.remove(), 800);
    },

    createMagicEffect(element) {
        const effectsContainer = document.getElementById('magicEffects');
        if (!effectsContainer) return;

        const x = parseFloat(element.style.left) + 15;
        const y = this.hitLineY;

        const colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#fbbf24', '#10b981', '#f97316'];
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'magic-particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.transform = `rotate(${i * 45}deg)`;

            effectsContainer.appendChild(particle);
            setTimeout(() => particle.remove(), 1500);
        }
    },

    showCombo() {
        const comboDisplay = document.getElementById('comboDisplay');
        const comboNumber = document.getElementById('comboNumber');

        if (this.combo >= 5) {
            comboDisplay.classList.add('show');
            comboNumber.textContent = this.combo;
            comboNumber.style.animation = 'none';
            comboNumber.offsetHeight;
            comboNumber.style.animation = 'comboPulse 0.3s ease-out';
        }

        clearTimeout(this.comboTimeout);
        this.comboTimeout = setTimeout(() => {
            comboDisplay.classList.remove('show');
        }, 1000);
    },

    updateUI() {
        const accuracy = this.totalNotes > 0
            ? Math.round((this.hitNotes / this.totalNotes) * 100)
            : 0;

        const progress = Math.min((this.gameTime / this.totalTime) * 100, 100);

        const scoreEl = document.getElementById('hudScore');
        const comboEl = document.getElementById('hudCombo');
        const accEl = document.getElementById('hudAccuracy');
        const progEl = document.getElementById('progressFill');

        if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
        if (comboEl) comboEl.textContent = this.combo;
        if (accEl) accEl.textContent = accuracy + '%';
        if (progEl) progEl.style.width = progress + '%';
    },

    togglePause() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('pauseBtn');
        if (btn) {
            btn.textContent = this.isPaused ? '▶' : '⏸';
        }
    },

    endGame() {
        this.isPlaying = false;
        cancelAnimationFrame(this.animationFrame);

        const accuracy = this.totalNotes > 0
            ? Math.round((this.hitNotes / this.totalNotes) * 100)
            : 0;

        let stars = 0;
        if (accuracy >= 95 && this.maxCombo >= 20) stars = 3;
        else if (accuracy >= 80 && this.maxCombo >= 10) stars = 2;
        else if (accuracy >= 60) stars = 1;

        this.submitScore(stars, accuracy);
        this.showResult(stars, accuracy);
    },

    showResult(stars, accuracy) {
        const modal = document.createElement('div');
        modal.className = 'result-modal';
        modal.id = 'resultModal';
        modal.innerHTML = `
            <div class="result-content">
                <div class="result-title">演奏完成！</div>
                <div class="result-score">${this.score.toLocaleString()}</div>
                <div class="result-stars">
                    ${Array(3).fill(0).map((_, i) => `
                        <span class="star ${i < stars ? 'filled' : ''}" style="animation-delay: ${i * 0.2}s">★</span>
                    `).join('')}
                </div>
                <div class="result-stats">
                    <div class="result-stat">
                        <div class="result-stat-value">${this.maxCombo}</div>
                        <div class="result-stat-label">最大连击</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-value">${accuracy}%</div>
                        <div class="result-stat-label">准确率</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-value">${this.perfectHits}</div>
                        <div class="result-stat-label">PERFECT</div>
                    </div>
                </div>
                <div class="result-actions">
                    <button class="btn btn-outline" onclick="PianoPage.backToTracks()">返回</button>
                    <button class="btn btn-magic" onclick="PianoPage.retry()">再玩一次</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async submitScore(stars, accuracy) {
        try {
            await ApiService.post('/gq/score/submit', {
                track_id: this.trackId,
                score: this.score,
                stars: stars,
                accuracy: accuracy / 100,
                max_combo: this.maxCombo,
                magic_effects: JSON.stringify(this.triggeredMagic || [])
            });
        } catch (error) {
            console.log('提交分数失败:', error);
        }
    },

    backToTracks() {
        const modal = document.getElementById('resultModal');
        if (modal) modal.remove();
        this.destroy();
        Router.navigate('tracks');
    },

    retry() {
        const modal = document.getElementById('resultModal');
        if (modal) modal.remove();
        this.destroy();
        this.render();
    },

    exitGame() {
        this.destroy();
        Router.navigate('tracks');
    },

    bindEvents() {
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
        }

        document.querySelectorAll('.piano-key').forEach(key => {
            const note = key.dataset.note;

            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleKeyPress(note);
            });

            key.addEventListener('mousedown', () => {
                this.handleKeyPress(note);
            });
        });

        this._keyHandler = (e) => {
            if (e.repeat) return;
            const key = e.key.toLowerCase();
            const keyData = this.pianoKeys.find(k => k.key === key);
            if (keyData) {
                this.handleKeyPress(keyData.note);
            }

            if (e.key === ' ' || e.key === 'Escape') {
                e.preventDefault();
                this.togglePause();
            }
        };

        document.addEventListener('keydown', this._keyHandler);
    },

    destroy() {
        this.isPlaying = false;
        cancelAnimationFrame(this.animationFrame);
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
            this._keyHandler = null;
        }
        if (this.audioContext) {
            try { this.audioContext.close(); } catch(e) {}
            this.audioContext = null;
        }
    }
};
