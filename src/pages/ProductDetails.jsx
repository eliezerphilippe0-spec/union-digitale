import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, Truck, MapPin, Lock, Download, Check, Shirt, Loader, ThumbsUp } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../contexts/LanguageContext';

import SocialProof from '../components/marketing/SocialProof';
import CrossSell from '../components/product/CrossSell';
import VirtualFittingRoom from '../components/VirtualFittingRoom';
import ReviewSection from '../components/product/ReviewSection';
import SEO from '../components/common/SEO';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/ui/Toast';
import StickyAddToCart from '../components/product/StickyAddToCart';
import UrgencyIndicators, { StockWarning, LiveViewers, RecentSales } from '../components/marketing/UrgencyIndicators';
import ImageZoom from '../components/product/ImageZoom';
// Nouveaux composants inspirés des géants
import FrequentlyBoughtTogether from '../components/product/FrequentlyBoughtTogether';
import ProductVariants from '../components/product/ProductVariants';
import BuyNowButton from '../components/product/BuyNowButton';
import QuestionsAnswers from '../components/product/QuestionsAnswers';
import DeliveryEstimate from '../components/product/DeliveryEstimate';
// Composants spécifiques produits digitaux
import { 
    DigitalProductFeatures, 
    CourseContent, 
    DigitalPreview, 
    InstructorCard, 
    DigitalBuyBox 
} from '../components/digital';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quantity, setQuantity] = useState(1);
    const { products, loading } = useProducts();
    const { t } = useLanguage();
    const { addToCart } = useCart();
    const toast = useToast();
    const [showFittingRoom, setShowFittingRoom] = useState(false);
    const [selectedVariants, setSelectedVariants] = useState({});
    const [showDigitalPreview, setShowDigitalPreview] = useState(false);

    // Check if product is digital
    const isDigitalProduct = product?.type === 'digital';

    // Find product by ID (handle both string and number IDs)
    const product = products.find(p => String(p.id) === String(id));
    const [activeImage, setActiveImage] = useState(0);

    // Related products for bundles (same category, different product)
    const relatedProducts = products
        .filter(p => p.category === product?.category && p.id !== product?.id)
        .slice(0, 4);

    // Handle variant change
    const handleVariantChange = (type, value) => {
        setSelectedVariants(prev => ({ ...prev, [type]: value }));
    };

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

                        {/* Main Image with Zoom - P3 FIX */}
                        <div className="flex-1 relative">
                            <ImageZoom
                                src={(product.images && product.images[activeImage]) || product.image}
                                alt={product.title}
                                placeholder={product.title?.charAt(0) || '📦'}
                                className="min-h-[400px] border border-gray-100"
                            />

                            {product.type === 'digital' && (
                                <div className="absolute top-4 right-4 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1 z-10">
                                    <Download className="w-3 h-3" /> {t('download_label')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Middle Column: Product Info (4 cols) */}
                    <div className="lg:col-span-4">
                        <h1 className="text-2xl font-medium text-gray-900 mb-1">{product.title}</h1>
                        <a href="#" className="text-blue-600 text-sm hover:underline mb-2 block">{t('visit_store')} {product.brand}</a>

                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex text-secondary">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}`} />
                                ))}
                            </div>
                            <span className="text-blue-600 text-sm hover:underline cursor-pointer">{product.reviews} {t('ratings_count')}</span>
                        </div>

                        {/* ⭐ REVIEWS SUMMARY - P3 FIX: Visible immédiatement */}
                        <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl mb-4">
                            <div className="text-center px-3 border-r border-green-200">
                                <div className="text-2xl font-black text-green-700">{product.rating}</div>
                                <div className="flex justify-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'text-gold-500 fill-gold-500' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 text-sm">
                                <div className="flex items-center gap-2 text-green-700 font-semibold">
                                    <ThumbsUp className="w-4 h-4" />
                                    <span>94% recommandent ce produit</span>
                                </div>
                                <p className="text-green-600 text-xs mt-0.5">{product.reviews || 0} avis vérifiés</p>
                            </div>
                        </div>

                        {/* 💰 PRIX - P1 FIX: Plus gros, plus visible */}
                        <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-5 my-4">
                            {/* Prix principal - TRÈS VISIBLE */}
                            <div className="flex items-baseline gap-3 mb-3">
                                <span className="text-4xl md:text-5xl font-black text-gray-900">
                                    {product.price.toLocaleString()}
                                    <span className="text-2xl ml-1">HTG</span>
                                </span>
                                {product.originalPrice && product.originalPrice > product.price && (
                                    <>
                                        <span className="text-xl text-gray-400 line-through">
                                            {product.originalPrice.toLocaleString()} HTG
                                        </span>
                                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                                            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                                        </span>
                                    </>
                                )}
                            </div>
                            
                            {/* Avantages */}
                            <div className="flex flex-wrap gap-3 mb-3">
                                <div className="flex items-center gap-1.5 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
                                    <span className="text-base">💰</span>
                                    <span className="font-semibold">+{Math.floor(product.price * 0.02).toLocaleString()} HTG cashback</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full">
                                    <span className="text-base">⭐</span>
                                    <span className="font-semibold">+{Math.floor(product.price / 100)} points fidélité</span>
                                </div>
                            </div>

                            {product.unionPlus && product.type === 'physical' && (
                                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                    <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-primary-900 px-2 py-0.5 rounded text-xs font-bold">Union Plus</span>
                                    <span className="text-sm text-gray-600">{t('one_day_delivery')}</span>
                                    <span className="text-sm text-green-600 font-bold">{t('free_returns')}</span>
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
                        {/* Digital Product: Special Buy Box */}
                        {isDigitalProduct ? (
                            <DigitalBuyBox product={product} />
                        ) : (
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
                                    className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-primary-900 font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <span>🛒</span>
                                    {t('add_to_cart')}
                                </button>
                                
                                {/* Buy Now - Amazon Style avec confirmation */}
                                <BuyNowButton 
                                    product={product} 
                                    quantity={parseInt(quantity)}
                                    variant="primary"
                                    className="w-full"
                                />
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
                        )}
                    </div>

                    {/* Digital Product Specific Sections */}
                    {isDigitalProduct && (
                        <>
                            {/* Course Content / Table of Contents */}
                            <div className="lg:col-span-8">
                                <CourseContent course={product} />
                            </div>
                            
                            {/* Instructor / Author Card */}
                            <div className="lg:col-span-4">
                                <InstructorCard instructor={product.instructor} />
                            </div>
                            
                            {/* Digital Product Features */}
                            <div className="lg:col-span-12">
                                <DigitalProductFeatures product={product} />
                            </div>
                        </>
                    )}

                    {/* Frequently Bought Together - Amazon Style */}
                    <div className="lg:col-span-12">
                        <FrequentlyBoughtTogether 
                            mainProduct={product} 
                            relatedProducts={relatedProducts}
                        />
                    </div>

                    {/* Delivery Estimate - Only for physical */}
                    {!isDigitalProduct && (
                        <div className="lg:col-span-12">
                            <DeliveryEstimate 
                                department="Ouest"
                                hasUnionPlus={product.unionPlus}
                                productType={product.type}
                            />
                        </div>
                    )}

                    {/* Questions & Answers - Amazon Style */}
                    <div className="lg:col-span-12">
                        <QuestionsAnswers productId={id} />
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

            {/* Digital Preview Modal */}
            {showDigitalPreview && isDigitalProduct && (
                <DigitalPreview
                    product={product}
                    isOpen={showDigitalPreview}
                    onClose={() => setShowDigitalPreview(false)}
                />
            )}

            {/* Sticky Add to Cart for Mobile */}
            <StickyAddToCart product={product} />
        </div>
    );
};

export default ProductDetails;
