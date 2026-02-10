/**
 * Static or dynamic light source definition.
 * SOLID: Open for extension — new light types can be added without modifying existing code.
 */
export interface LightSource {
  x: number;        // world pixel coords
  y: number;
  radius: number;
  color: number;     // hex RGB
  intensity: number; // 0-1
  pulse?: {          // optional pulse animation
    speed: number;   // radians/sec
    amount: number;  // 0-1 range of variation
  };
  flicker?: boolean; // subtle random flicker
}
