/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildSupermarketLevel, LevelData, CollectibleItemData } from './LevelBuilder';
import { PlayerController } from './PlayerController';
import { GuardAI, GuardState } from './GuardAI';
import { noiseManager, NoiseEvent } from './NoiseManager';
import { micDetector } from '../audio/MicNoiseDetector';
import { soundSynth } from '../audio/SoundSynth';

export type GameState = 'menu' | 'playing' | 'paused' | 'captured' | 'escaped';

export interface GameEngineState {
  gameState: GameState;
  itemsCollectedCount: number;
  totalItemsCount: number;
  items: { id: string; nameAr: string; nameEn: string; collected: boolean }[];
  isExitUnlocked: boolean;
  guardState: GuardState;
  distanceToGuard: number;
  isPlayerHidden: boolean;
  isPlayerCrouched: boolean;
  stamina: number;
  isFlashlightOn: boolean;
  nearbyInteractable: string | null;
  micNoiseLevel: number; // 0 to 1
  micCategory: string;
}

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private isSoftwareGl: boolean = false;

  private levelData: LevelData;
  public player: PlayerController;
  public guard: GuardAI;

  public gameState: GameState = 'menu';
  private itemsCollected: number = 0;
  private totalItems: number = 5;

  private clock: THREE.Clock;
  private animFrameId: number = 0;
  private isDestroyed: boolean = false;

  // React state sync callback
  private onStateChange: ((state: GameEngineState) => void) | null = null;
  private nearbyInteractable: string | null = null;
  private isPlayerHidden: boolean = false;

  // Menu cinematic camera orbit angle
  private menuOrbitAngle: number = 0;

  constructor(container: HTMLElement) {
    // 1. Detect software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070f);
    this.scene.fog = new THREE.FogExp2(0x05070f, 0.045);

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      60
    );
    this.scene.add(this.camera);

    // Studio Environment map using RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Build Level
    this.levelData = buildSupermarketLevel();
    this.scene.add(this.levelData.root);

    // 5. Initialize Player
    this.player = new PlayerController(this.camera);

    // 6. Initialize Guard AI
    this.guard = new GuardAI(this.levelData.patrolWaypoints[0], this.levelData.patrolWaypoints);
    this.scene.add(this.guard.group);

    // Hook up NoiseManager to Guard
    noiseManager.addListener((event: NoiseEvent) => {
      this.guard.onHearNoise(event);
    });

    // Hook up Mic detector to emit noise events
    micDetector.setOnNoiseEventListener((intensity) => {
      if (this.gameState === 'playing') {
        noiseManager.emitNoise(this.player.position, 'mic', intensity, 'player_voice');
      }
    });

    // Guard Capture Callback
    this.guard.setOnCaptureListener(() => {
      if (this.gameState === 'playing') {
        this.gameState = 'captured';
        this.emitStateChange();
      }
    });

    this.clock = new THREE.Clock();

    // Window resize handler
    window.addEventListener('resize', this.onWindowResize);

    // Start loop
    this.tick();
  }

  public setOnStateChangeListener(cb: (state: GameEngineState) => void) {
    this.onStateChange = cb;
  }

  private onWindowResize = () => {
    if (!this.renderer || !this.camera) return;
    const parent = this.renderer.domElement.parentElement;
    if (!parent) return;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public startGame() {
    this.gameState = 'playing';
    soundSynth.initCtx();
    this.emitStateChange();
  }

  public pauseGame() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      this.emitStateChange();
    }
  }

  public resumeGame() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.emitStateChange();
    }
  }

  public restartGame() {
    // Reset player
    this.player.position.set(-13, 1.7, -9);
    this.player.yaw = 0;
    this.player.pitch = 0;
    this.player.stamina = 100;
    this.player.isFlashlightOn = true;
    this.player.flashlight.intensity = 3.5;

    // Reset collectibles
    this.itemsCollected = 0;
    for (const item of this.levelData.collectibles) {
      item.collected = false;
      item.mesh.visible = true;
    }

    // Reset Exit
    this.levelData.exitDoor.isUnlocked = false;
    this.levelData.exitDoor.indicatorLight.color.setHex(0xef4444);
    (this.levelData.exitDoor.indicatorMesh.material as THREE.MeshStandardMaterial).color.setHex(0xef4444);
    (this.levelData.exitDoor.indicatorMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xdc2626);

    // Reset Guard
    this.guard.position.copy(this.levelData.patrolWaypoints[0]);
    this.guard.state = 'PATROL';

    noiseManager.clear();
    this.gameState = 'playing';
    soundSynth.initCtx();
    this.emitStateChange();
  }

  public interact() {
    if (this.gameState !== 'playing') return;

    // 1. Check Collectibles within 2.3m
    for (const item of this.levelData.collectibles) {
      if (!item.collected) {
        const dist = this.player.position.distanceTo(item.position);
        if (dist <= 2.3) {
          item.collected = true;
          item.mesh.visible = false;
          this.itemsCollected++;
          soundSynth.playItemPickup();
          noiseManager.emitNoise(this.player.position, 'interact', 0.35, 'player');

          // Check if all 5 items collected
          if (this.itemsCollected >= this.totalItems) {
            this.unlockExitDoor();
          }

          this.emitStateChange();
          return;
        }
      }
    }

    // 2. Check Exit Door within 2.5m
    const distToExit = this.player.position.distanceTo(this.levelData.exitDoor.position);
    if (distToExit <= 2.6) {
      if (this.levelData.exitDoor.isUnlocked) {
        // Player escapes!
        this.gameState = 'escaped';
        soundSynth.playVictorySound();
        this.emitStateChange();
      } else {
        // Door is locked
        soundSynth.playFlashlightClick(false);
      }
    }
  }

  private unlockExitDoor() {
    this.levelData.exitDoor.isUnlocked = true;
    this.levelData.exitDoor.indicatorLight.color.setHex(0x22c55e);
    this.levelData.exitDoor.indicatorLight.intensity = 3.5;
    (this.levelData.exitDoor.indicatorMesh.material as THREE.MeshStandardMaterial).color.setHex(0x22c55e);
    (this.levelData.exitDoor.indicatorMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x16a34a);
    soundSynth.playExitUnlocked();
  }

  private tick = () => {
    if (this.isDestroyed) return;

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05); // Clamp frame delta

    // Overhead fluorescent flicker
    if (Math.random() < 0.03) {
      this.levelData.flickerLight.intensity = 0.2 + Math.random() * 2.0;
    } else {
      this.levelData.flickerLight.intensity = 1.8;
    }

    // Animate uncollected items bob & rotate
    for (const item of this.levelData.collectibles) {
      if (!item.collected) {
        item.mesh.rotation.y += dt * 1.5;
      }
    }

    if (this.gameState === 'menu') {
      // Live cinematic camera pan around supermarket aisles for Title Screen
      this.menuOrbitAngle += dt * 0.18;
      const camX = Math.sin(this.menuOrbitAngle) * 9 - 4;
      const camZ = Math.cos(this.menuOrbitAngle) * 8 - 2;
      this.camera.position.set(camX, 2.4, camZ);
      this.camera.lookAt(-4, 1.2, 0);

      // Guard continues patrolling in background
      this.guard.update(dt, this.player.position, false, false, this.levelData.colliders);
    } else if (this.gameState === 'playing') {
      // Update microphone detector
      micDetector.update(dt);

      // Update noise manager
      noiseManager.update(dt);

      // Check hiding spots
      this.isPlayerHidden = false;
      for (const zone of this.levelData.hidingZones) {
        if (zone.bounds.containsPoint(this.player.position)) {
          this.isPlayerHidden = true;
          break;
        }
      }

      // Update player
      this.player.update(dt, this.levelData.colliders);

      // Check proximity to shopping carts for realistic cart rattle sounds
      for (const cart of this.levelData.shoppingCarts) {
        const d = this.player.position.distanceTo(cart.position);
        if (d < 1.5 && Math.random() < 0.025) {
          soundSynth.playCartRattle();
          noiseManager.emitNoise(this.player.position, 'walk', 0.25, 'cart');
        }
      }

      // Update guard AI
      this.guard.update(
        dt,
        this.player.position,
        this.player.isCrouching,
        this.isPlayerHidden,
        this.levelData.colliders
      );

      // Update heartbeat & suspense audio
      const distToGuard = this.player.position.distanceTo(this.guard.position);
      soundSynth.updateHeartbeat(distToGuard, this.guard.state === 'CHASE');

      // Check nearby interactable for HUD prompt
      this.updateNearbyInteractable();

      // Emit periodic state updates to React HUD
      this.emitStateChange();
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);

    this.animFrameId = requestAnimationFrame(this.tick);
  };

  private updateNearbyInteractable() {
    this.nearbyInteractable = null;

    // Check items
    for (const item of this.levelData.collectibles) {
      if (!item.collected) {
        const d = this.player.position.distanceTo(item.position);
        if (d <= 2.3) {
          this.nearbyInteractable = `التقاط: ${item.nameAr}`;
          return;
        }
      }
    }

    // Check exit
    const distToExit = this.player.position.distanceTo(this.levelData.exitDoor.position);
    if (distToExit <= 2.6) {
      if (this.levelData.exitDoor.isUnlocked) {
        this.nearbyInteractable = 'الهروب من السوبرماركت (مفتوح)';
      } else {
        this.nearbyInteractable = `المخرج مقفل (${this.itemsCollected}/${this.totalItems} تم جمعها)`;
      }
    }
  }

  private emitStateChange() {
    if (!this.onStateChange) return;

    const distToGuard = this.player.position.distanceTo(this.guard.position);
    this.onStateChange({
      gameState: this.gameState,
      itemsCollectedCount: this.itemsCollected,
      totalItemsCount: this.totalItems,
      items: this.levelData.collectibles.map(c => ({
        id: c.id,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        collected: c.collected,
      })),
      isExitUnlocked: this.levelData.exitDoor.isUnlocked,
      guardState: this.guard.state,
      distanceToGuard: distToGuard,
      isPlayerHidden: this.isPlayerHidden,
      isPlayerCrouched: this.player.isCrouching,
      stamina: this.player.stamina,
      isFlashlightOn: this.player.isFlashlightOn,
      nearbyInteractable: this.nearbyInteractable,
      micNoiseLevel: micDetector.currentAmplitude,
      micCategory: micDetector.currentCategory,
    });
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    micDetector.stop();
    this.renderer.dispose();
  }
}
