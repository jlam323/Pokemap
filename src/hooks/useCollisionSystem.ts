import { useRef, useCallback } from 'react';
import { Entity, Item } from '../types';
import { toGridKey } from '../lib/gameUtils';

/**
 * Hook to manage the game's collision map.
 * 
 * It maintains a coordinate-based Set of occupied tiles to prevent entities
 * from overlapping or moving into blocked spaces. Coordinates are stored
 * in the format "x,y".
 * 
 * @returns {Object} contains the collisionMapRef and initCollisionMap function.
 */
export function useCollisionSystem() {
  const collisionMapRef = useRef<Set<string>>(new Set());

  /**
   * Initializes the collision map with the positions of the player, NPCs, and uncollected items.
   * Ensures all stored coordinates are rounded to tile grid boundaries.
   * 
   * @param player - The player entity
   * @param npcs - Array of current NPC entities
   * @param items - Array of current map items
   */
  const initCollisionMap = useCallback((player: Entity, npcs: Entity[], items: Item[]) => {
    const map = new Set<string>();

    map.add(toGridKey(player.pos));
    if (player.targetPos) {
      map.add(toGridKey(player.targetPos));
    }

    npcs.forEach(npc => {
      if (npc.isActionActive) return;

      map.add(toGridKey(npc.pos));
      if (npc.startPos) map.add(toGridKey(npc.startPos));
      if (npc.targetPos) map.add(toGridKey(npc.targetPos));
    });

    items.forEach(item => {
      if (!item.isCollected) {
        map.add(toGridKey(item.pos));
      }
    });

    collisionMapRef.current = map;
  }, []);

  return {
    collisionMapRef,
    initCollisionMap
  };
}

