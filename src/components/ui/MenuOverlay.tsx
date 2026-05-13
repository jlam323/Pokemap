import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, MenuState } from '../../types';
import { PokedexView } from './PokedexView';
import { InventoryView } from './InventoryView';

interface MenuOverlayProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  overlayMode: 'none' | 'gbc' | 'gba';
}

export const MenuOverlay = ({ gameState, setGameState, overlayMode }: MenuOverlayProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const isNoneOverlay = overlayMode === 'none';
  const menuOptions: { label: string; state: MenuState }[] = [
    { label: 'Pokédex', state: 'POKEDEX' },
    { label: 'Inventory', state: 'INVENTORY' },
    { label: 'Back', state: 'CLOSED' }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.menuState === 'CLOSED') return;

      if (gameState.menuState === 'MAIN') {
        if (e.key === 'ArrowDown' || e.key === 's') {
          setSelectedIndex(prev => (prev + 1) % menuOptions.length);
        } else if (e.key === 'ArrowUp' || e.key === 'w') {
          setSelectedIndex(prev => (prev - 1 + menuOptions.length) % menuOptions.length);
        } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z') {
          const option = menuOptions[selectedIndex];
          setGameState(prev => ({ ...prev, menuState: option.state }));
        } else if (e.key === 'Escape' || e.key === 'x' || e.key === 'Backspace' || e.key === 'p') {
          setGameState(prev => ({ ...prev, menuState: 'CLOSED' }));
        }
      } else {
        // Submenu: just handle Back
        if (e.key === 'Escape' || e.key === 'x' || e.key === 'Backspace' || e.key === 'p') {
          setGameState(prev => ({ ...prev, menuState: 'MAIN' }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.menuState, selectedIndex, setGameState]);

  if (gameState.menuState === 'CLOSED') return null;

  return (
    <div className={`absolute inset-0 z-[100] flex pointer-events-none ${
      isMobile && isNoneOverlay ? 'items-start justify-center pt-[5vh]' : 'items-center justify-center'
    }`}>
      <div className={`relative w-full ${isMobile && isNoneOverlay ? 'h-1/2' : 'h-full'} pointer-events-auto bg-black/20 backdrop-blur-sm flex items-center justify-center p-4`}>
        {gameState.menuState === 'MAIN' && (
          <motion.div
            key="main-menu"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white border-4 border-black w-3/4 max-w-xs shadow-[8px_8px_0px_rgba(0,0,0,0.2)]"
          >
            <div className="p-4 flex flex-col gap-2">
              <h2 className="text-black font-black text-xs tracking-[4px] border-b-2 border-black/10 pb-2 mb-2">MENU</h2>
              {menuOptions.map((opt, i) => (
                <div
                  key={opt.label}
                  className={`flex items-center gap-3 p-2 transition-all ${
                    selectedIndex === i ? 'bg-black text-white px-4' : 'text-black/60'
                  }`}
                >
                  {selectedIndex === i && <span className="w-2 h-2 bg-white rotate-45" />}
                  <span className="font-black text-sm tracking-[2px]">{opt.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {gameState.menuState === 'POKEDEX' && (
          <PokedexView 
            caughtIds={gameState.caughtPokemonIds} 
            onBack={() => setGameState(prev => ({ ...prev, menuState: 'MAIN' }))}
          />
        )}

        {gameState.menuState === 'INVENTORY' && (
          <InventoryView 
            inventory={gameState.inventory} 
            onBack={() => setGameState(prev => ({ ...prev, menuState: 'MAIN' }))}
          />
        )}
      </div>
    </div>
  );
};
