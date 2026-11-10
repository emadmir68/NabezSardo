/* ============================================================
   NABEZ SARDO — ATELIER motion layer (vanilla, no dependencies)
   Soft scroll reveal, header condense, gentle counters.
   Only runs on public pages that carry body.at.
   ============================================================ */
(function () {
  'use strict';
  var body = document.body;
  if (!body || !body.classList.contains('public-shell')) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- reveal ---------- */
  var SELECTOR = [
    '.pr-card', '.pr-glass', '.pr-feature', '.pr-cat', '.pr-cta',
    '.card', '.page', '.article-body', '.article-hero', '.pr-sec__head'
  ].join(',');

  var targets = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
  targets.forEach(function (el, i) {
    el.classList.add('at-reveal');
    el.style.transitionDelay = (Math.min(i, 8) * 45) + 'ms';
  });

  if (!('IntersectionObserver' in window) || reduce) {
    targets.forEach(function (el) { el.classList.add('at-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('at-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- header condense ---------- */
  var head = document.querySelector('.site-capsule') || document.querySelector('.pr-head');
  if (head) {
    var last = null;
    var onScroll = function () {
      var stuck = (window.scrollY || 0) > 16;
      if (stuck === last) return;
      last = stuck;
      head.classList.toggle('is-stuck', stuck);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- gentle counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduce) {
    var run = function (el) {
      var target = Number(el.getAttribute('data-count')) || 0;
      if (el.textContent.trim() === target.toLocaleString('fa-IR')) return;
      var start = performance.now(), dur = 1300;
      var step = function (now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('fa-IR');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(counters, run);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          run(e.target);
          cio.unobserve(e.target);
        });
      }, { threshold: 0.35 });
      Array.prototype.forEach.call(counters, function (el) { cio.observe(el); });
    }
  }
})();
