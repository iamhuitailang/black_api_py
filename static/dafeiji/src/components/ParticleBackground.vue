<template>
  <canvas ref="canvasRef" class="particles-canvas"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId: number = 0
let particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = []
let stars: { x: number; y: number; size: number; alpha: number; twinkleSpeed: number }[] = []

const initParticles = (canvas: HTMLCanvasElement) => {
  particles = []
  stars = []
  const count = 50
  const starCount = 100

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.01
    })
  }

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: Math.random() * 0.8 + 0.2,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.3 + 0.1
    })
  }
}

const draw = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#050710'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (const star of stars) {
    star.alpha += star.twinkleSpeed
    if (star.alpha > 0.8 || star.alpha < 0.2) {
      star.twinkleSpeed *= -1
    }
    ctx.fillStyle = `rgba(200, 220, 255, ${star.alpha})`
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    ctx.fill()
  }

  for (const p of particles) {
    ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`
    ctx.shadowColor = '#00d4ff'
    ctx.shadowBlur = 5
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    p.x += p.vx
    p.y += p.vy

    if (p.y > canvas.height + 10) {
      p.y = -10
      p.x = Math.random() * canvas.width
    }
    if (p.x < -10) p.x = canvas.width + 10
    if (p.x > canvas.width + 10) p.x = -10
  }

  animationId = requestAnimationFrame(() => draw(canvas, ctx))
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    initParticles(canvas)
  }

  resize()
  window.addEventListener('resize', resize)

  const ctx = canvas.getContext('2d')
  if (ctx) {
    draw(canvas, ctx)
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped>
.particles-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}
</style>
