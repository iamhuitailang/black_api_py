import { DamageNumber } from '@/types/game';

interface DamageNumbersProps {
  numbers: DamageNumber[];
}

export default function DamageNumbers({ numbers }: DamageNumbersProps) {
  return (
    <>
      {numbers.map((dmg) => (
        <div
          key={dmg.id}
          className={`absolute pointer-events-none font-bold ${
            dmg.isHeadshot ? 'text-green-400 text-3xl' : 'text-yellow-400 text-xl'
          }`}
          style={{
            left: dmg.x,
            top: dmg.y,
            opacity: dmg.life,
            transform: 'translate(-50%, -50%)',
            fontFamily: '"Press Start 2P", monospace',
            textShadow: dmg.isHeadshot
              ? '0 0 10px rgba(74, 222, 128, 0.8), 0 0 20px rgba(74, 222, 128, 0.4), 2px 2px 4px rgba(0,0,0,0.8)'
              : '2px 2px 4px rgba(0,0,0,0.8)',
          }}
        >
          {dmg.isHeadshot && '💀 '}
          +{dmg.value}
        </div>
      ))}
    </>
  );
}
