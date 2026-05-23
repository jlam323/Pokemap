import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface BattleControlsProps {
  battleLog: string[];
  isProcessing: boolean;
  isBattleEnding: boolean;
  activeMenu: 'MAIN' | 'ATTACK';
  selectedIndex: number;
  playerMoves: string[];
  setActiveMenu: (menu: 'MAIN' | 'ATTACK') => void;
  setSelectedIndex: (index: number) => void;
  onThrowPokeball: () => void;
  onRun: () => void;
  onAttack: (move: string) => void;
}

export const BattleControls = ({
  battleLog,
  isProcessing,
  isBattleEnding,
  activeMenu,
  selectedIndex,
  playerMoves,
  setActiveMenu,
  setSelectedIndex,
  onThrowPokeball,
  onRun,
  onAttack,
}: BattleControlsProps) => {
  return (
    <div className="h-[30%] bg-[#4c566a] border-t-4 border-black flex p-2 gap-2" id="battle-controls-root">
      
      {/* Battle Log Box */}
      <div 
        className="flex-[1.5] bg-[#eceff4] border-2 border-black p-2 overflow-y-auto scrollbar-hide" 
        id="battle-log-viewport"
      >
        <AnimatePresence mode="popLayout">
          {battleLog.slice(-3).map((log, i) => (
            <motion.p 
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[8px] md:text-[12px] font-bold text-black/80 mb-1 leading-tight"
            >
              {log}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>

      {/* Menu / Option Buttons Grid */}
      <div 
        className={`flex-1 grid grid-cols-2 gap-1 ${
          isProcessing || isBattleEnding ? 'opacity-50 pointer-events-none' : ''
        }`}
        id="battle-action-grid"
      >
        {activeMenu === 'MAIN' ? (
          <>
            <button 
              id="btn-fight"
              onClick={() => { setActiveMenu('ATTACK'); setSelectedIndex(0); }}
              className={`border-2 border-black flex flex-col items-center justify-center p-1 active:scale-95 transition-all group ${
                selectedIndex === 0 ? 'bg-yellow-100 ring-2 ring-black ring-inset' : 'bg-white'
              }`}
            >
              <span className="font-black text-[10px] md:text-[14px]">FIGHT</span>
            </button>
            
            <button 
              id="btn-bag"
              onClick={onThrowPokeball}
              className={`border-2 border-black flex flex-col items-center justify-center p-1 active:scale-95 transition-all relative ${
                selectedIndex === 1 ? 'bg-yellow-100 ring-2 ring-black ring-inset' : 'bg-white'
              }`}
            >
              <span className="font-black text-[10px] md:text-[14px]">BAG</span>
              <span className="font-black text-[6px] md:text-[9px] absolute bottom-0.5 opacity-60 uppercase">
                (Pokeball)
              </span>
            </button>
            
            <button 
              id="btn-pkmn"
              className={`bg-white border-2 border-black opacity-40 flex flex-col items-center justify-center p-1 transition-all ${
                selectedIndex === 2 ? 'ring-2 ring-black ring-inset !opacity-100 bg-gray-50' : ''
              }`}
              disabled
            >
              <span className="font-black text-[10px] md:text-[14px]">PKMN</span>
            </button>
            
            <button 
              id="btn-run"
              onClick={onRun}
              className={`border-2 border-black flex flex-col items-center justify-center p-1 active:scale-95 transition-all ${
                selectedIndex === 3 ? 'bg-yellow-100 ring-2 ring-black ring-inset' : 'bg-white'
              }`}
            >
              <span className="font-black text-[10px] md:text-[14px]">RUN</span>
            </button>
          </>
        ) : (
          <>
            {playerMoves.map((move, i) => (
              <button 
                key={move}
                id={`btn-move-${i}`}
                onClick={() => onAttack(move)}
                className={`border-2 border-black flex flex-col items-center justify-center p-1 active:scale-95 transition-all text-[8px] md:text-[12px] font-black uppercase ${
                  selectedIndex === i ? 'bg-yellow-100 ring-2 ring-black ring-inset' : 'bg-white'
                }`}
              >
                {move}
              </button>
            ))}
            
            <button 
              id="btn-move-back"
              onClick={() => { setActiveMenu('MAIN'); setSelectedIndex(0); }}
              className={`border-2 border-black flex flex-col items-center justify-center p-1 active:scale-95 transition-all text-[8px] md:text-[12px] font-black ${
                selectedIndex === 3 ? 'bg-yellow-100 ring-2 ring-black ring-inset' : 'bg-white'
              }`}
            >
              BACK
            </button>
          </>
        )}
      </div>
    </div>
  );
};
