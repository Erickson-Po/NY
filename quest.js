/* Хроника десяти врат — движок квеста */
(function () {
  'use strict';

  var CFG = window.QUEST_CONFIG || {};
  var KEY = 'yq:v1', DEVKEY = 'yq:dev', SALT = 'yq27';
  var FILES = ['index.html', '02.html', '03.html', '04.html', '05.html', '06.html', '07.html', '08.html', '09.html', '10.html'];
  var TITLES = ['Имя', 'Свиток', 'Библиотека', 'Командный пункт', 'Летопись', 'Подземелье', 'Алхимик', 'Дело о квартире', 'Ритм', 'Последние врата'];
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  /* руна каждых врат: p — место в итоговом слове, c — буква */
  var RUNES = [
    { p: 6, c: 'А' }, { p: 3, c: 'Р' }, { p: 9, c: 'И' }, { p: 1, c: 'Б' }, { p: 8, c: 'Щ' },
    { p: 4, c: 'А' }, { p: 5, c: 'Б' }, { p: 10, c: 'К' }, { p: 2, c: 'А' }, { p: 7, c: 'Н' }
  ];
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function $(id) { return document.getElementById(id); }

  /* ---------- SHA-256 (чистый JS, работает и без https) ---------- */
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  function utf8(str) {
    if (window.TextEncoder) return new TextEncoder().encode(str);
    var s = unescape(encodeURIComponent(str)), a = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    return a;
  }
  function sha256hex(str) {
    var bytes = utf8(str), l = bytes.length, bitLen = l * 8;
    var padLen = ((l + 9 + 63) >> 6) << 6;
    var buf = new Uint8Array(padLen);
    buf.set(bytes); buf[l] = 0x80;
    var dv = new DataView(buf.buffer);
    dv.setUint32(padLen - 8, Math.floor(bitLen / 4294967296));
    dv.setUint32(padLen - 4, bitLen >>> 0);
    var h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var w = new Uint32Array(64);
    for (var o = 0; o < padLen; o += 64) {
      for (var i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
      for (i = 16; i < 64; i++) {
        var a15 = w[i - 15], a2 = w[i - 2];
        var s0 = ((a15 >>> 7) | (a15 << 25)) ^ ((a15 >>> 18) | (a15 << 14)) ^ (a15 >>> 3);
        var s1 = ((a2 >>> 17) | (a2 << 15)) ^ ((a2 >>> 19) | (a2 << 13)) ^ (a2 >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (i = 0; i < 64; i++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var ch = (e & f) ^ (~e & g);
        var t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
    }
    var out = '';
    for (i = 0; i < 8; i++) out += ('00000000' + (h[i] >>> 0).toString(16)).slice(-8);
    return out;
  }
  function norm(s) {
    return String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^Ѐ-ӿa-z0-9]/g, '');
  }
  function hashFor(n, s) { return sha256hex(SALT + '|' + n + '|' + norm(s)); }

  /* ---------- прогресс ---------- */
  var state = { s: [], h: {} }, storageOK = true, dev = false;
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && o.s instanceof Array) { state = o; state.h = state.h || {}; }
      }
      localStorage.setItem(KEY + ':t', '1'); localStorage.removeItem(KEY + ':t');
    } catch (e) { storageOK = false; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { storageOK = false; } }
  function solved(n) { return state.s.indexOf(n) > -1; }
  function firstUnsolved() { for (var i = 1; i <= 10; i++) if (!solved(i)) return i; return 10; }
  function readDev() {
    try {
      var q = location.search;
      if (/[?&]dev=1/.test(q)) sessionStorage.setItem(DEVKEY, '1');
      if (/[?&]dev=0/.test(q)) sessionStorage.removeItem(DEVKEY);
      dev = sessionStorage.getItem(DEVKEY) === '1';
    } catch (e) { dev = false; }
  }

  /* ---------- отрисовка ---------- */
  function renderTrail(n) {
    var box = $('trail'); if (!box) return;
    var h = '';
    for (var i = 1; i <= 10; i++) {
      var can = dev || !storageOK || i === 1 || i === n || solved(i) || solved(i - 1);
      var cls = 'dot' + (solved(i) ? ' done' : '') + (i === n ? ' now' : '') + (can ? '' : ' lock');
      h += can
        ? '<a class="' + cls + '" href="' + FILES[i - 1] + '" title="' + ROMAN[i - 1] + ' · ' + TITLES[i - 1] + '">' + i + '</a>'
        : '<span class="' + cls + '" title="Закрыто">' + i + '</span>';
    }
    box.innerHTML = h;
  }
  function renderRunes(newN) {
    var box = $('runes'); if (!box) return;
    var slots = [], i, p;
    for (p = 1; p <= 10; p++) slots[p] = null;
    for (i = 1; i <= 10; i++) if (solved(i)) slots[RUNES[i - 1].p] = { c: RUNES[i - 1].c, ch: i };
    var h = '';
    for (p = 1; p <= 10; p++) {
      var s = slots[p];
      h += '<span class="slot' + (s ? ' full' : '') + (s && s.ch === newN ? ' pop' : '') + '">' + (s ? s.c : '<i>' + p + '</i>') + '</span>';
    }
    box.innerHTML = h;
  }

  function setupHints(n, hints) {
    var box = $('hints'), btn = $('hintBtn');
    if (!box || !btn || !hints || !hints.length) { if (btn) btn.hidden = true; return; }
    var shown = Math.min(state.h[n] || 0, hints.length);
    function draw() {
      var out = '';
      for (var i = 0; i < shown; i++) out += '<div class="hint"><b>Намёк ' + (i + 1) + '.</b> ' + hints[i] + '</div>';
      box.innerHTML = out;
      if (shown >= hints.length) { btn.disabled = true; btn.textContent = 'Намёки закончились'; }
      else btn.textContent = shown ? 'Ещё намёк (' + shown + '/' + hints.length + ')' : 'Попросить намёк';
    }
    btn.addEventListener('click', function () {
      if (shown < hints.length) { shown++; state.h[n] = shown; save(); draw(); }
    });
    draw();
  }

  function loadPhoto(fig, base, n) {
    if (!fig) return;
    var exts = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'PNG'], i = 0;
    (function next() {
      if (i >= exts.length) return;
      var img = new Image();
      img.onload = function () {
        fig.innerHTML = '';
        fig.appendChild(img);
        var cap = (CFG.photoCaptions || {})[n];
        if (cap) { var fc = document.createElement('figcaption'); fc.textContent = cap; fig.appendChild(fc); }
        fig.hidden = false;
      };
      img.onerror = function () { i++; next(); };
      img.alt = 'Кадр из нашей истории';
      img.src = 'assets/photos/' + base + '.' + exts[i];
    })();
  }

  function plural(n, f) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return f[2];
    if (b > 1 && b < 5) return f[1];
    if (b === 1) return f[0];
    return f[2];
  }

  function finale(anim) {
    var f = $('finale'); if (!f) return;
    f.hidden = false;
    var byPos = [], i;
    for (i = 0; i < RUNES.length; i++) byPos[RUNES[i].p] = RUNES[i].c;
    var w = '';
    for (i = 1; i <= 10; i++) w += '<span style="--d:' + (anim ? 250 + i * 230 : 0) + 'ms">' + byPos[i] + '</span>';
    $('word').innerHTML = w;

    var lessons = CFG.lessons || 8;
    $('cRecipient').textContent = CFG.recipient || 'Юре';
    $('cLessons').textContent = lessons + ' ' + plural(lessons, ['занятие', 'занятия', 'занятий']);
    $('cTeacher').textContent = CFG.teacher || 'Николай';
    $('cStudio').textContent = CFG.studio ? ' · студия «' + CFG.studio + '»' : '';
    $('cGreeting').textContent = CFG.greeting || 'С Новым годом!';
    if (CFG.validity) { $('cValid').textContent = 'Срок действия: ' + CFG.validity; $('cValid').hidden = false; }

    var fh = (CFG.finalHint || '').replace(/^\s+|\s+$/g, '');
    $('finalHint').textContent = fh || 'Сертификат ждёт тебя. Спроси Софокла — она знает, где он лежит.';
    if (!fh && dev) { var warn = $('hintWarn'); warn.hidden = false; }

    var pb = $('printBtn'); if (pb) pb.addEventListener('click', function () { window.print(); });
    var cp = $('certPhoto');
    if (cp && CFG.certificatePhoto) {
      var im = new Image();
      im.onload = function () { cp.querySelector('img').src = im.src; cp.hidden = false; };
      im.src = CFG.certificatePhoto;
    }
  }

  var NOPE = [
    'Врата не дрогнули. Подумай ещё.',
    'Не то. Но ты на верном пути — или нет.',
    'Тишина. Видимо, это не тот ключ.',
    'Замок качает головой. Попробуй иначе.',
    'Нет. Где-то за кадром Софокл тихо улыбается.',
    'Камень остался холодным. Ещё раз?'
  ];
  var lastNope = -1;

  /* ---------- главная функция страницы ---------- */
  function init(opts) {
    var n = opts.n;
    readDev(); load();

    if (!dev && storageOK && n > 1 && !solved(n - 1)) {
      location.replace(FILES[firstUnsolved() - 1]);
      return;
    }

    garland(); embers();
    renderTrail(n); renderRunes(0);
    setupHints(n, opts.hints);

    var art = $('chapter'), form = $('form'), inp = $('answer'), fb = $('feedback');

    function showAfter(anim) {
      art.classList.add('is-solved');
      var r = RUNES[n - 1];
      $('award').innerHTML = '<div class="rune-big">' + r.c + '</div>Руна найдена · место ' + r.p + ' из 10';
      $('letter').hidden = false;
      loadPhoto($('memory'), $('memory').getAttribute('data-photo'), n);
      if (n === 10) finale(anim);
      if (anim && !REDUCED) setTimeout(function () { $('letter').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
    }

    if (solved(n)) {
      showAfter(false);
    } else {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = inp.value;
        if (!norm(v)) return;
        if (opts.a.indexOf(hashFor(n, v)) > -1) {
          if (!solved(n)) { state.s.push(n); save(); }
          renderTrail(n); renderRunes(n);
          showAfter(true);
        } else {
          var k; do { k = Math.floor(Math.random() * NOPE.length); } while (k === lastNope);
          lastNope = k;
          fb.textContent = NOPE[k]; fb.className = 'feedback bad';
          form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
          inp.select();
        }
      });
    }

    if ($('pad')) drumpad();

    var rb = $('resetBtn');
    if (rb) rb.addEventListener('click', function () {
      if (confirm('Стереть весь прогресс и начать хронику с первых врат?')) {
        try { localStorage.removeItem(KEY); } catch (e) {}
        location.href = 'index.html';
      }
    });

    if (dev) {
      var b = document.createElement('div');
      b.className = 'devbadge';
      b.innerHTML = 'режим теста: все врата открыты · <a href="?dev=0" style="color:#fff">выйти</a>';
      document.body.appendChild(b);
    }
    if (!storageOK) {
      var w = document.createElement('p');
      w.className = 'storewarn';
      w.textContent = 'Браузер не сохраняет прогресс (приватный режим?). Врата открыты по порядку, но руны не запомнятся.';
      art.insertBefore(w, art.firstChild);
    }
  }

  /* ---------- гирлянда ---------- */
  function garland() {
    var box = $('garland'); if (!box) return;
    function build() {
      var w = window.innerWidth, step = w < 520 ? 48 : 64, count = Math.ceil(w / step) + 1, i;
      var svg = '<svg width="' + w + '" height="70" viewBox="0 0 ' + w + ' 70" xmlns="http://www.w3.org/2000/svg">';
      var path = 'M0,6';
      for (i = 0; i < count; i++) path += ' Q' + (i * step + step / 2) + ',34 ' + ((i + 1) * step) + ',6';
      svg += '<path d="' + path + '" fill="none" stroke="#5a4636" stroke-width="2"/>';
      var ts = [0.25, 0.5, 0.75], ys = [16.5, 20, 16.5], cols = ['#ffe7ae', '#fff3d6', '#ffe7ae', '#f0d58c', '#ffe7ae', '#cfe0b8'];
      var k = 0;
      for (i = 0; i < count; i++) {
        for (var j = 0; j < 3; j++) {
          var x = i * step + step * ts[j], y = ys[j];
          var col = cols[k % cols.length], delay = ((k * 0.37) % 3.4).toFixed(2);
          svg += '<g class="bulb" style="animation-delay:-' + delay + 's">' +
            '<rect x="' + (x - 1.5) + '" y="' + (y - 1) + '" width="3" height="5" fill="#5a4636"/>' +
            '<ellipse cx="' + x + '" cy="' + (y + 9) + '" rx="4.2" ry="6.2" fill="' + col + '"/></g>';
          k++;
        }
      }
      box.innerHTML = svg + '</svg>';
    }
    build();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(build, 150); });
  }

  /* ---------- искры ---------- */
  function embers() {
    var c = $('embers'); if (!c || REDUCED || !c.getContext) return;
    var ctx = c.getContext('2d'), W = 0, H = 0, P = [], i;
    function size() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
    function mk(init) {
      return { x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: Math.random() * 1.7 + 0.6,
        vy: -(Math.random() * 0.35 + 0.12), vx: (Math.random() - 0.5) * 0.25, a: Math.random() * 0.55 + 0.2, t: Math.random() * 6.28 };
    }
    size(); window.addEventListener('resize', size);
    var N = W < 600 ? 24 : 44;
    for (i = 0; i < N; i++) P.push(mk(true));
    (function loop() {
      ctx.clearRect(0, 0, W, H);
      for (var j = 0; j < P.length; j++) {
        var p = P[j];
        p.t += 0.012; p.x += p.vx + Math.sin(p.t) * 0.16; p.y += p.vy;
        if (p.y < -10) P[j] = mk(false);
        var al = p.a * (0.6 + 0.4 * Math.sin(p.t * 3));
        ctx.fillStyle = 'rgba(255,226,160,' + (al * 0.18).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,232,178,' + al.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- барабанный пэд (врата IX) ---------- */
  function drumpad() {
    var ctx = null;
    function ac() {
      if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function kick(t) {
      var a = ac(); if (!a) return; t = t || a.currentTime;
      var o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.34);
    }
    function snare(t) {
      var a = ac(); if (!a) return; t = t || a.currentTime;
      var len = Math.floor(a.sampleRate * 0.2), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      var s = a.createBufferSource(); s.buffer = buf;
      var f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900;
      var g = a.createGain(); g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      s.connect(f); f.connect(g); g.connect(a.destination); s.start(t); s.stop(t + 0.2);
      var o = a.createOscillator(), og = a.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(220, t);
      og.gain.setValueAtTime(0.4, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(og); og.connect(a.destination); o.start(t); o.stop(t + 0.13);
    }
    function flash(el) { el.classList.add('hit'); setTimeout(function () { el.classList.remove('hit'); }, 110); }
    function bind(id, fn) {
      var el = $(id); if (!el) return;
      var evt = window.PointerEvent ? 'pointerdown' : 'mousedown';
      el.addEventListener(evt, function (e) { e.preventDefault(); fn(); flash(el); });
      el.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); fn(); flash(el); } });
    }
    bind('padKick', function () { kick(); });
    bind('padSnare', function () { snare(); });

    var playing = false, beatsEl = document.querySelectorAll('#beats span');
    var pb = $('padPlay');
    if (pb) pb.addEventListener('click', function () {
      if (playing || !ac()) return;
      playing = true;
      var bpm = 100, spb = 60 / bpm, t0 = ctx.currentTime + 0.1, pattern = ['k', 'k', 's', '-'];
      for (var bar = 0; bar < 2; bar++) {
        for (var b = 0; b < 4; b++) {
          (function (kind, delayMs, idx) {
            var tt = t0 + (bar * 4 + b) * spb;
            if (kind === 'k') kick(tt); else if (kind === 's') snare(tt);
            setTimeout(function () {
              for (var q = 0; q < beatsEl.length; q++) beatsEl[q].classList.remove('lit');
              if (kind !== '-') beatsEl[idx].classList.add('lit');
            }, delayMs);
          })(pattern[b], 100 + (bar * 4 + b) * spb * 1000, b);
        }
      }
      setTimeout(function () {
        for (var q = 0; q < beatsEl.length; q++) beatsEl[q].classList.remove('lit');
        playing = false;
      }, 100 + 8 * spb * 1000 + 100);
    });
  }

  window.QUEST = { init: init, _hash: hashFor, _norm: norm, _sha: sha256hex };
})();
