// ponytail: no i18n plugin (GH Pages safe mode forbids polyglot).
// Server renders RU; JS swaps strings + bio by language.
// Ceiling: SEO sees RU only. Acceptable for a personal card.
// Upgrade: switch to jekyll-polyglot (needs GH Actions, not safe-mode Pages).
(function () {
  var DEFAULT_LANG = "ru";
  var STORAGE_KEY = "sociallinker.lang";
  var LANGS = ["ru", "en"];

  function getLocale() { return window.__LOCALE__ || {}; }

  function getStoredLang() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setStoredLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  function detectLang() {
    var stored = getStoredLang();
    if (stored) return stored;
    var nav = (navigator.language || "").toLowerCase();
    if (nav.indexOf("en") === 0) return "en";
    return DEFAULT_LANG;
  }

  var activeLang = DEFAULT_LANG;

  function applyLang(lang) {
    if (LANGS.indexOf(lang) === -1) lang = DEFAULT_LANG;
    activeLang = lang;
    document.documentElement.lang = lang;

    var strings = getLocale()[lang] || {};
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute("data-i18n");
      if (strings[key] != null) el.textContent = strings[key];
    }

    var bios = document.querySelectorAll("[data-i18n-bio]");
    for (var j = 0; j < bios.length; j++) {
      var html = bios[j].getAttribute("data-bio-" + lang);
      if (html != null) bios[j].innerHTML = html;
    }

    var toggle = document.querySelector("[data-lang-toggle] span");
    if (toggle) toggle.textContent = lang === "ru" ? "EN" : "RU";
  }

  function init() {
    applyLang(detectLang());
    var btn = document.querySelector("[data-lang-toggle]");
    if (btn) {
      btn.addEventListener("click", function () {
        var next = activeLang === "ru" ? "en" : "ru";
        setStoredLang(next);
        applyLang(next);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
