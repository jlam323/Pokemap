
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
  dialogue?: string[];
  name?: string;
}

export interface GameState {
  player: Entity;
  npcs: Entity[];
  isTalking: boolean;
  activeDialogue: string[] | null;
  dialogueIndex: number;
}
