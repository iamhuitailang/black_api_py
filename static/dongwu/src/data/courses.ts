import type { Course } from '../types';

export const courses: Course[] = [
  { id: 'painting-basic', name: '基础绘画', type: 'painting', emoji: '🎨', duration: 5000, energyCost: 15, expGain: 25, intelligenceGain: 8, happinessChange: 5, minLevel: 1 },
  { id: 'painting-advanced', name: '创意绘画', type: 'painting', emoji: '🖼️', duration: 8000, energyCost: 25, expGain: 45, intelligenceGain: 15, happinessChange: 10, minLevel: 3 },
  { id: 'music-basic', name: '音乐启蒙', type: 'music', emoji: '🎵', duration: 5000, energyCost: 12, expGain: 22, intelligenceGain: 6, happinessChange: 12, minLevel: 1 },
  { id: 'music-advanced', name: '乐器演奏', type: 'music', emoji: '🎹', duration: 8000, energyCost: 22, expGain: 42, intelligenceGain: 12, happinessChange: 18, minLevel: 3 },
  { id: 'sports-basic', name: '趣味运动', type: 'sports', emoji: '⚽', duration: 5000, energyCost: 20, expGain: 28, intelligenceGain: 4, happinessChange: 15, minLevel: 1 },
  { id: 'sports-advanced', name: '障碍训练', type: 'sports', emoji: '🏃', duration: 8000, energyCost: 30, expGain: 50, intelligenceGain: 8, happinessChange: 20, minLevel: 3 },
  { id: 'cognition-basic', name: '认知游戏', type: 'cognition', emoji: '🧩', duration: 5000, energyCost: 15, expGain: 25, intelligenceGain: 12, happinessChange: 8, minLevel: 1 },
  { id: 'cognition-advanced', name: '逻辑思维', type: 'cognition', emoji: '💡', duration: 8000, energyCost: 20, expGain: 48, intelligenceGain: 20, happinessChange: 5, minLevel: 3 },
];

export const getCourseById = (id: string): Course | undefined => {
  return courses.find(c => c.id === id);
};

export const talentBonus: Record<string, string> = { '绘画': 'painting', '音乐': 'music', '运动': 'sports', '认知': 'cognition', '全能': 'all' };
