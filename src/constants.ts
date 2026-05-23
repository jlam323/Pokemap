export const TILE_SIZE = 32;
export const MOVE_DURATION = 200;
export const BUMP_DURATION = 150;
export const BUMP_DISTANCE = 2;

export const POKEMON_SPRITE_SHEET = 'gen-1-overworld-pokemon';
export const DEFAULT_POKEMON_SPRITE_SIZE = 32;
export const DEFAULT_NPC_SCALE = 1.5;
export const DEFAULT_POKEMON_SCALE = 1.75;

export const CATCH_SUCCESS_SEQUENCE = [1, 0, 8, 10, 2, 2, 8, 10, 2, 2, 11, 12, 12, 12];
export const CATCH_FAILURE_SEQUENCE = [1, 0, 8, 10, 2, 3, 4, 5, 2, 3, 4, 5, 2, 5, 0, 1, 1];

export const FAILURE_PHRASES = [
  "Oh no! The Pokémon broke free!",
  "Aww! It appeared to be caught!",
  "Shoot! It was so close, too!"
];

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

// Pokemon types
export const TYPE_COLORS: Record<string, string> = {
  Normal: 'bg-[#A8A878]',
  Fire: 'bg-[#F08030]',
  Water: 'bg-[#6890F0]',
  Electric: 'bg-[#F8D030]',
  Grass: 'bg-[#78C850]',
  Ice: 'bg-[#98D8D8]',
  Fighting: 'bg-[#C03028]',
  Poison: 'bg-[#A040A0]',
  Ground: 'bg-[#E0C068]',
  Flying: 'bg-[#A890F0]',
  Psychic: 'bg-[#F85888]',
  Bug: 'bg-[#A8B820]',
  Rock: 'bg-[#B8A038]',
  Ghost: 'bg-[#705898]',
  Dragon: 'bg-[#7038F8]',
  Steel: 'bg-[#B8B8D0]',
  Fairy: 'bg-[#EE99AC]',
};

export const TYPE_MOVES: Record<string, string[]> = {
  Normal: ['Tackle', 'Double-Edge', 'Hyper Beam'],
  Fire: ['Fireblast', 'Flame Wheel', 'Flamethrower'],
  Water: ['Water Gun', 'Bubble', 'Water Pulse'],
  Electric: ['Thundershock', 'Thunder-Wave', 'Thunderbolt'],
  Grass: ['Vine Whip', 'Razor Leaf', 'Leaf Blade'],
  Ice: ['Ice Shard', 'Ice Beam', 'Powder Snow'],
  Fighting: ['Close Combat', 'Low Kick', 'Brick Break'],
  Poison: ['Toxic', 'Sludge', 'Sludge Bomb'],
  Ground: ['Earthquake', 'Mud-Slap', 'Bone Rush'],
  Flying: ['Aerial Ace', 'Fly', 'Air Slash'],
  Psychic: ['Psychic', 'Psybeam', 'Confusion'],
  Bug: ['Bug Bite', 'Silver Wind', 'X-Scissor'],
  Rock: ['Rock Throw', 'Rock Tomb', 'Rock Slide'],
  Ghost: ['Lick', 'Night Shade', 'Shadow Ball'],
  Dragon: ['Outrage', 'Dragon Claw', 'Draco Meteor'],
  Steel: ['Metal Claw', 'Iron Head', 'Flash Cannon'],
  Fairy: ['Fairy Wind', 'Disarming Voice', 'Moonblast'],
};
