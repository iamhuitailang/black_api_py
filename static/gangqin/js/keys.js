const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const JIANPU = ['1', '1#', '2', '2#', '3', '4', '4#', '5', '5#', '6', '6#', '7'];

const KEYBOARD_MAP = {
    'a': 60,
    'w': 61,
    's': 62,
    'e': 63,
    'd': 64,
    'f': 65,
    't': 66,
    'g': 67,
    'y': 68,
    'h': 69,
    'u': 70,
    'j': 71,
    'k': 72
};

function getNoteName(noteNumber) {
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteIndex = noteNumber % 12;
    return NOTE_NAMES[noteIndex] + octave;
}

function getJianpu(noteNumber) {
    const octave = Math.floor(noteNumber / 12);
    const noteIndex = noteNumber % 12;
    const baseJianpu = JIANPU[noteIndex];
    
    const c4Octave = 4;
    const octaveDiff = octave - c4Octave;
    
    if (octaveDiff > 0) {
        return baseJianpu + '·'.repeat(octaveDiff);
    } else if (octaveDiff < 0) {
        return '·'.repeat(-octaveDiff) + baseJianpu;
    }
    return baseJianpu;
}

class NoteState {
    constructor(noteNumber) {
        this.noteNumber = noteNumber;
        this.userPressed = false;
        this.demoPressed = false;
        this.audioRefCount = 0;
    }
    
    getIsPressed(ignoreUserInput = false) {
        if (ignoreUserInput) {
            return this.demoPressed;
        }
        return this.userPressed || this.demoPressed;
    }
}

class PianoKeys {
    constructor(canvas, audio) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audio = audio;
        
        this.startNote = 60;
        this.endNote = 83;
        
        this.whiteKeys = [];
        this.blackKeys = [];
        
        this.noteStates = new Map();
        for (let note = this.startNote; note <= this.endNote; note++) {
            this.noteStates.set(note, new NoteState(note));
        }
        
        this.activeUserNotes = new Set();
        
        this.jianpuMode = false;
        this.showLabels = true;
        
        this.demoPlaying = false;
        
        this.whiteKeyWidth = 0;
        this.whiteKeyHeight = 0;
        this.blackKeyWidth = 0;
        this.blackKeyHeight = 0;
        
        this.pressOffset = 3;
        
        this.resize();
        this.initKeys();
        this.bindEvents();
    }

    resize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 40;
        
        const whiteKeysCount = this.getWhiteKeysCount();
        const aspectRatio = 0.4;
        
        this.whiteKeyWidth = Math.min(50, containerWidth / whiteKeysCount);
        this.whiteKeyHeight = this.whiteKeyWidth / aspectRatio;
        
        this.blackKeyWidth = this.whiteKeyWidth * 0.65;
        this.blackKeyHeight = this.whiteKeyHeight * 0.6;
        
        const totalWidth = this.whiteKeyWidth * whiteKeysCount;
        const totalHeight = this.whiteKeyHeight;
        
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = totalWidth * dpr;
        this.canvas.height = totalHeight * dpr;
        this.canvas.style.width = totalWidth + 'px';
        this.canvas.style.height = totalHeight + 'px';
        this.ctx.scale(dpr, dpr);
    }

    getWhiteKeysCount() {
        let count = 0;
        for (let note = this.startNote; note <= this.endNote; note++) {
            if (!this.isBlackKey(note)) {
                count++;
            }
        }
        return count;
    }

    isBlackKey(noteNumber) {
        const noteIndex = noteNumber % 12;
        return [1, 3, 6, 8, 10].includes(noteIndex);
    }

    getBlackKeyOffset(noteNumber) {
        const noteIndex = noteNumber % 12;
        const offsets = {
            1: 0.65,
            3: 0.55,
            6: 0.7,
            8: 0.6,
            10: 0.5
        };
        return offsets[noteIndex] || 0.5;
    }

    initKeys() {
        this.whiteKeys = [];
        this.blackKeys = [];
        
        let whiteKeyX = 0;
        
        for (let note = this.startNote; note <= this.endNote; note++) {
            const isBlack = this.isBlackKey(note);
            
            if (isBlack) {
                const offset = this.getBlackKeyOffset(note);
                const blackKeyX = whiteKeyX - this.blackKeyWidth * offset;
                
                this.blackKeys.push({
                    note: note,
                    x: blackKeyX,
                    y: 0,
                    width: this.blackKeyWidth,
                    height: this.blackKeyHeight
                });
            } else {
                this.whiteKeys.push({
                    note: note,
                    x: whiteKeyX,
                    y: 0,
                    width: this.whiteKeyWidth,
                    height: this.whiteKeyHeight
                });
                whiteKeyX += this.whiteKeyWidth;
            }
        }
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handlePointerUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handlePointerUp(e));
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });
        
        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });
        
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        window.addEventListener('resize', () => {
            this.resize();
            this.initKeys();
            this.draw();
        });
    }

    getCanvasPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width / (window.devicePixelRatio || 1);
        const scaleY = this.canvas.height / rect.height / (window.devicePixelRatio || 1);
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    getKeyAtPosition(x, y) {
        for (const key of this.blackKeys) {
            if (x >= key.x && x < key.x + key.width &&
                y >= key.y && y < key.y + key.height) {
                return key;
            }
        }
        
        for (const key of this.whiteKeys) {
            if (x >= key.x && x < key.x + key.width &&
                y >= key.y && y < key.y + key.height) {
                return key;
            }
        }
        
        return null;
    }

    handlePointerDown(e) {
        const pos = this.getCanvasPosition(e);
        const key = this.getKeyAtPosition(pos.x, pos.y);
        
        if (key) {
            this.pressKeyByUser(key.note);
        }
    }

    handlePointerMove(e) {
        if (e.buttons !== 1) return;
        
        const pos = this.getCanvasPosition(e);
        const key = this.getKeyAtPosition(pos.x, pos.y);
        const currentNote = key ? key.note : null;
        
        const notesToRelease = [];
        this.activeUserNotes.forEach(note => {
            if (note !== currentNote) {
                notesToRelease.push(note);
            }
        });
        
        notesToRelease.forEach(note => this.releaseKeyByUser(note));
        
        if (key && !this.activeUserNotes.has(key.note)) {
            this.pressKeyByUser(key.note);
        }
    }

    handlePointerUp(e) {
        this.releaseAllUserKeys();
    }

    handleTouchStart(e) {
        const touches = e.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const pos = this.getCanvasPosition(touches[i]);
            const key = this.getKeyAtPosition(pos.x, pos.y);
            if (key) {
                this.pressKeyByUser(key.note);
            }
        }
    }

    handleTouchMove(e) {
        const touches = e.changedTouches;
        const currentUserNotes = new Set();
        
        for (let i = 0; i < touches.length; i++) {
            const pos = this.getCanvasPosition(touches[i]);
            const key = this.getKeyAtPosition(pos.x, pos.y);
            if (key) {
                currentUserNotes.add(key.note);
                if (!this.activeUserNotes.has(key.note)) {
                    this.pressKeyByUser(key.note);
                }
            }
        }
        
        const notesToRelease = [];
        this.activeUserNotes.forEach(note => {
            if (!currentUserNotes.has(note)) {
                notesToRelease.push(note);
            }
        });
        
        notesToRelease.forEach(note => this.releaseKeyByUser(note));
    }

    handleTouchEnd(e) {
        const touches = e.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const pos = this.getCanvasPosition(touches[i]);
            const key = this.getKeyAtPosition(pos.x, pos.y);
            if (key) {
                this.releaseKeyByUser(key.note);
            }
        }
    }

    handleKeyDown(e) {
        if (e.repeat) return;
        
        const key = e.key.toLowerCase();
        if (KEYBOARD_MAP.hasOwnProperty(key)) {
            const note = KEYBOARD_MAP[key];
            if (note >= this.startNote && note <= this.endNote) {
                this.pressKeyByUser(note);
            }
        }
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        if (KEYBOARD_MAP.hasOwnProperty(key)) {
            const note = KEYBOARD_MAP[key];
            this.releaseKeyByUser(note);
        }
    }

    pressKeyByUser(noteNumber) {
        if (this.activeUserNotes.has(noteNumber)) return;
        
        const state = this.noteStates.get(noteNumber);
        if (!state) return;
        
        const wasPressed = state.getIsPressed(this.demoPlaying);
        
        this.activeUserNotes.add(noteNumber);
        state.userPressed = true;
        
        const refCountBefore = state.audioRefCount;
        state.audioRefCount++;
        
        if (refCountBefore === 0) {
            this.audio.playNote(noteNumber);
        }
        
        const nowPressed = state.getIsPressed(this.demoPlaying);
        if (!this.demoPlaying && wasPressed !== nowPressed) {
            this.draw();
        }
    }

    releaseKeyByUser(noteNumber) {
        if (!this.activeUserNotes.has(noteNumber)) return;
        
        const state = this.noteStates.get(noteNumber);
        if (!state) return;
        
        const wasPressed = state.getIsPressed(this.demoPlaying);
        
        this.activeUserNotes.delete(noteNumber);
        state.userPressed = false;
        
        const refCountBefore = state.audioRefCount;
        state.audioRefCount--;
        
        if (state.audioRefCount === 0) {
            this.audio.stopNote(noteNumber);
        }
        
        const nowPressed = state.getIsPressed(this.demoPlaying);
        if (!this.demoPlaying && wasPressed !== nowPressed) {
            this.draw();
        }
    }

    releaseAllUserKeys() {
        const notes = Array.from(this.activeUserNotes);
        notes.forEach(note => this.releaseKeyByUser(note));
    }

    pressKey(noteNumber) {
        this.pressKeyByDemo(noteNumber);
    }

    releaseKey(noteNumber) {
        this.releaseKeyByDemo(noteNumber);
    }

    pressKeyByDemo(noteNumber) {
        const state = this.noteStates.get(noteNumber);
        if (!state) return;
        
        const wasPressed = state.isPressed;
        
        state.demoPressed = true;
        
        const refCountBefore = state.audioRefCount;
        state.audioRefCount++;
        
        if (refCountBefore === 0) {
            this.audio.playNote(noteNumber);
        }
        
        if (!wasPressed) {
            this.draw();
        }
    }

    releaseKeyByDemo(noteNumber) {
        const state = this.noteStates.get(noteNumber);
        if (!state) return;
        
        const wasPressed = state.isPressed;
        
        state.demoPressed = false;
        
        const refCountBefore = state.audioRefCount;
        state.audioRefCount--;
        
        if (state.audioRefCount === 0) {
            this.audio.stopNote(noteNumber);
        }
        
        if (wasPressed && !state.isPressed) {
            this.draw();
        }
    }

    releaseAllKeys() {
        this.noteStates.forEach((state, note) => {
            if (state.demoPressed) {
                state.demoPressed = false;
                if (state.audioRefCount > 0 && !state.userPressed) {
                    this.audio.stopNote(note);
                }
            }
            state.audioRefCount = state.userPressed ? 1 : 0;
        });
        this.draw();
    }

    getKeyByNote(noteNumber) {
        for (const key of this.blackKeys) {
            if (key.note === noteNumber) return key;
        }
        for (const key of this.whiteKeys) {
            if (key.note === noteNumber) return key;
        }
        return null;
    }

    getNoteState(noteNumber) {
        return this.noteStates.get(noteNumber);
    }

    setJianpuMode(active) {
        this.jianpuMode = active;
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (const key of this.whiteKeys) {
            this.drawWhiteKey(key);
        }
        
        for (const key of this.blackKeys) {
            this.drawBlackKey(key);
        }
    }

    drawWhiteKey(key) {
        const { x, y, width, height, note } = key;
        const state = this.getNoteState(note);
        const isPressed = state ? state.getIsPressed(this.demoPlaying) : false;
        
        const offsetY = isPressed ? this.pressOffset : 0;
        
        this.ctx.save();
        
        this.ctx.beginPath();
        this.ctx.roundRect(x, y + offsetY, width, height - offsetY, [0, 0, 6, 6]);
        
        const gradient = this.ctx.createLinearGradient(x, y + offsetY, x, y + height);
        if (isPressed) {
            gradient.addColorStop(0, '#d0d0d0');
            gradient.addColorStop(0.3, '#c0c0c0');
            gradient.addColorStop(1, '#b0b0b0');
        } else {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.8, '#f0f0f0');
            gradient.addColorStop(1, '#e0e0e0');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = isPressed ? '#999' : '#aaa';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        if (isPressed) {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 2;
        } else {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            this.ctx.shadowBlur = 3;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 1;
        }
        
        if (this.showLabels) {
            this.ctx.shadowColor = 'transparent';
            this.ctx.fillStyle = isPressed ? '#555' : '#888';
            this.ctx.font = `bold ${Math.min(14, width * 0.25)}px Arial`;
            this.ctx.textAlign = 'center';
            
            const label = this.jianpuMode ? getJianpu(note) : getNoteName(note);
            const labelY = y + height - 25 + offsetY;
            
            this.ctx.fillText(label, x + width / 2, labelY);
        }
        
        this.ctx.restore();
    }

    drawBlackKey(key) {
        const { x, y, width, height, note } = key;
        const state = this.getNoteState(note);
        const isPressed = state ? state.getIsPressed(this.demoPlaying) : false;
        
        const offsetY = isPressed ? this.pressOffset : 0;
        
        this.ctx.save();
        
        this.ctx.beginPath();
        this.ctx.roundRect(x, y + offsetY, width, height - offsetY, [0, 0, 4, 4]);
        
        const gradient = this.ctx.createLinearGradient(x, y + offsetY, x, y + height);
        if (isPressed) {
            gradient.addColorStop(0, '#2a2a2a');
            gradient.addColorStop(0.5, '#1a1a1a');
            gradient.addColorStop(1, '#0a0a0a');
        } else {
            gradient.addColorStop(0, '#3a3a3a');
            gradient.addColorStop(0.5, '#2a2a2a');
            gradient.addColorStop(1, '#1a1a1a');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = isPressed ? '#111' : '#222';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        if (isPressed) {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 2;
        } else {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 2;
        }
        
        if (this.showLabels) {
            this.ctx.shadowColor = 'transparent';
            this.ctx.fillStyle = isPressed ? '#aaa' : '#888';
            this.ctx.font = `bold ${Math.min(10, width * 0.3)}px Arial`;
            this.ctx.textAlign = 'center';
            
            const label = this.jianpuMode ? getJianpu(note) : getNoteName(note);
            const labelY = y + height - 15 + offsetY;
            
            this.ctx.fillText(label, x + width / 2, labelY);
        }
        
        this.ctx.restore();
    }
}

window.PianoKeys = PianoKeys;
window.getNoteName = getNoteName;
window.KEYBOARD_MAP = KEYBOARD_MAP;
