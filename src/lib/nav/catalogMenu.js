/**
 * Catalog Menu Data Structure - Premium 10/10
 * Data-driven menu configuration for Union Digitale
 * Mobile-first, accessible, conversion-oriented
 */

import {
  TrendingUp,
  Flame,
  Sparkles,
  BarChart3,
  Music,
  BookOpen,
  Smartphone,
  Headphones,
  Gamepad2,
  ShoppingBag,
  Laptop,
  Shirt,
  Home,
  Palette,
  Globe2,
  Store,
  Gift,
  Tag,
  Crown,
  Users,
  Percent,
  HelpCircle,
  Settings,
  Package,
  FileText,
  BadgeCheck,
  Rocket
} from 'lucide-react';

// ============================================
// SECTION 1: DÉCOUVRIR (Always open by default)
// ============================================
export const discoverSection = {
  id: 'discover',
  labelKey: 'menu_discover',
  icon: Sparkles,
  defaultOpen: true,
  children: [
    {
      id: 'best-sellers',
      labelKey: 'best_sellers',
      icon: TrendingUp,
      href: '/best-sellers',
      badge: 'hot'
    },
    {
      id: 'flash-sales',
      labelKey: 'flash_sales',
      icon: Flame,
      href: '/flash-sales',
      badge: 'promo'
    },
    {
      id: 'new-arrivals',
      labelKey: 'new_arrivals',
      icon: Sparkles,
      href: '/new-arrivals',
      badge: 'new'
    },
    {
      id: 'analytics',
      labelKey: 'sales_barometer',
      icon: BarChart3,
      href: '/analytics'
    }
  ]
};

// ============================================
// SECTION 2: CONTENU NUMÉRIQUE
// ============================================
export const digitalSection = {
  id: 'digital',
  labelKey: 'menu_digital_content',
  icon: Headphones,
  children: [
    {
      id: 'music',
      labelKey: 'union_music',
      icon: Music,
      href: '/music'
    },
    {
      id: 'books',
      labelKey: 'union_books',
      icon: BookOpen,
      href: '/books'
    },
    {
      id: 'gaming',
      labelKey: 'union_gaming',
      icon: Gamepad2,
      href: '/gaming'
    },
    {
      id: 'apps',
      labelKey: 'menu_apps_services',
      icon: Smartphone,
      href: '/apps'
    }
  ]
};

// ============================================
// SECTION 3: MAGASINER PAR UNIVERS
// ============================================
export const shopSection = {
  id: 'shop',
  labelKey: 'menu_shop_by_universe',
  icon: ShoppingBag,
  children: [
    {
      id: 'tech',
      labelKey: 'menu_tech_electronics',
      icon: Laptop,
      href: '/category/electronics'
    },
    {
      id: 'fashion',
      labelKey: 'menu_fashion_lifestyle',
      icon: Shirt,
      href: '/category/fashion'
    },
    {
      id: 'home',
      labelKey: 'menu_home_daily',
      icon: Home,
      href: '/category/home'
    },
    {
      id: 'creators',
      labelKey: 'menu_haitian_creators',
      icon: Palette,
      href: '/category/creators'
    },
    {
      id: 'diaspora',
      labelKey: 'menu_diaspora_import',
      icon: Globe2,
      href: '/category/diaspora'
    }
  ]
};

// ============================================
// SECTION 4: PROGRAMMES & FONCTIONNALITÉS
// ============================================
export const programsSection = {
  id: 'programs',
  labelKey: 'menu_programs_features',
  icon: Crown,
  children: [
    {
      id: 'gift-cards',
      labelKey: 'menu_gift_cards',
      icon: Gift,
      href: '/gift-cards'
    },
    {
      id: 'coupons',
      labelKey: 'menu_coupons_promos',
      icon: Tag,
      href: '/deals'
    },
    {
      id: 'loyalty',
      labelKey: 'menu_loyalty_program',
      icon: Users,
      href: '/loyalty'
    },
    {
      id: 'referral',
      labelKey: 'menu_referral',
      icon: Percent,
      href: '/ambassador'
    }
  ]
};

// ============================================
// SECTION 5: AIDE & PARAMÈTRES
// ============================================
export const helpSection = {
  id: 'help',
  labelKey: 'menu_help_settings',
  icon: HelpCircle,
  children: [
    {
      id: 'support',
      labelKey: 'menu_customer_service',
      icon: HelpCircle,
      href: '/help'
    },
    {
      id: 'tracking',
      labelKey: 'menu_order_tracking',
      icon: Package,
      href: '/orders'
    },
    {
      id: 'settings',
      labelKey: 'menu_settings_language',
      icon: Settings,
      href: '/settings'
    },
    {
      id: 'terms',
      labelKey: 'menu_returns_terms',
      icon: FileText,
      href: '/terms'
    }
  ]
};

// ============================================
// CTA VENDEUR (Sticky bottom zone)
// ============================================
export const sellCTA = {
  id: 'sell',
  primaryButton: {
    labelKey: 'menu_sell_on_union',
    labelKeyLoggedIn: 'dashboard_konvesia',
    icon: Store,
    href: '/register?role=seller',
    hrefLoggedIn: '/seller/dashboard'
  },
  secondaryButton: {
    labelKey: 'menu_become_verified_seller',
    icon: BadgeCheck,
    href: '/seller/verification'
  },
  reassurance: {
    labelKey: 'menu_join_verified_sellers',
    icon: Rocket
  }
};

// ============================================
// COMPLETE MENU STRUCTURE
// ============================================
export const catalogMenuData = {
  discover: discoverSection,
  digital: digitalSection,
  shop: shopSection,
  programs: programsSection,
  help: helpSection
};

export const mobileMenuOrder = [
  'discover',
  'digital',
  'shop',
  'programs',
  'help'
];

export const desktopQuickLinks = [
  { labelKey: 'all', href: '#menu', isMenuTrigger: true },
  { labelKey: 'all_catalog', href: '/catalog' },
  { labelKey: 'best_sellers', href: '/best-sellers' },
  { labelKey: 'flash_sales', href: '/flash-sales' },
  { labelKey: 'new_arrivals', href: '/new-arrivals' },
  { labelKey: 'music', href: '/music' },
  { labelKey: 'customer_service', href: '/customer-service' }
];

// Badge configurations - Standardized 10/10
export const badgeConfig = {
  new: {
    labelKey: 'badge_new',
    label: 'Nouveau',
    className: 'bg-emerald-500 text-white'
  },
  hot: {
    labelKey: 'badge_popular',
    label: 'Populaire',
    className: 'bg-orange-500 text-white'
  },
  promo: {
    labelKey: 'badge_promo',
    label: 'Promo',
    className: 'bg-red-500 text-white'
  },
  premium: {
    labelKey: 'badge_premium',
    label: 'Premium',
    className: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black'
  }
};

export default catalogMenuData;
