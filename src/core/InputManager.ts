export type Action = 'left' | 'right' | 'up' | 'down' | 'jump' | 'interact' | 'menu' | 'map';

const DEFAULT_BINDINGS: Record<Action, string[]> = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  jump: ['Space', 'KeyZ'],
  interact: ['KeyE', 'KeyX'],
  menu: ['Escape'],
  map: ['Tab', 'KeyM'],
};

export class InputManager {
  private keysDown = new Set<string>();
  private keysPressed = new Set<string>();
  private keysReleased = new Set<string>();
  private bindings: Record<Action, string[]>;

  constructor(bindings?: Record<Action, string[]>) {
    this.bindings = bindings ?? { ...DEFAULT_BINDINGS };
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('keydown', (e) => {
      if (!this.keysDown.has(e.code)) {
        this.keysPressed.add(e.code);
      }
      this.keysDown.add(e.code);
      e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
      this.keysReleased.add(e.code);
      e.preventDefault();
    });

    // Prevent keys sticking when window loses focus
    window.addEventListener('blur', () => {
      this.keysDown.clear();
    });
  }

  /** Call at the END of each frame to reset per-frame state */
  endFrame(): void {
    this.keysPressed.clear();
    this.keysReleased.clear();
  }

  /** Is action currently held down */
  isDown(action: Action): boolean {
    return this.bindings[action].some((key) => this.keysDown.has(key));
  }

  /** Was action just pressed this frame */
  isPressed(action: Action): boolean {
    return this.bindings[action].some((key) => this.keysPressed.has(key));
  }

  /** Was action just released this frame */
  isReleased(action: Action): boolean {
    return this.bindings[action].some((key) => this.keysReleased.has(key));
  }

  /** Get horizontal axis: -1 (left), 0 (none), 1 (right) */
  getAxisX(): number {
    let x = 0;
    if (this.isDown('left')) x -= 1;
    if (this.isDown('right')) x += 1;
    return x;
  }

  /** Get vertical axis: -1 (up), 0 (none), 1 (down) */
  getAxisY(): number {
    let y = 0;
    if (this.isDown('up')) y -= 1;
    if (this.isDown('down')) y += 1;
    return y;
  }
}
