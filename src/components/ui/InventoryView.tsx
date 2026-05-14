import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { INITIAL_ITEMS } from '../../data/items';

interface InventoryViewProps {
  inventory: Record<string, number>;
  onBack: () => void;
  overlayMode: 'none' | 'gbc' | 'gba';
}

export const InventoryView = ({ inventory, onBack, overlayMode }: InventoryViewProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Filter only items that are actually in inventory
  const inventoryItems = Object.entries(inventory)
    .filter(([_, count]) => count > 0)
    .map(([name, count]) => {
      // Find the item details from INITIAL_ITEMS to get description
      // Note: we're using name as key now, so we find by name
      const itemData = INITIAL_ITEMS.find(i => i.name === name);
      return {
        name,
        count,
        description: itemData?.description || 'A USEFUL ITEM FOR YOUR JOURNEY.'
      };
    });

  // Helper to get responsive font sizes based on overlay mode
  const getFontSize = (baseSize: string, largeSize: string) => {
    if (overlayMode !== 'none') return baseSize; // Force small on overlays
    return `${largeSize} md:${baseSize}`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const isSelectionKey = key === 'Enter' || key === ' ' || key === 'z' || key === 'Space';
      const isBackKey = key === 'Escape' || key === 'x' || key === 'Backspace' || key === 'p' || key === 'f';
      const isUpKey = key === 'ArrowUp' || key === 'w';
      const isDownKey = key === 'ArrowDown' || key === 's';
      const isLeftKey = key === 'ArrowLeft' || key === 'a';
      const isRightKey = key === 'ArrowRight' || key === 'd';

      if (isDownKey || isRightKey) {
        setSelectedIndex(prev => (prev + 1) % Math.max(inventoryItems.length, 1));
      } else if (isUpKey || isLeftKey) {
        setSelectedIndex(prev => (prev - 1 + inventoryItems.length) % Math.max(inventoryItems.length, 1));
      } else if (isBackKey) {
        onBack();
      } else if (isSelectionKey) {
        // Handle selection if needed
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inventoryItems.length]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white border-4 border-black w-3/4 max-w-xs h-[70%] flex flex-col shadow-[8px_8px_0px_rgba(0,0,0,0.2)] overflow-hidden"
    >
      <div className="bg-black p-3 md:p-4 shrink-0">
        <h2 className={`text-white font-black tracking-[4px] ${getFontSize('text-[9px]', 'text-[12px]')}`}>INVENTORY</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-[#f0f0f0] scrollbar-hide">
        {inventoryItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-black/20">
             <div className="w-12 h-12 border-4 border-current rounded-full" />
             <span className={`font-black tracking-[2px] ${getFontSize('text-[8px]', 'text-[10px]')}`}>BAG IS EMPTY</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {inventoryItems.map((item, i) => {
              const selected = selectedIndex === i;
              return (
                <div
                  key={item.name}
                  className={`flex items-center justify-between p-3 border-2 transition-all ${
                    selected ? 'bg-black text-white border-black scale-105 shadow-md px-5' : 'bg-white border-black/10 text-black/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selected && <div className="w-2 h-2 bg-white rotate-45 shrink-0" />}
                    <span className={`font-black tracking-[2px] uppercase ${getFontSize('text-[8px]', 'text-[10px]')}`}>{item.name}</span>
                  </div>
                  <span className={`font-black tracking-[1px] ${getFontSize('text-[8px]', 'text-[10px]')}`}>x{item.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t-4 border-black shrink-0">
        <div className="h-16 flex flex-col justify-between">
           <p className={`font-bold text-black/60 tracking-[1px] leading-relaxed uppercase shrink-0 ${getFontSize('text-[7.5px]', 'text-[10px]')}`}>
             {inventoryItems.length > 0 && selectedIndex < inventoryItems.length 
               ? inventoryItems[selectedIndex].description
               : 'COLLECT ITEMS FROM THE WORLD TO FILL YOUR BAG.'}
           </p>
           <div className="flex justify-end mt-2">
             <span className={`font-black tracking-[2px] text-black/30 ${getFontSize('text-[6px]', 'text-[8px]')}`}>[B] TO BACK</span>
           </div>
        </div>
      </div>
    </motion.div>
  );
};
