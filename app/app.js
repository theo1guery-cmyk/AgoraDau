/* =========================================================
   AGORA — l'application d'Agora Dau
   ========================================================= */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- data ---------- */
  let DATA = { analyses: [], podcasts: [] };
  try {
    DATA = JSON.parse($('#agora-data').textContent);
  } catch (e) {
    console.error('data', e);
  }
  const ANALYSES = DATA.analyses || [];
  const PODCASTS = DATA.podcasts || [];
  const bySlug = {};
  ANALYSES.forEach(a => { bySlug[a.slug] = a; });
  const podBySlug = {};
  PODCASTS.forEach(p => { podBySlug[p.slug] = p; });

  /* ---------- storage (safe) ---------- */
  const store = {
    get(k, d) {
      try { const v = localStorage.getItem('agora.' + k); return v === null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem('agora.' + k, JSON.stringify(v)); } catch (e) {}
    }
  };

  /* ---------- icons ---------- */
  const ICO = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    wave: '<path d="M12 3v18"/><path d="M8 7v10"/><path d="M16 7v10"/><path d="M4 10v4"/><path d="M20 10v4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    play: '<path d="M6 4l14 8-14 8z"/>',
    pause: '<path d="M7 4h4v16H7zM13 4h4v16h-4z"/>',
    chevR: '<path d="M9 5l7 7-7 7"/>',
    chevL: '<path d="M15 5l-7 7 7 7"/>',
    chevD: '<path d="M6 9l6 6 6-6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/>',
    type: '<path d="M4 7V5h16v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    down: '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/>',
    insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
    back15: '<path d="M11 4 7 8l4 4"/><path d="M7 8h6a7 7 0 1 1-7 7"/>',
    fwd30: '<path d="m13 4 4 4-4 4"/><path d="M17 8h-6a7 7 0 1 0 7 7"/>',
    inbox: '<path d="M3 12h5l2 3h4l2-3h5"/><path d="M4 5h16l1 7v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"/>'
  };
  const svg = (p, cls) => '<svg viewBox="0 0 24 24" class="' + (cls || '') + '">' + p + '</svg>';

  /* ---------- helpers ---------- */
  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function time(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }
  let toastT;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 2400);
  }
  function haptic(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {}
  }

  /* ---------- theme ---------- */
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  function applyTheme() {
    const pref = store.get('theme', 'system');
    const dark = pref === 'dark' || (pref === 'system' && mq.matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const meta = $('#tc');
    if (meta) meta.setAttribute('content', dark ? '#0A0A0A' : '#F0EDE6');
    const b = $('#themeBtn');
    if (b) b.innerHTML = svg(dark ? ICO.sun : ICO.moon);
  }
  mq.addEventListener('change', applyTheme);

  /* ---------- reading progress store ---------- */
  function saveProgress(slug, pct) {
    const p = store.get('progress', {});
    p[slug] = { pct: pct, at: Date.now() };
    store.set('progress', p);
  }
  function lastRead() {
    const p = store.get('progress', {});
    let best = null;
    Object.keys(p).forEach(s => {
      if (!bySlug[s]) return;
      if (p[s].pct >= 92) return;
      if (p[s].pct < 3) return;
      if (!best || p[s].at > p[best].at) best = s;
    });
    return best ? { slug: best, pct: p[best].pct } : null;
  }

  /* =========================================================
     AUDIO PLAYER
     ========================================================= */
  const audio = new Audio();
  audio.preload = 'metadata';
  let current = null;

  const mini = $('#mini'), player = $('#player');

  function loadEpisode(slug, autoplay) {
    const ep = podBySlug[slug];
    if (!ep) return;
    if (!ep.audio) { toast('Épisode bientôt disponible'); return; }
    const isSame = current && current.slug === slug;
    if (!isSame) {
      current = ep;
      audio.src = ep.audio;
      const pos = store.get('pos.' + slug, 0);
      if (pos > 5) audio.currentTime = pos;
      renderPlayer();
      mini.classList.add('up');
      setMediaSession(ep);
    }
    if (autoplay !== false) audio.play().catch(() => {});
  }

  function setMediaSession(ep) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: ep.title,
        artist: ep.guests || 'Agora Dau',
        album: 'Agora Dau',
        artwork: [{ src: new URL(ep.cover, location.origin).href, sizes: '512x512', type: 'image/jpeg' }]
      });
      navigator.mediaSession.setActionHandler('play', () => audio.play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('seekbackward', () => { audio.currentTime -= 15; });
      navigator.mediaSession.setActionHandler('seekforward', () => { audio.currentTime += 30; });
    } catch (e) {}
  }

  function renderPlayer() {
    if (!current) return;
    $('#plArt').src = current.cover;
    $('#plEp').textContent = 'EP. ' + String(current.episode).padStart(2, '0');
    $('#plT').textContent = current.title;
    $('#plG').textContent = current.guests || fmtDate(current.date);
    $('#miniImg').src = current.cover;
    $('#miniT').textContent = current.title;
    $('#miniS').textContent = 'EP. ' + String(current.episode).padStart(2, '0');

    const links = [];
    if (current.spotify) links.push('<a class="pl-link" href="' + esc(current.spotify) + '" target="_blank" rel="noopener">Spotify ↗</a>');
    if (current.apple) links.push('<a class="pl-link" href="' + esc(current.apple) + '" target="_blank" rel="noopener">Apple ↗</a>');
    if (current.youtube) links.push('<a class="pl-link" href="' + esc(current.youtube) + '" target="_blank" rel="noopener">YouTube ↗</a>');
    $('#plLinks').innerHTML = links.join('');
  }

  function syncPlayIcons() {
    const playing = !audio.paused && !audio.ended;
    $('#miniPlay').innerHTML = svg(playing ? ICO.pause : ICO.play);
    $('#plPlay').innerHTML = svg(playing ? ICO.pause : ICO.play);
    $$('.pod-row').forEach(r => {
      const on = current && r.dataset.slug === current.slug && playing;
      r.classList.toggle('playing', on);
      const b = $('.pod-play', r);
      if (b) b.innerHTML = svg(on ? ICO.pause : ICO.play);
    });
  }

  audio.addEventListener('play', syncPlayIcons);
  audio.addEventListener('pause', syncPlayIcons);
  audio.addEventListener('ended', () => {
    syncPlayIcons();
    if (current) store.set('pos.' + current.slug, 0);
  });
  audio.addEventListener('timeupdate', () => {
    const d = audio.duration || 0, c = audio.currentTime || 0;
    const pct = d ? (c / d) * 100 : 0;
    $('#plFill').style.width = pct + '%';
    $('#plKnob').style.left = pct + '%';
    $('#miniBar').style.width = pct + '%';
    $('#plCur').textContent = time(c);
    $('#plDur').textContent = d ? time(d) : '--:--';
    if (current && Math.floor(c) % 5 === 0) store.set('pos.' + current.slug, c);
  });
  audio.addEventListener('error', () => {
    if (audio.src) toast("Lecture impossible — vérifie ta connexion");
  });

  function togglePlay() {
    if (!current) return;
    if (audio.paused) audio.play().catch(() => {}); else audio.pause();
    haptic();
  }

  $('#miniPlay').addEventListener('click', e => { e.stopPropagation(); togglePlay(); });
  $('#plPlay').addEventListener('click', togglePlay);
  $('#miniClose').addEventListener('click', e => {
    e.stopPropagation();
    audio.pause();
    mini.classList.remove('up');
    current = null;
  });
  $('#mini').addEventListener('click', () => { player.classList.add('up'); haptic(); });
  $('#plClose').addEventListener('click', () => player.classList.remove('up'));
  $('#plBack').addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 15); haptic(); });
  $('#plFwd').addEventListener('click', () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 30); haptic(); });

  // seek
  const track = $('#plTrack');
  function seekAt(clientX) {
    const r = track.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    if (audio.duration) audio.currentTime = pct * audio.duration;
  }
  let seeking = false;
  track.addEventListener('pointerdown', e => { seeking = true; track.setPointerCapture(e.pointerId); seekAt(e.clientX); });
  track.addEventListener('pointermove', e => { if (seeking) seekAt(e.clientX); });
  track.addEventListener('pointerup', () => { seeking = false; });

  // rate
  const RATES = [1, 1.25, 1.5, 2];
  let rateIdx = 0;
  $('#plRate').addEventListener('click', () => {
    rateIdx = (rateIdx + 1) % RATES.length;
    audio.playbackRate = RATES[rateIdx];
    $('#plRate').textContent = '× ' + RATES[rateIdx];
    $('#plRate').classList.toggle('on', rateIdx !== 0);
    haptic();
  });

  /* =========================================================
     RENDER
     ========================================================= */
  function analysisRow(a) {
    return '<a class="row" href="#/a/' + esc(a.slug) + '">' +
      '<div class="row-b">' +
        '<p class="row-k">' + esc(a.kicker || 'Analyse') + '</p>' +
        '<p class="row-t">' + esc(a.title) + '</p>' +
        '<p class="row-m">' + esc(a.author || '') + ' <span></span> ' + esc(a.reading_time || fmtDate(a.date)) + '</p>' +
      '</div>' +
      '<span class="row-go">' + svg(ICO.chevR) + '</span></a>';
  }

  function renderHome() {
    const v = $('#v-home');
    const a = ANALYSES[0];
    let h = '';

    const lr = lastRead();
    if (lr) {
      const art = bySlug[lr.slug];
      h += '<a class="resume" href="#/a/' + esc(lr.slug) + '">' +
        '<span class="resume-ic">' + svg(ICO.doc) + '</span>' +
        '<span class="resume-tx"><p>Reprendre la lecture</p><p>' + esc(art.title) + '</p></span>' +
        '<span class="resume-pct">' + Math.round(lr.pct) + '%</span></a>';
    }

    if (a) {
      h += '<a class="feat" href="#/a/' + esc(a.slug) + '">' +
        '<div class="feat-body">' +
          '<p class="feat-kick"><i class="feat-dot"></i>' + esc(a.kicker || 'Analyse') + '</p>' +
          '<h3 class="feat-t">' + esc(a.title) + '</h3>' +
          '<p class="feat-d">' + esc(a.dek || '') + '</p>' +
          '<p class="feat-meta"><b>' + esc(a.author || '') + '</b><span></span>' +
            esc(a.reading_time || '') + '</p>' +
        '</div></a>';
    }

    const rest = ANALYSES.slice(1, 4);
    if (rest.length) {
      h += '<div class="sectop"><h2>Autres <em>analyses</em></h2>' +
        '<a class="mono" href="#/analyses" style="color:var(--red)">Tout voir →</a></div>';
      h += '<div class="rows">' + rest.map(analysisRow).join('') + '</div>';
    }

    if (PODCASTS.length) {
      const p = PODCASTS[0];
      h += '<div class="sectop"><h2>À <em>écouter</em></h2>' +
        '<a class="mono" href="#/ecouter" style="color:var(--red)">Tout voir →</a></div>';
      h += '<div class="rows">' + podRow(p) + '</div>';
    }

    h += '<div class="sectop"><h2>Le <em>projet</em></h2></div>' +
      '<p class="pad" style="font-size:.92rem;line-height:1.7;color:var(--dim)">Agora Dau est un média étudiant indépendant. On rend la parole aux étudiants, sans filtre ni langue de bois — podcasts, micros-trottoirs, débats et analyses.</p>' +
      '<a class="lnk" href="#/asso" style="margin-top:1.2rem;border-top:1px solid var(--hair)">' +
        '<span class="lnk-ic">' + svg(ICO.users) + '</span>' +
        '<span class="lnk-b"><span class="lnk-t">Découvrir l\'association</span>' +
        '<span class="lnk-d">Formats, bureau, nous rejoindre</span></span>' +
        '<span class="lnk-go">' + svg(ICO.chevR) + '</span></a>' +
      '<a class="lnk" href="#/proposer">' +
        '<span class="lnk-ic" style="border-color:var(--red);color:var(--red)">' + svg(ICO.pen) + '</span>' +
        '<span class="lnk-b"><span class="lnk-t">Proposer un contenu</span>' +
        '<span class="lnk-d">Un article ou un podcast — sans compte</span></span>' +
        '<span class="lnk-go">' + svg(ICO.chevR) + '</span></a>';

    v.innerHTML = h;
  }

  let filterTag = null, query = '';
  function renderAnalyses() {
    const v = $('#v-analyses');
    const tags = {};
    ANALYSES.forEach(a => (a.tags || []).forEach(t => { tags[t] = 1; }));
    const tagList = Object.keys(tags);

    let h = '<div class="sectop"><h2>Les <em>analyses</em></h2><span class="mono">' +
      ANALYSES.length + ' texte' + (ANALYSES.length > 1 ? 's' : '') + '</span></div>';

    h += '<div class="search' + (query ? ' has' : '') + '" id="srch">' + svg(ICO.search) +
      '<input type="search" placeholder="Rechercher une analyse…" value="' + esc(query) + '" ' +
      'aria-label="Rechercher"/><button aria-label="Effacer">' + svg(ICO.close) + '</button></div>';

    if (tagList.length) {
      h += '<div class="chips"><button class="chip' + (filterTag ? '' : ' on') + '" data-tag="">Tout</button>' +
        tagList.map(t => '<button class="chip' + (filterTag === t ? ' on' : '') + '" data-tag="' + esc(t) + '">' + esc(t) + '</button>').join('') +
        '</div>';
    }

    const q = query.trim().toLowerCase();
    const list = ANALYSES.filter(a => {
      if (filterTag && !(a.tags || []).includes(filterTag)) return false;
      if (!q) return true;
      return (a.title + ' ' + (a.dek || '') + ' ' + (a.author || '') + ' ' + (a.kicker || ''))
        .toLowerCase().includes(q);
    });

    h += list.length
      ? '<div class="rows" style="margin-top:1rem">' + list.map(analysisRow).join('') + '</div>'
      : '<div class="empty"><div class="empty-ic">' + svg(ICO.search) + '</div>' +
        '<h3>Rien trouvé</h3><p>Essaie un autre mot-clé.</p></div>';

    v.innerHTML = h;

    const si = $('#srch input');
    si.addEventListener('input', e => {
      query = e.target.value;
      const pos = e.target.selectionStart;
      renderAnalyses();
      const ni = $('#srch input');
      ni.focus();
      try { ni.setSelectionRange(pos, pos); } catch (err) {}
    });
    $('#srch button').addEventListener('click', () => { query = ''; renderAnalyses(); });
    $$('.chip', v).forEach(c => c.addEventListener('click', () => {
      filterTag = c.dataset.tag || null;
      haptic();
      renderAnalyses();
    }));
  }

  function podRow(p) {
    const has = !!p.audio;
    return '<div class="pod-row" data-slug="' + esc(p.slug) + '">' +
      '<button class="pod-play" aria-label="Lire">' + svg(ICO.play) + '</button>' +
      '<div class="pod-b">' +
        '<p class="pod-ep">EP. ' + String(p.episode).padStart(2, '0') + (has ? '' : ' · bientôt') + '</p>' +
        '<p class="pod-t">' + esc(p.title) + '</p>' +
        '<p class="pod-m">' + esc(fmtDate(p.date)) + (p.duration ? ' · ' + esc(p.duration) : '') + '</p>' +
      '</div>' +
      '<span class="row-go">' + svg(ICO.chevR) + '</span></div>';
  }

  function renderPods() {
    const v = $('#v-ecouter');
    let h = '<div class="sectop"><h2>À <em>écouter</em></h2><span class="mono">' +
      (PODCASTS.length || '0') + ' épisode' + (PODCASTS.length > 1 ? 's' : '') + '</span></div>';

    if (!PODCASTS.length) {
      h += '<div class="empty"><div class="empty-ic">' + svg(ICO.wave) + '</div>' +
        '<h3>Les premiers épisodes arrivent</h3>' +
        '<p>Podcasts, micros-trottoirs et débats : on prépare tout ça. Inscris-toi à la newsletter pour être prévenu·e.</p>' +
        '<a class="btn-full" style="max-width:260px;margin:1.4rem auto 0" href="/newsletter/">M\'inscrire</a></div>';
    } else {
      h += '<div class="rows">' + PODCASTS.map(podRow).join('') + '</div>';
    }
    v.innerHTML = h;

    $$('.pod-row', v).forEach(r => {
      const slug = r.dataset.slug;
      $('.pod-play', r).addEventListener('click', e => {
        e.stopPropagation();
        if (current && current.slug === slug) togglePlay();
        else loadEpisode(slug, true);
      });
      r.addEventListener('click', () => { location.hash = '#/p/' + slug; });
    });
    syncPlayIcons();
  }

  function renderEpisode(slug) {
    const p = podBySlug[slug];
    const v = $('#v-doc');
    if (!p) { v.innerHTML = '<div class="empty"><h3>Épisode introuvable</h3></div>'; return; }

    let h = '<div class="rd-hero"><img src="' + esc(p.cover) + '" alt=""/></div>' +
      '<div class="rd-head">' +
        '<p class="rd-kick">EP. ' + String(p.episode).padStart(2, '0') + '</p>' +
        '<h1 class="rd-t">' + esc(p.title) + '</h1>' +
        '<p class="rd-dek">' + esc(p.dek || '') + '</p>' +
        '<div class="rd-sign">' + (p.guests ? '<b>' + esc(p.guests) + '</b><span></span>' : '') +
          esc(fmtDate(p.date)) + (p.duration ? '<span></span>' + esc(p.duration) : '') + '</div>' +
      '</div>';

    h += '<div class="rd-tools" style="border-top:none;padding-top:1.2rem">' +
      '<button class="tool" id="epPlay">' + svg(p.audio ? ICO.play : ICO.wave) +
        (p.audio ? 'Écouter' : 'Bientôt') + '</button>' +
      '<button class="tool" id="epShare">' + svg(ICO.share) + 'Partager</button>' +
      '</div>';

    if (p.body) h += '<div class="rd-body" style="margin-top:1.6rem">' + p.body + '</div>';

    const links = [];
    if (p.spotify) links.push(['Spotify', p.spotify]);
    if (p.apple) links.push(['Apple Podcasts', p.apple]);
    if (p.youtube) links.push(['YouTube', p.youtube]);
    if (links.length) {
      h += '<div class="sectop"><h2>Aussi <em>disponible</em></h2></div>';
      h += links.map(l => '<a class="lnk" href="' + esc(l[1]) + '" target="_blank" rel="noopener">' +
        '<span class="lnk-ic">' + svg(ICO.globe) + '</span>' +
        '<span class="lnk-b"><span class="lnk-t">' + esc(l[0]) + '</span></span>' +
        '<span class="lnk-go">' + svg(ICO.chevR) + '</span></a>').join('');
    }

    v.innerHTML = h;
    $('#epPlay').addEventListener('click', () => loadEpisode(slug, true));
    $('#epShare').addEventListener('click', () => share(p.title, location.href));
  }

  function renderReader(slug) {
    const a = bySlug[slug];
    const v = $('#v-doc');
    if (!a) { v.innerHTML = '<div class="empty"><h3>Analyse introuvable</h3></div>'; return; }

    let h = '<div class="rd-prog" id="rdProg"></div>';
    h += '<div class="rd-head">' +
      '<p class="rd-kick">' + esc(a.kicker || 'Analyse') + '</p>' +
      '<h1 class="rd-t">' + esc(a.title_display || a.title) + '</h1>' +
      '<p class="rd-dek">' + esc(a.dek || '') + '</p>' +
      '<div class="rd-sign"><b>' + esc(a.author || '') + '</b><span></span>' +
        esc(a.date_display || fmtDate(a.date)) +
        (a.reading_time ? '<span></span>' + esc(a.reading_time) : '') + '</div></div>';

    h += '<div class="rd-body" id="rdBody">' + (a.body || '') + '</div>';

    if (a.closing || a.closing_red) {
      h += '<p class="rd-end">' + esc(a.closing || '') +
        (a.closing_red ? '<span class="red">' + esc(a.closing_red) + '</span>' : '') + '</p>';
    }
    if (a.sources) {
      h += '<details class="rd-src"><summary>Sources &amp; références <i>▾</i></summary>' + a.sources + '</details>';
    }

    h += '<div class="rd-tools">' +
      '<button class="tool" id="rdType">' + svg(ICO.type) + 'Taille</button>' +
      '<button class="tool" id="rdShare">' + svg(ICO.share) + 'Partager</button>' +
      '<a class="tool" href="' + esc(a.url) + '" target="_blank" rel="noopener">' + svg(ICO.globe) + 'Sur le site</a>' +
      '</div>';

    v.innerHTML = h;

    // font size
    const SIZES = ['0.94rem', '1.02rem', '1.12rem', '1.24rem'];
    let si = store.get('rsize', 1);
    const body = $('#rdBody');
    body.style.setProperty('--rsize', SIZES[si]);
    $('#rdType').addEventListener('click', () => {
      si = (si + 1) % SIZES.length;
      store.set('rsize', si);
      body.style.setProperty('--rsize', SIZES[si]);
      toast('Taille ' + (si + 1) + '/' + SIZES.length);
      haptic();
    });
    $('#rdShare').addEventListener('click', () => share(a.title, location.origin + a.url));

    // restore scroll
    const saved = store.get('progress', {})[slug];
    if (saved && saved.pct > 3 && saved.pct < 92) {
      requestAnimationFrame(() => {
        const max = document.body.scrollHeight - window.innerHeight;
        window.scrollTo(0, max * (saved.pct / 100));
      });
    }
  }

  function share(title, url) {
    if (navigator.share) {
      navigator.share({ title: title, text: title + ' — Agora Dau', url: url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => toast('Lien copié')).catch(() => {});
    }
  }

  function renderAsso() {
    const v = $('#v-asso');
    const FMT = [
      ['🎙️', 'Podcasts', "Conversations et débats de fond, en format long."],
      ['🎤', 'Micros-trottoirs', "On tend le micro sur le campus, réponses brutes."],
      ['🔥', 'Débats', "Plusieurs voix, zéro consensus tiède."],
      ['📰', 'Analyses', "Des sujets de société décortiqués, regard critique."]
    ];
    let h = '<div class="about-hero"><p class="mono">L\'association</p>' +
      '<h1>Le média qui vous <em>donne la parole</em></h1>' +
      '<p>Agora Dau est un média étudiant indépendant. Analyse critique et interdisciplinaire du pouvoir — financier, juridique, économique, politique.</p></div>';

    h += '<div class="sectop"><h2>Nos <em>formats</em></h2></div>';
    h += '<div class="fmt">' + FMT.map(f =>
      '<div class="fmt-c"><div class="fmt-e">' + f[0] + '</div>' +
      '<p class="fmt-n">' + f[1] + '</p><p class="fmt-d">' + f[2] + '</p></div>').join('') + '</div>';

    h += '<div class="charte"><p class="mono">● Charte anti-IA</p>' +
      '<p>Tous nos contenus sont écrits par des humains. Aucune IA n\'intervient dans la recherche, la réflexion, la rédaction ou le graphisme.</p>' +
      '<a href="/charte/" target="_blank" rel="noopener">Lire la charte ↗</a></div>';

    h += '<div class="sectop"><h2>Tu veux <em>publier</em> ?</h2></div>';
    h += '<a class="resume" href="#/proposer" style="background:var(--red);color:#fff">' +
      '<span class="resume-ic" style="background:#fff;color:var(--red)">' + svg(ICO.pen) + '</span>' +
      '<span class="resume-tx"><p style="opacity:.75">Article ou podcast</p>' +
      '<p>Proposer un contenu</p></span>' +
      '<span class="resume-pct">→</span></a>';
    h += '<p class="fnote" style="margin-bottom:.4rem">Aucun compte requis : tu remplis, le bureau relit et publie.</p>';

    h += '<div class="sectop"><h2>Nous <em>suivre</em></h2></div>';
    const LINKS = [
      [ICO.insta, 'Instagram', '@agora_dau', 'https://www.instagram.com/agora_dau/'],
      [ICO.mail, 'Newsletter', 'Être prévenu·e à chaque publication', '/newsletter/'],
      [ICO.globe, 'agoradau.fr', 'Le site complet', '/']
    ];
    h += LINKS.map(l => '<a class="lnk" href="' + l[3] + '"' +
      (l[3].startsWith('http') ? ' target="_blank" rel="noopener"' : '') + '>' +
      '<span class="lnk-ic">' + svg(l[0]) + '</span>' +
      '<span class="lnk-b"><span class="lnk-t">' + l[1] + '</span><span class="lnk-d">' + l[2] + '</span></span>' +
      '<span class="lnk-go">' + svg(ICO.chevR) + '</span></a>').join('');

    h += '<div class="sectop"><h2>L\'<em>app</em></h2></div>';
    h += '<button class="lnk" id="instBtn" style="width:100%;text-align:left">' +
      '<span class="lnk-ic">' + svg(ICO.down) + '</span>' +
      '<span class="lnk-b"><span class="lnk-t">Installer Agora</span>' +
      '<span class="lnk-d">Accès direct depuis ton écran d\'accueil</span></span>' +
      '<span class="lnk-go">' + svg(ICO.chevR) + '</span></button>';

    h += '<div class="credit"><p>Agora Dau · RNA W913016495<br/>© 2026 — Le média qui vous donne la parole</p></div>';

    v.innerHTML = h;
    $('#instBtn').addEventListener('click', openInstall);
  }

  /* =========================================================
     PROPOSER UN CONTENU
     ========================================================= */
  const FORM_ACTION = 'https://formsubmit.co/agora.dau@gmail.com';
  const NEXT_URL = 'https://agoradau.fr/app/?envoye=1';
  let proposeKind = 'article';

  function fld(label, name, opts) {
    opts = opts || {};
    const req = opts.required ? ' <b>*</b>' : '';
    const hint = opts.hint ? '<span class="hint">' + opts.hint + '</span>' : '';
    const id = 'f_' + name.replace(/[^a-z0-9]/gi, '');
    let input;
    if (opts.type === 'textarea') {
      input = '<textarea id="' + id + '" name="' + esc(name) + '"' +
        (opts.big ? ' class="big"' : '') +
        (opts.required ? ' required' : '') +
        ' placeholder="' + esc(opts.ph || '') + '"></textarea>';
    } else if (opts.type === 'file') {
      input = '<input id="' + id + '" type="file" name="' + esc(name) + '" accept="' +
        (opts.accept || 'image/*') + '"/>';
    } else {
      input = '<input id="' + id + '" type="' + (opts.type || 'text') + '" name="' + esc(name) + '"' +
        (opts.required ? ' required' : '') +
        ' placeholder="' + esc(opts.ph || '') + '"/>';
    }
    return '<div class="fld"><label for="' + id + '">' + esc(label) + req + hint + '</label>' + input + '</div>';
  }

  function renderPropose() {
    const v = $('#v-propose');
    const isPod = proposeKind === 'podcast';

    let h = '<div class="sectop"><h2>Proposer un <em>contenu</em></h2></div>';
    h += '<p class="fnote">Pas besoin de compte, ni de GitHub, ni de quoi que ce soit. ' +
      'Tu remplis, tu envoies — le bureau relit et met en ligne.</p>';

    h += '<div class="seg">' +
      '<button data-k="article" class="' + (isPod ? '' : 'on') + '">' + svg(ICO.doc) + 'Un article</button>' +
      '<button data-k="podcast" class="' + (isPod ? 'on' : '') + '">' + svg(ICO.wave) + 'Un podcast</button>' +
      '</div>';

    h += '<form class="form" id="propForm" method="POST" action="' + FORM_ACTION + '" ' +
      'enctype="multipart/form-data" accept-charset="UTF-8">' +
      '<input type="hidden" name="_next" value="' + NEXT_URL + '"/>' +
      '<input type="hidden" name="_subject" value="' +
        (isPod ? 'Proposition de PODCAST — Agora Dau' : "Proposition d'ARTICLE — Agora Dau") + '"/>' +
      '<input type="hidden" name="_template" value="table"/>' +
      '<input type="hidden" name="Type de contenu" value="' + (isPod ? 'Podcast' : 'Article') + '"/>';

    h += fld('Ton prénom et nom', 'Auteur', { required: true, ph: 'Ex : Lissa Perrin' });
    h += fld('Ton email', '_replyto', { type: 'email', required: true, ph: 'pour te répondre' });

    if (!isPod) {
      h += fld('Titre de l\'article', 'Titre', { required: true, ph: 'Ex : Colonialisme vert' });
      h += fld('Accroche', 'Accroche', {
        type: 'textarea', required: true,
        ph: 'La phrase qui donne envie de lire.',
        hint: "Une ou deux phrases, affichées sous le titre."
      });
      h += fld('Rubriques', 'Rubriques', { ph: 'Ex : Écologie · Colonialisme · Pouvoir' });
      h += fld('Ton texte', 'Texte', {
        type: 'textarea', big: true, required: true,
        ph: 'Écris ou colle ton article ici…',
        hint: "Colle-le depuis Word, Google Docs, Notion… peu importe. Mets tes titres de partie sur une ligne seule."
      });
      h += fld('Tes sources', 'Sources', {
        type: 'textarea',
        ph: 'Un lien ou une référence par ligne.',
        hint: "Obligatoire pour une analyse : on ne publie rien sans sources."
      });
      h += fld('Image de couverture', 'Image', {
        type: 'file',
        hint: "Facultatif — idéalement carrée. Moins de 10 Mo. Si tu n'en as pas, on s'en occupe."
      });
    } else {
      h += fld('Titre de l\'épisode', 'Titre', { required: true });
      h += fld('Accroche', 'Accroche', {
        type: 'textarea', required: true,
        ph: "La phrase qui donne envie d'écouter."
      });
      h += fld('Lien vers le fichier audio', 'Lien audio', {
        type: 'url', required: true,
        ph: 'https://…',
        hint: "Dépose ton MP3 sur WeTransfer, Google Drive ou Dropbox et colle le lien ici. " +
              "(Les fichiers audio sont trop lourds pour être envoyés directement.)"
      });
      h += fld('Invité·e·s / voix', 'Invités', { ph: 'Qui parle dans l\'épisode ?' });
      h += fld('Durée', 'Duree', { ph: 'Ex : 42 min' });
      h += fld('Déjà en ligne ailleurs ?', 'Liens plateformes', {
        ph: 'Spotify, Apple Podcasts, YouTube…',
        hint: 'Facultatif — colle les liens si l\'épisode est déjà publié.'
      });
      h += fld('Image de l\'épisode', 'Image', {
        type: 'file',
        hint: 'Facultatif — carrée si possible. Moins de 10 Mo.'
      });
      h += fld('Notes d\'épisode', 'Notes', {
        type: 'textarea',
        ph: 'Résumé, chapitres, références citées…'
      });
    }

    h += fld('Un mot pour le bureau', 'Message', { type: 'textarea', ph: 'Facultatif' });

    h += '<label class="check"><input type="checkbox" name="Charte respectee" value="Oui" required/>' +
      '<span>Je certifie que ce contenu est <b>écrit par un humain</b>, sans intelligence artificielle — ' +
      'conformément à la charte d\'Agora Dau.</span></label>';

    h += '<button type="submit" class="submit" id="propSend">Envoyer au bureau →</button>';
    h += '</form>';

    h += '<p class="fnote" style="margin-top:1.2rem;margin-bottom:2rem">' +
      'Une vérification anti-robot s\'affiche après l\'envoi, puis tu reviens ici. ' +
      'Le bureau te répond par email.</p>';

    v.innerHTML = h;

    $$('.seg button', v).forEach(b => b.addEventListener('click', () => {
      proposeKind = b.dataset.k;
      haptic();
      history.replaceState(null, '', '#/proposer/' + proposeKind);
      renderPropose();
    }));

    $('#propForm').addEventListener('submit', () => {
      const btn = $('#propSend');
      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';
    });
  }

  function renderSent() {
    $('#v-propose').innerHTML =
      '<div class="sent"><div class="sent-ic"><svg viewBox="0 0 24 24"><path d="m4 12 6 6L20 6"/></svg></div>' +
      '<h2>C\'est envoyé</h2>' +
      '<p>Le bureau a reçu ta proposition et te répondra par email. Merci !</p>' +
      '<a class="btn-full" style="max-width:260px;margin:1.6rem auto 0" href="#/">Retour à l\'accueil</a>' +
      '<a class="btn-ghost" href="#/proposer">Proposer autre chose</a></div>';
  }

  /* =========================================================
     ROUTER
     ========================================================= */
  const VIEWS = ['home', 'analyses', 'ecouter', 'asso', 'doc', 'propose'];
  function show(id) {
    VIEWS.forEach(v => $('#v-' + v).classList.toggle('on', v === id));
  }

  function route() {
    const h = location.hash || '#/';
    const parts = h.replace(/^#\//, '').split('/');
    const root = parts[0] || '';
    const deep = root === 'a' || root === 'p';

    document.body.classList.toggle('deep', deep);
    player.classList.remove('up');

    if (root === 'a') { renderReader(parts[1]); show('doc'); }
    else if (root === 'p') { renderEpisode(parts[1]); show('doc'); }
    else if (root === 'analyses') { renderAnalyses(); show('analyses'); }
    else if (root === 'ecouter') { renderPods(); show('ecouter'); }
    else if (root === 'asso') { renderAsso(); show('asso'); }
    else if (root === 'proposer') {
      if (parts[1] === 'podcast' || parts[1] === 'article') proposeKind = parts[1];
      renderPropose(); show('propose');
    }
    else if (root === 'envoye') { renderSent(); show('propose'); }
    else { renderHome(); show('home'); }

    // tab state
    const tabFor = deep ? (root === 'a' ? 'analyses' : 'ecouter')
      : (root === 'proposer' || root === 'envoye') ? 'asso' : (root || 'home');
    $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.v === tabFor));

    if (!deep) window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);

  $('#backBtn').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.hash = '#/';
  });

  /* ---------- scroll progress ---------- */
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const bar = $('#rdProg');
      if (!bar) return;
      const max = document.body.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
      bar.style.width = pct + '%';
      const m = (location.hash || '').match(/^#\/a\/(.+)$/);
      if (m) saveProgress(m[1], pct);
    });
  }, { passive: true });

  /* =========================================================
     INSTALL
     ========================================================= */
  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    $('#instTop').style.display = 'grid';
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    $('#instTop').style.display = 'none';
    closeInstall();
    toast('Agora est installée ✓');
  });

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  function openInstall() {
    if (isStandalone) { toast('L\'app est déjà installée'); return; }
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.finally(() => { deferred = null; });
      return;
    }
    const s = $('#sheet');
    $('#sheetBody').innerHTML = isIOS
      ? '<h3>Installer Agora</h3><p>Sur iPhone, ajoute l\'app à ton écran d\'accueil en 2 étapes :</p>' +
        '<div class="step"><b>01</b><p>Touche le bouton <b>Partager</b> ' + svg(ICO.share) + ' en bas de Safari.</p></div>' +
        '<div class="step"><b>02</b><p>Choisis <b>« Sur l\'écran d\'accueil »</b>, puis <b>Ajouter</b>.</p></div>' +
        '<button class="btn-ghost" id="sheetNo">Fermer</button>'
      : '<h3>Installer Agora</h3><p>Ajoute Agora à ton écran d\'accueil pour un accès direct, même hors connexion.</p>' +
        '<div class="step"><b>01</b><p>Ouvre le menu de ton navigateur (⋮).</p></div>' +
        '<div class="step"><b>02</b><p>Choisis <b>« Installer l\'application »</b> ou <b>« Ajouter à l\'écran d\'accueil »</b>.</p></div>' +
        '<button class="btn-ghost" id="sheetNo">Fermer</button>';
    s.classList.add('on');
    $('#sheetNo').addEventListener('click', closeInstall);
  }
  function closeInstall() { $('#sheet').classList.remove('on'); }
  $('#sheetBg').addEventListener('click', closeInstall);
  $('#instTop').addEventListener('click', openInstall);

  /* =========================================================
     NETWORK
     ========================================================= */
  function netState() {
    const pill = $('#netpill');
    if (navigator.onLine) pill.classList.remove('show');
    else pill.classList.add('show');
  }
  window.addEventListener('online', () => { netState(); toast('De nouveau en ligne'); });
  window.addEventListener('offline', netState);

  /* =========================================================
     INIT
     ========================================================= */
  $('#themeBtn').addEventListener('click', () => {
    const cur = store.get('theme', 'system');
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    store.set('theme', dark ? 'light' : 'dark');
    applyTheme();
    haptic();
  });

  $$('.tab').forEach(t => t.addEventListener('click', () => haptic()));

  applyTheme();
  netState();

  // Retour depuis l'envoi du formulaire
  try {
    if (new URLSearchParams(location.search).get('envoye') === '1') {
      history.replaceState(null, '', '/app/#/envoye');
    }
  } catch (e) {}

  route();
  if (isStandalone) $('#instTop').style.display = 'none';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' }).catch(() => {});
    });
  }
})();
