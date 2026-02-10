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

    // Body (worn clothes color)
    gfx.rect(this.x, drawY, this.width, this.height).fill(0x887766);

    // Head
    const headX = this.x + this.width / 2;
    const headY = drawY + 2;
    gfx.circle(headX, headY, 3).fill(0x998877);

    // Eyes
    gfx.circle(headX - 1, headY, 0.5).fill(0x222222);
    gfx.circle(headX + 1, headY, 0.5).fill(0x222222);
  }

  renderHint(gfx: Graphics): void {
    const hintX = this.x + this.width / 2;
    const hintY = this.y - 8;
    gfx.rect(hintX - 3, hintY - 1, 6, 5).fill(0x000000);
    gfx.rect(hintX - 2, hintY, 4, 3).fill(0xffcc44);
  }
}
