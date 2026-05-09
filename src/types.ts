
export enum Habitat {
  GROUND = 'ground',
  WATER = 'water',
  FLYING = 'flying'
}

export enum TileType {
  WALKABLE = 0,
  BLOCKED = 1,
  WATER = 2,
  PORTAL_BACK = 99,
  PORTAL_MIN = 10
}

export enum EntityType {
  PLAYER = 'player',
  NPC = 'npc',
  POKEMON = 'pokemon'
}

export enum MovementType {
  STATIONARY = 'stationary',
  RANDOM = 'random'
}

export enum NPCType {
  STANDARD = 'standard',
  SHOPKEEPER = 'shopkeeper'
}

export enum ActionTrigger {
  START = 'start',
  END = 'end'
}

export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface MapOverlayConfig {
  width: number;
  height: number;
}

export interface MapConfig {
  id: number;
  name: string;
  gridDataFile: string;
  mapImage: string;
  zoomMultiplier?: number;
  spriteScaleMultiplier?: number;
  startPos: Position;
  overlays: {
    none: MapOverlayConfig;
    gbc: MapOverlayConfig;
    gba: MapOverlayConfig;
  };
  groundSpawnCount?: number;
  waterSpawnCount?: number;
  flyingSpawnCount?: number;
}

export interface NPCBase {
  id: string;
  type?: EntityType.NPC | EntityType.POKEMON;
  spriteName: string;
  name: string;
  movementType?: MovementType;
  movementHabitat?: Habitat;
  dialogue?: string[][];
  npcType?: NPCType;
  actionTrigger?: ActionTrigger;
  scale?: number;
  spriteSheet?: {
    name: string;
    index: number;
    spriteWidth?: number;
    spriteHeight?: number;
    padding?: number;
    spacing?: number;
    inset?: number;
  };
}

export interface NPCPlacement {
  npcId: string; // References NPCBase.id
  mapId: number;
  pos: Position;
  dir: Direction;
}

export interface NPCSpriteConfig {
  name: string;
  basePath: string;
  frames: string[];
  scale?: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Position;
  dir: Direction;
  spriteIndex: number;
  isMoving?: boolean;
  isSurfing?: boolean;
  walkFrame?: number;
  dialogue?: string[][];
  dialogueGroupIndex?: number;
  name?: string;
  spriteName?: string;
  movementType?: MovementType;
  movementHabitat?: Habitat;
  movementTimer?: number;
  startPos?: Position;
  targetPos?: Position;
  moveProgress?: number;
  bumpOffset?: Position;
  mapId?: number; // Add mapId to associate NPCs with a map
  npcType?: NPCType;
  isActionActive?: boolean;
  actionTrigger?: ActionTrigger;
  scale?: number;
  spriteSheet?: {
    name: string;
    index: number;
    spriteWidth?: number;
    spriteHeight?: number;
    padding?: number;
    spacing?: number;
    inset?: number;
  };
}

export interface Item {
  id: string;
  name: string;
  pos: Position;
  spriteIndex: number;
  spriteName: string;
  dialogue: string[];
  mapId: number;
  isCollected?: boolean;
  scale?: number;
  isActionActive?: boolean;
  actionFrame?: number;
}

export interface GameState {
  player: Entity;
  npcs: Entity[];
  items: Item[];
  isTalking: boolean;
  talkingNPCId: string | null;
  talkingItemId: string | null;
  activeDialogue: string[] | null;
  dialogueIndex: number;
  currentMapId: number;
  previousMapId: number | null;
  mapReturnPositions: Record<number, Position>; // Track where to return for each map
  collectedItemIds: string[];
  isTransitioning: boolean;
  hasInteractedWithNPC: boolean;
  hasInteractedWithItem: boolean;
}
