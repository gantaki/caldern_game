// === Display ===
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const PIXEL_SCALE = 3; // Render at 480x270, display at 1440x810

// === Physics ===
export const FIXED_DT = 1 / 60; // 60 Hz physics
export const MAX_FRAME_TIME = 0.25; // Prevent spiral of death
export const GRAVITY = 600; // pixels/sec²
export const TILE_SIZE = 8;

// === Player ===
export const PLAYER_SPEED = 80; // pixels/sec
export const PLAYER_JUMP_FORCE = -220; // pixels/sec (negative = up)
export const PLAYER_WIDTH = 10;
export const PLAYER_HEIGHT = 14;
export const COYOTE_TIME = 0.08; // seconds
export const JUMP_BUFFER_TIME = 0.1; // seconds
export const CLIMB_SPEED = 60; // pixels/sec on ladders
export const ROPE_SPEED = 70; // pixels/sec on ropes

// === Camera ===
export const CAMERA_LERP = 0.08;
export const CAMERA_DEAD_ZONE_X = 20;
export const CAMERA_DEAD_ZONE_Y = 10;
export const CAMERA_LOOK_AHEAD = 30;

// === Lighting ===
export const AMBIENT_DARKNESS = 0.92; // 0 = full bright, 1 = pitch black
export const PLAYER_LIGHT_RADIUS = 80;
export const PLAYER_LIGHT_INTENSITY = 0.9;
export const LUMBRITE_LIGHT_RADIUS = 40;
export const LUMBRITE_LIGHT_COLOR = 0x5588cc;

// === World ===
export const CHUNK_WIDTH = 32; // tiles
export const CHUNK_HEIGHT = 32; // tiles

// === Colors ===
export const COLOR_BG = 0x0a0a0f;
export const COLOR_LUMBRITE = 0x4477aa;
export const COLOR_LUMBRITE_GLOW = 0x6699cc;

// === Interactive Objects ===
export const INTERACT_RANGE = 20; // pixels — max distance to interact
export const ELEVATOR_SPEED = 40; // pixels/sec
export const NPC_INTERACT_RANGE = 24; // pixels
