/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export type NoiseType = 'mic' | 'walk' | 'sprint' | 'drop' | 'interact' | 'door';

export interface NoiseEvent {
  id: string;
  position: THREE.Vector3;
  intensity: number; // 0.0 to 1.0
  radius: number; // Max hearing distance in meters
  type: NoiseType;
  timestamp: number;
  duration: number; // Lifetime in seconds
  sourceId?: string;
}

export type NoiseEventListener = (event: NoiseEvent) => void;

export class NoiseManager {
  private activeEvents: NoiseEvent[] = [];
  private listeners: NoiseEventListener[] = [];
  private eventCounter: number = 0;

  // Base radii for noise types (in meters)
  public noiseProfiles: Record<NoiseType, { baseRadius: number; defaultDuration: number }> = {
    mic: { baseRadius: 28, defaultDuration: 1.2 },
    walk: { baseRadius: 6, defaultDuration: 0.3 },
    sprint: { baseRadius: 15, defaultDuration: 0.5 },
    drop: { baseRadius: 20, defaultDuration: 1.0 },
    interact: { baseRadius: 10, defaultDuration: 0.6 },
    door: { baseRadius: 24, defaultDuration: 1.5 },
  };

  public addListener(listener: NoiseEventListener) {
    this.listeners.push(listener);
  }

  public removeListener(listener: NoiseEventListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  public emitNoise(
    position: THREE.Vector3,
    type: NoiseType,
    intensity: number = 1.0,
    sourceId: string = 'player'
  ): NoiseEvent {
    const profile = this.noiseProfiles[type] || { baseRadius: 10, defaultDuration: 0.5 };
    const radius = profile.baseRadius * Math.max(0.2, intensity);

    const event: NoiseEvent = {
      id: `noise_${++this.eventCounter}_${Date.now()}`,
      position: position.clone(),
      intensity: Math.min(1.0, Math.max(0.05, intensity)),
      radius,
      type,
      timestamp: performance.now(),
      duration: profile.defaultDuration,
      sourceId,
    };

    this.activeEvents.push(event);

    // Notify all listeners (e.g. Guard AI)
    for (const listener of this.listeners) {
      listener(event);
    }

    return event;
  }

  public update(_deltaTime: number) {
    const now = performance.now();
    // Clean up expired events
    this.activeEvents = this.activeEvents.filter(e => {
      const ageSeconds = (now - e.timestamp) / 1000;
      return ageSeconds < e.duration;
    });
  }

  public getActiveEvents(): readonly NoiseEvent[] {
    return this.activeEvents;
  }

  public clear() {
    this.activeEvents = [];
  }
}

export const noiseManager = new NoiseManager();
