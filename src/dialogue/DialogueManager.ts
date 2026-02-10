import { renderPortrait } from './PortraitRenderer';

/**
 * Dialogue overlay with optional portrait — Celeste-style.
 * Shows portrait (left), NPC name + text, and hint at the bottom of the screen.
 */
export class DialogueManager {
  private container: HTMLDivElement;
  private portraitImg: HTMLImageElement;
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
      background: 'rgba(5, 5, 10, 0.94)',
      color: '#ddd',
      fontFamily: 'monospace',
      fontSize: '14px',
      padding: '0',
      borderRadius: '4px',
      border: '1px solid #334',
      zIndex: '9000',
      display: 'none',
      maxWidth: '620px',
      minWidth: '340px',
      textAlign: 'left',
      lineHeight: '1.4',
      overflow: 'hidden',
    });

    // Inner layout: [portrait | text area]
    const inner = document.createElement('div');
    Object.assign(inner.style, {
      display: 'flex',
      alignItems: 'stretch',
    });

    // Portrait area
    const portraitBox = document.createElement('div');
    Object.assign(portraitBox.style, {
      width: '68px',
      minHeight: '68px',
      background: 'rgba(10, 10, 18, 0.95)',
      borderRight: '1px solid #2a2a36',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px',
      flexShrink: '0',
    });

    this.portraitImg = document.createElement('img');
    Object.assign(this.portraitImg.style, {
      width: '48px',
      height: '48px',
      imageRendering: 'pixelated',
      display: 'none',
    });
    portraitBox.appendChild(this.portraitImg);

    // Text area
    const textArea = document.createElement('div');
    Object.assign(textArea.style, {
      padding: '10px 16px',
      flex: '1',
      minWidth: '0',
    });

    this.nameEl = document.createElement('span');
    Object.assign(this.nameEl.style, {
      color: '#ffcc44',
      fontWeight: 'bold',
      display: 'block',
      marginBottom: '4px',
      fontSize: '12px',
      letterSpacing: '0.5px',
    });

    this.textEl = document.createElement('div');
    Object.assign(this.textEl.style, {
      fontSize: '13px',
      lineHeight: '1.5',
    });

    const hintEl = document.createElement('div');
    Object.assign(hintEl.style, {
      color: '#555',
      fontSize: '10px',
      marginTop: '6px',
      textAlign: 'right',
    });
    hintEl.textContent = '[E] continue';

    textArea.appendChild(this.nameEl);
    textArea.appendChild(this.textEl);
    textArea.appendChild(hintEl);

    inner.appendChild(portraitBox);
    inner.appendChild(textArea);
    this.container.appendChild(inner);
    document.body.appendChild(this.container);
  }

  get isActive(): boolean {
    return this.active;
  }

  show(name: string, text: string, onDismiss?: () => void): void {
    this.nameEl.textContent = name;
    this.textEl.textContent = text;

    // Try to render portrait
    const portraitUrl = renderPortrait(name);
    if (portraitUrl) {
      this.portraitImg.src = portraitUrl;
      this.portraitImg.style.display = 'block';
    } else {
      this.portraitImg.style.display = 'none';
    }

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
