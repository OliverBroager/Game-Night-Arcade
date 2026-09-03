window.ArcadeAudio = (() => {
  const cache = new Map();
  let enabled = true;
  let volume = .7;
  let unlocked = false;

  function setup(state) {
    enabled = state.soundEnabled !== false;
    volume = Number.isFinite(Number(state.volume)) ? Number(state.volume) : .7;
  }
  function setEnabled(value) { enabled = Boolean(value); }
  function setVolume(value) { volume = Math.max(0, Math.min(1, Number(value) || 0)); }
  function unlock() { unlocked = true; }

  function source(name) { return window.ARCADE_CONFIG.sounds[name]; }
  function get(src) {
    if (!src) return null;
    if (!cache.has(src)) {
      const audio = new Audio(src);
      audio.preload = "auto";
      cache.set(src, audio);
    }
    return cache.get(src);
  }

  function playFile(src, options = {}) {
    if (!enabled || volume <= 0 || !src) return Promise.resolve(false);
    const original = get(src);
    if (!original) return Promise.resolve(false);
    const audio = original.cloneNode(true);
    audio.volume = Math.max(0, Math.min(1, volume * (options.volume ?? 1)));
    audio.playbackRate = options.rate ?? 1;
    return audio.play().then(() => { unlocked = true; return true; }).catch(() => false);
  }

  function play(name, options = {}) { return playFile(source(name), options); }
  function isUnlocked() { return unlocked; }
  return { setup, setEnabled, setVolume, play, playFile, unlock, isUnlocked };
})();
