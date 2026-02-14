import React, { useState } from 'react';
import SEO from '../components/common/SEO';
import { 
  Grid, ShoppingBag, Truck, DollarSign, BarChart2, 
  MessageSquare, Share2, Camera, Star, Download,
  Check, Search, Filter
} from 'lucide-react';

const apps = [
  {
    id: 'analytics-pro',
    name: 'Analytics Pro',
    description: 'Tableaux de bord avancés, prédictions IA, rapports automatisés',
    icon: BarChart2,
    category: 'analytics',
    price: 'Gratuit',
    rating: 4.8,
    installs: '2.3k',
    installed: false,
    featured: true
  },
  {
    id: 'multi-shipping',
    name: 'Multi-Transporteurs',
    description: 'Connectez DHL, FedEx, UPS et comparez les tarifs en temps réel',
    icon: Truck,
    category: 'shipping',
    price: '€9.99/mois',
    rating: 4.6,
    installs: '1.8k',
    installed: true
  },
  {
    id: 'social-commerce',
    name: 'Social Commerce',
    description: 'Vendez directement sur Instagram, TikTok et Facebook',
    icon: Share2,
    category: 'marketing',
    price: '€14.99/mois',
    rating: 4.7,
    installs: '3.1k',
    installed: false,
    featured: true
  },
  {
    id: 'chat-support',
    name: 'Chat Support AI',
    description: 'Chatbot intelligent pour répondre aux clients 24/7',
    icon: MessageSquare,
    category: 'support',
    price: '€19.99/mois',
    rating: 4.5,
    installs: '980',
    installed: false
  },
  {
    id: 'product-photos',
    name: 'Photo Studio',
    description: 'Suppression de fond automatique, retouches IA pour vos produits',
    icon: Camera,
    category: 'tools',
    price: 'Gratuit',
    rating: 4.9,
    installs: '5.2k',
    installed: true
  },
  {
    id: 'inventory-sync',
    name: 'Sync Inventaire',
    description: 'Synchronisez votre stock avec Shopify, WooCommerce, Amazon',
    icon: Grid,
    category: 'inventory',
    price: '€24.99/mois',
    rating: 4.4,
    installs: '670',
    installed: false
  },
  {
    id: 'payment-flex',
    name: 'Paiements Flex',
    description: 'Ajoutez Orange Money, Wave, MTN Mobile Money',
    icon: DollarSign,
    category: 'payments',
    price: 'Gratuit',
    rating: 4.8,
    installs: '4.5k',
    installed: true,
    featured: true
  },
  {
    id: 'loyalty-plus',
    name: 'Fidélité+',
    description: 'Programme de fidélité avancé avec parrainage et récompenses',
    icon: Star,
    category: 'marketing',
    price: '€12.99/mois',
    rating: 4.6,
    installs: '1.2k',
    installed: false
  }
];

const categories = [
  { id: 'all', name: 'Tout', icon: Grid },
  { id: 'marketing', name: 'Marketing', icon: Share2 },
  { id: 'shipping', name: 'Livraison', icon: Truck },
  { id: 'payments', name: 'Paiements', icon: DollarSign },
  { id: 'analytics', name: 'Analytics', icon: BarChart2 },
  { id: 'support', name: 'Support', icon: MessageSquare },
  { id: 'tools', name: 'Outils', icon: Camera }
];

export default function AppStore() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [installedApps, setInstalledApps] = useState(
    apps.filter(a => a.installed).map(a => a.id)
  );

  const filteredApps = apps.filter(app => {
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredApps = apps.filter(a => a.featured);

  const handleInstall = (appId) => {
    if (installedApps.includes(appId)) {
      setInstalledApps(prev => prev.filter(id => id !== appId));
    } else {
      setInstalledApps(prev => [...prev, appId]);
    }
  };

  return (
    <>
      <SEO title="App Store" description="Extensions et apps pour vendeurs: analytics, shipping, marketing et plus." />
      <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">App Store</h1>
        <p className="text-primary-100 text-sm">
          Étendez les capacités de votre boutique
        </p>
        
        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une application..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-4 overflow-x-auto">
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border'
              }`}
            >
              <cat.icon size={16} />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Section */}
      {selectedCategory === 'all' && !searchQuery && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">⭐ Applications vedettes</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {featuredApps.map(app => (
              <div 
                key={app.id}
                className="flex-shrink-0 w-64 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-4 text-white"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <app.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{app.name}</h3>
                    <p className="text-xs text-primary-100">{app.price}</p>
                  </div>
                </div>
                <p className="text-sm text-primary-100 line-clamp-2">{app.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apps Grid */}
      <div className="px-4">
        <h2 className="text-lg font-semibold mb-3">
          {selectedCategory === 'all' ? 'Toutes les applications' : categories.find(c => c.id === selectedCategory)?.name}
        </h2>
        
        <div className="space-y-3">
          {filteredApps.map(app => {
            const isInstalled = installedApps.includes(app.id);
            return (
              <div 
                key={app.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <app.icon size={24} className="text-primary-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{app.name}</h3>
                      <span className="text-sm text-primary-600 font-medium">{app.price}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{app.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="text-yellow-500" fill="currentColor" />
                          {app.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download />
                          {app.installs}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleInstall(app.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          isInstalled
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-primary-600 text-white'
                        }`}
                      >
                        {isInstalled ? (
                          <span className="flex items-center gap-1">
                            <Check size={14} />
                            Installé
                          </span>
                        ) : (
                          'Installer'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Grid size={48} className="mx-auto mb-3 opacity-50" />
            <p>Aucune application trouvée</p>
          </div>
        )}
      </div>

      {/* My Apps Section */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-semibold mb-3">Mes applications ({installedApps.length})</h2>
        <div className="grid grid-cols-4 gap-4">
          {apps.filter(a => installedApps.includes(a.id)).map(app => (
            <div key={app.id} className="text-center">
              <div className="w-14 h-14 mx-auto bg-primary-50 rounded-xl flex items-center justify-center mb-1">
                <app.icon size={24} className="text-primary-600" />
              </div>
              <p className="text-xs text-gray-600 truncate">{app.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
