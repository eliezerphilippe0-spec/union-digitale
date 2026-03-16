import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, ShieldCheck, Truck, MapPin, Lock, Download, Check, Shirt, Ruler, AlertCircle, Plus, X } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../contexts/LanguageContext';

import SocialProof from '../components/SocialProof';
import CrossSell from '../components/CrossSell';
import VirtualFittingRoom from '../components/VirtualFittingRoom';
import ReviewSection from '../components/ReviewSection';
import { Loader } from 'lucide-react';
import SEO from '../components/SEO';
import ProductSchema from '../components/ProductSchema';
import { useCart } from '../contexts/CartContext';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [recommendedSize, setRecommendedSize] = useState(null);
    const { products, loading } = useProducts();
    const { t } = useLanguage();
    const { addToCart } = useCart();
    const [showFittingRoom, setShowFittingRoom] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [openLesson, setOpenLesson] = useState(null);

    // Find product by ID (handle both string and number IDs)
    const product = products.find(p => String(p.id) === String(id));
    const [activeImage, setActiveImage] = useState(0);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin w-8 h-8 text-secondary" /></div>;

    if (!product) {
        return <div className="p-8 text-center">{t('product_not_found')}</div>;
    }

    return (
        <div className="bg-white min-h-screen py-8">
            <div className="container mx-auto px-4">
                <SEO
                    title={product.title}
                    description={product.description}
                    image={(product.images && product.images[0]) || product.image}
                    type="product"
                />
                <ProductSchema product={product} productId={id} />

                {/* Breadcrumbs */}
                <nav aria-label="Fil d'Ariane" className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                    <Link to="/" className="hover:underline hover:text-gray-700">Accueil</Link>
                    <span>&gt;</span>
                    <Link to={`/category/${product.category}`} className="hover:underline hover:text-gray-700">{t(product.category) || product.category}</Link>
                    <span>&gt;</span>
                    <span className="text-gray-900 font-medium truncate max-w-xs">{product.title}</span>
                </nav>

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
                                        <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" loading="lazy" />
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
                                    return <img src={currentImg} alt={product.title} className="w-full h-full object-contain" loading="eager" />;
                                } else {
                                    return <span className="text-6xl text-gray-200 font-bold">{currentImg}</span>;
                                }
                            })()}

                            {product.type === 'digital' && (
                                <button
                                    onClick={() => setShowTrailer(true)}
                                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors group"
                                >
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                        <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-indigo-600 border-b-[10px] border-b-transparent ml-1"></div>
                                    </div>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-indigo-700 shadow-sm flex items-center gap-1">
                                        Voir l'aperçu gratuit
                                    </div>
                                </button>
                            )}

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
                            {product.type === 'digital' && (
                                <span className="text-gray-500 text-sm">• 1,245 {t('students_joined') || 'étudiants'}</span>
                            )}
                        </div>

                        <div className="border-t border-b border-gray-200 py-4 my-4">
                            <div className="flex items-start gap-2">
                                <span className="text-sm text-gray-500 mt-1">{t('price_label')}</span>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-medium text-red-700">{product.price.toLocaleString()} G</span>
                                    {product.originalPrice && (
                                        <span className="text-sm text-gray-500 line-through">{t('suggested_price')} {product.originalPrice.toLocaleString()} G</span>
                                    )}
                                    {product.type === 'digital' && (
                                        <div className="mt-1 flex gap-2">
                                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded">Accès à vie</span>
                                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">Certificat inclus</span>
                                        </div>
                                    )}
                                    <div className="text-sm text-green-600 font-bold mt-1">
                                        {t('cashback_earn')} {Math.floor(product.price * 0.02).toLocaleString()} G {t('cashback_suffix')} (2%)
                                    </div>
                                </div>
                            </div>
                        </div>

                        {product.type === 'digital' && (
                            <div className="mb-6">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Check className="w-5 h-5 text-green-600" />
                                    Programme de la formation
                                </h3>
                                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">
                                    {[
                                        { title: "Introduction et fondamentaux", lessons: 4, duration: "45 min" },
                                        { title: "Maîtrise des outils avancés", lessons: 8, duration: "2h 30" },
                                        { title: "Projet pratique de fin d'études", lessons: 2, duration: "1h 15" }
                                    ].map((section, idx) => (
                                        <div key={idx} className="bg-white">
                                            <button
                                                onClick={() => setOpenLesson(openLesson === idx ? null : idx)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="text-left">
                                                    <div className="font-bold text-sm text-gray-900">{section.title}</div>
                                                    <div className="text-xs text-gray-500">{section.lessons} leçons • {section.duration}</div>
                                                </div>
                                                <Plus className={`w-4 h-4 text-gray-400 transition-transform ${openLesson === idx ? 'rotate-45' : ''}`} />
                                            </button>
                                            {openLesson === idx && (
                                                <div className="p-4 pt-0 space-y-2">
                                                    {[1, 2, 3].map(l => (
                                                        <div key={l} className="flex items-center gap-2 text-xs text-gray-600">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                                            Leçon {l} : Initiation aux concepts clés
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <h3 className="font-bold mb-2">{t('about_item')}</h3>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                                {product.features.map((feature, idx) => (
                                    <li key={idx}>{feature}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Size Selection & Fitting Room (Pro Optimization) */}
                        {product.type === 'physical' && (product.category === 'Vêtements' || product.category === 'Clothing' || product.category === 'Shoes' || product.category === 'Chaussures') && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-gray-900">Sélectionnez votre taille</h3>
                                    <button
                                        onClick={() => setShowFittingRoom(true)}
                                        className="text-primary-600 hover:text-primary-700 font-bold text-sm flex items-center gap-1 transition-colors"
                                    >
                                        <Ruler className="w-4 h-4" />
                                        Guide & Essayage Virtuel
                                    </button>
                                </div>

                                {/* Social Proof (Pro Optimization) */}
                                <div className="flex items-center gap-2 text-[11px] text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100 mb-4 font-medium">
                                    <Shirt className="w-4 h-4" />
                                    <span>85% des clients ont trouvé leur taille parfaite ici.</span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {(product.sizes || ['S', 'M', 'L', 'XL']).map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`min-w-[48px] h-10 border rounded-lg font-bold text-sm transition-all ${selectedSize === size ? 'border-primary-600 bg-primary-50 text-primary-600 ring-2 ring-primary-100' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>

                                {recommendedSize && selectedSize && selectedSize !== recommendedSize && (
                                    <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <AlertCircle className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-amber-900 text-sm mb-1">Attention à la taille !</h4>
                                                <p className="text-xs text-amber-700 leading-relaxed mb-3">
                                                    Notre algorithme d'essayage virtuel a calculé que la taille <b>{recommendedSize}</b> vous irait mieux que la taille <b>{selectedSize}</b> sélectionnée.
                                                </p>
                                                <button
                                                    onClick={() => setSelectedSize(recommendedSize)}
                                                    className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all shadow-sm"
                                                >
                                                    <Check className="w-3.5 h-3.5" /> Choisir ma taille recommandée ({recommendedSize})
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
                                            {t('deliver_to')} Philippe - Pétion-Ville
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="mb-4 text-sm">
                                    <div className="text-green-700 font-bold mb-1">{t('immediate_download')}</div>
                                    <div className="text-gray-500">{t('available_now')}</div>
                                </div>
                            )}

                            {/* Scarcity Alert */}
                            {product.type === 'physical' && (
                                <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100 animate-pulse">
                                    <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        Plus que 3 articles disponibles !
                                    </div>
                                    <p className="text-[10px] text-red-600 mt-1">Commandez maintenant pour garantir la livraison demain.</p>
                                </div>
                            )}

                            {/* Vendor Trust Block */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">CONFIANCE VENDEUR</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Fiabilité</span>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className={`w-3 h-1 rounded-full ${i <= 5 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Taux de réponse</span>
                                        <span className="text-sm font-bold text-gray-900">98%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Délai d'expédition</span>
                                        <span className="text-sm font-bold text-gray-900">&lt; 12h</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-xl text-green-700 font-medium mb-4">{t('in_stock')}</div>

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
                                    onClick={() => {
                                        if (product.type === 'physical' && !selectedSize && (product.sizes || []).length > 0) {
                                            alert("Veuillez sélectionner une taille.");
                                            return;
                                        }
                                        addToCart({ ...product, selectedSize, quantity: Number(quantity) }, Number(quantity));
                                        alert(`${product.title} ajouté au panier !`);
                                    }}
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
                        setSelectedSize(size);
                        setRecommendedSize(size);
                        addToCart({ ...prod, selectedSize: size, quantity: Number(quantity) });
                        alert(`Ajouté au panier - Taille ${size}`);
                    }}
                />
            )}

            {/* Video Trailer Modal */}
            {showTrailer && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                        <button
                            onClick={() => setShowTrailer(false)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
                                <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[25px] border-l-white border-b-[15px] border-b-transparent ml-2"></div>
                            </div>
                            <p className="text-white font-bold text-xl">Aperçu vidéo en cours de chargement...</p>
                            <p className="text-gray-400 text-sm mt-2 italic">Simulation d'un trailer professionnel</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
