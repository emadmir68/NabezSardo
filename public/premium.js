/* ============================================================
   NABEZ SARDO — PREMIUM GLASS EDITION (2026)
   Motion layer: header condense, reveal, tilt, magnetic, counters,
   accent switching, ticker clone. Vanilla, no dependencies.
   ============================================================ */
(function () {
  'use strict';

  var body = document.body;
  if (!body || !body.classList.contains('pr-body')) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  /* ---------- accent theme ---------- */
  var ACCENTS = ['gold', 'emerald', 'sapphire', 'rose'];
  var stored = null;
  try { stored = localStorage.getItem('nabez-premium-accent'); } catch (e) {}
  var accent = ACCENTS.indexOf(stored) > -1 ? stored : 'gold';
  function applyAccent(name) {
    accent = ACCENTS.indexOf(name) > -1 ? name : 'gold';
    document.documentElement.setAttribute('data-accent', accent);
    body.setAttribute('data-accent', accent);
    Array.prototype.forEach.call(document.querySelectorAll('[data-accent-option]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-accent-option') === accent ? 'true' : 'false');
    });
    try { localStorage.setItem('nabez-premium-accent', accent); } catch (e) {}
  }
  applyAccent(accent);
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest && ev.target.closest('[data-accent-option]');
    if (!btn) return;
    applyAccent(btn.getAttribute('data-accent-option'));
  });

  /* ---------- header condense ---------- */
  var head = document.querySelector('.pr-head');
  if (head) {
    var last = -1;
    var onScroll = function () {
      var y = window.scrollY || window.pageYOffset || 0;
      var stuck = y > 18;
      if (stuck === last) return;
      last = stuck;
      head.classList.toggle('is-stuck', stuck);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- scroll reveal ---------- */
  var targets = document.querySelectorAll('.pr-rv');
  if (!('IntersectionObserver' in window) || reduce) {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  /* ---------- counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    var target = Number(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target.toLocaleString('fa-IR') + suffix; return; }
    var start = performance.now();
    var dur = 1400;
    function frame(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('fa-IR') + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(counters, runCounter);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          cio.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      Array.prototype.forEach.call(counters, function (el) { cio.observe(el); });
    }
  }

  /* ---------- feature tilt ---------- */
  if (fine && !reduce) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-tilt]'), function (el) {
      var raf = 0;
      el.addEventListener('pointermove', function (ev) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = el.getBoundingClientRect();
          var px = (ev.clientX - r.left) / r.width - 0.5;
          var py = (ev.clientY - r.top) / r.height - 0.5;
          el.style.transform = 'perspective(1100px) rotateY(' + (px * 6).toFixed(2) + 'deg) rotateX(' + (-py * 6).toFixed(2) + 'deg) translateY(-2px)';
        });
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    /* ---------- magnetic buttons ---------- */
    Array.prototype.forEach.call(document.querySelectorAll('[data-magnet]'), function (el) {
      el.addEventListener('pointermove', function (ev) {
        var r = el.getBoundingClientRect();
        var x = (ev.clientX - r.left - r.width / 2) * 0.14;
        var y = (ev.clientY - r.top - r.height / 2) * 0.22;
        el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    /* ---------- pointer spotlight on the hero ---------- */
    var hero = document.querySelector('.pr-hero');
    if (hero) {
      hero.addEventListener('pointermove', function (ev) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty('--px', ((ev.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        hero.style.setProperty('--py', ((ev.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }

    /* ---------- parallax orbs ---------- */
    var orbs = document.querySelectorAll('.pr-orb');
    if (orbs.length) {
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          var y = window.scrollY || 0;
          Array.prototype.forEach.call(orbs, function (orb, i) {
            orb.style.marginTop = (y * (0.02 + i * 0.012)).toFixed(1) + 'px';
          });
        });
      }, { passive: true });
    }
  }

  /* ---------- ticker: keep the marquee seamless ---------- */
  var track = document.querySelector('.pr-ticker__track');
  if (track && !track.getAttribute('data-cloned')) {
    track.setAttribute('data-cloned', '1');
    track.innerHTML = track.innerHTML + track.innerHTML;
  }
})();
