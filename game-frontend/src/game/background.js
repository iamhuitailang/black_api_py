const COLORS = {
  paper: '#f0e8d8',
  lightInk: '#a09880',
  midInk: '#5a4a3a',
  darkInk: '#2a2018',
  blackInk: '#1a1210',
  gold: '#c8a848',
};

const LAYER_SPEEDS = [0.1, 0.25, 0.45, 0.7, 0.9];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function randRange(rand, min, max) {
  return min + rand() * (max - min);
}

function createBrushStroke(ctx, x1, y1, x2, y2, width, color, alpha = 0.8) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2 + (Math.random() - 0.5) * width * 2, (y1 + y2) / 2 + (Math.random() - 0.5) * width * 2, x2, y2);
  ctx.stroke();
  ctx.restore();
}

function createInkWash(ctx, x, y, radius, color, alpha = 0.5) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.6, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMountainRange(ctx, baseY, width, height, color, alpha, seed = 1) {
  const rand = seededRandom(seed);
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  let x = 0;
  while (x < width) {
    const peakWidth = randRange(rand, 80, 200);
    const peakHeight = randRange(rand, height * 0.3, height);
    ctx.lineTo(x + peakWidth * 0.3, baseY - peakHeight * 0.7);
    ctx.lineTo(x + peakWidth * 0.5, baseY - peakHeight);
    ctx.lineTo(x + peakWidth * 0.7, baseY - peakHeight * 0.6);
    x += peakWidth;
    ctx.lineTo(x, baseY - randRange(rand, height * 0.1, height * 0.4));
  }
  ctx.lineTo(width, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPineTree(ctx, x, baseY, height, color, alpha = 0.8) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.lineWidth = height * 0.08;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, baseY - height * 0.4);
  ctx.stroke();

  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const y = baseY - height * 0.3 - i * height * 0.18;
    const w = height * (0.5 - i * 0.1);
    ctx.lineWidth = height * 0.06 - i * height * 0.01;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5, y + height * 0.08);
    ctx.lineTo(x, y - height * 0.02);
    ctx.lineTo(x + w * 0.5, y + height * 0.08);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBamboo(ctx, x, baseY, height, color, alpha = 0.7) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineWidth = height * 0.04;

  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, baseY - height);
  ctx.stroke();

  const segments = Math.floor(height / 40);
  for (let i = 1; i <= segments; i++) {
    const y = baseY - (height / segments) * i;
    ctx.lineWidth = height * 0.06;
    ctx.beginPath();
    ctx.moveTo(x - height * 0.03, y);
    ctx.lineTo(x + height * 0.03, y);
    ctx.stroke();
  }

  ctx.lineWidth = height * 0.02;
  for (let i = 0; i < 3; i++) {
    const ly = baseY - height * 0.3 - i * height * 0.2;
    const side = i % 2 === 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x, ly);
    ctx.quadraticCurveTo(x + side * height * 0.15, ly - height * 0.05, x + side * height * 0.25, ly - height * 0.15);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPagoda(ctx, x, baseY, height, color, goldColor, alpha = 0.9) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const tiers = 5;
  const tierHeight = height / (tiers + 1);

  for (let i = 0; i < tiers; i++) {
    const y = baseY - tierHeight * (i + 1);
    const w = height * (0.6 - i * 0.08);

    ctx.lineWidth = 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5, y + tierHeight * 0.3);
    ctx.lineTo(x - w * 0.55, y);
    ctx.quadraticCurveTo(x, y - tierHeight * 0.15, x + w * 0.55, y);
    ctx.lineTo(x + w * 0.5, y + tierHeight * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = goldColor;
    ctx.globalAlpha = alpha * 0.6;
    ctx.beginPath();
    ctx.arc(x, y - tierHeight * 0.08, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, baseY - height - tierHeight * 0.3);
  ctx.lineTo(x - 4, baseY - height);
  ctx.lineTo(x + 4, baseY - height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = goldColor;
  ctx.globalAlpha = alpha * 0.8;
  ctx.beginPath();
  ctx.arc(x, baseY - height - tierHeight * 0.4, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawStoneLantern(ctx, x, baseY, height, color, goldColor, alpha = 0.85) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;

  ctx.fillRect(x - height * 0.15, baseY - height * 0.15, height * 0.3, height * 0.15);

  ctx.fillRect(x - height * 0.25, baseY - height * 0.5, height * 0.5, height * 0.35);

  ctx.fillStyle = goldColor;
  ctx.globalAlpha = alpha * 0.7;
  ctx.fillRect(x - height * 0.15, baseY - height * 0.45, height * 0.3, height * 0.25);

  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x - height * 0.3, baseY - height * 0.5);
  ctx.lineTo(x, baseY - height * 0.65);
  ctx.lineTo(x + height * 0.3, baseY - height * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillRect(x - height * 0.05, baseY - height * 0.75, height * 0.1, height * 0.1);

  ctx.restore();
}

function drawStalactite(ctx, x, topY, length, width, color, alpha = 0.8) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x - width * 0.5, topY);
  ctx.quadraticCurveTo(x - width * 0.2, topY + length * 0.7, x, topY + length);
  ctx.quadraticCurveTo(x + width * 0.2, topY + length * 0.7, x + width * 0.5, topY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStalagmite(ctx, x, baseY, height, width, color, alpha = 0.8) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x - width * 0.5, baseY);
  ctx.quadraticCurveTo(x - width * 0.2, baseY - height * 0.7, x, baseY - height);
  ctx.quadraticCurveTo(x + width * 0.2, baseY - height * 0.7, x + width * 0.5, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawChineseRoof(ctx, x, baseY, width, height, color, goldColor, alpha = 0.9) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;

  ctx.beginPath();
  ctx.moveTo(x - width * 0.5, baseY);
  ctx.quadraticCurveTo(x - width * 0.45, baseY - height * 0.3, x - width * 0.25, baseY - height * 0.6);
  ctx.quadraticCurveTo(x, baseY - height, x + width * 0.25, baseY - height * 0.6);
  ctx.quadraticCurveTo(x + width * 0.45, baseY - height * 0.3, x + width * 0.5, baseY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = goldColor;
  ctx.globalAlpha = alpha * 0.6;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - width * 0.5, baseY);
  ctx.quadraticCurveTo(x - width * 0.45, baseY - height * 0.3, x - width * 0.25, baseY - height * 0.6);
  ctx.quadraticCurveTo(x, baseY - height, x + width * 0.25, baseY - height * 0.6);
  ctx.quadraticCurveTo(x + width * 0.45, baseY - height * 0.3, x + width * 0.5, baseY);
  ctx.stroke();

  ctx.fillStyle = goldColor;
  ctx.globalAlpha = alpha * 0.8;
  ctx.beginPath();
  ctx.arc(x - width * 0.5, baseY - 2, 4, 0, Math.PI * 2);
  ctx.arc(x + width * 0.5, baseY - 2, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawStonePillar(ctx, x, baseY, height, width, color, alpha = 0.85) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;

  ctx.fillRect(x - width * 0.4, baseY - height, width * 0.8, height);

  ctx.fillRect(x - width * 0.5, baseY - height - height * 0.08, width, height * 0.08);
  ctx.fillRect(x - width * 0.5, baseY - height * 0.08, width, height * 0.08);

  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha * 0.5;
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = baseY - (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(x - width * 0.35, y);
    ctx.lineTo(x + width * 0.35, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHangingLantern(ctx, x, y, size, goldColor, alpha = 0.9, flicker = 1) {
  ctx.save();

  ctx.strokeStyle = COLORS.darkInk;
  ctx.globalAlpha = alpha * 0.6;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.6);
  ctx.lineTo(x, y - size);
  ctx.stroke();

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 0.8);
  gradient.addColorStop(0, goldColor);
  gradient.addColorStop(0.5, `rgba(200,168,72,${0.7 * flicker})`);
  gradient.addColorStop(1, 'rgba(200,168,72,0)');
  ctx.globalAlpha = alpha * 0.4 * flicker;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS.darkInk;
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.4, size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = goldColor;
  ctx.globalAlpha = alpha * flicker;
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.darkInk;
  ctx.globalAlpha = alpha;
  ctx.fillRect(x - size * 0.35, y - size * 0.15, size * 0.7, size * 0.08);
  ctx.fillRect(x - size * 0.35, y + size * 0.07, size * 0.7, size * 0.08);

  ctx.fillStyle = goldColor;
  ctx.globalAlpha = alpha * 0.7;
  ctx.beginPath();
  ctx.moveTo(x - 2, y + size * 0.5);
  ctx.lineTo(x, y + size * 0.7);
  ctx.lineTo(x + 2, y + size * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawCrane(ctx, x, y, size, color, alpha = 0.8, wingPhase = 0) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineWidth = size * 0.08;

  const wingY = Math.sin(wingPhase) * size * 0.3;

  ctx.beginPath();
  ctx.moveTo(x - size * 0.5, y + wingY);
  ctx.quadraticCurveTo(x - size * 0.2, y - size * 0.2 + wingY, x, y);
  ctx.quadraticCurveTo(x + size * 0.2, y - size * 0.2 - wingY, x + size * 0.5, y - wingY);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.15, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + size * 0.2, y - size * 0.05, size * 0.06, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + size * 0.25, y - size * 0.05);
  ctx.lineTo(x + size * 0.35, y - size * 0.03);
  ctx.stroke();

  ctx.restore();
}

function drawFogBank(ctx, x, y, width, height, color, alpha = 0.3) {
  ctx.save();
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, `rgba(160,152,128,0)`);
  gradient.addColorStop(0.3, `rgba(160,152,128,${alpha})`);
  gradient.addColorStop(0.7, `rgba(160,152,128,${alpha * 0.8})`);
  gradient.addColorStop(1, `rgba(160,152,128,0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCloud(ctx, x, y, width, height, color, alpha = 0.4) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;

  const bumps = 4;
  ctx.beginPath();
  for (let i = 0; i <= bumps; i++) {
    const bx = x + (width / bumps) * i;
    const by = y + (i % 2 === 0 ? 0 : -height * 0.3);
    const br = height * (0.4 + Math.random() * 0.2);
    if (i === 0) {
      ctx.moveTo(bx, by + br);
    }
    ctx.arc(bx, by, br, Math.PI, 0);
  }
  ctx.lineTo(x + width, y + height * 0.3);
  ctx.lineTo(x, y + height * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function generatePaperTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export class BackgroundRenderer {
  constructor(canvasWidth = 960, canvasHeight = 540) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.bgType = 'forest';
    this.time = 0;
    this.paperTexture = generatePaperTexture(canvasWidth, canvasHeight);
    this.blossoms = [];
    this.cranes = [];
    this.torchFlicker = 1;
    this._initAnimatedElements();
  }

  _initAnimatedElements() {
    for (let i = 0; i < 15; i++) {
      this.blossoms.push({
        x: Math.random() * 2000,
        y: Math.random() * 300,
        vx: -0.5 + Math.random() * 0.3,
        vy: 0.3 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        size: 4 + Math.random() * 4,
      });
    }

    for (let i = 0; i < 3; i++) {
      this.cranes.push({
        x: 200 + i * 400,
        y: 80 + Math.random() * 100,
        vx: 0.8 + Math.random() * 0.4,
        size: 20 + Math.random() * 10,
        wingPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  setLevel(levelData) {
    if (levelData && levelData.bgType) {
      this.bgType = levelData.bgType;
    }
  }

  setBgType(bgType) {
    this.bgType = bgType;
  }

  update(dt) {
    this.time += (dt || 16) / 1000;
    this.torchFlicker = 0.85 + Math.sin(this.time * 8) * 0.1 + Math.sin(this.time * 13) * 0.05;

    for (const blossom of this.blossoms) {
      blossom.x += blossom.vx;
      blossom.y += blossom.vy;
      blossom.rotation += blossom.rotationSpeed;

      if (blossom.y > this.canvasHeight + 20) {
        blossom.y = -20;
        blossom.x = Math.random() * 2000;
      }
      if (blossom.x < -20) {
        blossom.x = this.canvasWidth + 20;
      }
    }

    for (const crane of this.cranes) {
      crane.x += crane.vx;
      crane.wingPhase += 0.15;
      crane.y += Math.sin(this.time * 0.5 + crane.x * 0.01) * 0.3;

      if (crane.x > this.canvasWidth + 100) {
        crane.x = -100;
        crane.y = 80 + Math.random() * 100;
      }
    }
  }

  render(ctx, camera) {
    const cameraX = camera?.x ?? camera ?? 0;
    ctx.drawImage(this.paperTexture, 0, 0);

    this._renderLayer(ctx, cameraX, 0);
    this._renderLayer(ctx, cameraX, 1);
    this._renderLayer(ctx, cameraX, 2);
    this._renderLayer(ctx, cameraX, 3);
    this._renderLayer(ctx, cameraX, 4);
  }

  _renderLayer(ctx, cameraX, layerIndex) {
    const speed = LAYER_SPEEDS[layerIndex];
    const offset = -(cameraX * speed) % (this.canvasWidth * 2);

    ctx.save();
    ctx.translate(offset, 0);

    for (let tile = -1; tile < 3; tile++) {
      const tileX = tile * this.canvasWidth * 2;
      this._renderLayerContent(ctx, layerIndex, tileX);
    }

    ctx.restore();

    if (layerIndex === 2 && this.bgType === 'temple') {
      this._renderBlossoms(ctx, cameraX);
    }
    if (layerIndex === 1 && this.bgType === 'mountain') {
      this._renderCranes(ctx, cameraX);
    }
  }

  _renderLayerContent(ctx, layerIndex, tileX) {
    const renderers = {
      forest: () => this._renderForestLayer(ctx, layerIndex, tileX),
      mountain: () => this._renderMountainLayer(ctx, layerIndex, tileX),
      temple: () => this._renderTempleLayer(ctx, layerIndex, tileX),
      cave: () => this._renderCaveLayer(ctx, layerIndex, tileX),
      palace: () => this._renderPalaceLayer(ctx, layerIndex, tileX),
    };

    const renderer = renderers[this.bgType];
    if (renderer) renderer();
  }

  _renderForestLayer(ctx, layerIndex, tileX) {
    const w = this.canvasWidth * 2;
    const h = this.canvasHeight;

    if (layerIndex === 0) {
      const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
      skyGradient.addColorStop(0, '#f5efe3');
      skyGradient.addColorStop(1, '#e8e0d0');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(tileX, 0, w, h);

      drawFogBank(ctx, tileX, h * 0.3, w, h * 0.4, COLORS.lightInk, 0.15);
    }

    if (layerIndex === 1) {
      drawMountainRange(ctx, h * 0.75, w, h * 0.4, COLORS.lightInk, 0.35, tileX + 1);

      const rand = seededRandom(tileX + 100);
      for (let i = 0; i < 8; i++) {
        const x = tileX + randRange(rand, 50, w - 50);
        const treeH = randRange(rand, 60, 100);
        drawPineTree(ctx, x, h * 0.75, treeH, COLORS.lightInk, 0.4);
      }
    }

    if (layerIndex === 2) {
      drawMountainRange(ctx, h * 0.82, w, h * 0.35, COLORS.midInk, 0.5, tileX + 2);

      const rand = seededRandom(tileX + 200);
      for (let i = 0; i < 6; i++) {
        const x = tileX + randRange(rand, 80, w - 80);
        const treeH = randRange(rand, 80, 130);
        drawPineTree(ctx, x, h * 0.82, treeH, COLORS.midInk, 0.6);
      }

      drawFogBank(ctx, tileX, h * 0.6, w, h * 0.3, COLORS.lightInk, 0.2);
    }

    if (layerIndex === 3) {
      const rand = seededRandom(tileX + 300);
      for (let i = 0; i < 10; i++) {
        const x = tileX + randRange(rand, 40, w - 40);
        const treeH = randRange(rand, 100, 160);
        drawPineTree(ctx, x, h * 0.88, treeH, COLORS.darkInk, 0.75);
      }

      for (let i = 0; i < 5; i++) {
        const x = tileX + randRange(rand, 100, w - 100);
        const bambooH = randRange(rand, 120, 180);
        drawBamboo(ctx, x, h * 0.88, bambooH, COLORS.darkInk, 0.7);
      }

      drawFogBank(ctx, tileX, h * 0.7, w, h * 0.25, COLORS.lightInk, 0.25);
    }

    if (layerIndex === 4) {
      const rand = seededRandom(tileX + 400);
      for (let i = 0; i < 4; i++) {
        const x = tileX + randRange(rand, 100, w - 100);
        createInkWash(ctx, x, h * 0.85, randRange(rand, 30, 60), COLORS.blackInk, 0.15);
      }

      for (let i = 0; i < 8; i++) {
        const x = tileX + randRange(rand, 30, w - 30);
        const y = h * 0.85 + randRange(rand, 0, 30);
        createBrushStroke(ctx, x, y, x + randRange(rand, 20, 50), y + randRange(rand, -5, 5), 2, COLORS.blackInk, 0.3);
      }
    }
  }

  _renderMountainLayer(ctx, layerIndex, tileX) {
    const w = this.canvasWidth * 2;
    const h = this.canvasHeight;

    if (layerIndex === 0) {
      const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
      skyGradient.addColorStop(0, '#f0ebe0');
      skyGradient.addColorStop(0.6, '#e5ddd0');
      skyGradient.addColorStop(1, '#d8d0c0');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(tileX, 0, w, h);

      drawCloud(ctx, tileX + 100, h * 0.15, 200, 40, COLORS.lightInk, 0.3);
      drawCloud(ctx, tileX + 500, h * 0.1, 250, 50, COLORS.lightInk, 0.25);
      drawCloud(ctx, tileX + 900, h * 0.18, 180, 35, COLORS.lightInk, 0.35);
      drawCloud(ctx, tileX + 1300, h * 0.12, 220, 45, COLORS.lightInk, 0.28);
    }

    if (layerIndex === 1) {
      drawMountainRange(ctx, h * 0.7, w, h * 0.5, COLORS.lightInk, 0.3, tileX + 10);

      drawCloud(ctx, tileX + 200, h * 0.45, 300, 60, COLORS.lightInk, 0.35);
      drawCloud(ctx, tileX + 700, h * 0.4, 250, 50, COLORS.lightInk, 0.3);
      drawCloud(ctx, tileX + 1200, h * 0.5, 280, 55, COLORS.lightInk, 0.4);
    }

    if (layerIndex === 2) {
      drawMountainRange(ctx, h * 0.8, w, h * 0.45, COLORS.midInk, 0.55, tileX + 20);

      drawCloud(ctx, tileX + 350, h * 0.55, 200, 40, COLORS.midInk, 0.25);
      drawCloud(ctx, tileX + 900, h * 0.5, 240, 45, COLORS.midInk, 0.3);
    }

    if (layerIndex === 3) {
      drawMountainRange(ctx, h * 0.88, w, h * 0.35, COLORS.darkInk, 0.75, tileX + 30);

      const rand = seededRandom(tileX + 300);
      for (let i = 0; i < 5; i++) {
        const x = tileX + randRange(rand, 100, w - 100);
        const treeH = randRange(rand, 70, 110);
        drawPineTree(ctx, x, h * 0.88, treeH, COLORS.darkInk, 0.8);
      }
    }

    if (layerIndex === 4) {
      const rand = seededRandom(tileX + 400);
      for (let i = 0; i < 3; i++) {
        const x = tileX + randRange(rand, 150, w - 150);
        createInkWash(ctx, x, h * 0.85, randRange(rand, 40, 80), COLORS.blackInk, 0.2);
      }

      for (let i = 0; i < 6; i++) {
        const x = tileX + randRange(rand, 50, w - 50);
        const y = h * 0.85 + randRange(rand, 0, 25);
        createBrushStroke(ctx, x, y, x + randRange(rand, 15, 40), y + randRange(rand, -3, 3), 2, COLORS.blackInk, 0.35);
      }
    }
  }

  _renderTempleLayer(ctx, layerIndex, tileX) {
    const w = this.canvasWidth * 2;
    const h = this.canvasHeight;

    if (layerIndex === 0) {
      const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
      skyGradient.addColorStop(0, '#f5efe0');
      skyGradient.addColorStop(1, '#e8e0d0');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(tileX, 0, w, h);

      drawFogBank(ctx, tileX, h * 0.25, w, h * 0.35, COLORS.lightInk, 0.12);
    }

    if (layerIndex === 1) {
      drawMountainRange(ctx, h * 0.7, w, h * 0.4, COLORS.lightInk, 0.35, tileX + 5);

      const rand = seededRandom(tileX + 100);
      for (let i = 0; i < 3; i++) {
        const x = tileX + 200 + i * 500 + randRange(rand, -50, 50);
        drawPagoda(ctx, x, h * 0.7, 120 + randRange(rand, 0, 40), COLORS.midInk, COLORS.gold, 0.5);
      }
    }

    if (layerIndex === 2) {
      const rand = seededRandom(tileX + 200);

      for (let i = 0; i < 4; i++) {
        const x = tileX + 150 + i * 450 + randRange(rand, -30, 30);
        drawPagoda(ctx, x, h * 0.8, 150 + randRange(rand, 0, 50), COLORS.darkInk, COLORS.gold, 0.7);
      }

      for (let i = 0; i < 6; i++) {
        const x = tileX + 80 + i * 300 + randRange(rand, -20, 20);
        drawStoneLantern(ctx, x, h * 0.85, 50 + randRange(rand, 0, 20), COLORS.darkInk, COLORS.gold, 0.75);
      }

      drawFogBank(ctx, tileX, h * 0.6, w, h * 0.3, COLORS.lightInk, 0.15);
    }

    if (layerIndex === 3) {
      const rand = seededRandom(tileX + 300);

      for (let i = 0; i < 5; i++) {
        const x = tileX + 100 + i * 350 + randRange(rand, -40, 40);
        drawPagoda(ctx, x, h * 0.88, 180 + randRange(rand, 0, 60), COLORS.blackInk, COLORS.gold, 0.85);
      }

      for (let i = 0; i < 8; i++) {
        const x = tileX + 50 + i * 220 + randRange(rand, -15, 15);
        drawStoneLantern(ctx, x, h * 0.9, 60 + randRange(rand, 0, 25), COLORS.blackInk, COLORS.gold, 0.9);
      }

      for (let i = 0; i < 4; i++) {
        const x = tileX + 200 + i * 450 + randRange(rand, -30, 30);
        drawHangingLantern(ctx, x, h * 0.3, 18, COLORS.gold, 0.8, this.torchFlicker);
      }
    }

    if (layerIndex === 4) {
      const rand = seededRandom(tileX + 400);
      for (let i = 0; i < 5; i++) {
        const x = tileX + randRange(rand, 100, w - 100);
        createInkWash(ctx, x, h * 0.85, randRange(rand, 35, 70), COLORS.blackInk, 0.18);
      }

      for (let i = 0; i < 3; i++) {
        const x = tileX + 300 + i * 500;
        createBrushStroke(ctx, x, h * 0.9, x + 30, h * 0.92, 3, COLORS.gold, 0.4);
      }
    }
  }

  _renderCaveLayer(ctx, layerIndex, tileX) {
    const w = this.canvasWidth * 2;
    const h = this.canvasHeight;

    if (layerIndex === 0) {
      const caveGradient = ctx.createLinearGradient(0, 0, 0, h);
      caveGradient.addColorStop(0, '#3a3028');
      caveGradient.addColorStop(0.5, '#2a2018');
      caveGradient.addColorStop(1, '#1a1210');
      ctx.fillStyle = caveGradient;
      ctx.fillRect(tileX, 0, w, h);

      const glowGradient = ctx.createRadialGradient(tileX + w / 2, h * 0.5, 0, tileX + w / 2, h * 0.5, w * 0.6);
      glowGradient.addColorStop(0, 'rgba(200,168,72,0.15)');
      glowGradient.addColorStop(1, 'rgba(200,168,72,0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(tileX, 0, w, h);
    }

    if (layerIndex === 1) {
      const rand = seededRandom(tileX + 100);
      for (let i = 0; i < 12; i++) {
        const x = tileX + randRange(rand, 50, w - 50);
        const length = randRange(rand, 80, 150);
        const width = randRange(rand, 30, 50);
        drawStalactite(ctx, x, 0, length, width, COLORS.darkInk, 0.5);
      }

      for (let i = 0; i < 8; i++) {
        const x = tileX + randRange(rand, 80, w - 80);
        const height = randRange(rand, 60, 100);
        const width = randRange(rand, 25, 45);
        drawStalagmite(ctx, x, h * 0.9, height, width, COLORS.darkInk, 0.5);
      }
    }

    if (layerIndex === 2) {
      const rand = seededRandom(tileX + 200);
      for (let i = 0; i < 10; i++) {
        const x = tileX + randRange(rand, 60, w - 60);
        const length = randRange(rand, 100, 180);
        const width = randRange(rand, 35, 60);
        drawStalactite(ctx, x, 0, length, width, COLORS.midInk, 0.7);
      }

      for (let i = 0; i < 10; i++) {
        const x = tileX + randRange(rand, 70, w - 70);
        const height = randRange(rand, 80, 140);
        const width = randRange(rand, 30, 50);
        drawStalagmite(ctx, x, h * 0.9, height, width, COLORS.midInk, 0.7);
      }

      for (let i = 0; i < 4; i++) {
        const x = tileX + 200 + i * 400;
        const torchGradient = ctx.createRadialGradient(x, h * 0.6, 0, x, h * 0.6, 150 * this.torchFlicker);
        torchGradient.addColorStop(0, `rgba(200,168,72,${0.3 * this.torchFlicker})`);
        torchGradient.addColorStop(1, 'rgba(200,168,72,0)');
        ctx.fillStyle = torchGradient;
        ctx.fillRect(x - 150, h * 0.6 - 150, 300, 300);
      }
    }

    if (layerIndex === 3) {
      const rand = seededRandom(tileX + 300);
      for (let i = 0; i < 8; i++) {
        const x = tileX + randRange(rand, 70, w - 70);
        const length = randRange(rand, 120, 200);
        const width = randRange(rand, 40, 70);
        drawStalactite(ctx, x, 0, length, width, COLORS.darkInk, 0.85);
      }

      for (let i = 0; i < 12; i++) {
        const x = tileX + randRange(rand, 60, w - 60);
        const height = randRange(rand, 100, 160);
        const width = randRange(rand, 35, 55);
        drawStalagmite(ctx, x, h * 0.9, height, width, COLORS.darkInk, 0.85);
      }

      for (let i = 0; i < 5; i++) {
        const x = tileX + 150 + i * 350;
        ctx.fillStyle = COLORS.blackInk;
        ctx.fillRect(x - 4, h * 0.45, 8, 80);
        ctx.fillStyle = COLORS.gold;
        ctx.globalAlpha = this.torchFlicker * 0.9;
        ctx.beginPath();
        ctx.moveTo(x, h * 0.45);
        ctx.quadraticCurveTo(x - 10, h * 0.4, x, h * 0.3);
        ctx.quadraticCurveTo(x + 10, h * 0.4, x, h * 0.45);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    if (layerIndex === 4) {
      const rand = seededRandom(tileX + 400);
      for (let i = 0; i < 6; i++) {
        const x = tileX + randRange(rand, 80, w - 80);
        const length = randRange(rand, 150, 220);
        const width = randRange(rand, 50, 80);
        drawStalactite(ctx, x, 0, length, width, COLORS.blackInk, 0.95);
      }

      for (let i = 0; i < 8; i++) {
        const x = tileX + randRange(rand, 90, w - 90);
        const height = randRange(rand, 120, 180);
        const width = randRange(rand, 45, 65);
        drawStalagmite(ctx, x, h * 0.9, height, width, COLORS.blackInk, 0.95);
      }

      for (let i = 0; i < 6; i++) {
        const x = tileX + randRange(rand, 100, w - 100);
        createInkWash(ctx, x, h * 0.85, randRange(rand, 30, 60), COLORS.gold, 0.1 * this.torchFlicker);
      }
    }
  }

  _renderPalaceLayer(ctx, layerIndex, tileX) {
    const w = this.canvasWidth * 2;
    const h = this.canvasHeight;

    if (layerIndex === 0) {
      const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
      skyGradient.addColorStop(0, '#f5efe0');
      skyGradient.addColorStop(0.7, '#e8e0d0');
      skyGradient.addColorStop(1, '#d8d0c0');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(tileX, 0, w, h);

      drawFogBank(ctx, tileX, h * 0.2, w, h * 0.3, COLORS.lightInk, 0.1);
    }

    if (layerIndex === 1) {
      drawMountainRange(ctx, h * 0.75, w, h * 0.35, COLORS.lightInk, 0.3, tileX + 8);

      const rand = seededRandom(tileX + 100);
      for (let i = 0; i < 3; i++) {
        const x = tileX + 300 + i * 550;
        const roofY = h * 0.6;
        drawChineseRoof(ctx, x, roofY, 200, 80, COLORS.midInk, COLORS.gold, 0.45);

        ctx.fillStyle = COLORS.midInk;
        ctx.globalAlpha = 0.45;
        ctx.fillRect(x - 90, roofY, 180, h * 0.15);
        ctx.globalAlpha = 1;
      }
    }

    if (layerIndex === 2) {
      const rand = seededRandom(tileX + 200);

      for (let i = 0; i < 4; i++) {
        const x = tileX + 200 + i * 450;
        const roofY = h * 0.55;
        drawChineseRoof(ctx, x, roofY, 250, 100, COLORS.darkInk, COLORS.gold, 0.65);

        ctx.fillStyle = COLORS.darkInk;
        ctx.globalAlpha = 0.65;
        ctx.fillRect(x - 110, roofY, 220, h * 0.25);
        ctx.globalAlpha = 1;

        for (let j = 0; j < 3; j++) {
          const px = x - 60 + j * 60;
          drawStonePillar(ctx, px, h * 0.8, 120, 25, COLORS.darkInk, 0.6);
        }
      }

      drawFogBank(ctx, tileX, h * 0.5, w, h * 0.25, COLORS.lightInk, 0.15);
    }

    if (layerIndex === 3) {
      const rand = seededRandom(tileX + 300);

      for (let i = 0; i < 3; i++) {
        const x = tileX + 300 + i * 600;
        const roofY = h * 0.45;
        drawChineseRoof(ctx, x, roofY, 320, 130, COLORS.blackInk, COLORS.gold, 0.85);

        ctx.fillStyle = COLORS.blackInk;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x - 140, roofY, 280, h * 0.4);
        ctx.globalAlpha = 1;

        for (let j = 0; j < 4; j++) {
          const px = x - 90 + j * 60;
          drawStonePillar(ctx, px, h * 0.85, 160, 30, COLORS.blackInk, 0.8);
        }

        ctx.fillStyle = COLORS.gold;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x - 20, roofY + 30, 40, 50);
        ctx.globalAlpha = 1;
      }

      for (let i = 0; i < 8; i++) {
        const x = tileX + 100 + i * 220;
        drawHangingLantern(ctx, x, h * 0.25, 22, COLORS.gold, 0.85, this.torchFlicker);
      }
    }

    if (layerIndex === 4) {
      const rand = seededRandom(tileX + 400);

      for (let i = 0; i < 6; i++) {
        const x = tileX + 80 + i * 300;
        drawStonePillar(ctx, x, h * 0.88, 140, 35, COLORS.blackInk, 0.95);
      }

      for (let i = 0; i < 6; i++) {
        const x = tileX + 150 + i * 300;
        drawHangingLantern(ctx, x, h * 0.15, 26, COLORS.gold, 0.95, this.torchFlicker);
      }

      for (let i = 0; i < 4; i++) {
        const x = tileX + randRange(rand, 100, w - 100);
        createInkWash(ctx, x, h * 0.85, randRange(rand, 40, 80), COLORS.blackInk, 0.2);
      }

      for (let i = 0; i < 5; i++) {
        const x = tileX + 200 + i * 350;
        createBrushStroke(ctx, x, h * 0.9, x + 40, h * 0.93, 3, COLORS.gold, 0.5);
      }
    }
  }

  _renderBlossoms(ctx, cameraX) {
    ctx.save();
    for (const blossom of this.blossoms) {
      const sx = (blossom.x - cameraX * 0.5) % (this.canvasWidth + 100);
      const x = sx < -50 ? sx + this.canvasWidth + 100 : sx;
      const y = blossom.y;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(blossom.rotation);

      ctx.fillStyle = COLORS.gold;
      ctx.globalAlpha = 0.8;
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 / 5) * i);
        ctx.beginPath();
        ctx.ellipse(0, -blossom.size * 0.5, blossom.size * 0.25, blossom.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = COLORS.darkInk;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(0, 0, blossom.size * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  _renderCranes(ctx, cameraX) {
    ctx.save();
    for (const crane of this.cranes) {
      const sx = (crane.x - cameraX * 0.25) % (this.canvasWidth + 200);
      const x = sx < -100 ? sx + this.canvasWidth + 200 : sx;
      const y = crane.y;

      drawCrane(ctx, x, y, crane.size, COLORS.darkInk, 0.8, crane.wingPhase);
    }
    ctx.restore();
  }
}
