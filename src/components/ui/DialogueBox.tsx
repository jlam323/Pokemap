import React from 'react';
import { motion } from 'motion/react';
import { GameState } from '../../types';

interface DialogueBoxProps {
  gameState: GameState;
  fontSize?: string;
  isFullScreen?: boolean;
}

export const DialogueBox = ({ 
  gameState, 
  fontSize = "text-sm", 
  isFullScreen = false 
}: DialogueBoxProps) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 20, opacity: 0 }}
    className={`absolute bottom-0 left-0 right-0 bg-[#f8f8f8] border-t-4 border-black p-3 flex gap-3 z-30 ${isFullScreen ? 'm-4 rounded-lg border-4' : ''}`}
    style={{ minHeight: isFullScreen ? '100px' : '80px' }}
  >
    <div className="flex-1">
      <p className="text-[10px] font-bold mb-1 text-gray-500">
          {gameState.npcs.find(n => n.dialogue === gameState.activeDialogue)?.name || 'NPC'}
      </p>
      <p className={`${fontSize} leading-tight text-black`}>
          {gameState.activeDialogue?.[gameState.dialogueIndex]}
      </p>
      <div className="absolute bottom-1 right-2 text-[8px] text-black/30 animate-pulse">
          TAP SCREEN OR SPACE
      </div>
    </div>
  </motion.div>
);
