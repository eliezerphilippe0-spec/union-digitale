export const OFFICIAL_POLICIES = {
    policies: {
        version: "1.0",
        lastUpdate: "2025-01-01",
        market: "Haiti",
        sections: {
            introduction: {
                title: "Objet des Politiques",
                content: "Ces politiques définissent les conditions de retour, remboursement, annulation, obligations des vendeurs et acheteurs, et règles applicables aux produits physiques et digitaux vendus sur Union Digitale."
            },
            physical_products: {
                title: "Retours et Remboursements – Produits Physiques",
                rules: {
                    claimDelay: "14 jours calendaires",
                    eligible: [
                        "Produit non conforme à la description",
                        "Produit défectueux ou endommagé",
                        "Produit incorrect",
                        "Produit incomplet"
                    ],
                    nonEligible: [
                        "Produits personnalisés",
                        "Articles d’hygiène ouverts",
                        "Produits alimentaires",
                        "Articles détériorés par usage"
                    ],
                    returnFees: {
                        sellerFault: "Vendeur",
                        buyerFault: "Client"
                    },
                    condition: "Produit retourné dans son état d’origine avec emballage et accessoires complets."
                }
            },
            digital_products: {
                title: "Produits Digitaux – Politique Spécifique",
                rules: {
                    nonRefundable: true,
                    exceptions: [
                        "Inaccessibilité technique vérifiée",
                        "Fichier corrompu sans solution",
                        "Transaction dupliquée",
                        "Produit non téléchargé"
                    ]
                }
            },
            not_received: {
                title: "Commandes Non Reçues",
                rules: {
                    noProof: "Remboursement intégral obligatoire",
                    sellerLiability: "Responsable si absence de preuve de livraison"
                }
            },
            cancellation: {
                title: "Annulations",
                "rules": {
                    "physical": "Possible avant expédition",
                    "digital": "Possible seulement si aucun accès n’a été consommé"
                }
            },
            refund_methods: {
                title: "Méthodes Officielles de Remboursement",
                methods: [
                    "Carte bancaires (Visa/Mastercard)",
                    "MonCash",
                    "PayPal",
                    "Stripe",
                    "Crédit Boutique / Portefeuille UD"
                ]
            },
            seller_obligations: {
                title: "Obligations des Vendeurs",
                rules: [
                    "Respect du Code de commerce haïtien",
                    "Conformité produit",
                    "Pas de vente d’armes ou stupéfiants",
                    "Répondre sous 48 heures",
                    "Fournir preuves de livraison"
                ]
            },
            buyer_obligations: {
                title: "Obligations des Acheteurs",
                rules: [
                    "Fournir des informations exactes",
                    "Utiliser les produits correctement",
                    "Ne pas abuser du système de remboursement"
                ]
            },
            litigation: {
                "title": "Litiges et Arbitrage",
                "rules": [
                    "Union Digitale agit comme arbitre neutre",
                    "Décision finale exécutoire",
                    "Sanctions en cas de fraude"
                ]
            }
        }
    },
    restricted_categories: {
        version: "1.0",
        rules: [
            "Interdiction de vente d’armes à feu",
            "Interdiction de vente de stupéfiants",
            "Interdiction de vente de substances chimiques dangereuses",
            "Interdiction de vente de médicaments sans licence",
            "Interdiction de vente d’animaux sauvages ou protégés"
        ],
        autoEnforcement: true,
        autoSuspensionOnViolation: true
    },
    compliance_engine: {
        autoCheck: true,
        flags: {
            illegalProduct: "Suspension automatique",
            duplicateProduct: "Avertissement",
            nonResponse: "Blocage du compte après 72h"
        }
    }
};
