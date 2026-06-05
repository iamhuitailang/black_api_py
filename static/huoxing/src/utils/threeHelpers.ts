import * as THREE from 'three'
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
type OrbitControlsType = any

export interface SceneSetup {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  controls: OrbitControlsType
  container: HTMLElement
}

export interface LatLng {
  lat: number
  lng: number
}

export function createScene(container: HTMLElement): SceneSetup {
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 0, 3)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enablePan = false
  controls.minDistance = 1.5
  controls.maxDistance = 5

  return { scene, camera, renderer, controls, container }
}

export function handleResize(setup: SceneSetup): () => void {
  const handle = () => {
    const { camera, renderer, container } = setup
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  }
  window.addEventListener('resize', handle)
  return () => window.removeEventListener('resize', handle)
}

export function latLngToVector3(lat: number, lng: number, radius: number = 1): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)

  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)

  return new THREE.Vector3(x, y, z)
}

export function vector3ToLatLng(position: THREE.Vector3, radius: number = 1): LatLng {
  const normalized = position.clone().normalize()
  const lat = 90 - Math.acos(normalized.y) * (180 / Math.PI)
  const lng = Math.atan2(normalized.z, -normalized.x) * (180 / Math.PI) - 180
  return { lat, lng }
}

export function generateMarsTexture(width: number = 1024, height: number = 512): {
  map: THREE.CanvasTexture
  normalMap: THREE.CanvasTexture
  specularMap: THREE.CanvasTexture
} {
  const mapCanvas = document.createElement('canvas')
  mapCanvas.width = width
  mapCanvas.height = height
  const mapCtx = mapCanvas.getContext('2d')!

  const normalCanvas = document.createElement('canvas')
  normalCanvas.width = width
  normalCanvas.height = height
  const normalCtx = normalCanvas.getContext('2d')!

  const specularCanvas = document.createElement('canvas')
  specularCanvas.width = width
  specularCanvas.height = height
  const specularCtx = specularCanvas.getContext('2d')!

  const baseColors = [
    { r: 193, g: 98, b: 62 },
    { r: 210, g: 120, b: 80 },
    { r: 170, g: 80, b: 50 },
    { r: 150, g: 70, b: 45 },
    { r: 220, g: 140, b: 100 },
    { r: 180, g: 100, b: 70 }
  ]

  const noise = generateNoise(width, height, 8)
  const detailNoise = generateNoise(width, height, 32)
  const largeNoise = generateNoise(width, height, 2)

  const mapImageData = mapCtx.createImageData(width, height)
  const normalImageData = normalCtx.createImageData(width, height)
  const specularImageData = specularCtx.createImageData(width, height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4

      const n = noise[y * width + x]
      const dn = detailNoise[y * width + x]
      const ln = largeNoise[y * width + x]

      const elevation = n * 0.6 + dn * 0.3 + ln * 0.1

      const polarFactor = Math.abs((y / height - 0.5) * 2)
      const isPolar = polarFactor > 0.85

      const latFactor = Math.sin((y / height) * Math.PI)
      const colorIndex = Math.floor(elevation * baseColors.length) % baseColors.length
      const baseColor = baseColors[colorIndex]

      let r = baseColor.r
      let g = baseColor.g
      let b = baseColor.b

      const variation = (dn - 0.5) * 40
      r += variation * latFactor
      g += variation * latFactor * 0.8
      b += variation * latFactor * 0.6

      if (isPolar) {
        const polarBlend = (polarFactor - 0.85) / 0.15
        r = r * (1 - polarBlend) + 200 * polarBlend
        g = g * (1 - polarBlend) + 180 * polarBlend
        b = b * (1 - polarBlend) + 160 * polarBlend
      }

      const darken = 1 - (ln - 0.5) * 0.3
      r *= darken
      g *= darken
      b *= darken

      mapImageData.data[idx] = Math.min(255, Math.max(0, r))
      mapImageData.data[idx + 1] = Math.min(255, Math.max(0, g))
      mapImageData.data[idx + 2] = Math.min(255, Math.max(0, b))
      mapImageData.data[idx + 3] = 255

      const nx = (detailNoise[y * width + x] - 0.5) * 2
      const ny = (detailNoise[(y + 1) * width + x] - detailNoise[(y - 1) * width + x]) * 2
      const nz = 0.7

      const normalLength = Math.sqrt(nx * nx + ny * ny + nz * nz)
      normalImageData.data[idx] = Math.floor((nx / normalLength * 0.5 + 0.5) * 255)
      normalImageData.data[idx + 1] = Math.floor((ny / normalLength * 0.5 + 0.5) * 255)
      normalImageData.data[idx + 2] = Math.floor((nz / normalLength * 0.5 + 0.5) * 255)
      normalImageData.data[idx + 3] = 255

      const specularValue = isPolar ? 30 + elevation * 20 : 10 + elevation * 15
      specularImageData.data[idx] = specularValue
      specularImageData.data[idx + 1] = specularValue
      specularImageData.data[idx + 2] = specularValue
      specularImageData.data[idx + 3] = 255
    }
  }

  mapCtx.putImageData(mapImageData, 0, 0)
  normalCtx.putImageData(normalImageData, 0, 0)
  specularCtx.putImageData(specularImageData, 0, 0)

  const map = new THREE.CanvasTexture(mapCanvas)
  map.wrapS = THREE.RepeatWrapping
  map.wrapT = THREE.ClampToEdgeWrapping

  const normalMap = new THREE.CanvasTexture(normalCanvas)
  normalMap.wrapS = THREE.RepeatWrapping
  normalMap.wrapT = THREE.ClampToEdgeWrapping

  const specularMap = new THREE.CanvasTexture(specularCanvas)
  specularMap.wrapS = THREE.RepeatWrapping
  specularMap.wrapT = THREE.ClampToEdgeWrapping

  return { map, normalMap, specularMap }
}

function generateNoise(width: number, height: number, scale: number): number[] {
  const noise: number[] = []
  const seed = Math.random() * 1000

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x / width * scale
      const ny = y / height * scale

      let value = 0
      let amplitude = 1
      let frequency = 1
      let maxValue = 0

      for (let octave = 0; octave < 4; octave++) {
        value += perlinNoise(nx * frequency + seed, ny * frequency + seed) * amplitude
        maxValue += amplitude
        amplitude *= 0.5
        frequency *= 2
      }

      noise.push((value / maxValue + 1) / 2)
    }
  }

  return noise
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a)
}

function grad(hash: number, x: number, y: number): number {
  const h = Math.floor(hash) & 3
  const u = h < 2 ? x : y
  const v = h < 2 ? y : x
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

function perlinNoise(x: number, y: number): number {
  const xi = Math.floor(x) & 255
  const yi = Math.floor(y) & 255
  const xf = x - Math.floor(x)
  const yf = y - Math.floor(y)

  const u = fade(xf)
  const v = fade(yf)

  const aa = hash(xi, yi)
  const ab = hash(xi, yi + 1)
  const ba = hash(xi + 1, yi)
  const bb = hash(xi + 1, yi + 1)

  const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u)
  const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u)

  return lerp(x1, x2, v)
}

function hash(x: number, y: number): number {
  const p = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180]

  return p[(p[x & 255] + y) & 255]
}

export function createAtmosphereShader(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0xff6633) }
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(glowColor, intensity * 0.6);
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
  })
}

export function createMarkerShader(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(0x00ffff) }
    },
    vertexShader: `
      uniform float time;
      varying float vIntensity;
      void main() {
        vec3 pos = position;
        float pulse = 1.0 + sin(time * 3.0) * 0.2;
        pos *= pulse;
        vIntensity = pulse;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying float vIntensity;
      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        gl_FragColor = vec4(color, alpha * vIntensity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  })
}

export function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose())
      } else {
        child.material.dispose()
      }
    }
    if (child instanceof THREE.Points) {
      child.geometry.dispose()
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose())
      } else {
        child.material.dispose()
      }
    }
  })
}
