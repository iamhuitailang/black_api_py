const LERP_FACTOR = 0.1;

export class Camera {
  constructor(viewWidth = 960, viewHeight = 540) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.x = 0;
    this.y = 0;
    this.minX = 0;
    this.maxX = 0;
    this.target = null;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  setBounds(minX, maxX) {
    this.minX = minX;
    this.maxX = maxX;
  }

  follow(target) {
    this.target = target;
  }

  update(dt) {
    if (this.target) {
      const targetX = this.target.x + this.target.width / 2 - this.viewWidth / 2;
      this.x += (targetX - this.x) * LERP_FACTOR;
    }

    this.x = Math.max(this.minX, Math.min(this.maxX - this.viewWidth, this.x));
    this.y = 0;

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt || 16;
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
      if (this.shakeTimer <= 0) {
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }
  }

  getOffset() {
    return {
      x: -this.x + this.shakeOffsetX,
      y: -this.y + this.shakeOffsetY,
    };
  }

  isVisible(rect) {
    const screenX = rect.x + this.getOffset().x;
    const screenY = rect.y + this.getOffset().y;
    return (
      screenX + rect.width > 0 &&
      screenX < this.viewWidth &&
      screenY + rect.height > 0 &&
      screenY < this.viewHeight
    );
  }

  shake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }
}
