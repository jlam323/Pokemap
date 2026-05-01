import React from 'react';
import { motion } from 'motion/react';
import { GameState } from '../../types';

interface DialogueBoxProps {
  gameState: GameState;
  fontSize?: string;
  isFullScreen?: boolean;
  className?: string;
}

export const DialogueBox = ({ 
  gameState, 
  fontSize = "text-sm", 
  isFullScreen = false,
  className = ""
}: DialogueBoxProps) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 20, opacity: 0 }}
    className={`absolute bottom-0 left-0 right-0 p-2 flex gap-3 z-30 overflow-hidden ${isFullScreen ? 'm-4' : ''} ${className}`}
    style={{ minHeight: isFullScreen ? '120px' : '100px' }}
  >
    {/* Custom Dialogue Backdrop */}
    <img 
      src={`${import.meta.env.BASE_URL.replace(/\/$/, '') || '.'}/dialogue/textbox.png`}
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      style={{ objectFit: 'fill' }}
      alt=""
    />

    <div className="flex-1 relative z-10">
      <p className="text-[10px] font-black mb-1 text-gray-500 uppercase tracking-widest">
          {gameState.npcs.find(n => n.id === gameState.talkingNPCId)?.name || 'NPC'}
      </p>
      <p className={`${fontSize} leading-snug text-black font-medium`}>
          {gameState.activeDialogue?.[gameState.dialogueIndex]}
      </p>

      <motion.div className="absolute bottom-[-10px] right-0 text-[10px] font-black text-black/50 animate-pulse tracking-widest">
          TAP SPACE OR A/B TO CONTINUE
      </motion.div>
    </div>
  </motion.div>
);
