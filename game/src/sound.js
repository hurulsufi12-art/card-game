// HARBORBOUND — tiny synthesised sounds (WebAudio, no audio files, no
// network). The context is created lazily on the first user gesture, so a
// silent page load never throws; M toggles mute.
export function createSound() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (muted) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') void ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }

  function tone(freq, dur, type, gain) {
    const audio = ensure();
    if (!audio) return;
    try {
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(gain, audio.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
      osc.connect(amp);
      amp.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + dur);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  return {
    playFlip() { tone(520, 0.09, 'triangle', 0.08); },
    playCard() { tone(330, 0.12, 'sine', 0.1); tone(495, 0.1, 'sine', 0.06); },
    playWin() { tone(523, 0.16, 'triangle', 0.1); tone(659, 0.16, 'triangle', 0.1); tone(784, 0.3, 'triangle', 0.12); },
    playLose() { tone(392, 0.2, 'sine', 0.08); tone(311, 0.35, 'sine', 0.08); },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
  };
}
