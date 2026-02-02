import {
    Banknote, Plane, ShoppingBag, Smartphone, Crown,
    Send, Zap, Lightbulb, Droplets, Home, Car,
    CreditCard, Wallet, Gift, Package, BookOpen
} from 'lucide-react';

/**
 * Services Data Structure - Union Digitale Super-App
 * Organized by categories with unique visual identity
 */

export const serviceCategories = [
    {
        id: 'financial',
        name: 'Services Financiers',
        nameKey: 'financial_services',
        icon: Banknote,
        gradient: 'from-gold-500 to-amber-600',
        description: 'Gérez votre argent en toute simplicité',
        descriptionKey: 'financial_desc',
        color: 'gold'
    },
    {
        id: 'travel',
        name: 'Voyage & Mobilité',
        nameKey: 'travel_services',
        icon: Plane,
        gradient: 'from-sky-500 to-blue-600',
        description: 'Voyagez sans souci',
        descriptionKey: 'travel_desc',
        color: 'blue'
    },
    {
        id: 'shopping',
        name: 'Shopping',
        nameKey: 'shopping_services',
        icon: ShoppingBag,
        gradient: 'from-purple-500 to-pink-600',
        description: 'Tout ce dont vous avez besoin',
        descriptionKey: 'shopping_desc',
        color: 'purple'
    },
    {
        id: 'telecoms',
        name: 'Télécoms',
        nameKey: 'telecoms_services',
        icon: Smartphone,
        gradient: 'from-cyan-500 to-teal-600',
        description: 'Restez connecté',
        descriptionKey: 'telecoms_desc',
        color: 'cyan'
    },
    {
        id: 'premium',
        name: 'Services Premium',
        nameKey: 'premium_services',
        icon: Crown,
        gradient: 'from-gold-400 via-amber-500 to-orange-600',
        description: 'Expérience VIP',
        descriptionKey: 'premium_desc',
        color: 'gold'
    }
];

export const services = [
    // Financial Services
    {
        id: 'money-transfer',
        name: 'Transfert d\'Argent',
        nameKey: 'money_transfer',
        description: 'Envoyez et recevez de l\'argent instantanément',
        descriptionKey: 'money_transfer_desc',
        icon: Send,
        category: 'financial',
        featured: true,
        badge: 'Populaire',
        quickAction: true
    },
    {
        id: 'moncash-recharge',
        name: 'Recharge MonCash',
        nameKey: 'moncash_recharge',
        description: 'Rechargez votre compte MonCash en quelques secondes',
        descriptionKey: 'moncash_desc',
        icon: Wallet,
        category: 'financial',
        featured: true,
        quickAction: true
    },
    {
        id: 'natcash-recharge',
        name: 'Recharge Natcash',
        nameKey: 'natcash_recharge',
        description: 'Top-up Natcash instantané',
        descriptionKey: 'natcash_desc',
        icon: CreditCard,
        category: 'financial',
        quickAction: true
    },
    {
        id: 'electricity-payment',
        name: 'Paiement EDH',
        nameKey: 'electricity_payment',
        description: 'Payez votre facture d\'électricité en ligne',
        descriptionKey: 'electricity_desc',
        icon: Zap,
        category: 'financial',
        featured: true,
        quickAction: true
    },
    {
        id: 'water-payment',
        name: 'Paiement CAMEP',
        nameKey: 'water_payment',
        description: 'Factures d\'eau simplifiées',
        descriptionKey: 'water_desc',
        icon: Droplets,
        category: 'financial',
        quickAction: true
    },
    {
        id: 'bills-payment',
        name: 'Paiement de Factures',
        nameKey: 'bills_payment',
        description: 'Téléphone, internet et plus',
        descriptionKey: 'bills_desc',
        icon: Lightbulb,
        category: 'financial'
    },

    // Travel Services
    {
        id: 'flight-tickets',
        name: 'Billets d\'Avion',
        nameKey: 'flight_tickets',
        description: 'Vols nationaux et internationaux',
        descriptionKey: 'flight_desc',
        icon: Plane,
        category: 'travel',
        featured: true,
        badge: 'Nouveau'
    },
    {
        id: 'car-rental',
        name: 'Location de Voiture',
        nameKey: 'car_rental',
        description: 'Flotte variée, prix compétitifs',
        descriptionKey: 'car_desc',
        icon: Car,
        category: 'travel',
        featured: true
    },
    {
        id: 'accommodation',
        name: 'Hébergement',
        nameKey: 'accommodation',
        description: 'Hôtels, Airbnb et plus',
        descriptionKey: 'accommodation_desc',
        icon: Home,
        category: 'travel'
    },

    // Shopping Services
    {
        id: 'marketplace',
        name: 'Marketplace',
        nameKey: 'marketplace',
        description: '10,000+ produits disponibles',
        descriptionKey: 'marketplace_desc',
        icon: ShoppingBag,
        category: 'shopping',
        featured: true
    },
    {
        id: 'digital-products',
        name: 'Produits Digitaux',
        nameKey: 'digital_products',
        description: 'Ebooks, formations, logiciels',
        descriptionKey: 'digital_desc',
        icon: BookOpen,
        category: 'shopping',
        badge: 'Nouveau'
    },
    {
        id: 'deals',
        name: 'Deals du Jour',
        nameKey: 'daily_deals',
        description: 'Offres exclusives quotidiennes',
        descriptionKey: 'deals_desc',
        icon: Gift,
        category: 'shopping',
        featured: true
    },

    // Telecoms Services
    {
        id: 'digicel-recharge',
        name: 'Recharge Digicel',
        nameKey: 'digicel_recharge',
        description: 'Crédit téléphonique instantané',
        descriptionKey: 'digicel_desc',
        icon: Smartphone,
        category: 'telecoms',
        featured: true,
        quickAction: true
    },
    {
        id: 'natcom-recharge',
        name: 'Recharge Natcom',
        nameKey: 'natcom_recharge',
        description: 'Top-up Natcom rapide',
        descriptionKey: 'natcom_desc',
        icon: Smartphone,
        category: 'telecoms',
        quickAction: true
    },

    // Premium Services
    {
        id: 'union-plus',
        name: 'Union Plus',
        nameKey: 'union_plus',
        description: 'Livraison 1 jour, offres VIP',
        descriptionKey: 'union_plus_desc',
        icon: Crown,
        category: 'premium',
        featured: true,
        badge: 'Premium'
    },
    {
        id: 'concierge',
        name: 'Conciergerie',
        nameKey: 'concierge',
        description: 'Service personnalisé 24/7',
        descriptionKey: 'concierge_desc',
        icon: Crown,
        category: 'premium',
        badge: 'VIP'
    }
];

// Service Bundles
export const serviceBundles = [
    {
        id: 'traveler',
        name: 'Pack Voyageur',
        nameKey: 'traveler_bundle',
        description: 'Billet + Voiture + Hôtel',
        descriptionKey: 'traveler_desc',
        services: ['flight-tickets', 'car-rental', 'accommodation'],
        discount: 15,
        icon: Plane,
        gradient: 'from-sky-500 to-blue-600'
    },
    {
        id: 'student',
        name: 'Pack Étudiant',
        nameKey: 'student_bundle',
        description: 'Recharge + Internet + Livres',
        descriptionKey: 'student_desc',
        services: ['digicel-recharge', 'bills-payment', 'digital-products'],
        discount: 10,
        icon: BookOpen,
        gradient: 'from-purple-500 to-pink-600'
    },
    {
        id: 'family',
        name: 'Pack Famille',
        nameKey: 'family_bundle',
        description: 'EDH + CAMEP + Shopping',
        descriptionKey: 'family_desc',
        services: ['electricity-payment', 'water-payment', 'marketplace'],
        discount: 12,
        icon: Home,
        gradient: 'from-emerald-500 to-teal-600'
    }
];

// Quick Actions (most used services)
export const quickActions = services.filter(s => s.quickAction);

// Featured Services
export const featuredServices = services.filter(s => s.featured);

// Get services by category
export const getServicesByCategory = (categoryId) => {
    return services.filter(s => s.category === categoryId);
};

// Get category by ID
export const getCategoryById = (categoryId) => {
    return serviceCategories.find(c => c.id === categoryId);
};

export default services;
