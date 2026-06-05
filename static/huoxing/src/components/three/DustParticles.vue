<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { disposeObject } from '@/utils/threeHelpers'

interface Props {
  particleCount?: number
  innerRadius?: number
  outerRadius?: number
  particleSize?: number
  windSpeed?: number
  density?: number
}

const props = withDefaults(defineProps<Props>(), {
  particleCount: 2000,
  innerRadius: 1.2,
  outerRadius: 2.5,
  particleSize: 0.02,
  windSpeed: 0.5,
  density: 1.0
})

const emit = defineEmits<{
  (e: 'ready', particles: THREE.Points): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let particles: THREE.Points | null = null
let animationId: number | null = null
let clock: THREE.Clock | null = null

function createDustParticles(): THREE.Points {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(props.particleCount * 3)
  const colors = new Float32Array(props.particleCount * 3)
  const sizes = new Float32Array(props.particleCount)
  const speeds = new Float32Array(props.particleCount)
  const phases = new Float32Array(props.particleCount)

  const dustColors = [
    new THREE.Color(0xd4a574),
    new THREE.Color(0xc99a6c),
    new THREE.Color(0xb8865a),
    new THREE.Color(0xe0b88c),
    new THREE.Color(0x9c6b4a)
  ]

  for (let i = 0; i < props.particleCount; i++) {
    const i3 = i * 3

    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = props.innerRadius + Math.random() * (props.outerRadius - props.innerRadius)

    positions[i3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8
    positions[i3 + 2] = r * Math.cos(phi)

    const color = dustColors[Math.floor(Math.random() * dustColors.length)]
    const alpha = 0.3 + Math.random() * 0.4
    colors[i3] = color.r * alpha
    colors[i3 + 1] = color.g * alpha
    colors[i3 + 2] = color.b * alpha

    sizes[i] = props.particleSize * (0.5 + Math.random() * 1.5)
    speeds[i] = 0.5 + Math.random() * 1.5
    phases[i] = Math.random() * Math.PI * 2
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1))
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1))

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      windSpeed: { value: props.windSpeed },
      density: { value: props.density }
    },
    vertexShader: `
      attribute float size;
      attribute float speed;
      attribute float phase;
      uniform float time;
      uniform float windSpeed;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = color;

        vec3 pos = position;

        float t = time * windSpeed * speed + phase;

        pos.x += sin(t * 0.5) * 0.1;
        pos.z += cos(t * 0.3) * 0.15;
        pos.y += sin(t * 0.7) * 0.05;

        float distFromCenter = length(pos);
        float orbitalSpeed = 0.1 / distFromCenter;
        float angle = time * windSpeed * orbitalSpeed + phase;
        float x = pos.x * cos(angle) - pos.z * sin(angle);
        float z = pos.x * sin(angle) + pos.z * cos(angle);
        pos.x = x;
        pos.z = z;

        vAlpha = 0.3 + 0.3 * sin(t);

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float density;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;

        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        alpha = alpha * vAlpha * density;

        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  const points = new THREE.Points(geometry, material)
  return points
}

function init() {
  if (!containerRef.value) return

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(
    60,
    containerRef.value.clientWidth / containerRef.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 0, 3)

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.appendChild(renderer.domElement)

  particles = createDustParticles()
  scene.add(particles)

  clock = new THREE.Clock()

  emit('ready', particles)

  animate()
}

function animate() {
  animationId = requestAnimationFrame(animate)

  if (!renderer || !scene || !camera || !particles || !clock) return

  const elapsed = clock.getElapsedTime()
  const material = particles.material as THREE.ShaderMaterial
  material.uniforms.time.value = elapsed

  renderer.render(scene, camera)
}

function handleResize() {
  if (!containerRef.value || !camera || !renderer) return
  camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}

function cleanup() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  if (particles) {
    disposeObject(particles)
    particles = null
  }

  if (renderer && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement)
    renderer.dispose()
    renderer = null
  }

  scene = null
  camera = null
  clock = null
}

watch(() => props.windSpeed, (speed) => {
  if (particles) {
    const material = particles.material as THREE.ShaderMaterial
    material.uniforms.windSpeed.value = speed
  }
})

watch(() => props.density, (density) => {
  if (particles) {
    const material = particles.material as THREE.ShaderMaterial
    material.uniforms.density.value = density
  }
})

onMounted(() => {
  init()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cleanup()
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full"></div>
</template>
