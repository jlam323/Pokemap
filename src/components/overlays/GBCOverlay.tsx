import React from 'react';
import { ArrowBigUp, ArrowBigDown, ArrowBigLeft, ArrowBigRight } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { DialogueBox } from '../ui/DialogueBox';
import { GameState } from '../../types';

interface GBCOverlayProps {
  children: React.ReactNode;
  gameState: GameState;
  handleInteraction: () => void;
  keysPressed: React.RefObject<Set<string>>;
}

export const GBCOverlay = ({ children, gameState, handleInteraction, keysPressed }: GBCOverlayProps) => {
  return (
    <div className="relative h-[85vh] max-h-[1000px] aspect-[1/1.75] bg-[#D8D8CF] rounded-[30px] shadow-[20px_20px_0px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(0,0,0,0.2),inset_4px_4px_8px_rgba(255,255,255,0.5)] border-4 border-[#C0C0C0] flex flex-col items-center p-[8%] transition-all duration-700">
      {/* Screen Bezel GBC */}
      <div className="w-full aspect-square bg-[#333] rounded-lg p-4 md:p-6 shadow-inner border-b-8 border-black/10 flex items-center justify-center relative overflow-hidden">
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_8px_red] animate-pulse" />
        </div>
        <div className="w-full h-full bg-black relative">
          {children}
          <AnimatePresence>
            {gameState.isTalking && gameState.activeDialogue && (
              <DialogueBox gameState={gameState} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* GBC Controls */}
      <div className="flex-1 w-full relative">
        <div className="relative w-full h-full">
          {/* D-PAD */}
          <div className="absolute left-[10%] top-[15%] w-[11vh] h-[11vh] flex items-center justify-center">
            <div className="absolute w-full h-[32%] bg-[#333] rounded-sm shadow-lg border border-black/20" />
            <div className="absolute w-[32%] h-full bg-[#333] rounded-sm shadow-lg border border-black/20" />
            <div className="absolute w-[32%] h-[32%] bg-[#222]" />
            <button className="absolute top-0 w-[32%] h-[32%] rounded-t-sm hover:bg-black active:translate-y-0.5 transition-all text-white/10 flex items-center justify-center" onPointerDown={() => keysPressed.current?.add('w')} onPointerUp={() => keysPressed.current?.delete('w')}><ArrowBigUp className="w-[60%] h-[60%]" /></button>
            <button className="absolute bottom-0 w-[32%] h-[32%] rounded-b-sm hover:bg-black active:-translate-y-0.5 transition-all text-white/10 flex items-center justify-center" onPointerDown={() => keysPressed.current?.add('s')} onPointerUp={() => keysPressed.current?.delete('s')}><ArrowBigDown className="w-[60%] h-[60%]" /></button>
            <button className="absolute left-0 w-[32%] h-[32%] rounded-l-sm hover:bg-black active:translate-x-0.5 transition-all text-white/10 flex items-center justify-center" onPointerDown={() => keysPressed.current?.add('a')} onPointerUp={() => keysPressed.current?.delete('a')}><ArrowBigLeft className="w-[60%] h-[60%]" /></button>
            <button className="absolute right-0 w-[32%] h-[32%] rounded-r-sm hover:bg-black active:-translate-x-0.5 transition-all text-white/10 flex items-center justify-center" onPointerDown={() => keysPressed.current?.add('d')} onPointerUp={() => keysPressed.current?.delete('d')}><ArrowBigRight className="w-[60%] h-[60%]" /></button>
          </div>

          {/* A / B Buttons */}
          <div className="absolute right-[7%] top-[20%] rotate-[-25deg] flex gap-[2vh]">
            <div className="flex flex-col items-center gap-[1vh] translate-y-[1.5vh]">
              <button onPointerDown={handleInteraction} className="w-[6vh] h-[6vh] rounded-full bg-[#8b1d44] shadow-[0.4vh_0.4vh_0px_rgba(0,0,0,0.2),inset_-0.2vh_-0.2vh_0.4vh_rgba(0,0,0,0.3)] active:translate-y-[0.2vh] active:shadow-none transition-all flex items-center justify-center text-white/20 font-bold text-[2vh] border-[0.2vh] border-white/5">B</button>
            </div>
            <div className="flex flex-col items-center gap-[1vh] -translate-y-[0.8vh]">
              <button onPointerDown={handleInteraction} className="w-[6vh] h-[6vh] rounded-full bg-[#8b1d44] shadow-[0.4vh_0.4vh_0px_rgba(0,0,0,0.2),inset_-0.2vh_-0.2vh_0.4vh_rgba(0,0,0,0.3)] active:translate-y-[0.2vh] active:shadow-none transition-all flex items-center justify-center text-white/20 font-bold text-[2vh] border-[0.2vh] border-white/5">A</button>
            </div>
          </div>

          {/* Menu Buttons */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[10%] flex gap-[3vh]">
            <div className="flex flex-col items-center gap-[0.5vh]">
              <div className="w-[5.5vh] h-[1.2vh] bg-[#999] rounded-full shadow-md active:translate-y-[0.1vh] cursor-pointer border border-black/10" />
              <p className="text-[1vh] text-black/40 font-bold uppercase tracking-widest">SELECT</p>
            </div>
            <div className="flex flex-col items-center gap-[0.5vh]">
              <div className="w-[5.5vh] h-[1.2vh] bg-[#999] rounded-full shadow-md active:translate-y-[0.1vh] cursor-pointer border border-black/10" />
              <p className="text-[1vh] text-black/40 font-bold uppercase tracking-widest">START</p>
            </div>
          </div>

          {/* Speaker Grille */}
          <div className="absolute bottom-[2%] right-[3%] flex gap-[0.6vh] rotate-[-35deg] opacity-20 group-hover:opacity-40 transition-opacity">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[0.8vh] h-[4.5vh] bg-black rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
