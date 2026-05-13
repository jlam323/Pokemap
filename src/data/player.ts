import { Entity, EntityType } from '../types';
import { TILE_SIZE } from '../constants';

export const PLAYER_SCALE = 1.75;
export const SURF_SCALE_MODIFIER = 1.25;

export interface PlayerSpriteConfig {
  basePath: string;
  frames: string[];
}

export const PLAYER_SPRITE_CONFIG: PlayerSpriteConfig = {
  basePath: '/player',
  frames: [
    'neutral-down', 'neutral-up', 'neutral-left', 'neutral-right',
    'walking-down-1', 'walking-down-2',
    'walking-up-1', 'walking-up-2',
    'walking-left-1', 'walking-left-2',
    'walking-right-1', 'walking-right-2',
    'surf-down-1', 'surf-down-2',
    'surf-up-1', 'surf-up-2',
    'surf-left-1', 'surf-left-2',
    'surf-right-1', 'surf-right-2',
    'throw-down', 'throw-up', 'throw-left', 'throw-right'
  ]
};

export const INITIAL_PLAYER: Entity = {
  id: 'player',
  type: EntityType.PLAYER,
  pos: { x: TILE_SIZE * 24, y: TILE_SIZE * 31 },
  dir: 'down',
  spriteIndex: 0,
  scale: PLAYER_SCALE,
  isMoving: false,
  walkFrame: 0,
};
