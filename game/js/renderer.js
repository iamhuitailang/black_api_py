const Renderer = {
  getSkinColors(skinId) {
    const skin = GameConfig.WORM_SKINS.find(s => s.id === skinId) || GameConfig.WORM_SKINS[0];
    return skin;
  },

  getSegmentColor(skin, segmentIndex, totalSegments, time) {
    const colors = skin.colors;
    const progress = segmentIndex / Math.max(totalSegments - 1, 1);

    if (skin.type === 'rainbow') {
      const hue = (progress * 360 + time * 0.1) % 360;
      return `hsl(${hue}, 70%, 55%)`;
    }

    if (skin.type === 'striped') {
      const colorIndex = Math.floor(segmentIndex / 2) % colors.length;
      return colors[colorIndex];
    }

    if (skin.type === 'fire') {
      const colorIndex = Math.min(Math.floor(progress * colors.length), colors.length - 1);
      return colors[colorIndex];
    }

    if (skin.type === 'ice') {
      const colorIndex = Math.min(Math.floor(progress * colors.length), colors.length - 1);
      return colors[colorIndex];
    }

    return colors[0];
  },

  drawWorm(ctx, worm, skinId, time) {
    const skin = this.getSkinColors(skinId);

    if (worm.isDead && worm.deathAnimation) {
      this.drawDeathAnimation(ctx, worm, skin, time);
      return;
    }

    for (let i = worm.bodySegments - 1; i >= 0; i--) {
      const pos = Worm.getSegmentPosition(worm, i);
      const color = this.getSegmentColor(skin, i, worm.bodySegments, time);
      const size = i === 0 ? 12 : 10 - (i * 0.05);
      const radius = Math.max(size, 6);

      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = i === 0 ? 15 : 8;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    this.drawWormHead(ctx, worm, skin, time);
  },

  drawWormHead(ctx, worm, skin, time) {
    const angle = Math.atan2(worm.direction.y, worm.direction.x);
    const antennaSwing = Math.sin(time * 0.008) * 0.3;

    ctx.save();
    ctx.translate(worm.x, worm.y);
    ctx.rotate(angle);

    ctx.strokeStyle = skin.colors[0];
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.quadraticCurveTo(
      12 + Math.sin(time * 0.01) * 2,
      -12 + antennaSwing * 8,
      16,
      -16 + antennaSwing * 10
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(4, 6);
    ctx.quadraticCurveTo(
      12 + Math.sin(time * 0.01 + 1) * 2,
      12 - antennaSwing * 8,
      16,
      16 - antennaSwing * 10
    );
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6, -4, 3.5, 0, Math.PI * 2);
    ctx.arc(6, 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(7, -4, 1.8, 0, Math.PI * 2);
    ctx.arc(7, 4, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  drawDeathAnimation(ctx, worm, skin, time) {
    const anim = worm.deathAnimation;
    const elapsed = time - anim.startTime;

    anim.segments.forEach((seg, i) => {
      const segmentDelay = i * 50;
      if (elapsed < segmentDelay) {
        const pos = Worm.getSegmentPosition(worm, i);
        const color = this.getSegmentColor(skin, i, worm.bodySegments, time);
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, i === 0 ? 12 : 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (!seg.exploded) {
        seg.exploded = true;
        const color = this.getSegmentColor(skin, i, worm.bodySegments, time);
        Effects.addParticle(seg.x, seg.y, color, 'explosion');
      }

      if (seg.exploded) {
        seg.x += seg.vx;
        seg.y += seg.vy;
        seg.vy += 0.15;
        seg.vx *= 0.98;
      }
    });
  },

  drawFood(ctx, food, time) {
    if (!food) return;

    const pulse = 1 + Math.sin(time * 0.006 + food.pulsePhase) * 0.15;
    const radius = food.radius * pulse;

    ctx.save();
    ctx.shadowColor = food.type.glowColor;
    ctx.shadowBlur = 20 * pulse;

    if (food.type.shape === 'circle') {
      ctx.fillStyle = food.type.color;
      ctx.beginPath();
      ctx.arc(food.x, food.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(food.x - radius * 0.3, food.y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (food.type.shape === 'lightning') {
      ctx.fillStyle = food.type.color;
      ctx.beginPath();
      ctx.moveTo(food.x - 2, food.y - radius);
      ctx.lineTo(food.x + 4, food.y - 2);
      ctx.lineTo(food.x, food.y + 2);
      ctx.lineTo(food.x + 4, food.y + radius);
      ctx.lineTo(food.x - 4, food.y);
      ctx.lineTo(food.x, food.y - 4);
      ctx.closePath();
      ctx.fill();
    } else if (food.type.shape === 'snowflake') {
      ctx.strokeStyle = food.type.color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.translate(food.x, food.y);
      ctx.rotate(time * 0.002);
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, radius);
        ctx.moveTo(0, radius * 0.6);
        ctx.lineTo(radius * 0.3, radius * 0.85);
        ctx.moveTo(0, radius * 0.6);
        ctx.lineTo(-radius * 0.3, radius * 0.85);
        ctx.stroke();
      }
    }

    ctx.restore();
  },

  drawStatusEffects(ctx, worm, time) {
    const now = time;
    if (Worm.isSpeedBoosted(worm, now)) {
      for (let i = 0; i < 2; i++) {
        Effects.addSpeedTrail(worm.x, worm.y, worm.direction);
      }
    }
    if (Worm.isSlowed(worm, now)) {
      if (Math.random() < 0.3) {
        Effects.addIceParticle(worm.x, worm.y);
      }
    }
  },

  clear(ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
  },

  drawBorder(ctx) {
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, GameConfig.CANVAS_WIDTH - 3, GameConfig.CANVAS_HEIGHT - 3);

    const corners = [
      { x: 0, y: 0 },
      { x: GameConfig.CANVAS_WIDTH, y: 0 },
      { x: 0, y: GameConfig.CANVAS_HEIGHT },
      { x: GameConfig.CANVAS_WIDTH, y: GameConfig.CANVAS_HEIGHT }
    ];
    corners.forEach(c => {
      ctx.save();
      ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
      ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
};
