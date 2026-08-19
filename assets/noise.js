// Vanilla port of the React Bits <Noise /> component (reactbits.dev).
// Full-screen animated grain canvas. Auto-inits every [data-noise] element,
// reading options from its data-config JSON (Jekyll renders _data/*.yml).
// One ImageData buffer is reused across frames (the original re-allocated on
// every draw) and a single static frame renders under prefers-reduced-motion.
const DEFAULTS = {
  patternSize: 1024,
  patternScaleX: 1,
  patternScaleY: 1,
  patternRefreshInterval: 2,
  patternAlpha: 15,
};

export function createNoise(canvas, options = {}) {
  if (!canvas) return null;
  const opts = { ...DEFAULTS, ...options };
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return null;

  const size = Math.max(64, Math.round(opts.patternSize));
  canvas.width = size;
  canvas.height = size;
  canvas.style.width = `${100 * opts.patternScaleX}vw`;
  canvas.style.height = `${100 * opts.patternScaleY}vh`;
  canvas.style.imageRendering = 'pixelated';

  const alpha = Math.max(0, Math.min(255, opts.patternAlpha));
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const draw = () => {
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = alpha;
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const interval = Math.max(1, Math.round(opts.patternRefreshInterval) || 1);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;
  let frame = 0;
  const loop = () => {
    if (frame % interval === 0) draw();
    frame++;
    raf = requestAnimationFrame(loop);
  };
  if (reduced) {
    draw();
  } else {
    raf = requestAnimationFrame(loop);
  }

  let destroyed = false;
  return {
    update(next = {}) {
      Object.assign(opts, next);
      const s = Math.max(64, Math.round(opts.patternSize));
      if (s !== canvas.width || s !== canvas.height) {
        canvas.width = s;
        canvas.height = s;
      }
      canvas.style.width = `${100 * opts.patternScaleX}vw`;
      canvas.style.height = `${100 * opts.patternScaleY}vh`;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
    },
  };
}

export function initNoise(root = document) {
  const instances = [];
  root.querySelectorAll('[data-noise]').forEach((el) => {
    let opts = {};
    const cfg = el.getAttribute('data-config');
    if (cfg) {
      try {
        opts = JSON.parse(cfg);
      } catch {}
    }
    const inst = createNoise(el, opts);
    if (inst) instances.push(inst);
  });
  return instances;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initNoise());
} else {
  initNoise();
}
