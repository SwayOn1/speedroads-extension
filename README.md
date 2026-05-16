# Speedroads Extension

Extension Chrome pour [slowroads.io](https://slowroads.io) — modifie la vitesse, le grip, la direction et le comportement du véhicule en temps réel, avec patches anti-crash intégrés pour rouler jusqu'à ×1 000 000 sans planter.

---

## Fonctionnalités

### ⚡ Contrôle de vitesse rapide
- Boutons présets : **×1 ×5 ×10 ×50 ×200 ×1000**
- Input custom libre jusqu'à **1 000 000×** (limite réelle du jeu, trouvée dans le source)
- Les boutons +/− s'adaptent : +1 sous ×10, +5 jusqu'à ×100, +50 au-delà
- **Démarrage progressif** : charge la map à ×1 pendant 8 secondes, puis applique la vraie vitesse

### 🎮 Modes présets (un clic)
| Mode | Effet |
|------|-------|
| 🛣 **Normal** | Valeurs d'origine du jeu |
| 🏎 **Grip** | Adhérence maximale, aucun dérapage possible, freinage progressif activé |
| 💨 **Drift** | Pneus glissants, dérapages faciles |
| ✈ **Vol** | Friction quasi nulle, glisse librement sans interaction avec la route |

### ⚙ Paramètres avancés
Tous les paramètres sont modifiables individuellement avec +/− et mise en évidence des valeurs changées :

**Gameplay** (`settings_Gameplay` — appliqués en temps réel après rechargement)

| Paramètre | Clé | Limites | Description |
|-----------|-----|---------|-------------|
| Vitesse | `speedFactor` | 0.001 – 1 000 000 | Multiplicateur de vitesse global |
| Grip global | `gripFactor` | 0.01 – 2 | Multiplicateur grip latéral (max 2 selon jeu) |
| Frein progressif | `softBrakeForce` | 0 – 1 | Freinage auto au relâcher de l'accélérateur |

**Pneus** (`settings_Vehicle.tuningConfig`)

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| Adhérence pneus | 1.6 | ↑ plus de grip, ↓ plus de drift |
| Résistance à la glisse | 0.85 | ↑ récupère vite, ↓ glisse longtemps |
| Rigidité pneus | 1.0 | ↑ pneus nerveux, ↓ pneus mous |
| Stabilité arrière | 0.5 | ↑ moins de dérapage arrière |

**Direction**

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| Rapidité de braquage | 0.75 | ↑ volant nerveux, ↓ volant doux |
| Assistance volant | 0.8 | ↑ aide auto dans les virages |
| Aide contre-braquage | 0 | ↑ corrige les dérapages automatiquement |

**Suspension** (nouveaux paramètres découverts dans le source)

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| Débattement suspension | 0.12 | Distance de compression |
| Dureté ressorts | 3 | Force des amortisseurs |
| Amortissement | 8 | Résistance aux rebonds |

**Poids**

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| Transfert de poids | 0.15 | Effet de caisse dans les virages |
| Masse des roues | 0.2 | Inertie des roues |

### 🔍 Logs & Diagnostic
- Historique complet des événements de l'extension
- **Mode Scan** : détecte et compte les anomalies mathématiques pendant le jeu
- **Rapport scan** : affiche quelles fonctions reçoivent des valeurs NaN/Infinity et combien de fois
- Copie des logs en un clic

---

## Installation

> L'extension n'est pas publiée sur le Chrome Web Store — elle s'installe en mode développeur.

1. **Télécharge** les fichiers :
   - Clone le repo : `git clone https://github.com/SwayOn1/speedroads-extension.git`
   - Ou télécharge le ZIP via **Code → Download ZIP**

2. **Ouvre** Chrome et va sur `chrome://extensions/`

3. **Active** le mode développeur (interrupteur en haut à droite)

4. Clique **Charger l'extension non empaquetée** et sélectionne le dossier téléchargé

5. L'icône apparaît dans la barre d'outils Chrome

---

## Utilisation

1. Ouvre **[slowroads.io](https://slowroads.io)**
2. Clique sur l'icône de l'extension dans Chrome
3. Le popup charge automatiquement tes paramètres actuels

### Appliquer un changement
1. Choisis une vitesse (préset ou valeur custom)
2. Sélectionne un mode ou modifie les paramètres avancés
3. Clique **💾 Appliquer** — le jeu se recharge avec les nouvelles valeurs

### Démarrage progressif (recommandé à haute vitesse)
Pour ×50 et au-delà :
1. Coche ⏱ **Démarrage progressif**
2. Clique **💾 Appliquer**
3. Le jeu charge à ×1 pendant 8 secondes (la map se génère autour du spawn)
4. Il recharge automatiquement à la vitesse cible

### Réinitialiser
- **↺ Défauts** : remet tous les paramètres aux valeurs d'origine et recharge
- **⟳** : relit les valeurs actuelles sans recharger

---

## Comment ça marche

### Stockage des paramètres (découvert par analyse du source v2.4.1)

| Clé localStorage | Paramètres |
|------------------|------------|
| `settings_Gameplay` | `speedFactor`, `gripFactor`, `softBrakeForce`, `steerAssist` |
| `settings_Vehicle` | `steerSpeedFactor`, `tuningConfig._value` (pneus, suspension, poids) |

> **Note :** `config-vehicle-speed` était l'ancienne clé de vitesse — elle a été supprimée dans slowroads.io v2.4.1. La vraie clé est maintenant `settings_Gameplay.speedFactor`.

### Patches anti-crash (content.js)

À haute vitesse, le jeu produit des valeurs `NaN` et `Infinity` dans ses calculs physiques. L'extension intercepte les fonctions mathématiques natives **avant** le code du jeu :

#### Pourquoi `Math.cos(NaN) = 1` (pas 0)
En virage à haute vitesse :
```
vx = Infinity  →  normalize(v) = Inf/Inf = NaN  →  sin(NaN), cos(NaN)
```
Si `cos(NaN) = 0` → matrice de rotation **singulière** (det = 0) → physique gelée, roues invisibles  
Si `cos(NaN) = 1` et `sin(NaN) = 0` → **matrice identité** → véhicule se redresse et continue

| Fonction | Comportement patché |
|----------|---------------------|
| `Math.floor/ceil/round/trunc` | `NaN` ou `±Infinity` → `0` |
| `Math.sqrt` | entrée négative → `0` |
| `Math.asin/acos` | entrée hors `[-1, 1]` → clamp |
| `Math.atan/atan2` | `NaN` → `0` |
| `Math.sin` | `NaN` ou `±Infinity` → `0` |
| `Math.cos` | `NaN` ou `±Infinity` → `1` (identité rotation) |
| `Math.log/pow` | résultat `NaN` → `0` |

#### AudioParam patch
Le moteur audio plante avec `linearRampToValueAtTime(Infinity, t)` à haute vitesse. Les méthodes `AudioParam.prototype` sont patchées pour clamp toutes les valeurs non-finies.

#### Auto-reload avec protection anti-boucle
Si malgré les patches un écran d'erreur s'affiche :
- L'écran est masqué immédiatement
- La page recharge après 1,5 s (les patches sont actifs au rechargement)
- Après 3 rechargements en moins de 15 s : l'auto-reload s'arrête

---

## Structure des fichiers

```
speedroads-extension/
├── manifest.json    — Configuration MV3, permissions, injection content script
├── content.js       — Patches Math/AudioParam, scan mode, settings reader (world: MAIN)
├── popup.html       — Interface (vitesse, modes, paramètres avancés, logs)
├── popup.js         — Logique popup, fonctions page context via executeScript
└── background.js    — Service worker minimal
```

---

## Limitations connues

- **Moto (bike)** : `speedFactor > 1` et `gripFactor` sont intentionnellement bloqués dans le code du jeu (`desc: "Settings above 1 do not apply to the bike"`). Impossible à contourner sans modifier le jeu. Les paramètres tuningConfig (suspension, pneus) fonctionnent normalement.
- **Mode Vol (✈)** : glisse libre, pas une vraie lévitation — impossible sans accès au moteur physique du jeu.
- **Rechargement obligatoire** : les paramètres localStorage ne sont lus qu'au démarrage du jeu.
- **Chrome uniquement** : `chrome.scripting.executeScript` avec `world: "MAIN"` est spécifique à Chrome/Chromium.

---

## Valeurs de référence

### Valeurs par défaut du jeu (v2.4.1)
```
speedFactor: 1 | gripFactor: 1 | softBrakeForce: 0
tyreFriction: 1.6 | kineticFrictionFactor: 0.85 | tyreStiffness: 1.0
rearStability: 0.5 | steerSpeedFactor: 0.75 | steerAssist: 0.8
shockTravel: 0.12 | shockForce: 3 | damping: 8
weightFactor: 0.15 | wheelMassFactor: 0.2
```

### Mode Grip
```
gripFactor: 2 | softBrakeForce: 0.3 | tyreFriction: 4
kineticFrictionFactor: 0.95 | rearStability: 1.0 | steerAssist: 0.95
```

### Mode Drift
```
gripFactor: 0.3 | tyreFriction: 0.5 | kineticFrictionFactor: 0.2
rearStability: 0.05 | steerSpeedFactor: 1.5
```
