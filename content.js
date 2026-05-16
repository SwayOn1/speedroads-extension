/**
 * content.js v5.1 — document_start, world MAIN
 *
 *  0. Démarrage progressif → vitesse×N après 8 s si sr_prog_target en sessionStorage
 *  1. AudioParam   → crash "non-finite" (son moteur haute vitesse)
 *  2. Math étendu  → NaN/Inf dans les calculs physiques (virages inclus)
 *       floor/ceil/round/trunc : NaN|Inf → 0
 *       sqrt                   : x<0     → 0
 *       asin/acos              : |x|>1   → clamp (angle glissement pneu)
 *       atan/atan2             : NaN     → 0
 *       sin/cos                : NaN → 0/1 (matrice identité, évite gel physique)
 *       log/pow                : NaN résultat → 0
 *  3. Capture globale window.onerror + unhandledrejection
 *  4. MutationObserver → masquer l'écran d'erreur + reload auto (≤3)
 *  5. Lecteur settings pour popup
 *
 *  Scan mode : window.__sr_scan(true/false) + window.__sr_scanReport()
 */
(function () {
  'use strict';

  var T0 = Date.now();
  window.__sr_log = [];

  function log(msg, type) {
    window.__sr_log.push({ ms: Date.now() - T0, msg: msg, type: type || 'info' });
  }

  // ── Intercepteur localStorage — inspecte settings_Vehicle complet ───────────
  var _lsSniffEnd = Date.now() + 12000;
  var _lsSeen     = {};
  var _lsOrigGet  = Storage.prototype.getItem;
  var _lsOrigSet  = Storage.prototype.setItem;

  Storage.prototype.getItem = function (key) {
    var val = _lsOrigGet.call(this, key);
    if (this === localStorage && !_lsSeen['g' + key] && Date.now() < _lsSniffEnd) {
      _lsSeen['g' + key] = true;
      log('[LS.get] ' + key + ' = ' + (val !== null ? String(val).slice(0, 60) : 'null'), 'info');
    }
    return val;
  };

  Storage.prototype.setItem = function (key, val) {
    if (this === localStorage && Date.now() < _lsSniffEnd) {
      if (key === 'settings_Vehicle') {
        try {
          var sv = JSON.parse(val);
          log('[SV] speedFactor=' + sv.speedFactor + ' type=' + sv.type + ' mode=' + sv.mode, 'warn');
          var tc  = sv.tuningConfig || {};
          var tcv = tc._value || {};
          var keys = Object.keys(tcv);
          if (keys.length) {
            keys.forEach(function (k) { log('[SV.tuning] ' + k + ' = ' + tcv[k], 'warn'); });
          } else {
            log('[SV.tuning] _value vide — keys racine: ' + Object.keys(tc).join(', '), 'warn');
          }
        } catch (e) { log('[SV] erreur parse: ' + e.message, 'error'); }
      } else if (!_lsSeen['s' + key]) {
        _lsSeen['s' + key] = true;
        log('[LS.set] ' + key, 'info');
      }
    }
    return _lsOrigSet.call(this, key, val);
  };
  log('Intercepteur LS actif (12 s) — tous les champs de settings_Vehicle loggés', 'ok');

  // ── Démarrage progressif ────────────────────────────────────────────────────
  // Le popup sauvegarde sr_prog_target dans sessionStorage avant de recharger à ×1.
  // Ici on détecte ça et on applique la vraie vitesse après 8 s (map chargée).
  var _progTarget = sessionStorage.getItem('sr_prog_target');
  if (_progTarget && !isNaN(parseFloat(_progTarget))) {
    sessionStorage.removeItem('sr_prog_target');
    log('Démarrage progressif : ×' + _progTarget + ' dans 8 s — la map charge…', 'ok');
    setTimeout(function () {
      try {
        var _sg = JSON.parse(localStorage.getItem('settings_Gameplay') || '{}');
        _sg.speedFactor = parseFloat(_progTarget);
        localStorage.setItem('settings_Gameplay', JSON.stringify(_sg));
      } catch (_e) {}
      log('Démarrage progressif : ×' + _progTarget + ' appliqué — reload…', 'ok');
      location.reload();
    }, 8000);
  }

  // ── Mode scan ────────────────────────────────────────────────────────────────
  var _scanMode   = false;
  var _scanCounts = {};

  window.__sr_scan = function (enable) {
    _scanMode = (enable !== false);
    _scanCounts = {};
    log('Mode scan ' + (_scanMode ? 'ACTIVÉ — compteurs remis à zéro' : 'désactivé'), _scanMode ? 'ok' : 'info');
  };

  window.__sr_scanReport = function () {
    var out = [];
    for (var k in _scanCounts) out.push({ fn: k, count: _scanCounts[k] });
    return out.sort(function (a, b) { return b.count - a.count; });
  };

  function scanHit(label, input) {
    _scanCounts[label] = (_scanCounts[label] || 0) + 1;
    if (_scanMode && _scanCounts[label] <= 3) {
      log('[SCAN] ' + label + '(' + input + ')', 'warn');
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 1. AudioParam — crash "non-finite value"
  // ════════════════════════════════════════════════════════════════════════════
  try {
    var AP   = AudioParam.prototype;
    var AMAX = 20000;

    function safeA(v, pos) {
      if (!isFinite(v) || isNaN(v)) return pos ? 1 : 0;
      if (pos && v <= 0) return 0.0001;
      return Math.min(Math.max(v, pos ? 0.0001 : -AMAX), AMAX);
    }
    function safeT(t) { return (isFinite(t) && t >= 0) ? t : 0; }

    var _lin = AP.linearRampToValueAtTime;
    var _exp = AP.exponentialRampToValueAtTime;
    var _set = AP.setValueAtTime;
    var _tgt = AP.setTargetAtTime;
    var _cur = AP.setValueCurveAtTime;

    AP.linearRampToValueAtTime      = function (v, t)     { return _lin.call(this, safeA(v),       safeT(t)); };
    AP.exponentialRampToValueAtTime = function (v, t)     { return _exp.call(this, safeA(v, true), safeT(t)); };
    AP.setValueAtTime               = function (v, t)     { return _set.call(this, safeA(v),       safeT(t)); };
    AP.setTargetAtTime              = function (v, t, tc) { return _tgt.call(this, safeA(v), safeT(t), isFinite(tc) ? tc : 0.01); };
    if (_cur) {
      AP.setValueCurveAtTime = function (a, t, d) {
        var c = Array.prototype.map.call(a, function (x) { return safeA(x); });
        return _cur.call(this, c, safeT(t), isFinite(d) ? d : 0.1);
      };
    }
    log('Patch AudioParam OK', 'ok');
  } catch (e) { log('Patch AudioParam ÉCHEC : ' + e.message, 'warn'); }

  // ════════════════════════════════════════════════════════════════════════════
  // 2. Math étendu — tous les cas qui produisent NaN dans un moteur physique
  // ════════════════════════════════════════════════════════════════════════════
  try {

    // ── Entiers ──────────────────────────────────────────────────────────────
    ['floor', 'ceil', 'round', 'trunc'].forEach(function (fn) {
      var o = Math[fn];
      Math[fn] = function (x) {
        var r = o(x);
        if (isNaN(r) || !isFinite(r)) { scanHit('Math.' + fn, x); return 0; }
        return r;
      };
    });

    // ── sqrt : entrée négative (distance, discriminant) ───────────────────
    var _sqrt = Math.sqrt;
    Math.sqrt = function (x) {
      if (isNaN(x) || x < 0) { scanHit('Math.sqrt', x); return 0; }
      return _sqrt(x);
    };

    // ── asin / acos : |ratio glissement| > 1 en virage rapide ────────────
    var _asin = Math.asin;
    Math.asin = function (x) {
      if (isNaN(x))  { scanHit('Math.asin-NaN', x);  return 0; }
      if (x >  1)    { scanHit('Math.asin>1',   x);  return  Math.PI / 2; }
      if (x < -1)    { scanHit('Math.asin<-1',  x);  return -Math.PI / 2; }
      return _asin(x);
    };

    var _acos = Math.acos;
    Math.acos = function (x) {
      if (isNaN(x))  { scanHit('Math.acos-NaN', x);  return 0; }
      if (x >  1)    { scanHit('Math.acos>1',   x);  return 0; }
      if (x < -1)    { scanHit('Math.acos<-1',  x);  return Math.PI; }
      return _acos(x);
    };

    // ── atan / atan2 : NaN (Inf est géré nativement → ±π/2) ─────────────
    var _atan = Math.atan;
    Math.atan = function (x) {
      if (isNaN(x)) { scanHit('Math.atan', x); return 0; }
      return _atan(x);
    };

    var _atan2 = Math.atan2;
    Math.atan2 = function (y, x) {
      if (isNaN(y) || isNaN(x)) { scanHit('Math.atan2', y + ',' + x); return 0; }
      return _atan2(y, x);
    };

    // ── sin / cos / tan ───────────────────────────────────────────────────────
    // Quand l'angle est NaN (Infinity/Infinity lors de la normalisation vitesse),
    // sin→0 et cos→1 donnent la matrice identité (rotation nulle, véhicule droit).
    // cos→0 donnerait une matrice singulière (det=0) → physique gelée + roues invisibles.
    var _sin = Math.sin;
    Math.sin = function (x) {
      if (!isFinite(x) || isNaN(x)) { scanHit('Math.sin', x); return 0; }
      var r = _sin(x);
      return isNaN(r) ? 0 : r;
    };

    var _cos = Math.cos;
    Math.cos = function (x) {
      if (!isFinite(x) || isNaN(x)) { scanHit('Math.cos', x); return 1; }
      var r = _cos(x);
      return isNaN(r) ? 1 : r;
    };

    var _tan = Math.tan;
    Math.tan = function (x) {
      if (!isFinite(x) || isNaN(x)) { scanHit('Math.tan', x); return 0; }
      var r = _tan(x);
      return isNaN(r) ? 0 : r;
    };

    // ── log : NaN résultat (log(négatif)) → 0  (log(0)=-Inf est valide) ──
    var _log = Math.log;
    Math.log = function (x) {
      var r = _log(x);
      if (isNaN(r)) { scanHit('Math.log', x); return 0; }
      return r;
    };

    // ── pow : NaN résultat (base négative, exposant non entier) → 0 ───────
    var _pow = Math.pow;
    Math.pow = function (base, exp) {
      var r = _pow(base, exp);
      if (isNaN(r)) { scanHit('Math.pow', base + '^' + exp); return 0; }
      return r;
    };

    log('Patch Math étendu OK', 'ok');
  } catch (e) { log('Patch Math ÉCHEC : ' + e.message, 'warn'); }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. Capture globale des crashes non interceptés
  // ════════════════════════════════════════════════════════════════════════════
  try {
    var _prevOnerror = window.onerror;
    window.onerror = function (msg, src, line, col, err) {
      var short = (src || '').split('/').slice(-1)[0];
      log('[CRASH] ' + msg + ' @ ' + short + ':' + line, 'error');
      if (err && err.stack && _scanMode) {
        err.stack.split('\n').slice(1, 4).forEach(function (l) {
          log('  ' + l.trim(), 'error');
        });
      }
      if (_prevOnerror) return _prevOnerror.apply(this, arguments);
      return false;
    };
    window.addEventListener('unhandledrejection', function (e) {
      var reason = e.reason;
      log('[PROMISE] ' + ((reason && (reason.message || reason)) || '?'), 'error');
    });
    log('Capture crashes OK', 'ok');
  } catch (e) { log('Capture crashes ÉCHEC : ' + e.message, 'warn'); }

  // ════════════════════════════════════════════════════════════════════════════
  // 4. MutationObserver — masquer l'écran d'erreur + reload auto
  //    Anti-boucle : ≥3 reloads en < 15 s → stop
  // ════════════════════════════════════════════════════════════════════════════
  var reloadKey      = 'sr_reload_ts';
  var reloadCountKey = 'sr_reload_n';
  var nowTs          = Date.now();
  var lastTs         = parseInt(sessionStorage.getItem(reloadKey)      || '0');
  var reloadCount    = parseInt(sessionStorage.getItem(reloadCountKey) || '0');

  if (nowTs - lastTs > 15000) {
    reloadCount = 0;
    sessionStorage.setItem(reloadCountKey, '0');
  }

  function handleError(errorEl) {
    var type = (errorEl.querySelector && (errorEl.querySelector('.error-type') || {}).textContent) || '?';
    log('Erreur UI détectée : ' + type, 'warn');

    if (reloadCount >= 3) {
      log('≥3 reloads consécutifs — récupération auto désactivée', 'error');
      return;
    }

    errorEl.style.cssText += ';display:none!important;';
    log('Masqué — reload dans 1.5 s (tentative ' + (reloadCount + 1) + '/3)', 'warn');

    setTimeout(function () {
      sessionStorage.setItem(reloadKey,      String(Date.now()));
      sessionStorage.setItem(reloadCountKey, String(reloadCount + 1));
      location.reload();
    }, 1500);
  }

  function installErrorSuppressor() {
    var seen = new WeakSet();
    var obs  = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var nodes = mutations[i].addedNodes;
        for (var j = 0; j < nodes.length; j++) {
          var node = nodes[j];
          if (node.nodeType !== 1) continue;
          var err = null;
          if (node.classList && node.classList.contains('error')) err = node;
          else if (node.querySelector) err = node.querySelector('.error');
          if (err && !seen.has(err)) { seen.add(err); handleError(err); }
        }
      }
    });
    var root = document.getElementById('main') || document.body || document.documentElement;
    obs.observe(root, { childList: true, subtree: true });
    log('MutationObserver actif', 'ok');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installErrorSuppressor);
  } else {
    installErrorSuppressor();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 5. Lecteur settings localStorage pour popup
  // ════════════════════════════════════════════════════════════════════════════
  window.__sr_readSettings = function () {
    try {
      var vs  = JSON.parse(localStorage.getItem('settings_Vehicle') || '{}');
      var spd = parseFloat(localStorage.getItem('config-vehicle-speed') || '1');
      var tc  = (vs.tuningConfig && vs.tuningConfig._value) ? vs.tuningConfig._value : {};
      return {
        ok:                    true,
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
  };

  log('content.js v5.1 OK', 'ok');
})();
