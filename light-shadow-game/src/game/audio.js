const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null

let soundEnabled = true

export const setSoundEnabled = (enabled) => {
  soundEnabled = enabled
}

export const playSound = (type) => {
  if (!soundEnabled || !audioContext) return
  
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  const now = audioContext.currentTime
  
  switch (type) {
    case 'click':
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(800, now)
      oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1)
      gainNode.gain.setValueAtTime(0.1, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
      oscillator.start(now)
      oscillator.stop(now + 0.1)
      break
      
    case 'select':
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(523, now)
      oscillator.frequency.setValueAtTime(659, now + 0.1)
      oscillator.frequency.setValueAtTime(784, now + 0.2)
      gainNode.gain.setValueAtTime(0.1, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      oscillator.start(now)
      oscillator.stop(now + 0.3)
      break
      
    case 'collect':
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, now)
      oscillator.frequency.exponentialRampToValueAtTime(1760, now + 0.15)
      gainNode.gain.setValueAtTime(0.15, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
      oscillator.start(now)
      oscillator.stop(now + 0.2)
      break
      
    case 'switch':
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(300, now)
      oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.2)
      gainNode.gain.setValueAtTime(0.1, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
      oscillator.start(now)
      oscillator.stop(now + 0.25)
      break
      
    case 'damage':
      oscillator.type = 'sawtooth'
      oscillator.frequency.setValueAtTime(200, now)
      oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.3)
      gainNode.gain.setValueAtTime(0.15, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      oscillator.start(now)
      oscillator.stop(now + 0.3)
      break
      
    case 'win':
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()
        osc.connect(gain)
        gain.connect(audioContext.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + i * 0.15)
        gain.gain.setValueAtTime(0.1, now + i * 0.15)
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3)
        osc.start(now + i * 0.15)
        osc.stop(now + i * 0.15 + 0.3)
      })
      break
      
    case 'jump':
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(400, now)
      oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1)
      gainNode.gain.setValueAtTime(0.08, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
      oscillator.start(now)
      oscillator.stop(now + 0.15)
      break
      
    case 'torch':
      oscillator.type = 'sawtooth'
      oscillator.frequency.setValueAtTime(150, now)
      oscillator.frequency.linearRampToValueAtTime(250, now + 0.3)
      gainNode.gain.setValueAtTime(0.08, now)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
      oscillator.start(now)
      oscillator.stop(now + 0.4)
      break
  }
}
