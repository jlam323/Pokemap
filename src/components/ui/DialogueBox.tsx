import React from 'react';
import { motion } from 'motion/react';
import { GameState } from '../../types';

interface DialogueBoxProps {
  gameState: GameState;
  className?: string;
  minHeight?: string;
}

export const DialogueBox = ({ 
  gameState, 
  className = "",
  minHeight
}: DialogueBoxProps) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 20, opacity: 0 }}
    className={`absolute bottom-0 left-0 right-0 p-2 flex gap-3 z-30 overflow-hidden ${className}`}
    style={{ minHeight: minHeight }}
  >
    {/* Custom Dialogue Backdrop */}
    <img 
      src={`${import.meta.env.BASE_URL.replace(/\/$/, '') || '.'}/dialogue/textbox.png`}
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      style={{ objectFit: 'fill' }}
      alt=""
    />

    <div className="flex-1 relative z-10">
      {gameState.talkingNPCId && (
        <p className="text-[1.2vh] font-black mb-1 text-gray-500 uppercase tracking-widest">
            {gameState.npcs.find(n => n.id === gameState.talkingNPCId)?.name || 'NPC'}
        </p>
      )}
      <p className="text-[1.35vh] leading-snug text-black font-medium">
          {gameState.activeDialogue?.[gameState.dialogueIndex]}
      </p>

      <motion.div className="absolute bottom-[-1.2vh] right-0 text-[1vh] font-black text-black/50 animate-pulse tracking-widest">
          TAP SPACE OR (A) TO CONTINUE
      </motion.div>
    </div>
  </motion.div>
);
