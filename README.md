# Speedroads Extension

Extension Chrome pour [slowroads.io](https://slowroads.io) — modifie la vitesse, le grip, la direction et le comportement du véhicule en temps réel, avec patches anti-crash intégrés pour rouler jusqu'à ×50 sans planter.

---

## Fonctionnalités

### ⚡ Contrôle de vitesse rapide
- Boutons présets : **×1 ×2 ×5 ×10 ×25 ×50**
- Input custom avec boutons +/−
- **Démarrage progressif** : charge la map à ×1 pendant 8 secondes, puis applique la vraie vitesse — évite les crashes au démarrage à haute vitesse

### 🎮 Modes présets (un clic)
| Mode | Effet |
|------|-------|
| 🛣 **Normal** | Valeurs d'origine du jeu |
| 🏎 **Grip** | Adhérence maximale, aucun dérapage possible |
| 💨 **Drift** | Pneus glissants, dérapages faciles |
| ✈ **Vol** | Friction quasi nulle, le véhicule glisse librement |

### ⚙ Paramètres avancés
Tous les paramètres sont modifiables individuellement avec +/− et mise en évidence des valeurs changées :

| Paramètre | Description |
|-----------|-------------|
| Adhérence route | ↑ plus de grip, ↓ plus de drift |
| Résistance à la glisse | ↑ récupère vite, ↓ glisse longtemps |
| Réactivité des pneus | ↑ pneus nerveux, ↓ pneus mous |
| Stabilité arrière | ↑ moins de dérapage arrière |
| Rapidité de braquage | ↑ volant nerveux, ↓ volant doux |
| Assistance volant | ↑ aide auto dans les virages |
| Aide contre-braquage | ↑ corrige les dérapages automatiquement |
| Différentiel bloqué | 0 = ouvert · 1 = bloqué (hors-route) |

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
1. Choisit une vitesse (préset ou valeur custom)
2. Sélectionne un mode ou modifie les paramètres avancés
3. Clique **💾 Appliquer** — le jeu se recharge avec les nouvelles valeurs

### Démarrage progressif (recommandé à haute vitesse)
Pour les multiplicateurs élevés (×25, ×50) :
1. Coche ⏱ **Démarrage progressif**
2. Clique **💾 Appliquer**
3. Le jeu charge à ×1 pendant 8 secondes (la map se génère autour du spawn)
4. Il recharge automatiquement à la vitesse cible

### Réinitialiser
- **↺ Défauts** : remet tous les paramètres aux valeurs d'origine et recharge
- **⟳** : relit les valeurs actuelles sans recharger

---

## Comment ça marche

### Stockage des paramètres
slowroads.io est une application SvelteKit — toutes les variables du jeu sont dans des modules ES fermés, inaccessibles depuis l'extérieur. L'extension utilise uniquement `localStorage` :

| Clé localStorage | Contenu |
|------------------|---------|
| `config-vehicle-speed` | Multiplicateur de vitesse (float) |
| `settings_Vehicle` | JSON : `steerSpeedFactor`, `tuningConfig._value` (tous les params grip/direction) |

Les paramètres sont lus par le jeu à chaque rechargement de page.

### Patches anti-crash (content.js)

À haute vitesse, le jeu produit des valeurs `NaN` et `Infinity` dans ses calculs physiques, causant des crashes. L'extension intercepte les fonctions mathématiques natives **avant** le code du jeu :

#### Pourquoi `Math.cos(NaN) = 1` (pas 0)
En virage à haute vitesse :
```
vx = Infinity  →  normalize(v) = Inf/Inf = NaN  →  sin(NaN), cos(NaN)
```
Si `cos(NaN) = 0` → matrice de rotation **singulière** (déterminant = 0) → physique gelée, roues invisibles  
Si `cos(NaN) = 1` et `sin(NaN) = 0` → **matrice identité** → véhicule se redresse et continue

| Fonction | Comportement patché |
|----------|---------------------|
| `Math.floor/ceil/round/trunc` | `NaN` ou `±Infinity` → `0` |
| `Math.sqrt` | entrée négative → `0` |
| `Math.asin/acos` | entrée hors `[-1, 1]` → clamp (calculs d'angle de glissement pneu) |
| `Math.atan/atan2` | `NaN` → `0` |
| `Math.sin` | `NaN` ou `±Infinity` → `0` |
| `Math.cos` | `NaN` ou `±Infinity` → `1` (identité rotation) |
| `Math.log` | résultat `NaN` → `0` |
| `Math.pow` | résultat `NaN` → `0` |

#### AudioParam patch
Le moteur audio plante avec `linearRampToValueAtTime(Infinity, t)` à haute vitesse. Les méthodes `AudioParam.prototype` sont patchées pour clamp toutes les valeurs non-finies.

#### Auto-reload avec protection anti-boucle
Si malgré les patches un écran d'erreur s'affiche :
- L'écran est masqué immédiatement
- La page recharge après 1,5 s (les patches sont actifs au rechargement)
- Après 3 rechargements en moins de 15 s : l'auto-reload s'arrête (l'utilisateur doit baisser la vitesse)

---

## Structure des fichiers

```
speedroads-extension/
├── manifest.json    — Configuration MV3, permissions, injection content script
├── content.js       — Patches Math/AudioParam, scan mode, settings reader (world: MAIN)
├── popup.html       — Interface utilisateur (vitesse, modes, paramètres avancés, logs)
├── popup.js         — Logique popup, fonctions page context via executeScript
└── background.js    — Service worker minimal
```

---

## Limitations connues

- **×50 reste instable** : à très haute vitesse, les chunks de terrain ne se génèrent pas assez vite. Les patches Math empêchent la plupart des crashes mais des glitches visuels peuvent subsister.
- **Mode Vol (✈)** : ce n'est pas un vrai mode lévitation — il réduit la friction à quasi-zéro pour un sentiment de glisse libre. Une vraie physique de vol nécessiterait l'accès au code source du jeu.
- **Rechargement obligatoire** : les paramètres localStorage ne sont lus qu'à l'initialisation du jeu, donc tout changement nécessite un rechargement de page.
- **Chrome uniquement** : l'API `chrome.scripting.executeScript` avec `world: "MAIN"` est spécifique à Chrome/Chromium.

---

## Valeurs de référence

### Mode Grip (anti-dérapage total)
```
tyreFriction: 3.5 | kineticFrictionFactor: 0.95 | tyreStiffness: 1.8
rearStability: 1.0 | steerAssist: 0.95 | counterSteerAssist: 0.6
```

### Mode Drift
```
tyreFriction: 0.6 | kineticFrictionFactor: 0.25 | tyreStiffness: 0.6
rearStability: 0.05 | steerSpeedFactor: 1.5 | steerAssist: 0.1
```

### Valeurs par défaut du jeu
```
tyreFriction: 1.6 | kineticFrictionFactor: 0.85 | tyreStiffness: 1.0
rearStability: 0.5 | steerSpeedFactor: 0.75 | steerAssist: 0.8
```
