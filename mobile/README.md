# SMG Flow Mobile - Application Smartphone & PWA

Projet mobile autonome pour **SMG Flow**, optimisé pour l'utilisation tactile sur smartphone, compatible avec **Capacitor (Android APK / iOS)** et installable en **Progressive Web App (PWA)**.

---

## 📱 Fonctionnalités Mobiles

- **Interface Native-Like** : Navigation par onglets tactiles en bas d'écran (style iOS / WhatsApp Business).
- **Passerelle WhatsApp Mobile** : Visualisation et scan instantané du QR Code Baileys depuis un autre téléphone ou affichage pour scan.
- **Simulateur de Chat IA Mobile** : Discussion en direct avec votre agent Gemini pour tester vos réponses en conditions réelles.
- **Portefeuille Mobile UEMOA** : Recharges de crédits en Francs CFA via Wave, Orange Money, Free Money et PayDunya.
- **Mode Pilote Automatique** : Activation/désactivation en 1 geste et réglage de la latence de frappe humaine.

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Lancement en mode développement
```bash
npm run dev
```
L'application démarre sur `http://localhost:3001`.

### 3. Compilation pour la production
```bash
npm run build
```
Les fichiers statiques optimisés sont générés dans le dossier `dist/`.

---

## 🤖 Génération d'une Application Android (APK) avec Capacitor

Ce projet est déjà pré-configuré avec `capacitor.config.json` (`pro.smgflow.mobile`).

Pour générer un APK Android :

1. Compilez le projet web :
   ```bash
   npm run build
   ```

2. Initialisez la plateforme Android :
   ```bash
   npx cap add android
   ```

3. Synchronisez le code avec Android :
   ```bash
   npx cap sync
   ```

4. Ouvrez le projet dans **Android Studio** :
   ```bash
   npx cap open android
   ```
   Dans Android Studio, cliquez simplement sur **Build > Build Bundle(s) / APK(s) > Build APK(s)** pour obtenir votre fichier `.apk` installable sur n'importe quel smartphone Android !

---

## 🍎 Génération d'une Application iOS (iPhone)

1. Compilez le projet web :
   ```bash
   npm run build
   ```

2. Ajoutez la plateforme iOS (sur macOS) :
   ```bash
   npx cap add ios
   npx cap sync
   npx cap open ios
   ```

3. Lancez dans Xcode pour tester sur simulateur ou sur votre iPhone.

---

## 🌐 Installation en PWA (sans passer par les Stores)

- **Sur iPhone (Safari) :**
  1. Ouvrez l'URL de votre application sur Safari.
  2. Touchez l'icône **Partager** (le carré avec une flèche vers le haut).
  3. Sélectionnez **« Sur l'écran d'accueil »**.

- **Sur Android (Chrome) :**
  1. Ouvrez l'URL sur Chrome.
  2. Touchez les **3 points verticaux**.
  3. Sélectionnez **« Installer l'application »** ou **« Ajouter à l'écran d'accueil »**.
