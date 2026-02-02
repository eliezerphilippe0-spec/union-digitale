# Twilio Serverless WhatsApp Setup Guide

## Prérequis

- Compte Twilio avec WhatsApp activé
- Projet Firebase (union-digitale-26fee)
- Twilio CLI installé ✅

---

## Étape 1 : Configurer Firebase Service Account

### 1.1 Créer Service Account

1. Allez sur https://console.firebase.google.com/project/union-digitale-26fee/settings/serviceaccounts/adminsdk
2. Cliquez sur **"Generate new private key"**
3. Téléchargez le fichier JSON

### 1.2 Extraire les 


Ouvrez le fichier JSON téléchargé et copiez :
- `project_id`
- `client_email`
- `private_key`

---

## Étape 2 : Configurer Variables d'Environnement

### 2.1 Créer `.env`

```bash
cd twilio-serverless
cp .env.example .env
```

### 2.2 Remplir `.env`

```env
FIREBASE_PROJECT_ID=union-digitale-26fee
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@union-digitale-26fee.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Important** : La clé privée doit être entre guillemets avec les `\n` préservés.

---

## Étape 3 : Installer les Dépendances

```bash
cd twilio-serverless
npm install
```

---

## Étape 4 : Tester Localement

```bash
npm start
```

La fonction sera disponible sur : `http://localhost:3000/send-whatsapp`

### Test avec curl

```bash
curl -X POST http://localhost:3000/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+50912345678",
    "template": "test",
    "data": {"message": "Test WhatsApp"},
    "idToken": "YOUR_FIREBASE_ID_TOKEN"
  }'
```

---

## Étape 5 : Login Twilio CLI

```bash
twilio login
```

Suivez les instructions pour vous connecter.

---

## Étape 6 : Déployer sur Twilio

```bash
npm run deploy
```

ou

```bash
twilio serverless:deploy
```

### Récupérer l'URL

Après déploiement, vous obtiendrez une URL comme :
```
https://union-digitale-whatsapp-xxxx-dev.twil.io/send-whatsapp
```

**Copiez cette URL** - vous en aurez besoin pour le frontend.

---

## Étape 7 : Configurer le Frontend

### 7.1 Ajouter l'URL dans `.env`

```env
VITE_TWILIO_FUNCTION_URL=https://union-digitale-whatsapp-xxxx-dev.twil.io/send-whatsapp
```

### 7.2 Le service WhatsApp est déjà configuré

Le fichier `whatsappService.js` sera mis à jour automatiquement pour utiliser cette URL.

---

## Étape 8 : Tester en Production

1. **Ouvrez votre app** : http://localhost:5173
2. **Connectez-vous**
3. **Complétez un achat**
4. **Vérifiez WhatsApp** 📱

### Vérifier les Logs

**Twilio Console** :
- https://console.twilio.com/us1/monitor/logs/debugger

**Firebase Console** :
- https://console.firebase.google.com/project/union-digitale-26fee/firestore/databases/-default-/data/~2Fnotifications

---

## Commandes Utiles

```bash
# Démarrer localement
npm start

# Déployer
npm run deploy

# Voir les logs Twilio
twilio serverless:logs

# Lister les services
twilio serverless:list

# Supprimer le service
twilio serverless:remove
```

---

## Troubleshooting

### Erreur : "Unauthorized: Invalid Firebase token"

- Vérifiez que le token Firebase est valide
- Assurez-vous que les credentials Firebase sont corrects dans `.env`

### Erreur : "Rate limit exceeded"

- Attendez 1 minute
- Maximum 10 messages par minute par utilisateur

### Erreur : "Failed to send WhatsApp"

- Vérifiez le numéro de téléphone (format E.164)
- Assurez-vous que le destinataire a rejoint le sandbox Twilio
- Vérifiez les logs Twilio Console

---

## Coûts

### Twilio Serverless

**Gratuit jusqu'à** :
- 10,000 invocations/mois
- 10,000 secondes d'exécution/mois

### Twilio WhatsApp

- ~$0.01 par message
- 3,000 messages/mois = **~$30/mois**

---

## Sécurité

✅ Authentification Firebase requise  
✅ Rate limiting (10 msg/min)  
✅ CORS configuré  
✅ Credentials sécurisés (variables d'environnement)  
✅ Audit trail Firestore

---

**Status** : ✅ Prêt pour déploiement  
**Temps estimé** : 15-20 minutes
