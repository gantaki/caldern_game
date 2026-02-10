import { Body } from '@/physics/Body';
import {
  PLAYER_SPEED,
  PLAYER_JUMP_FORCE,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  COYOTE_TIME,
  JUMP_BUFFER_TIME,
  CLIMB_SPEED,
  ROPE_SPEED,
} from '@/config/constants';
import { type InputManager } from '@/core/InputManager';
import { approach } from '@/utils/math';

export type PlayerState = 'normal' | 'climbing' | 'rope';

export class Player {
  body: Body;
  facingRight = true;
  state: PlayerState = 'normal';

  private coyoteTimer = 0;
  private jumpBufferTimer = 0;

  constructor(x: number, y: number) {
    this.body = new Body(x, y, PLAYER_WIDTH, PLAYER_HEIGHT);
  }

  update(input: InputManager, dt: number): void {
    switch (this.state) {
      case 'normal':
        this.updateNormal(input, dt);
        break;
      case 'climbing':
        this.updateClimbing(input);
        break;
      case 'rope':
        this.updateRope(input);
        break;
    }
  }

  private updateNormal(input: InputManager, dt: number): void {
    const axisX = input.getAxisX();

    const targetVx = axisX * PLAYER_SPEED;
    const accel = axisX !== 0 ? 1200 : 800;
    this.body.vx = approach(this.body.vx, targetVx, accel * dt);

    if (axisX !== 0) {
      this.facingRight = axisX > 0;
    }

    if (this.body.onGround) {
      this.coyoteTimer = COYOTE_TIME;
    } else {
      this.coyoteTimer -= dt;
    }

    if (input.isPressed('jump')) {
      this.jumpBufferTimer = JUMP_BUFFER_TIME;
    } else {
      this.jumpBufferTimer -= dt;
    }

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.body.vy = PLAYER_JUMP_FORCE;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    }

    if (input.isReleased('jump') && this.body.vy < 0) {
      this.body.vy *= 0.5;
    }
  }

  private updateClimbing(input: InputManager): void {
    const axisY = input.getAxisY();
    const axisX = input.getAxisX();

    this.body.vx = 0;
    this.body.vy = axisY * CLIMB_SPEED;

    if (input.isPressed('jump')) {
      this.state = 'normal';
      this.body.vy = PLAYER_JUMP_FORCE * 0.6;
      return;
    }

    if (axisX !== 0 && axisY === 0) {
      this.state = 'normal';
      this.body.vx = axisX * PLAYER_SPEED * 0.5;
      this.facingRight = axisX > 0;
    }
  }

  private updateRope(input: InputManager): void {
    const axisX = input.getAxisX();

    this.body.vx = axisX * ROPE_SPEED;
    this.body.vy = 0;

    if (axisX !== 0) {
      this.facingRight = axisX > 0;
    }

    if (input.isPressed('jump') || input.isDown('down')) {
      this.state = 'normal';
    }
  }

  startClimbing(): void {
    if (this.state === 'climbing') return;
    this.state = 'climbing';
    this.body.vx = 0;
    this.body.vy = 0;
  }

  startRope(): void {
    if (this.state === 'rope') return;
    this.state = 'rope';
    this.body.vx = 0;
    this.body.vy = 0;
  }
}
