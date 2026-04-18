import React from 'react';
import { ArrowBigUp, ArrowBigDown, ArrowBigLeft, ArrowBigRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DialogueBox } from '../ui/DialogueBox';
import { GameState } from '../../types';

interface GBAOverlayProps {
  children: React.ReactNode;
  gameState: GameState;
  handleInteraction: () => void;
  keysPressed: React.RefObject<Set<string>>;
}

// GAMEBOY ADVANCE OVERLAY
export const GBAOverlay = ({ children, gameState, handleInteraction, keysPressed }: GBAOverlayProps) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
        duration: 0.6,
        ease: "easeOut"
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
      className="relative w-[90vw] max-w-[1100px] aspect-[1.7/1] flex items-center justify-center p-4"
      style={{
        filter: 'drop-shadow(20px 20px 0px rgba(0,0,0,0.2))'
      }}
    >
      {/* SVG Clip Path Definition (Hidden) */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="gba-clip" clipPathUnits="objectBoundingBox">
            <path d="M0.875 0.045C0.895 0.075 0.94 0.04 0.975 0.1C0.99 0.145 0.985 0.23 0.99 0.3L1 0.72C1 0.785 0.975 0.845 0.945 0.855C0.92 0.865 0.895 0.875 0.875 0.9C0.855 0.925 0.83 0.94 0.8 0.94C0.6 0.985 0.4 0.985 0.2 0.94C0.18 0.935 0.165 0.935 0.125 0.9C0.1 0.875 0.08 0.865 0.055 0.855C0.025 0.845 0.005 0.805 0.005 0.73L0.01 0.3C0.01 0.21 0.005 0.16 0.02 0.11C0.05 0.055 0.09 0.085 0.12 0.05C0.15 0 0.18 0 0.2 0H0.8C0.82 0 0.85 0 0.875 0.045Z" />
          </clipPath>
        </defs>
      </svg>

      {/* L Shoulder Notch */}
      <motion.div 
        variants={itemVariants} 
        className="absolute top-[2.5%] left-[2.5%] w-[16%] h-[20%] bg-[#8d80c9] rounded-t-[40px] border-x-4 border-t-2 border-black/10 shadow-[inset_0_4px_8px_rgba(255,255,255,0.2)] z-0 flex items-start justify-start pl-8 pt-1"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          keysPressed.current?.add('l');
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          keysPressed.current?.delete('l');
        }}
        onPointerCancel={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          keysPressed.current?.delete('l');
        }}
      >
        <span className="text-white/40 text-[10px] font-black">L</span>
      </motion.div>

      {/* R Shoulder Notch */}
      <motion.div 
        variants={itemVariants} 
        className="absolute top-[2.5%] right-[2.5%] w-[16%] h-[20%] bg-[#8d80c9] rounded-t-[40px] border-x-4 border-t-2 border-black/10 shadow-[inset_0_4px_8px_rgba(255,255,255,0.2)] z-0 flex items-start justify-end pr-8 pt-1"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          keysPressed.current?.add('r');
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          keysPressed.current?.delete('r');
        }}
        onPointerCancel={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          keysPressed.current?.delete('r');
        }}
      >
        <span className="text-white/40 text-[10px] font-black">R</span>
      </motion.div>

      {/* Main GBA Body with Notches */}
      <div 
        className="absolute inset-0 bg-[#634fb1] border-4 border-[#4d3b8f] shadow-[inset_-4px_-4px_12px_rgba(0,0,0,0.3),inset_4px_4px_12px_rgba(255,255,255,0.4)] transition-all duration-700 z-1  translate-x-[%]"
        style={{
          clipPath: 'url(#gba-clip)',
        }}
      >
        {/* Hardware Shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Left Control Column */}
      <div className="w-[20%] h-full flex flex-col items-center justify-center gap-[10%] z-10 shrink-0">
        <motion.div variants={itemVariants} className="relative w-[12vh] h-[12vh] aspect-square flex items-center justify-center ">
          <div className="absolute w-full h-[30%] bg-[#2d2d2d] rounded-sm shadow-md" />
          <div className="absolute w-[30%] h-full bg-[#2d2d2d] rounded-sm shadow-md" />
          <button 
            className="absolute top-0 w-[32%] h-[35%] rounded-sm hover:bg-black active:-translate-y-0.5 transition-all text-white/30 flex items-center justify-center outline-none" 
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('w'); }} 
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('w'); }}
            onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('w'); }}
          >
            <ArrowBigUp className="w-[70%] h-[70%]" />
          </button>
          <button 
            className="absolute bottom-0 w-[32%] h-[35%] rounded-sm hover:bg-black active:translate-y-0.5 transition-all text-white/30 flex items-center justify-center outline-none" 
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('s'); }} 
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('s'); }}
            onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('s'); }}
          >
            <ArrowBigDown className="w-[70%] h-[70%]" />
          </button>
          <button 
            className="absolute left-0 w-[35%] h-[32%] rounded-sm hover:bg-black active:-translate-x-0.5 transition-all text-white/30 flex items-center justify-center outline-none" 
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('a'); }} 
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('a'); }}
            onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('a'); }}
          >
            <ArrowBigLeft className="w-[70%] h-[70%]" />
          </button>
          <button 
            className="absolute right-0 w-[35%] h-[32%] rounded-sm hover:bg-black active:translate-x-0.5 transition-all text-white/30 flex items-center justify-center outline-none" 
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('d'); }} 
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('d'); }}
            onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('d'); }}
          >
            <ArrowBigRight className="w-[70%] h-[70%]" />
          </button>
          <div className="absolute w-[18%] h-[18%] bg-[#1a1a1a] rounded-full" />
        </motion.div>

        {/* Start / Select Buttons */}
        <div className="flex flex-col gap-3 rotate-[20deg] mt-6 translate-x-5">
          <motion.div 
            variants={itemVariants}
            className="w-30 h-8 bg-[#3d3d3d] rounded-full border border-white/5 flex items-center px-1 relative"
          >
            <span className="text-[10px] text-white/30 font-black tracking-widest ml-1 select-none pointer-events-none">SELECT</span>
            <button 
              className="absolute right-1 w-5 h-5 rounded-full bg-[#C4C4C4] shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.5)] active:translate-y-[1px] active:scale-95 active:shadow-none transition-all cursor-pointer outline-none border-none"
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('Backspace'); }}
              onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('Backspace'); }}
              onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('Backspace'); }}
              aria-label="Select"
            />
          </motion.div>
          <motion.div 
            variants={itemVariants}
            className="w-30 h-8 bg-[#3d3d3d] rounded-full border border-white/5 flex items-center px-1 relative translate-x-[10%]"
          >
            <span className="text-[10px] text-white/30 font-black tracking-widest ml-1 select-none pointer-events-none">START</span>
            <button 
              className="absolute right-1 w-5 h-5 rounded-full bg-[#C4C4C4] shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.5)] active:translate-y-[1px] active:scale-95 active:shadow-none transition-all cursor-pointer outline-none border-none"
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('Enter'); }}
              onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('Enter'); }}
              onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('Enter'); }}
              aria-label="Start"
            />
          </motion.div>
        </div>
      </div>

      {/* Hub Screen GBA */}
      <div className="flex-1 h-full py-6 md:py-10 flex items-center justify-center px-2 z-10 mt-[-6%]">
        <div className="w-full aspect-[3/2] bg-[#222] rounded-xl p-4 md:p-6 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] border-y-8 border-black/30 flex items-center justify-center relative overflow-hidden ring-4 ring-black/20">
          <div className="w-full h-full bg-black relative shadow-inner">
            {children}
            <AnimatePresence mode="wait">
              {gameState.isTalking && gameState.activeDialogue && (
                <DialogueBox gameState={gameState} fontSize="text-xs" />
              )}
            </AnimatePresence>
          </div>
          {/* Subtle screen shine */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent opacity-30" />
        </div>
      </div>

      {/* Right Control Column */}
      <div className="w-[20%] h-full flex flex-col items-center justify-center relative z-10 shrink-0 mt-[-13%]">
        <div className="flex gap-[12%] rotate-[-15deg] translate-y-[-40%] w-[90%]">
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-[0.5vw] translate-y-[30%]">
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
              className="w-[4vw] h-[4vw] rounded-full bg-[#3d3d3d] shadow-[0.3vw_0.3vw_0px_rgba(0,0,0,0.4),inset_-0.2vw_-0.2vw_0.6vw_rgba(0,0,0,0.5)] active:translate-y-[0.3vw] active:shadow-none transition-all flex items-center justify-center text-white/50 font-black text-[2vw] border-[0.2vw] border-white/5 outline-none"
            >
              B
            </button>
          </motion.div>
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-[0.5vw] -translate-y-[10%]">
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
              className="w-[4vw] h-[4vw] rounded-full bg-[#3d3d3d] shadow-[0.3vw_0.3vw_0px_rgba(0,0,0,0.4),inset_-0.2vw_-0.2vw_0.6vw_rgba(0,0,0,0.5)] active:translate-y-[0.3vw] active:shadow-none transition-all flex items-center justify-center text-white/50 font-black text-[2vw] border-[0.2vw] border-white/5 outline-none"
            >
              A
            </button>
          </motion.div>
        </div>
      </div>
      
      {/* GBA Logo text */}
      <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10 opacity-60">
        <motion.p variants={itemVariants} className="text-white text-[14px] md:text-[18px] italic font-black tracking-[15px] md:tracking-[22px] uppercase">GameBoy</motion.p>
        <div className="w-20 h-[1.5px] bg-white opacity-30" />
        <motion.p variants={itemVariants} className="text-white text-[8px] md:text-[12px] font-bold tracking-[6px] md:tracking-[12px] uppercase">Advance</motion.p>
      </div>

      {/* Speaker Grille */}
      <motion.div variants={itemVariants} className="absolute bottom-[23%] right-[9%] flex gap-[0.4vh] rotate-[90deg] opacity-20 group-hover:opacity-40 transition-opacity z-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-[0.8vh] h-[11vh] bg-black rounded-full skew-x-[15deg]" />
        ))}
      </motion.div>

      {/* Decorative Speaker Grill */}
      <div className="absolute right-[4%] bottom-[15%] grid grid-cols-3 gap-1 z-10 opacity-20">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="w-1 h-1 bg-black rounded-full" />
        ))}
      </div>
    </motion.div>
  );
};
