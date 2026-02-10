/**
 * Debug panel overlay (toggled with F3).
 * Provides toggles for: full lighting, no-gravity flight mode.
 */
export interface DebugState {
  fullLighting: boolean;
  noGravity: boolean;
}

export class DebugPanel {
  private container: HTMLDivElement;
  private visible = false;
  readonly state: DebugState = {
    fullLighting: false,
    noGravity: false,
  };

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'debug-panel';
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.85)',
      color: '#ccc',
      fontFamily: 'monospace',
      fontSize: '13px',
      padding: '12px 16px',
      borderRadius: '6px',
      border: '1px solid #333',
      zIndex: '9999',
      display: 'none',
      userSelect: 'none',
      minWidth: '220px',
    });

    this.container.innerHTML = `
      <div style="color:#ff9; margin-bottom:8px; font-weight:bold;">DEBUG [F3]</div>
      <label style="display:flex; align-items:center; gap:8px; cursor:pointer; margin-bottom:6px;">
        <input type="checkbox" id="dbg-lighting" />
        <span>Full lighting (L)</span>
      </label>
      <label style="display:flex; align-items:center; gap:8px; cursor:pointer; margin-bottom:6px;">
        <input type="checkbox" id="dbg-gravity" />
        <span>No gravity / fly (G)</span>
      </label>
      <div style="color:#666; margin-top:8px; font-size:11px;">WASD/arrows to fly when gravity off</div>
    `;

    document.body.appendChild(this.container);

    const lightingCb = this.container.querySelector('#dbg-lighting') as HTMLInputElement;
    const gravityCb = this.container.querySelector('#dbg-gravity') as HTMLInputElement;

    lightingCb.addEventListener('change', () => {
      this.state.fullLighting = lightingCb.checked;
    });

    gravityCb.addEventListener('change', () => {
      this.state.noGravity = gravityCb.checked;
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'F3') {
        e.preventDefault();
        this.toggle();
      }
      if (e.code === 'KeyL' && e.altKey) {
        e.preventDefault();
        this.state.fullLighting = !this.state.fullLighting;
        lightingCb.checked = this.state.fullLighting;
      }
      if (e.code === 'KeyG' && e.altKey) {
        e.preventDefault();
        this.state.noGravity = !this.state.noGravity;
        gravityCb.checked = this.state.noGravity;
      }
    });
  }

  private toggle(): void {
    this.visible = !this.visible;
    this.container.style.display = this.visible ? 'block' : 'none';
  }
}
