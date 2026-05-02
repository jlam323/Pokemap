import { Entity } from '../types';
import { TILE_SIZE } from '../constants';

export const DEFAULT_NPC_SCALE = 1.5;

export interface NPCSpriteConfig {
  name: string;
  basePath: string;
  frames: string[];
  scale?: number;
}

export const NPC_SPRITE_CONFIGS: Record<string, NPCSpriteConfig> = {
  'oak': {
    name: 'oak',
    basePath: '/npc/oak',
    scale: 1.5,
    frames: [
      'oak-neutral-down', 'oak-neutral-up', 'oak-neutral-left', 'oak-neutral-right',
      'oak-walk-down', 'oak-walk-up', 'oak-walk-left', 'oak-walk-right'
    ]
  },
  'brock': {
    name: 'brock',
    basePath: '/npc/brock',
    scale: 1.3,
    frames: [
      'brock-neutral-down', 'brock-neutral-up', 'brock-neutral-left', 'brock-neutral-right'
    ]
  },
  'nursejoy': {
    name: 'nursejoy',
    basePath: '/npc/nursejoy',
    scale: 1.5,
    frames: ['nursejoy-neutral-down', 'nursejoy-action']
  }
};

export const INITIAL_NPCS: Entity[] = [
  {
    id: 'npc1',
    type: 'npc',
    pos: { x: TILE_SIZE * 22, y: TILE_SIZE * 27 },
    dir: 'down',
    spriteIndex: 1,
    spriteName: 'oak',
    name: 'Professor Oak',
    movementType: 'random',
    movementTimer: Math.random() * 5000,
    dialogue: [
      ["This world is inhabited by creatures called Pokémon"],
      ["Hey! Wait! Don't go out!", "It's unsafe! Wild Pokémon live in tall grass!"],
      ["...Erm, what was my grandson's name now?"]
    ],
    dialogueGroupIndex: 0,
    mapId: 10
  },
  {
    id: 'npc2',
    type: 'npc',
    pos: { x: TILE_SIZE * 27, y: TILE_SIZE * 33 },
    dir: 'down',
    spriteIndex: 2,
    spriteName: 'brock',
    name: 'Brock',
    movementType: 'stationary',
    dialogue: [
      ["I'm Brock, the Pewter Gym Leader.", "I'm an expert on Rock-type Pokémon."],
      ["I'll use my trusty frying pan...", "as a drying pan!"],
      ["These donuts are great! Jelly-filled are my favorite. Nothing beats a jelly-filled donut!"]
    ],
    dialogueGroupIndex: 0,
    mapId: 10
  },
  {
    id: 'npc3',
    type: 'npc',
    pos: { x: TILE_SIZE * 15, y: TILE_SIZE * 15 },
    dir: 'down',
    spriteIndex: 1,
    spriteName: 'oak',
    name: 'Other Oak',
    movementType: 'random',
    movementTimer: Math.random() * 5000,
    dialogue: [["I am on the second map!"]],
    dialogueGroupIndex: 0,
    mapId: 12
  },
  {
    id: 'nurse-joy',
    type: 'npc',
    pos: { x: TILE_SIZE * 7, y: TILE_SIZE * 2 },
    dir: 'down',
    spriteIndex: 2,
    spriteName: 'nursejoy',
    name: 'Nurse Joy',
    movementType: 'stationary',
    npcType: 'shopkeeper',
    dialogue: [["Welcome to the Pokémon Center!", "We can heal your Pokémon to perfect health.", "We hope to see you again!"]],
    dialogueGroupIndex: 0,
    mapId: 11
  }
];
