'use strict';

// ── Paramètres avancés (vitesse = section dédiée en haut) ─────────────────────
const PARAMS = [
  { g:'Grip',      key:'tyreFriction',          label:'Adhérence route',        hint:'↑ plus de grip  ↓ plus de drift',         step:0.1,  min:0.2, max:4   },
  { g:'Grip',      key:'kineticFrictionFactor',  label:'Résistance à la glisse', hint:'↑ récupère vite  ↓ glisse longtemps',     step:0.05, min:0.1, max:1   },
  { g:'Grip',      key:'tyreStiffness',          label:'Réactivité des pneus',   hint:'↑ pneus nerveux  ↓ pneus mous',           step:0.05, min:0.1, max:2   },
  { g:'Grip',      key:'rearStability',          label:'Stabilité arrière',      hint:'↑ moins de dérapage arrière',             step:0.05, min:0,   max:1   },
  { g:'Direction', key:'steerSpeedFactor',       label:'Rapidité de braquage',   hint:'↑ volant nerveux  ↓ volant doux',         step:0.05, min:0.1, max:3   },
  { g:'Direction', key:'steerAssist',            label:'Assistance volant',      hint:'↑ aide auto dans les virages',            step:0.05, min:0,   max:1   },
  { g:'Direction', key:'counterSteerAssist',     label:'Aide contre-braquage',   hint:'↑ corrige les dérapages automatiquement', step:0.05, min:0,   max:1   },
  { g:'Extra',     key:'lockDiff',               label:'Différentiel bloqué',    hint:'0 = ouvert · 1 = bloqué (hors-route)',    step:1,    min:0,   max:1   },
];

// ── Présets de mode ────────────────────────────────────────────────────────────
const MODES = {
  normal: { tyreFriction:1.6,  kineticFrictionFactor:0.85, tyreStiffness:1,   rearStability:0.5,  steerSpeedFactor:0.75, steerAssist:0.8,  counterSteerAssist:0,   lockDiff:0 },
  grip:   { tyreFriction:3.5,  kineticFrictionFactor:0.95, tyreStiffness:1.8, rearStability:1.0,  steerSpeedFactor:0.75, steerAssist:0.95, counterSteerAssist:0.6, lockDiff:0 },
  drift:  { tyreFriction:0.6,  kineticFrictionFactor:0.25, tyreStiffness:0.6, rearStability:0.05, steerSpeedFactor:1.5,  steerAssist:0.1,  counterSteerAssist:0,   lockDiff:0 },
  vol:    { tyreFriction:0.05, kineticFrictionFactor:0.05, tyreStiffness:2.0, rearStability:0,    steerSpeedFactor:2.0,  steerAssist:0.9,  counterSteerAssist:0.5, lockDiff:0 },
};

// ── Fonctions page context (world MAIN) ────────────────────────────────────────
// Chaque fonction est sérialisée — pas d'accès au scope popup.

function fnRead() {
  try {
    var vs  = JSON.parse(localStorage.getItem('settings_Vehicle') || '{}');
    var tc  = (vs.tuningConfig && vs.tuningConfig._value) ? vs.tuningConfig._value : {};
    var spd = parseFloat(localStorage.getItem('config-vehicle-speed') || '1');
    return {
      ok: true,
      speedMult:             isFinite(spd) ? spd : 1,
      tyreFriction:          tc.tyreFriction          != null ? tc.tyreFriction          : 1.6,
      kineticFrictionFactor: tc.kineticFrictionFactor != null ? tc.kineticFrictionFactor : 0.85,
      tyreStiffness:         tc.tyreStiffness         != null ? tc.tyreStiffness         : 1,
      rearStability:         tc.rearStability         != null ? tc.rearStability         : 0.5,
      steerSpeedFactor:      vs.steerSpeedFactor      != null ? vs.steerSpeedFactor      : 0.75,
      steerAssist:           tc.steerAssist           != null ? tc.steerAssist           : 0.8,
      counterSteerAssist:    tc.counterSteerAssist    != null ? tc.counterSteerAssist    : 0,
      lockDiff:              tc.lockDiff ? 1 : 0,
    };
  } catch (e) { return { ok: false, error: e.message }; }
}

function fnApply(data) {
  function sv(v, fb, mn, mx) {
    var n = parseFloat(v);
    if (!isFinite(n)) return fb;
    if (mn != null && n < mn) n = mn;
    if (mx != null && n > mx) n = mx;
    return n;
  }
  try {
    localStorage.setItem('config-vehicle-speed', String(sv(data.speedMult, 1, 0.1, 50)));
    var vs  = JSON.parse(localStorage.getItem('settings_Vehicle') || '{}');
    vs.steerSpeedFactor = sv(data.steerSpeedFactor, vs.steerSpeedFactor != null ? vs.steerSpeedFactor : 0.75, 0.1, 3);
    var tc  = vs.tuningConfig || {};
    var cur = tc._value || {};
    var nv  = {
      tyreFriction:          sv(data.tyreFriction,          cur.tyreFriction          != null ? cur.tyreFriction          : 1.6,  0.2, 4),
      kineticFrictionFactor: sv(data.kineticFrictionFactor, cur.kineticFrictionFactor != null ? cur.kineticFrictionFactor : 0.85, 0.1, 1),
      tyreStiffness:         sv(data.tyreStiffness,         cur.tyreStiffness         != null ? cur.tyreStiffness         : 1,    0.1, 2),
      rearStability:         sv(data.rearStability,         cur.rearStability         != null ? cur.rearStability         : 0.5,  0,   1),
      steerAssist:           sv(data.steerAssist,           cur.steerAssist           != null ? cur.steerAssist           : 0.8,  0,   1),
      counterSteerAssist:    sv(data.counterSteerAssist,    cur.counterSteerAssist    != null ? cur.counterSteerAssist    : 0,    0,   1),
      lockDiff:              sv(data.lockDiff, 0, 0, 1) >= 0.5,
    };
    tc._value = Object.assign(cur, nv);
    for (var k in nv) tc[k] = nv[k];
    vs.tuningConfig = tc;
    localStorage.setItem('settings_Vehicle', JSON.stringify(vs));
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

function fnApplyProgressive(data) {
  function sv(v, fb, mn, mx) {
    var n = parseFloat(v);
    if (!isFinite(n)) return fb;
    if (mn != null && n < mn) n = mn;
    if (mx != null && n > mx) n = mx;
    return n;
  }
  try {
    // Sauvegarder la vitesse cible pour content.js
    var target = String(sv(data.speedMult, 1, 0.1, 50));
    sessionStorage.setItem('sr_prog_target', target);
    // Phase 1 : vitesse = 1 pour laisser la map charger
    localStorage.setItem('config-vehicle-speed', '1');
    // Appliquer les autres params normalement
    var vs  = JSON.parse(localStorage.getItem('settings_Vehicle') || '{}');
    vs.steerSpeedFactor = sv(data.steerSpeedFactor, vs.steerSpeedFactor != null ? vs.steerSpeedFactor : 0.75, 0.1, 3);
    var tc  = vs.tuningConfig || {};
    var cur = tc._value || {};
    var nv  = {
      tyreFriction:          sv(data.tyreFriction,          cur.tyreFriction          != null ? cur.tyreFriction          : 1.6,  0.2, 4),
      kineticFrictionFactor: sv(data.kineticFrictionFactor, cur.kineticFrictionFactor != null ? cur.kineticFrictionFactor : 0.85, 0.1, 1),
      tyreStiffness:         sv(data.tyreStiffness,         cur.tyreStiffness         != null ? cur.tyreStiffness         : 1,    0.1, 2),
      rearStability:         sv(data.rearStability,         cur.rearStability         != null ? cur.rearStability         : 0.5,  0,   1),
      steerAssist:           sv(data.steerAssist,           cur.steerAssist           != null ? cur.steerAssist           : 0.8,  0,   1),
      counterSteerAssist:    sv(data.counterSteerAssist,    cur.counterSteerAssist    != null ? cur.counterSteerAssist    : 0,    0,   1),
      lockDiff:              sv(data.lockDiff, 0, 0, 1) >= 0.5,
    };
    tc._value = Object.assign(cur, nv);
    for (var k in nv) tc[k] = nv[k];
    vs.tuningConfig = tc;
    localStorage.setItem('settings_Vehicle', JSON.stringify(vs));
    return { ok: true, target: target };
  } catch (e) { return { ok: false, error: e.message }; }
}

function fnReset() {
  try {
    localStorage.setItem('config-vehicle-speed', '1');
    var vs  = JSON.parse(localStorage.getItem('settings_Vehicle') || '{}');
    vs.steerSpeedFactor = 0.75;
    var def = { tyreFriction:1.6, kineticFrictionFactor:0.85, tyreStiffness:1, rearStability:0.5, steerAssist:0.8, counterSteerAssist:0, lockDiff:false };
    var tc  = vs.tuningConfig || {};
    tc._value = Object.assign(tc._value || {}, def);
    for (var k in def) tc[k] = def[k];
    vs.tuningConfig = tc;
    localStorage.setItem('settings_Vehicle', JSON.stringify(vs));
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

function fnGetLogs()    { return (window.__sr_log || []).map(function (e) { return { ms:e.ms, msg:e.msg, type:e.type }; }); }
function fnScanOn()     { if (window.__sr_scan) window.__sr_scan(true);  return true; }
function fnScanOff()    { if (window.__sr_scan) window.__sr_scan(false); return true; }
function fnScanReport() { return window.__sr_scanReport ? window.__sr_scanReport() : []; }

// ── Helpers extension ─────────────────────────────────────────────────────────

async function getTab() {
  const [t] = await chrome.tabs.query({ active:true, currentWindow:true });
  return t;
}

function exec(tabId, func, args) {
  return chrome.scripting.executeScript({ target:{tabId}, world:'MAIN', func, args:args||[] })
    .then(r => r?.[0]?.result).catch(e => ({ ok:false, error:e.message }));
}

function setStatus(msg, cls) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = cls || '';
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab,.panel').forEach(el => el.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// ── Section vitesse ───────────────────────────────────────────────────────────
const spdInput = document.getElementById('spdInput');
const spdWrap  = document.getElementById('spdWrap');
let   origSpeed = null;

function setSpdActive(v) {
  document.querySelectorAll('.spd-btn').forEach(b => {
    b.classList.toggle('active', parseFloat(b.dataset.v) === v);
  });
}
function markSpdChanged() {
  const v = parseFloat(spdInput.value);
  spdWrap.classList.toggle('changed', origSpeed !== null && isFinite(v) && +v.toFixed(3) !== +parseFloat(origSpeed).toFixed(3));
}

document.querySelectorAll('.spd-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    spdInput.value = btn.dataset.v;
    setSpdActive(parseFloat(btn.dataset.v));
    markSpdChanged();
  });
});
document.getElementById('spdMinus').addEventListener('click', () => {
  const next = +Math.max(0.1, (parseFloat(spdInput.value)||1) - 0.5).toFixed(2);
  spdInput.value = next; setSpdActive(next); markSpdChanged();
});
document.getElementById('spdPlus').addEventListener('click', () => {
  const next = +Math.min(50, (parseFloat(spdInput.value)||1) + 0.5).toFixed(2);
  spdInput.value = next; setSpdActive(next); markSpdChanged();
});
spdInput.addEventListener('input', () => { setSpdActive(parseFloat(spdInput.value)); markSpdChanged(); });

// Progressive start
const chkProg  = document.getElementById('chkProg');
const progWrap = document.getElementById('progWrap');
chkProg.addEventListener('change', () => progWrap.classList.toggle('on', chkProg.checked));

// ── Modes ─────────────────────────────────────────────────────────────────────
const origVals = {};

function applyMode(key) {
  const m = MODES[key];
  if (!m) return;
  PARAMS.forEach(p => {
    if (m[p.key] == null) return;
    const inp  = document.getElementById('f-' + p.key);
    const wrap = document.getElementById('w-' + p.key);
    if (!inp) return;
    inp.value = +parseFloat(m[p.key]).toFixed(5);
    if (wrap) markChanged(wrap, inp, origVals[p.key] ?? null);
  });
  const cls = { normal:'m-normal', grip:'m-grip', drift:'m-drift', vol:'m-vol' };
  document.querySelectorAll('.mode-btn').forEach(b => b.className = 'mode-btn');
  const btn = document.getElementById('mode' + key.charAt(0).toUpperCase() + key.slice(1));
  if (btn) btn.classList.add(cls[key]);
}

document.getElementById('modeNormal').addEventListener('click', () => applyMode('normal'));
document.getElementById('modeGrip'  ).addEventListener('click', () => applyMode('grip'));
document.getElementById('modeDrift' ).addEventListener('click', () => applyMode('drift'));
document.getElementById('modeVol'   ).addEventListener('click', () => applyMode('vol'));

// ── Stats UI ──────────────────────────────────────────────────────────────────
function buildStats(settings) {
  const container = document.getElementById('pStats');
  container.innerHTML = '';
  let lastG = null;

  for (const p of PARAMS) {
    if (p.g !== lastG) {
      lastG = p.g;
      const sec = document.createElement('div');
      sec.className = 'section';
      sec.textContent = p.g;
      container.appendChild(sec);
    }

    const orig = settings?.[p.key] ?? null;
    origVals[p.key] = orig;

    const row  = document.createElement('div'); row.className = 'row';
    const lbl  = document.createElement('label');
    lbl.htmlFor = 'f-' + p.key;
    lbl.innerHTML = p.label + (p.hint ? '<small>' + p.hint + '</small>' : '');

    const wrap = document.createElement('div'); wrap.className = 'inp-wrap'; wrap.id = 'w-' + p.key;
    const bM   = document.createElement('button'); bM.textContent = '−'; bM.type = 'button';
    const inp  = document.createElement('input');
    inp.type = 'number'; inp.id = 'f-' + p.key; inp.step = p.step; inp.min = p.min; inp.max = p.max; inp.dataset.key = p.key;
    if (orig !== null) inp.value = +parseFloat(orig).toFixed(5); else inp.placeholder = '—';
    const bP = document.createElement('button'); bP.textContent = '+'; bP.type = 'button';

    const nudge = dir => {
      const next = Math.min(p.max, Math.max(p.min, (parseFloat(inp.value)||0) + dir * p.step));
      inp.value = +next.toFixed(5);
      markChanged(wrap, inp, orig);
    };
    bM.addEventListener('click', () => nudge(-1));
    bP.addEventListener('click', () => nudge(+1));
    inp.addEventListener('input', () => markChanged(wrap, inp, orig));

    wrap.append(bM, inp, bP);
    row.append(lbl, wrap);
    container.appendChild(row);
  }
}

function markChanged(wrap, inp, orig) {
  const v = parseFloat(inp.value);
  wrap.classList.toggle('changed', orig !== null && isFinite(v) && +v.toFixed(5) !== +parseFloat(orig).toFixed(5));
}

function collect() {
  const data = {}, errors = [];
  const spd = parseFloat(spdInput.value);
  if (isFinite(spd)) data.speedMult = Math.max(0.1, Math.min(50, spd));
  document.querySelectorAll('input[data-key]').forEach(el => {
    const p = PARAMS.find(p => p.key === el.dataset.key);
    if (!el.value) return;
    const v = parseFloat(el.value);
    if (!isFinite(v)) return;
    const wrap = el.closest('.inp-wrap');
    if (p && v < p.min) { errors.push(p.label + ' < ' + p.min); if (wrap) wrap.style.borderColor = 'var(--red)'; }
    else if (p && v > p.max) { errors.push(p.label + ' > ' + p.max); if (wrap) wrap.style.borderColor = 'var(--red)'; }
    else { if (wrap) wrap.style.borderColor = ''; data[el.dataset.key] = v; }
  });
  data._errors = errors;
  return data;
}

// ── Logs ──────────────────────────────────────────────────────────────────────
function renderLogs(entries) {
  const list = document.getElementById('logList');
  list.innerHTML = '';
  if (!entries?.length) { list.innerHTML = '<div style="color:var(--mute);padding:8px">Aucun log</div>'; return; }
  entries.forEach(e => {
    const row = document.createElement('div'); row.className = 'log-entry ' + (e.type||'info');
    const ts  = document.createElement('span'); ts.className = 'log-ts'; ts.textContent = e.ms >= 0 ? '+' + e.ms + 'ms' : '     ';
    const msg = document.createElement('span'); msg.className = 'log-msg'; msg.textContent = e.msg;
    row.append(ts, msg); list.appendChild(row);
  });
  list.scrollTop = list.scrollHeight;
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const tab = await getTab();

  if (!tab?.url?.includes('slowroads.io')) {
    setStatus('⚠ Ouvre slowroads.io d\'abord', 'err');
    buildStats(null);
    wireButtons(tab);
    return;
  }

  setStatus('Lecture des paramètres…', 'warn');
  const result = await exec(tab.id, fnRead);

  if (result?.ok) {
    setStatus('✓ Paramètres chargés', 'ok');
    buildStats(result);
    origSpeed      = result.speedMult;
    spdInput.value = +parseFloat(result.speedMult).toFixed(2);
    setSpdActive(result.speedMult);
  } else {
    setStatus('⚠ ' + (result?.error || 'Erreur lecture'), 'err');
    buildStats(null);
  }

  const logs = await exec(tab.id, fnGetLogs);
  renderLogs(logs || []);
  wireButtons(tab);
});

// ── Boutons ───────────────────────────────────────────────────────────────────
function wireButtons(tab) {
  const noGame = !tab?.url?.includes('slowroads.io');

  document.getElementById('btnLive').addEventListener('click', async () => {
    if (noGame) { setStatus('⚠ Ouvre slowroads.io', 'err'); return; }
    const data = collect();
    if (data._errors?.length) { setStatus('⚠ ' + data._errors[0], 'err'); return; }

    if (chkProg.checked) {
      setStatus('⏱ Phase 1/2 — reload à ×1 pendant 8 s…', 'warn');
      const res = await exec(tab.id, fnApplyProgressive, [data]);
      if (res?.ok) {
        setStatus('✓ Map charge à ×1 — vitesse ×' + res.target + ' dans 8 s', 'ok');
        await exec(tab.id, () => location.reload());
      } else { setStatus('⚠ ' + (res?.error||'Erreur'), 'err'); }
    } else {
      setStatus('Sauvegarde…', 'warn');
      const res = await exec(tab.id, fnApply, [data]);
      if (res?.ok) {
        setStatus('✓ Appliqué — rechargement…', 'ok');
        await exec(tab.id, () => location.reload());
      } else { setStatus('⚠ ' + (res?.error||'Erreur inconnue'), 'err'); }
    }
  });

  document.getElementById('btnReload').addEventListener('click', async () => {
    if (noGame) { setStatus('⚠ Ouvre slowroads.io', 'err'); return; }
    const res = await exec(tab.id, fnReset);
    if (res?.ok) { setStatus('↺ Réinitialisé — rechargement…', 'warn'); await exec(tab.id, () => location.reload()); }
    else setStatus('⚠ ' + (res?.error||'Erreur reset'), 'err');
  });

  document.getElementById('btnReset').addEventListener('click', async () => {
    if (noGame) { setStatus('⚠ Ouvre slowroads.io', 'err'); return; }
    const result = await exec(tab.id, fnRead);
    if (result?.ok) {
      buildStats(result);
      origSpeed = result.speedMult;
      spdInput.value = +parseFloat(result.speedMult).toFixed(2);
      setSpdActive(result.speedMult);
      setStatus('✓ Valeurs rechargées', 'ok');
    }
  });

  document.getElementById('btnRefreshLogs').addEventListener('click', async () => {
    renderLogs(await exec(tab?.id, fnGetLogs) || []);
  });

  document.getElementById('btnCopyLogs').addEventListener('click', async () => {
    const logs = await exec(tab?.id, fnGetLogs);
    if (!logs) return;
    const txt = logs.map(e => '[+' + e.ms + 'ms][' + e.type + '] ' + e.msg).join('\n');
    navigator.clipboard.writeText(txt).then(() => {
      const btn = document.getElementById('btnCopyLogs');
      btn.textContent = '✓ Copié !';
      setTimeout(() => { btn.textContent = '⎘ Copier'; }, 1500);
    });
  });

  let _scanOn = false;
  document.getElementById('btnScan').addEventListener('click', async () => {
    if (noGame) { setStatus('⚠ Ouvre slowroads.io', 'err'); return; }
    _scanOn = !_scanOn;
    const btn = document.getElementById('btnScan');
    if (_scanOn) {
      await exec(tab.id, fnScanOn);
      btn.textContent = '⏹ Stop scan'; btn.style.color = 'var(--grn)';
      setStatus('🔍 Scan actif — reproduis le bug, puis Rapport', 'warn');
    } else {
      await exec(tab.id, fnScanOff);
      btn.textContent = '🔍 Scan'; btn.style.color = '';
      setStatus('Scan arrêté', 'ok');
    }
  });

  document.getElementById('btnScanReport').addEventListener('click', async () => {
    if (noGame) { setStatus('⚠ Ouvre slowroads.io', 'err'); return; }
    const logs   = await exec(tab.id, fnGetLogs);
    const report = await exec(tab.id, fnScanReport);
    const extra  = (report||[]).slice(0,30).map(e => ({ ms:-1, msg:'[SCAN] ' + e.fn + ' × ' + e.count, type:'warn' }));
    renderLogs([...(logs||[]), ...extra]);
    setStatus(!(report||[]).length ? 'Aucune donnée scan' : 'Rapport : ' + report.length + ' anomalie(s)', (report||[]).length ? 'err' : 'warn');
  });
}
