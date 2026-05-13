import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ITEM_SPRITE_CONFIGS } from '../../data/items';

interface InventoryViewProps {
  inventory: Record<string, number>;
  onBack: () => void;
}

export const InventoryView = ({ inventory, onBack }: InventoryViewProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const items = Object.entries(inventory).filter(([_, count]) => count > 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const isSelectionKey = key === 'Enter' || key === ' ' || key === 'z' || key === 'Space';
      const isBackKey = key === 'Escape' || key === 'x' || key === 'Backspace' || key === 'p' || key === 'f';
      const isUpKey = key === 'ArrowUp' || key === 'w';
      const isDownKey = key === 'ArrowDown' || key === 's';

      if (isDownKey) {
        setSelectedIndex(prev => (prev + 1) % Math.max(items.length, 1));
      } else if (isUpKey) {
        setSelectedIndex(prev => (prev - 1 + items.length) % Math.max(items.length, 1));
      } else if (isBackKey) {
        onBack();
      } else if (isSelectionKey) {
        // Handle selection if needed
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white border-4 border-black w-3/4 max-w-xs h-[70%] flex flex-col shadow-[8px_8px_0px_rgba(0,0,0,0.2)] overflow-hidden"
    >
      <div className="bg-black p-3 shrink-0">
        <h2 className="text-white font-black text-[10px] tracking-[4px]">INVENTORY</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-[#f0f0f0]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-black/20">
             <div className="w-12 h-12 border-4 border-current rounded-full" />
             <span className="font-black text-[10px] tracking-[2px]">BAG IS EMPTY</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map(([id, count], i) => {
              const selected = selectedIndex === i;
              return (
                <div
                  key={id}
                  className={`flex items-center justify-between p-3 border-2 transition-all ${
                    selected ? 'bg-black text-white border-black scale-105 shadow-md px-5' : 'bg-white border-black/10 text-black/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selected && <div className="w-2 h-2 bg-white rotate-45 shrink-0" />}
                    <span className="font-black text-[10px] tracking-[2px] uppercase">{id.replace(/-/g, ' ')}</span>
                  </div>
                  <span className="font-black text-[10px] tracking-[1px]">x{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t-4 border-black shrink-0">
        <div className="h-16 flex flex-col justify-between">
           <p className="text-[8px] font-bold text-black/60 tracking-[1px] leading-relaxed uppercase">
             {items.length > 0 && selectedIndex < items.length 
               ? `A USEFUL ITEM FOR YOUR JOURNEY. YOU CURRENTLY HAVE ${items[selectedIndex][1]} IN YOUR BAG.`
               : 'COLLECT ITEMS FROM THE WORLD TO FILL YOUR BAG.'}
           </p>
           <div className="flex justify-end mt-2">
             <span className="text-[7px] font-black tracking-[2px] text-black/30">[B] TO BACK</span>
           </div>
        </div>
      </div>
    </motion.div>
  );
};
