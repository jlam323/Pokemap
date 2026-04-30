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
      className="relative w-[75vw] max-w-[1200px] aspect-[1.6/1] flex items-center justify-center p-4 transition-all duration-700"
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
        className="absolute top-[2.5%] left-[2.5%] w-[16%] h-[20%] bg-[#8d80c9] rounded-t-[4vh] border-x-[0.4vh] border-t-[0.2vh] border-black/10 shadow-[inset_0_0.4vh_0.8vh_rgba(255,255,255,0.2)] z-0 flex items-start justify-start pl-[2vh] pt-[1vh]"
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
        <span className="text-white/40 text-[1.8vh] font-black">L</span>
      </motion.div>

      {/* R Shoulder Notch */}
      <motion.div 
        variants={itemVariants} 
        className="absolute top-[2.5%] right-[2.5%] w-[16%] h-[20%] bg-[#8d80c9] rounded-t-[4vh] border-x-[0.4vh] border-t-[0.2vh] border-black/10 shadow-[inset_0_0.4vh_0.8vh_rgba(255,255,255,0.2)] z-0 flex items-start justify-end pr-[2vh] pt-[1vh]"
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
        <span className="text-white/40 text-[1.8vh] font-black">R</span>
      </motion.div>

      {/* Main GBA Body with Notches */}
      <div 
        className="absolute inset-0 bg-[#634fb1] border-[0.4vh] border-[#4d3b8f] shadow-[inset_-0.4vh_-0.4vh_1.2vh_rgba(0,0,0,0.3),inset_0.4vh_0.4vh_1.2vh_rgba(255,255,255,0.4)] transition-all duration-700 z-1  translate-x-[%]"
        style={{
          clipPath: 'url(#gba-clip)',
        }}
      >
        {/* Hardware Shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Left Control Column */}
      <div className="w-[20%] h-full flex flex-col items-center justify-center gap-[10%] z-10 shrink-0">
        <motion.div variants={itemVariants} className="relative w-[14vh] h-[14vh] aspect-square flex items-center justify-center ">
          <div className="absolute w-full h-[30%] bg-[#2d2d2d] rounded-[0.2vh] shadow-[0.2vh_0.2vh_0px_rgba(0,0,0,0.4)]" />
          <div className="absolute w-[30%] h-full bg-[#2d2d2d] rounded-[0.2vh] shadow-[0.2vh_0.2vh_0px_rgba(0,0,0,0.4)]" />
          <button 
            className="absolute top-0 w-[32%] h-[35%] rounded-[0.2vh] hover:bg-black active:-translate-y-[0.1vh] transition-all text-white/30 flex items-center justify-center outline-none" 
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('w'); }} 
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('w'); }}
            onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('w'); }}
          >
            <ArrowBigUp className="w-[70%] h-[70%]" />
          </button>
          <button 
            className="absolute bottom-0 w-[32%] h-[35%] rounded-[0.2vh] hover:bg-black active:translate-y-[0.1vh] transition-all text-white/30 flex items-center justify-center outline-none" 
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('s'); }} 
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('s'); }}
            onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('s'); }}
          >
            <ArrowBigDown className="w-[70%] h-[70%]" />
          </button>
          <button 
            className="absolute left-0 w-[35%] h-[32%] rounded-[0.2vh] hover:bg-black active:-translate-x-[0.1vh] transition-all text-white/30 flex items-center justify-center outline-none" 
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('a'); }} 
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('a'); }}
            onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('a'); }}
          >
            <ArrowBigLeft className="w-[70%] h-[70%]" />
          </button>
          <button 
            className="absolute right-0 w-[35%] h-[32%] rounded-[0.2vh] hover:bg-black active:translate-x-[0.1vh] transition-all text-white/30 flex items-center justify-center outline-none" 
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('d'); }} 
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('d'); }}
            onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('d'); }}
          >
            <ArrowBigRight className="w-[70%] h-[70%]" />
          </button>
          <div className="absolute w-[18%] h-[18%] bg-[#1a1a1a] rounded-full" />
        </motion.div>

        {/* Start / Select Buttons */}
        <div className="flex flex-col gap-[1vh] rotate-[20deg] mt-[2vh] translate-x-[2vh]">
          <motion.div 
            variants={itemVariants}
            className="w-[15vh] h-[3.5vh] bg-[#3d3d3d] rounded-full border border-white/5 flex items-center px-[0.5vh] relative"
          >
            <span className="text-[1.5vh] text-white/30 font-black tracking-widest ml-[0.5vh] select-none pointer-events-none">SELECT</span>
            <button 
              className="absolute right-[0.5vh] w-[2.5vh] h-[2.5vh] rounded-full bg-[#C4C4C4] shadow-[0.2vh_0.2vh_0px_rgba(0,0,0,0.5)] active:translate-y-[0.1vh] active:scale-95 active:shadow-none transition-all cursor-pointer outline-none border-none"
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('Backspace'); }}
              onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('Backspace'); }}
              onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('Backspace'); }}
              aria-label="Select"
            />
          </motion.div>
          <motion.div 
            variants={itemVariants}
            className="w-[15vh] h-[3.5vh] bg-[#3d3d3d] rounded-full border border-white/5 flex items-center px-[0.5vh] relative translate-x-[10%]"
          >
            <span className="text-[1.5vh] text-white/30 font-black tracking-widest ml-[0.5vh] select-none pointer-events-none">START</span>
            <button 
              className="absolute right-[0.5vh] w-[2.5vh] h-[2.5vh] rounded-full bg-[#C4C4C4] shadow-[0.2vh_0.2vh_0px_rgba(0,0,0,0.5)] active:translate-y-[0.1vh] active:scale-95 active:shadow-none transition-all cursor-pointer outline-none border-none"
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); keysPressed.current?.add('Enter'); }}
              onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('Enter'); }}
              onPointerCancel={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); keysPressed.current?.delete('Enter'); }}
              aria-label="Start"
            />
          </motion.div>
        </div>
      </div>

      {/* Hub Screen GBA */}
      <div className="flex-1 h-full py-[3vh] flex items-center justify-center px-[1vh] z-10 mt-[-6%]">
        <div className="w-full aspect-[3/2] bg-[#222] rounded-[2vh] p-[2vh] shadow-[inset_0_0_3vh_rgba(0,0,0,0.9)] border-y-[0.8vh] border-black/30 flex items-center justify-center relative overflow-hidden ring-[0.4vh] ring-black/20">
          <div className="w-full h-full bg-black relative shadow-inner">
            {children}
            <AnimatePresence mode="wait">
              {gameState.isTalking && gameState.activeDialogue && (
                <DialogueBox gameState={gameState} fontSize="text-[1.2vh]" />
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
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-[0.5vh] translate-y-[40%]">
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
              className="w-[8vh] h-[8vh] rounded-full bg-[#3d3d3d] shadow-[0.6vh_0.6vh_0px_rgba(0,0,0,0.4),inset_-0.3vh_-0.3vh_0.8vh_rgba(0,0,0,0.5)] active:translate-y-[0.4vh] active:shadow-none transition-all flex items-center justify-center text-white/50 font-black text-[3.5vh] border-[0.2vh] border-white/5 outline-none"
            >
              B
            </button>
          </motion.div>
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-[0.5vh] -translate-y-0">
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
              className="w-[8vh] h-[8vh] rounded-full bg-[#3d3d3d] shadow-[0.6vh_0.6vh_0px_rgba(0,0,0,0.4),inset_-0.3vh_-0.3vh_0.8vh_rgba(0,0,0,0.5)] active:translate-y-[0.4vh] active:shadow-none transition-all flex items-center justify-center text-white/50 font-black text-[3.5vh] border-[0.2vh] border-white/5 outline-none"
            >
              A
            </button>
          </motion.div>
        </div>
      </div>
      
      {/* Power Light */}
      <div className="absolute right-[7%] top-[10%] flex flex-row items-center gap-3 z-20">
        <div className="w-[1.3vh] h-[1.3vh] rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse" />
        <motion.p variants={itemVariants} className="text-white/50 text-[2vh] md:text-[2vh] font-bold tracking-[0.6vh] md:tracking-[0.6vh] uppercase">POWER</motion.p>
      </div>

      {/* GBA Logo text */}
      <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-[0.5vh] z-10 opacity-60">
        <motion.p variants={itemVariants} className="text-white text-[1.8vh] md:text-[2.2vh] italic font-black tracking-[1.5vh] md:tracking-[2.2vh] uppercase">GameBoy</motion.p>
        <div className="w-[8vh] h-[0.15vh] bg-white opacity-30" />
        <motion.p variants={itemVariants} className="text-white text-[1vh] md:text-[1.4vh] font-bold tracking-[0.6vh] md:tracking-[1.2vh] uppercase">Advance</motion.p>
      </div>

      {/* Speaker Grille */}
      <motion.div variants={itemVariants} className="absolute bottom-[23%] right-[11%] flex gap-[0.4vh] rotate-[90deg] opacity-20 group-hover:opacity-40 transition-opacity z-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-[0.8vh] h-[11vh] bg-black rounded-full skew-x-[15deg]" />
        ))}
      </motion.div>
    </motion.div>
  );
};
