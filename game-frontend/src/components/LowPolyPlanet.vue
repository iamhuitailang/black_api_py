<template>
  <g
    class="planet-node"
    :transform="`translate(${cx}, ${cy})`"
    :class="{
      'is-current': isCurrent,
      'is-target': isTarget,
      [`faction-${faction}`]: true,
    }"
  >
    <circle
      v-if="isCurrent"
      class="pulse-ring ring-1"
      :r="size * 1.4"
      fill="none"
      stroke="#4fd1c5"
      stroke-width="1.5"
    />
    <circle
      v-if="isCurrent"
      class="pulse-ring ring-2"
      :r="size * 1.4"
      fill="none"
      stroke="#4fd1c5"
      stroke-width="1"
    />
    <circle
      v-if="isTarget"
      class="target-ring"
      :r="size * 1.25"
      fill="none"
      stroke="#d69e2e"
      stroke-width="2"
      stroke-dasharray="5 4"
    />

    <defs>
      <radialGradient :id="`grad-${uid}`" cx="40%" cy="35%" r="65%">
        <stop offset="0%" :stop-color="lightenColor(color, 40)" stop-opacity="1" />
        <stop offset="45%" :stop-color="lightenColor(color, 10)" stop-opacity="1" />
        <stop offset="100%" :stop-color="darkenColor(color, 40)" stop-opacity="1" />
      </radialGradient>
      <filter :id="`glow-${uid}`">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <circle
      :r="size * 1.5"
      fill="none"
      :stroke="color"
      stroke-opacity="0.08"
      stroke-width="12"
    />

    <g class="planet-body" :filter="`url(#glow-${uid})`">
      <polygon
        :points="outerPoints"
        :fill="`url(#grad-${uid})`"
        :stroke="lightenColor(color, 30)"
        stroke-width="0.8"
        stroke-opacity="0.6"
        class="planet-poly main-poly"
      />
      <polygon
        v-for="(slice, i) in polySlices"
        :key="i"
        :points="slice.points"
        :fill="slice.fill"
        fill-opacity="0.35"
        stroke="none"
        class="poly-slice"
      />
      <polygon
        :points="specularPoints"
        fill="white"
        fill-opacity="0.18"
        class="specular"
      />
    </g>

    <g class="planet-label">
      <rect
        :x="labelBgX"
        :y="size + 14"
        :width="labelWidth"
        height="22"
        rx="2"
        fill="rgba(10, 14, 23, 0.85)"
        :stroke="isCurrent ? '#4fd1c5' : (isTarget ? '#d69e2e' : 'rgba(79, 209, 197, 0.3)')"
        stroke-width="1"
      />
      <text
        :x="0"
        :y="size + 30"
        text-anchor="middle"
        fill="currentColor"
        font-family="'Orbitron', sans-serif"
        font-size="11"
        font-weight="600"
        letter-spacing="0.06em"
        class="planet-name"
      >{{ name }}</text>
      <text
        v-if="danger > 1"
        :x="labelWidth/2 - 20"
        :y="size + 24"
        text-anchor="end"
        fill="#d69e2e"
        font-size="10"
        font-weight="700"
      >
        <tspan v-for="i in danger" :key="i">★</tspan>
      </text>
    </g>
  </g>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  cx: { type: Number, required: true },
  cy: { type: Number, required: true },
  size: { type: Number, default: 30 },
  color: { type: String, default: '#4a90d9' },
  name: { type: String, default: '' },
  isCurrent: { type: Boolean, default: false },
  isTarget: { type: Boolean, default: false },
  faction: { type: String, default: 'neutral' },
  danger: { type: Number, default: 1 },
})

const uid = Math.random().toString(36).slice(2, 10)
const labelWidth = computed(() => Math.max(props.name.length * 12 + 24, 80))
const labelBgX = computed(() => -labelWidth.value / 2)

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => {
    const s = Math.max(0, Math.min(255, Math.round(v))).toString(16)
    return s.length === 1 ? '0' + s : s
  }).join('')
}
function lightenColor(hex, amt) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(r + (255 - r) * amt / 100, g + (255 - g) * amt / 100, b + (255 - b) * amt / 100)
}
function darkenColor(hex, amt) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(r * (1 - amt / 100), g * (1 - amt / 100), b * (1 - amt / 100))
}

function seededRand(seed) {
  const x = Math.sin(seed * 9999.1) * 10000
  return x - Math.floor(x)
}

const polyPoints = computed(() => {
  const n = 9
  const s = props.size
  const seed = props.name.length + props.size
  const pts = []
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    const variance = 0.82 + seededRand(seed + i * 13) * 0.3
    const r = s * variance
    pts.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    })
  }
  return pts
})

const outerPoints = computed(() =>
  polyPoints.value.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
)

const polySlices = computed(() => {
  const pts = polyPoints.value
  const slices = []
  const colors = [
    lightenColor(props.color, 25),
    lightenColor(props.color, 5),
    darkenColor(props.color, 15),
    darkenColor(props.color, 30),
    lightenColor(props.color, 15),
  ]
  for (let i = 0; i < pts.length; i += 2) {
    const p1 = pts[i]
    const p2 = pts[(i + 1) % pts.length]
    const p3 = pts[(i + 2) % pts.length]
    slices.push({
      points: `0,0 ${p1.x.toFixed(2)},${p1.y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)} ${p3.x.toFixed(2)},${p3.y.toFixed(2)}`,
      fill: colors[i % colors.length],
    })
  }
  return slices
})

const specularPoints = computed(() => {
  const s = props.size
  const pts = []
  for (let i = 0; i < 5; i++) {
    const angle = (-Math.PI * 0.6) + (i / 4) * Math.PI * 0.5
    const r = s * 0.55 * (0.75 + i * 0.06)
    pts.push(`${(Math.cos(angle) * r - s * 0.25).toFixed(2)},${(Math.sin(angle) * r - s * 0.3).toFixed(2)}`)
  }
  for (let i = 4; i >= 0; i--) {
    const angle = (-Math.PI * 0.6) + (i / 4) * Math.PI * 0.5
    const r = s * 0.38 * (0.7 + (4 - i) * 0.06)
    pts.push(`${(Math.cos(angle) * r - s * 0.25).toFixed(2)},${(Math.sin(angle) * r - s * 0.3).toFixed(2)}`)
  }
  return pts.join(' ')
})
</script>

<style scoped>
.planet-node {
  transition: transform 0.2s ease;
  transform-box: fill-box;
  transform-origin: center;
  color: var(--text-primary);
}
.planet-node:hover {
  transform: scale(1.08);
}
.planet-node:hover .main-poly {
  stroke-opacity: 1;
  stroke-width: 1.5;
}
.planet-node.is-current {
  color: var(--accent-cyan);
}
.planet-node.is-target {
  color: var(--accent-gold);
}
.planet-body {
  animation: planet-breath 5s ease-in-out infinite;
}
@keyframes planet-breath {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.92; }
}
.poly-slice {
  transition: opacity 0.3s ease;
}
.specular {
  mix-blend-mode: screen;
}
.pulse-ring {
  transform-origin: center;
}
.pulse-ring.ring-1 {
  animation: pulse 2.2s ease-out infinite;
}
.pulse-ring.ring-2 {
  animation: pulse 2.2s ease-out infinite 1.1s;
}
@keyframes pulse {
  0% { r: 0; opacity: 0.8; stroke-width: 3; }
  100% { r: calc(100% * 2); opacity: 0; stroke-width: 0.5; }
}
.target-ring {
  animation: target-spin 8s linear infinite;
  transform-origin: center;
}
@keyframes target-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.planet-label {
  pointer-events: none;
}
.planet-node.faction-pirate:hover { filter: drop-shadow(0 0 12px rgba(252, 129, 129, 0.5)); }
.planet-node.faction-military:hover { filter: drop-shadow(0 0 12px rgba(99, 179, 237, 0.5)); }
.planet-node.faction-corporate:hover { filter: drop-shadow(0 0 12px rgba(183, 148, 244, 0.5)); }
.planet-node.is-current { filter: drop-shadow(0 0 16px rgba(79, 209, 197, 0.6)); }
.planet-node.is-target { filter: drop-shadow(0 0 16px rgba(214, 158, 46, 0.6)); }
</style>
