/**
 * Simple dialogue overlay — shows NPC name + text at the bottom of the screen.
 * Advances or dismisses on interact key press.
 */
export class DialogueManager {
  private container: HTMLDivElement;
  private nameEl: HTMLSpanElement;
  private textEl: HTMLDivElement;
  private active = false;
  private onDismiss: (() => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'dialogue-box';
    Object.assign(this.container.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(5, 5, 10, 0.92)',
      color: '#ddd',
      fontFamily: 'monospace',
      fontSize: '14px',
      padding: '12px 20px',
      borderRadius: '4px',
      border: '1px solid #334',
      zIndex: '9000',
      display: 'none',
      maxWidth: '600px',
      minWidth: '300px',
      textAlign: 'left',
      lineHeight: '1.4',
    });

    this.nameEl = document.createElement('span');
    Object.assign(this.nameEl.style, {
      color: '#ffcc44',
      fontWeight: 'bold',
      display: 'block',
      marginBottom: '4px',
      fontSize: '12px',
    });

    this.textEl = document.createElement('div');

    const hintEl = document.createElement('div');
    Object.assign(hintEl.style, {
      color: '#666',
      fontSize: '10px',
      marginTop: '6px',
      textAlign: 'right',
    });
    hintEl.textContent = '[E] continue';

    this.container.appendChild(this.nameEl);
    this.container.appendChild(this.textEl);
    this.container.appendChild(hintEl);
    document.body.appendChild(this.container);
  }

  get isActive(): boolean {
    return this.active;
  }

  show(name: string, text: string, onDismiss?: () => void): void {
    this.nameEl.textContent = name;
    this.textEl.textContent = text;
    this.container.style.display = 'block';
    this.active = true;
    this.onDismiss = onDismiss ?? null;
  }

  dismiss(): void {
    this.container.style.display = 'none';
    this.active = false;
    if (this.onDismiss) {
      this.onDismiss();
      this.onDismiss = null;
    }
  }
}
