/**
 * POS Terminal - Point of Sale for In-Person Sales
 * Inspired by: Shopify POS, Square, Toast
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    Search, Plus, Minus, Trash2, CreditCard, Smartphone, Banknote,
    User, Tag, Percent, Receipt, Printer, CheckCircle, X, Grid,
    List, Barcode, Calculator, Clock, ArrowLeft
} from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useToast } from '../../components/ui/Toast';

// Mock categories for quick access
const QUICK_CATEGORIES = [
    { id: 'all', name: 'Tous', icon: '📦' },
    { id: 'electronics', name: 'Électronique', icon: '📱' },
    { id: 'clothing', name: 'Vêtements', icon: '👕' },
    { id: 'food', name: 'Alimentation', icon: '🍎' },
    { id: 'beauty', name: 'Beauté', icon: '💄' },
    { id: 'home', name: 'Maison', icon: '🏠' },
];

// Payment methods
const PAYMENT_METHODS = [
    { id: 'cash', name: 'Espèces', icon: Banknote, color: 'bg-green-500' },
    { id: 'moncash', name: 'MonCash', icon: Smartphone, color: 'bg-red-500' },
    { id: 'card', name: 'Carte', icon: CreditCard, color: 'bg-blue-500' },
];

const POSTerminal = () => {
    const { products, loading } = useProducts();
    const toast = useToast();
    
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [showPayment, setShowPayment] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [discount, setDiscount] = useState({ type: 'percent', value: 0 });
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [cashReceived, setCashReceived] = useState('');
    const [lastOrder, setLastOrder] = useState(null);
    
    const searchInputRef = useRef(null);

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Cart calculations
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = discount.type === 'percent' 
        ? subtotal * (discount.value / 100)
        : discount.value;
    const total = Math.max(0, subtotal - discountAmount);
    const change = cashReceived ? parseFloat(cashReceived) - total : 0;

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if (e.key === 'F4' && cart.length > 0) {
                e.preventDefault();
                setShowPayment(true);
            }
            if (e.key === 'Escape') {
                setShowPayment(false);
                setShowReceipt(false);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart]);

    // Add to cart
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        toast?.success(`${product.title} ajouté`);
    };

    // Update quantity
    const updateQuantity = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(0, item.quantity + delta);
                return newQty === 0 ? null : { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean));
    };

    // Remove from cart
    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    // Clear cart
    const clearCart = () => {
        setCart([]);
        setDiscount({ type: 'percent', value: 0 });
        setCustomerName('');
    };

    // Process payment
    const processPayment = () => {
        if (!selectedPayment) {
            toast?.error('Sélectionnez un mode de paiement');
            return;
        }

        if (selectedPayment === 'cash' && parseFloat(cashReceived) < total) {
            toast?.error('Montant insuffisant');
            return;
        }

        // Create order
        const order = {
            id: `POS-${Date.now()}`,
            items: cart,
            subtotal,
            discount: discountAmount,
            total,
            paymentMethod: selectedPayment,
            cashReceived: selectedPayment === 'cash' ? parseFloat(cashReceived) : null,
            change: selectedPayment === 'cash' ? change : null,
            customer: customerName,
            timestamp: new Date().toISOString(),
        };

        setLastOrder(order);
        setShowPayment(false);
        setShowReceipt(true);
        
        // Clear for next transaction
        setTimeout(() => {
            clearCart();
            setCashReceived('');
            setSelectedPayment(null);
        }, 500);
    };

    // Print receipt (mock)
    const printReceipt = () => {
        toast?.success('Ticket envoyé à l\'imprimante');
    };

    return (
        <div className="h-screen bg-gray-100 flex">
            {/* Left Panel - Products */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Point de Vente</h1>
                        <div className="flex-1" />
                        <div className="text-sm text-gray-500">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {new Date().toLocaleTimeString('fr-FR')}
                        </div>
                    </div>
                </div>

                {/* Search & Categories */}
                <div className="bg-white border-b border-gray-200 p-4 space-y-3">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher un produit (F2)..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
                            />
                        </div>
                        <button className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200">
                            <Barcode className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {QUICK_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                                    selectedCategory === cat.id
                                        ? 'bg-gold-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <span>{cat.icon}</span>
                                <span className="font-medium">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {[...Array(15)].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                                    <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                                    <div className="h-4 bg-gray-200 rounded mb-2" />
                                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                                </div>
                            ))}
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="bg-white rounded-xl p-4 text-left hover:shadow-lg hover:scale-[1.02] transition-all border border-gray-100"
                                >
                                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-4xl">
                                        {product.image || '📦'}
                                    </div>
                                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                                        {product.title}
                                    </h3>
                                    <p className="text-gold-600 font-bold">
                                        {product.price.toLocaleString()} G
                                    </p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="w-full bg-white rounded-xl p-3 flex items-center gap-4 hover:shadow-md transition-shadow border border-gray-100"
                                >
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                                        {product.image || '📦'}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className="font-medium text-gray-900">{product.title}</h3>
                                        <p className="text-sm text-gray-500">SKU: {product.id}</p>
                                    </div>
                                    <p className="text-gold-600 font-bold text-lg">
                                        {product.price.toLocaleString()} G
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Cart */}
            <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
                {/* Cart Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-lg">Panier</h2>
                        <button
                            onClick={clearCart}
                            disabled={cart.length === 0}
                            className="text-red-500 text-sm hover:text-red-600 disabled:opacity-50"
                        >
                            Vider
                        </button>
                    </div>
                    
                    {/* Customer */}
                    <div className="mt-3 flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Nom du client (optionnel)"
                            className="flex-1 text-sm border-none focus:outline-none"
                        />
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Panier vide</p>
                            <p className="text-sm">Scannez ou cliquez sur un produit</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-xl">
                                    {item.image || '📦'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">{item.title}</h4>
                                    <p className="text-gold-600 font-bold text-sm">
                                        {item.price.toLocaleString()} G
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateQuantity(item.id, -1)}
                                        className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, 1)}
                                        className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-2 text-red-400 hover:text-red-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Summary */}
                <div className="p-4 border-t border-gray-200 space-y-3">
                    {/* Discount */}
                    <div className="flex items-center gap-2">
                        <Percent className="w-5 h-5 text-gray-400" />
                        <input
                            type="number"
                            value={discount.value || ''}
                            onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                            placeholder="Remise"
                            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2"
                        />
                        <select
                            value={discount.type}
                            onChange={(e) => setDiscount({ ...discount, type: e.target.value })}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2"
                        >
                            <option value="percent">%</option>
                            <option value="fixed">G</option>
                        </select>
                    </div>

                    {/* Totals */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-500">
                            <span>Sous-total</span>
                            <span>{subtotal.toLocaleString()} G</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Remise</span>
                                <span>-{discountAmount.toLocaleString()} G</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span className="text-gold-600">{total.toLocaleString()} G</span>
                        </div>
                    </div>

                    {/* Pay Button */}
                    <button
                        onClick={() => setShowPayment(true)}
                        disabled={cart.length === 0}
                        className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                        <CreditCard className="w-5 h-5" />
                        Payer (F4)
                    </button>
                </div>
            </div>

            {/* Payment Modal */}
            {showPayment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Paiement</h2>
                            <button onClick={() => setShowPayment(false)}>
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500">Total à payer</p>
                            <p className="text-4xl font-bold text-gold-600">{total.toLocaleString()} G</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {PAYMENT_METHODS.map(method => {
                                const Icon = method.icon;
                                return (
                                    <button
                                        key={method.id}
                                        onClick={() => setSelectedPayment(method.id)}
                                        className={`p-4 rounded-xl border-2 transition-all ${
                                            selectedPayment === method.id
                                                ? 'border-gold-500 bg-gold-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <p className="text-sm font-medium">{method.name}</p>
                                    </button>
                                );
                            })}
                        </div>

                        {selectedPayment === 'cash' && (
                            <div className="mb-6">
                                <label className="block text-sm text-gray-500 mb-2">Montant reçu</label>
                                <input
                                    type="number"
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value)}
                                    className="w-full text-2xl font-bold text-center border-2 border-gray-200 rounded-xl py-4 focus:border-gold-500 focus:outline-none"
                                    placeholder="0"
                                    autoFocus
                                />
                                {change > 0 && (
                                    <p className="text-center text-green-600 font-bold mt-2">
                                        Monnaie: {change.toLocaleString()} G
                                    </p>
                                )}
                            </div>
                        )}

                        <button
                            onClick={processPayment}
                            disabled={!selectedPayment || (selectedPayment === 'cash' && parseFloat(cashReceived) < total)}
                            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition-colors"
                        >
                            Confirmer le paiement
                        </button>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceipt && lastOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement Réussi!</h2>
                        <p className="text-gray-500 mb-4">Commande #{lastOrder.id}</p>
                        
                        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">Total</span>
                                <span className="font-bold">{lastOrder.total.toLocaleString()} G</span>
                            </div>
                            {lastOrder.cashReceived && (
                                <>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Reçu</span>
                                        <span>{lastOrder.cashReceived.toLocaleString()} G</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Monnaie</span>
                                        <span className="font-bold">{lastOrder.change.toLocaleString()} G</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={printReceipt}
                                className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50"
                            >
                                <Printer className="w-5 h-5" />
                                Imprimer
                            </button>
                            <button
                                onClick={() => setShowReceipt(false)}
                                className="flex-1 bg-gold-500 text-white py-3 rounded-xl hover:bg-gold-600"
                            >
                                Nouvelle vente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSTerminal;
