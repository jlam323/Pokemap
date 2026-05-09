import { Entity, Position, Habitat, TileType, MapConfig, Item, EntityType } from '../types';
import { TILE_SIZE } from '../constants';
import { createEntityFromBase } from '../data/npcs';
import { POKEMON_NPC_BASES } from '../data/pokemon';
import mapTileGridMain from '../data/mapTileGrid/kanto.json';
import mapTileGridPokeCenter from '../data/mapTileGrid/pokemon-center.json';
import mapTileGridPokeMart from '../data/mapTileGrid/pokemart.json';
import mapTileGridTeamRocket from '../data/mapTileGrid/team-rocket-game-corner.json';
import mapTileGridPetalburg from '../data/mapTileGrid/petalburg-city.json';

/**
 * Map of grid data file names to their corresponding tile grid JSON data.
 */
export const TILE_GRIDS: Record<string, number[][]> = {
  'kanto.json': mapTileGridMain,
  'pokemon-center.json': mapTileGridPokeCenter,
  'pokemart.json': mapTileGridPokeMart,
  'team-rocket-game-corner.json': mapTileGridTeamRocket,
  'petalburg-city.json': mapTileGridPetalburg
};

/**
 * Spawns dynamic Pokemon NPCs on a map based on its configuration.
 * 
 * It scans the map's tile grid for valid spawn points matching the specified habitat 
 * (Ground, Water, or Flying). It respects existing entity collisions.
 * 
 * @param map - The configuration for the target map.
 * @param existingNpcs - Fixed NPCs already on the map.
 * @param player - The player entity.
 * @param items - Items currently on the map.
 * @param collisionMap - Set of current occupied coordinates.
 * @returns {Entity[]} An array of dynamically generated Pokemon entities.
 */
export const spawnDynamicPokemon = (map: MapConfig, existingNpcs: Entity[], player: Entity, items: Item[], collisionMap: Set<string>) => {
  const dynamicSpawns: Entity[] = [];
  const tileGrid = TILE_GRIDS[map.gridDataFile];
  if (!tileGrid) return dynamicSpawns;

  const currentCollisionMap = new Set(collisionMap);

  const spawnCounts = {
    [Habitat.GROUND]: map.groundSpawnCount || 0,
    [Habitat.WATER]: map.waterSpawnCount || 0,
    [Habitat.FLYING]: map.flyingSpawnCount || 0,
  };

  const pokemonByHabitat = {
    [Habitat.GROUND]: POKEMON_NPC_BASES.filter(p => !p.movementHabitat || p.movementHabitat === Habitat.GROUND),
    [Habitat.WATER]: POKEMON_NPC_BASES.filter(p => p.movementHabitat === Habitat.WATER),
    [Habitat.FLYING]: POKEMON_NPC_BASES.filter(p => p.movementHabitat === Habitat.FLYING),
  };

  Object.entries(spawnCounts).forEach(([habitat, count]) => {
    const habitatType = habitat as Habitat;
    const availablePokemon = pokemonByHabitat[habitatType];
    if (availablePokemon.length === 0 || count <= 0) return;

    const validTiles: Position[] = [];
    tileGrid.forEach((row, y) => {
      row.forEach((tileType, x) => {
        let ok = false;
        if (habitatType === Habitat.GROUND) ok = (tileType === TileType.WALKABLE);
        else if (habitatType === Habitat.WATER) ok = (tileType === TileType.WATER);
        else if (habitatType === Habitat.FLYING) ok = (tileType === TileType.WALKABLE || tileType === TileType.WATER);

        if (ok) {
          const posX = x * TILE_SIZE;
          const posY = y * TILE_SIZE;
          if (!currentCollisionMap.has(`${posX},${posY}`)) {
            validTiles.push({ x: posX, y: posY });
          }
        }
      });
    });

    for (let i = 0; i < count && validTiles.length > 0; i++) {
      const tileIndex = Math.floor(Math.random() * validTiles.length);
      const pos = validTiles.splice(tileIndex, 1)[0];
      const pokemonBase = availablePokemon[Math.floor(Math.random() * availablePokemon.length)];
      
      const newPokemon = createEntityFromBase(
        pokemonBase, 
        pos, 
        'down', 
        map.id, 
        existingNpcs.length + dynamicSpawns.length + 500
      );
      dynamicSpawns.push(newPokemon);
      currentCollisionMap.add(`${pos.x},${pos.y}`);
    }
  });

  return dynamicSpawns;
};
