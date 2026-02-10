import { type Graphics } from 'pixi.js';
import { type Body } from '@/physics/Body';
import { NPC_INTERACT_RANGE } from '@/config/constants';

export interface NPCData {
  name: string;
  x: number;
  y: number;
  lines: string[];
}

export class NPC {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width = 10;
  readonly height = 14;
  readonly lines: string[];

  private currentLine = 0;
  private idleTimer = 0;
  private bobOffset = 0;

  constructor(data: NPCData) {
    this.name = data.name;
    this.x = data.x;
    this.y = data.y;
    this.lines = data.lines;
  }

  inRange(body: Body): boolean {
    const cx = body.x + body.width / 2;
    const cy = body.y + body.height / 2;
    const nx = this.x + this.width / 2;
    const ny = this.y + this.height / 2;
    const dx = cx - nx;
    const dy = cy - ny;
    return Math.sqrt(dx * dx + dy * dy) < NPC_INTERACT_RANGE;
  }

  interact(): { name: string; text: string } {
    const text = this.lines[this.currentLine % this.lines.length]!;
    this.currentLine++;
    return { name: this.name, text };
  }

  update(dt: number): void {
    this.idleTimer += dt;
    this.bobOffset = Math.sin(this.idleTimer * 1.5) * 0.5;
  }

  render(gfx: Graphics): void {
    const drawY = this.y + this.bobOffset;
    const cx = this.x + this.width / 2;

    // Shadow beneath
    gfx.rect(this.x + 1, this.y + this.height, this.width - 2, 1).fill(0x080810);

    // Legs / boots
    gfx.rect(this.x + 1, drawY + 10, 3, 4).fill(0x443322);   // left boot
    gfx.rect(this.x + 6, drawY + 10, 3, 4).fill(0x443322);   // right boot
    gfx.rect(this.x + 1, drawY + 13, 4, 1).fill(0x332211);   // left sole
    gfx.rect(this.x + 6, drawY + 13, 4, 1).fill(0x332211);   // right sole

    // Body — tattered vest over shirt
    gfx.rect(this.x + 1, drawY + 4, this.width - 2, 7).fill(0x665544);  // shirt
    gfx.rect(this.x + 2, drawY + 4, 2, 6).fill(0x554433);  // vest left
    gfx.rect(this.x + this.width - 4, drawY + 4, 2, 6).fill(0x554433);  // vest right
    // Belt
    gfx.rect(this.x + 1, drawY + 9, this.width - 2, 1).fill(0x443322);
    gfx.rect(this.x + 4, drawY + 9, 2, 1).fill(0x887744);  // belt buckle

    // Arms
    gfx.rect(this.x - 1, drawY + 5, 2, 5).fill(0x665544);  // left arm
    gfx.rect(this.x + this.width - 1, drawY + 5, 2, 5).fill(0x665544);  // right arm

    // Head
    const headY = drawY + 2;
    gfx.circle(cx, headY, 3).fill(0x998877);

    // Mining hat
    gfx.rect(cx - 4, drawY - 2, 8, 2).fill(0x665533);  // hat brim
    gfx.rect(cx - 3, drawY - 4, 6, 3).fill(0x776644);   // hat crown

    // Eyes
    gfx.rect(Math.floor(cx - 2), headY - 1, 1, 1).fill(0x222222);
    gfx.rect(Math.floor(cx + 1), headY - 1, 1, 1).fill(0x222222);

    // Beard / stubble (for "old miner" vibe)
    gfx.rect(Math.floor(cx - 2), headY + 2, 4, 1).fill(0x777766);
  }

  renderHint(gfx: Graphics): void {
    const hintX = this.x + this.width / 2;
    const hintY = this.y - 10;

    // Speech bubble background
    gfx.rect(hintX - 5, hintY - 1, 10, 7).fill(0x111118);
    gfx.rect(hintX - 4, hintY - 2, 8, 9).fill(0x111118);
    // Bubble tail
    gfx.rect(hintX - 1, hintY + 7, 2, 2).fill(0x111118);

    // "E" letter in bubble
    gfx.rect(hintX - 2, hintY, 4, 1).fill(0xffcc44);
    gfx.rect(hintX - 2, hintY + 1, 1, 1).fill(0xffcc44);
    gfx.rect(hintX - 2, hintY + 2, 3, 1).fill(0xffcc44);
    gfx.rect(hintX - 2, hintY + 3, 1, 1).fill(0xffcc44);
    gfx.rect(hintX - 2, hintY + 4, 4, 1).fill(0xffcc44);
  }
}
