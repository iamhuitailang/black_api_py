<template>
  <div class="car-preview-wrapper" :class="{ 'animate-wheels': animateWheels }">
    <svg class="car-svg" :viewBox="viewBox" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient :id="'bodyGrad-' + uid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" :style="{ stopColor: primaryColor }" />
          <stop offset="50%" :style="{ stopColor: secondaryColor }" />
          <stop offset="100%" :style="{ stopColor: primaryColor }" />
        </linearGradient>
        <linearGradient :id="'accentGrad-' + uid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" :style="{ stopColor: accentColor, stopOpacity: 0.8 }" />
          <stop offset="100%" :style="{ stopColor: accentColor, stopOpacity: 1 }" />
        </linearGradient>
        <linearGradient :id="'glassGrad-' + uid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color: rgba(100, 150, 200, 0.4)" />
          <stop offset="100%" style="stop-color: rgba(50, 80, 120, 0.6)" />
        </linearGradient>
        <filter :id="'shadow-' + uid" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.5" />
        </filter>
        <linearGradient :id="'wheelGrad-' + uid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color: #2a2a3a" />
          <stop offset="50%" style="stop-color: #1a1a2a" />
          <stop offset="100%" style="stop-color: #2a2a3a" />
        </linearGradient>
        <linearGradient :id="'rimGrad-' + uid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color: #888" />
          <stop offset="50%" style="stop-color: #ccc" />
          <stop offset="100%" style="stop-color: #666" />
        </linearGradient>
      </defs>

      <g :filter="'url(#shadow-' + uid + ')'">
        <path
          :d="bodyPath"
          :fill="'url(#bodyGrad-' + uid + ')'"
          stroke="#333"
          stroke-width="1.5"
          class="car-body"
        />

        <path
          v-if="windowPath"
          :d="windowPath"
          :fill="'url(#glassGrad-' + uid + ')'"
          stroke="rgba(255,255,255,0.2)"
          stroke-width="0.5"
        />

        <path
          v-if="accentPath"
          :d="accentPath"
          :fill="'url(#accentGrad-' + uid + ')'"
          opacity="0.9"
        />

        <path
          v-if="detailPath"
          :d="detailPath"
          fill="rgba(0,0,0,0.3)"
        />

        <g class="wheel-group front-wheel" :class="{ spinning: animateWheels }">
          <circle :cx="frontWheelX" :cy="wheelY" :r="wheelRadius" :fill="'url(#wheelGrad-' + uid + ')'" stroke="#444" stroke-width="1" />
          <circle :cx="frontWheelX" :cy="wheelY" :r="wheelRadius * 0.5" :fill="'url(#rimGrad-' + uid + ')'" />
          <g v-for="i in 5" :key="'front-spoke-' + i" :transform="`rotate(${i * 72}, ${frontWheelX}, ${wheelY})`">
            <rect :x="frontWheelX - 1" :y="wheelY - wheelRadius * 0.8" width="2" :height="wheelRadius * 0.6" fill="#999" rx="1" />
          </g>
          <circle :cx="frontWheelX" :cy="wheelY" :r="wheelRadius * 0.15" fill="#333" />
        </g>

        <g class="wheel-group rear-wheel" :class="{ spinning: animateWheels }">
          <circle :cx="rearWheelX" :cy="wheelY" :r="wheelRadius" :fill="'url(#wheelGrad-' + uid + ')'" stroke="#444" stroke-width="1" />
          <circle :cx="rearWheelX" :cy="wheelY" :r="wheelRadius * 0.5" :fill="'url(#rimGrad-' + uid + ')'" />
          <g v-for="i in 5" :key="'rear-spoke-' + i" :transform="`rotate(${i * 72}, ${rearWheelX}, ${wheelY})`">
            <rect :x="rearWheelX - 1" :y="wheelY - wheelRadius * 0.8" width="2" :height="wheelRadius * 0.6" fill="#999" rx="1" />
          </g>
          <circle :cx="rearWheelX" :cy="wheelY" :r="wheelRadius * 0.15" fill="#333" />
        </g>

        <ellipse v-if="showHeadlights" :cx="headlightX" :cy="headlightY" rx="6" ry="4" fill="rgba(255,255,200,0.9)" />
        <ellipse v-if="showTaillights" :cx="taillightX" :cy="taillightY" rx="5" ry="3" fill="rgba(255,50,50,0.9)" />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  primaryColor: {
    type: String,
    default: '#ff6b00'
  },
  secondaryColor: {
    type: String,
    default: '#cc5500'
  },
  accentColor: {
    type: String,
    default: '#ff8c00'
  },
  bodyStyle: {
    type: String,
    default: 'sports',
    validator: (value) => ['sedan', 'sports', 'supercar', 'formula', 'offroad'].includes(value)
  },
  animateWheels: {
    type: Boolean,
    default: false
  },
  showHeadlights: {
    type: Boolean,
    default: true
  },
  showTaillights: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'normal'
  }
})

const uid = Math.random().toString(36).substring(2, 9)

const viewBox = computed(() => {
  if (props.bodyStyle === 'formula') return '0 0 400 160'
  if (props.bodyStyle === 'offroad') return '0 0 400 170'
  return '0 0 400 150'
})

const bodyStyles = {
  sedan: {
    bodyPath: 'M50,105 Q60,75 100,65 L180,60 Q220,55 260,60 L340,70 Q380,80 390,105 L390,120 L50,120 Z',
    windowPath: 'M110,65 L170,62 Q190,60 210,62 L250,65 L245,45 L125,45 Z',
    accentPath: 'M180,70 L220,70 L215,95 L185,95 Z',
    detailPath: 'M60,100 L380,100 M100,75 L105,65 M295,65 L300,75',
    frontWheelX: 300,
    rearWheelX: 100,
    wheelY: 125,
    wheelRadius: 22,
    headlightX: 385,
    headlightY: 95,
    taillightX: 55,
    taillightY: 95
  },
  sports: {
    bodyPath: 'M40,110 Q50,70 120,60 L200,55 Q250,52 300,60 L360,70 Q390,85 395,110 L395,120 L40,120 Z',
    windowPath: 'M130,60 L190,57 Q210,55 230,57 L270,60 L255,40 L145,40 Z',
    accentPath: 'M190,65 L240,65 L230,95 L200,95 Z',
    detailPath: 'M50,105 L385,105 M90,70 L95,60 M305,60 L310,70',
    frontWheelX: 310,
    rearWheelX: 90,
    wheelY: 125,
    wheelRadius: 24,
    headlightX: 390,
    headlightY: 98,
    taillightX: 45,
    taillightY: 98
  },
  supercar: {
    bodyPath: 'M30,110 Q40,60 130,52 L220,48 Q280,45 330,53 L370,63 Q395,78 400,110 L400,120 L30,120 Z',
    windowPath: 'M140,52 L210,49 Q240,47 270,50 L310,53 L290,32 L160,32 Z',
    accentPath: 'M200,58 L260,58 L248,95 L212,95 Z',
    detailPath: 'M40,105 L390,105 M80,65 L85,55 M315,55 L320,65',
    frontWheelX: 325,
    rearWheelX: 75,
    wheelY: 125,
    wheelRadius: 25,
    headlightX: 395,
    headlightY: 95,
    taillightX: 35,
    taillightY: 95
  },
  formula: {
    bodyPath: 'M20,115 Q30,70 80,62 L150,58 Q200,55 250,58 L320,62 Q370,70 380,115 L380,125 L20,125 Z',
    windowPath: 'M160,58 L195,56 Q210,55 225,57 L240,58 L230,42 L170,42 Z',
    accentPath: 'M200,45 L230,45 L225,30 L205,30 Z M60,75 L80,75 L75,95 L65,95 Z M320,75 L340,75 L335,95 L325,95 Z',
    detailPath: 'M30,110 L370,110 M180,70 L180,58 M220,70 L220,58',
    frontWheelX: 330,
    rearWheelX: 70,
    wheelY: 130,
    wheelRadius: 26,
    headlightX: 375,
    headlightY: 100,
    taillightX: 25,
    taillightY: 100
  },
  offroad: {
    bodyPath: 'M60,100 Q70,58 120,53 L200,50 Q260,52 310,57 L350,67 Q380,78 385,100 L385,115 L60,115 Z',
    windowPath: 'M130,53 L195,51 Q220,50 245,52 L280,55 L265,35 L145,35 Z',
    accentPath: 'M195,60 L245,60 L238,90 L202,90 Z',
    detailPath: 'M75,95 L370,95 M90,70 L95,60 M305,60 M310,70',
    frontWheelX: 315,
    rearWheelX: 85,
    wheelY: 130,
    wheelRadius: 28,
    headlightX: 380,
    headlightY: 88,
    taillightX: 65,
    taillightY: 88
  }
}

const style = computed(() => bodyStyles[props.bodyStyle] || bodyStyles.sports)

const bodyPath = computed(() => style.value.bodyPath)
const windowPath = computed(() => style.value.windowPath)
const accentPath = computed(() => style.value.accentPath)
const detailPath = computed(() => style.value.detailPath)
const frontWheelX = computed(() => style.value.frontWheelX)
const rearWheelX = computed(() => style.value.rearWheelX)
const wheelY = computed(() => style.value.wheelY)
const wheelRadius = computed(() => style.value.wheelRadius)
const headlightX = computed(() => style.value.headlightX)
const headlightY = computed(() => style.value.headlightY)
const taillightX = computed(() => style.value.taillightX)
const taillightY = computed(() => style.value.taillightY)
</script>

<style scoped>
.car-preview-wrapper {
  width: 100%;
  aspect-ratio: 8/3;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.car-svg {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.4));
  transition: transform 0.3s ease;
}

.car-preview-wrapper:hover .car-svg {
  transform: scale(1.02);
}

.car-body {
  transition: fill 0.3s ease;
}

.wheel-group {
  transform-origin: center;
  transition: transform 0.1s linear;
}

.wheel-group.spinning {
  animation: wheelSpin 0.3s linear infinite;
}

@keyframes wheelSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-wheels .front-wheel,
.animate-wheels .rear-wheel {
  animation: wheelSpin 0.2s linear infinite;
}

@keyframes wheelSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
