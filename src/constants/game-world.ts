import type { Direction } from "../types/common";

export const TILE_SIZE = 64;
export const COLS = 31;
export const ROWS = 18;

export const GAME_WORLD_WIDTH = COLS * TILE_SIZE - TILE_SIZE * 2;
export const GAME_WORLD_HEIGHT = ROWS * TILE_SIZE - TILE_SIZE * 2;

export const OFFSET_X = TILE_SIZE/2;
export const OFFSET_Y = TILE_SIZE/2;

export const DEFAULT_POS_X = TILE_SIZE*10;
export const DEFAULT_POS_Y = TILE_SIZE*10;

export const DIRECTION_KEYS: Record<string, Direction> = {
    KeyW: "UP",
    KeyS: "DOWN",
    KeyA: "LEFT",
    KeyD: "RIGHT",
    ArrowUp: "UP",
    ArrowDown: "DOWN",
    ArrowLeft: "LEFT",
    ArrowRight: "RIGHT",
}