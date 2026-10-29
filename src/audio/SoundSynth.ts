/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Enhanced Procedural Web Audio Engine for HUSH!
// Rich supermarket background ambience (refrigeration motors, ventilation breeze)
// and everyday realistic sounds (scanner beeps, cart squeaks, radio squelch, footsteps, breathing).

class SoundSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ventilationGain: GainNode | null = null;
  private fridgeGain: GainNode | null = null;

  public masterVolume: number = 0.85;
  public sfxVolume: number = 0.9;
  public isMuted: boolean = false;

  public initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.startRealisticSupermarketAmbience();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMasterVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  public setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // Realistic Supermarket Night Background Ambience
  private startRealisticSupermarketAmbience() {
    if (!this.ctx || !this.ambientGain) return;
    try {
      // 1. Supermarket Refrigerators Compressor Drone (60Hz + 120Hz harmonic hum)
      const fridgeOsc1 = this.ctx.createOscillator();
      const fridgeOsc2 = this.ctx.createOscillator();
      this.fridgeGain = this.ctx.createGain();

      fridgeOsc1.type = 'sawtooth';
      fridgeOsc1.frequency.setValueAtTime(58, this.ctx.currentTime);

      fridgeOsc2.type = 'sine';
      fridgeOsc2.frequency.setValueAtTime(116, this.ctx.currentTime);

      const fridgeFilter = this.ctx.createBiquadFilter();
      fridgeFilter.type = 'lowpass';
      fridgeFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

      this.fridgeGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      fridgeOsc1.connect(fridgeFilter);
      fridgeOsc2.connect(fridgeFilter);
      fridgeFilter.connect(this.fridgeGain);
      this.fridgeGain.connect(this.ambientGain);

      fridgeOsc1.start();
      fridgeOsc2.start();

      // 2. Air Ventilation / HVAC White/Pink Noise
      const bufferSize = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.05;
      }

      const ventSource = this.ctx.createBufferSource();
      ventSource.buffer = buffer;
      ventSource.loop = true;

      const ventFilter = this.ctx.createBiquadFilter();
      ventFilter.type = 'bandpass';
      ventFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
      ventFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

      this.ventilationGain = this.ctx.createGain();
      this.ventilationGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      ventSource.connect(ventFilter);
      ventFilter.connect(this.ventilationGain);
      this.ventilationGain.connect(this.ambientGain);

      ventSource.start();

      // 3. Subtle Fluorescent Light Buzz
      const buzzOsc = this.ctx.createOscillator();
      buzzOsc.type = 'triangle';
      buzzOsc.frequency.setValueAtTime(100, this.ctx.currentTime);

      const buzzGain = this.ctx.createGain();
      buzzGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      buzzOsc.connect(buzzGain);
      buzzGain.connect(this.ambientGain);
      buzzOsc.start();
    } catch {
      // Audio start handled upon first interaction
    }
  }

  // Barcode Scanner Beep (Realistic supermarket register beep)
  public playScannerBeep() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2600, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // Realistic Cart Rattle & Wheel Squeak
  public playCartRattle() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.15);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  // Guard Walkie-Talkie Radio Squelch & Chatter
  public playGuardRadioSquelch() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    // Burst of radio noise + two micro beeps
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1800, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(2.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    noiseSource.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.sfxGain);

    noiseSource.start();

    // Radio chirps
    const chirp = this.ctx.createOscillator();
    const chirpGain = this.ctx.createGain();
    chirp.type = 'sine';
    chirp.frequency.setValueAtTime(1400, this.ctx.currentTime + 0.2);
    chirp.frequency.setValueAtTime(1750, this.ctx.currentTime + 0.25);

    chirpGain.gain.setValueAtTime(0.15, this.ctx.currentTime + 0.2);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);

    chirp.connect(chirpGain);
    chirpGain.connect(this.sfxGain);

    chirp.start(this.ctx.currentTime + 0.2);
    chirp.stop(this.ctx.currentTime + 0.32);
  }

  // Guard Whistle / Quiet Hum during Patrol
  public playGuardPatrolHum() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [440, 493.88, 523.25, 440];
    const baseTime = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, baseTime + idx * 0.25);

      gain.gain.setValueAtTime(0, baseTime + idx * 0.25);
      gain.gain.linearRampToValueAtTime(0.07, baseTime + idx * 0.25 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, baseTime + idx * 0.25 + 0.24);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(baseTime + idx * 0.25);
      osc.stop(baseTime + idx * 0.25 + 0.24);
    });
  }

  // Realistic Footsteps on Waxed Supermarket Linoleum
  public playFootstep(isSprinting: boolean = false, isCrouching: boolean = false) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    // Body thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const baseFreq = isCrouching ? 45 : isSprinting ? 95 : 65;
    const dur = isCrouching ? 0.07 : isSprinting ? 0.12 : 0.09;
    const vol = isCrouching ? 0.04 : isSprinting ? 0.32 : 0.15;

    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, this.ctx.currentTime + dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isSprinting ? 600 : 350, this.ctx.currentTime);

    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + dur);

    // Subtle shoe sole squeak on polished linoleum
    if (!isCrouching && Math.random() < (isSprinting ? 0.6 : 0.3)) {
      const squeak = this.ctx.createOscillator();
      const squeakGain = this.ctx.createGain();
      squeak.type = 'sawtooth';
      squeak.frequency.setValueAtTime(1400 + Math.random() * 400, this.ctx.currentTime + 0.02);
      squeak.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.06);

      squeakGain.gain.setValueAtTime(0.04, this.ctx.currentTime + 0.02);
      squeakGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      squeak.connect(squeakGain);
      squeakGain.connect(this.sfxGain);

      squeak.start(this.ctx.currentTime + 0.02);
      squeak.stop(this.ctx.currentTime + 0.06);
    }
  }

  // Flashlight click switch
  public playFlashlightClick(on: boolean) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(on ? 1200 : 800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  // Everyday item pickup (Scanner beep + joyful chime)
  public playItemPickup() {
    this.playScannerBeep();
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + 0.05 + idx * 0.05);

      gain.gain.setValueAtTime(0, this.ctx!.currentTime + 0.05 + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.2, this.ctx!.currentTime + 0.05 + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.05 + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(this.ctx!.currentTime + 0.05 + idx * 0.05);
      osc.stop(this.ctx!.currentTime + 0.05 + idx * 0.05 + 0.35);
    });
  }

  public playGuardAlert() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    this.playGuardRadioSquelch();

    const freqs = [311.13, 329.63, 440];
    freqs.forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
      osc.frequency.linearRampToValueAtTime(freq * 1.05, this.ctx!.currentTime + 0.35);

      gain.gain.setValueAtTime(0.25, this.ctx!.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start();
      osc.stop(this.ctx!.currentTime + 0.45);
    });
  }

  public playChaseSting() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  public updateHeartbeat(distanceToGuard: number, isChasing: boolean) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const inRange = distanceToGuard < 14 || isChasing;
    if (!inRange) return;

    const proximity = Math.max(0, Math.min(1, 1 - distanceToGuard / 14));
    const volume = 0.06 + (isChasing ? 0.35 : proximity * 0.25);

    if (Math.random() < (isChasing ? 0.08 : 0.03 + proximity * 0.03)) {
      this.playHeartbeatThud(volume);
    }
  }

  private playHeartbeatThud(volume: number) {
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(70, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playCaptureJumpscare() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(380, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 1.2);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(740, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 1.2);
    osc2.stop(this.ctx.currentTime + 1.2);
  }

  public playExitUnlocked() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  public playVictorySound() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const freqs = [392, 523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.12);

      gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + i * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(this.ctx!.currentTime + i * 0.12);
      osc.stop(this.ctx!.currentTime + i * 0.12 + 0.6);
    });
  }
}

export const soundSynth = new SoundSynth();
