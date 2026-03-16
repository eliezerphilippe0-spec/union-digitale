# 🛠️ Documentation Dépannage - Union Digitale

## 📚 Guides Disponibles

### 🚨 [Guide de Dépannage Rapide](./QUICK-FIX.md)
**Utilisez ce guide en premier si vous avez un problème !**
- Solutions rapides en 6 étapes
- Checklist avant de coder
- Erreurs communes et solutions
- Scripts npm disponibles

### 🏥 Healthcheck du Projet
```bash
npm run health
```
Diagnostic automatique qui vérifie:
- Versions Node.js et npm
- Fichiers critiques
- Port 5173
- État des caches
- Statut Git

### 📖 Documentation Complète

#### Dans ce projet:
- [QUICK-FIX.md](./QUICK-FIX.md) - Guide de dépannage rapide
- [healthcheck.js](./healthcheck.js) - Script de diagnostic
- [package.json](./package.json) - Scripts npm disponibles
- [src/App.jsx.backup](./src/App.jsx.backup) - Backup de la version complexe

#### Dans la mémoire Claude:
- [TROUBLESHOOTING-GUIDE.md](C:\Users\Philippe\.claude\projects\C--Users-Philippe\memory\TROUBLESHOOTING-GUIDE.md) - Guide complet détaillé
- [MEMORY.md](C:\Users\Philippe\.claude\projects\C--Users-Philippe\memory\MEMORY.md) - Synthèse technique et leçons apprises

## 🚀 Scripts NPM Utiles

### Développement Normal
```bash
npm run dev          # Démarrer le serveur de développement
npm run build        # Build pour production
npm run preview      # Preview du build
```

### Nettoyage et Maintenance
```bash
npm run fresh        # Clean rapide + dev (résout 80% des problèmes)
npm run fresh:full   # Clean complet + réinstall + dev (résout 95%)
npm run clean        # Nettoie juste les caches
npm run clean:full   # Nettoie tout incluant node_modules
npm run kill-port    # Libère le port 5173
```

### Diagnostic
```bash
npm run health       # Healthcheck complet du projet
npm run check        # Alias pour health
```

## 🔧 Résolution Rapide de Problèmes

### Écran Noir
```bash
npm run fresh
```

### Port Occupé
```bash
npm run kill-port
npm run dev
```

### Dépendances Cassées
```bash
npm install --legacy-peer-deps
```

### Cache Corrompu
```bash
npm run fresh:full
```

### Tout est Cassé
1. `git stash save "WIP: backup"`
2. `npm run fresh:full`
3. `git stash pop`
4. Réappliquer changements progressivement

## 📋 Checklist Quotidienne

### Avant de Commencer
- [ ] `git pull` pour mise à jour
- [ ] `npm run health` pour vérifier l'état
- [ ] `npm run dev` démarre sans erreur
- [ ] Page s'affiche correctement

### Pendant le Développement
- [ ] Tester immédiatement après modifications
- [ ] Lire warnings dans console (F12)
- [ ] Commit après chaque feature fonctionnelle

### Fin de Journée
- [ ] `npm run build` réussit
- [ ] Tous changements committés
- [ ] Documentation mise à jour si nécessaire

## 🎯 Bonnes Pratiques

### ✅ À FAIRE
- Utiliser `--legacy-peer-deps` pour npm install
- Backup avant refactor important
- Commits fréquents
- Tester progressivement
- Lire la console régulièrement

### ❌ À ÉVITER
- `npm update` sans vérification
- Modifier ordre des Providers
- Ignorer warnings
- Multiple serveurs simultanés
- Coder sans tester

## 🆘 Support

### Ordre de Consultation
1. **[QUICK-FIX.md](./QUICK-FIX.md)** - Solutions rapides
2. **`npm run health`** - Diagnostic automatique
3. **[TROUBLESHOOTING-GUIDE.md](C:\Users\Philippe\.claude\projects\C--Users-Philippe\memory\TROUBLESHOOTING-GUIDE.md)** - Guide détaillé
4. **[MEMORY.md](C:\Users\Philippe\.claude\projects\C--Users-Philippe\memory\MEMORY.md)** - Leçons apprises

### Fichiers de Sauvegarde
- `src/App.jsx.backup` - Version complexe de App.jsx
- `.git` - Historique Git pour restauration

### Logs
- Console navigateur (F12 → Console)
- Console serveur Vite (où tourne `npm run dev`)
- Logs tasks: `C:\Users\Philippe\AppData\Local\Temp\claude\C--Users-Philippe\tasks\`

## 📊 État du Projet

### Architecture Actuelle
- **React**: 19.2.0
- **Vite**: 7.2.4
- **Node**: v24.11.1
- **npm**: v11.6.3

### Providers Chargés (dans l'ordre)
1. HelmetProvider
2. ErrorBoundary
3. BrowserRouter
4. PerformanceProvider
5. ThemeProvider
6. LanguageProvider
7. AffiliationProvider
8. AuthProvider
9. FavoritesProvider
10. AmbassadorProvider
11. FittingRoomProvider
12. CartProvider
13. WalletProvider
14. ToastProvider

### Services Désactivés
- `salonBookingService` - Stub functions (causait erreurs build)

## 🔗 Liens Utiles

- [Vite Documentation](https://vitejs.dev/)
- [React 19 Documentation](https://react.dev/)
- [React Router v7](https://reactrouter.com/)

---

**Dernière mise à jour**: 2026-02-05
**Testé sur**: Windows, Node v24.11.1, React 19.2.0, Vite 7.2.4

💡 **Conseil**: Gardez ce README ouvert dans un onglet pour accès rapide aux solutions !
