// Synthesized Ambient Noise generator using the Web Audio API
class AmbientNoiseService {
  constructor() {
    this.audioCtx = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.isPlaying = false;
  }

  // Initialize context on first user interaction (browser security requirement)
  init() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(0.18, this.audioCtx.currentTime); // Low background volume
    this.gainNode.connect(this.audioCtx.destination);
  }

  start() {
    if (this.isPlaying) return;
    if (!this.audioCtx) this.init();

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // Generate 2 seconds of loopable audio buffer
    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise DSP filter approximation (1/f^2 spectral density)
      // Generates a soft, comforting low-frequency waterfall/rain rumble
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain scale adjustments
    }

    this.sourceNode = this.audioCtx.createBufferSource();
    this.sourceNode.buffer = noiseBuffer;
    this.sourceNode.loop = true;
    this.sourceNode.connect(this.gainNode);
    this.sourceNode.start(0);

    this.isPlaying = true;
  }

  stop() {
    if (!this.isPlaying) return;
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (err) {
        // Handle edge-cases if node wasn't started
      }
      this.sourceNode.disconnect();
    }
    this.isPlaying = false;
  }
}

export const ambientNoise = new AmbientNoiseService();
