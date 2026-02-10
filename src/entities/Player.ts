import { Body } from '@/physics/Body';
import {
  PLAYER_SPEED,
  PLAYER_JUMP_FORCE,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  COYOTE_TIME,
  JUMP_BUFFER_TIME,
} from '@/config/constants';
import { type InputManager } from '@/core/InputManager';
import { approach } from '@/utils/math';

export class Player {
  body: Body;
  facingRight = true;

  private coyoteTimer = 0;
  private jumpBufferTimer = 0;

  constructor(x: number, y: number) {
    this.body = new Body(x, y, PLAYER_WIDTH, PLAYER_HEIGHT);
  }

  update(input: InputManager, dt: number): void {
    const axisX = input.getAxisX();

    // Horizontal movement with acceleration/deceleration
    const targetVx = axisX * PLAYER_SPEED;
    const accel = axisX !== 0 ? 1200 : 800; // Faster decel when no input
    this.body.vx = approach(this.body.vx, targetVx, accel * dt);

    // Track facing direction
    if (axisX !== 0) {
      this.facingRight = axisX > 0;
    }

    // Coyote time: allow jumping shortly after leaving ground
    if (this.body.onGround) {
      this.coyoteTimer = COYOTE_TIME;
    } else {
      this.coyoteTimer -= dt;
    }

    // Jump buffer: remember jump press for a few frames
    if (input.isPressed('jump')) {
      this.jumpBufferTimer = JUMP_BUFFER_TIME;
    } else {
      this.jumpBufferTimer -= dt;
    }

    // Execute jump if both coyote and buffer are active
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.body.vy = PLAYER_JUMP_FORCE;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    }

    // Variable jump height: cut jump short when releasing
    if (input.isReleased('jump') && this.body.vy < 0) {
      this.body.vy *= 0.5;
    }
  }
}
