import assert from 'node:assert';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../assets/style.css', import.meta.url), 'utf8');
const modal = readFileSync(new URL('../assets/post-modal.js', import.meta.url), 'utf8');
const piano = readFileSync(new URL('../assets/piano.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../_config.yml', import.meta.url), 'utf8');
const postLayout = readFileSync(new URL('../_layouts/post.html', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../_layouts/default.html', import.meta.url), 'utf8');
const hero = readFileSync(new URL('../_includes/hero.html', import.meta.url), 'utf8');

assert.match(css, /\.post-single\s*\{[^}]*z-index:\s*1/s, 'post content stacks above Silk');
assert.match(css, /\.sound-toggle\[hidden\],\s*\.motion-toggle\[hidden\]\s*\{\s*display:\s*none;/, 'hidden controls are not focusable by layout');
assert.match(css, /\.link-card:hover \.project-desc/, 'project description promotes on hover');
assert.match(css, /\.link-card:focus-visible \.project-desc/, 'project description promotes on focus');
assert.match(css, /html\[data-motion="paused"\]/, 'motion pause stops animation');
assert.match(layout, /class="motion-toggle"/, 'motion pause control is present');
assert.match(hero, /fetchpriority="high"/, 'hero image is high priority');
assert.match(css, /--control-radius:\s*1rem/, 'controls use the shared soft-square radius');
assert.match(css, /--card-radius:\s*0\.75rem/, 'link cards use the restrained radius');
assert.doesNotMatch(css, /\.hero:has\(\.avatar\.live\)\s*~\s*\.container/, 'live selector has valid ancestor structure');
assert.match(modal, /showModal\s*!==\s*'function'/, 'unsupported dialogs keep native post links');
assert.match(modal, /if \(g !== gen\) return;/, 'stale modal work is invalidated');
assert.match(piano, /canHover\(\)/, 'touch audio gates hover-only voices');
assert.match(config, /permalink:\s*\/:year\/:month\/:day\/:title\//, 'posts use trailing-slash permalinks');
for (const excluded of ['tests', 'scripts', 'reports', 'docs', 'Gemfile.lock']) {
  assert.match(config, new RegExp(`\\n\\s+- ${excluded.replace('.', '\\.')}(?:\\n|$)`), `${excluded} is excluded from Jekyll output`);
}
assert.match(postLayout, /<main class="post-single"/, 'standalone post has a main landmark');
assert.match(postLayout, /<a class="post-close" href=/, 'standalone close has a no-JS link fallback');

console.log('static-regressions: 1/1 guard set passed');
