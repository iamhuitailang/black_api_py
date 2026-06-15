import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface CrosshairRef {
  setPosition: (x: number, y: number) => void;
  show: () => void;
  hide: () => void;
}

const Crosshair = forwardRef<CrosshairRef>(function Crosshair(_props, ref) {
  const crosshairRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    setPosition: (x: number, y: number) => {
      if (crosshairRef.current) {
        crosshairRef.current.style.left = `${x}px`;
        crosshairRef.current.style.top = `${y}px`;
      }
    },
    show: () => {
      if (crosshairRef.current) {
        crosshairRef.current.style.display = 'block';
      }
    },
    hide: () => {
      if (crosshairRef.current) {
        crosshairRef.current.style.display = 'none';
      }
    },
  }));

  return (
    <div
      ref={crosshairRef}
      className="absolute pointer-events-none"
      style={{
        left: '-100px',
        top: '-100px',
        transform: 'translate(-50%, -50%)',
        display: 'none',
        zIndex: 60,
      }}
    >
      <div className="relative" style={{ width: '48px', height: '48px' }}>
        <div
          className="absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, transparent 30%, rgba(239,68,68,0.4) 35%, rgba(239,68,68,0.9) 45%, rgba(239,68,68,1) 48%, rgba(239,68,68,0.9) 55%, rgba(239,68,68,0.4) 65%, transparent 70%, transparent 100%)',
            boxShadow: '0 0 4px rgba(239,68,68,0.6)',
          }}
        />
        <div
          className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, transparent 30%, rgba(239,68,68,0.4) 35%, rgba(239,68,68,0.9) 45%, rgba(239,68,68,1) 48%, rgba(239,68,68,0.9) 55%, rgba(239,68,68,0.4) 65%, transparent 70%, transparent 100%)',
            boxShadow: '0 0 4px rgba(239,68,68,0.6)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4px] h-[4px] rounded-full bg-red-500"
          style={{ boxShadow: '0 0 8px rgba(239,68,68,1), 0 0 2px rgba(255,255,255,0.8)' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-red-500/30" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-red-500/15"
          style={{ borderWidth: '1px' }}
        />
      </div>
    </div>
  );
});

export default Crosshair;
