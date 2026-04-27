document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('piano-canvas');
    
    const audio = new window.PianoAudio();
    const pianoKeys = new window.PianoKeys(canvas, audio);
    const demoPlayer = new window.DemoPlayer(audio, pianoKeys);
    const metronome = new window.Metronome(audio);
    
    pianoKeys.draw();
    
    const volumeSlider = document.getElementById('volume');
    const volumeValue = document.getElementById('volume-value');
    
    volumeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        audio.setVolume(value);
        volumeValue.textContent = value + '%';
    });
    
    const sustainBtn = document.getElementById('sustain-btn');
    let sustainActive = false;
    
    sustainBtn.addEventListener('click', () => {
        sustainActive = !sustainActive;
        audio.setSustain(sustainActive);
        sustainBtn.classList.toggle('active', sustainActive);
    });
    
    const notationBtn = document.getElementById('notation-btn');
    let jianpuMode = false;
    
    notationBtn.addEventListener('click', () => {
        jianpuMode = !jianpuMode;
        pianoKeys.setJianpuMode(jianpuMode);
        notationBtn.classList.toggle('active', jianpuMode);
    });
    
    const demoButtons = document.querySelectorAll('.demo-btn[data-demo]');
    let currentDemo = null;
    
    demoButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const demoName = btn.dataset.demo;
            
            if (demoName === 'stop') {
                demoPlayer.stop();
                pianoKeys.demoPlaying = false;
                currentDemo = null;
                updateDemoButtons();
                pianoKeys.draw();
                return;
            }
            
            if (currentDemo === demoName) {
                demoPlayer.stop();
                pianoKeys.demoPlaying = false;
                currentDemo = null;
            } else {
                demoPlayer.play(demoName);
                pianoKeys.demoPlaying = true;
                currentDemo = demoName;
            }
            
            updateDemoButtons();
            pianoKeys.draw();
        });
    });
    
    function updateDemoButtons() {
        demoButtons.forEach(btn => {
            const demoName = btn.dataset.demo;
            if (demoName === 'stop') {
                btn.classList.toggle('active', currentDemo !== null);
            } else {
                btn.classList.toggle('active', currentDemo === demoName);
            }
        });
    }
    
    const bpmSlider = document.getElementById('bpm');
    const bpmValue = document.getElementById('bpm-value');
    const metronomeBtn = document.getElementById('metronome-btn');
    
    bpmSlider.addEventListener('input', (e) => {
        const bpm = parseInt(e.target.value);
        metronome.setBPM(bpm);
        bpmValue.textContent = bpm;
    });
    
    metronomeBtn.addEventListener('click', () => {
        const isPlaying = metronome.toggle();
        metronomeBtn.classList.toggle('active', isPlaying);
    });
    
    function initAudio() {
        if (!audio.initialized) {
            audio.init();
        }
        if (audio.audioContext && audio.audioContext.state === 'suspended') {
            audio.audioContext.resume();
        }
    }
    
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
    
    window.addEventListener('resize', () => {
        pianoKeys.resize();
        pianoKeys.initKeys();
        pianoKeys.draw();
    });
    
    console.log('钢琴模拟器已就绪');
});
