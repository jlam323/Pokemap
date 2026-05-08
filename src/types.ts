
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
}

export interface NPCBase {
  id: string;
  type?: 'npc' | 'pokemon';
  spriteName: string;
  name: string;
  movementType?: 'stationary' | 'random';
  dialogue?: string[][];
  npcType?: 'standard' | 'shopkeeper';
  actionTrigger?: 'start' | 'end';
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

export interface Entity {
  id: string;
  type: 'player' | 'npc' | 'pokemon';
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
  movementType?: 'stationary' | 'random';
  movementTimer?: number;
  startPos?: Position;
  targetPos?: Position;
  moveProgress?: number;
  bumpOffset?: Position;
  mapId?: number; // Add mapId to associate NPCs with a map
  npcType?: 'standard' | 'shopkeeper';
  isActionActive?: boolean;
  actionTrigger?: 'start' | 'end';
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
  debugSprites?: boolean;
}
