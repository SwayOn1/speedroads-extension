'use strict';

// ── Paramètres avancés ────────────────────────────────────────────────────────
// Sources : settings_Gameplay (gp) ou settings_Vehicle.tuningConfig (tc)
const PARAMS = [
  // Grip global (settings_Gameplay — limite jeu : max 2)
  { g:'Grip global', key:'gripFactor', src:'gp', label:'Grip global',            hint:'Multiplicateur grip latéral (max 2 selon jeu)', step:0.05, min:0.01, max:2    },
  // Pneus (tuningConfig)
  { g:'Pneus',       key:'tyreFriction',          label:'Adhérence pneus',       hint:'↑ plus de grip  ↓ plus de drift',               step:0.1,  min:0.01, max:10   },
  { g:'Pneus',       key:'kineticFrictionFactor',  label:'Résistance à la glisse',hint:'↑ récupère vite  ↓ glisse longtemps',           step:0.05, min:0,    max:2    },
  { g:'Pneus',       key:'tyreStiffness',          label:'Rigidité pneus',        hint:'↑ pneus nerveux  ↓ pneus mous',                 step:0.05, min:0,    max:10   },
  { g:'Pneus',       key:'rearStability',          label:'Stabilité arrière',     hint:'↑ moins de dérapage arrière',                   step:0.05, min:0,    max:1    },
  // Direction
  { g:'Direction',   key:'steerSpeedFactor',       label:'Rapidité de braquage',  hint:'↑ volant nerveux  ↓ volant doux',               step:0.05, min:0.1,  max:5    },
  { g:'Direction',   key:'steerAssist',            label:'Assistance volant',     hint:'↑ aide auto dans les virages',                  step:0.05, min:0,    max:1    },
  { g:'Direction',   key:'counterSteerAssist',     label:'Aide contre-braquage',  hint:'↑ corrige les dérapages automatiquement',       step:0.05, min:0,    max:1    },
  // Suspension
  { g:'Suspension',  key:'shockTravel',            label:'Débattement suspension',hint:'Distance de compression (défaut 0.12)',          step:0.01, min:0,    max:1    },
  { g:'Suspension',  key:'shockForce',             label:'Dureté ressorts',       hint:'Force des amortisseurs (défaut 3)',              step:0.5,  min:0,    max:30   },
  { g:'Suspension',  key:'damping',                label:'Amortissement',         hint:'Résistance aux rebonds (défaut 8)',              step:0.5,  min:0,    max:50   },
  // Poids
  { g:'Poids',       key:'weightFactor',           label:'Transfert de poids',    hint:'Effet de caisse dans les virages (défaut 0.15)', step:0.01, min:0,    max:2    },
  { g:'Poids',       key:'wheelMassFactor',        label:'Masse des roues',       hint:'Inertie des roues (défaut 0.2)',                 step:0.01, min:0,    max:2    },
  // Extra
  { g:'Extra',       key:'lockDiff',               label:'Différentiel bloqué',   hint:'0 = ouvert · 1 = bloqué (hors-route)',          step:1,    min:0,    max:1    },
];

// ── Présets de mode ────────────────────────────────────────────────────────────
const MODES = {
  normal: { gripFactor:1,    tyreFriction:1.6,  kineticFrictionFactor:0.85, tyreStiffness:1,   rearStability:0.5,  steerSpeedFactor:0.75, steerAssist:0.8,  counterSteerAssist:0,   lockDiff:0, shockTravel:0.12, shockForce:3,  damping:8,  weightFactor:0.15, wheelMassFactor:0.2 },
  grip:   { gripFactor:2,    tyreFriction:4,    kineticFrictionFactor:0.95, tyreStiffness:2,   rearStability:1.0,  steerSpeedFactor:0.75, steerAssist:0.95, counterSteerAssist:0.6, lockDiff:0, shockTravel:0.1,  shockForce:4,  damping:10, weightFactor:0.1,  wheelMassFactor:0.2 },
  drift:  { gripFactor:0.3,  tyreFriction:0.5,  kineticFrictionFactor:0.2,  tyreStiffness:0.5, rearStability:0.05, steerSpeedFactor:1.5,  steerAssist:0.1,  counterSteerAssist:0,   lockDiff:0, shockTravel:0.15, shockForce:2,  damping:6,  weightFactor:0.2,  wheelMassFactor:0.2 },
  vol:    { gripFactor:0.2,  tyreFriction:0.05, kineticFrictionFactor:0.05, tyreStiffness:2.0, rearStability:0,    steerSpeedFactor:2.0,  steerAssist:0.9,  counterSteerAssist:0.5, lockDiff:0, shockTravel:0.05, shockForce:1,  damping:3,  weightFactor:0.05, wheelMassFactor:0.1 },
};

// ── Fonctions page context (world MAIN) ────────────────────────────────────────
// Chaque fonction est sérialisée — pas d'accès au scope popup.

function fnRead() {
  try {
    var vs  = JSON.parse(localStorage.getItem('settings_Vehicle') || '{}');
    var tc  = (vs.tuningConfig && vs.tuningConfig._value) ? vs.tuningConfig._value : {};
    var sg  = JSON.parse(localStorage.getItem('settings_Gameplay') || '{}');
    var spd = sg.speedFactor != null ? parseFloat(sg.speedFactor) : 1;
    return {
      ok: true,
      speedMult:             isFinite(spd) ? spd : 1,
      gripFactor:            sg.gripFactor            != null ? sg.gripFactor            : 1,
      tyreFriction:          tc.tyreFriction          != null ? tc.tyreFriction          : 1.6,
      kineticFrictionFactor: tc.kineticFrictionFactor != null ? tc.kineticFrictionFactor : 0.85,
      tyreStiffness:         tc.tyreStiffness         != null ? tc.tyreStiffness         : 1,
      rearStability:         tc.rearStability         != null ? tc.rearStability         : 0.5,
      steerSpeedFactor:      vs.steerSpeedFactor      != null ? vs.steerSpeedFactor      : 0.75,
      steerAssist:           tc.steerAssist           != null ? tc.steerAssist           : 0.8,
      counterSteerAssist:    tc.counterSteerAssist    != null ? tc.counterSteerAssist    : 0,
      lockDiff:              tc.lockDiff ? 1 : 0,
      shockTravel:           tc.shockTravel           != null ? tc.shockTravel           : 0.12,
      shockForce:            tc.shockForce            != null ? tc.shockForce            : 3,
      damping:               tc.damping               != null ? tc.damping               : 8,
      weightFactor:          tc.weightFactor          != null ? tc.weightFactor          : 0.15,
      wheelMassFactor:       tc.wheelMassFactor       != null ? tc.wheelMassFactor       : 0.2,
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
    var sg = JSON.parse(localStorage.getItem('settings_Gameplay') || '{}');
    sg.speedFactor = sv(data.speedMult,   1, 0.001, 1000000);
    sg.gripFactor  = sv(data.gripFactor,  1, 0.01,  2);
    localStorage.setItem('settings_Gameplay', JSON.stringify(sg));
    var vs  = JSON.parse(localStorage.getItem('settings_Vehicle') || '{}');
    vs.steerSpeedFactor = sv(data.steerSpeedFactor, vs.steerSpeedFactor != null ? vs.steerSpeedFactor : 0.75, 0.1, 5);
    var tc  = vs.tuningConfig || {};
    var cur = tc._value || {};
    var nv  = {
      tyreFriction:          sv(data.tyreFriction,          cur.tyreFriction          != null ? cur.tyreFriction          : 1.6,  0.01, 10),
      kineticFrictionFactor: sv(data.kineticFrictionFactor, cur.kineticFrictionFactor != null ? cur.kineticFrictionFactor : 0.85, 0,    2),
      tyreStiffness:         sv(data.tyreStiffness,         cur.tyreStiffness         != null ? cur.tyreStiffness         : 1,    0,    10),
      rearStability:         sv(data.rearStability,         cur.rearStability         != null ? cur.rearStability         : 0.5,  0,    1),
      steerAssist:           sv(data.steerAssist,           cur.steerAssist           != null ? cur.steerAssist           : 0.8,  0,    1),
      counterSteerAssist:    sv(data.counterSteerAssist,    cur.counterSteerAssist    != null ? cur.counterSteerAssist    : 0,    0,    1),
      lockDiff:              sv(data.lockDiff, 0, 0, 1) >= 0.5,
      shockTravel:           sv(data.shockTravel,           cur.shockTravel           != null ? cur.shockTravel           : 0.12, 0,    1),
      shockForce:            sv(data.shockForce,            cur.shockForce            != null ? cur.shockForce            : 3,    0,    30),
      damping:               sv(data.damping,               cur.damping               != null ? cur.damping               : 8,    0,    50),
      weightFactor:          sv(data.weightFactor,          cur.weightFactor          != null ? cur.weightFactor          : 0.15, 0,    2),
      wheelMassFactor:       sv(data.wheelMassFactor,       cur.wheelMassFactor       != null ? cur.wheelMassFactor       : 0.2,  0,    2),
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
    var target = String(sv(data.speedMult, 1, 0.001, 100));
    sessionStorage.setItem('sr_prog_target', target);
    // Phase 1 : vitesse = 1 pour laisser la map charger
    var sg0 = JSON.parse(localStorage.getItem('settings_Gameplay') || '{}');
    sg0.speedFactor = 1;
    sg0.gripFactor  = sv(data.gripFactor, 1, 0.01, 2);
    localStorage.setItem('settings_Gameplay', JSON.stringify(sg0));
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
    var sgr = JSON.parse(localStorage.getItem('settings_Gameplay') || '{}');
    sgr.speedFactor = 1;
    sgr.gripFactor  = 1;
    localStorage.setItem('settings_Gameplay', JSON.stringify(sgr));
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
  const cur = parseFloat(spdInput.value) || 1;
  const step = cur >= 100 ? 50 : cur >= 10 ? 5 : 1;
  const next = +Math.max(0.001, cur - step).toFixed(3);
  spdInput.value = next; setSpdActive(next); markSpdChanged();
});
document.getElementById('spdPlus').addEventListener('click', () => {
  const cur = parseFloat(spdInput.value) || 1;
  const step = cur >= 100 ? 50 : cur >= 10 ? 5 : 1;
  const next = +Math.min(1000000, cur + step).toFixed(3);
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
  if (isFinite(spd)) data.speedMult = Math.max(0.001, spd);
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
