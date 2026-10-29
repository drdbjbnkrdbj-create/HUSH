/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { soundSynth } from '../audio/SoundSynth';
import { noiseManager } from './NoiseManager';

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3 = new THREE.Vector3(-13, 1.7, -9); // Starts near entrance

  // Movement parameters
  public walkSpeed: number = 3.2;
  public sprintSpeed: number = 5.5;
  public crouchSpeed: number = 1.6;

  public standingHeight: number = 1.7;
  public crouchingHeight: number = 0.9;
  public currentEyeHeight: number = 1.7;

  // States
  public isSprinting: boolean = false;
  public isCrouching: boolean = false;
  public isFlashlightOn: boolean = true;
  public stamina: number = 100;
  public maxStamina: number = 100;
  private isExhausted: boolean = false;

  // Flashlight
  public flashlight: THREE.SpotLight;
  public flashlightTarget: THREE.Object3D;

  // Looking
  public yaw: number = 0; // Horizontal rotation
  public pitch: number = 0; // Vertical rotation
  public sensitivity: number = 0.0022;

  // Mobile virtual input state
  public moveInput: { x: number; y: number } = { x: 0, y: 0 };
  public sprintHeld: boolean = false;
  public crouchHeld: boolean = false;

  // Keyboard keys
  private keys: Record<string, boolean> = {};

  // Step audio & noise timing
  private distanceTraveled: number = 0;
  private stepInterval: number = 1.8;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.position.copy(this.position);

    // Setup Flashlight attached to camera
    this.flashlight = new THREE.SpotLight(0xfff7ed, 3.5, 20, Math.PI / 6, 0.35, 1.0);
    this.flashlight.position.set(0.2, -0.2, 0); // slightly offset from eyes
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 0, -10);

    this.camera.add(this.flashlight);
    this.camera.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    this.setupKeyboardListeners();
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyF') {
        this.toggleFlashlight();
      }
      if (e.code === 'KeyC') {
        this.isCrouching = !this.isCrouching;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
    });
  }

  public toggleFlashlight(): boolean {
    this.isFlashlightOn = !this.isFlashlightOn;
    this.flashlight.intensity = this.isFlashlightOn ? 3.5 : 0;
    soundSynth.playFlashlightClick(this.isFlashlightOn);
    return this.isFlashlightOn;
  }

  public handleLookDelta(deltaX: number, deltaY: number) {
    this.yaw -= deltaX * this.sensitivity;
    this.pitch -= deltaY * this.sensitivity;

    // Clamp pitch between -80 and +80 degrees
    const maxPitch = THREE.MathUtils.degToRad(80);
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  public update(deltaTime: number, colliders: THREE.Box3[]) {
    // 1. Resolve sprint / crouch states
    const shiftKey = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.sprintHeld;
    const ctrlKey = this.keys['KeyC'] || this.keys['ControlLeft'] || this.crouchHeld;

    // Crouch handling
    if (this.crouchHeld) {
      this.isCrouching = true;
    } else if (ctrlKey && !this.keys['KeyC']) {
      this.isCrouching = true;
    }

    // Stamina & Sprint logic
    if (shiftKey && !this.isCrouching && !this.isExhausted && (this.moveInput.x !== 0 || this.moveInput.y !== 0 || this.isMovingByKey())) {
      this.isSprinting = true;
      this.stamina = Math.max(0, this.stamina - deltaTime * 24);
      if (this.stamina <= 0) {
        this.isExhausted = true;
        this.isSprinting = false;
      }
    } else {
      this.isSprinting = false;
      this.stamina = Math.min(this.maxStamina, this.stamina + deltaTime * 16);
      if (this.isExhausted && this.stamina >= 25) {
        this.isExhausted = false;
      }
    }

    // 2. Smooth crouch height
    const targetHeight = this.isCrouching ? this.crouchingHeight : this.standingHeight;
    this.currentEyeHeight += (targetHeight - this.currentEyeHeight) * Math.min(1.0, deltaTime * 10);

    // 3. Calculate input direction
    let forward = 0;
    let right = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) forward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) forward -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) right -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) right += 1;

    // Combine with virtual joystick input (Y is forward/back, X is right/left)
    forward -= this.moveInput.y;
    right += this.moveInput.x;

    const inputLen = Math.sqrt(forward * forward + right * right);
    if (inputLen > 1) {
      forward /= inputLen;
      right /= inputLen;
    }

    const currentSpeed = this.isCrouching
      ? this.crouchSpeed
      : this.isSprinting
      ? this.sprintSpeed
      : this.walkSpeed;

    // 4. Movement relative to camera yaw
    if (inputLen > 0.05) {
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);

      // In Three.js: forward is -Z in local camera space
      const moveX = (right * cos - forward * sin) * currentSpeed * deltaTime;
      const moveZ = (-right * sin - forward * cos) * currentSpeed * deltaTime;

      this.moveWithCollision(moveX, moveZ, colliders);

      const frameDist = Math.sqrt(moveX * moveX + moveZ * moveZ);
      this.distanceTraveled += frameDist;

      // 5. Footstep & Movement Noise
      const stepTarget = this.isSprinting ? 1.4 : this.isCrouching ? 2.2 : 1.8;
      if (this.distanceTraveled >= stepTarget) {
        this.distanceTraveled = 0;
        soundSynth.playFootstep(this.isSprinting, this.isCrouching);

        // Emit noise event
        const noiseIntensity = this.isCrouching ? 0.15 : this.isSprinting ? 0.9 : 0.45;
        const noiseType = this.isSprinting ? 'sprint' : 'walk';
        noiseManager.emitNoise(this.position, noiseType, noiseIntensity, 'player');
      }
    }

    // 6. Apply camera transform
    this.camera.position.set(this.position.x, this.position.y, this.position.z);

    // Euler rotation (YXZ order)
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  private isMovingByKey(): boolean {
    return !!(this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD']);
  }

  private moveWithCollision(moveX: number, moveZ: number, colliders: THREE.Box3[]) {
    const playerRadius = 0.4;

    // Try moving on X axis
    const nextPosX = this.position.clone();
    nextPosX.x += moveX;
    let collideX = false;

    for (const box of colliders) {
      if (
        nextPosX.x >= box.min.x - playerRadius &&
        nextPosX.x <= box.max.x + playerRadius &&
        this.position.z >= box.min.z - playerRadius &&
        this.position.z <= box.max.z + playerRadius
      ) {
        collideX = true;
        break;
      }
    }
    if (!collideX) {
      this.position.x = nextPosX.x;
    }

    // Try moving on Z axis
    const nextPosZ = this.position.clone();
    nextPosZ.z += moveZ;
    let collideZ = false;

    for (const box of colliders) {
      if (
        this.position.x >= box.min.x - playerRadius &&
        this.position.x <= box.max.x + playerRadius &&
        nextPosZ.z >= box.min.z - playerRadius &&
        nextPosZ.z <= box.max.z + playerRadius
      ) {
        collideZ = true;
        break;
      }
    }
    if (!collideZ) {
      this.position.z = nextPosZ.z;
    }

    this.position.y = this.currentEyeHeight;
  }
}
