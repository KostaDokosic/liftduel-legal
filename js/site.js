/* LiftDuels site: reveal on scroll, tagline word reveal, pause the scoreboard off screen, eager images for print. No cookies, no tracking. */
(function () {
  'use strict';
  var d = document;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window)) { d.documentElement.classList.remove('js'); return; }

  var rv = d.querySelectorAll('.rv');
  if (rv.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    rv.forEach(function (el) { io.observe(el); });
  }

  var tag = d.querySelector('.tagline p');
  if (tag && !reduce) {
    var words = tag.textContent.trim().split(/\s+/);
    tag.textContent = '';
    words.forEach(function (w, i) {
      var s = d.createElement('span');
      s.className = 'w';
      s.textContent = w + (i < words.length - 1 ? ' ' : '');
      tag.appendChild(s);
    });
    var wio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-on'); wio.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -30% 0px', threshold: 0 });
    tag.querySelectorAll('.w').forEach(function (w) { wio.observe(w); });
  }

  var board = d.querySelector('.duel');
  if (board) {
    var bio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { board.classList.toggle('is-paused', !e.isIntersecting); });
    });
    bio.observe(board);
  }

  window.addEventListener('beforeprint', function () {
    d.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; });
    d.querySelectorAll('.rv').forEach(function (el) { el.classList.add('is-in'); });
  });
})();
