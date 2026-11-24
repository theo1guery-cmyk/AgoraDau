/* AGORA DAU — interactions communes (accueil + articles) */
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- En-tête : fond au scroll, se cache en descendant ---------- */
  var head = document.getElementById('siteHead');
  var lastY = window.scrollY;
  function onHead() {
    var y = window.scrollY;
    if (!head) return;
    head.classList.toggle('is-solid', y > 20);
    if (!doc.classList.contains('menu-open')) {
      head.classList.toggle('is-hidden', y > 300 && y > lastY + 2);
      if (y < lastY - 2) head.classList.remove('is-hidden');
    }
    lastY = y;
  }

  /* ---------- Menu mobile ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  function setMenu(open) {
    doc.classList.toggle('menu-open', open);
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && head) head.classList.remove('is-hidden');
  }
  if (burger) burger.addEventListener('click', function () { setMenu(!doc.classList.contains('menu-open')); });
  if (menu) menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Apparitions au scroll ---------- */
  var targets = document.querySelectorAll('[data-reveal],[data-clip],.lines');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Parallaxe douce ---------- */
  var para = reduce ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));

  /* ---------- Galerie horizontale pilotée par le scroll ---------- */
  var hs = document.querySelector('[data-hscroll]');
  var hsTrack = hs ? hs.querySelector('.hs-track') : null;
  var hsBar = hs ? hs.querySelector('.hs-bar i') : null;
  function hsActive() { return hs && !reduce && window.innerWidth > 900; }
  function sizeHs() {
    if (!hs) return;
    if (hsActive()) {
      var extra = hsTrack.scrollWidth - window.innerWidth;
      hs.style.height = (window.innerHeight + Math.max(0, extra)) + 'px';
      hs.classList.add('is-pinned');
    } else {
      hs.style.height = '';
      hs.classList.remove('is-pinned');
      hsTrack.style.transform = '';
    }
  }

  var ticking = false;
  function frame() {
    ticking = false;
    onHead();
    var vh = window.innerHeight;
    para.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var k = parseFloat(el.getAttribute('data-parallax')) || 0.12;
      var c = (r.top + r.height / 2 - vh / 2);
      el.style.transform = 'translate3d(0,' + (c * -k).toFixed(1) + 'px,0) scale(1.08)';
    });
    if (hsActive()) {
      var r = hs.getBoundingClientRect();
      var total = hs.offsetHeight - vh;
      var p = Math.min(1, Math.max(0, -r.top / (total || 1)));
      var extra = hsTrack.scrollWidth - window.innerWidth;
      hsTrack.style.transform = 'translate3d(' + (-p * extra).toFixed(1) + 'px,0,0)';
      if (hsBar) hsBar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', function () { sizeHs(); req(); });
  window.addEventListener('load', function () { sizeHs(); req(); });
  sizeHs(); frame();

  /* ---------- Onglets de l'équipe ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (box) {
    var tabs = box.querySelectorAll('[role="tab"]');
    var panes = box.querySelectorAll('[data-pane]');
    var pics = box.querySelectorAll('[data-pic]');
    var ind = box.querySelector('.tab-ind');
    function place(t) {
      if (!ind || !t) return;
      ind.style.width = t.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + t.offsetLeft + 'px)';
    }
    function show(id) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === id;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) place(t);
      });
      panes.forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-pane') === id); });
      pics.forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-pic') === id); });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { show(t.getAttribute('data-tab')); });
    });
    window.addEventListener('resize', function () { place(box.querySelector('[aria-selected="true"]')); });
    window.addEventListener('load', function () { place(box.querySelector('[aria-selected="true"]')); });
    place(box.querySelector('[aria-selected="true"]'));
  });

  /* ---------- Lecteur audio (podcast) ---------- */
  document.querySelectorAll('[data-player]').forEach(function (pl) {
    var audio = pl.querySelector('audio');
    var btn = pl.querySelector('.pl-btn');
    var bar = pl.querySelector('.pl-bar');
    var fill = pl.querySelector('.pl-fill');
    var cur = pl.querySelector('.pl-cur');
    var dur = pl.querySelector('.pl-dur');
    function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    btn.addEventListener('click', function () { audio.paused ? audio.play() : audio.pause(); });
    audio.addEventListener('play', function () { pl.classList.add('playing'); btn.setAttribute('aria-label', 'Pause'); });
    audio.addEventListener('pause', function () { pl.classList.remove('playing'); btn.setAttribute('aria-label', 'Lecture'); });
    audio.addEventListener('loadedmetadata', function () { dur.textContent = fmt(audio.duration); });
    audio.addEventListener('timeupdate', function () {
      cur.textContent = fmt(audio.currentTime);
      if (audio.duration) fill.style.transform = 'scaleX(' + (audio.currentTime / audio.duration) + ')';
    });
    function seek(e) {
      var r = bar.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var p = Math.min(1, Math.max(0, x / r.width));
      if (audio.duration) audio.currentTime = p * audio.duration;
      else { audio.preload = 'metadata'; audio.addEventListener('loadedmetadata', function once() { audio.currentTime = p * audio.duration; audio.removeEventListener('loadedmetadata', once); }); audio.load(); }
    }
    bar.addEventListener('click', seek);
    pl.querySelectorAll('[data-skip]').forEach(function (b) {
      b.addEventListener('click', function () { audio.currentTime = Math.max(0, audio.currentTime + parseFloat(b.getAttribute('data-skip'))); });
    });
  });

  /* ---------- Barre de lecture (articles) ---------- */
  var prog = document.getElementById('readProg');
  if (prog) {
    window.addEventListener('scroll', function () {
      var max = doc.scrollHeight - doc.clientHeight;
      prog.style.transform = 'scaleX(' + (max > 0 ? doc.scrollTop / max : 0) + ')';
    }, { passive: true });
  }
})();
