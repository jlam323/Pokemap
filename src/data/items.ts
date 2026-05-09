import { Item } from '../types';
import { TILE_SIZE } from '../constants';

export const INITIAL_ITEMS: Item[] = [
  {
    id: 'pokeball-1',
    name: 'Poké Ball',
    pos: { x: TILE_SIZE * 19, y: TILE_SIZE * 35 },
    spriteIndex: 0,
    spriteName: 'pokeball',
    dialogue: ["You found a Poké Ball!", "You open it up...", "Oh no, there was a job application inside!!"],
    mapId: 10, // Kanto
    scale: 1.5
  },
  {
    id: 'pokeball-2',
    name: 'Poké Ball',
    pos: { x: TILE_SIZE * 11, y: TILE_SIZE * 4 },
    spriteIndex: 0,
    spriteName: 'pokeball',
    dialogue: ["You found a Poké Ball!", "It was just lying here on the ground.", "Better keep it safe!",  "(surely that doesn't count as stealing right...?)"],
    mapId: 11, // Pokemon Center
    scale: 1.5
  }
];

export const ITEM_SPRITE_CONFIGS: Record<string, { basePath: string, frames: string[], idleFrame: string, actionSequence: string[] }> = {
  'pokeball': {
    basePath: '/item',
    frames: ['pokeball', 'pokeball-action-1', 'pokeball-action-2', 'pokeball-action-3', 'pokeball-action-4'],
    idleFrame: 'pokeball',
    actionSequence: ['pokeball-action-1', 'pokeball-action-2', 'pokeball-action-1', 'pokeball-action-2', 'pokeball-action-3', 'pokeball-action-4']
  }
};
