import React from 'react';
import { ArrowBigUp, ArrowBigDown, ArrowBigLeft, ArrowBigRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DialogueBox } from '../ui/DialogueBox';
import { GameState } from '../../types';

interface GBCOverlayProps {
  children: React.ReactNode;
  gameState: GameState;
  handleInteraction: () => void;
  keysPressed: React.RefObject<Set<string>>;
}

// GAMEBOY COLOR OVERLAY
export const GBCOverlay = ({ children, gameState, handleInteraction, keysPressed }: GBCOverlayProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { scale: 0, opacity: 0 },
    show: { 
      scale: 1, 
      opacity: 1,
      transition: { type: 'spring', damping: 12, stiffness: 200 }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="relative h-[85vh] max-h-[1000px] aspect-[1/1.75] bg-[#D8D8CF] rounded-[30px] shadow-[20px_20px_0px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(0,0,0,0.2),inset_4px_4px_8px_rgba(255,255,255,0.5)] border-4 border-[#C0C0C0] flex flex-col items-center p-[8%] transition-all duration-700"
    >
      {/* Screen Bezel GBC */}
      <div className="w-full aspect-square bg-[#333] rounded-lg p-4 md:p-6 shadow-inner border-b-8 border-black/10 flex items-center justify-center relative overflow-hidden">
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_8px_red] animate-pulse" />
        </div>
        <div className="w-full h-full bg-black relative">
          {children}
          <AnimatePresence>
            {gameState.isTalking && gameState.activeDialogue && (
              <DialogueBox gameState={gameState} fontSize="text-[1.2vh]" className="pl-[2.5vh] pr-[4vh] pt-[1.5vh] pb-[1.75vh]" />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* GBC Controls */}
      <div className="flex-1 w-full relative">
        <div className="relative w-full h-full">
          {/* D-PAD */}
          <motion.div variants={itemVariants} className="absolute left-[10%] top-[15%] w-[11vh] h-[11vh] flex items-center justify-center">
            <div className="absolute w-full h-[32%] bg-[#333] rounded-sm shadow-lg border border-black/20" />
            <div className="absolute w-[32%] h-full bg-[#333] rounded-sm shadow-lg border border-black/20" />
            <div className="absolute w-[32%] h-[32%] bg-[#222]" />
            <button 
              className="absolute top-0 w-[32%] h-[34%] rounded-t-sm hover:bg-black active:-translate-y-0.5 transition-all text-white/10 flex items-center justify-center outline-none" 
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('w'); }} 
              onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('w'); }}
              onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('w'); }}
            >
              <ArrowBigUp className="w-[60%] h-[60%]" />
            </button>
            <button 
              className="absolute bottom-0 w-[32%] h-[34%] rounded-b-sm hover:bg-black active:translate-y-0.5 transition-all text-white/10 flex items-center justify-center outline-none" 
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('s'); }} 
              onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('s'); }}
              onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('s'); }}
            >
              <ArrowBigDown className="w-[60%] h-[60%]" />
            </button>
            <button 
              className="absolute left-0 w-[34%] h-[32%] rounded-l-sm hover:bg-black active:-translate-x-0.5 transition-all text-white/10 flex items-center justify-center outline-none" 
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('a'); }} 
              onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('a'); }}
              onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('a'); }}
            >
              <ArrowBigLeft className="w-[60%] h-[60%]" />
            </button>
            <button 
              className="absolute right-0 w-[34%] h-[32%] rounded-r-sm hover:bg-black active:translate-x-0.5 transition-all text-white/10 flex items-center justify-center outline-none" 
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('d'); }} 
              onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('d'); }}
              onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('d'); }}
            >
              <ArrowBigRight className="w-[60%] h-[60%]" />
            </button>
          </motion.div>

          {/* A / B Buttons */}
          <div className="absolute right-[7%] top-[20%] rotate-[-25deg] flex gap-[2vh]">
            <motion.div variants={itemVariants} className="flex flex-col items-center gap-[1vh] translate-y-[1.5vh]">
              <button 
                onPointerDown={(e) => { 
                  e.currentTarget.setPointerCapture(e.pointerId); 
                  keysPressed.current?.add(' ');
                  handleInteraction(); 
                }} 
                onPointerUp={(e) => {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  keysPressed.current?.delete(' ');
                }}
                onPointerCancel={(e) => {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  keysPressed.current?.delete(' ');
                }}
                className="w-[6vh] h-[6vh] rounded-full bg-[#8b1d44] shadow-[0.4vh_0.4vh_0px_rgba(0,0,0,0.2),inset_-0.2vh_-0.2vh_0.4vh_rgba(0,0,0,0.3)] active:translate-y-[0.2vh] active:shadow-none transition-all flex items-center justify-center text-white/20 font-bold text-[2vh] border-[0.2vh] border-white/5 outline-none"
              >
                B
              </button>
            </motion.div>
            <motion.div variants={itemVariants} className="flex flex-col items-center gap-[1vh] -translate-y-[0.8vh]">
              <button 
                onPointerDown={(e) => { 
                  e.currentTarget.setPointerCapture(e.pointerId); 
                  keysPressed.current?.add('enter');
                  handleInteraction(); 
                }} 
                onPointerUp={(e) => {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  keysPressed.current?.delete('enter');
                }}
                onPointerCancel={(e) => {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  keysPressed.current?.delete('enter');
                }}
                className="w-[6vh] h-[6vh] rounded-full bg-[#8b1d44] shadow-[0.4vh_0.4vh_0px_rgba(0,0,0,0.2),inset_-0.2vh_-0.2vh_0.4vh_rgba(0,0,0,0.3)] active:translate-y-[0.2vh] active:shadow-none transition-all flex items-center justify-center text-white/20 font-bold text-[2vh] border-[0.2vh] border-white/5 outline-none"
              >
                A
              </button>
            </motion.div>
          </div>

          {/* Menu Buttons */}
          <motion.div variants={itemVariants} className="absolute left-1/2 -translate-x-1/2 bottom-[10%] flex gap-[3vh]">
            <div className="flex flex-col items-center gap-[0.5vh]">
              <button 
                className="w-[5.5vh] h-[1.2vh] bg-[#999] rounded-full shadow-md active:translate-y-[0.1vh] cursor-pointer border border-black/10 outline-none" 
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('Backspace'); }}
                onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('Backspace'); }}
                onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('Backspace'); }}
              />
              <p className="text-[1vh] text-black/40 font-bold uppercase tracking-widest">SELECT</p>
            </div>
            <div className="flex flex-col items-center gap-[0.5vh]">
              <button 
                className="w-[5.5vh] h-[1.2vh] bg-[#999] rounded-full shadow-md active:translate-y-[0.1vh] cursor-pointer border border-black/10 outline-none" 
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('Enter'); }}
                onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('Enter'); }}
                onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('Enter'); }}
              />
              <p className="text-[1vh] text-black/40 font-bold uppercase tracking-widest">START</p>
            </div>
          </motion.div>

          {/* Decorative Speaker Grill */}
          <motion.div 
            variants={itemVariants} 
            className="absolute right-[2%] bottom-[3%] w-[8vh] h-[8vh] grid grid-cols-6 gap-[0.5vh] items-center justify-items-center opacity-20 z-10 rounded-full overflow-hidden p-1"
          >
            {[...Array(36)].map((_, i) => (
              <div key={i} className="w-[0.5vh] h-[0.5vh] bg-black rounded-full" />
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
