import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { TrendingUp, Award, BarChart3, ArrowUpRight } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';

const Analytics = () => {
    const { products } = useProducts();

    // Determine Top Products (Mock logic: high rating or reviews)
    const topProducts = products
        .sort((a, b) => b.reviews - a.reviews)
        .slice(0, 4);

    return (
        <MainLayout>
            <div className="bg-gray-50 min-h-screen py-8">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-secondary" />
                            Baromètre des Ventes
                        </h1>
                        <p className="text-gray-600">Les tendances actuelles sur Union Digitale.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-gray-500">Produits en Tendance</h3>
                                <TrendingUp className="text-green-500 w-5 h-5" />
                            </div>
                            <div className="text-3xl font-bold">128</div>
                            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                <ArrowUpRight className="w-3 h-3" /> +12% cette semaine
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-gray-500">Meilleure Catégorie</h3>
                                <Award className="text-secondary w-5 h-5" />
                            </div>
                            <div className="text-3xl font-bold">High-Tech</div>
                            <div className="text-xs text-gray-500 mt-1">Basés sur les volumes de vente</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-gray-500">Nouveautés</h3>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">New</span>
                            </div>
                            <div className="text-3xl font-bold">15</div>
                            <div className="text-xs text-gray-500 mt-1">Ajoutés ces 7 derniers jours</div>
                        </div>
                    </div>

                    {/* Top Selling Products */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-6">Les Incontournables du Moment</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {topProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Analytics;
