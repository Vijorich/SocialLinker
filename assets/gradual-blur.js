// Vanilla port of the React Bits <GradualBlur /> component (reactbits.dev).
// The thin React shell is dropped; the stacking of backdrop-filter layers with
// gradient masks is unchanged. Auto-inits every [data-gradual-blur] element,
// reading options from its data-config JSON (Jekyll renders _data/*.yml).
const DEFAULT_CONFIG = {
  position: 'bottom',
  strength: 2,
  height: '6rem',
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: '0.3s',
  easing: 'ease-out',
  opacity: 1,
  curve: 'linear',
  target: 'parent',
};

const PRESETS = {
  top: { position: 'top', height: '6rem' },
  bottom: { position: 'bottom', height: '6rem' },
  left: { position: 'left', height: '6rem' },
  right: { position: 'right', height: '6rem' },
  subtle: { height: '4rem', strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: '10rem', strength: 4, divCount: 8, exponential: true },
  smooth: { height: '8rem', curve: 'bezier', divCount: 10 },
  sharp: { height: '5rem', curve: 'linear', divCount: 4 },
  header: { position: 'top', height: '8rem', curve: 'ease-out' },
  footer: { position: 'bottom', height: '8rem', curve: 'ease-out' },
  sidebar: { position: 'left', height: '6rem', strength: 2.5 },
  'page-header': { position: 'top', height: '10rem', target: 'page', strength: 3 },
  'page-footer': { position: 'bottom', height: '10rem', target: 'page', strength: 3 },
};

const CURVE_FUNCTIONS = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  'ease-in': (p) => p * p,
  'ease-out': (p) => 1 - Math.pow(1 - p, 2),
  'ease-in-out': (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

const getGradientDirection = (position) =>
  ({ top: 'to top', bottom: 'to bottom', left: 'to left', right: 'to right' })[position] || 'to bottom';

export function createGradualBlur(container, options = {}) {
  if (!container) return null;

  const opts = { ...DEFAULT_CONFIG, ...(options.preset && PRESETS[options.preset]), ...options };
  const outer = container;
  const inner = document.createElement('div');
  inner.className = 'gradual-blur-inner';
  outer.appendChild(inner);

  let isVisible = true;
  let isHovered = false;

  const build = () => {
    outer.className = `gradual-blur ${opts.target === 'page' ? 'gradual-blur-page' : 'gradual-blur-parent'} ${opts.className || ''}`.trim();

    const vertical = opts.position === 'top' || opts.position === 'bottom';
    const horizontal = opts.position === 'left' || opts.position === 'right';
    const pageTarget = opts.target === 'page';

    outer.style.position = pageTarget ? 'fixed' : 'absolute';
    outer.style.pointerEvents = opts.hoverIntensity ? 'auto' : 'none';
    outer.style.opacity = isVisible ? '1' : '0';
    outer.style.transition = opts.animated ? `opacity ${opts.duration} ${opts.easing}` : '';
    outer.style.zIndex = String(pageTarget ? opts.zIndex + 100 : opts.zIndex);

    if (vertical) {
      outer.style.top = opts.position === 'top' ? '0' : '';
      outer.style.bottom = opts.position === 'bottom' ? '0' : '';
      outer.style.left = '0';
      outer.style.right = '0';
      outer.style.height = opts.height;
      outer.style.width = opts.width || '100%';
    } else if (horizontal) {
      outer.style.left = opts.position === 'left' ? '0' : '';
      outer.style.right = opts.position === 'right' ? '0' : '';
      outer.style.top = '0';
      outer.style.bottom = '0';
      outer.style.width = opts.width || opts.height;
      outer.style.height = '100%';
    }

    inner.innerHTML = '';
    // Always-visible fade underlay: content melts into the modal background at
    // the edge even where backdrop-filter silently fails to sample the scroll
    // layer; the blur layers paint on top of it where supported.
    const fade = document.createElement('div');
    fade.style.position = 'absolute';
    fade.style.inset = '0';
    const edge = 'rgba(48, 21, 18, 0.55)';
    const fades = {
      top: `linear-gradient(to bottom, ${edge} 0%, transparent 100%)`,
      bottom: `linear-gradient(to top, ${edge} 0%, transparent 100%)`,
      left: `linear-gradient(to right, ${edge} 0%, transparent 100%)`,
      right: `linear-gradient(to left, ${edge} 0%, transparent 100%)`,
    };
    fade.style.background = fades[opts.position] || fades.bottom;
    inner.appendChild(fade);

    const increment = 100 / opts.divCount;
    const strength = isHovered && opts.hoverIntensity ? opts.strength * opts.hoverIntensity : opts.strength;
    const curve = CURVE_FUNCTIONS[opts.curve] || CURVE_FUNCTIONS.linear;

    for (let i = 1; i <= opts.divCount; i++) {
      let progress = curve(i / opts.divCount);
      const blurValue = opts.exponential
        ? Math.pow(2, progress * 4) * 0.0625 * strength
        : 0.0625 * (progress * opts.divCount + 1) * strength;

      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const d = document.createElement('div');
      const mask = `linear-gradient(${getGradientDirection(opts.position)}, ${gradient})`;
      d.style.position = 'absolute';
      d.style.inset = '0';
      d.style.maskImage = mask;
      d.style.WebkitMaskImage = mask;
      d.style.backdropFilter = `blur(${blurValue.toFixed(3)}rem)`;
      d.style.WebkitBackdropFilter = `blur(${blurValue.toFixed(3)}rem)`;
      d.style.opacity = String(opts.opacity);
      if (opts.animated && opts.animated !== 'scroll') {
        d.style.transition = `backdrop-filter ${opts.duration} ${opts.easing}`;
      }
      inner.appendChild(d);
    }
  };

  let io = null;
  if (opts.animated === 'scroll') {
    io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      outer.style.opacity = isVisible ? '1' : '0';
    }, { threshold: 0.1 });
    io.observe(outer);
  }

  const onEnter = () => { isHovered = true; build(); };
  const onLeave = () => { isHovered = false; build(); };
  if (opts.hoverIntensity) {
    outer.addEventListener('mouseenter', onEnter);
    outer.addEventListener('mouseleave', onLeave);
  }

  build();

  return {
    update(next = {}) {
      Object.assign(opts, next);
      build();
    },
    destroy() {
      io?.disconnect();
      if (opts.hoverIntensity) {
        outer.removeEventListener('mouseenter', onEnter);
        outer.removeEventListener('mouseleave', onLeave);
      }
      outer.innerHTML = '';
    },
  };
}

export function initGradualBlur(root = document) {
  const instances = [];
  root.querySelectorAll('[data-gradual-blur]').forEach((el) => {
    let opts = {};
    const cfg = el.getAttribute('data-config');
    if (cfg) {
      try {
        opts = JSON.parse(cfg);
      } catch {}
    }
    const inst = createGradualBlur(el, opts);
    if (inst) instances.push(inst);
  });
  return instances;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initGradualBlur());
} else {
  initGradualBlur();
}
