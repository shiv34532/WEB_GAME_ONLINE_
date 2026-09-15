export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Engine Audio Nodes
    this.engineMasterGain = null;
    this.osc1 = null;
    this.osc2 = null;
    this.noiseNode = null;
    this.filterNode = null;

    // Tire Screech Nodes
    this.skidGain = null;
    this.skidFilter = null;

    // Horn Nodes
    this.hornOsc1 = null;
    this.hornOsc2 = null;
    this.hornGain = null;
  }

  init() {
    if (this.isInitialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master output
      const master = this.ctx.createGain();
      master.gain.value = 0.6;
      master.connect(this.ctx.destination);
      this.master = master;

      this.setupEngineSound();
      this.setupTireSound();
      this.setupHornSound();

      this.isInitialized = true;
    } catch (err) {
      console.warn('AudioContext not supported or blocked:', err);
    }
  }

  setupEngineSound() {
    this.engineMasterGain = this.ctx.createGain();
    this.engineMasterGain.gain.value = 0.25;

    // Primary low rumble (sawtooth for aggressive engine tone)
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.value = 55; // Idle ~55 Hz

    // Secondary harmonic (triangle for body)
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.value = 110;

    // Lowpass filter to muffle harsh high frequencies
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 450;
    this.filterNode.Q.value = 3.0;

    this.osc1.connect(this.filterNode);
    this.osc2.connect(this.filterNode);
    this.filterNode.connect(this.engineMasterGain);
    this.engineMasterGain.connect(this.master);

    this.osc1.start();
    this.osc2.start();
  }

  setupTireSound() {
    // Generate white noise buffer for tire squeal
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.skidFilter = this.ctx.createBiquadFilter();
    this.skidFilter.type = 'bandpass';
    this.skidFilter.frequency.value = 950;
    this.skidFilter.Q.value = 4.5;

    this.skidGain = this.ctx.createGain();
    this.skidGain.gain.value = 0; // Silent by default

    whiteNoise.connect(this.skidFilter);
    this.skidFilter.connect(this.skidGain);
    this.skidGain.connect(this.master);

    whiteNoise.start();
  }

  setupHornSound() {
    this.hornGain = this.ctx.createGain();
    this.hornGain.gain.value = 0;

    this.hornOsc1 = this.ctx.createOscillator();
    this.hornOsc1.type = 'triangle';
    this.hornOsc1.frequency.value = 420;

    this.hornOsc2 = this.ctx.createOscillator();
    this.hornOsc2.type = 'sawtooth';
    this.hornOsc2.frequency.value = 515;

    this.hornOsc1.connect(this.hornGain);
    this.hornOsc2.connect(this.hornGain);
    this.hornGain.connect(this.master);

    this.hornOsc1.start();
    this.hornOsc2.start();
  }

  update(speed, rpmRatio, isDrifting) {
    if (!this.isInitialized || this.isMuted) return;

    // Resume audio context if suspended
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // Engine pitch calculation
    // rpmRatio is between 0.1 (idle) and 1.0 (redline)
    const basePitch = 48 + rpmRatio * 180;
    this.osc1.frequency.setTargetAtTime(basePitch, this.ctx.currentTime, 0.05);
    this.osc2.frequency.setTargetAtTime(basePitch * 1.5, this.ctx.currentTime, 0.05);

    // Filter opens up as RPM climbs
    const filterFreq = 350 + rpmRatio * 1800;
    this.filterNode.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.05);

    // Volume dynamically scales with throttle and speed
    const vol = 0.15 + rpmRatio * 0.25;
    this.engineMasterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);

    // Tire screech sound
    if (isDrifting && speed > 15) {
      const screechIntensity = Math.min(1.0, (speed / 70) * 0.35);
      this.skidGain.gain.setTargetAtTime(screechIntensity, this.ctx.currentTime, 0.05);
    } else {
      this.skidGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
  }

  startHorn() {
    if (!this.isInitialized || this.isMuted) return;
    this.hornGain.gain.setTargetAtTime(0.35, this.ctx.currentTime, 0.03);
  }

  stopHorn() {
    if (!this.isInitialized) return;
    this.hornGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.master) {
      this.master.gain.value = this.isMuted ? 0 : 0.6;
    }
    return !this.isMuted;
  }
}
