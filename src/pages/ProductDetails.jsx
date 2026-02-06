import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, Truck, MapPin, Lock, Download, Check, Shirt, Loader } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../contexts/LanguageContext';

import SocialProof from '../components/SocialProof';
import CrossSell from '../components/CrossSell';
import VirtualFittingRoom from '../components/VirtualFittingRoom';
import ReviewSection from '../components/ReviewSection';
import SEO from '../components/SEO';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/ui/Toast';
import StickyAddToCart from '../components/StickyAddToCart';
import UrgencyIndicators, { StockWarning, LiveViewers, RecentSales } from '../components/UrgencyIndicators';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quantity, setQuantity] = useState(1);
    const { products, loading } = useProducts();
    const { t } = useLanguage();
    const { addToCart } = useCart();
    const toast = useToast();
    const [showFittingRoom, setShowFittingRoom] = useState(false);

    // Find product by ID (handle both string and number IDs)
    const product = products.find(p => String(p.id) === String(id));
    const [activeImage, setActiveImage] = useState(0);

    const handleAddToCart = () => {
        for (let i = 0; i < quantity; i++) {
            addToCart(product);
        }
        if (toast) {
            toast.success(`${quantity}x ${product.title} ajouté au panier !`);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin w-8 h-8 text-secondary" /></div>;

    if (!product) {
        return <div className="p-8 text-center">{t('product_not_found')}</div>;
    }

    return (
        <div className="bg-white min-h-screen py-8">
            <div className="container mx-auto px-4">
                {/* Breadcrumbs */}
                <div className="text-sm text-gray-500 mb-4">
                    {t(product.category) || product.category} &gt; {product.type === 'digital' ? 'Produits Digitaux' : 'Produits Physiques'} &gt; {product.brand}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Image Gallery (5 cols) */}
                    <div className="lg:col-span-5 flex gap-4">
                        {/* Thumbnails */}
                        <div className="flex flex-col gap-2">
                            {(product.images && product.images.length > 0 ? product.images : [product.image]).map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`w-12 h-12 border rounded cursor-pointer flex items-center justify-center bg-gray-100 overflow-hidden ${activeImage === idx ? 'border-secondary shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                                    onMouseEnter={() => setActiveImage(idx)}
                                >
                                    {/* Handle both Emoji mocks and URL images */}
                                    {img && (img.startsWith('http') || img.startsWith('/')) ? (
                                        <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-gray-400">{img || 'Img'}</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Main Image */}
                        <div className="flex-1 bg-gray-50 rounded-lg flex items-center justify-center min-h-[400px] border border-gray-100 relative overflow-hidden">
                            {(() => {
                                const currentImg = (product.images && product.images[activeImage]) || product.image;
                                if (currentImg && (currentImg.startsWith('http') || currentImg.startsWith('/'))) {
                                    return <img src={currentImg} alt={product.title} className="w-full h-full object-contain" />;
                                } else {
                                    return <span className="text-6xl text-gray-200 font-bold">{currentImg}</span>;
                                }
                            })()}

                            {product.type === 'digital' && (
                                <div className="absolute top-4 right-4 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                    <Download className="w-3 h-3" /> {t('download_label')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Middle Column: Product Info (4 cols) */}
                    <div className="lg:col-span-4">
                        <h1 className="text-2xl font-medium text-gray-900 mb-1">{product.title}</h1>
                        <a href="#" className="text-blue-600 text-sm hover:underline mb-2 block">{t('visit_store')} {product.brand}</a>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex text-secondary">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}`} />
                                ))}
                            </div>
                            <span className="text-blue-600 text-sm hover:underline cursor-pointer">{product.reviews} {t('ratings_count')}</span>
                        </div>

                        <div className="border-t border-b border-gray-200 py-4 my-4">
                            <div className="flex items-start gap-2">
                                <span className="text-sm text-gray-500 mt-1">{t('price_label')}</span>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-medium text-red-700">{product.price.toLocaleString()} G</span>
                                    {product.originalPrice && (
                                        <span className="text-sm text-gray-500 line-through">{t('suggested_price')} {product.originalPrice.toLocaleString()} G</span>
                                    )}
                                    <div className="text-sm text-green-600 font-bold mt-1">
                                        {t('cashback_earn')} {Math.floor(product.price * 0.02).toLocaleString()} G {t('cashback_suffix')} (2%)
                                    </div>
                                    <div className="text-sm text-orange-600 font-bold mt-0.5 flex items-center gap-1">
                                        <span className="bg-orange-100 px-1 rounded text-xs">{t('new_label')}</span>
                                        {t('points_earn')} {Math.floor(product.price / 100).toLocaleString()} {t('points_suffix')}
                                    </div>
                                </div>
                            </div>
                            {product.unionPlus && product.type === 'physical' && (
                                <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                                    <span className="bg-[#FFC400] text-primary px-1 rounded-sm text-xs italic font-bold">Union Plus</span>
                                    <span>{t('one_day_delivery')}</span>
                                    <span className="text-green-600 font-bold">{t('free_returns')}</span>
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <h3 className="font-bold mb-2">{t('about_item')}</h3>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                                {product.features.map((feature, idx) => (
                                    <li key={idx}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Buy Box (3 cols) */}
                    <div className="lg:col-span-3">
                        <div className="border border-gray-200 rounded-lg p-4 shadow-sm">
                            <SocialProof />
                            <div className="text-2xl font-medium text-red-700 mb-2">{product.price.toLocaleString()} G</div>

                            {product.type === 'physical' ? (
                                product.unionPlus && (
                                    <div className="mb-4 text-sm">
                                        <div className="flex items-center gap-1 text-blue-600">
                                            <span className="bg-[#FFC400] text-primary px-1 rounded-sm text-xs italic font-bold">Union Plus</span>
                                            <span>{t('one_day_delivery')}</span>
                                        </div>
                                        <div className="text-gray-500 mt-1">
                                            {t('free_delivery')} <span className="font-bold text-gray-900">Demain, 2 Déc.</span>. {t('order_within')} <span className="text-green-600">4 h 30 min</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-blue-600 mt-2 cursor-pointer hover:underline">
                                            <MapPin className="w-4 h-4" />
                                            {t('deliver_to')} Philippe - Paris 75001
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="mb-4 text-sm">
                                    <div className="text-green-700 font-bold mb-1">{t('immediate_download')}</div>
                                    <div className="text-gray-500">{t('available_now')}</div>
                                </div>
                            )}

                            {/* Virtual Fitting Room Button */}
                            {(product.category === 'clothing' || product.category === 'shoes') && product.sizeChart && (
                                <div className="mb-4">
                                    <button
                                        onClick={() => setShowFittingRoom(true)}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all mb-2"
                                    >
                                        <Shirt className="w-5 h-5" />
                                        {t('fr_btn_try_on') || 'Essayer Virtuellement'}
                                    </button>
                                    <div className="text-xs text-center text-gray-500">
                                        <span className="font-semibold text-indigo-600">Nouveau !</span> Trouvez votre taille parfaite avec l'IA
                                    </div>
                                </div>
                            )}

                            {/* Urgency Indicators */}
                            <div className="mb-4 space-y-2">
                                <StockWarning stock={product.stock || 8} />
                                <LiveViewers productId={product.id} />
                                <RecentSales count={product.recentSales || 12} hours={24} />
                            </div>

                            <div className="text-xl text-green-700 font-medium mb-4">{t('in_stock')}</div>

                            <SEO
                                title={product.title}
                                description={product.description}
                                image={product.image} // Note: This assumes image is a URL, but current mock data uses emojis. In real app, this would be product.imageUrl
                            />

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{t('qty')}</span>
                                    <select
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-secondary shadow-sm bg-gray-50"
                                    >
                                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    className="w-full bg-secondary hover:bg-secondary-hover text-white font-medium py-2 rounded-full shadow-sm transition-colors"
                                >
                                    {t('add_to_cart')}
                                </button>
                                <button
                                    onClick={() => navigate('/checkout')}
                                    className="w-full bg-orange-400 hover:bg-orange-500 text-gray-900 font-medium py-2 rounded-full shadow-sm transition-colors"
                                >
                                    {t('buy_now')}
                                </button>
                            </div>

                            <div className="mt-4 text-xs text-gray-500 space-y-1">
                                <div className="flex gap-2">
                                    <span className="w-20 text-gray-400">{t('shipped_by')}</span>
                                    <span>Union Digitale</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="w-20 text-gray-400">{t('sold_by')}</span>
                                    <span className="text-blue-600 hover:underline cursor-pointer">{product.brand}</span>
                                </div>
                                {product.type === 'physical' && (
                                    <div className="flex gap-2">
                                        <span className="w-20 text-gray-400">{t('returns_policy')}</span>
                                        <span className="text-blue-600 hover:underline cursor-pointer">{t('returnable_until')} 31 Jan. 2026</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-600">
                                <Lock className="w-4 h-4" />
                                {t('secure_transaction')}
                            </div>
                        </div>
                    </div>

                    {/* Review Section */}
                    <div className="lg:col-span-12">
                        <ReviewSection productId={id} />
                    </div>

                    {/* Cross Sell Section */}
                    <div className="lg:col-span-12">
                        <CrossSell currentProduct={product} products={products} />
                    </div>
                </div>
            </div>

            {/* Virtual Fitting Room Modal */}
            {showFittingRoom && (
                <VirtualFittingRoom
                    product={product}
                    onClose={() => setShowFittingRoom(false)}
                    onAddToCart={(prod, size) => {
                        addToCart({ ...prod, selectedSize: size });
                        if (toast) {
                            toast.success(`Ajouté au panier - Taille ${size}`);
                        }
                    }}
                />
            )}

            {/* Sticky Add to Cart for Mobile */}
            <StickyAddToCart product={product} />
        </div>
    );
};

export default ProductDetails;
