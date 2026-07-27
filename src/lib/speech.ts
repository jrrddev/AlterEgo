export class SpeechService {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private isMuted: boolean = false;

  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : (null as any);
    if (this.synth) {
      this.initVoice();
      // Voices load asynchronously in some browsers
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = this.initVoice.bind(this);
      }
    }
  }

  private initVoice() {
    const voices = this.synth.getVoices();
    // Try to find a good default English voice
    this.voice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || 
                 voices.find(v => v.lang.startsWith('en')) || 
                 voices[0] || null;
  }

  public speak(text: string, options?: { pitch?: number; rate?: number }) {
    if (this.isMuted || !this.synth || !this.voice) return;

    // Cancel any ongoing speech before starting a new one
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.voice;
    utterance.pitch = options?.pitch ?? 1;
    utterance.rate = options?.rate ?? 1;

    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stop();
    }
    return this.isMuted;
  }

  public getMutedState() {
    return this.isMuted;
  }
}

export const speechService = new SpeechService();
