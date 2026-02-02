   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   ...
   ```

## 4. Seed Initial Data
1. Run the seed script to import existing products into Firestore:
   ```bash
   node seed_firestore.js
   ```
2. Check your Firestore console to see the `products` collection.

## 5. Restart Application
1. Run `npm run dev`.
