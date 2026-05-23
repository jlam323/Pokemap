import React from 'react';
import { motion } from 'motion/react';

interface BattleStatusProps {
  name: string;
  hp: number;
  level?: number;
  isPlayer?: boolean;
  overlayMode: 'none' | 'gbc' | 'gba';
}

export const BattleStatus = ({
  name,
  hp,
  level = 100,
  isPlayer = false,
  overlayMode,
}: BattleStatusProps) => {
  const containerClass = isPlayer
    ? `absolute right-[5%] w-[40%] z-20 ${
        overlayMode === 'none' ? 'bottom-[12%] md:bottom-[10%]' : 'bottom-[10%]'
      }`
    : `absolute left-[5%] w-[40%] z-20 ${
        overlayMode === 'none' ? 'top-[15%] md:top-[10%]' : 'top-[10%]'
      }`;

  const hpColorClass = hp > 50 ? 'bg-green-400' : hp > 20 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div className={containerClass} id={isPlayer ? "battle-status-player" : "battle-status-opponent"}>
      <div className="bg-white border-2 border-black p-2 w-full shadow-[4px_4px_0px_rgba(0,0,0,0.1)] rounded-sm">
        <div className="flex justify-between items-center mb-1">
          <span className="font-black text-[10px] md:text-[14px] uppercase tracking-tighter">
            {name}
          </span>
          <span className="font-bold text-[8px] md:text-[12px]">Lv {level}</span>
        </div>
        
        <div className="h-1.5 md:h-2 bg-gray-200 border border-black rounded-full overflow-hidden relative mb-1">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${hp}%` }}
            className={`h-full ${hpColorClass}`}
          />
        </div>

        {isPlayer && (
          <div className="flex justify-end font-bold text-[8px] md:text-[12px]">
            {hp}/100
          </div>
        )}
      </div>
    </div>
  );
};
