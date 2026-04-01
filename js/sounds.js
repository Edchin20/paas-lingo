// ═══════════════════════════════════════════
// SOUNDS - Synthesized audio (geen bestanden nodig)
// ═══════════════════════════════════════════

const Sounds = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'sine', vol = 0.3) {
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, c.currentTime);
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur);
    } catch (e) {}
  }

  return {
    flip()      { tone(800, 0.1, 'sine', 0.2); },
    correct()   {
      setTimeout(() => tone(523, 0.15, 'sine', 0.3), 0);
      setTimeout(() => tone(659, 0.15, 'sine', 0.3), 150);
      setTimeout(() => tone(784, 0.15, 'sine', 0.3), 300);
      setTimeout(() => tone(1047, 0.3, 'sine', 0.3), 450);
    },
    incorrect() {
      tone(200, 0.3, 'sawtooth', 0.2);
      setTimeout(() => tone(150, 0.4, 'sawtooth', 0.2), 200);
    },
    switchTurn(){
      tone(440, 0.1, 'sine', 0.2);
      setTimeout(() => tone(550, 0.15, 'sine', 0.2), 120);
    },
    victory() {
      [523,659,784,1047,784,1047,1319].forEach((f, i) => {
        setTimeout(() => tone(f, 0.2, 'sine', 0.3), i * 150);
      });
    },
    type() { tone(600 + Math.random() * 200, 0.05, 'sine', 0.1); },
    tick() { tone(1000, 0.05, 'square', 0.1); },
  };
})();
