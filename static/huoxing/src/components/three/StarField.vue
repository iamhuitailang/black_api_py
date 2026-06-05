<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { disposeObject } from '@/utils/threeHelpers'

interface Props {
  starCount?: number
  radius?: number
  size?: number
  twinkleSpeed?: number
}

const props = withDefaults(defineProps<Props>(), {
  starCount: 5000,
  radius: 100,
  size: 0.5,
  twinkleSpeed: 1.0
})

const emit = defineEmits<{
  (e: 'ready', points: THREE.Points): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let stars: THREE.Points | null = null
let animationId: number | null = null
let clock: THREE.Clock | null = null

function createStars(): THREE.Points {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(props.starCount * 3)
  const colors = new Float32Array(props.starCount * 3)
  const sizes = new Float32Array(props.starCount)
  const twinkleOffsets = new Float32Array(props.starCount)

  const colorPalette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xffeedd),
    new THREE.Color(0xddedff),
    new THREE.Color(0xffddaa),
    new THREE.Color(0xaaddff)
  ]

  for (let i = 0; i < props.starCount; i++) {
    const i3 = i * 3

    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = props.radius * (0.8 + Math.random() * 0.2)

    positions[i3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = r * Math.cos(phi)

    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
    const brightness = 0.5 + Math.random() * 0.5
    colors[i3] = color.r * brightness
    colors[i3 + 1] = color.g * brightness
    colors[i3 + 2] = color.b * brightness

    sizes[i] = props.size * (0.5 + Math.random() * 1.5)
    twinkleOffsets[i] = Math.random() * Math.PI * 2
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets, 1))

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      twinkleSpeed: { value: props.twinkleSpeed }
    },
    vertexShader: `
      attribute float size;
      attribute float twinkleOffset;
      uniform float time;
      uniform float twinkleSpeed;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vColor = color;
        vTwinkle = 0.7 + 0.3 * sin(time * twinkleSpeed + twinkleOffset);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z) * vTwinkle;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;

        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        alpha = pow(alpha, 2.0) * vTwinkle;

        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  return new THREE.Points(geometry, material)
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

  stars = createStars()
  scene.add(stars)

  clock = new THREE.Clock()

  emit('ready', stars)

  animate()
}

function animate() {
  animationId = requestAnimationFrame(animate)

  if (!renderer || !scene || !camera || !stars || !clock) return

  const elapsed = clock.getElapsedTime()
  const material = stars.material as THREE.ShaderMaterial
  material.uniforms.time.value = elapsed

  if (stars) {
    stars.rotation.y += 0.0002
  }

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

  if (stars) {
    disposeObject(stars)
    stars = null
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

watch(() => props.twinkleSpeed, (speed) => {
  if (stars) {
    const material = stars.material as THREE.ShaderMaterial
    material.uniforms.twinkleSpeed.value = speed
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
