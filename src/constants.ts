export const TILE_SIZE = 32;
export const MOVE_DURATION = 200;
export const BUMP_DURATION = 150;
export const BUMP_DISTANCE = 2;

export const POKEMON_SPRITE_SHEET = 'gen-1-overworld-pokemon';
export const DEFAULT_POKEMON_SPRITE_SIZE = 32;
export const DEFAULT_NPC_SCALE = 1.5;
export const DEFAULT_POKEMON_SCALE = 1.75;

export const CATCH_SUCCESS_SEQUENCE = [1, 0, 8, 10, 2, 2, 8, 10, 2, 2, 11, 12, 12, 12];
export const CATCH_FAILURE_SEQUENCE = [1, 0,  8, 10, 2, 2, 8, 10, 2, 3, 4, 5, 2, 5, 0, 1, 1];

export const BALL_TYPES = [
  'pokeball', 'greatball', 'ultraball', 'quickball', 'timerball', 
  'diveball', 'netball', 'luxuryball', 'specialball', 'premierball', 'masterball'
];

export const SPRITE_SHEET_DEFAULTS: Record<string, { padding: number; spacing: number; inset: number; defaultWidth: number; defaultHeight: number }> = {
  [POKEMON_SPRITE_SHEET]: { 
    padding: 0, 
    spacing: 0.90, 
    inset: 1,
    defaultWidth: DEFAULT_POKEMON_SPRITE_SIZE,
    defaultHeight: DEFAULT_POKEMON_SPRITE_SIZE
  }
};
