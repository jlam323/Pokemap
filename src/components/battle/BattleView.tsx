import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { Entity, GameState } from '../../types';
import { POKEMON_NPC_BASES } from '../../data/pokemon';
import { FAILURE_PHRASES, CATCH_SUCCESS_SEQUENCE, CATCH_FAILURE_SEQUENCE } from '../../constants';
import { getMovesForPokemon } from './battleUtils';
import { BattleStatus } from './BattleStatus';
import { BattleScene } from './BattleScene';
import { BattleControls } from './BattleControls';

export interface BattleViewProps {
  opponent: Entity;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  overlayMode: 'none' | 'gbc' | 'gba';
  pokemonSheet?: HTMLImageElement;
  playerImage?: HTMLImageElement;
  battleImages: Record<string, HTMLImageElement>;
  itemImages: Record<string, Record<string, HTMLImageElement>>;
}

export const BattleView = ({
  opponent,
  gameState,
  setGameState,
  overlayMode,
  pokemonSheet,
  battleImages,
  itemImages,
}: BattleViewProps) => {
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [opponentHP, setOpponentHP] = useState(100);
  const [playerHP, setPlayerHP] = useState(100);
  const [isIntroAnimating, setIsIntroAnimating] = useState(true);
  const [ballPhase, setBallPhase] = useState<'hidden' | 'thrown' | 'landed' | 'revealed'>('hidden');
  const [battleEndReason, setBattleEndReason] = useState<'WIN' | 'RUN' | 'LOSE' | null>(null);
  const [isBattleEnding, setIsBattleEnding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [activeMenu, setActiveMenu] = useState<'MAIN' | 'ATTACK'>('MAIN');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [battleCatchState, setBattleCatchState] = useState<'idle' | 'thrown' | 'capturing' | 'success' | 'failure'>('idle');
  const [catchAnimationFrame, setCatchAnimationFrame] = useState<number>(0);
  const [catchType, setCatchType] = useState<'success' | 'failure'>('success');



  const opponentData = POKEMON_NPC_BASES.find(p => p.spriteName === opponent.spriteName);
  const opponentName = opponent.name || opponentData?.name || 'Wild Pokémon';

  const partnerId = gameState.activePartnerId;
  const partnerData = partnerId ? POKEMON_NPC_BASES.find(p => p.spriteName === partnerId) : null;
  const partnerName = partnerData?.name || 'PLAYER';

  const playerMoves = useMemo(() => getMovesForPokemon(partnerData), [partnerData]);
  const opponentMoves = useMemo(() => getMovesForPokemon(opponentData), [opponentData]);

  const habitat = opponent.movementHabitat === 'water' ? 'water' : 'grass';
  const enemyBase = battleImages[`${habitat}-battlebase`]?.src || `/battle/${habitat}-battlebase.png`;
  const playerBase = battleImages[`${habitat}-player-battlebase`]?.src || `/battle/${habitat}-player-battlebase.png`;

  // Start intro sequence
  useEffect(() => {
    let isMounted = true;
    setBattleLog([`A wild ${opponentName} appeared!`]);
    
    const sequence = async () => {
      if (!isMounted) return;

      setIsIntroAnimating(true);
      setIsProcessing(true);
      setBallPhase('hidden');
      
      await new Promise(r => setTimeout(r, 600));
      if (!isMounted) return;
      
      setBattleLog(prev => {
        if (prev.includes(`Go! ${partnerName}!`)) return prev;
        return [...prev, `Go! ${partnerName}!`];
      });
      setBallPhase('thrown');
      
      await new Promise(r => setTimeout(r, 600));
      if (!isMounted) return;
      setBallPhase('landed');
      
      await new Promise(r => setTimeout(r, 400));
      if (!isMounted) return;
      setBallPhase('revealed');
      
      await new Promise(r => setTimeout(r, 500));
      if (!isMounted) return;
      setIsIntroAnimating(false);
      setIsProcessing(false);
    };
    
    sequence();
    return () => { isMounted = false; };
  }, [opponentName, partnerName]);

  const handleRun = useCallback(() => {
    if (isProcessing || isBattleEnding) return;
    setIsProcessing(true);
    setBattleLog(prev => [...prev, "Got away safely!"]);
    setBattleEndReason('RUN');
    setIsBattleEnding(true);
    setTimeout(() => {
      setGameState(prev => ({ ...prev, menuState: 'CLOSED', battleOpponent: null }));
    }, 1500);
  }, [isProcessing, isBattleEnding, setGameState]);

  const handleThrowPokeball = useCallback(() => {
    if (isProcessing || isBattleEnding) return;
    setIsProcessing(true);

    const hpRatio = opponentHP / 100;
    const missingHpRatio = 1 - hpRatio;

    // Use exponential scaling multiplier based on missing health: 
    // Base chance is 25%. grows up to near 75% as hp gets extremely low.
    const baseChance = 0.25;
    const multiplier = Math.pow(3, missingHpRatio);
    const captureChance = Math.min(0.95, baseChance * multiplier);

    const isSuccess = Math.random() < captureChance;

    setCatchType(isSuccess ? 'success' : 'failure');
    setBattleCatchState('thrown');
    setCatchAnimationFrame(0);
    setBattleLog(prev => [...prev, "You threw a POKÉBALL!"]);
  }, [isProcessing, isBattleEnding, opponentHP]);

  const handleCatchAnimationComplete = useCallback(() => {
    if (catchType === 'success') {
      setBattleCatchState('success');
      setBattleLog(prev => [...prev, `Gotcha! ${opponentName} was caught!`]);

      setGameState(prev => {
        const newCaught = [...prev.caughtPokemonIds];
        const newNotifications = [...prev.catchNotifications];
        let newPartnerId = prev.activePartnerId;

        const pokemonSprite = opponent.spriteName;
        const pokemonName = opponent.name || opponentData?.name || 'Wild Pokémon';

        if (pokemonSprite && !newCaught.includes(pokemonSprite)) {
          newCaught.push(pokemonSprite);
          const pokedexIndex = POKEMON_NPC_BASES.findIndex(p => p.spriteName === pokemonSprite);
          const pokedexNumber = pokedexIndex !== -1 ? (pokedexIndex + 1).toString().padStart(3, '0') : '???';

          newNotifications.push({
            pokemonName,
            pokemonSprite,
            pokedexNumber: `#${pokedexNumber}`
          });
        }

        if (!newPartnerId && pokemonSprite) {
          newPartnerId = pokemonSprite;
        }

        return {
          ...prev,
          npcs: prev.npcs.filter(n => n.id !== opponent.id),
          caughtPokemonIds: newCaught,
          catchNotifications: newNotifications,
          activePartnerId: newPartnerId,
          floatingMessages: [
            ...prev.floatingMessages,
            {
              id: Math.random().toString(36).substr(2, 9),
              text: `Caught a ${pokemonName}!`,
              pos: { x: prev.player.pos.x, y: prev.player.pos.y },
              duration: 2000,
              startTime: Date.now()
            }
          ]
        };
      });

      setIsBattleEnding(true);
      setTimeout(() => {
        setGameState(prev => ({ ...prev, menuState: 'CLOSED', battleOpponent: null }));
      }, 2000);

    } else {
      setBattleCatchState('failure');
      const phrase = FAILURE_PHRASES[Math.floor(Math.random() * FAILURE_PHRASES.length)];
      setBattleLog(prev => [...prev, phrase]);

      setTimeout(() => {
        setBattleCatchState('idle');

        // Opponent turn begins
        setTimeout(() => {
          const opponentDamage = Math.floor(Math.random() * 15) + 5;
          const nextPlayerHP = Math.max(0, playerHP - opponentDamage);
          setPlayerHP(nextPlayerHP);

          const move = opponentMoves[Math.floor(Math.random() * opponentMoves.length)];
          setBattleLog(prev => [
            ...prev, 
            `${opponentName} used ${move.toUpperCase()}!`,
            `${partnerName} took ${opponentDamage} damage!`
          ]);

          if (nextPlayerHP <= 0) {
            setTimeout(() => {
              setBattleLog(prev => [...prev, `${partnerName} fainted!`]);
              setBattleEndReason('LOSE');
              setIsBattleEnding(true);
              setTimeout(() => {
                setGameState(prev => ({ 
                  ...prev, 
                  menuState: 'CLOSED', 
                  battleOpponent: null 
                }));
              }, 3500);
            }, 500);
          } else {
            setTimeout(() => {
              setIsProcessing(false);
            }, 500);
          }
        }, 1000);
      }, 1000);
    }
  }, [catchType, opponentName, opponentMoves, opponent, opponentData, setGameState, playerHP, partnerName]);

  const completeRef = useRef(handleCatchAnimationComplete);
  useEffect(() => {
    completeRef.current = handleCatchAnimationComplete;
  }, [handleCatchAnimationComplete]);

  useEffect(() => {
    if (battleCatchState !== 'capturing') return;

    const sequence = catchType === 'success' ? CATCH_SUCCESS_SEQUENCE : CATCH_FAILURE_SEQUENCE;
    const intervalTime = 150;
    let currentFrame = 0;

    const interval = setInterval(() => {
      if (currentFrame + 1 >= sequence.length) {
        clearInterval(interval);
        completeRef.current();
      } else {
        currentFrame += 1;
        setCatchAnimationFrame(currentFrame);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [battleCatchState, catchType]);

  const handleAttack = useCallback((moveName: string) => {
    if (isProcessing || isBattleEnding) return;
    setIsProcessing(true);
    setBattleLog(prev => [...prev, `${partnerName} used ${moveName.toUpperCase()}!`]);
    
    // Simple damage
    const damage = Math.floor(Math.random() * 20) + 10;
    setTimeout(() => {
      setOpponentHP(prev => {
        const newHP = Math.max(0, prev - damage);
        return newHP;
      });
      setBattleLog(prev => [...prev, `The wild ${opponentName} took ${damage} damage!`]);
      
      if (opponentHP - damage <= 0) {
        setBattleLog(prev => [...prev, `The wild ${opponentName} fainted!`]);
        setBattleEndReason('WIN');
        setIsBattleEnding(true);
        setTimeout(() => {
          setGameState(prev => ({ 
            ...prev, 
            npcs: prev.npcs.filter(n => n.id !== opponent.id),
            menuState: 'CLOSED', 
            battleOpponent: null 
          }));
        }, 2500);
      } else {
        // Opponent turn
        setTimeout(() => {
          const opponentDamage = Math.floor(Math.random() * 15) + 5;
          const nextPlayerHP = Math.max(0, playerHP - opponentDamage);
          setPlayerHP(nextPlayerHP);
          
          const move = opponentMoves[Math.floor(Math.random() * opponentMoves.length)];
          setBattleLog(prev => [
            ...prev, 
            `${opponentName} used ${move.toUpperCase()}!`,
            `${partnerName} took ${opponentDamage} damage!`
          ]);
          
          if (nextPlayerHP <= 0) {
            setTimeout(() => {
              setBattleLog(prev => [...prev, `${partnerName} fainted!`]);
              setBattleEndReason('LOSE');
              setIsBattleEnding(true);
              setTimeout(() => {
                setGameState(prev => ({ 
                  ...prev, 
                  menuState: 'CLOSED', 
                  battleOpponent: null 
                }));
              }, 2500);
            }, 500);
          } else {
            setTimeout(() => {
              setIsProcessing(false);
            }, 500);
          }
        }, 1000);
      }
    }, 800);
  }, [isProcessing, isBattleEnding, opponentHP, playerHP, opponentName, opponentMoves, partnerName, setGameState, opponent]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBattleEnding || isProcessing) return;

      if (e.key === 'ArrowRight' || e.key === 'd') {
        setSelectedIndex(prev => (prev % 2 === 0 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        setSelectedIndex(prev => (prev % 2 !== 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        setSelectedIndex(prev => (prev < 2 ? prev + 2 : prev));
      } else if (e.key === 'ArrowUp' || e.key === 'w') {
        setSelectedIndex(prev => (prev >= 2 ? prev - 2 : prev));
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z') {
        if (activeMenu === 'MAIN') {
          if (selectedIndex === 0) setActiveMenu('ATTACK');
          if (selectedIndex === 1) handleThrowPokeball();
          if (selectedIndex === 3) handleRun();
        } else {
          if (selectedIndex === 0) handleAttack(playerMoves[0]);
          if (selectedIndex === 1) handleAttack(playerMoves[1]);
          if (selectedIndex === 2) handleAttack(playerMoves[2]);
          if (selectedIndex === 3) setActiveMenu('MAIN');
        }
      } else if (e.key === 'Backspace' || e.key === 'x' || e.key === 'f') {
        if (activeMenu === 'ATTACK') setActiveMenu('MAIN');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMenu, selectedIndex, isBattleEnding, isProcessing, playerMoves, handleThrowPokeball, handleAttack, handleRun]);

  const isOpponentHidden = battleCatchState === 'capturing' || battleCatchState === 'success';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[100] bg-white flex flex-col items-center p-4 font-mono select-none ${
        overlayMode === 'none' ? 'justify-start md:justify-center' : 'justify-center'
      }`}
      id="battle-view-root"
    >


      <div className="w-full max-w-2xl bg-[#f8f8f0] border-4 border-black relative overflow-hidden flex flex-col aspect-[4/3] shadow-[8px_8px_0px_rgba(0,0,0,0.2)]">
        
        {/* Battle Scene half */}
        <div className="flex-1 relative overflow-hidden flex flex-col" id="battle-scene-wrapper">
          {/* Opponent Status */}
          <BattleStatus 
            name={opponentName} 
            hp={opponentHP} 
            isPlayer={false} 
            overlayMode={overlayMode} 
          />

          {/* Animated sprites and overlay bases */}
          <BattleScene
            opponent={opponent}
            opponentData={opponentData}
            partnerData={partnerData}
            gameState={gameState}
            overlayMode={overlayMode}
            pokemonSheet={pokemonSheet}
            itemImages={itemImages}
            enemyBase={enemyBase}
            playerBase={playerBase}
            isBattleEnding={isBattleEnding}
            battleEndReason={battleEndReason}
            ballPhase={ballPhase}
            battleCatchState={battleCatchState}
            catchAnimationFrame={catchAnimationFrame}
            catchType={catchType}
            isOpponentHidden={isOpponentHidden}
            onCatchThrowComplete={() => setBattleCatchState('capturing')}
          />

          {/* Player Status */}
          <BattleStatus 
            name={partnerName} 
            hp={playerHP} 
            isPlayer={true} 
            overlayMode={overlayMode} 
          />
        </div>

        {/* Messaging and Controls Panel */}
        <BattleControls
          battleLog={battleLog}
          isProcessing={isProcessing}
          isBattleEnding={isBattleEnding}
          activeMenu={activeMenu}
          selectedIndex={selectedIndex}
          playerMoves={playerMoves}
          setActiveMenu={setActiveMenu}
          setSelectedIndex={setSelectedIndex}
          onThrowPokeball={handleThrowPokeball}
          onRun={handleRun}
          onAttack={handleAttack}
        />
        
      </div>
    </motion.div>
  );
};
