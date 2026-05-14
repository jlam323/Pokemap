import { Item, BallSpriteConfig } from '../types';
import { TILE_SIZE } from '../constants';

export const INITIAL_ITEMS: Item[] = [
  {
    id: 'pokeball-1',
    name: 'Job Application',
    description: 'Guess it\'s time to stop loafing around.',
    pos: { x: TILE_SIZE * 19, y: TILE_SIZE * 35 },
    spriteIndex: 0,
    spriteName: 'pokeball',
    dialogue: ["You found a Poké Ball!", "You open it up...", "Oh no, there was a job application inside!!"],
    mapId: 10, // Kanto
    scale: 1.5
  },
  {
    id: 'pokeball-2',
    name: '(Stolen) Poké Ball',
    description: 'Hope no one saw me take this.',
    pos: { x: TILE_SIZE * 11, y: TILE_SIZE * 4 },
    spriteIndex: 0,
    spriteName: 'pokeball',
    dialogue: ["You found a Poké Ball!", "It was just lying here on the ground.", "Better keep it safe!",  "(surely that doesn't count as stealing right...?)"],
    mapId: 11, // Pokemon Center
    scale: 1.5
  }
];

export const ITEM_SPRITE_CONFIGS: Record<string, BallSpriteConfig> = {
  'pokeball': {
    basePath: '/item',
    frames: ['pokeball-sheet'],
    idleFrame: '2',
    actionSequence: ['8', '10', '8', '10', '0', '1'],
    isSheet: true,
    sheetWidth: 13
  }
};

export const THROW_BALL_SPRITE_CONFIGS: Record<string, BallSpriteConfig> = {
  'pokeball': {
    basePath: '/item',
    frames: ['pokeball-sheet'],
    idleFrame: 'pokeball-sheet',
    actionSequence: [],
    isSheet: true,
    sheetWidth: 13
  },
  'greatball': {
    basePath: '/item',
    frames: ['greatball-sheet'],
    idleFrame: 'greatball-sheet',
    actionSequence: [],
    isSheet: true,
    sheetWidth: 13
  },
  'ultraball': {
    basePath: '/item',
    frames: ['ultraball-sheet'],
    idleFrame: 'ultraball-sheet',
    actionSequence: [],
    isSheet: true,
    sheetWidth: 13
  },
  'quickball': {
    basePath: '/item',
    frames: ['quickball-sheet'],
    idleFrame: 'quickball-sheet',
    actionSequence: [],
    isSheet: true,
    sheetWidth: 13
  },
  'timerball': {
    basePath: '/item',
    frames: ['timerball-sheet'],
    idleFrame: 'timerball-sheet',
    actionSequence: [],
    isSheet: true,
    sheetWidth: 13
  },
  'diveball': {
    basePath: '/item',
    frames: ['diveball-sheet'],
    idleFrame: 'diveball-sheet',
    actionSequence: [],
    isSheet: true,
    sheetWidth: 13
  },
  'netball': {
    basePath: '/item',
    frames: ['netball-sheet'],
    idleFrame: 'netball-sheet',
    actionSequence: [],
    isSheet: true,
    sheetWidth: 13
  },
  'luxuryball': {
    basePath: '/item',
    frames: ['luxuryball-sheet'],
    idleFrame: 'luxuryball-sheet',
    actionSequence: [],
    isSheet: true,
    sheetWidth: 13
  },
  'specialball': {
    basePath: '/item',
    frames: ['specialball-sheet'],
    idleFrame: 'specialball-sheet',
    actionSequence: [],
    isSheet: true,
    sheetWidth: 13
  },
  'premierball': {
    basePath: '/item',
    frames: ['premierball-sheet'],
    idleFrame: 'premierball-sheet',
    actionSequence: [],
    isSheet: true,
    sheetWidth: 13
  },
  'masterball': {
    basePath: '/item',
    frames: ['masterball-sheet'],
    idleFrame: 'masterball-sheet',
    actionSequence: [],
    isSheet: true,
    sheetWidth: 13
  }
};

