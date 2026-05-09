import { MapConfig } from '../types';

export const ALL_MAPS: MapConfig[] = [
  {
    id: 10,
    name: "Kanto Region",
    gridDataFile: "kanto.json",
    mapImage: "map/kanto-map.png",
    spriteScaleMultiplier: 1.0,
    startPos: { x: 24, y: 31 },
    overlays: {
      none: { width: 100, height: 60 },
      gbc: { width: 100, height: 60 },
      gba: { width: 100, height: 60 }
    },
    groundSpawnCount: 15,
    waterSpawnCount: 15,
    flyingSpawnCount: 7
  },
  {
    id: 11,
    name: "Pokemon Center",
    gridDataFile: "pokemon-center.json",
    mapImage: "map/pokemon-center-map.png",
    zoomMultiplier: 1.5,
    spriteScaleMultiplier: 0.85,
    startPos: { x: 6, y: 8 },
    overlays: {
      none: { width: 14, height: 9 },
      gbc: { width: 14, height: 9 },
      gba: { width: 14, height: 9 }
    }
  },
  {
    id: 12,
    name: "PokeMart",
    gridDataFile: "pokemart.json",
    mapImage: "map/pokemart-map.png",
    zoomMultiplier: 1.5,
    spriteScaleMultiplier: 0.85,
    startPos: { x: 4, y: 7 },
    overlays: {
      none: { width: 11, height: 9 },
      gbc: { width: 11, height: 9 },
      gba: { width: 11, height: 9 }
    }
  },
  {
    id: 13,
    name: "Team Rocket Game Corner",
    gridDataFile: "team-rocket-game-corner.json",
    mapImage: "map/team-rocket-game-corner-map.png",
    zoomMultiplier: 1.2,
    spriteScaleMultiplier: 0.95,
    startPos: { x: 20, y: 23 },
    overlays: {
      none: { width: 24, height: 26 },
      gbc: { width: 24, height: 26 },
      gba: { width: 24, height: 26 }
    }
  },
  {
    id: 14,
    name: "Petalburg City",
    gridDataFile: "petalburg-city.json",
    mapImage: "map/petalburg-city-map.png",
    zoomMultiplier: 1.0,
    spriteScaleMultiplier: 1.0,
    startPos: { x: 20, y: 17 },
    overlays: {
      none: { width: 30, height: 30 },
      gbc: { width: 30, height: 30 },
      gba: { width: 30, height: 30 }
    },
    groundSpawnCount: 4,
    waterSpawnCount: 2,
    flyingSpawnCount: 4
  }
];

export const TOGGLEABLE_MAPS: MapConfig[] = ALL_MAPS.filter(map => [10, 14].includes(map.id));
