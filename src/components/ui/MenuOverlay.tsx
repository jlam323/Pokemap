import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, MenuState } from '../../types';
import { PokedexView } from './PokedexView';
import { InventoryView } from './InventoryView';

interface MenuOverlayProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  overlayMode: 'none' | 'gbc' | 'gba';
  pokemonSheet?: HTMLImageElement;
}

export const MenuOverlay = ({ gameState, setGameState, overlayMode, pokemonSheet }: MenuOverlayProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetSelectedIndex, setResetSelectedIndex] = useState(0);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const isNoneOverlay = overlayMode === 'none';

  // Helper to get responsive font sizes based on overlay mode
  const getFontSize = (baseSize: string, mdSize: string) => {
    if (overlayMode !== 'none') return baseSize; // Force small on overlays
    return `${baseSize} md:${mdSize}`;
  };

  const menuOptions: { label: string; state: MenuState | 'RESET' }[] = [
    { label: 'Pokédex', state: 'POKEDEX' },
    { label: 'Inventory', state: 'INVENTORY' },
    { label: 'Reset Progress', state: 'RESET' },
    { label: 'Back', state: 'CLOSED' }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (gameState.menuState === 'CLOSED') return;

      const isSelectionKey = key === 'Enter' || key === ' ' || key === 'z' || key === 'Space';
      const isBackKey = key === 'Escape' || key === 'x' || key === 'Backspace' || key === 'p' || key === 'f';
      const isUpKey = key === 'ArrowUp' || key === 'w';
      const isDownKey = key === 'ArrowDown' || key === 's';

      if (showConfirmReset) {
        if (isUpKey || isDownKey) {
          setResetSelectedIndex(prev => (prev === 0 ? 1 : 0));
        } else if (isSelectionKey) {
          if (resetSelectedIndex === 0) {
            setGameState(prev => ({
              ...prev,
              caughtPokemonIds: [],
              menuState: 'CLOSED'
            }));
          }
          setShowConfirmReset(false);
          setResetSelectedIndex(0);
        } else if (isBackKey) {
          setShowConfirmReset(false);
          setResetSelectedIndex(0);
        }
        return;
      }

      if (gameState.menuState === 'MAIN') {
        if (isDownKey) {
          setSelectedIndex(prev => (prev + 1) % menuOptions.length);
        } else if (isUpKey) {
          setSelectedIndex(prev => (prev - 1 + menuOptions.length) % menuOptions.length);
        } else if (isSelectionKey) {
          const option = menuOptions[selectedIndex];
          if (option.state === 'RESET') {
            setShowConfirmReset(true);
            setResetSelectedIndex(0);
          } else {
            setGameState(prev => ({ ...prev, menuState: option.state as MenuState }));
          }
        } else if (isBackKey) {
          setGameState(prev => ({ ...prev, menuState: 'CLOSED' }));
        }
      } else {
        // Submenu: just handle Back
        if (isBackKey) {
          setGameState(prev => ({ ...prev, menuState: 'MAIN' }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.menuState, selectedIndex, setGameState, showConfirmReset, resetSelectedIndex]);

  if (gameState.menuState === 'CLOSED') return null;

  return (
    <div className={`absolute inset-0 z-[100] flex pointer-events-none ${
      isMobile && isNoneOverlay ? 'items-start justify-center pt-[5vh]' : 'items-center justify-center'
    }`}>
      <div className={`relative w-full ${isMobile && isNoneOverlay ? 'h-1/2' : 'h-full'} pointer-events-auto bg-black/20 backdrop-blur-sm flex items-center justify-center p-4`}>
        {gameState.menuState === 'MAIN' && !showConfirmReset && (
          <motion.div
            key="main-menu"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white border-4 border-black w-3/4 max-w-xs shadow-[8px_8px_0px_rgba(0,0,0,0.2)]"
          >
            <div className="p-4 flex flex-col gap-2">
              <h2 className={`text-black font-black tracking-[4px] border-b-2 border-black/10 pb-2 mb-2 ${getFontSize('text-[10px]', 'text-xs')}`}>MENU</h2>
              {menuOptions.map((opt, i) => (
                <div
                  key={opt.label}
                  onMouseEnter={() => setSelectedIndex(i)}
                  onClick={() => {
                    if (opt.state === 'RESET') {
                      setShowConfirmReset(true);
                    } else {
                      setGameState(prev => ({ ...prev, menuState: opt.state as MenuState }));
                    }
                  }}
                  className={`flex items-center gap-3 p-2 cursor-pointer transition-all ${
                    selectedIndex === i ? 'bg-black text-white px-4' : 'text-black/60 hover:bg-black/5'
                  }`}
                >
                  {selectedIndex === i && <span className="w-2 h-2 bg-white rotate-45" />}
                  <span className={`font-black tracking-[2px] ${getFontSize('text-xs', 'text-sm')}`}>{opt.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {showConfirmReset && (
          <motion.div
            key="confirm-reset"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border-[3px] md:border-4 border-black p-4 md:p-6 w-full max-w-[240px] shadow-[6px_6px_0px_rgba(0,0,0,0.2)] text-center"
          >
            <p className="text-black font-black text-[10px] md:text-xs tracking-[1px] mb-4 md:mb-6 uppercase">Reset Progress?</p>
            <div className="flex flex-col gap-2 md:gap-3">
              <button
                onMouseEnter={() => setResetSelectedIndex(0)}
                onClick={() => {
                  setGameState(prev => ({
                    ...prev,
                    caughtPokemonIds: [],
                    menuState: 'CLOSED'
                  }));
                  setShowConfirmReset(false);
                }}
                className={`flex items-center justify-center gap-2 font-black py-2 md:py-3 text-[9px] md:text-xs tracking-[2px] transition-all border-2 ${
                  resetSelectedIndex === 0 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-black/40 border-transparent'
                }`}
              >
                {resetSelectedIndex === 0 && <span className="w-1.5 h-1.5 bg-white rotate-45" />}
                YES, RESET
              </button>
              <button
                onMouseEnter={() => setResetSelectedIndex(1)}
                onClick={() => {
                  setShowConfirmReset(false);
                  setResetSelectedIndex(0);
                }}
                className={`flex items-center justify-center gap-2 font-black py-2 md:py-3 text-[9px] md:text-xs tracking-[2px] transition-all border-2 ${
                  resetSelectedIndex === 1 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-black/40 border-transparent'
                }`}
              >
                {resetSelectedIndex === 1 && <span className="w-1.5 h-1.5 bg-white rotate-45" />}
                CANCEL
              </button>
            </div>
          </motion.div>
        )}

        {gameState.menuState === 'POKEDEX' && (
          <PokedexView 
            caughtIds={gameState.caughtPokemonIds} 
            onBack={() => setGameState(prev => ({ ...prev, menuState: 'MAIN' }))}
            overlayMode={overlayMode}
            pokemonSheet={pokemonSheet}
          />
        )}

        {gameState.menuState === 'INVENTORY' && (
          <InventoryView 
            inventory={gameState.inventory} 
            onBack={() => setGameState(prev => ({ ...prev, menuState: 'MAIN' }))}
            overlayMode={overlayMode}
          />
        )}
      </div>
    </div>
  );
};
