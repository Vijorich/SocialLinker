import assert from 'node:assert';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../assets/style.css', import.meta.url), 'utf8');
const modal = readFileSync(new URL('../assets/post-modal.js', import.meta.url), 'utf8');
const piano = readFileSync(new URL('../assets/piano.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../_config.yml', import.meta.url), 'utf8');
const postLayout = readFileSync(new URL('../_layouts/post.html', import.meta.url), 'utf8');

assert.match(css, /\.post-single\s*\{[^}]*z-index:\s*1/s, 'post content stacks above Silk');
assert.match(css, /\.sound-toggle\[hidden\]\s*\{\s*display:\s*none;/, 'hidden sound control is not focusable by layout');
assert.match(css, /--control-radius:\s*1rem/, 'controls use the shared soft-square radius');
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
