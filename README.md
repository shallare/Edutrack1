# EduTrack — Refonte UI/UX

Refonte complète du frontend React du projet EduTrack.

## Ce qui change / ne change pas

### Inchangé (zéro impact backend)
- **Toutes les routes** sont identiques : `/admin/login`, `/admin/dashboard`, `/admin/etudiants`, `/admin/enseignant/creer`, `/admin/classe/creer`, `/admin/classe/gerer`, `/admin/matiere/creer`, `/admin/enseignant/assigner`, `/enseignant/login`, `/enseignant/dashboard`, `/enseignant/validation`, `/etudiant/login`, `/etudiant/dashboard`, `/etudiant/noter`, `/etudiant/qrcode`, `/delegue/cahier-texte`, `/delegue/scanner`.
- **Tous les endpoints API** sont appelés à l'identique. Aucune modification dans le backend Laravel n'est nécessaire.
- **Les noms de champs** (`nom_complet`, `mot_de_passe`, `matiere_id`, `qr_data`, etc.) sont préservés.
- **Le stockage localStorage** (`token`, `user`) reste identique.

### Nouveau
- Design system glassmorphism complet (palette navy + or de la présentation PPTX).
- Sidebar fixe + topbar responsive (drawer mobile sous 1024 px).
- Bibliothèque d'icônes SVG inline (zéro dépendance, ~80 icônes).
- **Vrai QR Code scannable** côté étudiant (lib `qrcode.react`).
- **Scanner avec caméra navigateur** côté délégué (lib `html5-qrcode`), avec : auto-scan en continu, debounce 3s, switch caméra avant/arrière, géolocalisation envoyée au scan, fallback saisie manuelle.
- Hook `useAuth` centralisé pour la garde des routes.
- Composants partagés : `Layout`, `StatCard`, `MessageBox`, `LoadingScreen`, `Empty`, `Icon`.

## Installation

### 1. Sauvegarder l'ancien frontend
```bash
cd Edutrack1
mv frontend frontend.old
```

### 2. Déposer la refonte
Décompresser `EduTrack-refonte.zip` dans `Edutrack1/` (le dossier produit `frontend/`).

### 3. Installer les nouvelles dépendances
```bash
cd frontend
npm install
```

Les nouvelles dépendances ajoutées dans `package.json` :
- `qrcode.react` ^4.2.0 — génération du QR côté étudiant
- `html5-qrcode` ^2.3.8 — lecture caméra côté délégué

### 4. Lancer
```bash
# Backend (un autre terminal)
cd Edutrack1/backend
php artisan serve

# Frontend
cd Edutrack1/frontend
npm start
```

## Important : caméra et HTTPS

L'API `getUserMedia` du navigateur **exige** un contexte sécurisé :
- ✅ `http://localhost:3000` — fonctionne (localhost est exempté)
- ✅ `https://...` — fonctionne
- ❌ `http://192.168.x.x:3000` — **ne fonctionne pas** (HTTP non-localhost)

Si vous voulez tester le scanner sur un téléphone connecté au même réseau Wi-Fi que votre PC :

**Option A — tunnel HTTPS via ngrok (le plus simple)**
```bash
npm install -g ngrok
# dans un terminal
npm start
# dans un autre terminal
ngrok http 3000
# Utilisez l'URL https://xxxx.ngrok.io sur votre téléphone
```

**Option B — `react-scripts` en HTTPS local**
Créez `.env.local` à la racine du frontend :
```
HTTPS=true
```
Puis `npm start`. Acceptez le certificat auto-signé sur le téléphone.

**Option C — test sur PC uniquement**
Reste sur `http://localhost:3000` sur votre PC pour tester le scanner avec une webcam.

## Structure des fichiers

```
frontend/
├── package.json          ← mis à jour (qrcode.react, html5-qrcode ajoutés)
├── public/
│   └── index.html        ← titre + meta theme-color mis à jour
└── src/
    ├── App.js            ← routing + nouvelle HomePage
    ├── index.js
    ├── index.css         ← polices + reset
    ├── styles/
    │   └── theme.css     ← système de design (palette, glassmorphism, btn, input, etc.)
    ├── components/
    │   ├── Layout.jsx    ← sidebar + topbar + drawer mobile
    │   ├── Layout.css
    │   ├── Icon.jsx      ← bibliothèque ~80 icônes SVG inline
    │   └── Common.jsx    ← LoadingScreen, MessageBox, useAuth, StatCard, Empty
    ├── utils/
    │   └── menus.js      ← menus partagés par rôle
    ├── services/
    │   └── api.js        ← axios + intercepteur 401
    └── pages/            ← 17 pages refondues
        ├── AdminLogin.jsx
        ├── AdminDashboard.jsx
        ├── EtudiantsList.jsx
        ├── CreerEnseignant.jsx
        ├── CreerClasse.jsx
        ├── CreerMatiere.jsx
        ├── AssignerEnseignant.jsx
        ├── GestionClasse.jsx
        ├── TeacherLogin.jsx
        ├── TeacherDashboard.jsx
        ├── ValidationCours.jsx
        ├── StudentAuth.jsx
        ├── StudentDashboard.jsx
        ├── NoterCours.jsx
        ├── MonQRCode.jsx          ← QR scannable (qrcode.react)
        ├── ScannerPresence.jsx    ← caméra fonctionnelle (html5-qrcode)
        └── CahierTexteForm.jsx
```

## Personnalisation rapide

### Changer la palette
Éditer les variables CSS dans `src/styles/theme.css` (section `:root`) :
- `--bg-deep`, `--bg-base`, `--bg-mid` : tons sombres
- `--accent` : la couleur or (par défaut `#F4B860`)
- `--primary`, `--primary-strong` : tons teal/bleu

### Changer le logo / le nom
Modifier le `Layout.jsx` → bloc `.sidebar-brand`. Et `App.js` → `HomePage` pour la page d'accueil.

### Ajouter une icône
Ajouter une entrée dans le dictionnaire `ICONS` de `src/components/Icon.jsx`. Style Lucide (stroke, viewBox 24x24).

## Compatibilité avec la base de données existante

Le QR Code stocké en base (`utilisateurs.code_qr`) est un JSON du type :
```json
{"id":4,"matricule":"123456789","nom":"DOSSOU-HO Frumence"}
```

Le composant `MonQRCode` rend ce JSON tel quel dans une vraie image QR (via `qrcode.react`). Le composant `ScannerPresence` lit cette image avec la caméra et envoie le JSON brut à `POST /presence/scanner` dans le champ `qr_data` — exactement le format que le backend attend déjà. **Aucune migration de données n'est nécessaire.**

## Backend : géolocalisation (optionnel)

Le scanner envoie maintenant `latitude` et `longitude` dans le payload du scan. Le backend les ignore actuellement (validation uniquement sur `qr_data` et `cours_id`). Pour les enregistrer, ajouter dans `AdminController::scannerPresence` :

```php
DB::table('presences')->insert([
    'cours_id' => $request->cours_id,
    'etudiant_id' => $qrData['id'],
    'statut' => 'present',
    'heure_scan' => now(),
    'scanne_par' => $request->user()->id,
    'latitude' => $request->latitude,    // ← nouveau
    'longitude' => $request->longitude,  // ← nouveau
    'est_valide' => true,
    'created_at' => now(),
    'updated_at' => now()
]);
```

(Les colonnes `latitude` / `longitude` existent déjà dans la table `presences`.)
