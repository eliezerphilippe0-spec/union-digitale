import React from 'react';
import { Plus } from 'lucide-react';
import { products } from '../../data/products';
import { useLanguage } from '../../contexts/LanguageContext';

const CrossSell = ({ currentProduct, products = [] }) => {
    const { t } = useLanguage();

    // Simple logic: recommend next 2 products
    const recommendations = products
        .filter(p => p.id !== currentProduct.id)
        .slice(0, 2);

    const totalPrice = currentProduct.price + recommendations.reduce((acc, item) => acc + item.price, 0);
    const bundleDiscount = 0.05; // 5% discount
    const discountedPrice = Math.floor(totalPrice * (1 - bundleDiscount));

    const renderImage = (item) => {
        const img = (item.images && item.images.length > 0) ? item.images[0] : item.image;
        if (img && (img.startsWith('http') || img.startsWith('/'))) {
            return <img src={img} alt={item.title} className="w-full h-full object-cover rounded shadow-sm" />;
        }
        return <span className="text-xl">{img}</span>;
    };

    return (
        <div className="border border-indigo-100 rounded-2xl p-6 mt-12 bg-gradient-to-br from-white to-indigo-50/30 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-tighter">
                Offre Bundle : -5%
            </div>

            <h3 className="font-bold text-lg mb-6 text-indigo-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                {t('frequently_bought_together') || 'Fréquemment achetés ensemble'}
            </h3>

            <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex items-center gap-3">
                    <div className="w-24 h-24 bg-white flex items-center justify-center rounded-xl border border-indigo-100 shadow-sm overflow-hidden transform hover:scale-105 transition-transform">
                        {renderImage(currentProduct)}
                    </div>
                    {recommendations.map(item => (
                        <React.Fragment key={item.id}>
                            <Plus className="text-indigo-300 w-5 h-5" />
                            <div className="w-24 h-24 bg-white flex items-center justify-center rounded-xl border border-indigo-100 shadow-sm overflow-hidden transform hover:scale-105 transition-transform">
                                {renderImage(item)}
                            </div>
                        </React.Fragment>
                    ))}
                </div>

                <div className="flex-1 text-sm space-y-3">
                    <div className="flex items-start gap-2">
                        <input type="checkbox" checked readOnly className="mt-1 accent-indigo-600 w-4 h-4" />
                        <span className="text-gray-600"><span className="font-bold text-indigo-900">{t('this_item') || 'Cet article'} :</span> {currentProduct.title}</span>
                    </div>
                    {recommendations.map(item => (
                        <div key={item.id} className="flex items-start gap-2">
                            <input type="checkbox" checked readOnly className="mt-1 accent-indigo-600 w-4 h-4" />
                            <div className="flex-1">
                                <span className="font-medium text-gray-800">{item.title}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-indigo-600 font-bold">{item.price.toLocaleString()} G</span>
                                    {item.originalPrice && (
                                        <span className="text-[10px] text-gray-400 line-through">
                                            {item.originalPrice.toLocaleString()} G
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-indigo-100 shadow-sm min-w-[200px]">
                    <div className="text-xs text-gray-500 line-through mb-1">
                        Total : {totalPrice.toLocaleString()} G
                    </div>
                    <div className="text-2xl font-black text-indigo-600 mb-1">
                        {discountedPrice.toLocaleString()} G
                    </div>
                    <div className="text-[10px] text-green-600 font-bold mb-4 bg-green-50 px-2 py-0.5 rounded-full uppercase">
                        Économisez {(totalPrice - discountedPrice).toLocaleString()} G
                    </div>
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-6 rounded-full shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 active:translate-y-0">
                        {t('add_bundle_to_cart') || 'Ajouter le pack au panier'}
                    </button>
                    <p className="text-[9px] text-gray-400 mt-2 text-center italic">
                        *Remise appliquée automatiquement pour le pack
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CrossSell;
