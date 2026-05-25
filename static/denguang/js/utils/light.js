const LIGHT_ENGINE = {
  lights: [],
  animationFrame: null,
  isAnimating: false,
  currentScene: null,
  currentParams: null,
  beatTime: 0,
  isOnBeat: false,

  init(scene, params) {
    this.currentScene = scene
    this.currentParams = { ...params }
    this.lights = []
  },

  addLight(x, y, type, params = {}) {
    const light = {
      id: Date.now() + Math.random(),
      x,
      y,
      type,
      params: {
        brightness: params.brightness || 80,
        hue: params.hue || 0,
        saturation: params.saturation || 100,
        size: params.size || 30,
        ...params
      }
    }
    this.lights.push(light)
    return light
  },

  removeLight(id) {
    this.lights = this.lights.filter(l => l.id !== id)
  },

  clearLights() {
    this.lights = []
  },

  updateParams(params) {
    this.currentParams = { ...params }
  },

  updateScene(scene) {
    this.currentScene = scene
  },

  setBeat(onBeat, beatCount) {
    this.isOnBeat = onBeat
    this.beatTime = Date.now()
  },

  startAnimation() {
    if (this.isAnimating) return
    this.isAnimating = true
    this.animate()
  },

  stopAnimation() {
    this.isAnimating = false
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  },

  animate() {
    if (!this.isAnimating) return

    const time = Date.now()
    const params = this.currentParams || {}
    const scene = this.currentScene

    this.lights.forEach(light => {
      this.updateLightAnimation(light, time, params, scene)
    })

    this.animationFrame = requestAnimationFrame(() => this.animate())
  },

  updateLightAnimation(light, time, params, scene) {
    const pattern = params.pattern || 0
    const speed = (params.speed || 50) / 100
    const timeScale = speed * 2

    switch (pattern) {
      case 0:
        light.currentBrightness = params.brightness || 80
        break
      case 1:
        light.currentBrightness = this.breathe(time, timeScale, params.brightness)
        break
      case 2:
        light.currentBrightness = this.strobe(time, timeScale, params.brightness)
        break
      case 3:
        light.currentBrightness = this.flow(time, timeScale, params.brightness, light.x)
        break
      case 4:
        light.currentBrightness = this.pulse(time, timeScale, params.brightness)
        break
    }

    if (scene && scene.lightPattern === 'strobe' && this.isOnBeat) {
      light.currentBrightness = Math.min(100, (light.currentBrightness || 0) + 30)
    }

    light.currentHue = this.getHue(time, params, light)
  },

  breathe(time, speed, baseBrightness) {
    const cycle = Math.sin(time / (1000 / speed))
    return baseBrightness * (0.7 + 0.3 * cycle)
  },

  strobe(time, speed, baseBrightness) {
    const cycle = (time / (100 / speed)) % 1
    return cycle < 0.1 ? baseBrightness : 0
  },

  flow(time, speed, baseBrightness, x) {
    const offset = (x || 50) / 100 * Math.PI * 2
    const cycle = Math.sin(time / (500 / speed) + offset)
    return baseBrightness * (0.6 + 0.4 * cycle)
  },

  pulse(time, speed, baseBrightness) {
    const cycle = Math.abs(Math.sin(time / (300 / speed)))
    return baseBrightness * (0.5 + 0.5 * cycle)
  },

  getHue(time, params, light) {
    const baseHue = params.hue || 0
    const scene = this.currentScene

    if (scene && scene.lightPattern === 'beam') {
      return (baseHue + time / 20) % 360
    }

    if (scene && scene.lightPattern === 'strobe' && this.isOnBeat) {
      return (baseHue + 180) % 360
    }

    if (light.params.hue !== undefined) {
      return light.params.hue
    }

    return baseHue
  },

  renderLights(canvas) {
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    this.lights.forEach(light => {
      const x = (light.x / 100) * w
      const y = (light.y / 100) * h
      const brightness = (light.currentBrightness || 0) / 100
      const hue = light.currentHue || 0
      const saturation = (this.currentParams?.saturation || 100) / 100

      if (brightness <= 0) return

      const radius = (light.params.size || 30) * brightness * (w / 300)
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)

      const color = `hsla(${hue}, ${saturation * 100}%, 50%,`
      gradient.addColorStop(0, `${color} ${brightness})`)
      gradient.addColorStop(0.3, `${color} ${brightness * 0.7})`)
      gradient.addColorStop(0.7, `${color} ${brightness * 0.3})`)
      gradient.addColorStop(1, `${color} 0)`)

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    })
  },

  getLightColor(light) {
    const brightness = (light.currentBrightness || 0) / 100
    const hue = light.currentHue || 0
    const saturation = (this.currentParams?.saturation || 100) / 100

    return `hsla(${hue}, ${saturation * 100}%, 50%, ${brightness})`
  },

  getAmbientStyle() {
    const params = this.currentParams || {}
    const scene = this.currentScene

    if (!scene) return {}

    const brightness = (params.brightness || 80) / 100
    const hue = params.hue || 0

    return {
      background: scene.ambientColor,
      filter: `brightness(${0.5 + brightness * 0.5}) hue-rotate(${hue}deg)`,
      boxShadow: `inset 0 0 100px hsla(${hue}, 100%, 50%, ${brightness * 0.3})`
    }
  }
}

window.LIGHT_ENGINE = LIGHT_ENGINE
