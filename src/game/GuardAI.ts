/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { NoiseEvent } from './NoiseManager';
import { soundSynth } from '../audio/SoundSynth';

export type GuardState = 'PATROL' | 'INVESTIGATE' | 'SEARCH' | 'CHASE' | 'CAPTURE' | 'RETURN';

export class GuardAI {
  public group: THREE.Group;
  public state: GuardState = 'PATROL';
  public position: THREE.Vector3;
  public forward: THREE.Vector3 = new THREE.Vector3(0, 0, 1);

  // Animation parts
  private head: THREE.Group;
  private torso: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private rightArm: THREE.Group;
  private flashlightBeam: THREE.SpotLight;
  private flashlightVolumetric: THREE.Mesh;

  // Speeds
  private patrolSpeed: number = 2.0;
  private investigateSpeed: number = 2.8;
  private chaseSpeed: number = 3.9;

  // Waypoints and targets
  private waypoints: THREE.Vector3[];
  private currentWaypointIdx: number = 0;
  private targetPosition: THREE.Vector3;
  private lastNoisePosition: THREE.Vector3 | null = null;

  // Search state
  private searchTimer: number = 0;
  private searchDuration: number = 4.5;
  private searchAngle: number = 0;

  // Vision params
  public visionDistance: number = 14.0;
  public visionFovDeg: number = 80;
  public captureDistance: number = 1.6;

  // Walk cycle animation
  private walkCycleTime: number = 0;

  // Callback on capture
  private onCaptureCallback: (() => void) | null = null;

  constructor(initialPosition: THREE.Vector3, waypoints: THREE.Vector3[]) {
    this.position = initialPosition.clone();
    this.waypoints = waypoints;
    this.targetPosition = waypoints[0]?.clone() || new THREE.Vector3();

    this.group = new THREE.Group();
    this.group.name = 'SecurityGuard';
    this.group.position.copy(this.position);

    // 1. Procedural Low-Poly Guard Mesh Assembly
    // Torso (Dark Navy Uniform)
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.4);
    this.torso = new THREE.Mesh(torsoGeo, torsoMat);
    this.torso.position.y = 1.35;
    this.group.add(this.torso);

    // High-Visibility Neon Yellow Safety Vest (Realistic Security Guard look)
    const vestMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Neon yellow/gold
      roughness: 0.4,
      emissive: 0xca8a04,
      emissiveIntensity: 0.2,
    });
    const vestGeo = new THREE.BoxGeometry(0.72, 0.75, 0.42);
    const vest = new THREE.Mesh(vestGeo, vestMat);
    vest.position.set(0, 0.05, 0);
    this.torso.add(vest);

    // Silver Reflective Stripes across vest
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.2, metalness: 0.8 });
    const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.73, 0.08, 0.43), stripeMat);
    stripe1.position.set(0, 0.15, 0);
    const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.73, 0.08, 0.43), stripeMat);
    stripe2.position.set(0, -0.15, 0);
    this.torso.add(stripe1, stripe2);

    // Security badge
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 });
    const badgeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.04);
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0.18, 0.2, 0.23);
    this.torso.add(badge);

    // Shoulder Walkie-Talkie Radio
    const radioMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const radioGeo = new THREE.BoxGeometry(0.12, 0.22, 0.1);
    const radio = new THREE.Mesh(radioGeo, radioMat);
    radio.position.set(-0.28, 0.38, 0.12);
    this.torso.add(radio);

    const antennaGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6);
    const antenna = new THREE.Mesh(antennaGeo, radioMat);
    antenna.position.set(-0.28, 0.55, 0.12);
    this.torso.add(antenna);

    // Belt
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const beltGeo = new THREE.BoxGeometry(0.72, 0.1, 0.42);
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, -0.4, 0);
    this.torso.add(belt);

    // Head & Cap
    this.head = new THREE.Group();
    this.head.position.set(0, 2.05, 0);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 });
    const headGeo = new THREE.BoxGeometry(0.38, 0.42, 0.38);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    this.head.add(headMesh);

    // Cap
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 });
    const capGeo = new THREE.BoxGeometry(0.42, 0.18, 0.42);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.24;
    this.head.add(cap);

    // Visor
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const visorGeo = new THREE.BoxGeometry(0.4, 0.04, 0.22);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.2, 0.28);
    this.head.add(visor);

    this.group.add(this.head);

    // Legs
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const legGeo = new THREE.BoxGeometry(0.24, 0.9, 0.26);

    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.2, 0.45, 0);
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.2, 0.45, 0);
    this.group.add(this.rightLeg);

    // Right Arm holding flashlight
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.45, 1.6, 0);

    const armGeo = new THREE.BoxGeometry(0.18, 0.7, 0.18);
    const armMesh = new THREE.Mesh(armGeo, torsoMat);
    armMesh.position.y = -0.3;
    this.rightArm.add(armMesh);

    // Flashlight prop
    const flGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 8);
    const flMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 });
    const flMesh = new THREE.Mesh(flGeo, flMat);
    flMesh.rotation.x = Math.PI / 2;
    flMesh.position.set(0, -0.65, 0.25);
    this.rightArm.add(flMesh);

    // Flashlight SpotLight
    this.flashlightBeam = new THREE.SpotLight(0xfef08a, 4.0, 16, Math.PI / 6, 0.4, 1.2);
    this.flashlightBeam.position.set(0, -0.65, 0.35);
    this.flashlightBeam.target.position.set(0, -0.8, 8);
    this.rightArm.add(this.flashlightBeam);
    this.rightArm.add(this.flashlightBeam.target);

    // Translucent light cone for visual atmosphere
    const coneGeo = new THREE.ConeGeometry(2.0, 8, 12, 1, true);
    coneGeo.rotateX(-Math.PI / 2);
    coneGeo.translate(0, 0, 4);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.flashlightVolumetric = new THREE.Mesh(coneGeo, coneMat);
    this.flashlightVolumetric.position.set(0, -0.65, 0.35);
    this.rightArm.add(this.flashlightVolumetric);

    this.group.add(this.rightArm);
  }

  public setOnCaptureListener(cb: () => void) {
    this.onCaptureCallback = cb;
  }

  // Handle spatial noise event from NoiseManager
  public onHearNoise(event: NoiseEvent) {
    // If already in CHASE or CAPTURE, maintain target
    if (this.state === 'CHASE' || this.state === 'CAPTURE') return;

    const dist = this.position.distanceTo(event.position);
    if (dist <= event.radius) {
      this.lastNoisePosition = event.position.clone();
      this.targetPosition = event.position.clone();
      this.state = 'INVESTIGATE';
      soundSynth.playGuardAlert();
    }
  }

  public update(
    deltaTime: number,
    playerPosition: THREE.Vector3,
    isPlayerCrouched: boolean,
    isPlayerHiddenInZone: boolean,
    colliders: THREE.Box3[]
  ) {
    if (this.state === 'CAPTURE') return;

    // Check Vision toward player
    const hasVisual = this.checkLineOfSight(playerPosition, isPlayerCrouched, isPlayerHiddenInZone, colliders);

    // State Transitions
    if (hasVisual) {
      if (this.state !== 'CHASE') {
        soundSynth.playChaseSting();
      }
      this.state = 'CHASE';
      this.targetPosition = playerPosition.clone();
    } else if (this.state === 'CHASE') {
      // Lost sight during chase -> transition to SEARCH
      this.state = 'SEARCH';
      this.searchTimer = 0;
      this.targetPosition = this.position.clone();
    }

    // State Execution
    let moveSpeed = 0;

    switch (this.state) {
      case 'PATROL': {
        this.flashlightBeam.color.setHex(0xfef08a);
        this.flashlightBeam.intensity = 3.5;
        moveSpeed = this.patrolSpeed;

        // Occasional realistic guard sounds during patrol (humming / radio chirp)
        if (Math.random() < 0.0015) {
          if (Math.random() < 0.5) {
            soundSynth.playGuardPatrolHum();
          } else {
            soundSynth.playGuardRadioSquelch();
          }
        }

        const distToWp = this.position.distanceTo(this.targetPosition);
        if (distToWp < 1.2) {
          this.currentWaypointIdx = (this.currentWaypointIdx + 1) % this.waypoints.length;
          this.targetPosition = this.waypoints[this.currentWaypointIdx].clone();
        }
        break;
      }

      case 'INVESTIGATE': {
        this.flashlightBeam.color.setHex(0xfef08a);
        this.flashlightBeam.intensity = 4.5;
        moveSpeed = this.investigateSpeed;

        const distToNoise = this.position.distanceTo(this.targetPosition);
        if (distToNoise < 1.4) {
          // Reached investigation spot -> start searching
          this.state = 'SEARCH';
          this.searchTimer = 0;
        }
        break;
      }

      case 'SEARCH': {
        this.flashlightBeam.color.setHex(0xfbbf24);
        this.flashlightBeam.intensity = 4.0;
        moveSpeed = 0;

        this.searchTimer += deltaTime;
        // Head sweep
        this.searchAngle = Math.sin(this.searchTimer * 2.2) * 0.9;
        this.head.rotation.y = this.searchAngle;

        if (this.searchTimer >= this.searchDuration) {
          // Finished search without spotting player -> resume patrol
          this.head.rotation.y = 0;
          this.state = 'RETURN';
          this.findNearestWaypoint();
        }
        break;
      }

      case 'CHASE': {
        // Red warning flashlight during chase
        this.flashlightBeam.color.setHex(0xef4444);
        this.flashlightBeam.intensity = 6.0;
        moveSpeed = this.chaseSpeed;

        // Check capture distance
        const distToPlayer = this.position.distanceTo(playerPosition);
        if (distToPlayer <= this.captureDistance) {
          this.state = 'CAPTURE';
          soundSynth.playCaptureJumpscare();
          if (this.onCaptureCallback) {
            this.onCaptureCallback();
          }
          return;
        }
        break;
      }

      case 'RETURN': {
        this.flashlightBeam.color.setHex(0xfef08a);
        this.flashlightBeam.intensity = 3.5;
        moveSpeed = this.patrolSpeed;

        const distToWp = this.position.distanceTo(this.targetPosition);
        if (distToWp < 1.2) {
          this.state = 'PATROL';
        }
        break;
      }
    }

    // Movement & Collision Avoidance
    if (moveSpeed > 0) {
      this.moveTowardsTarget(deltaTime, moveSpeed, colliders);
      // Animate walk
      this.walkCycleTime += deltaTime * (moveSpeed * 3.0);
      const legAngle = Math.sin(this.walkCycleTime) * 0.45;
      this.leftLeg.rotation.x = legAngle;
      this.rightLeg.rotation.x = -legAngle;
      this.torso.position.y = 1.35 + Math.abs(Math.sin(this.walkCycleTime * 2)) * 0.05;
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.torso.position.y = 1.35;
    }

    this.group.position.copy(this.position);
  }

  private findNearestWaypoint() {
    let nearestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < this.waypoints.length; i++) {
      const d = this.position.distanceTo(this.waypoints[i]);
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }
    this.currentWaypointIdx = nearestIdx;
    this.targetPosition = this.waypoints[nearestIdx].clone();
  }

  private moveTowardsTarget(deltaTime: number, speed: number, colliders: THREE.Box3[]) {
    const toTarget = new THREE.Vector3().subVectors(this.targetPosition, this.position);
    toTarget.y = 0;
    const dist = toTarget.length();

    if (dist > 0.1) {
      toTarget.normalize();

      // Smooth rotate towards target direction
      const targetAngle = Math.atan2(toTarget.x, toTarget.z);
      const currentAngle = this.group.rotation.y;
      const angleDiff = Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle));
      this.group.rotation.y += angleDiff * Math.min(1.0, deltaTime * 6.0);

      this.forward.set(Math.sin(this.group.rotation.y), 0, Math.cos(this.group.rotation.y));

      const step = this.forward.clone().multiplyScalar(speed * deltaTime);
      const nextPos = this.position.clone().add(step);

      // Check collision against static shelves and walls
      const guardRadius = 0.45;
      let collided = false;
      for (const box of colliders) {
        // Expand box by guard radius
        if (
          nextPos.x >= box.min.x - guardRadius &&
          nextPos.x <= box.max.x + guardRadius &&
          nextPos.z >= box.min.z - guardRadius &&
          nextPos.z <= box.max.z + guardRadius
        ) {
          collided = true;
          // Simple wall slide: attempt X or Z movement separately
          const tryX = this.position.clone().add(new THREE.Vector3(step.x, 0, 0));
          const hitX =
            tryX.x >= box.min.x - guardRadius &&
            tryX.x <= box.max.x + guardRadius &&
            tryX.z >= box.min.z - guardRadius &&
            tryX.z <= box.max.z + guardRadius;

          const tryZ = this.position.clone().add(new THREE.Vector3(0, 0, step.z));
          const hitZ =
            tryZ.x >= box.min.x - guardRadius &&
            tryZ.x <= box.max.x + guardRadius &&
            tryZ.z >= box.min.z - guardRadius &&
            tryZ.z <= box.max.z + guardRadius;

          if (!hitX) {
            this.position.x = tryX.x;
          } else if (!hitZ) {
            this.position.z = tryZ.z;
          }
          break;
        }
      }

      if (!collided) {
        this.position.copy(nextPos);
      }
    }
  }

  // Vision cone + Line-of-Sight Raycasting
  public checkLineOfSight(
    playerPos: THREE.Vector3,
    isCrouched: boolean,
    isPlayerHiddenInZone: boolean,
    colliders: THREE.Box3[]
  ): boolean {
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position);
    toPlayer.y = 0;
    const distance = toPlayer.length();

    // Max vision range (crouching reduces range by 45%)
    const maxRange = isCrouched ? this.visionDistance * 0.55 : this.visionDistance;
    if (distance > maxRange) return false;

    // If player is crouched inside a designated hiding zone and not super close, guard cannot see them
    if (isPlayerHiddenInZone && isCrouched && distance > 2.5) {
      return false;
    }

    toPlayer.normalize();

    // Check angle relative to guard facing direction
    const dot = this.forward.dot(toPlayer);
    const halfFovRad = THREE.MathUtils.degToRad(this.visionFovDeg / 2);
    if (dot < Math.cos(halfFovRad)) {
      // Outside front vision cone
      // But if player is sprinting right behind guard (< 2.2m), guard can sense/see them
      if (distance > 2.2) return false;
    }

    // Raycast check: see if any shelf or wall cuts between guard and player
    const rayStart = new THREE.Vector3(this.position.x, 1.8, this.position.z);
    const targetHeight = isCrouched ? 0.9 : 1.7;
    const rayEnd = new THREE.Vector3(playerPos.x, targetHeight, playerPos.z);
    const rayDir = new THREE.Vector3().subVectors(rayEnd, rayStart);
    const rayLength = rayDir.length();
    rayDir.normalize();

    const ray = new THREE.Ray(rayStart, rayDir);

    for (const box of colliders) {
      const hit = ray.intersectBox(box, new THREE.Vector3());
      if (hit && rayStart.distanceTo(hit) < rayLength - 0.2) {
        // Shelf or wall blocks line of sight!
        return false;
      }
    }

    return true;
  }
}
