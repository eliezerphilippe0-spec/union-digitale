import React from 'react';
import { Plus } from 'lucide-react';
import { products } from '../data/products';
import { useLanguage } from '../contexts/LanguageContext';

const CrossSell = ({ currentProduct, products = [] }) => {
    const { t } = useLanguage();

    // Simple logic: recommend next 2 products
    const recommendations = products
        .filter(p => p.id !== currentProduct.id)
        .slice(0, 2);

    const totalPrice = currentProduct.price + recommendations.reduce((acc, item) => acc + item.price, 0);

    const renderImage = (item) => {
        const img = (item.images && item.images.length > 0) ? item.images[0] : item.image;
        if (img && (img.startsWith('http') || img.startsWith('/'))) {
            return <img src={img} alt={item.title} className="w-full h-full object-cover rounded" />;
        }
        return img;
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 mt-8 bg-white">
            <h3 className="font-bold text-lg mb-4 text-orange-600">{t('frequently_bought_together')}</h3>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-20 h-20 bg-gray-100 flex items-center justify-center text-2xl rounded border overflow-hidden">
                        {renderImage(currentProduct)}
                    </div>
                    {recommendations.map(item => (
                        <React.Fragment key={item.id}>
                            <Plus className="text-gray-400" />
                            <div className="w-20 h-20 bg-gray-100 flex items-center justify-center text-2xl rounded border overflow-hidden">
                                {renderImage(item)}
                            </div>
                        </React.Fragment>
                    ))}
                </div>

                <div className="flex-1 text-sm space-y-1">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked readOnly className="accent-secondary" />
                        <span className="font-bold">{t('this_item')}</span> {currentProduct.title}
                    </div>
                    {recommendations.map(item => (
                        <div key={item.id} className="flex items-center gap-2">
                            <input type="checkbox" checked readOnly className="accent-secondary" />
                            <span className="font-bold text-blue-600 hover:underline cursor-pointer">{item.title}</span>
                            <div className="flex items-center gap-1 ml-1">
                                <span className="text-red-700 font-bold">{item.price.toLocaleString()} G</span>
                                {item.originalPrice && item.originalPrice > item.price && (
                                    <span className="text-xs text-gray-400 line-through">
                                        {item.originalPrice.toLocaleString()} G
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-2 min-w-[150px]">
                    <div className="text-xl font-bold text-red-700">
                        Total : {totalPrice.toLocaleString()} G
                    </div>
                    <button className="w-full bg-secondary hover:bg-secondary-hover text-white text-sm font-bold py-2 px-4 rounded-full shadow-sm transition-colors">
                        {t('add_bundle_to_cart')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CrossSell;
