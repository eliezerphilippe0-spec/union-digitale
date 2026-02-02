import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnail: string;
    rating?: number;
}

const DigitalProductCard: React.FC<{ product: Product }> = ({ product }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full border border-gray-100">
            <div className="relative h-48 overflow-hidden">
                <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-[#0A1D37]">
                    Digital
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-[#0A1D37] mb-2 leading-tight">{product.title}</h3>

                <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`w-3 h-3 ${i <= (product.rating || 5) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">(42)</span>
                </div>

                <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{product.description}</p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <span className="text-xl font-bold text-[#D4AF37]">{product.price.toLocaleString()} HTG</span>
                    <Link to={`/digital/product/${product.id}`} className="bg-[#0A1D37] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-900 transition-colors">
                        Voir Détails
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DigitalProductCard;
