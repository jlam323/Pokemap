import React from 'react';
import { AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DialogueBox } from '../ui/DialogueBox';
import { GameState, Direction } from '../../types';

interface NoOverlayProps {
  gameState: GameState;
  handleArrowDown: (dir: Direction) => void;
  handleArrowUp: (dir: Direction) => void;
}

export function NoOverlay({ 
  gameState, 
  handleArrowDown, 
  handleArrowUp 
}: NoOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      <AnimatePresence>
        {gameState.isTalking && (
          <DialogueBox gameState={gameState} minHeight="18vh" className="pl-[4.5vw] pr-[9vw] pt-[3vh] pb-[3.5vh]" />
        )}
      </AnimatePresence>

      {/* Mobile Controls - Only visible on small screens */}
      <div className="lg:hidden absolute inset-0 pointer-events-none select-none">
        {/* Pokedex Button - Below D-Pad */}
        <div className="absolute bottom-6 left-8 pointer-events-auto">
          <button
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'p' }));
            }}
            onPointerCancel={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'p' }));
            }}
            className="px-5 h-11 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center active:bg-white/20 active:scale-95 transition-all shadow-2xl"
            aria-label="Menu"
          >
            <div className="text-white/80 font-black text-[11px] tracking-[1px] uppercase leading-none">Menu</div>
          </button>
        </div>

        {/* D-Pad */}
        <div className="absolute bottom-22 left-8 pointer-events-auto">
          <div className="grid grid-cols-3 gap-1">
            <div />
            <button 
              onPointerDown={() => handleArrowDown('up')}
              onPointerUp={() => handleArrowUp('up')}
              onPointerLeave={() => handleArrowUp('up')}
              onPointerCancel={() => handleArrowUp('up')}
              className="w-14 h-14 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center active:bg-white/20 active:scale-95 transition-all shadow-2xl"
              aria-label="Up"
            >
              <ChevronUp className="text-white w-8 h-8" />
            </button>
            <div />
            
            <button 
              onPointerDown={() => handleArrowDown('left')}
              onPointerUp={() => handleArrowUp('left')}
              onPointerLeave={() => handleArrowUp('left')}
              onPointerCancel={() => handleArrowUp('left')}
              className="w-14 h-14 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center active:bg-white/20 active:scale-95 transition-all shadow-2xl"
              aria-label="Left"
            >
              <ChevronLeft className="text-white w-8 h-8" />
            </button>
            <div className="w-14 h-14 bg-white/5 rounded-xl border border-white/5" />
            <button 
              onPointerDown={() => handleArrowDown('right')}
              onPointerUp={() => handleArrowUp('right')}
              onPointerLeave={() => handleArrowUp('right')}
              onPointerCancel={() => handleArrowUp('right')}
              className="w-14 h-14 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center active:bg-white/20 active:scale-95 transition-all shadow-2xl"
              aria-label="Right"
            >
              <ChevronRight className="text-white w-8 h-8" />
            </button>
            
            <div />
            <button 
              onPointerDown={() => handleArrowDown('down')}
              onPointerUp={() => handleArrowUp('down')}
              onPointerLeave={() => handleArrowUp('down')}
              onPointerCancel={() => handleArrowUp('down')}
              className="w-14 h-14 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center active:bg-white/20 active:scale-95 transition-all shadow-2xl"
              aria-label="Down"
            >
              <ChevronDown className="text-white w-8 h-8" />
            </button>
            <div />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-30 right-8 pointer-events-auto flex flex-col gap-6 items-end">
          <button
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'z' }));
            }}
            onPointerCancel={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'z' }));
            }}
            className="w-16 h-16 translate-x-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center active:bg-white/20 active:scale-90 transition-all shadow-2xl"
            aria-label="Action"
          >
            <div className="text-white font-black text-2xl tracking-tighter">A</div>
          </button>
          <button 
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'f' }));
            }}
            onPointerCancel={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              window.dispatchEvent(new KeyboardEvent('keyup', { key: 'f' }));
            }}
            className="w-16 h-16 -translate-x-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center active:bg-white/20 active:scale-90 transition-all shadow-2xl"
            aria-label="Throw"
          >
            <div className="text-white font-black text-2xl tracking-tighter">B</div>
          </button>
        </div>
      </div>

      {/* Desktop Keyboard Hints */}
      <div className="hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 items-center gap-6 px-8 py-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl opacity-60 hover:opacity-100 transition-all duration-300 z-10 shadow-2xl group pointer-events-auto">
        <div className="flex flex-col items-center gap-1">
          <kbd className="px-2 py-1 bg-white border-b-4 border-gray-300 rounded text-black text-[10px] font-black min-w-[30px] flex items-center justify-center">W</kbd>
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-white border-b-4 border-gray-300 rounded text-black text-[10px] font-black min-w-[30px] flex items-center justify-center">A</kbd>
            <kbd className="px-2 py-1 bg-white border-b-4 border-gray-300 rounded text-black text-[10px] font-black min-w-[30px] flex items-center justify-center">S</kbd>
            <kbd className="px-2 py-1 bg-white border-b-4 border-gray-300 rounded text-black text-[10px] font-black min-w-[30px] flex items-center justify-center">D</kbd>
          </div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <kbd className="px-4 py-2 bg-white border-b-4 border-gray-300 rounded text-black text-[10px] font-black tracking-widest min-w-[100px] flex items-center justify-center">SPACE</kbd>
            <span className="text-white/40 text-[9px] font-black tracking-widest uppercase">Interact</span>
          </div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <kbd className="px-3 py-2 bg-white border-b-4 border-gray-300 rounded text-black text-[10px] font-black tracking-widest min-w-[50px] flex items-center justify-center">F</kbd>
            <span className="text-white/40 text-[9px] font-black tracking-widest uppercase">Throw Ball</span>
          </div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <kbd className="px-3 py-2 bg-white border-b-4 border-gray-300 rounded text-black text-[10px] font-black tracking-widest min-w-[50px] flex items-center justify-center">P</kbd>
            <span className="text-white/40 text-[9px] font-black tracking-widest uppercase">Pokédex &</span>
            <span className="text-white/40 text-[9px] font-black tracking-widest uppercase">Inventory</span>
          </div>
        </div>
      </div>
    </div>
  );
}
