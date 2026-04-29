const DrumLab = (function() {
    const STORAGE_KEY = 'drum_lab_state';
    const canvas = document.getElementById('drumCanvas');
    const ctx = canvas.getContext('2d');
    
    let audioContext = null;
    let masterGain = null;
    let isRecording = false;
    let recordedEvents = [];
    let recordingStartTime = 0;
    let isPlayingDemo = false;
    let currentDemoNum = null;
    let savedDemoNum = null;
    let demoInterval = null;
    let tempo = 120;
    let volume = 1.0;
    let sustain = 0.5;
    let isPlayingRecorded = false;
    let playbackInterval = null;
    
    const drumTypes = {
        kick: {
            name: '底鼓',
            keys: ['Z', 'B', 'z', 'b'],
            color: '#e74c3c',
            glowColor: 'rgba(231, 76, 60, 0.6)',
            description: '低沉"咚"'
        },
        snare: {
            name: '军鼓',
            keys: ['X', 'N', 'x', 'n'],
            color: '#3498db',
            glowColor: 'rgba(52, 152, 219, 0.6)',
            description: '清脆"哒"'
        },
        hihat: {
            name: '踩镲',
            keys: ['C', 'M', 'c', 'm'],
            color: '#f39c12',
            glowColor: 'rgba(243, 156, 18, 0.6)',
            description: '短促"牙"'
        },
        crash: {
            name: '强音镲',
            keys: ['V', 'v'],
            color: '#9b59b6',
            glowColor: 'rgba(155, 89, 182, 0.6)',
            description: '响亮"响"'
        },
        ride: {
            name: '节奏镲',
            keys: ['F', 'f'],
            color: '#1abc9c',
            glowColor: 'rgba(26, 188, 156, 0.6)',
            description: '持续"叮"'
        },
        tom1: {
            name: '通通鼓1',
            keys: ['R', 'r'],
            color: '#e67e22',
            glowColor: 'rgba(230, 126, 34, 0.6)',
            description: '中音"咚"'
        },
        tom2: {
            name: '通通鼓2',
            keys: ['T', 't'],
            color: '#d35400',
            glowColor: 'rgba(211, 84, 0, 0.6)',
            description: '低音"咚"'
        },
        tom3: {
            name: '通通鼓3',
            keys: ['Y', 'y'],
            color: '#c0392b',
            glowColor: 'rgba(192, 57, 43, 0.6)',
            description: '更低音'
        }
    };
    
    const drums = [];
    const activeDrums = new Map();
    
    function initCanvas() {
        canvas.width = 900;
        canvas.height = 500;
        createDrums();
        draw();
    }
    
    function createDrums() {
        drums.length = 0;
        
        drums.push({
            type: 'tom1',
            x: 220,
            y: 120,
            radius: 50,
            isCymbal: false,
            keyDisplay: 'R'
        });
        
        drums.push({
            type: 'tom2',
            x: 350,
            y: 120,
            radius: 55,
            isCymbal: false,
            keyDisplay: 'T'
        });
        
        drums.push({
            type: 'tom3',
            x: 480,
            y: 120,
            radius: 60,
            isCymbal: false,
            keyDisplay: 'Y'
        });
        
        drums.push({
            type: 'kick',
            x: 450,
            y: 350,
            radius: 80,
            isCymbal: false,
            keyDisplay: 'Z/B'
        });
        
        drums.push({
            type: 'snare',
            x: 300,
            y: 300,
            radius: 60,
            isCymbal: false,
            keyDisplay: 'X/N'
        });
        
        drums.push({
            type: 'hihat',
            x: 150,
            y: 280,
            radius: 45,
            isCymbal: true,
            keyDisplay: 'C/M'
        });
        
        drums.push({
            type: 'crash',
            x: 650,
            y: 120,
            radius: 55,
            isCymbal: true,
            keyDisplay: 'V'
        });
        
        drums.push({
            type: 'ride',
            x: 750,
            y: 280,
            radius: 60,
            isCymbal: true,
            keyDisplay: 'F'
        });
    }
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawBackground();
        drawStands();
        
        drums.forEach(drum => {
            drawDrum(drum);
        });
        
        requestAnimationFrame(draw);
    }
    
    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
        
        const floorGradient = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
        floorGradient.addColorStop(0, '#34495e');
        floorGradient.addColorStop(1, '#2c3e50');
        ctx.fillStyle = floorGradient;
        ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    }
    
    function drawStands() {
        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        
        drums.forEach(drum => {
            if (!drum.isCymbal && drum.type !== 'kick') {
                ctx.beginPath();
                ctx.moveTo(drum.x, drum.y + drum.radius);
                ctx.lineTo(drum.x, canvas.height - 100);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(drum.x - 20, canvas.height - 100);
                ctx.lineTo(drum.x, canvas.height - 100);
                ctx.lineTo(drum.x + 20, canvas.height - 100);
                ctx.stroke();
            }
        });
    }
    
    function drawDrum(drum) {
        const drumInfo = drumTypes[drum.type];
        const isActive = activeDrums.has(drum.type);
        const activeProgress = isActive ? activeDrums.get(drum.type) : 0;
        
        ctx.save();
        
        const scale = isActive ? 1 + activeProgress * 0.1 : 1;
        const actualRadius = drum.radius * scale;
        
        if (isActive) {
            const glowRadius = actualRadius + 20 * activeProgress;
            const glowGradient = ctx.createRadialGradient(
                drum.x, drum.y, 0,
                drum.x, drum.y, glowRadius
            );
            glowGradient.addColorStop(0, drumInfo.glowColor);
            glowGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(drum.x, drum.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (drum.isCymbal) {
            drawCymbal(drum, actualRadius, drumInfo, isActive);
        } else {
            drawDrumBody(drum, actualRadius, drumInfo, isActive);
        }
        
        ctx.font = isActive ? 'bold 14px Arial' : '14px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(drum.keyDisplay, drum.x, drum.y + actualRadius + 25);
        
        ctx.font = isActive ? 'bold 12px Arial' : '12px Arial';
        ctx.fillStyle = drumInfo.color;
        ctx.fillText(drumInfo.name, drum.x, drum.y - actualRadius - 15);
        
        ctx.restore();
    }
    
    function drawCymbal(drum, radius, drumInfo, isActive) {
        const centerX = drum.x;
        const centerY = drum.y;
        
        ctx.save();
        
        ctx.shadowColor = isActive ? 'rgba(255, 215, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = isActive ? 25 : 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = isActive ? 5 : 3;
        
        const outerGradient = ctx.createRadialGradient(
            centerX, centerY - radius * 0.1, 0,
            centerX, centerY, radius
        );
        outerGradient.addColorStop(0, '#fff8dc');
        outerGradient.addColorStop(0.1, '#ffd700');
        outerGradient.addColorStop(0.25, '#daa520');
        outerGradient.addColorStop(0.4, '#cd853f');
        outerGradient.addColorStop(0.6, '#b8860b');
        outerGradient.addColorStop(0.8, '#8b6914');
        outerGradient.addColorStop(1, '#654321');
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius, radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        const highlightGradient = ctx.createLinearGradient(
            centerX - radius, centerY - radius * 0.2,
            centerX + radius * 0.5, centerY + radius * 0.1
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * 0.9, radius * 0.25, 0, Math.PI * 0.2, Math.PI * 0.8);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius, radius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = isActive ? 'rgba(255, 215, 0, 0.6)' : 'rgba(139, 69, 19, 0.3)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
            const r = radius * (0.2 + i * 0.13);
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, r, r * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        const centerGradient = ctx.createRadialGradient(
            centerX - 2, centerY - 2, 0,
            centerX, centerY, 10
        );
        centerGradient.addColorStop(0, '#4a4a4a');
        centerGradient.addColorStop(0.5, '#2d2d2d');
        centerGradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = centerGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        const centerHighlight = ctx.createRadialGradient(
            centerX - 3, centerY - 3, 0,
            centerX - 3, centerY - 3, 4
        );
        centerHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        centerHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = centerHighlight;
        ctx.beginPath();
        ctx.arc(centerX - 3, centerY - 3, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawDrumBody(drum, radius, drumInfo, isActive) {
        const centerX = drum.x;
        const centerY = drum.y;
        
        const depth = radius * 0.6;
        
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8;
        
        const bottomGradient = ctx.createRadialGradient(
            centerX, centerY + depth * 0.5, 0,
            centerX, centerY + depth * 0.5, radius
        );
        bottomGradient.addColorStop(0, lightenColor(drumInfo.color, 10));
        bottomGradient.addColorStop(0.5, drumInfo.color);
        bottomGradient.addColorStop(1, darkenColor(drumInfo.color, 30));
        
        ctx.fillStyle = bottomGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + depth * 0.5, radius, radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        const sideGradient = ctx.createLinearGradient(
            centerX - radius, centerY,
            centerX + radius, centerY
        );
        sideGradient.addColorStop(0, darkenColor(drumInfo.color, 50));
        sideGradient.addColorStop(0.15, darkenColor(drumInfo.color, 20));
        sideGradient.addColorStop(0.35, lightenColor(drumInfo.color, 10));
        sideGradient.addColorStop(0.5, lightenColor(drumInfo.color, 20));
        sideGradient.addColorStop(0.65, lightenColor(drumInfo.color, 10));
        sideGradient.addColorStop(0.85, darkenColor(drumInfo.color, 20));
        sideGradient.addColorStop(1, darkenColor(drumInfo.color, 50));
        
        ctx.fillStyle = sideGradient;
        ctx.fillRect(centerX - radius, centerY, radius * 2, depth * 0.5);
        
        const sideHighlight = ctx.createLinearGradient(
            centerX - radius * 0.3, centerY,
            centerX + radius * 0.3, centerY + depth * 0.2
        );
        sideHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        sideHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sideHighlight;
        ctx.fillRect(centerX - radius * 0.3, centerY, radius * 0.6, depth * 0.5);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - radius, centerY);
        ctx.lineTo(centerX - radius, centerY + depth * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX + radius, centerY);
        ctx.lineTo(centerX + radius, centerY + depth * 0.5);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 4;
        const lugPositions = [0.15, 0.35, 0.65, 0.85];
        lugPositions.forEach(pos => {
            const x = centerX - radius + radius * 2 * pos;
            
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.beginPath();
            ctx.moveTo(x, centerY);
            ctx.lineTo(x, centerY + depth * 0.5);
            ctx.stroke();
            
            ctx.restore();
            
            const lugGradient = ctx.createRadialGradient(x - 2, centerY - 3, 0, x, centerY, 6);
            lugGradient.addColorStop(0, '#e0e0e0');
            lugGradient.addColorStop(0.5, '#a0a0a0');
            lugGradient.addColorStop(1, '#606060');
            ctx.fillStyle = lugGradient;
            ctx.beginPath();
            ctx.arc(x, centerY, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(x, centerY + depth * 0.5, 6, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.save();
        ctx.shadowColor = isActive ? drumInfo.glowColor : 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = isActive ? 20 : 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = isActive ? 0 : 5;
        
        const topGradient = ctx.createRadialGradient(
            centerX - radius * 0.2, centerY - radius * 0.1, 0,
            centerX, centerY, radius
        );
        topGradient.addColorStop(0, '#ffffff');
        topGradient.addColorStop(0.3, '#f8f8f8');
        topGradient.addColorStop(0.6, '#e8e8e8');
        topGradient.addColorStop(0.85, '#d0d0d0');
        topGradient.addColorStop(1, '#a0a0a0');
        
        ctx.fillStyle = topGradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius, radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        const drumHeadHighlight = ctx.createLinearGradient(
            centerX - radius * 0.8, centerY - radius * 0.15,
            centerX + radius * 0.3, centerY + radius * 0.1
        );
        drumHeadHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        drumHeadHighlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        drumHeadHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = drumHeadHighlight;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * 0.9, radius * 0.25, 0, Math.PI * 0.1, Math.PI * 0.9);
        ctx.fill();
        
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        const hoopGradient = ctx.createLinearGradient(
            centerX - radius, centerY - radius * 0.15,
            centerX + radius, centerY + radius * 0.15
        );
        hoopGradient.addColorStop(0, '#606060');
        hoopGradient.addColorStop(0.2, '#a0a0a0');
        hoopGradient.addColorStop(0.5, '#e0e0e0');
        hoopGradient.addColorStop(0.8, '#a0a0a0');
        hoopGradient.addColorStop(1, '#606060');
        
        ctx.strokeStyle = isActive ? drumInfo.glowColor : hoopGradient;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius, radius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
            const r = radius * (0.25 + i * 0.18);
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, r, r * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    function lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min((num >> 16) + amt, 255);
        const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
        const B = Math.min((num & 0x0000FF) + amt, 255);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    function darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioContext.createGain();
            masterGain.gain.value = volume;
            masterGain.connect(audioContext.destination);
        }
    }
    
    function playDrumSound(type) {
        initAudio();
        
        const now = audioContext.currentTime;
        const sustainTime = sustain * 1.5;
        
        switch (type) {
            case 'kick':
                playKick(now, sustainTime);
                break;
            case 'snare':
                playSnare(now, sustainTime);
                break;
            case 'hihat':
                playHiHat(now, sustainTime * 0.5);
                break;
            case 'crash':
                playCrash(now, sustainTime * 2);
                break;
            case 'ride':
                playRide(now, sustainTime);
                break;
            case 'tom1':
                playTom(now, sustainTime, 200, 100);
                break;
            case 'tom2':
                playTom(now, sustainTime, 150, 80);
                break;
            case 'tom3':
                playTom(now, sustainTime, 100, 60);
                break;
        }
    }
    
    function playKick(time, duration) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + duration);
        
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        osc.start(time);
        osc.stop(time + duration);
    }
    
    function playSnare(time, duration) {
        const noiseBuffer = createNoiseBuffer();
        const noise = audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        
        const noiseFilter = audioContext.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;
        
        const noiseGain = audioContext.createGain();
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        
        noiseGain.gain.setValueAtTime(1, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        const osc = audioContext.createOscillator();
        const oscGain = audioContext.createGain();
        
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        
        osc.frequency.setValueAtTime(250, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + duration * 0.5);
        
        oscGain.gain.setValueAtTime(0.7, time);
        oscGain.gain.exponentialRampToValueAtTime(0.01, time + duration * 0.5);
        
        noise.start(time);
        noise.stop(time + duration);
        osc.start(time);
        osc.stop(time + duration * 0.5);
    }
    
    function playHiHat(time, duration) {
        const noiseBuffer = createNoiseBuffer();
        const noise = audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        
        const filter = audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;
        
        const gain = audioContext.createGain();
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        noise.start(time);
        noise.stop(time + duration);
    }
    
    function playCrash(time, duration) {
        const noiseBuffer = createNoiseBuffer();
        const noise = audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        
        const filter = audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        filter.Q.value = 1;
        
        const gain = audioContext.createGain();
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        noise.start(time);
        noise.stop(time + duration);
    }
    
    function playRide(time, duration) {
        const osc = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'triangle';
        osc2.type = 'triangle';
        
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(masterGain);
        
        osc.frequency.setValueAtTime(400, time);
        osc2.frequency.setValueAtTime(600, time);
        
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        osc.start(time);
        osc2.start(time);
        osc.stop(time + duration);
        osc2.stop(time + duration);
    }
    
    function playTom(time, duration, startFreq, endFreq) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
        
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        osc.start(time);
        osc.stop(time + duration);
    }
    
    function createNoiseBuffer() {
        const bufferSize = audioContext.sampleRate * 2;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
    
    function triggerDrum(type) {
        if (activeDrums.has(type)) return;
        
        activeDrums.set(type, 1);
        
        const startTime = Date.now();
        const duration = 200;
        
        function updateAnimation() {
            const elapsed = Date.now() - startTime;
            const progress = Math.max(0, 1 - elapsed / duration);
            
            if (progress > 0) {
                activeDrums.set(type, progress);
                requestAnimationFrame(updateAnimation);
            } else {
                activeDrums.delete(type);
            }
        }
        
        updateAnimation();
        playDrumSound(type);
        
        if (isRecording) {
            const timestamp = Date.now() - recordingStartTime;
            recordedEvents.push({
                type: type,
                timestamp: timestamp
            });
            saveState();
        }
    }
    
    function getDrumTypeByKey(key) {
        for (const [type, info] of Object.entries(drumTypes)) {
            if (info.keys.includes(key)) {
                return type;
            }
        }
        return null;
    }
    
    function getDrumAtPosition(x, y) {
        for (let i = drums.length - 1; i >= 0; i--) {
            const drum = drums[i];
            const dx = x - drum.x;
            const dy = y - drum.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= drum.radius) {
                return drum.type;
            }
        }
        return null;
    }
    
    function initEventListeners() {
        document.addEventListener('keydown', (e) => {
            const type = getDrumTypeByKey(e.key);
            if (type) {
                e.preventDefault();
                triggerDrum(type);
            }
        });
        
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            const type = getDrumAtPosition(x, y);
            if (type) {
                triggerDrum(type);
            }
        });
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            
            const type = getDrumAtPosition(x, y);
            if (type) {
                triggerDrum(type);
            }
        });
        
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        volumeSlider.addEventListener('input', (e) => {
            volume = e.target.value / 100;
            volumeValue.textContent = e.target.value + '%';
            if (masterGain) {
                masterGain.gain.value = volume;
            }
            saveState();
        });
        
        const tempoSlider = document.getElementById('tempoSlider');
        const tempoValue = document.getElementById('tempoValue');
        tempoSlider.addEventListener('input', (e) => {
            tempo = parseInt(e.target.value);
            tempoValue.textContent = tempo + ' BPM';
            saveState();
        });
        
        const sustainSlider = document.getElementById('sustainSlider');
        const sustainValue = document.getElementById('sustainValue');
        sustainSlider.addEventListener('input', (e) => {
            sustain = e.target.value / 100;
            sustainValue.textContent = e.target.value + '%';
            saveState();
        });
        
        document.getElementById('recordBtn').addEventListener('click', startRecording);
        document.getElementById('stopRecordBtn').addEventListener('click', stopRecording);
        document.getElementById('playbackBtn').addEventListener('click', playRecorded);
        document.getElementById('clearBtn').addEventListener('click', clearRecorded);
        
        document.querySelectorAll('.demo-btn[data-demo]').forEach(btn => {
            btn.addEventListener('click', () => {
                const demoNum = parseInt(btn.dataset.demo);
                playDemo(demoNum);
            });
        });
        
        document.getElementById('stopDemo').addEventListener('click', stopDemo);
        
        const restoreDemoBtn = document.getElementById('restoreDemoBtn');
        const dismissRestoreBtn = document.getElementById('dismissRestoreBtn');
        
        if (restoreDemoBtn) {
            restoreDemoBtn.addEventListener('click', () => {
                if (savedDemoNum) {
                    playDemo(savedDemoNum);
                }
            });
        }
        
        if (dismissRestoreBtn) {
            dismissRestoreBtn.addEventListener('click', () => {
                savedDemoNum = null;
                saveState();
                hideRestoreSection();
            });
        }
    }
    
    function startRecording() {
        if (isRecording) return;
        
        isRecording = true;
        recordingStartTime = Date.now();
        recordedEvents = [];
        
        const btn = document.getElementById('recordBtn');
        btn.classList.add('recording');
        btn.textContent = '录制中...';
        
        saveState();
    }
    
    function stopRecording() {
        isRecording = false;
        
        const btn = document.getElementById('recordBtn');
        btn.classList.remove('recording');
        btn.textContent = '开始录制';
        
        saveState();
    }
    
    function playRecorded() {
        if (recordedEvents.length === 0 || isPlayingRecorded) return;
        
        isPlayingRecorded = true;
        
        const sortedEvents = [...recordedEvents].sort((a, b) => a.timestamp - b.timestamp);
        
        let currentIndex = 0;
        const startTime = Date.now();
        
        function playNext() {
            if (currentIndex >= sortedEvents.length) {
                isPlayingRecorded = false;
                return;
            }
            
            const event = sortedEvents[currentIndex];
            const elapsed = Date.now() - startTime;
            
            if (elapsed >= event.timestamp) {
                triggerDrum(event.type);
                currentIndex++;
            }
            
            if (currentIndex < sortedEvents.length) {
                playbackInterval = requestAnimationFrame(playNext);
            } else {
                isPlayingRecorded = false;
            }
        }
        
        playNext();
    }
    
    function clearRecorded() {
        if (isPlayingRecorded) {
            cancelAnimationFrame(playbackInterval);
            isPlayingRecorded = false;
        }
        recordedEvents = [];
        saveState();
    }
    
    const demoPatterns = {
        1: [
            { bar: 1, beat: 1, drums: ['kick', 'hihat'] },
            { bar: 1, beat: 2, drums: ['hihat'] },
            { bar: 1, beat: 3, drums: ['snare', 'hihat'] },
            { bar: 1, beat: 4, drums: ['hihat'] },
            { bar: 2, beat: 1, drums: ['kick', 'hihat'] },
            { bar: 2, beat: 2, drums: ['hihat'] },
            { bar: 2, beat: 3, drums: ['snare', 'hihat'] },
            { bar: 2, beat: 4, drums: ['hihat'] },
            { bar: 3, beat: 1, drums: ['kick', 'hihat'] },
            { bar: 3, beat: 2, drums: ['hihat'] },
            { bar: 3, beat: 3, drums: ['snare', 'hihat'] },
            { bar: 3, beat: 4, drums: ['hihat', 'crash'] },
            { bar: 4, beat: 1, drums: ['kick', 'hihat', 'tom1'] },
            { bar: 4, beat: 2, drums: ['hihat', 'tom2'] },
            { bar: 4, beat: 3, drums: ['snare', 'hihat', 'tom3'] },
            { bar: 4, beat: 4, drums: ['hihat', 'crash'] }
        ],
        2: [
            { bar: 1, beat: 1, drums: ['kick', 'ride'] },
            { bar: 1, beat: 1.5, drums: ['ride'] },
            { bar: 1, beat: 2, drums: ['snare', 'ride'] },
            { bar: 1, beat: 2.5, drums: ['ride'] },
            { bar: 1, beat: 3, drums: ['kick', 'ride'] },
            { bar: 1, beat: 3.5, drums: ['ride'] },
            { bar: 1, beat: 4, drums: ['snare', 'ride'] },
            { bar: 1, beat: 4.5, drums: ['ride'] },
            { bar: 2, beat: 1, drums: ['kick', 'ride', 'tom1'] },
            { bar: 2, beat: 1.5, drums: ['ride', 'tom2'] },
            { bar: 2, beat: 2, drums: ['snare', 'ride', 'tom3'] },
            { bar: 2, beat: 2.5, drums: ['ride'] },
            { bar: 2, beat: 3, drums: ['kick', 'ride'] },
            { bar: 2, beat: 3.5, drums: ['ride'] },
            { bar: 2, beat: 4, drums: ['snare', 'ride', 'crash'] },
            { bar: 2, beat: 4.5, drums: ['ride'] }
        ],
        3: [
            { bar: 1, beat: 1, drums: ['kick', 'hihat', 'crash'] },
            { bar: 1, beat: 2, drums: ['hihat'] },
            { bar: 1, beat: 2.5, drums: ['kick'] },
            { bar: 1, beat: 3, drums: ['snare', 'hihat'] },
            { bar: 1, beat: 4, drums: ['kick', 'hihat'] },
            { bar: 2, beat: 1, drums: ['kick', 'hihat'] },
            { bar: 2, beat: 2, drums: ['hihat'] },
            { bar: 2, beat: 3, drums: ['snare', 'hihat'] },
            { bar: 2, beat: 4, drums: ['hihat'] },
            { bar: 3, beat: 1, drums: ['tom1', 'hihat'] },
            { bar: 3, beat: 2, drums: ['tom2', 'hihat'] },
            { bar: 3, beat: 3, drums: ['tom3', 'snare', 'hihat'] },
            { bar: 3, beat: 4, drums: ['kick', 'hihat', 'crash'] },
            { bar: 4, beat: 1, drums: ['kick', 'ride'] },
            { bar: 4, beat: 2, drums: ['ride'] },
            { bar: 4, beat: 3, drums: ['snare', 'ride'] },
            { bar: 4, beat: 4, drums: ['ride', 'crash'] }
        ]
    };
    
    function playDemo(demoNum) {
        if (isPlayingDemo) {
            stopDemo();
        }
        
        const pattern = demoPatterns[demoNum];
        if (!pattern) return;
        
        isPlayingDemo = true;
        currentDemoNum = demoNum;
        savedDemoNum = demoNum;
        saveState();
        
        hideRestoreSection();
        
        const beatDuration = 60000 / tempo;
        
        const sortedPattern = [...pattern].sort((a, b) => {
            const posA = (a.bar - 1) * 4 + a.beat;
            const posB = (b.bar - 1) * 4 + b.beat;
            return posA - posB;
        });
        
        let patternIndex = 0;
        let iteration = 0;
        let currentBeat = 0;
        const maxIterations = 4;
        
        function playNextBeat() {
            if (!isPlayingDemo || iteration >= maxIterations) {
                isPlayingDemo = false;
                currentDemoNum = null;
                savedDemoNum = null;
                saveState();
                return;
            }
            
            const currentPos = iteration * 16 + currentBeat * 0.5;
            
            while (patternIndex < sortedPattern.length) {
                const event = sortedPattern[patternIndex];
                const eventPos = (event.bar - 1) * 4 + event.beat;
                
                if (Math.abs(currentPos - eventPos) < 0.1) {
                    event.drums.forEach(drum => triggerDrum(drum));
                    patternIndex++;
                } else {
                    break;
                }
            }
            
            currentBeat += 0.5;
            
            if (currentBeat >= 8) {
                currentBeat = 0;
                iteration++;
                patternIndex = 0;
            }
            
            demoInterval = setTimeout(playNextBeat, beatDuration / 2);
        }
        
        playNextBeat();
    }
    
    function stopDemo() {
        isPlayingDemo = false;
        currentDemoNum = null;
        savedDemoNum = null;
        if (demoInterval) {
            clearTimeout(demoInterval);
            demoInterval = null;
        }
        saveState();
        hideRestoreSection();
    }
    
    function showRestoreSection(demoNum) {
        const section = document.getElementById('restoreDemoSection');
        const numSpan = document.getElementById('restoreDemoNum');
        if (section && numSpan) {
            numSpan.textContent = demoNum;
            section.style.display = 'block';
        }
    }
    
    function hideRestoreSection() {
        const section = document.getElementById('restoreDemoSection');
        if (section) {
            section.style.display = 'none';
        }
    }
    
    function saveState() {
        const state = {
            volume: volume,
            tempo: tempo,
            sustain: sustain,
            recordedEvents: recordedEvents,
            savedDemoNum: savedDemoNum
        };
        
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }
    
    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const state = JSON.parse(saved);
                
                if (state.volume !== undefined) {
                    volume = state.volume;
                    document.getElementById('volumeSlider').value = volume * 100;
                    document.getElementById('volumeValue').textContent = Math.round(volume * 100) + '%';
                }
                
                if (state.tempo !== undefined) {
                    tempo = state.tempo;
                    document.getElementById('tempoSlider').value = tempo;
                    document.getElementById('tempoValue').textContent = tempo + ' BPM';
                }
                
                if (state.sustain !== undefined) {
                    sustain = state.sustain;
                    document.getElementById('sustainSlider').value = sustain * 100;
                    document.getElementById('sustainValue').textContent = Math.round(sustain * 100) + '%';
                }
                
                if (state.recordedEvents) {
                    recordedEvents = state.recordedEvents;
                }
                
                if (state.savedDemoNum) {
                    savedDemoNum = state.savedDemoNum;
                    showRestoreSection(savedDemoNum);
                }
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }
    }
    
    function init() {
        initCanvas();
        initEventListeners();
        loadState();
        
        document.addEventListener('click', () => {
            initAudio();
        }, { once: true });
        
        document.addEventListener('keydown', () => {
            initAudio();
        }, { once: true });
    }
    
    return {
        init: init,
        triggerDrum: triggerDrum,
        playDemo: playDemo,
        stopDemo: stopDemo
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    DrumLab.init();
});
