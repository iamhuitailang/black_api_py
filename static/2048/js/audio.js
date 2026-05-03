var Audio = (function() {
    'use strict';

    var audioContext = null;
    var masterGain = null;
    var isMuted = false;
    var isInitialized = false;
    var volume = 0.5;

    function init() {
        if (isInitialized) return;
        
        try {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioContext = new AudioContext();
                masterGain = audioContext.createGain();
                masterGain.gain.value = isMuted ? 0 : volume;
                masterGain.connect(audioContext.destination);
                isInitialized = true;
            }
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            isInitialized = false;
        }
        
        loadVolumePreference();
    }

    function resume() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    function loadVolumePreference() {
        var savedVolume = Storage.get('2048_volume', null);
        var savedMuted = Storage.get('2048_muted', null);
        
        if (savedVolume !== null) {
            volume = savedVolume;
        }
        if (savedMuted !== null) {
            isMuted = savedMuted;
        }
        
        updateMasterGain();
    }

    function saveVolumePreference() {
        Storage.set('2048_volume', volume);
        Storage.set('2048_muted', isMuted);
    }

    function updateMasterGain() {
        if (masterGain) {
            masterGain.gain.value = isMuted ? 0 : volume;
        }
    }

    function setVolume(value) {
        volume = Math.max(0, Math.min(1, value));
        updateMasterGain();
        saveVolumePreference();
    }

    function getVolume() {
        return volume;
    }

    function toggleMute() {
        isMuted = !isMuted;
        updateMasterGain();
        saveVolumePreference();
        return isMuted;
    }

    function isMutedState() {
        return isMuted;
    }

    function playTone(frequency, duration, type, gainValue) {
        if (!isInitialized || !audioContext) return;
        
        resume();
        
        var oscillator = audioContext.createOscillator();
        var gainNode = audioContext.createGain();
        
        oscillator.type = type || 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(gainValue * volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    function playMove() {
        if (isMuted) return;
        
        playTone(220, 0.08, 'sine', 0.15);
        setTimeout(function() {
            playTone(330, 0.06, 'sine', 0.1);
        }, 30);
    }

    function playMerge(value) {
        if (isMuted) return;
        
        var baseFreq = 440;
        var octave = Math.floor(Math.log2(value / 2)) % 4;
        var freq = baseFreq * Math.pow(2, octave);
        
        playTone(freq, 0.1, 'square', 0.2);
        setTimeout(function() {
            playTone(freq * 1.25, 0.15, 'square', 0.15);
        }, 50);
        setTimeout(function() {
            playTone(freq * 1.5, 0.2, 'square', 0.1);
        }, 100);
    }

    function playNewTile() {
        if (isMuted) return;
        
        playTone(660, 0.1, 'triangle', 0.12);
        setTimeout(function() {
            playTone(880, 0.15, 'triangle', 0.08);
        }, 40);
    }

    function playWin() {
        if (isMuted) return;
        
        var notes = [523.25, 659.25, 783.99, 1046.50];
        
        notes.forEach(function(freq, index) {
            setTimeout(function() {
                playTone(freq, 0.3, 'square', 0.25);
                setTimeout(function() {
                    playTone(freq * 1.5, 0.2, 'sine', 0.15);
                }, 100);
            }, index * 150);
        });
    }

    function playGameOver() {
        if (isMuted) return;
        
        var notes = [392, 349.23, 329.63, 293.66];
        
        notes.forEach(function(freq, index) {
            setTimeout(function() {
                playTone(freq, 0.4, 'sawtooth', 0.2);
            }, index * 200);
        });
    }

    function playUndo() {
        if (isMuted) return;
        
        playTone(330, 0.1, 'sine', 0.12);
        setTimeout(function() {
            playTone(220, 0.15, 'sine', 0.1);
        }, 50);
    }

    function playButtonClick() {
        if (isMuted) return;
        
        playTone(880, 0.05, 'sine', 0.1);
    }

    function playThemeChange() {
        if (isMuted) return;
        
        playTone(523, 0.08, 'sine', 0.12);
        setTimeout(function() {
            playTone(659, 0.08, 'sine', 0.1);
        }, 60);
    }

    return {
        init: init,
        resume: resume,
        setVolume: setVolume,
        getVolume: getVolume,
        toggleMute: toggleMute,
        isMuted: isMutedState,
        playMove: playMove,
        playMerge: playMerge,
        playNewTile: playNewTile,
        playWin: playWin,
        playGameOver: playGameOver,
        playUndo: playUndo,
        playButtonClick: playButtonClick,
        playThemeChange: playThemeChange
    };
})();
