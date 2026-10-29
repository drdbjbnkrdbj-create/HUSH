/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Microphone noise detection with Web Audio API Analyzer & EMA smoothing.
// All processing is 100% local in memory; no audio is ever recorded or uploaded.

export type MicPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface MicSettings {
  enabled: boolean;
  sensitivity: number; // 0.5 to 2.5 multiplier
  whisperThreshold: number; // 0.12 - 0.25
  normalThreshold: number; // 0.30 - 0.50
  shoutThreshold: number; // 0.60 - 0.85
  minTriggerDurationMs: number; // milliseconds sustained above threshold
}

export type NoiseLevelCategory = 'silent' | 'whisper' | 'normal' | 'shout';

export class MicNoiseDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;

  public permissionState: MicPermissionState = 'unknown';
  public currentAmplitude: number = 0; // 0.0 to 1.0 smoothed
  public rawAmplitude: number = 0;
  public peakAmplitude: number = 0;
  public currentCategory: NoiseLevelCategory = 'silent';

  private smoothingFactor: number = 0.25; // EMA smoothing
  private sustainedStartTime: number = 0;
  private isTriggered: boolean = false;

  public settings: MicSettings = {
    enabled: true,
    sensitivity: 1.2,
    whisperThreshold: 0.15,
    normalThreshold: 0.35,
    shoutThreshold: 0.65,
    minTriggerDurationMs: 120,
  };

  private onNoiseEventCallback: ((intensity: number, category: NoiseLevelCategory) => void) | null = null;

  constructor() {
    this.checkInitialPermission();
  }

  public setOnNoiseEventListener(cb: (intensity: number, category: NoiseLevelCategory) => void) {
    this.onNoiseEventCallback = cb;
  }

  private async checkInitialPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.permissionState = 'unsupported';
      return;
    }
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        this.permissionState = result.state as MicPermissionState;
        result.onchange = () => {
          this.permissionState = result.state as MicPermissionState;
        };
      }
    } catch {
      // Permission query not supported on some platforms
      this.permissionState = 'unknown';
    }
  }

  public async requestMicAccess(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.permissionState = 'unsupported';
      return false;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.permissionState = 'granted';
      this.setupAudioPipeline();
      return true;
    } catch (err: unknown) {
      console.warn('Microphone permission denied or unavailable:', err);
      this.permissionState = 'denied';
      return false;
    }
  }

  private setupAudioPipeline() {
    if (!this.mediaStream) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;

      source.connect(this.analyser);
      this.dataArray = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    } catch (e) {
      console.error('Failed to setup microphone audio graph:', e);
    }
  }

  public update(deltaTime: number) {
    if (!this.analyser || !this.dataArray || !this.settings.enabled) {
      // Decay peak
      this.peakAmplitude = Math.max(0, this.peakAmplitude - deltaTime * 0.5);
      return;
    }

    this.analyser.getByteTimeDomainData(this.dataArray);

    // Calculate RMS amplitude
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const val = (this.dataArray[i] - 128) / 128; // -1 to 1
      sum += val * val;
    }
    const rms = Math.sqrt(sum / this.dataArray.length);

    // Apply sensitivity multiplier
    const scaled = Math.min(1.0, rms * 4.5 * this.settings.sensitivity);
    this.rawAmplitude = scaled;

    // Exponential Moving Average
    this.currentAmplitude = this.currentAmplitude * (1 - this.smoothingFactor) + scaled * this.smoothingFactor;

    // Peak tracking
    if (this.currentAmplitude > this.peakAmplitude) {
      this.peakAmplitude = this.currentAmplitude;
    } else {
      this.peakAmplitude = Math.max(0, this.peakAmplitude - deltaTime * 0.4);
    }

    // Determine category
    if (this.currentAmplitude >= this.settings.shoutThreshold) {
      this.currentCategory = 'shout';
    } else if (this.currentAmplitude >= this.settings.normalThreshold) {
      this.currentCategory = 'normal';
    } else if (this.currentAmplitude >= this.settings.whisperThreshold) {
      this.currentCategory = 'whisper';
    } else {
      this.currentCategory = 'silent';
    }

    // Check duration threshold to prevent accidental clicks
    const now = performance.now();
    if (this.currentAmplitude >= this.settings.whisperThreshold) {
      if (this.sustainedStartTime === 0) {
        this.sustainedStartTime = now;
      } else if (now - this.sustainedStartTime >= this.settings.minTriggerDurationMs) {
        if (!this.isTriggered && this.onNoiseEventCallback) {
          this.onNoiseEventCallback(this.currentAmplitude, this.currentCategory);
          this.isTriggered = true;
        }
      }
    } else {
      this.sustainedStartTime = 0;
      this.isTriggered = false;
    }
  }

  public stop() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const micDetector = new MicNoiseDetector();
