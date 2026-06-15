import { Skull, Play, RotateCcw, Target, Trophy, Crosshair } from 'lucide-react';
import { loadSaveData } from '@/utils/saveSystem';
import { useEffect, useState } from 'react';
import { SaveData } from '@/types/game';

interface StartMenuProps {
  onStartGame: () => void;
  onContinue: () => void;
}

export default function StartMenu({ onStartGame, onContinue }: StartMenuProps) {
  const [saveData, setSaveData] = useState<SaveData | null>(null);

  useEffect(() => {
    const data = loadSaveData();
    setSaveData(data);
  }, []);

  const hasContinue = saveData && saveData.lastPlayedWave > 1;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #050508 0%, #0a0a15 30%, #12121e 60%, #0d0d0a 100%)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${(i * 7 + Math.sin(i * 2.3) * 8) % 95}%`,
              top: `${15 + Math.random() * 70}%`,
              transform: `scale(${0.5 + Math.random()})`,
              opacity: 0.3 + Math.random() * 0.4,
            }}
          >
            <Skull size={60 + Math.random() * 40} className="text-red-900" />
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center px-4">
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <Crosshair
              size={90}
              className="text-red-600"
              strokeWidth={1.5}
              style={{ animation: 'pulse 2s ease-in-out infinite', filter: 'drop-shadow(0 0 15px rgba(220,50,50,0.4))' }}
            />
            <Skull
              size={44}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500"
              style={{ filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.4))' }}
            />
          </div>
        </div>

        <h1
          className="text-6xl md:text-8xl font-black tracking-wider mb-1"
          style={{
            background: 'linear-gradient(180deg, #ff6b35 0%, #e63946 40%, #8b0000 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 30px rgba(230,57,70,0.4)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
          }}
        >
          僵尸来袭
        </h1>
        <p
          className="text-gray-500 text-sm mb-10 tracking-[0.5em] font-bold"
          style={{ textShadow: '0 0 10px rgba(100,100,100,0.2)' }}
        >
          ZOMBIE SURVIVAL
        </p>

        <div className="space-y-4 max-w-xs mx-auto">
          <button
            onClick={onStartGame}
            className="w-full py-4 px-6 text-white font-bold text-xl rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-3 border"
            style={{
              background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 50%, #8b0000 100%)',
              borderColor: 'rgba(220,50,50,0.4)',
              boxShadow: '0 0 20px rgba(220,50,50,0.2), 0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <Play size={22} fill="currentColor" />
            开始游戏
          </button>

          {hasContinue && (
            <button
              onClick={onContinue}
              className="w-full py-3 px-6 text-white font-bold rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 border"
              style={{
                background: 'linear-gradient(135deg, #1a4a1a 0%, #2d6a2d 50%, #1a4a1a 100%)',
                borderColor: 'rgba(50,150,50,0.4)',
                boxShadow: '0 0 20px rgba(50,150,50,0.15), 0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              <RotateCcw size={18} />
              继续第 {saveData!.lastPlayedWave} 波
            </button>
          )}
        </div>

        {saveData && (
          <div
            className="mt-8 rounded-lg p-4 max-w-xs mx-auto border"
            style={{
              background: 'linear-gradient(135deg, rgba(15,15,10,0.9), rgba(25,20,10,0.9))',
              borderColor: 'rgba(200,150,50,0.2)',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
            }}
          >
            <h3
              className="font-bold mb-3 flex items-center justify-center gap-2 text-sm"
              style={{ color: '#daa520' }}
            >
              <Trophy size={16} />
              战绩统计
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-left">
                <div className="text-gray-500 text-xs">最高波次</div>
                <div className="text-white font-bold text-lg">{saveData.highestWave}</div>
              </div>
              <div className="text-left">
                <div className="text-gray-500 text-xs">最高分</div>
                <div className="text-white font-bold text-lg" style={{ color: '#daa520' }}>{saveData.bestScore}</div>
              </div>
              <div className="text-left">
                <div className="text-gray-500 text-xs">总射击数</div>
                <div className="text-gray-300 font-bold">{saveData.totalShots}</div>
              </div>
              <div className="text-left">
                <div className="text-gray-500 text-xs">总爆头</div>
                <div className="text-gray-300 font-bold">{saveData.totalHeadshots}</div>
              </div>
              <div className="col-span-2 text-left pt-2 border-t border-gray-800">
                <div className="text-gray-500 text-xs flex items-center gap-1">
                  <Target size={12} />
                  爆头命中率
                </div>
                <div className="font-bold text-lg" style={{ color: '#4ade80' }}>
                  {Math.round((saveData.headshotAccuracy || 0) * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-gray-600 text-xs max-w-md mx-auto space-y-1.5 tracking-wide">
          <p>🎯 点击僵尸射击 · 💀 爆头伤害翻倍</p>
          <p>🔫 弹匣8发 · 打空后换弹2秒 · ❤️ 3条生命</p>
          <p>守住10波进攻即为胜利</p>
        </div>
      </div>
    </div>
  );
}
