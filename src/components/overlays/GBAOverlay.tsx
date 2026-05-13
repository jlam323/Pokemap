import React from 'react';
import { ArrowBigUp, ArrowBigDown, ArrowBigLeft, ArrowBigRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DialogueBox } from '../ui/DialogueBox';
import { GameState } from '../../types';

interface GBAOverlayProps {
  children: React.ReactNode;
  gameState: GameState;
  keysPressed: React.RefObject<Set<string>>;
}

// GAMEBOY ADVANCE OVERLAY
export const GBAOverlay = ({ children, gameState, keysPressed }: GBAOverlayProps) => {
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
      className="relative w-[75vw] max-w-[1200px] aspect-[1.6/1] flex items-center justify-center p-4 transition-all duration-700 [container-type:inline-size]"
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
        className="absolute top-[2.5%] left-[2.5%] w-[16%] h-[20%] bg-[#8d80c9] rounded-t-[3.3cqw] border-x-[0.33cqw] border-t-[0.16cqw] border-black/10 shadow-[inset_0_0.33cqw_0.66cqw_rgba(255,255,255,0.2)] z-0 flex items-start justify-start pl-[1.66cqw] pt-[0.8cqw]"
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
        <span className="text-white/40 text-[1.5cqw] font-black">L</span>
      </motion.div>

      {/* R Shoulder Notch */}
      <motion.div 
        variants={itemVariants} 
        className="absolute top-[2.5%] right-[2.5%] w-[16%] h-[20%] bg-[#8d80c9] rounded-t-[3.3cqw] border-x-[0.33cqw] border-t-[0.16cqw] border-black/10 shadow-[inset_0_0.33cqw_0.66cqw_rgba(255,255,255,0.2)] z-0 flex items-start justify-end pr-[1.66cqw] pt-[0.8cqw]"
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
        <span className="text-white/40 text-[1.5cqw] font-black">R</span>
      </motion.div>

      {/* Main GBA Body with Notches */}
      <div 
        className="absolute inset-0 bg-[#634fb1] border-[0.33cqw] border-[#4d3b8f] shadow-[inset_-0.33cqw_-0.33cqw_1cqw_rgba(0,0,0,0.3),inset_0.33cqw_0.33cqw_1cqw_rgba(255,255,255,0.4)] transition-all duration-700 z-1"
        style={{
          clipPath: 'url(#gba-clip)',
        }}
      >
        {/* Hardware Shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Left Control Column */}
      <div className="w-[20%] h-full flex flex-col items-center justify-center gap-[10%] z-10 shrink-0">
        <motion.div variants={itemVariants} className="relative w-[11.5cqw] h-[11.5cqw] aspect-square flex items-center justify-center ">
          <div className="absolute w-full h-[30%] bg-[#2d2d2d] rounded-[0.16cqw] shadow-[0.16cqw_0.16cqw_0px_rgba(0,0,0,0.4)]" />
          <div className="absolute w-[30%] h-full bg-[#2d2d2d] rounded-[0.16cqw] shadow-[0.16cqw_0.16cqw_0px_rgba(0,0,0,0.4)]" />
          <button 
            className="absolute top-0 w-[32%] h-[35%] rounded-[0.16cqw] hover:bg-black active:-translate-y-[0.08cqw] transition-all text-white/30 flex items-center justify-center outline-none" 
            onPointerDown={(e) => { 
                e.currentTarget.setPointerCapture(e.pointerId); 
                keysPressed.current?.add('w'); 
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
            }} 
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('w'); }}
            onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('w'); }}
          >
            <ArrowBigUp className="w-[70%] h-[70%]" />
          </button>
          <button 
            className="absolute bottom-0 w-[32%] h-[35%] rounded-[0.16cqw] hover:bg-black active:translate-y-[0.08cqw] transition-all text-white/30 flex items-center justify-center outline-none" 
            onPointerDown={(e) => { 
                e.currentTarget.setPointerCapture(e.pointerId); 
                keysPressed.current?.add('s'); 
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
            }} 
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('s'); }}
            onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('s'); }}
          >
            <ArrowBigDown className="w-[70%] h-[70%]" />
          </button>
          <button 
            className="absolute left-0 w-[35%] h-[32%] rounded-[0.16cqw] hover:bg-black active:-translate-x-[0.08cqw] transition-all text-white/30 flex items-center justify-center outline-none" 
            onPointerDown={(e) => { 
                e.currentTarget.setPointerCapture(e.pointerId); 
                keysPressed.current?.add('a'); 
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
            }} 
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('a'); }}
            onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('a'); }}
          >
            <ArrowBigLeft className="w-[70%] h-[70%]" />
          </button>
          <button 
            className="absolute right-0 w-[35%] h-[32%] rounded-[0.16cqw] hover:bg-black active:translate-x-[0.08cqw] transition-all text-white/30 flex items-center justify-center outline-none" 
            onPointerDown={(e) => { 
                e.currentTarget.setPointerCapture(e.pointerId); 
                keysPressed.current?.add('d'); 
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
            }} 
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('d'); }}
            onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('d'); }}
          >
            <ArrowBigRight className="w-[70%] h-[70%]" />
          </button>
          <div className="absolute w-[18%] h-[18%] bg-[#1a1a1a] rounded-full" />
        </motion.div>

        {/* Start / Select Buttons */}
        <div className="flex flex-col gap-[0.8cqw] rotate-[20deg] mt-[1.66cqw] translate-x-[1.66cqw]">
          <motion.div 
            variants={itemVariants}
            className="w-[12.5cqw] h-[2.9cqw] bg-[#3d3d3d] rounded-full border border-white/5 flex items-center px-[0.5vw] relative"
          >
            <span className="text-[1.25cqw] text-white/30 font-black tracking-widest ml-[0.4cqw] select-none pointer-events-none">SELECT</span>
            <button 
              className="absolute right-[0.4cqw] w-[2cqw] h-[2cqw] rounded-full bg-[#C4C4C4] shadow-[0.16cqw_0.16cqw_0px_rgba(0,0,0,0.5)] active:translate-y-[0.08cqw] active:scale-95 active:shadow-none transition-all cursor-pointer outline-none border-none"
              onPointerDown={(e) => { 
                e.currentTarget.setPointerCapture(e.pointerId); 
                keysPressed.current?.add('Backspace'); 
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
              }}
              onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('Backspace'); }}
              onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('Backspace'); }}
              aria-label="Select"
            />
          </motion.div>
          <motion.div 
            variants={itemVariants}
            className="w-[12.5cqw] h-[2.9cqw] bg-[#3d3d3d] rounded-full border border-white/5 flex items-center px-[0.4cqw] relative translate-x-[10%]"
          >
            <span className="text-[1.25cqw] text-white/30 font-black tracking-widest ml-[0.4cqw] select-none pointer-events-none">START</span>
            <button 
              className="absolute right-[0.4cqw] w-[2cqw] h-[2cqw] rounded-full bg-[#C4C4C4] shadow-[0.16cqw_0.16cqw_0px_rgba(0,0,0,0.5)] active:translate-y-[0.08cqw] active:scale-95 active:shadow-none transition-all cursor-pointer outline-none border-none"
              onPointerDown={(e) => { 
                e.currentTarget.setPointerCapture(e.pointerId); 
                keysPressed.current?.add('p');
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
              }}
              onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('p'); }}
              onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('p'); }}
              aria-label="Start"
            />
          </motion.div>
        </div>
      </div>

      {/* Hub Screen GBA */}
      <div className="flex-1 h-full py-[2.5cqw] flex items-center justify-center px-[0.8cqw] z-10 mt-[-6%]">
        <div className="w-full aspect-[3/2] bg-[#222] rounded-[1.66cqw] p-[1.66cqw] shadow-[inset_0_0_2.5cqw_rgba(0,0,0,0.9)] border-y-[0.66cqw] border-black/30 flex items-center justify-center relative overflow-hidden ring-[0.33cqw] ring-black/20">
          <div className="w-full h-full bg-black relative shadow-inner">
            {children}
            <AnimatePresence mode="wait">
              {gameState.isTalking && gameState.activeDialogue && (
                <DialogueBox 
                  gameState={gameState} 
                  className="pl-[2.75cqw] pr-[5cqw] pt-[1.75cqw] pb-[2.5cqw]" 
                  minHeight="12cqw"
                />
              )}
            </AnimatePresence>
          </div>
          {/* Subtle screen shine */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent opacity-30" />
        </div>
      </div>

      {/* Right Control Column */}
      <div className="w-[20%] h-full flex flex-col items-center justify-center relative z-10 shrink-0 mt-[-15%]">
        <div className="flex gap-[15%] rotate-[-15deg] translate-y-[-20%] translate-x-[-5%] w-[90%] justify-center">
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-[0.4cqw] translate-y-[40%]">
            <button 
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                keysPressed.current?.add('f');
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
              }} 
              onPointerUp={(e) => {
                e.currentTarget.releasePointerCapture(e.pointerId);
                keysPressed.current?.delete('f');
                window.dispatchEvent(new KeyboardEvent('keyup', { key: 'f' }));
              }}
              onPointerCancel={(e) => {
                e.currentTarget.releasePointerCapture(e.pointerId);
                keysPressed.current?.delete('f');
                window.dispatchEvent(new KeyboardEvent('keyup', { key: 'f' }));
              }}
              className="w-[6.5cqw] h-[6.5cqw] rounded-full bg-[#3d3d3d] shadow-[0.5cqw_0.5cqw_0px_rgba(0,0,0,0.4),inset_-0.25cqw_-0.25cqw_0.66cqw_rgba(0,0,0,0.5)] active:translate-y-[0.33cqw] active:shadow-none transition-all flex items-center justify-center text-white/50 font-black text-[2.9cqw] border-[0.16cqw] border-white/5 outline-none"
            >
              B
            </button>
          </motion.div>
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-[0.4cqw] -translate-y-0">
            <button 
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                keysPressed.current?.add('z');
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
              }} 
              onPointerUp={(e) => {
                e.currentTarget.releasePointerCapture(e.pointerId);
                keysPressed.current?.delete('z');
                window.dispatchEvent(new KeyboardEvent('keyup', { key: 'z' }));
              }}
              onPointerCancel={(e) => {
                e.currentTarget.releasePointerCapture(e.pointerId);
                keysPressed.current?.delete('z');
                window.dispatchEvent(new KeyboardEvent('keyup', { key: 'z' }));
              }}
              className="w-[6.5cqw] h-[6.5cqw] rounded-full bg-[#3d3d3d] shadow-[0.5cqw_0.5cqw_0px_rgba(0,0,0,0.4),inset_-0.25cqw_-0.25cqw_0.66cqw_rgba(0,0,0,0.5)] active:translate-y-[0.33cqw] active:shadow-none transition-all flex items-center justify-center text-white/50 font-black text-[2.9cqw] border-[0.16cqw] border-white/5 outline-none"
            >
              A
            </button>
          </motion.div>
        </div>
      </div>
      
      {/* Power Light */}
      <div className="absolute right-[7%] top-[10%] flex flex-row items-center gap-3 z-20">
        <div className="w-[1.07cqw] h-[1.07cqw] rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse" />
        <motion.p variants={itemVariants} className="text-white/50 text-[1.66cqw] md:text-[1.66cqw] font-bold tracking-[0.5cqw] md:tracking-[0.5cqw] uppercase">POWER</motion.p>
      </div>

      {/* GBA Logo text */}
      <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-[0.4cqw] z-10 opacity-60">
        <motion.p variants={itemVariants} className="text-white text-[1.5cqw] md:text-[1.8cqw] italic font-black tracking-[1.25cqw] md:tracking-[1.8cqw] uppercase">GameBoy</motion.p>
        <div className="w-[6.5cqw] h-[0.12cqw] bg-white opacity-30" />
        <motion.p variants={itemVariants} className="text-white text-[0.8cqw] md:text-[1.15cqw] font-bold tracking-[0.5cqw] md:tracking-[1cqw] uppercase">Advance</motion.p>
      </div>

      {/* Speaker Grille */}
      <motion.div variants={itemVariants} className="absolute bottom-[23%] right-[11%] flex gap-[0.33cqw] rotate-[90deg] opacity-20 group-hover:opacity-40 transition-opacity z-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-[0.66cqw] h-[9cqw] bg-black rounded-full skew-x-[15deg]" />
        ))}
      </motion.div>
    </motion.div>
  );
};
