import { Trophy, Skull, Target, RotateCcw, Home } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

interface GameOverScreenProps {
  isVictory: boolean;
  onRestart: () => void;
  onMainMenu: () => void;
}

export default function GameOverScreen({ isVictory, onRestart, onMainMenu }: GameOverScreenProps) {
  const { score, headshots, totalShots, currentWave } = useGameStore();

  const headshotRate = totalShots > 0 ? Math.round((headshots / totalShots) * 100) : 0;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="text-center px-6">
        {isVictory ? (
          <>
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <Trophy
                  size={100}
                  style={{ color: '#daa520', filter: 'drop-shadow(0 0 25px rgba(218,165,32,0.5))' }}
                />
                <div className="absolute inset-0" style={{ animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite' }}>
                  <Trophy size={100} style={{ color: '#daa520', opacity: 0.3 }} />
                </div>
              </div>
            </div>
            <h2
              className="text-6xl font-black tracking-wider mb-2"
              style={{
                background: 'linear-gradient(180deg, #ffd700 0%, #daa520 50%, #b8860b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(218,165,32,0.4))',
              }}
            >
              胜利!
            </h2>
            <p className="text-gray-400 text-lg mb-8">你成功守住了所有波次的进攻!</p>
          </>
        ) : (
          <>
            <div className="mb-6 flex justify-center">
              <Skull
                size={100}
                style={{ color: '#e63946', filter: 'drop-shadow(0 0 25px rgba(230,57,70,0.5))' }}
              />
            </div>
            <h2
              className="text-6xl font-black tracking-wider mb-2"
              style={{
                background: 'linear-gradient(180deg, #ff4444 0%, #cc0000 50%, #8b0000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(220,50,50,0.4))',
              }}
            >
              游戏结束
            </h2>
            <p className="text-gray-400 text-lg mb-8">你坚持到了第 {currentWave} 波</p>
          </>
        )}

        <div
          className="rounded-xl p-6 mb-8 max-w-sm mx-auto border"
          style={{
            background: 'linear-gradient(135deg, rgba(15,15,10,0.95), rgba(25,20,15,0.95))',
            borderColor: isVictory ? 'rgba(200,150,50,0.3)' : 'rgba(180,50,50,0.3)',
            boxShadow: `inset 0 0 30px rgba(0,0,0,0.3), 0 0 15px ${isVictory ? 'rgba(200,150,50,0.1)' : 'rgba(180,50,50,0.1)'}`,
          }}
        >
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-gray-500 text-xs mb-1">最终得分</div>
              <div className="text-3xl font-bold font-mono" style={{ color: '#daa520' }}>{score}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">到达波次</div>
              <div className="text-3xl font-bold" style={{ color: '#4ade80' }}>{currentWave}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">总射击数</div>
              <div className="text-2xl font-bold text-gray-300">{totalShots}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">爆头数</div>
              <div className="text-2xl font-bold" style={{ color: '#e63946' }}>{headshots}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-center gap-2">
              <Target size={16} style={{ color: '#4ade80' }} />
              <span className="text-gray-400 text-sm">爆头命中率</span>
              <span className="font-bold text-xl" style={{ color: '#4ade80' }}>{headshotRate}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-w-xs mx-auto">
          <button
            onClick={onRestart}
            className="w-full py-3 px-6 font-bold rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 border"
            style={{
              background: isVictory
                ? 'linear-gradient(135deg, #8b6914 0%, #b8860b 50%, #8b6914 100%)'
                : 'linear-gradient(135deg, #8b0000 0%, #cc0000 50%, #8b0000 100%)',
              borderColor: isVictory ? 'rgba(200,150,50,0.4)' : 'rgba(220,50,50,0.4)',
              color: isVictory ? '#1a1a0a' : '#fff',
              boxShadow: `0 0 20px ${isVictory ? 'rgba(200,150,50,0.2)' : 'rgba(220,50,50,0.2)'}, 0 4px 12px rgba(0,0,0,0.4)`,
            }}
          >
            <RotateCcw size={18} />
            再来一局
          </button>
          <button
            onClick={onMainMenu}
            className="w-full py-3 px-6 text-gray-300 font-bold rounded-lg transition-all flex items-center justify-center gap-2 border"
            style={{
              background: 'rgba(30,30,30,0.9)',
              borderColor: 'rgba(100,100,100,0.3)',
            }}
          >
            <Home size={18} />
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  );
}
