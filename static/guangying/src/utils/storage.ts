/**
 * 游戏本地存储工具模块
 * 提供游戏存档的保存、加载、校验和版本迁移功能
 */

/** 存档数据的基础接口 */
export interface GameSaveData {
  /** 存档版本号，用于版本迁移 */
  version: number;
  /** 存档创建时间戳 */
  createdAt: number;
  /** 存档最后更新时间戳 */
  updatedAt: number;
  /** 游戏实际数据 */
  data: Record<string, unknown>;
}

/** 存档元数据，用于存储校验和等信息 */
interface SaveMetadata {
  /** CRC32校验和 */
  checksum: number;
  /** 数据是否压缩 */
  compressed: boolean;
  /** 存档版本 */
  version: number;
}

/** 版本迁移函数类型 */
type MigrationFunction = (data: Record<string, unknown>) => Record<string, unknown>;

/** 存储键名常量 */
const STORAGE_KEY = 'guangying_game_save';
const METADATA_KEY = 'guangying_game_metadata';
/** 当前存档版本号 */
const CURRENT_VERSION = 1;

/**
 * CRC32校验和实现
 * 用于验证存档数据的完整性
 * @param str 要计算校验和的字符串
 * @returns CRC32校验和数值
 */
export function crc32(str: string): number {
  let crc = 0 ^ (-1);
  const table: number[] = [];

  // 预生成CRC32表
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (3988292384 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  // 计算CRC32
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 255];
  }

  return (crc ^ (-1)) >>> 0;
}

/**
 * 简单的JSON字符串压缩
 * 使用字典替换重复的键名和字符串来减小体积
 * @param str 原始JSON字符串
 * @returns 压缩后的字符串
 */
export function compress(str: string): string {
  try {
    // 提取所有唯一的字符串标记（键名和字符串值）
    const tokens = new Set<string>();
    const tokenRegex = /"([^"\\]*(\\.[^"\\]*)*)"/g;
    let match;

    while ((match = tokenRegex.exec(str)) !== null) {
      if (match[1].length > 2) {
        tokens.add(match[1]);
      }
    }

    // 如果标记太少，不进行压缩
    if (tokens.size < 5) {
      return '\x00' + str; // \x00 表示未压缩
    }

    // 创建字典
    const tokenArray = Array.from(tokens);
    const dict: Record<string, string> = {};
    tokenArray.forEach((token, index) => {
      dict[token] = String.fromCharCode(index + 1);
    });

    // 替换字符串
    let compressed = str;
    for (const token of tokenArray) {
      const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      compressed = compressed.replace(
        new RegExp(`"${escapedToken}"`, 'g'),
        `\x01${dict[token]}`
      );
    }

    // 格式：\x01 + 字典长度 + 字典 + 压缩数据
    return '\x01' + String.fromCharCode(tokenArray.length) + tokenArray.join('\x02') + '\x03' + compressed;
  } catch {
    return '\x00' + str;
  }
}

/**
 * 解压缩使用compress函数压缩的字符串
 * @param compressed 压缩后的字符串
 * @returns 解压后的原始字符串
 */
export function decompress(compressed: string): string {
  if (!compressed || compressed.length === 0) {
    return '';
  }

  // 检查压缩标记
  if (compressed[0] === '\x00') {
    return compressed.slice(1);
  }

  if (compressed[0] !== '\x01') {
    return compressed;
  }

  try {
    // 读取字典长度
    const dictLength = compressed.charCodeAt(1);
    let pos = 2;

    // 读取字典
    const tokens: string[] = [];
    for (let i = 0; i < dictLength; i++) {
      const end = compressed.indexOf('\x02', pos);
      if (end === -1) break;
      tokens.push(compressed.slice(pos, end));
      pos = end + 1;
    }

    // 跳过分隔符
    pos = compressed.indexOf('\x03', pos) + 1;
    if (pos === 0) return compressed;

    // 解压数据
    let data = compressed.slice(pos);
    for (let i = 0; i < tokens.length; i++) {
      const code = String.fromCharCode(i + 1);
      data = data.replace(
        new RegExp(`\\x01${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
        `"${tokens[i]}"`
      );
    }

    return data;
  } catch {
    return compressed;
  }
}

/**
 * 版本迁移注册表
 * 每个迁移函数负责将数据从一个版本升级到下一个版本
 */
const migrations: Record<number, MigrationFunction> = {
  // 示例：从版本0迁移到版本1
  0: (data: Record<string, unknown>): Record<string, unknown> => {
    // 假设版本0没有player字段，版本1需要添加
    if (!data.player) {
      data.player = {
        name: 'Player',
        level: 1,
        exp: 0,
      };
    }
    return data;
  },
  // 可以继续添加更多版本迁移...
  // 1: migrateV1ToV2,
  // 2: migrateV2ToV3,
};

/**
 * 执行版本迁移
 * 将存档数据从旧版本升级到当前版本
 * @param data 原始存档数据
 * @param fromVersion 源版本号
 * @returns 迁移后的存档数据
 */
export function migrateVersion(
  data: Record<string, unknown>,
  fromVersion: number
): Record<string, unknown> {
  let currentData = { ...data };
  let currentVersion = fromVersion;

  while (currentVersion < CURRENT_VERSION) {
    const migration = migrations[currentVersion];
    if (migration) {
      currentData = migration(currentData);
    }
    currentVersion++;
  }

  return currentData;
}

/**
 * 验证存档数据的有效性
 * @param saveData 存档数据对象
 * @returns 是否有效
 */
export function validateSave(saveData: unknown): saveData is GameSaveData {
  if (!saveData || typeof saveData !== 'object') {
    return false;
  }

  const data = saveData as Record<string, unknown>;

  // 检查必要字段
  if (typeof data.version !== 'number') return false;
  if (typeof data.createdAt !== 'number') return false;
  if (typeof data.updatedAt !== 'number') return false;
  if (!data.data || typeof data.data !== 'object') return false;

  // 检查版本号范围
  if (data.version < 0 || data.version > CURRENT_VERSION) return false;

  return true;
}

/**
 * 保存游戏存档到本地存储
 * @param gameData 游戏数据对象
 * @returns 是否保存成功
 */
export function saveGame(gameData: Record<string, unknown>): boolean {
  try {
    // 构建完整的存档数据
    const existingSave = loadGame();
    const saveData: GameSaveData = {
      version: CURRENT_VERSION,
      createdAt: existingSave?.createdAt || Date.now(),
      updatedAt: Date.now(),
      data: gameData,
    };

    // 序列化为JSON字符串
    const jsonString = JSON.stringify(saveData);

    // 计算CRC32校验和
    const checksum = crc32(jsonString);

    // 压缩数据
    const compressed = compress(jsonString);

    // 构建元数据
    const metadata: SaveMetadata = {
      checksum,
      compressed: compressed[0] === '\x01',
      version: CURRENT_VERSION,
    };

    // 保存到localStorage
    localStorage.setItem(STORAGE_KEY, compressed);
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));

    return true;
  } catch (error) {
    console.error('保存游戏存档失败:', error);
    return false;
  }
}

/**
 * 从本地存储加载游戏存档
 * @returns 存档数据，如果加载失败则返回null
 */
export function loadGame(): GameSaveData | null {
  try {
    // 读取压缩数据和元数据
    const compressed = localStorage.getItem(STORAGE_KEY);
    const metadataStr = localStorage.getItem(METADATA_KEY);

    if (!compressed || !metadataStr) {
      return null;
    }

    // 解析元数据
    const metadata = JSON.parse(metadataStr) as SaveMetadata;

    // 解压缩数据
    const jsonString = decompress(compressed);

    // 验证CRC32校验和
    const calculatedChecksum = crc32(jsonString);
    if (calculatedChecksum !== metadata.checksum) {
      console.error('存档数据损坏，校验和不匹配');
      return null;
    }

    // 解析存档数据
    const saveData = JSON.parse(jsonString) as GameSaveData;

    // 验证存档有效性
    if (!validateSave(saveData)) {
      console.error('存档数据格式无效');
      return null;
    }

    // 版本迁移
    if (saveData.version < CURRENT_VERSION) {
      console.log(`正在迁移存档，从版本 ${saveData.version} 到 ${CURRENT_VERSION}`);
      saveData.data = migrateVersion(saveData.data, saveData.version);
      saveData.version = CURRENT_VERSION;
    }

    return saveData;
  } catch (error) {
    console.error('加载游戏存档失败:', error);
    return null;
  }
}

/**
 * 清除游戏存档
 * @returns 是否清除成功
 */
export function clearGame(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(METADATA_KEY);
    return true;
  } catch (error) {
    console.error('清除游戏存档失败:', error);
    return false;
  }
}

/**
 * 检查是否存在有效存档
 * @returns 是否存在有效存档
 */
export function hasValidSave(): boolean {
  const saveData = loadGame();
  return saveData !== null;
}

/**
 * 获取存档的基本信息（不加载完整数据）
 * @returns 存档信息，如果不存在则返回null
 */
export function getSaveInfo(): { version: number; updatedAt: number; createdAt: number } | null {
  try {
    const metadataStr = localStorage.getItem(METADATA_KEY);
    if (!metadataStr) return null;

    const metadata = JSON.parse(metadataStr) as SaveMetadata;

    // 尝试快速读取时间戳（不解析完整数据）
    const compressed = localStorage.getItem(STORAGE_KEY);
    if (!compressed) return null;

    const jsonString = decompress(compressed);

    // 使用正则表达式快速提取时间戳
    const createdAtMatch = jsonString.match(/"createdAt":(\d+)/);
    const updatedAtMatch = jsonString.match(/"updatedAt":(\d+)/);

    return {
      version: metadata.version,
      createdAt: createdAtMatch ? parseInt(createdAtMatch[1], 10) : 0,
      updatedAt: updatedAtMatch ? parseInt(updatedAtMatch[1], 10) : 0,
    };
  } catch {
    return null;
  }
}
