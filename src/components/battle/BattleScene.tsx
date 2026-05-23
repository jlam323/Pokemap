import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Entity, GameState } from '../../types';
import { POKEMON_NPC_BASES } from '../../data/pokemon';
import { getPokeballStyle, getSpriteStyle } from './battleUtils';
import { CATCH_SUCCESS_SEQUENCE, CATCH_FAILURE_SEQUENCE } from '../../constants';

interface BattleSceneProps {
  opponent: Entity;
  opponentData: typeof POKEMON_NPC_BASES[number] | undefined;
  partnerData: typeof POKEMON_NPC_BASES[number] | null;
  gameState: GameState;
  overlayMode: 'none' | 'gbc' | 'gba';
  pokemonSheet?: HTMLImageElement;
  itemImages: Record<string, Record<string, HTMLImageElement>>;
  enemyBase: string;
  playerBase: string;
  isBattleEnding: boolean;
  battleEndReason: 'WIN' | 'RUN' | 'LOSE' | null;
  ballPhase: 'hidden' | 'thrown' | 'landed' | 'revealed';
  battleCatchState: 'idle' | 'thrown' | 'capturing' | 'success' | 'failure';
  catchAnimationFrame: number;
  catchType: 'success' | 'failure';
  isOpponentHidden: boolean;
  onCatchThrowComplete: () => void;
}

export const BattleScene = ({
  opponent,
  opponentData,
  partnerData,
  gameState,
  overlayMode,
  pokemonSheet,
  itemImages,
  enemyBase,
  playerBase,
  isBattleEnding,
  battleEndReason,
  ballPhase,
  battleCatchState,
  catchAnimationFrame,
  catchType,
  isOpponentHidden,
  onCatchThrowComplete,
}: BattleSceneProps) => {
  return (
    <div className={`flex-1 relative bg-gradient-to-b from-[#88c0d0] to-[#eceff4] overflow-hidden ${
      overlayMode === 'none' ? 'pt-[25vh] md:pt-[10vh]' : 'md:pt-[10vh]'
    }`} id="battle-view-scene">
      
      {/* Opponent Sprite Container (Top Right) */}
      <div className={`absolute right-[10%] w-[35%] flex flex-col items-center z-10 ${
        overlayMode === 'none' ? 'top-[7%] md:top-[12%]' : 'top-[12%]'
      }`} id="battle-opponent-container">
        <div className="w-20 h-20 md:w-32 md:h-32 relative flex items-center justify-center pt-4">
          {/* Battle Base */}
          <img 
            src={enemyBase} 
            className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[180%] max-w-none opacity-90 select-none pointer-events-none z-0 scale-90" 
            alt="Enemy Battle Base" 
            id="enemy-battle-base"
          />
          
          {opponentData && !isOpponentHidden && (
            <motion.div 
              animate={isBattleEnding 
                ? (battleEndReason === 'WIN' ? { y: 100, opacity: 0 } : { x: 0, opacity: 1 }) 
                : { x: [0, -5, 0] }
              }
              transition={isBattleEnding ? { duration: 0.5 } : { repeat: Infinity, duration: 3 }}
              className="absolute z-10 bottom-[15%] w-[100%] aspect-square" 
              style={getSpriteStyle(opponentData.spriteSheet?.index ?? 0, pokemonSheet, 0, 2)} 
              id="opponent-pokemon-sprite"
            />
          )}
        </div>
      </div>

      {/* Player/Partner Sprite Container (Bottom Left) */}
      <div className="absolute left-[0%] w-[50%] z-10 bottom-0" id="battle-player-container">
        {/* Battle Base (Always present) */}
        <img 
          src={playerBase} 
          className="absolute bottom-0 left-[0%] w-[100%] max-w-none opacity-95 select-none pointer-events-none z-0" 
          alt="Player Battle Base" 
          id="player-battle-base"
        />

        {/* Pokeball Throw Animation (For partner entering battle) */}
        {ballPhase !== 'revealed' && ballPhase !== 'hidden' && (
          <motion.div 
            id="partner-throw-pokeball"
            className="absolute z-20 pointer-events-none left-[45%]"
            initial={{ x: -200, y: 250, rotate: -360, opacity: 0 }}
            style={getPokeballStyle('pokeball', ballPhase === 'landed' ? 'landed' : 'thrown', itemImages)}
            animate={ballPhase === 'thrown' ? {
              x: 0,
              y: [250, -30, 25],
              rotate: 720,
              opacity: 1,
              transition: { 
                duration: 0.6,
                ease: "easeOut",
                opacity: { duration: 0.1 },
                y: { times: [0, 0.4, 1], duration: 0.6 }
              }
            } : {
              // Landed phase
              x: 0,
              y: 50,
              rotate: 720,
              scale: [1, 1, 0],
              opacity: [1, 1, 0],
              transition: { 
                scale: { duration: 0.8, times: [0, 0.7, 1] },
                opacity: { duration: 0.8, times: [0, 0.7, 1] }
              }
            }}
          />
        )}

        {/* Flash/Aura when appearing */}
        <AnimatePresence>
          {ballPhase === 'landed' && (
            <motion.div 
              id="partner-appear-flash"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 2, opacity: 1 }}
              exit={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute z-20 w-32 h-32 md:w-48 md:h-48 bg-white rounded-full blur-xl mix-blend-screen left-[40%] -translate-x-1/2 bottom-[10%]"
            />
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={isBattleEnding 
            ? (battleEndReason === 'RUN' ? { x: -500, opacity: 0 } : { scale: 1, opacity: 1 }) 
            : (ballPhase === 'revealed' ? { scale: 1, opacity: 1, x: [0, 5, 0] } : { scale: 0, opacity: 0 })
          }
          transition={isBattleEnding ? { duration: 0.5 } : (ballPhase === 'revealed' ? { x: { repeat: Infinity, duration: 2.5 }, default: { duration: 0.4, ease: "backOut" } } : { duration: 0.2 })}
          className="relative w-full h-32 md:h-56 flex flex-col items-center justify-end overflow-visible"
        >
          {partnerData && (
            <motion.div 
              animate={isBattleEnding && battleEndReason === 'LOSE'
                ? { y: 100, opacity: 0 }
                : { y: 0, opacity: 1 }
              }
              transition={{ duration: 0.5 }}
              className="relative z-10 bottom-[-30%] w-[55%] aspect-square mb-[8%] md:mb-[12%]" 
              style={getSpriteStyle(partnerData.spriteSheet.index, pokemonSheet, 0, 0)} 
              id="partner-pokemon-sprite"
            />
          )}
        </motion.div>
      </div>

      {/* Battle Capture Pokeball Overlay */}
      {battleCatchState !== 'idle' && (
        <motion.div 
          id="catch-pokeball"
          className="absolute z-40 pointer-events-none"
          style={getPokeballStyle(
            'pokeball', 
            battleCatchState === 'capturing' 
              ? (catchType === 'success' ? CATCH_SUCCESS_SEQUENCE : CATCH_FAILURE_SEQUENCE)[catchAnimationFrame] 
              : (battleCatchState === 'failure' ? 5 : (battleCatchState === 'success' ? 12 : 2)), // 2 is closed, 5 is open, 12 is caught star/closed
            itemImages,
            battleCatchState === 'capturing' || battleCatchState === 'failure' || battleCatchState === 'success'
          )}
          {...(battleCatchState === 'thrown' ? {
            initial: { 
              left: '20%', 
              top: '80%', 
              rotate: -360, 
              opacity: 0,
              scale: 1,
              x: '-50%'
            },
            animate: {
              left: '72.5%',
              top: ['80%', '15%', '32%'],
              rotate: 360,
              opacity: 1,
              scale: 1,
              x: '-50%'
            },
            transition: {
              duration: 0.4,
              left: { ease: "linear" },
              top: { times: [0, 0.6, 1], ease: ["easeOut", "easeIn"] }
            },
            onAnimationComplete: onCatchThrowComplete
          } : {
            // Stationary at landing target over opponent base
            initial: {
              left: '72.5%',
              top: '32%',
              opacity: 1,
              scale: 1,
              x: '-50%'
            },
            animate: battleCatchState === 'success' ? {
              left: '72.5%',
              top: '32%',
              scale: [1, 1.2, 0],
              opacity: [1, 1, 0],
              x: '-50%',
              transition: { duration: 0.5, delay: 0.5 }
            } : battleCatchState === 'failure' ? {
              left: '72.5%',
              top: '32%',
              scale: [1, 1, 0],
              opacity: [1, 1, 0],
              x: '-50%',
              transition: { duration: 0.4 }
            } : {
              left: '72.5%',
              top: '32%',
              scale: 1,
              opacity: 1,
              x: '-50%'
            }
          })}
        />
      )}

      {battleCatchState === 'success' && <SuccessStars />}
    </div>
  );
};

const SuccessStars = () => {
  const starCount = 5;
  
  // Calculate the path for each star matching map view physics
  const starsData = Array.from({ length: starCount }).map((_, i) => {
    const angle = -Math.PI / 2 + (i - 2) * 0.5; 
    const speed = 40 + (i % 3) * 12;
    const gravity = 100;
    
    const xValues: number[] = [];
    const yValues: number[] = [];
    const opacities: number[] = [];
    const scales: number[] = [];
    
    const steps = 24;
    for (let step = 0; step <= steps; step++) {
      const p = step / steps;
      // Coordinates centered on start, scaling for battle view space
      const sx = Math.cos(angle) * speed * p * 1.6;
      const sy = Math.sin(angle) * speed * p * 1.6 + (0.5 * gravity * p * p * 1.6);
      
      xValues.push(sx);
      yValues.push(sy);
      opacities.push(1 - p);
      scales.push(1 - p * 0.35);
    }
    return { x: xValues, y: yValues, opacity: opacities, scale: scales };
  });

  return (
    <div 
      className="absolute left-[72.5%] -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none w-0 h-0 overflow-visible"
      style={{ top: 'calc(32% + 12px)' }}
      id="battle-catch-success-stars"
    >
      {starsData.map((keyframes, idx) => (
        <motion.div
          key={idx}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: keyframes.x,
            y: keyframes.y,
            opacity: keyframes.opacity,
            scale: keyframes.scale,
          }}
          transition={{
            duration: 0.9,
            ease: "easeOut",
          }}
        >
          <svg viewBox="0 0 24 24" fill="#ffeb3b" className="w-5 h-5 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.35)]">
            <path d="M12,0 L16.8,7.2 L24,12 L16.8,16.8 L12,24 L7.2,16.8 L0,12 L7.2,7.2 Z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};
