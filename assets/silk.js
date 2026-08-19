// Vanilla port of the React Bits <Silk /> component (reactbits.dev).
// The thin React/three shell is dropped; the shader runs on the same vendored
// `ogl` ESM used by scanner.js (Renderer, Program, Mesh, Triangle). The pattern
// coordinate is normalized by the canvas HEIGHT (not the viewport), so wave
// size stays constant across window widths instead of scaling with them.
import { Renderer, Program, Mesh, Triangle } from './ogl.js';

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [0.482, 0.459, 0.506]; // #7B7481 — the component default
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
};

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  iResolution;
uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd = noise(gl_FragCoord.xy);
  // Fixed pixel scale: normalize by the canvas HEIGHT so the wave size stays
  // constant across window widths — a narrow phone no longer squeezes the
  // pattern into thin waves; width only changes how many waves are visible.
  vec2  uv      = rotateUvs((gl_FragCoord.xy / iResolution.y) * uScale, uRotation);
  vec2  tex     = uv * uScale;
  float tOffset = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  fragColor = col;
}
`;

const DEFAULTS = {
  speed: 5,
  scale: 1,
  color: '#7B7481',
  noiseIntensity: 1.5,
  rotation: 0,
};

export function createSilk(container, options = {}) {
  if (!container) return null;

  const opts = { ...DEFAULTS, ...options };

  const renderer = new Renderer({
    webgl: 2,
    alpha: false,
    antialias: false,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
  });

  const gl = renderer.gl;
  const canvas = gl.canvas;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      iResolution: { value: new Float32Array([1, 1]) },
      uTime: { value: 0 },
      uSpeed: { value: 5 },
      uScale: { value: 1 },
      uRotation: { value: 0 },
      uNoiseIntensity: { value: 1.5 },
      uColor: { value: new Float32Array([0.482, 0.459, 0.506]) },
    },
  });

  const mesh = new Mesh(gl, { geometry, program });

  const applyOpts = () => {
    const u = program.uniforms;
    u.uSpeed.value = opts.speed;
    u.uScale.value = opts.scale;
    u.uRotation.value = opts.rotation;
    u.uNoiseIntensity.value = opts.noiseIntensity;
    const c = hexToRgb(opts.color);
    u.uColor.value[0] = c[0];
    u.uColor.value[1] = c[1];
    u.uColor.value[2] = c[2];
    // Clear to the silk base color so the first frame never flashes black.
    gl.clearColor(c[0], c[1], c[2], 1);
  };
  applyOpts();

  const setSize = () => {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    // The layer now spans the whole document height. Cap the buffer so a tall
    // page can't blow past the GPU's max texture size (typically 8192) and
    // black out the background; the pattern is soft, so the dropped resolution
    // on very long pages is invisible.
    renderer.dpr = Math.min(Math.min(window.devicePixelRatio || 1, 2), 4096 / h);
    renderer.setSize(w, h);
    const res = program.uniforms.iResolution.value;
    res[0] = gl.drawingBufferWidth;
    res[1] = gl.drawingBufferHeight;
    renderer.render({ scene: mesh });
  };

  const ro = new ResizeObserver(setSize);
  ro.observe(container);
  setSize();

  let raf = 0;
  let isVisible = true;
  let isPageVisible = !document.hidden;
  const t0 = performance.now();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const render = (t) => {
    // Faithful to the original: uTime accumulates at 0.1 * delta (three.js
    // delta seconds). Summing over frames equals 0.1 * elapsed seconds.
    program.uniforms.uTime.value = 0.1 * ((t - t0) * 0.001);
    renderer.render({ scene: mesh });
  };

  const loop = (t) => {
    render(t);
    raf = requestAnimationFrame(loop);
  };

  const tryStart = () => {
    if (isVisible && isPageVisible && raf === 0) raf = requestAnimationFrame(loop);
  };
  const tryStop = () => {
    if (raf !== 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) tryStart();
      else tryStop();
    },
    { threshold: 0 }
  );
  io.observe(container);

  const onVisibility = () => {
    isPageVisible = !document.hidden;
    if (isPageVisible) tryStart();
    else tryStop();
  };
  document.addEventListener('visibilitychange', onVisibility);

  if (reduced) {
    render(performance.now());
  } else {
    tryStart();
  }

  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    tryStop();
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    try {
      container.removeChild(canvas);
    } catch {}
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };

  return {
    update(next = {}) {
      Object.assign(opts, next);
      if (!destroyed) applyOpts();
    },
    destroy,
  };
}

export function initSilk(root = document) {
  const instances = [];
  root.querySelectorAll('[data-silk]').forEach((el) => {
    let opts = {};
    const cfg = el.getAttribute('data-config');
    if (cfg) {
      try {
        opts = JSON.parse(cfg);
      } catch {}
    }
    const inst = createSilk(el, opts);
    if (inst) instances.push(inst);
  });
  return instances;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initSilk());
} else {
  initSilk();
}
