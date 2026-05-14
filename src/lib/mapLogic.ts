import { Entity, Item, GameState, Position, MapConfig } from '../types';
import { TILE_SIZE } from '../constants';
import { INITIAL_NPCS } from '../data/npcs';
import { INITIAL_ITEMS } from '../data/items';
import { ALL_MAPS } from '../data/maps';
import { spawnDynamicPokemon } from './gameLogic';

export interface MapData {
  npcs: Entity[];
  items: Item[];
  playerPos: Position;
  collisionMap: Set<string>;
}

/**
 * Prepares all necessary data for a specific map.
 * 
 * This includes filtering standard NPCs and items for the map, 
 * calculating the player's spawn position (taking into account return points),
 * constructing the initial collision map, and spawning dynamic Pokemon.
 * 
 * @param mapId - The ID of the map to prepare.
 * @param collectedItemIds - List of items already picked up by the player.
 * @param player - The player entity (used for collision check during spawning).
 * @param spawnPos - Optional specific position to spawn the player.
 * @param mapReturnPositions - Record of previously visited maps and the exit positions.
 * @returns {MapData} Normalized data object containing NPCs, items, position, and collision set.
 */
export function prepareMapData(
  mapId: number,
  collectedItemIds: string[],
  player: Entity,
  spawnPos?: Position,
  mapReturnPositions?: Record<number, Position>
): MapData {
  const targetMap = ALL_MAPS.find(m => m.id === mapId) || ALL_MAPS[0];
  
  const filteredNpcs = INITIAL_NPCS.filter(npc => npc.mapId === targetMap.id).map(npc => ({ ...npc }));
  const filteredItems = INITIAL_ITEMS.filter(item => 
    item.mapId === targetMap.id
  ).map(item => ({ ...item }));
  
  const playerPos = spawnPos || (mapReturnPositions?.[mapId] ? { ...mapReturnPositions[mapId] } : {
    x: targetMap.startPos.x * TILE_SIZE,
    y: targetMap.startPos.y * TILE_SIZE
  });

  const collisionMap = new Set<string>();
  collisionMap.add(`${playerPos.x},${playerPos.y}`);
  filteredNpcs.forEach(n => collisionMap.add(`${n.pos.x},${n.pos.y}`));
  filteredItems.forEach(i => collisionMap.add(`${i.pos.x},${i.pos.y}`));

  const dynamicPokemon = spawnDynamicPokemon(
    targetMap, 
    filteredNpcs, 
    { ...player, pos: playerPos }, 
    filteredItems, 
    collisionMap
  );
  
  const allNpcs = [...filteredNpcs, ...dynamicPokemon];

  return {
    npcs: allNpcs,
    items: filteredItems,
    playerPos,
    collisionMap
  };
}
