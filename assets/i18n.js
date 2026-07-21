// ponytail: no i18n plugin (GH Pages safe mode forbids polyglot).
// Server renders RU; JS swaps strings + bio by language.
// Ceiling: SEO sees RU only. Acceptable for a personal card.
// Upgrade: switch to jekyll-polyglot (needs GH Actions, not safe-mode Pages).
(function () {
  var DEFAULT_LANG = "ru";
  var STORAGE_KEY = "sociallinker.lang";

  function detectLang() {
    try { if (localStorage.getItem(STORAGE_KEY)) return localStorage.getItem(STORAGE_KEY); } catch (e) {}
    return (navigator.language || "").toLowerCase().indexOf("en") === 0 ? "en" : DEFAULT_LANG;
  }

  var activeLang = DEFAULT_LANG;

  function applyLang(lang) {
    if (lang !== "en") lang = DEFAULT_LANG;
    activeLang = lang;
    document.documentElement.lang = lang;

    var strings = (window.__LOCALE__ || {})[lang] || {};
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
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
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
