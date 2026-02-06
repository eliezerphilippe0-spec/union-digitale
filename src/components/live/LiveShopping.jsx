/**
 * Live Shopping Component - Real-time Shopping Experience
 * Inspired by: TikTok Shop, Amazon Live, Taobao Live
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
    Play, Pause, Volume2, VolumeX, Heart, MessageCircle, Share2, 
    ShoppingBag, Users, Gift, Star, X, Send, ChevronUp, Sparkles
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../ui/Toast';

// Mock live stream data
const MOCK_STREAMS = [
    {
        id: 'live_1',
        title: 'Nouveautés Tech 📱 iPhone & Gadgets',
        host: { name: 'TechMaster', avatar: '👨‍💻', verified: true },
        viewers: 1247,
        likes: 3420,
        thumbnail: '📱',
        isLive: true,
        products: [
            { id: 'p1', title: 'iPhone 15 Pro Max', price: 125000, originalPrice: 145000, stock: 5, image: '📱' },
            { id: 'p2', title: 'AirPods Pro 2', price: 25000, originalPrice: 30000, stock: 12, image: '🎧' },
            { id: 'p3', title: 'Apple Watch Ultra', price: 75000, originalPrice: 85000, stock: 3, image: '⌚' },
        ],
    },
    {
        id: 'live_2',
        title: 'Mode Haïtienne 🇭🇹 Collection Été',
        host: { name: 'FashionQueen', avatar: '👩‍🎤', verified: true },
        viewers: 892,
        likes: 2156,
        thumbnail: '👗',
        isLive: true,
        products: [
            { id: 'p4', title: 'Robe Madras', price: 3500, originalPrice: 5000, stock: 20, image: '👗' },
            { id: 'p5', title: 'Chemise Brodée', price: 2800, originalPrice: 3500, stock: 15, image: '👔' },
        ],
    },
];

// Mock chat messages
const generateMockMessages = () => [
    { id: 1, user: 'Marie', message: 'Trop beau! 😍', time: '12:01' },
    { id: 2, user: 'Jean', message: 'Il reste combien en stock?', time: '12:02' },
    { id: 3, user: 'Pierre', message: 'Je viens de commander! 🛒', time: '12:03', isHighlight: true },
    { id: 4, user: 'Rose', message: 'Livraison gratuite?', time: '12:04' },
];

const LiveShopping = ({ streamId, onClose }) => {
    const { addToCart } = useCart();
    const toast = useToast();
    
    const [stream, setStream] = useState(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const [showProducts, setShowProducts] = useState(false);
    const [messages, setMessages] = useState(generateMockMessages());
    const [newMessage, setNewMessage] = useState('');
    const [likes, setLikes] = useState(0);
    const [viewers, setViewers] = useState(0);
    const [floatingHearts, setFloatingHearts] = useState([]);
    
    const chatRef = useRef(null);
    const heartIdRef = useRef(0);

    // Load stream data
    useEffect(() => {
        const foundStream = MOCK_STREAMS.find(s => s.id === streamId) || MOCK_STREAMS[0];
        setStream(foundStream);
        setLikes(foundStream.likes);
        setViewers(foundStream.viewers);
    }, [streamId]);

    // Simulate viewer count changes
    useEffect(() => {
        const interval = setInterval(() => {
            setViewers(prev => prev + Math.floor(Math.random() * 5) - 2);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Simulate incoming messages
    useEffect(() => {
        const interval = setInterval(() => {
            const randomMessages = [
                'Wow! 🔥', 'Combien?', 'Je veux!', 'Magnifique 😍', 
                'Livraison vers Cayes?', 'Stock?', '❤️❤️❤️', 'Top!',
                'Je commande maintenant', 'Promo valide jusqu\'à quand?'
            ];
            const randomUsers = ['Sophie', 'Max', 'Claudia', 'Fritz', 'Nadia', 'Marc'];
            
            const newMsg = {
                id: Date.now(),
                user: randomUsers[Math.floor(Math.random() * randomUsers.length)],
                message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            };
            
            setMessages(prev => [...prev.slice(-50), newMsg]);
        }, 3000 + Math.random() * 4000);
        
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const handleLike = () => {
        setLikes(prev => prev + 1);
        
        // Add floating heart animation
        const heartId = heartIdRef.current++;
        setFloatingHearts(prev => [...prev, { id: heartId, x: Math.random() * 60 + 20 }]);
        
        // Remove heart after animation
        setTimeout(() => {
            setFloatingHearts(prev => prev.filter(h => h.id !== heartId));
        }, 2000);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        const msg = {
            id: Date.now(),
            user: 'Vous',
            message: newMessage,
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            isOwn: true,
        };
        
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
    };

    const handleAddToCart = (product) => {
        addToCart(product);
        toast?.success(`${product.title} ajouté au panier! 🛒`);
        
        // Add highlight message
        setMessages(prev => [...prev, {
            id: Date.now(),
            user: 'Système',
            message: `🛒 Vous avez ajouté "${product.title}" au panier!`,
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            isHighlight: true,
        }]);
    };

    if (!stream) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Video Area */}
            <div className="relative flex-1 bg-gradient-to-br from-purple-900 via-indigo-900 to-black">
                {/* Mock Video Background */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[200px] opacity-30">{stream.thumbnail}</span>
                </div>

                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                            <span className="w-2 h-2 bg-white rounded-full" />
                            LIVE
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                            <Users className="w-4 h-4" />
                            {viewers.toLocaleString()}
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Host Info */}
                <div className="absolute top-16 left-4">
                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-full pr-4 pl-1 py-1">
                        <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-xl">
                            {stream.host.avatar}
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <span className="text-white font-semibold text-sm">{stream.host.name}</span>
                                {stream.host.verified && <span className="text-blue-400">✓</span>}
                            </div>
                            <p className="text-gray-300 text-xs">{stream.title}</p>
                        </div>
                    </div>
                </div>

                {/* Floating Hearts Animation */}
                {floatingHearts.map(heart => (
                    <div
                        key={heart.id}
                        className="absolute bottom-32 animate-float-up pointer-events-none"
                        style={{ left: `${heart.x}%` }}
                    >
                        <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                    </div>
                ))}

                {/* Right Side Actions */}
                <div className="absolute right-4 bottom-32 flex flex-col gap-4">
                    <button 
                        onClick={handleLike}
                        className="flex flex-col items-center gap-1"
                    >
                        <div className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                            <Heart className="w-6 h-6" />
                        </div>
                        <span className="text-white text-xs">{(likes / 1000).toFixed(1)}k</span>
                    </button>
                    
                    <button 
                        onClick={() => setShowChat(!showChat)}
                        className="flex flex-col items-center gap-1"
                    >
                        <div className={`w-12 h-12 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors ${showChat ? 'bg-blue-500' : 'bg-black/40'}`}>
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <span className="text-white text-xs">Chat</span>
                    </button>
                    
                    <button className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-green-500 transition-colors">
                            <Share2 className="w-6 h-6" />
                        </div>
                        <span className="text-white text-xs">Partager</span>
                    </button>
                    
                    <button 
                        onClick={() => setShowProducts(!showProducts)}
                        className="flex flex-col items-center gap-1"
                    >
                        <div className={`w-12 h-12 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors ${showProducts ? 'bg-gold-500' : 'bg-black/40'}`}>
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <span className="text-white text-xs">Produits</span>
                    </button>
                </div>

                {/* Chat Overlay */}
                {showChat && (
                    <div className="absolute left-4 bottom-32 right-20 max-h-48">
                        <div ref={chatRef} className="space-y-2 overflow-y-auto max-h-40 scrollbar-hide">
                            {messages.slice(-15).map(msg => (
                                <div 
                                    key={msg.id} 
                                    className={`flex items-start gap-2 ${msg.isHighlight ? 'bg-gold-500/20 rounded-lg p-1' : ''}`}
                                >
                                    <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 max-w-[80%]">
                                        <span className={`font-semibold text-xs ${msg.isOwn ? 'text-gold-400' : 'text-blue-400'}`}>
                                            {msg.user}:
                                        </span>
                                        <span className="text-white text-sm ml-1">{msg.message}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Video Controls */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
                    >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
                    >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Products Panel */}
            {showProducts && (
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[60vh] overflow-y-auto animate-slide-up">
                    <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-gold-500" />
                            Produits en direct
                        </h3>
                        <button onClick={() => setShowProducts(false)}>
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>
                    
                    <div className="p-4 space-y-3">
                        {stream.products.map(product => (
                            <div key={product.id} className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-3xl shadow-sm">
                                    {product.image}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{product.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-lg font-bold text-red-600">{product.price.toLocaleString()} G</span>
                                        {product.originalPrice && (
                                            <span className="text-sm text-gray-400 line-through">{product.originalPrice.toLocaleString()} G</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-orange-600 mt-1">🔥 Plus que {product.stock} en stock!</p>
                                </div>
                                <button 
                                    onClick={() => handleAddToCart(product)}
                                    className="self-center bg-gradient-to-r from-gold-500 to-gold-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:from-gold-400 hover:to-gold-500 transition-all"
                                >
                                    Acheter
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat Input */}
            <div className="bg-black p-4 safe-area-bottom">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Envoyer un message..."
                        className="flex-1 bg-white/10 text-white placeholder-gray-400 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                    <button 
                        type="submit"
                        className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center text-white hover:bg-gold-400"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

// Live Streams List Component
export const LiveStreamsList = () => {
    const [selectedStream, setSelectedStream] = useState(null);

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-4 px-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    En Direct
                </h2>
                <button className="text-sm text-gold-600 font-medium">Voir tout</button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide">
                {MOCK_STREAMS.map(stream => (
                    <button
                        key={stream.id}
                        onClick={() => setSelectedStream(stream.id)}
                        className="flex-shrink-0 w-40 group"
                    >
                        <div className="relative aspect-[3/4] bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl overflow-hidden mb-2">
                            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-50">
                                {stream.thumbnail}
                            </div>
                            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                LIVE
                            </div>
                            <div className="absolute bottom-2 left-2 right-2">
                                <div className="flex items-center gap-1 text-white text-xs">
                                    <Users className="w-3 h-3" />
                                    {stream.viewers.toLocaleString()}
                                </div>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{stream.title}</p>
                        <p className="text-xs text-gray-500">{stream.host.name}</p>
                    </button>
                ))}
            </div>

            {selectedStream && (
                <LiveShopping 
                    streamId={selectedStream} 
                    onClose={() => setSelectedStream(null)} 
                />
            )}
        </div>
    );
};

export default LiveShopping;
