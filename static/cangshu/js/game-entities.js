window.GameEntities = (function () {
  class Hamster {
    constructor(id, x, y, color, isPlayer, name, skinId) {
      this.id = id;
      this.x = x;
      this.y = y;
      this.color = color;
      this.isPlayer = isPlayer;
      this.name = name;
      this.skinId = skinId;
      this.vx = 0;
      this.vy = 0;
      this.speed = 3;
      this.radius = 18;
      this.direction = 'down';
      this.isFrozen = false;
      this.frozenTimer = 0;
      this.isInvisible = false;
      this.invisibleTimer = 0;
      this.speedBoost = false;
      this.speedBoostTimer = 0;
      this.alive = true;
      this.snowball = new Snowball(id, x, y);
      this.propCooldowns = { freeze: 0, speed: 0, split: 0, obstacle: 0, invisible: 0 };
      this.score = 0;
      this._hueAngle = 0;
    }

    update(dt) {
      if (this.frozenTimer > 0) {
        this.frozenTimer -= dt;
        if (this.frozenTimer <= 0) {
          this.frozenTimer = 0;
          this.isFrozen = false;
        }
      }
      if (this.invisibleTimer > 0) {
        this.invisibleTimer -= dt;
        if (this.invisibleTimer <= 0) {
          this.invisibleTimer = 0;
          this.isInvisible = false;
        }
      }
      if (this.speedBoostTimer > 0) {
        this.speedBoostTimer -= dt;
        if (this.speedBoostTimer <= 0) {
          this.speedBoostTimer = 0;
          this.speedBoost = false;
          this.speed = 3;
        }
      }
      for (let key in this.propCooldowns) {
        if (this.propCooldowns[key] > 0) {
          this.propCooldowns[key] -= dt;
          if (this.propCooldowns[key] < 0) this.propCooldowns[key] = 0;
        }
      }
      if (!this.isFrozen) {
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
      }
      this.vx *= 0.85;
      this.vy *= 0.85;
      if (Math.abs(this.vx) < 0.01) this.vx = 0;
      if (Math.abs(this.vy) < 0.01) this.vy = 0;
    }

    move(dx, dy, mapWidth, mapHeight, obstacles) {
      if (this.isFrozen) return;
      let len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        dx /= len;
        dy /= len;
        if (Math.abs(dx) > Math.abs(dy)) {
          this.direction = dx > 0 ? 'right' : 'left';
        } else {
          this.direction = dy > 0 ? 'down' : 'up';
        }
      }
      let currentSpeed = this.speedBoost ? 5 : this.speed;
      this.vx = dx * currentSpeed;
      this.vy = dy * currentSpeed;
      let newX = this.x + this.vx;
      let newY = this.y + this.vy;
      newX = Math.max(this.radius, Math.min(mapWidth - this.radius, newX));
      newY = Math.max(this.radius, Math.min(mapHeight - this.radius, newY));
      if (obstacles && obstacles.length > 0) {
        for (let obs of obstacles) {
          let closestX = Math.max(obs.x, Math.min(newX, obs.x + obs.w));
          let closestY = Math.max(obs.y, Math.min(newY, obs.y + obs.h));
          let distX = newX - closestX;
          let distY = newY - closestY;
          if (distX * distX + distY * distY < this.radius * this.radius) {
            newX = this.x;
            newY = this.y;
            break;
          }
        }
      }
      this.x = newX;
      this.y = newY;
    }

    freeze(duration) {
      this.isFrozen = true;
      this.frozenTimer = duration;
    }

    activateSpeed(duration) {
      this.speedBoost = true;
      this.speedBoostTimer = duration;
      this.speed = 5;
    }

    activateInvisible(duration) {
      this.isInvisible = true;
      this.invisibleTimer = duration;
    }

    draw(ctx) {
      ctx.save();
      if (this.isInvisible) {
        ctx.globalAlpha = 0.3;
      }
      let drawColor = this.color;
      if (this.skinId === 'rainbow') {
        this._hueAngle = (this._hueAngle + 2) % 360;
        drawColor = 'hsl(' + this._hueAngle + ', 80%, 60%)';
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = drawColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      let earOffsetX = this.radius * 0.55;
      let earOffsetY = this.radius * 0.75;
      let earRadius = this.radius * 0.35;
      ctx.beginPath();
      ctx.arc(this.x - earOffsetX, this.y - earOffsetY, earRadius, 0, Math.PI * 2);
      ctx.fillStyle = drawColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.x + earOffsetX, this.y - earOffsetY, earRadius, 0, Math.PI * 2);
      ctx.fillStyle = drawColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.x - earOffsetX, this.y - earOffsetY, earRadius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffb6c1';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x + earOffsetX, this.y - earOffsetY, earRadius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffb6c1';
      ctx.fill();
      let eyeSpacing = this.radius * 0.3;
      let eyeOffsetY = this.radius * 0.1;
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(this.x - eyeSpacing, this.y + eyeOffsetY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x + eyeSpacing, this.y + eyeOffsetY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.x - eyeSpacing + 0.8, this.y + eyeOffsetY - 0.8, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x + eyeSpacing + 0.8, this.y + eyeOffsetY - 0.8, 1, 0, Math.PI * 2);
      ctx.fill();
      let noseY = this.y + this.radius * 0.3;
      ctx.beginPath();
      ctx.arc(this.x, noseY, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ff9999';
      ctx.fill();
      let mouthY = noseY + 4;
      ctx.beginPath();
      ctx.arc(this.x - 3, mouthY, 3, 0, Math.PI, false);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.x + 3, mouthY, 3, 0, Math.PI, false);
      ctx.strokeStyle = '#666';
      ctx.stroke();
      if (this.isFrozen) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 180, 255, 0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (this.skinId && this.skinId.indexOf('special_') === 0) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius - 14);
        ctx.lineTo(this.x - 6, this.y - this.radius - 4);
        ctx.lineTo(this.x + 6, this.y - this.radius - 4);
        ctx.closePath();
        ctx.fillStyle = '#ffd700';
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.radius - 12, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;
      ctx.strokeText(this.name, this.x, this.y - this.radius - 8);
      ctx.fillText(this.name, this.x, this.y - this.radius - 8);
      ctx.restore();
    }
  }

  class Snowball {
    constructor(ownerId, x, y) {
      this.ownerId = ownerId;
      this.x = x;
      this.y = y;
      this.size = 10;
      this.maxSize = 80;
      this.growthRate = 0.15;
      this.effect = 'none';
    }

    update(ownerX, ownerY, ownerDir) {
      let offset = 18 + this.size + 2;
      switch (ownerDir) {
        case 'up':
          this.x = ownerX;
          this.y = ownerY - offset;
          break;
        case 'down':
          this.x = ownerX;
          this.y = ownerY + offset;
          break;
        case 'left':
          this.x = ownerX - offset;
          this.y = ownerY;
          break;
        case 'right':
          this.x = ownerX + offset;
          this.y = ownerY;
          break;
      }
    }

    grow(amount) {
      let actualGrowth = Math.min(amount, this.maxSize - this.size);
      this.size += actualGrowth;
      return actualGrowth;
    }

    shrink(amount) {
      this.size -= amount;
      if (this.size < 5) this.size = 5;
    }

    draw(ctx, effect) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = '#f0f8ff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x + 2, this.y + 2, this.size, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(135, 206, 250, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (effect === 'sparkle') {
        let sparkCount = 6;
        for (let i = 0; i < sparkCount; i++) {
          let angle = (Math.PI * 2 / sparkCount) * i + Date.now() * 0.002;
          let dist = this.size + 4;
          let sx = this.x + Math.cos(angle) * dist;
          let sy = this.y + Math.sin(angle) * dist;
          ctx.beginPath();
          ctx.moveTo(sx, sy - 3);
          ctx.lineTo(sx + 1, sy - 1);
          ctx.lineTo(sx + 3, sy);
          ctx.lineTo(sx + 1, sy + 1);
          ctx.lineTo(sx, sy + 3);
          ctx.lineTo(sx - 1, sy + 1);
          ctx.lineTo(sx - 3, sy);
          ctx.lineTo(sx - 1, sy - 1);
          ctx.closePath();
          ctx.fillStyle = '#ffffaa';
          ctx.fill();
        }
      } else if (effect === 'flame') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff4500';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (effect === 'ice') {
        let facetCount = 6;
        for (let i = 0; i < facetCount; i++) {
          let angle = (Math.PI * 2 / facetCount) * i;
          let innerR = this.size * 0.6;
          let outerR = this.size;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(
            this.x + Math.cos(angle) * outerR,
            this.y + Math.sin(angle) * outerR
          );
          ctx.lineTo(
            this.x + Math.cos(angle + Math.PI / facetCount) * innerR,
            this.y + Math.sin(angle + Math.PI / facetCount) * innerR
          );
          ctx.closePath();
          ctx.strokeStyle = 'rgba(173, 216, 230, 0.7)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else if (effect === 'rainbow') {
        let hue = (Date.now() * 0.1) % 360;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'hsl(' + hue + ', 80%, 60%)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#555';
      ctx.fillText(Math.round(this.size), this.x, this.y);
      ctx.restore();
    }
  }

  class PropEntity {
    constructor(type, x, y, ownerId) {
      this.type = type;
      this.x = x;
      this.y = y;
      this.ownerId = ownerId;
      this.radius = 12;
      this.active = true;
      this.timer = 0;
      this.vx = 0;
      this.vy = 0;
      switch (type) {
        case 'freeze_ray':
          this.lifetime = 0.5;
          break;
        case 'speed_boost':
          this.lifetime = 0;
          break;
        case 'split_bomb':
          this.lifetime = 0.5;
          break;
        case 'obstacle_block':
          this.lifetime = Infinity;
          break;
        case 'invisible_cloak':
          this.lifetime = 0;
          break;
        default:
          this.lifetime = 1;
      }
    }

    update(dt) {
      this.timer += dt;
      if (this.type === 'freeze_ray' || this.type === 'split_bomb') {
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
      }
      if (this.lifetime !== Infinity && this.timer >= this.lifetime) {
        this.active = false;
      }
    }

    draw(ctx) {
      ctx.save();
      switch (this.type) {
        case 'freeze_ray':
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#4fc3f7';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = '#b3e5fc';
          ctx.fill();
          break;
        case 'speed_boost':
          ctx.beginPath();
          ctx.moveTo(this.x, this.y - this.radius);
          ctx.lineTo(this.x + 5, this.y - 3);
          ctx.lineTo(this.x + 2, this.y - 3);
          ctx.lineTo(this.x + 7, this.y + this.radius);
          ctx.lineTo(this.x + 2, this.y + 3);
          ctx.lineTo(this.x + 5, this.y + 3);
          ctx.closePath();
          ctx.fillStyle = '#ffeb3b';
          ctx.fill();
          ctx.strokeStyle = '#f9a825';
          ctx.lineWidth = 1;
          ctx.stroke();
          break;
        case 'split_bomb':
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#f44336';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = '#ff9800';
          ctx.fill();
          for (let i = 0; i < 5; i++) {
            let angle = (Math.PI * 2 / 5) * i;
            let sx = this.x + Math.cos(angle) * (this.radius + 4);
            let sy = this.y + Math.sin(angle) * (this.radius + 4);
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ff5722';
            ctx.fill();
          }
          break;
        case 'obstacle_block':
          ctx.beginPath();
          ctx.rect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
          ctx.fillStyle = '#78909c';
          ctx.fill();
          ctx.strokeStyle = '#546e7a';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(this.x - this.radius + 3, this.y);
          ctx.lineTo(this.x + this.radius - 3, this.y);
          ctx.moveTo(this.x, this.y - this.radius + 3);
          ctx.lineTo(this.x, this.y + this.radius - 3);
          ctx.strokeStyle = '#90a4ae';
          ctx.lineWidth = 1;
          ctx.stroke();
          break;
        case 'invisible_cloak':
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(156, 39, 176, 0.4)';
          ctx.fill();
          let swirlTime = Date.now() * 0.003;
          for (let i = 0; i < 3; i++) {
            let angle = swirlTime + (Math.PI * 2 / 3) * i;
            let sr = this.radius * 0.6;
            ctx.beginPath();
            ctx.arc(
              this.x + Math.cos(angle) * sr * 0.5,
              this.y + Math.sin(angle) * sr * 0.5,
              4, 0, Math.PI * 2
            );
            ctx.fillStyle = 'rgba(206, 147, 216, 0.7)';
            ctx.fill();
          }
          break;
      }
      ctx.restore();
    }
  }

  class MapPickup {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.radius = 10;
      this.active = true;
      this.bobOffset = Math.random() * Math.PI * 2;
      switch (type) {
        case 'coin':
          this.value = 10 + Math.floor(Math.random() * 21);
          break;
        case 'snow_boost':
          this.value = 5;
          break;
        case 'prop_box':
          let props = ['freeze_ray', 'speed_boost', 'split_bomb', 'obstacle_block', 'invisible_cloak'];
          this.value = props[Math.floor(Math.random() * props.length)];
          break;
      }
    }

    update(dt) {
      this.bobOffset += dt * 3;
    }

    draw(ctx, time) {
      ctx.save();
      let bob = Math.sin(this.bobOffset) * 3;
      let dy = this.y + bob;
      switch (this.type) {
        case 'coin':
          ctx.beginPath();
          ctx.arc(this.x, dy, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffd700';
          ctx.fill();
          ctx.strokeStyle = '#daa520';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#8b6914';
          ctx.fillText('$', this.x, dy);
          break;
        case 'prop_box':
          ctx.beginPath();
          ctx.rect(this.x - this.radius, dy - this.radius, this.radius * 2, this.radius * 2);
          ctx.fillStyle = '#ff8f00';
          ctx.fill();
          ctx.strokeStyle = '#e65100';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fff';
          ctx.fillText('?', this.x, dy);
          break;
        case 'snow_boost':
          ctx.beginPath();
          ctx.arc(this.x, dy, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(179, 229, 252, 0.8)';
          ctx.fill();
          ctx.strokeStyle = '#64b5f6';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.strokeStyle = '#1e88e5';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(this.x, dy - 5);
          ctx.lineTo(this.x + 4, dy - 2);
          ctx.lineTo(this.x + 2, dy - 2);
          ctx.lineTo(this.x + 5, dy + 2);
          ctx.lineTo(this.x + 1, dy);
          ctx.lineTo(this.x + 2, dy + 5);
          ctx.lineTo(this.x - 1, dy + 1);
          ctx.lineTo(this.x - 2, dy + 3);
          ctx.lineTo(this.x - 3, dy);
          ctx.lineTo(this.x - 5, dy + 1);
          ctx.lineTo(this.x - 1, dy - 1);
          ctx.lineTo(this.x - 3, dy - 2);
          ctx.closePath();
          ctx.fillStyle = '#e3f2fd';
          ctx.fill();
          ctx.stroke();
          break;
      }
      ctx.restore();
    }
  }

  class HazardEntity {
    constructor(config) {
      this.x = config.x;
      this.y = config.y;
      this.radius = config.radius || 30;
      this.type = config.type || 'rolling_snowball';
      this.speed = config.speed || 2;
      this.direction = config.direction || 'right';
      this.originalX = config.x;
      this.originalY = config.y;
      this.active = true;
      this.vx = 0;
      this.vy = 0;
      switch (this.direction) {
        case 'left':
          this.vx = -this.speed;
          this.vy = 0;
          break;
        case 'right':
          this.vx = this.speed;
          this.vy = 0;
          break;
        case 'up':
          this.vx = 0;
          this.vy = -this.speed;
          break;
        case 'down':
          this.vx = 0;
          this.vy = this.speed;
          break;
        case 'diagonal_lr':
          this.vx = this.speed * 0.707;
          this.vy = this.speed * 0.707;
          break;
        case 'diagonal_rl':
          this.vx = -this.speed * 0.707;
          this.vy = this.speed * 0.707;
          break;
      }
    }

    update(dt, mapWidth, mapHeight) {
      this.x += this.vx * dt * 60;
      this.y += this.vy * dt * 60;
      if (this.x - this.radius <= 0 || this.x + this.radius >= mapWidth) {
        this.vx *= -1;
        this.x = Math.max(this.radius, Math.min(mapWidth - this.radius, this.x));
      }
      if (this.y - this.radius <= 0 || this.y + this.radius >= mapHeight) {
        this.vy *= -1;
        this.y = Math.max(this.radius, Math.min(mapHeight - this.radius, this.y));
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      let grad = ctx.createRadialGradient(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.1, this.x, this.y, this.radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#b0bec5');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(120, 144, 156, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      let movingRight = this.vx > 0;
      let movingDown = this.vy > 0;
      let lineCount = 3;
      for (let i = 0; i < lineCount; i++) {
        let offset = (i - 1) * this.radius * 0.4;
        let lx = this.x + (movingRight ? -1 : 1) * (this.radius + 6 + i * 4);
        let ly = this.y + offset;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + (movingRight ? -1 : 1) * 8, ly);
        ctx.strokeStyle = 'rgba(176, 190, 197, ' + (0.6 - i * 0.15) + ')';
        ctx.lineWidth = 2 - i * 0.5;
        ctx.stroke();
      }
      for (let i = 0; i < lineCount; i++) {
        let offset = (i - 1) * this.radius * 0.4;
        let lx = this.x + offset;
        let ly = this.y + (movingDown ? -1 : 1) * (this.radius + 6 + i * 4);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx, ly + (movingDown ? -1 : 1) * 8);
        ctx.strokeStyle = 'rgba(176, 190, 197, ' + (0.6 - i * 0.15) + ')';
        ctx.lineWidth = 2 - i * 0.5;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  return { Hamster, Snowball, PropEntity, MapPickup, HazardEntity };
})();
