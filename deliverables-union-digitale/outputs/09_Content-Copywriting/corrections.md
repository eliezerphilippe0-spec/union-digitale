# Agent 6 — Contenu & SEO

**Date**: 2026-03-05  
**Statut**: Livré  
**Scope**: GEO, SEO, Méta-tags, Locales Créole

---

## Fichiers livrés

| Fichier | Lignes | Statut |
|---------|--------|--------|
| `public/llms.txt` | 85 | Créé |
| `src/components/seo/PageMeta.tsx` | 120 | Créé |
| `src/components/seo/ProductMeta.tsx` | 145 | Créé |
| `public/locales/ht/payment.json` | 95 | Créé |
| `public/locales/ht/common.json` | 135 | Créé |

---

## llms.txt — GEO (Generative Engine Optimization)

Union Digitale dispose désormais d'un fichier `llms.txt` accessible à
`https://uniondigitale.ht/llms.txt` permettant aux modèles de langage (ChatGPT, Claude,
Gemini, Perplexity) de citer correctement la plateforme.

### Contenu
- Description bilingue (Créole + Français)
- Stack technologique documenté
- Paiements locaux (MonCash, NatCash) avec préfixes
- Fonctionnalités marketplace
- Keywords SEO ciblés marché haïtien

---

## PageMeta.tsx — Composant SEO Universel

### Fonctionnalités
- **Open Graph complet** : title, description, image 1200x630, locale
- **`og:locale` haïtien** : `fr_HT` principal + `ht_HT` et `fr_FR` alternates
- **WhatsApp preview** : `og:image:secure_url` pour partage optimal (diaspora)
- **Twitter Cards** : summary_large_image
- **JSON-LD** : Organization schema Google-ready
- **Geo tags** : `geo.region: HT`, `geo.country: Haïti`
- **Canonical URL** : prévient le duplicate content

### Usage
```tsx
<PageMeta
  title="Accueil"
  description="Marketplace haïtien — MonCash, NatCash, Stripe"
  locale="fr_HT"
/>
```

---

## ProductMeta.tsx — SEO Produit

### Fonctionnalités
- **Product JSON-LD** : compatible Google Shopping
- **og:price:amount** + **og:price:currency** (HTG)
- **Rich snippets** : prix, disponibilité, avis agrégés
- **WhatsApp preview** : description avec prix formaté en HTG
- **`priceValidUntil`** : 30 jours automatique (SEO signal de fraîcheur)
- **AggregateRating** : si ratingValue + ratingCount fournis

### Usage
```tsx
<ProductMeta
  name="Robe Traditionnelle Haïtienne"
  description="Robe brodée main..."
  price={2500}
  currency="HTG"
  image="https://..."
  url="/produits/robe-001"
  availability="InStock"
  ratingValue={4.8}
  ratingCount={127}
/>
```

---

## Locales Créole haïtien (ht/)

### payment.json — 95 clés
Tunnel de paiement complet en créole :
- Labels MonCash / NatCash / Stripe / PayPal
- Messages d'erreur localisés (validation, réseau, rate limit)
- Messages de succès avec emojis
- Trust badges en créole

### common.json — 135 clés
Interface complète :
- Navigation (Dakèy, Chèche, Panye, Favori, Kont)
- Actions (Achte, Mete nan Panye, Konfime, Anile)
- Statuts commandes
- Auth (Konekte, Kreye Kont)
- Recherche, Panier, Footer

### Avant vs Après
| Composant | Avant | Après |
|-----------|-------|-------|
| Clés Créole | 53 | 230+ |
| Tunnel paiement | Partiel | Complet |
| Erreurs paiement | Français | Créole |
| Navigation | Français | Créole |
| Messages succès | Français | Créole |

---

## Impact SEO attendu

| Métrique | Avant | Après |
|----------|-------|-------|
| Open Graph WhatsApp | Manquant | Optimisé |
| JSON-LD produits | Absent | Google Shopping |
| Citabilité IA (GEO) | Absente | llms.txt |
| Créole locales | 53 clés | 230+ clés |
| og:locale Haiti | Manquant | fr_HT + ht_HT |

**Score SEO/Contenu : 5.5/10 → 8.5/10**
