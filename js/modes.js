window.ArcadeModes = (() => {
  const canvas = document.getElementById("wheelCanvas");
  const ctx = canvas.getContext("2d");
  const caseTrack = document.getElementById("caseTrack");
  const shuffleGrid = document.getElementById("shuffleGrid");
  const slotStrips = [...document.querySelectorAll(".slot-strip")];
  const slotLever = document.querySelector(".slot-lever");

  const TAU = Math.PI * 2;
  let wheelRotation = 0;
  let currentPool = [];
  let currentDisplay = "logo";
  let imageCache = new Map();
  let busy = false;

  const palette = ["#5cf5ff", "#ff4ed8", "#8b5cff", "#ffd84c", "#53f58c", "#ff6b70", "#ff8b3d", "#78a5ff"];

  function preloadImages(games) {
    games.forEach(game => {
      if (!game.logo || game.emoji || imageCache.has(game.logo)) return;
      const img = new Image();
      img.src = game.logo;
      imageCache.set(game.logo, img);
      img.addEventListener("load", () => drawWheel(currentPool, currentDisplay));
    });
  }

  function setPool(pool, display) {
    currentPool = pool;
    currentDisplay = display;
    preloadImages(pool);
    drawWheel(pool, display);
    buildCasePreview(pool, display);
    buildSlotPreview(pool, display);
    buildShufflePreview(pool, display);
  }

  function fitText(text, max, start = 24, min = 10) {
    let size = start;
    ctx.font = `900 ${size}px Inter, system-ui, sans-serif`;
    while (size > min && ctx.measureText(text).width > max) {
      size -= 1;
      ctx.font = `900 ${size}px Inter, system-ui, sans-serif`;
    }
    return size;
  }

  function drawWheel(pool, display, rotation = wheelRotation) {
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 28;
    ctx.clearRect(0, 0, size, size);

    if (!pool.length) {
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, TAU);
      ctx.fillStyle = "#111522";
      ctx.fill();
      ctx.strokeStyle = "#31384e";
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.fillStyle = "#9aa3b8";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 36px Inter, system-ui, sans-serif";
      ctx.fillText("NO GAMES ACTIVE", center, center - 95);
      return;
    }

    const arc = TAU / pool.length;
    ctx.save();
    ctx.translate(center, center);

    pool.forEach((game, index) => {
      const start = -Math.PI / 2 + rotation + index * arc;
      const end = start + arc;
      const accent = game.accent || palette[index % palette.length];

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();
      const gradient = ctx.createRadialGradient(0, 0, radius * .1, 0, 0, radius);
      gradient.addColorStop(0, "#121728");
      gradient.addColorStop(.35, accent + "55");
      gradient.addColorStop(1, accent + "BB");
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.23)";
      ctx.lineWidth = 3;
      ctx.stroke();

      const mid = start + arc / 2;
      ctx.save();
      ctx.rotate(mid);
      ctx.translate(radius * .68, 0);
      ctx.rotate(Math.PI / 2);

      if (display === "logo" && arc > 0.16) {
        if (game.emoji) {
          const emojiSize = Math.max(30, Math.min(82, arc * 270));
          ctx.font = `${emojiSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(0,0,0,.55)";
          ctx.shadowBlur = 12;
          ctx.fillText(game.emoji, 0, 2);
          ctx.shadowBlur = 0;
        } else {
          const img = imageCache.get(game.logo);
          if (img && img.complete && img.naturalWidth) {
            const imageSize = Math.max(32, Math.min(96, arc * 300));
            ctx.shadowColor = "rgba(0,0,0,.5)";
            ctx.shadowBlur = 14;
            ctx.drawImage(img, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
            ctx.shadowBlur = 0;
          } else {
            drawInitials(game.name, arc);
          }
        }
      } else {
        const available = Math.max(65, radius * arc * .62);
        const fontSize = fitText(game.name.toUpperCase(), available, Math.min(25, arc * 105), 9);
        ctx.font = `900 ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "rgba(0,0,0,.7)";
        ctx.shadowBlur = 8;
        ctx.fillText(game.name.toUpperCase(), 0, 0);
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.strokeStyle = "#252b3f";
    ctx.lineWidth = 22;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius - 12, 0, TAU);
    ctx.strokeStyle = "rgba(92,245,255,.55)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawInitials(name, arc) {
    const initials = name.split(/\s+/).map(p => p[0]).join("").slice(0, 3).toUpperCase();
    ctx.fillStyle = "rgba(5,7,12,.75)";
    const s = Math.max(32, Math.min(74, arc * 240));
    ctx.beginPath();
    ctx.roundRect(-s/2, -s/2, s, s, 14);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${Math.max(13, s*.32)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, 0, 1);
  }

  function gameItemMarkup(game, display, className = "case-item") {
    const visual = display === "logo"
      ? (game.emoji
          ? `<span class="selector-emoji" aria-label="${escapeHtml(game.name)}">${game.emoji}</span>`
          : `<img src="${game.logo}" alt="${escapeHtml(game.name)} logo">`)
      : `<strong>${escapeHtml(game.name)}</strong>`;
    return `<div class="${className}" style="--item-accent:${game.accent || "#5cf5ff"}">${visual}</div>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  }

  function randomGame(pool) { return pool[Math.floor(Math.random() * pool.length)]; }

  function buildCasePreview(pool, display) {
    if (!pool.length) {
      caseTrack.innerHTML = `<div class="case-item"><strong>NO GAMES ACTIVE</strong></div>`;
      return;
    }
    caseTrack.style.transition = "none";
    caseTrack.style.transform = "translate3d(0,0,0)";
    const items = Array.from({ length: Math.max(12, pool.length * 2) }, (_, i) => pool[i % pool.length]);
    caseTrack.innerHTML = items.map(game => gameItemMarkup(game, display)).join("");
  }

  function buildSlotPreview(pool, display) {
    slotStrips.forEach((strip, reelIndex) => {
      if (!pool.length) {
        strip.innerHTML = `<div class="slot-item"><strong>NO GAMES</strong></div>`;
        return;
      }
      strip.style.transition = "none";
      strip.style.transform = "translateY(-60px)";
      const items = Array.from({ length: 7 }, (_, i) => pool[(i + reelIndex) % pool.length]);
      strip.innerHTML = items.map(game => gameItemMarkup(game, display, "slot-item")).join("");
    });
  }

  function buildShufflePreview(pool, display) {
    if (!pool.length) {
      shuffleGrid.innerHTML = `<div class="shuffle-tile"><strong>NO GAMES ACTIVE</strong></div>`;
      return;
    }
    const count = 12;
    shuffleGrid.innerHTML = Array.from({ length: count }, (_, i) => {
      const game = pool[i % pool.length];
      return gameItemMarkup(game, display, "shuffle-tile");
    }).join("");
  }

  function easeOutQuint(t) { return 1 - Math.pow(1 - t, 5); }

  function spinWheel(pool, display, winner, duration, done) {
    const winnerIndex = pool.findIndex(g => g.id === winner.id);
    const arc = TAU / pool.length;
    const targetMod = -(winnerIndex * arc + arc / 2);
    const currentNorm = ((wheelRotation % TAU) + TAU) % TAU;
    const targetNorm = ((targetMod % TAU) + TAU) % TAU;
    let delta = targetNorm - currentNorm;
    if (delta < 0) delta += TAU;
    delta += TAU * (6 + Math.floor(Math.random() * 3));

    const startRotation = wheelRotation;
    const finalRotation = startRotation + delta;
    const start = performance.now();
    let lastSegment = -1;

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      wheelRotation = startRotation + delta * easeOutQuint(t);
      drawWheel(pool, display, wheelRotation);

      const pointerAngle = ((-wheelRotation) % TAU + TAU) % TAU;
      const segment = Math.floor(pointerAngle / arc) % pool.length;
      if (segment !== lastSegment && t < .94) {
        window.ArcadeAudio.play("tick", { volume: .55, rate: .9 + t * .45 });
        lastSegment = segment;
      }

      if (t < 1) requestAnimationFrame(frame);
      else {
        wheelRotation = finalRotation;
        drawWheel(pool, display, wheelRotation);
        done();
      }
    }
    window.ArcadeAudio.play("spin", { volume: .65 });
    requestAnimationFrame(frame);
  }

  function readTranslate(element, axis = "x") {
    const transform = getComputedStyle(element).transform;
    if (!transform || transform === "none") return 0;
    try {
      const matrix = new DOMMatrixReadOnly(transform);
      return axis === "y" ? matrix.m42 : matrix.m41;
    } catch (_) {
      const values = transform.match(/matrix(?:3d)?\(([^)]+)\)/);
      if (!values) return 0;
      const parts = values[1].split(",").map(Number);
      return transform.startsWith("matrix3d")
        ? (axis === "y" ? parts[13] : parts[12])
        : (axis === "y" ? parts[5] : parts[4]);
    }
  }

  // Plays one click exactly when the selector crosses into the next game.
  // This follows the real rendered transform, so the audio naturally slows with the animation.
  function trackCrossings(track, viewport, axis, soundName, duration, options = {}) {
    const children = [...track.children];
    if (children.length < 2) return () => {};

    const centerOf = child => axis === "y"
      ? child.offsetTop + child.offsetHeight / 2
      : child.offsetLeft + child.offsetWidth / 2;
    const firstCenter = centerOf(children[0]);
    const step = centerOf(children[1]) - firstCenter;
    if (!step) return () => {};

    let stopped = false;
    let lastIndex = null;
    const started = performance.now();

    function frame(now) {
      if (stopped) return;
      const translate = readTranslate(track, axis);
      const viewportCenter = axis === "y" ? viewport.clientHeight / 2 : viewport.clientWidth / 2;
      const pointerInTrack = viewportCenter - translate;
      const index = Math.max(0, Math.min(children.length - 1, Math.round((pointerInTrack - firstCenter) / step)));

      if (lastIndex === null) {
        lastIndex = index;
      } else if (index !== lastIndex) {
        const elapsed = Math.min(1, (now - started) / Math.max(1, duration));
        const jumps = Math.min(4, Math.abs(index - lastIndex));
        for (let i = 0; i < jumps; i++) {
          window.ArcadeAudio.play(soundName, {
            volume: options.volume ?? .35,
            rate: (options.baseRate ?? 1) + (options.rateDrift ?? 0) * elapsed
          });
        }
        lastIndex = index;
      }

      if (now - started <= duration + 140) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
    return () => { stopped = true; };
  }

  function spinCase(pool, display, winner, duration, done) {
    const winnerIndex = 42;
    const total = 51;
    const items = [];
    for (let i = 0; i < total; i++) items.push(i === winnerIndex ? winner : randomGame(pool));
    caseTrack.style.transition = "none";
    caseTrack.style.transform = "translate3d(0,0,0)";
    caseTrack.innerHTML = items.map(game => gameItemMarkup(game, display)).join("");
    void caseTrack.offsetWidth;

    const targetEl = caseTrack.children[winnerIndex];
    const windowEl = caseTrack.parentElement;
    const target = windowEl.clientWidth / 2 - (targetEl.offsetLeft + targetEl.offsetWidth / 2);
    const jitter = Math.max(-34, Math.min(34, (Math.random() - .5) * 50));

    caseTrack.style.transition = `transform ${duration}ms cubic-bezier(.08,.68,.06,1)`;
    caseTrack.style.transform = `translate3d(${target + jitter}px,0,0)`;

    const stopClicks = trackCrossings(caseTrack, windowEl, "x", "caseClick", duration, {
      volume: .42,
      baseRate: 1.08,
      rateDrift: -.16
    });

    setTimeout(() => {
      stopClicks();
      done();
    }, duration + 100);
  }

  function makeSlotItems(pool, finalGame, count = 28) {
    const items = Array.from({ length: count }, () => randomGame(pool));
    items[count - 3] = finalGame;
    return items;
  }

  function spinSlot(pool, display, winner, duration, done) {
    slotLever.classList.add("pulled");
    setTimeout(() => slotLever.classList.remove("pulled"), 450);
    window.ArcadeAudio.play("reel", { volume: .65 });

    // Every reel lands on the SAME game, jackpot-style, but each reel travels
    // through a different random sequence, distance and duration.
    const reelCounts = [27, 32, 38];
    const durationOffsets = [0, 420, 880];
    let finished = 0;

    slotStrips.forEach((strip, reelIndex) => {
      const items = makeSlotItems(pool, winner, reelCounts[reelIndex]);
      strip.style.transition = "none";
      strip.style.transform = "translateY(-60px)";
      strip.innerHTML = items.map(game => gameItemMarkup(game, display, "slot-item")).join("");
      void strip.offsetWidth;

      const targetIndex = items.length - 3;
      const reel = strip.parentElement;
      const targetEl = strip.children[targetIndex];
      const target = reel.clientHeight / 2 - (targetEl.offsetTop + targetEl.offsetHeight / 2);
      const reelDuration = duration + durationOffsets[reelIndex];

      strip.style.transition = `transform ${reelDuration}ms cubic-bezier(.1,.72,.08,1)`;
      strip.style.transform = `translateY(${target}px)`;

      const stopClicks = trackCrossings(strip, reel, "y", "tick", reelDuration, {
        volume: .16,
        baseRate: .94 + reelIndex * .08,
        rateDrift: -.08
      });

      setTimeout(() => {
        stopClicks();
        window.ArcadeAudio.play("tick", { volume: .48, rate: 1 + reelIndex * .08 });
        finished++;
        if (finished === slotStrips.length) done();
      }, reelDuration + 60);
    });
  }

  function replaceShuffleTile(tile, game, display) {
    tile.style.setProperty("--item-accent", game.accent || "#5cf5ff");
    tile.innerHTML = display === "logo"
      ? (game.emoji ? `<span class="selector-emoji" aria-label="${escapeHtml(game.name)}">${game.emoji}</span>` : `<img src="${game.logo}" alt="${escapeHtml(game.name)} logo">`)
      : `<strong>${escapeHtml(game.name)}</strong>`;
  }

  function spinShuffle(pool, display, winner, duration, done) {
    buildShufflePreview(pool, display);
    const tiles = [...shuffleGrid.children];
    const winnerTileIndex = tiles.length >= 8 ? 5 : 0;
    const start = performance.now();
    let lastPulse = 0;

    function pulse(now) {
      const t = Math.min(1, (now - start) / duration);
      const interval = 55 + Math.pow(t, 3) * 390;
      if (now - lastPulse >= interval) {
        tiles.forEach(tile => tile.classList.remove("hot"));
        const index = t > .88 ? winnerTileIndex : Math.floor(Math.random() * tiles.length);
        const game = t > .92 ? winner : randomGame(pool);
        replaceShuffleTile(tiles[index], game, display);
        tiles[index].classList.add("hot");
        window.ArcadeAudio.play("tick", { volume: .32, rate: 1.35 - t * .45 });
        lastPulse = now;
      }
      if (t < 1) requestAnimationFrame(pulse);
      else {
        tiles.forEach(tile => tile.classList.remove("hot"));
        replaceShuffleTile(tiles[winnerTileIndex], winner, display);
        tiles[winnerTileIndex].classList.add("hot");
        setTimeout(done, 300);
      }
    }
    requestAnimationFrame(pulse);
  }

  function spin(mode, pool, display, winner, reducedMotion, done) {
    if (busy) return false;
    if (!pool.length) return false;
    busy = true;
    const base = window.ARCADE_CONFIG.animation;
    const multiplier = reducedMotion ? .24 : 1;
    const complete = () => { busy = false; done(); };

    if (mode === "case") spinCase(pool, display, winner, base.caseMs * multiplier, complete);
    else if (mode === "slot") spinSlot(pool, display, winner, base.slotMs * multiplier, complete);
    else if (mode === "shuffle") spinShuffle(pool, display, winner, base.shuffleMs * multiplier, complete);
    else spinWheel(pool, display, winner, base.wheelMs * multiplier, complete);
    return true;
  }

  function isBusy() { return busy; }

  return { setPool, drawWheel, spin, isBusy };
})();
