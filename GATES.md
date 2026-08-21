# Gates: audit-fix batch (13 findings → SocialLinker)

Scope: implement every finding from the full audit (tests, a11y, copy, UI polish, code hygiene) with runnable proof per outcome.

- [x] G1: piano test suite green, including new mute group (T1 rewritten for silent pre-gesture hover)
  CHECK: node tests/piano.test.mjs
  EXPECT: /6\/6 check groups passed/
  EVIDENCE: piano: 6/6 check groups passed

- [x] G2: modal-history regression suite still green
  CHECK: node tests/modal-history.test.mjs
  EXPECT: /9\/9 checks passed/
  EVIDENCE: modal-history: 9/9 checks passed

- [x] G3: all touched JS parses
  CHECK: node --check assets/piano.js && node --check assets/silk.js && node --check assets/badges.js && echo SYNTAX_OK
  EXPECT: SYNTAX_OK
  EVIDENCE: SYNTAX_OK

- [x] G4: click-outside-goes-back gesture fully removed from standalone post page
  CHECK: node -e "const s=require('fs').readFileSync('_layouts/default.html','utf8');console.log(s.includes('goBack')?'GOBACK_PRESENT':'GOBACK_GONE')"
  EXPECT: GOBACK_GONE
  EVIDENCE: GOBACK_GONE

- [x] G5: skip-link retargeted per page (article on posts, absent on 404)
  CHECK: node -e "const f=require('fs');const a=f.readFileSync('_layouts/default.html','utf8'),b=f.readFileSync('_layouts/post.html','utf8');console.log(a.includes('skip_to_content')&&b.includes('post-content')?'SKIP_OK':'SKIP_BAD')"
  EXPECT: SKIP_OK
  EVIDENCE: SKIP_OK

- [x] G6: mute toggle wired end-to-end (markup, icons, CSS, piano.js persistence)
  CHECK: node -e "const f=require('fs');const p=f.readFileSync('assets/piano.js','utf8'),h=f.readFileSync('_layouts/default.html','utf8'),c=f.readFileSync('assets/style.css','utf8'),i=f.readFileSync('_includes/icon.html','utf8');console.log(p.includes('sl-audio')&&h.includes('sound-toggle')&&c.includes('.sound-toggle')&&i.includes('sound')&&i.includes('mute')?'MUTE_OK':'MUTE_BAD')"
  EXPECT: MUTE_OK
  EVIDENCE: MUTE_OK

- [x] G7: prose typos fixed in next-step post
  CHECK: node -e "const s=require('fs').readFileSync('_posts/2026-07-29-next-step.md','utf8');console.log(s.includes('требутеся')||s.includes('функционалу..')?'TYPOS_BAD':'TYPOS_GONE')"
  EXPECT: TYPOS_GONE
  EVIDENCE: TYPOS_GONE

- [x] G8: empty states point forward
  CHECK: node -e "const s=require('fs').readFileSync('_data/locale.yml','utf8');console.log(/posts_empty:.*появятся/.test(s)&&/projects_empty:.*появятся/.test(s)?'EMPTY_OK':'EMPTY_BAD')"
  EXPECT: EMPTY_OK
  EVIDENCE: EMPTY_OK

- [x] G9: press-scale respects the 0.95 floor (no 0.90–0.94 values)
  CHECK: node -e "const s=require('fs').readFileSync('assets/style.css','utf8');console.log(/scale: 0\.9[0-4]/.test(s)?'SCALE_BAD':'SCALE_OK')"
  EXPECT: SCALE_OK
  EVIDENCE: SCALE_OK

- [x] G10: failed article fetches are no longer negatively cached
  CHECK: node -e "const s=require('fs').readFileSync('_layouts/default.html','utf8');console.log(s.includes('if(art)cache.set(url,art)')?'CACHE_OK':'CACHE_BAD')"
  EXPECT: CACHE_OK
  EVIDENCE: CACHE_OK

- [x] G11: og:url meta present
  CHECK: node -e "const s=require('fs').readFileSync('_layouts/default.html','utf8');console.log(s.includes('og:url')?'OG_OK':'OG_BAD')"
  EXPECT: OG_OK
  EVIDENCE: OG_OK

- [x] G12: twitter:card meta present
  CHECK: node -e "const s=require('fs').readFileSync('_layouts/default.html','utf8');console.log(s.includes('twitter:card')?'TW_OK':'TW_BAD')"
  EXPECT: TW_OK
  EVIDENCE: TW_OK

- [x] G13: silk.js guards WebGL-unavailable init
  CHECK: node -e "console.log(/try\s*\{[\s\S]{0,120}new Renderer/.test(require('fs').readFileSync('assets/silk.js','utf8'))?'SILK_OK':'SILK_BAD')"
  EXPECT: SILK_OK
  EVIDENCE: SILK_OK

- [x] G14: AGENTS.md wake-tick description matches code ([0,4]/[0,6], not E→F#)
  CHECK: node -e "const s=require('fs').readFileSync('AGENTS.md','utf8');console.log(s.includes('tritone')&&s.includes('660')?'DOC_OK':'DOC_BAD')"
  EXPECT: DOC_OK
  EVIDENCE: DOC_OK

- [x] G15: hex literals #301512/#4c2f19 appear only as :root token definitions (exactly 2 occurrences)
  CHECK: node -e "const n=require('fs').readFileSync('assets/style.css','utf8').match(/#301512|#4c2f19/g).length;console.log(n===2?'TOKENS_OK':'TOKENS_BAD:'+n)"
  EXPECT: TOKENS_OK
  EVIDENCE: TOKENS_OK

- [x] G16: edited locale.yml still parses as YAML
  CHECK: npx --yes js-yaml _data/locale.yml >nul 2>&1 && echo YAML_OK
  EXPECT: YAML_OK
  EVIDENCE: YAML_OK

- [x] G17: AGENTS.md documents the mute toggle and its storage key
  CHECK: node -e "const s=require('fs').readFileSync('AGENTS.md','utf8');console.log(s.includes('sl-audio')?'MUTE_DOC_OK':'MUTE_DOC_BAD')"
  EXPECT: MUTE_DOC_OK
  EVIDENCE: MUTE_DOC_OK
