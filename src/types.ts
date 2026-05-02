
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

export interface Entity {
  id: string;
  type: 'player' | 'npc';
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
}

export interface GameState {
  player: Entity;
  npcs: Entity[];
  isTalking: boolean;
  talkingNPCId: string | null;
  activeDialogue: string[] | null;
  dialogueIndex: number;
  currentMapId: number;
  mapReturnPositions: Record<number, Position>; // Track where to return for each map
  isTransitioning: boolean;
}
