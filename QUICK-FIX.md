# 🚨 Guide de Dépannage Rapide - Union Digitale

## Écran Noir ? Suivez ces étapes dans l'ordre :

### 1️⃣ Nettoyage Rapide (30 secondes)
```bash
npm run fresh
```
✅ Résout 80% des problèmes

### 2️⃣ Nettoyage Complet (2 minutes)
```bash
npm run fresh:full
```
✅ Résout 95% des problèmes

### 3️⃣ Processus Zombies (10 secondes)
```bash
npm run kill-port
npm run dev
```
✅ Si le port 5173 reste occupé

### 4️⃣ Nettoyage Manuel
```bash
rd /s /q node_modules\.vite
rd /s /q .vite
rd /s /q dist
taskkill /F /IM node.exe
npm install --legacy-peer-deps
npm run dev
```

### 5️⃣ Restaurer Backup
```bash
# Si App.jsx est cassé
copy src\App.jsx.backup src\App.jsx
npm run dev
```

### 6️⃣ Restaurer depuis Git
```bash
git status
git restore src/App.jsx
# ou
git stash
npm run fresh
```

---

## 📋 Checklist Avant de Coder

- [ ] `git pull` pour mise à jour
- [ ] `npm run dev` démarre sans erreur
- [ ] Page s'affiche (pas d'écran noir)
- [ ] Console navigateur propre (F12)

---

## 🔧 Scripts Disponibles

| Script | Usage | Quand l'utiliser |
|--------|-------|------------------|
| `npm run dev` | Démarrage normal | Développement quotidien |
| `npm run fresh` | Clean + dev | Comportement étrange |
| `npm run fresh:full` | Réinstall complet | Gros problèmes |
| `npm run kill-port` | Tue processus Node | Port occupé |
| `npm run build` | Test production | Avant commit |
| `npm run clean` | Nettoie caches | Cache corrompu |

---

## ⚠️ Erreurs Communes

### "Port 5173 is in use"
```bash
npm run kill-port
npm run dev
```

### "Cannot find module X"
```bash
npm install --legacy-peer-deps
```

### "ERESOLVE unable to resolve dependency tree"
```bash
npm install --legacy-peer-deps
```

### Changements ne s'appliquent pas
```bash
# Vider cache navigateur: Ctrl+Shift+Delete
npm run fresh
```

### Page blanche/noire
```bash
npm run fresh:full
# Si persiste: voir étapes 4-6 ci-dessus
```

---

## 💡 Bonnes Pratiques

### ✅ À FAIRE
- Commit après chaque feature fonctionnelle
- Backup avant refactor important
- Tester immédiatement après modification
- Lire warnings dans console
- Utiliser `--legacy-peer-deps` pour install

### ❌ À ÉVITER
- Modifier ordre des Providers sans raison
- `npm update` (risque de casser)
- Ignorer warnings console
- Coder sans tester régulièrement
- Multiple serveurs dev simultanés

---

## 🆘 En Dernier Recours

Si RIEN ne fonctionne:

1. **Sauvegarder vos modifications**
   ```bash
   git stash save "WIP: ma feature"
   ```

2. **Reset propre**
   ```bash
   git reset --hard HEAD
   npm run fresh:full
   ```

3. **Restaurer modifications**
   ```bash
   git stash pop
   ```

4. **Réappliquer progressivement**
   - Tester après chaque petit changement
   - Identifier quel changement cause le problème

---

## 📞 Ressources

- Guide complet: [TROUBLESHOOTING-GUIDE.md](C:\Users\Philippe\.claude\projects\C--Users-Philippe\memory\TROUBLESHOOTING-GUIDE.md)
- Mémoire technique: [MEMORY.md](C:\Users\Philippe\.claude\projects\C--Users-Philippe\memory\MEMORY.md)
- Backup App.jsx: [src/App.jsx.backup](src/App.jsx.backup)
- Logs serveur: Console où `npm run dev` tourne
- Logs navigateur: F12 → Console

---

## 🎯 Le Plus Important

**Règle d'or**: Si l'application fonctionnait il y a 5 minutes et ne fonctionne plus:
1. `git diff` pour voir ce qui a changé
2. Annuler le dernier changement
3. Tester que ça remarche
4. Réappliquer le changement plus prudemment

---

*Dernière mise à jour: 2026-02-05*
*Testé sur: Windows, Node v24.11.1, React 19.2.0, Vite 7.2.4*
