export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return Math.floor(num).toString()
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function formatTemperature(celsius: number): string {
  return `${celsius > 0 ? '+' : ''}${celsius.toFixed(0)}°C`
}

export function getRiskLevelColor(level: number, max: number = 10): string {
  const ratio = level / max
  if (ratio < 0.3) return '#10B981'
  if (ratio < 0.6) return '#F59E0B'
  if (ratio < 0.8) return '#EF4444'
  return '#DC2626'
}

export function getResourceStatusColor(ratio: number): string {
  if (ratio < 0.1) return '#DC2626'
  if (ratio < 0.3) return '#EF4444'
  if (ratio < 0.5) return '#F59E0B'
  return '#10B981'
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function latLngToVector3(lat: number, lng: number, radius: number = 1): { x: number; y: number; z: number } {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  }
}
