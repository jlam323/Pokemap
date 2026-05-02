import { Entity, NPCBase, NPCPlacement } from '../types';
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
    scale: 1.4,
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
  },
  'mysterygift': {
    name: 'mysterygift',
    basePath: '/npc/pokemart',
    scale: 1.4,
    frames: ['mysterygift-neutral-down', 'mysterygift-action']
  },
  'cashier': {
    name: 'cashier',
    basePath: '/npc/pokemart',
    scale: 1.4,
    frames: ['cashier-neutral-right', 'cashier-action']
  },
  
};

export const NPC_BASES: NPCBase[] = [
  {
    id: 'oak',
    spriteName: 'oak',
    name: 'Professor Oak',
    movementType: 'random',
    dialogue: [
      ["This world is inhabited by creatures called Pokémon"],
      ["Hey! Wait! Don't go out!", "It's unsafe! Wild Pokémon live in tall grass!"],
      ["...Erm, what was my grandson's name now?"]
    ]
  },
  {
    id: 'brock',
    spriteName: 'brock',
    name: 'Brock',
    movementType: 'stationary',
    dialogue: [
      ["I'm Brock, the Pewter Gym Leader.", "I'm an expert on Rock-type Pokémon."],
      ["I'll use my trusty frying pan...", "as a drying pan!"],
      ["These donuts are great! Jelly-filled are my favorite. Nothing beats a jelly-filled donut!"]
    ]
  },
  {
    id: 'nursejoy',
    spriteName: 'nursejoy',
    name: 'Nurse Joy',
    movementType: 'stationary',
    npcType: 'shopkeeper',
    actionTrigger: 'end',
    dialogue: [["Welcome to the Pokémon Center!", "We can heal your Pokémon to perfect health.", "We hope to see you again!"]]
  },
  {
    id: 'mysterygift',
    spriteName: 'mysterygift',
    name: 'Delivery Man',
    movementType: 'stationary',
    npcType: 'shopkeeper',
    actionTrigger: 'start',
    dialogue: [["Hey there, there are no mystery gifts today. Come back again another time."]]
  },
  {
    id: 'cashier',
    spriteName: 'cashier',
    name: 'PokeMart Employee',
    movementType: 'stationary',
    npcType: 'shopkeeper',
    actionTrigger: 'start',
    dialogue: [["Sorry but we're currently sold out of everything.", "...we'll probably be out of stock forever but you could always check again tomorrow!"]]
  }
];

export const NPC_PLACEMENTS: NPCPlacement[] = [
  // Pallet Town / Kanto
  { npcId: 'oak', mapId: 10, pos: { x: TILE_SIZE * 22, y: TILE_SIZE * 27 }, dir: 'down' },
  { npcId: 'brock', mapId: 10, pos: { x: TILE_SIZE * 27, y: TILE_SIZE * 33 }, dir: 'down' },
  // Pokemon Center
  { npcId: 'nursejoy', mapId: 11, pos: { x: TILE_SIZE * 7, y: TILE_SIZE * 2 }, dir: 'down' },
  // PokeMart
  { npcId: 'mysterygift', mapId: 12, pos: { x: TILE_SIZE * 1, y: TILE_SIZE * 3 }, dir: 'down' },
  { npcId: 'cashier', mapId: 12, pos: { x: TILE_SIZE * 2, y: TILE_SIZE * 2 }, dir: 'right' }
];

export const INITIAL_NPCS: Entity[] = NPC_PLACEMENTS.map((placement, index) => {
  const base = NPC_BASES.find(b => b.id === placement.npcId);
  if (!base) throw new Error(`NPC Template with id ${placement.npcId} not found`);

  return {
    id: `${placement.npcId}-${placement.mapId}`,
    type: 'npc',
    pos: placement.pos,
    dir: placement.dir,
    spriteIndex: index + 1,
    spriteName: base.spriteName,
    name: base.name,
    movementType: base.movementType,
    movementTimer: base.movementType === 'random' ? Math.random() * 5000 : undefined,
    dialogue: base.dialogue,
    dialogueGroupIndex: 0,
    mapId: placement.mapId,
    npcType: base.npcType,
    actionTrigger: base.actionTrigger
  };
});
