
export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

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
}

export interface GameState {
  player: Entity;
  npcs: Entity[];
  isTalking: boolean;
  talkingNPCId: string | null;
  activeDialogue: string[] | null;
  dialogueIndex: number;
}
