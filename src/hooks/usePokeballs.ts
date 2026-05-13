import React, { useState, useCallback, useRef, MutableRefObject } from 'react';
import { GameState, Pokeball, EntityType, Entity, Item } from '../types';
import { CATCH_SUCCESS_SEQUENCE, CATCH_FAILURE_SEQUENCE, BALL_TYPES, TILE_SIZE } from '../constants';
import { isAtPos } from '../lib/gameUtils';

const MAX_DISTANCE = 10;
const THROW_COOLDOWN = 500;
const FRAME_DURATION = 150;
const CATCH_PROBABILITY = 0.6;

interface usePokeballsProps {
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  stateRef: MutableRefObject<GameState>;
  playerRef: MutableRefObject<Entity>;
  npcsRef: MutableRefObject<Entity[]>;
  itemsRef: MutableRefObject<Item[]>;
  initCollisionMap: (player: Entity, npcs: Entity[], items: Item[]) => void;
}

const FAILURE_PHRASES = [
  "Oh no! The Pokémon broke free!",
  "Aww! It appeared to be caught!",
  "Shoot! It was so close, too!"
];

/**
 * Hook to manage throwing and tracking pokeballs.
 */
export function usePokeballs({ 
  setGameState,
  stateRef,
  playerRef, 
  npcsRef, 
  itemsRef, 
  initCollisionMap 
}: usePokeballsProps) {
  const lastThrowTimeRef = useRef<number>(0);
  const pokeballsRef = useRef<Pokeball[]>([]);

  const spawnPokeball = useCallback(() => {
    const now = Date.now();
    if (now - lastThrowTimeRef.current < THROW_COOLDOWN) return;

    const player = playerRef.current;
    const currentState = stateRef.current;
    if (currentState.menuState !== 'CLOSED') return; // Don't throw if menu is open

    // Pokeballs are now infinite
    lastThrowTimeRef.current = now;
    const { x, y } = player.pos;
    const dir = player.dir;

    const targetX = x + (dir === 'left' ? -TILE_SIZE * MAX_DISTANCE : dir === 'right' ? TILE_SIZE * MAX_DISTANCE : 0);
    const targetY = y + (dir === 'up' ? -TILE_SIZE * MAX_DISTANCE : dir === 'down' ? TILE_SIZE * MAX_DISTANCE : 0);

    const randomBallType = BALL_TYPES[Math.floor(Math.random() * BALL_TYPES.length)];

    const newBall: Pokeball = {
      id: Math.random().toString(36).substr(2, 9),
      pos: { x, y },
      startPos: { x, y },
      targetPos: { x: targetX, y: targetY },
      dir,
      progress: 0,
      isCollided: false,
      ballType: randomBallType
    };

    pokeballsRef.current.push(newBall);
    
    // Force a re-render
    setGameState(prev => ({
      ...prev,
      pokeballs: [...pokeballsRef.current]
    }));
  }, [playerRef, setGameState, stateRef]);

  const updatePokeballs = useCallback((dt: number) => {
    if (pokeballsRef.current.length === 0) return;

    let changed = false;
    const updatedBalls = pokeballsRef.current.filter(ball => {
      if (ball.isCapturing) {
        ball.captureFrame = (ball.captureFrame || 0) + (dt / FRAME_DURATION);
        const sequence = ball.captureType === 'success' ? CATCH_SUCCESS_SEQUENCE : CATCH_FAILURE_SEQUENCE;
        
        // Trigger VFX slightly before the last frame for a smoother transition
        if (!ball.vfxTriggered && ball.captureFrame >= sequence.length - 2) {
          ball.vfxTriggered = true;
          const isSuccess = ball.captureType === 'success';
          
          setGameState(prev => ({
            ...prev,
            vfx: [
              ...prev.vfx,
              {
                id: Math.random().toString(36).substr(2, 9),
                type: isSuccess ? 'success' : 'failure',
                pos: { ...ball.pos },
                startTime: Date.now(),
                duration: 800 // Faster VFX
              }
            ]
          }));
        }

        if (ball.captureFrame >= sequence.length) {
          if (ball.captureType === 'success') {
            const hitNpc = npcsRef.current.find(n => n.id === ball.hitEntityId);
            const pokemonName = hitNpc?.name || 'Pokémon';
            const pokemonSprite = hitNpc?.spriteName || '';
            
            // Update the ref directly for the engine/renderer
            npcsRef.current = npcsRef.current.filter(n => n.id !== ball.hitEntityId);

            // Update collision map
            initCollisionMap(playerRef.current, npcsRef.current, itemsRef.current);

            // Captured! Remove pokemon from state and add to caught list
            setGameState(prev => {
              const newCaught = [...prev.caughtPokemonIds];
              if (pokemonSprite && !newCaught.includes(pokemonSprite)) {
                newCaught.push(pokemonSprite);
              }

              return {
                ...prev,
                npcs: prev.npcs.filter(n => n.id !== ball.hitEntityId),
                caughtPokemonIds: newCaught,
                floatingMessages: [
                  ...prev.floatingMessages,
                  {
                    id: Math.random().toString(36).substr(2, 9),
                    text: `Caught a ${pokemonName}!`,
                    pos: { ...ball.pos },
                    duration: 2000,
                    startTime: Date.now()
                  }
                ]
              };
            });
          } else {
            const phrase = FAILURE_PHRASES[Math.floor(Math.random() * FAILURE_PHRASES.length)];
            
            // Release from action state in ref
            npcsRef.current = npcsRef.current.map(n => n.id === ball.hitEntityId ? { ...n, isActionActive: false } : n);

            // Restore collision map
            initCollisionMap(playerRef.current, npcsRef.current, itemsRef.current);

            // Failed! Release pokemon in state
            setGameState(prev => ({
              ...prev,
              npcs: prev.npcs.map(n => n.id === ball.hitEntityId ? { ...n, isActionActive: false } : n),
              floatingMessages: [
                ...prev.floatingMessages,
                {
                  id: Math.random().toString(36).substr(2, 9),
                  text: phrase,
                  pos: { ...ball.pos },
                  duration: 3000,
                  startTime: Date.now()
                }
              ]
            }));
          }
          changed = true;
          return false;
        }
        return true;
      }

      if (ball.isCollided) return false;

      // Update progress
      ball.progress += (dt / 650); 
      
      if (ball.progress >= 1) {
        ball.progress = 1;
        ball.isCollided = true;
        changed = true;
        return false;
      }

      // Calculate current pos
      const currentX = ball.startPos.x + (ball.targetPos.x - ball.startPos.x) * ball.progress;
      const currentY = ball.startPos.y + (ball.targetPos.y - ball.startPos.y) * ball.progress;
      ball.pos = { x: currentX, y: currentY };

      // Round to grid to check for pokemon collisions
      const gridX = Math.round(currentX / TILE_SIZE) * TILE_SIZE;
      const gridY = Math.round(currentY / TILE_SIZE) * TILE_SIZE;

      // Check for collision with Pokemon NPCs
      const hitPokemon = npcsRef.current.find(npc => 
        npc.type === EntityType.POKEMON && 
        !npc.isActionActive &&
        !pokeballsRef.current.some(b => b.isCapturing && b.hitEntityId === npc.id) &&
        isAtPos(npc.pos, { x: gridX, y: gridY })
      );

      if (hitPokemon) {
        ball.isCollided = true;
        ball.hitEntityId = hitPokemon.id;
        ball.isCapturing = true;
        ball.captureFrame = 0;
        
        // Masterball has 100% success rate
        const successProb = ball.ballType === 'masterball' ? 1.0 : CATCH_PROBABILITY;
        ball.captureType = Math.random() < successProb ? 'success' : 'failure';
        
        ball.pos = { ...hitPokemon.pos };
        changed = true;

        // Hide pokemon while capturing in ref for the engine
        npcsRef.current = npcsRef.current.map(n => n.id === hitPokemon.id ? { ...n, isActionActive: true } : n);

        // Hide pokemon while capturing in state
        setGameState(prev => ({
          ...prev,
          npcs: prev.npcs.map(n => n.id === hitPokemon.id ? { ...n, isActionActive: true } : n)
        }));

        return true;
      }

      return true;
    });

    if (updatedBalls.length !== pokeballsRef.current.length || changed) {
      pokeballsRef.current = updatedBalls;
      setGameState(prev => ({
        ...prev,
        pokeballs: [...updatedBalls]
      }));
    }
  }, [setGameState, npcsRef, itemsRef, initCollisionMap, playerRef]);

  return {
    spawnPokeball,
    updatePokeballs,
    pokeballsRef
  };
}
