interface WaveNoticeProps {
  text: string;
}

export default function WaveNotice({ text }: WaveNoticeProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
      <div className="text-center">
        <div
          className="text-7xl font-black tracking-wider"
          style={{
            background: 'linear-gradient(180deg, #ff4444 0%, #cc0000 40%, #880000 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 20px rgba(220,50,50,0.6)) drop-shadow(0 0 40px rgba(220,50,50,0.3))',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          {text}
        </div>
        <div
          className="text-gray-300 text-xl mt-3 tracking-[0.5em] font-bold"
          style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}
        >
          准备战斗
        </div>
      </div>
    </div>
  );
}
