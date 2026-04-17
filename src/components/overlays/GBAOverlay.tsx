import React from 'react';
import { ArrowBigUp, ArrowBigDown, ArrowBigLeft, ArrowBigRight } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { DialogueBox } from '../ui/DialogueBox';
import { GameState } from '../../types';

interface GBAOverlayProps {
  children: React.ReactNode;
  gameState: GameState;
  handleInteraction: () => void;
  keysPressed: React.RefObject<Set<string>>;
}

export const GBAOverlay = ({ children, gameState, handleInteraction, keysPressed }: GBAOverlayProps) => {
  return (
    <div className="relative w-[85vw] max-w-[1100px] aspect-[1.8/1] bg-[#634fb1] rounded-[60px] shadow-[20px_20px_0px_rgba(0,0,0,0.3),inset_-4px_-4px_12px_rgba(0,0,0,0.3),inset_4px_4px_12px_rgba(255,255,255,0.4)] border-4 border-[#4d3b8f] flex items-center p-4 transition-all duration-700">
      {/* L/R Shoulders */}
      <div className="absolute top-[-10px] left-[10%] w-[20%] h-8 bg-[#8d80c9] rounded-t-3xl border-x-4 border-t-4 border-black/20 shadow-lg" />
      <div className="absolute top-[-10px] right-[10%] w-[20%] h-8 bg-[#8d80c9] rounded-t-3xl border-x-4 border-t-4 border-black/20 shadow-lg" />

      {/* Left Control Column */}
      <div className="w-[18%] h-full flex flex-col items-center justify-center gap-[10%] z-10 shrink-0">
        <div className="relative w-[80%] aspect-square flex items-center justify-center">
          <div className="absolute w-full h-[30%] bg-[#2d2d2d] rounded shadow-md" />
          <div className="absolute w-[30%] h-full bg-[#2d2d2d] rounded shadow-md" />
          <button className="absolute top-0 w-[30%] h-[35%] hover:bg-black active:translate-y-0.5 transition-all text-white/30 flex items-center justify-center" onPointerDown={() => keysPressed.current?.add('w')} onPointerUp={() => keysPressed.current?.delete('w')}><ArrowBigUp className="w-[60%] h-[60%]" /></button>
          <button className="absolute bottom-0 w-[30%] h-[35%] hover:bg-black active:-translate-y-0.5 transition-all text-white/30 flex items-center justify-center" onPointerDown={() => keysPressed.current?.add('s')} onPointerUp={() => keysPressed.current?.delete('s')}><ArrowBigDown className="w-[60%] h-[60%]" /></button>
          <button className="absolute left-0 w-[35%] h-[30%] hover:bg-black active:translate-x-0.5 transition-all text-white/30 flex items-center justify-center" onPointerDown={() => keysPressed.current?.add('a')} onPointerUp={() => keysPressed.current?.delete('a')}><ArrowBigLeft className="w-[60%] h-[60%]" /></button>
          <button className="absolute right-0 w-[35%] h-[30%] hover:bg-black active:-translate-x-0.5 transition-all text-white/30 flex items-center justify-center" onPointerDown={() => keysPressed.current?.add('d')} onPointerUp={() => keysPressed.current?.delete('d')}><ArrowBigRight className="w-[60%] h-[60%]" /></button>
        </div>
      </div>

      {/* Hub Screen GBA */}
      <div className="flex-1 h-full py-6 md:py-10 flex items-center justify-center px-2">
        <div className="w-full aspect-[3/2] bg-[#222] rounded-xl p-4 md:p-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border-y-8 border-black/20 flex items-center justify-center relative overflow-hidden ring-4 ring-black/10">
          <div className="w-full h-full bg-black relative shadow-inner">
            {children}
            <AnimatePresence>
              {gameState.isTalking && gameState.activeDialogue && (
                <DialogueBox gameState={gameState} fontSize="text-xs" />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Control Column */}
      <div className="w-[18%] h-full flex flex-col items-center justify-center relative z-10 shrink-0 pr-[2%]">
        <div className="flex gap-[10%] rotate-[-15deg] translate-y-[-55%] w-[85%]">
          <div className="flex flex-col items-center gap-[0.5vw] translate-y-[25%] translate-x-[-15%]">
            <button onPointerDown={handleInteraction} className="w-[4.2vw] h-[4.2vw] rounded-full bg-[#3d3d3d] shadow-[0.3vw_0.3vw_0px_rgba(0,0,0,0.3),inset_-0.2vw_-0.2vw_0.4vw_rgba(0,0,0,0.4)] active:translate-y-[0.2vw] active:shadow-none transition-all flex items-center justify-center text-white/40 font-bold text-[1.8vw] border-[0.15vw] border-white/5">B</button>
          </div>
          <div className="flex flex-col items-center gap-[0.5vw] -translate-y-[15%] translate-x-[-5%]">
            <button onPointerDown={handleInteraction} className="w-[4.2vw] h-[4.2vw] rounded-full bg-[#3d3d3d] shadow-[0.3vw_0.3vw_0px_rgba(0,0,0,0.3),inset_-0.2vw_-0.2vw_0.4vw_rgba(0,0,0,0.4)] active:translate-y-[0.2vw] active:shadow-none transition-all flex items-center justify-center text-white/40 font-bold text-[1.8vw] border-[0.15vw] border-white/5">A</button>
          </div>
        </div>
        
        <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 flex gap-[1.5vw]">
          <div className="flex flex-col items-center gap-[0.4vw]">
            <div className="w-[3.5vw] h-[0.8vw] bg-[#333] rounded-full shadow-md active:translate-y-[0.1vw] cursor-pointer border border-white/5" />
            <p className="text-[0.6vw] text-white/40 font-bold">SELECT</p>
          </div>
          <div className="flex flex-col items-center gap-[0.4vw]">
            <div className="w-[3.5vw] h-[0.8vw] bg-[#333] rounded-full shadow-md active:translate-y-[0.1vw] cursor-pointer border border-white/5" />
            <p className="text-[0.6vw] text-white/40 font-bold">START</p>
          </div>
        </div>
      </div>
      
      {/* GBA Logo text */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/10 text-[6px] md:text-[8px] italic font-bold tracking-[8px] md:tracking-[12px] uppercase">Game Boy Advance</p>
    </div>
  );
};
