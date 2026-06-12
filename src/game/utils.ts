export class Vector2 {
  x: number
  y: number

  constructor(x: number = 0, y: number = 0) {
    this.x = x
    this.y = y
  }

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y)
  }

  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y)
  }

  mul(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar)
  }

  div(scalar: number): Vector2 {
    if (scalar === 0) return new Vector2()
    return new Vector2(this.x / scalar, this.y / scalar)
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  normalize(): Vector2 {
    const len = this.length()
    if (len === 0) return new Vector2()
    return this.div(len)
  }

  distanceTo(v: Vector2): number {
    return this.sub(v).length()
  }

  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y
  }

  angle(): number {
    return Math.atan2(this.y, this.x)
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y)
  }

  set(x: number, y: number): void {
    this.x = x
    this.y = y
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1))
}

export function circleCollision(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number
): boolean {
  const dx = x2 - x1
  const dy = y2 - y1
  const distance = Math.sqrt(dx * dx + dy * dy)
  return distance < r1 + r2
}

export function rectCircleCollision(
  rx: number, ry: number, rw: number, rh: number,
  cx: number, cy: number, cr: number
): boolean {
  const closestX = clamp(cx, rx, rx + rw)
  const closestY = clamp(cy, ry, ry + rh)
  const dx = cx - closestX
  const dy = cy - closestY
  return (dx * dx + dy * dy) < (cr * cr)
}
