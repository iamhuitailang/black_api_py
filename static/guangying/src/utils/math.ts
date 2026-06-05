/**
 * 游戏数学工具模块
 * 提供常用的数学计算、碰撞检测和向量运算功能
 */

/** 2D向量类型 */
export interface Vector2 {
  x: number;
  y: number;
}

/** 矩形区域类型 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** AABB包围盒类型（轴对齐包围盒） */
export interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * 将数值限制在指定范围内
 * @param value 输入值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的值
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 线性插值
 * 在起始值和结束值之间进行线性插值
 * @param start 起始值
 * @param end 结束值
 * @param t 插值因子 (0-1)
 * @returns 插值结果
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

/**
 * 数值映射
 * 将一个范围内的数值映射到另一个范围
 * @param value 输入值
 * @param inMin 输入范围最小值
 * @param inMax 输入范围最大值
 * @param outMin 输出范围最小值
 * @param outMax 输出范围最大值
 * @returns 映射后的值
 */
export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (inMax - inMin === 0) {
    return outMin;
  }
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * 生成指定范围内的随机数
 * @param min 最小值（包含）
 * @param max 最大值（包含）
 * @returns 随机数
 */
export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 计算两点之间的欧几里得距离
 * @param x1 点1的x坐标
 * @param y1 点1的y坐标
 * @param x2 点2的x坐标
 * @param y2 点2的y坐标
 * @returns 两点之间的距离
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 计算两点之间的曼哈顿距离
 * 曼哈顿距离 = |x1-x2| + |y1-y2|
 * @param x1 点1的x坐标
 * @param y1 点1的y坐标
 * @param x2 点2的x坐标
 * @param y2 点2的y坐标
 * @returns 曼哈顿距离
 */
export function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * 计算两点之间的平方距离
 * 用于避免开方运算，提高性能
 * @param x1 点1的x坐标
 * @param y1 点1的y坐标
 * @param x2 点2的x坐标
 * @param y2 点2的y坐标
 * @returns 平方距离
 */
export function distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

/**
 * 判断两个矩形是否相交
 * @param rect1 矩形1
 * @param rect2 矩形2
 * @returns 是否相交
 */
export function rectIntersects(rect1: Rect, rect2: Rect): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

/**
 * 判断点是否在矩形内部
 * @param px 点的x坐标
 * @param py 点的y坐标
 * @param rect 矩形
 * @returns 是否在矩形内部
 */
export function pointInRect(px: number, py: number, rect: Rect): boolean {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

/**
 * AABB包围盒碰撞检测
 * 检测两个轴对齐包围盒是否发生碰撞
 * @param a 包围盒A
 * @param b 包围盒B
 * @returns 是否发生碰撞
 */
export function aabbCollision(a: AABB, b: AABB): boolean {
  return (
    a.minX <= b.maxX &&
    a.maxX >= b.minX &&
    a.minY <= b.maxY &&
    a.maxY >= b.minY
  );
}

/**
 * 从矩形创建AABB包围盒
 * @param rect 矩形
 * @returns AABB包围盒
 */
export function rectToAABB(rect: Rect): AABB {
  return {
    minX: rect.x,
    minY: rect.y,
    maxX: rect.x + rect.width,
    maxY: rect.y + rect.height,
  };
}

/**
 * 计算两个矩形的碰撞信息
 * @param rect1 矩形1
 * @param rect2 矩形2
 * @returns 碰撞信息，如果没有碰撞则返回null
 */
export function getCollisionInfo(
  rect1: Rect,
  rect2: Rect
): {
  overlapX: number;
  overlapY: number;
  minOverlap: number;
  direction: 'left' | 'right' | 'top' | 'bottom';
} | null {
  if (!rectIntersects(rect1, rect2)) {
    return null;
  }

  const a = rectToAABB(rect1);
  const b = rectToAABB(rect2);

  const overlapLeft = a.maxX - b.minX;
  const overlapRight = b.maxX - a.minX;
  const overlapTop = a.maxY - b.minY;
  const overlapBottom = b.maxY - a.minY;

  const overlapX = Math.min(overlapLeft, overlapRight);
  const overlapY = Math.min(overlapTop, overlapBottom);

  const minOverlap = Math.min(overlapX, overlapY);

  let direction: 'left' | 'right' | 'top' | 'bottom';
  if (minOverlap === overlapLeft) {
    direction = 'right';
  } else if (minOverlap === overlapRight) {
    direction = 'left';
  } else if (minOverlap === overlapTop) {
    direction = 'bottom';
  } else {
    direction = 'top';
  }

  return {
    overlapX,
    overlapY,
    minOverlap,
    direction,
  };
}

/**
 * 向量加法
 * @param v1 向量1
 * @param v2 向量2
 * @returns 相加后的向量
 */
export function vectorAdd(v1: Vector2, v2: Vector2): Vector2 {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y,
  };
}

/**
 * 向量减法
 * @param v1 向量1（被减向量）
 * @param v2 向量2（减向量）
 * @returns 相减后的向量 (v1 - v2)
 */
export function vectorSub(v1: Vector2, v2: Vector2): Vector2 {
  return {
    x: v1.x - v2.x,
    y: v1.y - v2.y,
  };
}

/**
 * 向量标量乘法
 * @param v 向量
 * @param scalar 标量
 * @returns 相乘后的向量
 */
export function vectorMul(v: Vector2, scalar: number): Vector2 {
  return {
    x: v.x * scalar,
    y: v.y * scalar,
  };
}

/**
 * 向量归一化（单位化）
 * 将向量转换为长度为1的单位向量
 * @param v 输入向量
 * @returns 归一化后的向量，如果输入是零向量则返回零向量
 */
export function vectorNormalize(v: Vector2): Vector2 {
  const length = Math.sqrt(v.x * v.x + v.y * v.y);

  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: v.x / length,
    y: v.y / length,
  };
}

/**
 * 计算向量的长度（模）
 * @param v 向量
 * @returns 向量长度
 */
export function vectorLength(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * 计算向量的平方长度
 * 用于避免开方运算，提高性能
 * @param v 向量
 * @returns 平方长度
 */
export function vectorLengthSquared(v: Vector2): number {
  return v.x * v.x + v.y * v.y;
}

/**
 * 向量点积
 * @param v1 向量1
 * @param v2 向量2
 * @returns 点积结果
 */
export function vectorDot(v1: Vector2, v2: Vector2): number {
  return v1.x * v2.x + v1.y * v2.y;
}

/**
 * 向量叉积（2D叉积返回标量）
 * 结果为正表示v2在v1的逆时针方向
 * 结果为负表示v2在v1的顺时针方向
 * 结果为0表示两向量共线
 * @param v1 向量1
 * @param v2 向量2
 * @returns 叉积结果
 */
export function vectorCross(v1: Vector2, v2: Vector2): number {
  return v1.x * v2.y - v1.y * v2.x;
}

/**
 * 计算两个向量之间的夹角（弧度）
 * @param v1 向量1
 * @param v2 向量2
 * @returns 夹角（弧度）
 */
export function vectorAngle(v1: Vector2, v2: Vector2): number {
  const dot = vectorDot(v1, v2);
  const length1 = vectorLength(v1);
  const length2 = vectorLength(v2);

  if (length1 === 0 || length2 === 0) {
    return 0;
  }

  const cosAngle = dot / (length1 * length2);
  return Math.acos(clamp(cosAngle, -1, 1));
}

/**
 * 向量旋转
 * @param v 输入向量
 * @param angle 旋转角度（弧度）
 * @returns 旋转后的向量
 */
export function vectorRotate(v: Vector2, angle: number): Vector2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

/**
 * 计算两点之间的向量
 * @param fromX 起点x坐标
 * @param fromY 起点y坐标
 * @param toX 终点x坐标
 * @param toY 终点y坐标
 * @returns 从起点指向终点的向量
 */
export function vectorFromPoints(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): Vector2 {
  return {
    x: toX - fromX,
    y: toY - fromY,
  };
}

/**
 * 角度转弧度
 * @param degrees 角度
 * @returns 弧度
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * 弧度转角度
 * @param radians 弧度
 * @returns 角度
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * 检查数值是否接近零
 * @param value 数值
 * @param epsilon 容差
 * @returns 是否接近零
 */
export function isNearZero(value: number, epsilon: number = 0.0001): boolean {
  return Math.abs(value) < epsilon;
}

/**
 * 检查两个数值是否近似相等
 * @param a 数值a
 * @param b 数值b
 * @param epsilon 容差
 * @returns 是否近似相等
 */
export function approximatelyEqual(a: number, b: number, epsilon: number = 0.0001): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * 随机生成单位向量
 * @returns 随机单位向量
 */
export function randomUnitVector(): Vector2 {
  const angle = randomRange(0, Math.PI * 2);
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
}

/**
 * 线性插值两个向量
 * @param v1 起始向量
 * @param v2 结束向量
 * @param t 插值因子 (0-1)
 * @returns 插值后的向量
 */
export function vectorLerp(v1: Vector2, v2: Vector2, t: number): Vector2 {
  const clampedT = clamp(t, 0, 1);
  return {
    x: lerp(v1.x, v2.x, clampedT),
    y: lerp(v1.y, v2.y, clampedT),
  };
}
