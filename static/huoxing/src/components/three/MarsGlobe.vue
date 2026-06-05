<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import {
  generateMarsTexture,
  createAtmosphereShader,
  createMarkerShader,
  latLngToVector3,
  disposeObject,
  type LatLng
} from '@/utils/threeHelpers'
import { REGIONS, REGION_ORDER } from '@/config/regions'
import { timeSystem } from '@/engine/TimeSystem'
import type { RegionId } from '@/config/types'

interface Props {
  radius?: number
  rotationSpeed?: number
  autoRotate?: boolean
  showMarkers?: boolean
  showAtmosphere?: boolean
}

interface RegionMarker {
  id: RegionId
  mesh: THREE.Mesh
  glowMesh: THREE.Mesh
  position: THREE.Vector3
}

const props = withDefaults(defineProps<Props>(), {
  radius: 1,
  rotationSpeed: 0.001,
  autoRotate: true,
  showMarkers: true,
  showAtmosphere: true
})

const emit = defineEmits<{
  (e: 'regionClick', regionId: RegionId): void
  (e: 'regionHover', regionId: RegionId | null): void
  (e: 'ready', data: {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    marsMesh: THREE.Mesh
  }): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let marsMesh: THREE.Mesh | null = null
let atmosphereMesh: THREE.Mesh | null = null
let atmosphereMaterial: THREE.ShaderMaterial | null = null
let regionMarkers: RegionMarker[] = []
let raycaster: THREE.Raycaster | null = null
let mouse: THREE.Vector2 | null = null
let animationId: number | null = null
let clock: THREE.Clock | null = null
let sunLight: THREE.DirectionalLight | null = null
let ambientLight: THREE.AmbientLight | null = null
let hoveredRegion: RegionId | null = null

function createMars(radius: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 64, 64)

  const textures = generateMarsTexture(1024, 512)

  const material = new THREE.MeshPhongMaterial({
    map: textures.map,
    normalMap: textures.normalMap,
    specularMap: textures.specularMap,
    specular: new THREE.Color(0x333333),
    shininess: 5
  })

  return new THREE.Mesh(geometry, material)
}

function createAtmosphere(radius: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius * 1.05, 64, 64)
  atmosphereMaterial = createAtmosphereShader()
  return new THREE.Mesh(geometry, atmosphereMaterial)
}

function createRegionMarkers(radius: number): RegionMarker[] {
  const markers: RegionMarker[] = []

  for (const regionId of REGION_ORDER) {
    const region = REGIONS[regionId]
    const position = latLngToVector3(region.position.lat, region.position.lng, radius * 1.02)

    const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16)
    const markerMaterial = createMarkerShader()
    markerMaterial.uniforms.color.value = new THREE.Color(0x00ffff)

    const mesh = new THREE.Mesh(markerGeometry, markerMaterial)
    mesh.position.copy(position)
    mesh.userData.regionId = regionId

    const glowGeometry = new THREE.SphereGeometry(0.06, 16, 16)
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x00ffff) }
      },
      vertexShader: `
        uniform float time;
        varying float vIntensity;
        void main() {
          vec3 pos = position;
          float pulse = 1.0 + sin(time * 2.0) * 0.3;
          pos *= pulse;
          vIntensity = 1.0 - length(pos) / 0.06;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vIntensity;
        void main() {
          float alpha = vIntensity * 0.5;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    glowMesh.position.copy(position)
    glowMesh.userData.regionId = regionId

    markers.push({ id: regionId, mesh, glowMesh, position })
  }

  return markers
}

function setupLighting(): void {
  if (!scene) return

  ambientLight = new THREE.AmbientLight(0x404040, 0.3)
  scene.add(ambientLight)

  sunLight = new THREE.DirectionalLight(0xffffff, 1)
  sunLight.position.set(5, 3, 5)
  scene.add(sunLight)

  const fillLight = new THREE.DirectionalLight(0xff6633, 0.2)
  fillLight.position.set(-5, 0, -5)
  scene.add(fillLight)
}

function updateDayNightCycle(): void {
  if (!sunLight || !ambientLight || !marsMesh) return

  const dayProgress = timeSystem.dayProgress
  const sunAngle = dayProgress * Math.PI * 2 - Math.PI / 2

  const sunX = Math.cos(sunAngle) * 10
  const sunY = Math.sin(sunAngle) * 10
  const sunZ = 5

  if (sunLight) {
    sunLight.position.set(sunX, sunY, sunZ)
  }

  const sunIntensity = Math.max(0.2, Math.sin(sunAngle))
  if (sunLight) {
    sunLight.intensity = sunIntensity
  }

  const skyColor = timeSystem.getSkyColor()
  if (ambientLight) {
    ambientLight.color.setRGB(skyColor.r * 2, skyColor.g * 2, skyColor.b * 2)
    ambientLight.intensity = 0.2 + sunIntensity * 0.3
  }

  if (marsMesh && marsMesh.material instanceof THREE.MeshPhongMaterial) {
    marsMesh.material.emissive.setRGB(
      skyColor.r * 0.1,
      skyColor.g * 0.05,
      skyColor.b * 0.05
    )
  }

  if (atmosphereMaterial) {
    const glowIntensity = 0.4 + sunIntensity * 0.6
    atmosphereMaterial.uniforms.glowColor.value.setRGB(
      1.0 * glowIntensity,
      0.4 * glowIntensity,
      0.2 * glowIntensity
    )
  }
}

function handleClick(event: MouseEvent): void {
  if (!containerRef.value || !camera || !marsMesh || !raycaster || !mouse) return

  const rect = containerRef.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const markerMeshes = regionMarkers.map(m => m.mesh)
  const intersects = raycaster.intersectObjects([...markerMeshes, marsMesh])

  if (intersects.length > 0) {
    const clicked = intersects[0].object
    if (clicked.userData.regionId) {
      emit('regionClick', clicked.userData.regionId)
      focusOnRegion(clicked.userData.regionId)
    }
  }
}

function handleMouseMove(event: MouseEvent): void {
  if (!containerRef.value || !camera || !raycaster || !mouse) return

  const rect = containerRef.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const markerMeshes = regionMarkers.map(m => m.mesh)
  const intersects = raycaster.intersectObjects(markerMeshes)

  if (intersects.length > 0) {
    const regionId = intersects[0].object.userData.regionId as RegionId
    if (regionId !== hoveredRegion) {
      hoveredRegion = regionId
      emit('regionHover', regionId)
      updateMarkerHighlight(regionId)
    }
  } else if (hoveredRegion !== null) {
    hoveredRegion = null
    emit('regionHover', null)
    updateMarkerHighlight(null)
  }
}

function updateMarkerHighlight(selectedId: RegionId | null): void {
  for (const marker of regionMarkers) {
    const material = marker.mesh.material as THREE.ShaderMaterial
    if (marker.id === selectedId) {
      material.uniforms.color.value = new THREE.Color(0xffff00)
      marker.mesh.scale.setScalar(1.5)
      marker.glowMesh.scale.setScalar(1.5)
    } else {
      material.uniforms.color.value = new THREE.Color(0x00ffff)
      marker.mesh.scale.setScalar(1)
      marker.glowMesh.scale.setScalar(1)
    }
  }
}

function focusOnRegion(regionId: RegionId): void {
  if (!camera || !controls || !marsMesh) return

  const region = REGIONS[regionId]
  const targetPosition = latLngToVector3(region.position.lat, region.position.lng, 3)

  const targetLookAt = latLngToVector3(region.position.lat, region.position.lng, props.radius)

  const duration = 1000
  const startPosition = camera.position.clone()
  const startTime = Date.now()

  function animateCamera() {
    const elapsed = Date.now() - startTime
    const t = Math.min(1, elapsed / duration)
    const easeT = 1 - Math.pow(1 - t, 3)

    camera!.position.lerpVectors(startPosition, targetPosition, easeT)
    controls!.target.lerp(targetLookAt, easeT)
    controls!.update()

    if (t < 1) {
      requestAnimationFrame(animateCamera)
    }
  }

  animateCamera()
}

function init(): void {
  if (!containerRef.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000011)

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
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  containerRef.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enablePan = false
  controls.minDistance = 1.5
  controls.maxDistance = 5

  setupLighting()

  marsMesh = createMars(props.radius)
  scene.add(marsMesh)

  if (props.showAtmosphere) {
    atmosphereMesh = createAtmosphere(props.radius)
    scene.add(atmosphereMesh)
  }

  if (props.showMarkers) {
    regionMarkers = createRegionMarkers(props.radius)
    for (const marker of regionMarkers) {
      scene.add(marker.mesh)
      scene.add(marker.glowMesh)
    }
  }

  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()
  clock = new THREE.Clock()

  renderer.domElement.addEventListener('click', handleClick)
  renderer.domElement.addEventListener('mousemove', handleMouseMove)

  emit('ready', { scene, camera, renderer, marsMesh })

  animate()
}

function animate(): void {
  animationId = requestAnimationFrame(animate)

  if (!renderer || !scene || !camera || !controls || !clock) return

  const delta = clock.getDelta()
  const elapsed = clock.getElapsedTime()

  timeSystem.update(delta)
  updateDayNightCycle()

  if (marsMesh && props.autoRotate) {
    marsMesh.rotation.y += props.rotationSpeed
  }

  if (atmosphereMesh && props.autoRotate) {
    atmosphereMesh.rotation.y += props.rotationSpeed
  }

  for (const marker of regionMarkers) {
    const markerMaterial = marker.mesh.material as THREE.ShaderMaterial
    markerMaterial.uniforms.time.value = elapsed

    const glowMaterial = marker.glowMesh.material as THREE.ShaderMaterial
    glowMaterial.uniforms.time.value = elapsed

    if (marsMesh) {
      const rotatedPosition = marker.position.clone().applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        marsMesh.rotation.y
      )
      marker.mesh.position.copy(rotatedPosition)
      marker.glowMesh.position.copy(rotatedPosition)

      marker.mesh.lookAt(camera.position)
      marker.glowMesh.lookAt(camera.position)
    }
  }

  controls.update()
  renderer.render(scene, camera)
}

function handleResize(): void {
  if (!containerRef.value || !camera || !renderer) return
  camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}

function cleanup(): void {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  if (renderer && containerRef.value) {
    renderer.domElement.removeEventListener('click', handleClick)
    renderer.domElement.removeEventListener('mousemove', handleMouseMove)
    containerRef.value.removeChild(renderer.domElement)
  }

  for (const marker of regionMarkers) {
    if (scene) {
      scene.remove(marker.mesh)
      scene.remove(marker.glowMesh)
    }
    disposeObject(marker.mesh)
    disposeObject(marker.glowMesh)
  }
  regionMarkers = []

  if (marsMesh) {
    if (scene) scene.remove(marsMesh)
    disposeObject(marsMesh)
    marsMesh = null
  }

  if (atmosphereMesh) {
    if (scene) scene.remove(atmosphereMesh)
    disposeObject(atmosphereMesh)
    atmosphereMesh = null
  }
  atmosphereMaterial = null

  if (renderer) {
    renderer.dispose()
    renderer = null
  }

  if (controls) {
    controls.dispose()
    controls = null
  }

  scene = null
  camera = null
  raycaster = null
  mouse = null
  clock = null
  sunLight = null
  ambientLight = null
  hoveredRegion = null
}

watch(() => props.showMarkers, (show) => {
  if (!scene) return
  for (const marker of regionMarkers) {
    marker.mesh.visible = show
    marker.glowMesh.visible = show
  }
})

watch(() => props.showAtmosphere, (show) => {
  if (!scene || !atmosphereMesh) return
  atmosphereMesh.visible = show
})

watch(() => props.autoRotate, () => {})
watch(() => props.rotationSpeed, () => {})

defineExpose({
  focusOnRegion
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
