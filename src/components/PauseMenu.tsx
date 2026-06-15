import { Play, RotateCcw, Home, Pause } from 'lucide-react';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export default function PauseMenu({ onResume, onRestart, onMainMenu }: PauseMenuProps) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div className="text-center px-6">
        <div className="mb-6 flex justify-center">
          <div
            className="rounded-full p-6 border-2"
            style={{
              background: 'rgba(20,20,15,0.9)',
              borderColor: 'rgba(200,150,50,0.5)',
              boxShadow: '0 0 20px rgba(200,150,50,0.15)',
            }}
          >
            <Pause size={48} style={{ color: '#daa520' }} />
          </div>
        </div>

        <h2
          className="text-4xl font-black text-white mb-8 tracking-wider"
          style={{ textShadow: '0 0 10px rgba(255,255,255,0.2)' }}
        >
          游戏暂停
        </h2>

        <div className="space-y-3 max-w-xs mx-auto">
          <button
            onClick={onResume}
            className="w-full py-3 px-6 text-white font-bold rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 border"
            style={{
              background: 'linear-gradient(135deg, #1a4a1a 0%, #2d6a2d 50%, #1a4a1a 100%)',
              borderColor: 'rgba(50,150,50,0.4)',
              boxShadow: '0 0 15px rgba(50,150,50,0.15), 0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <Play size={18} fill="currentColor" />
            继续游戏
          </button>
          <button
            onClick={onRestart}
            className="w-full py-3 px-6 text-white font-bold rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 border"
            style={{
              background: 'linear-gradient(135deg, #6b4c14 0%, #8b6914 50%, #6b4c14 100%)',
              borderColor: 'rgba(200,150,50,0.4)',
              boxShadow: '0 0 15px rgba(200,150,50,0.1), 0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <RotateCcw size={18} />
            重新开始
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
