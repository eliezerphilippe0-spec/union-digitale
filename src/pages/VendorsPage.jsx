import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Search, Filter, TrendingUp } from 'lucide-react';
import { useVendors } from '../hooks/useVendor';
import VendorCard from '../components/seller/VendorCard';
import './VendorsPage.css';

const VendorsPage = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        category: null,
        verified: null,
        orderByField: 'rating',
        orderDirection: 'desc'
    });
    const [searchTerm, setSearchTerm] = useState('');

    const { vendors, loading, error } = useVendors(filters);

    const categories = [
        { value: null, label: 'Toutes catégories' },
        { value: 'electronics', label: 'Électronique' },
        { value: 'fashion', label: 'Mode' },
        { value: 'home', label: 'Maison' },
        { value: 'services', label: 'Services' },
        { value: 'food', label: 'Alimentation' }
    ];

    const sortOptions = [
        { field: 'rating', direction: 'desc', label: 'Mieux notés' },
        { field: 'totalSales', direction: 'desc', label: 'Plus vendus' },
        { field: 'joinedDate', direction: 'desc', label: 'Plus récents' }
    ];

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSortChange = (option) => {
        setFilters(prev => ({
            ...prev,
            orderByField: option.field,
            orderDirection: option.direction
        }));
    };

    const filteredVendors = vendors.filter(vendor =>
        searchTerm === '' ||
        vendor.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="vendors-page">
            <div className="vendors-container">
                {/* Header */}
                <div className="vendors-header">
                    <div className="header-content">
                        <Store size={40} className="header-icon" />
                        <div>
                            <h1>Boutiques Vendeurs</h1>
                            <p>Découvrez nos vendeurs vérifiés et leurs produits</p>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="vendors-controls">
                    <div className="search-box">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher une boutique..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="filters-row">
                        <div className="filter-group">
                            <Filter size={18} />
                            <select
                                value={filters.category || ''}
                                onChange={(e) => handleFilterChange('category', e.target.value || null)}
                                className="filter-select"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value || 'all'} value={cat.value || ''}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={filters.verified === true}
                                    onChange={(e) => handleFilterChange('verified', e.target.checked ? true : null)}
                                />
                                <span>Vendeurs vérifiés uniquement</span>
                            </label>
                        </div>

                        <div className="filter-group">
                            <TrendingUp size={18} />
                            <select
                                value={`${filters.orderByField}-${filters.orderDirection}`}
                                onChange={(e) => {
                                    const option = sortOptions.find(
                                        opt => `${opt.field}-${opt.direction}` === e.target.value
                                    );
                                    if (option) handleSortChange(option);
                                }}
                                className="filter-select"
                            >
                                {sortOptions.map(opt => (
                                    <option key={`${opt.field}-${opt.direction}`} value={`${opt.field}-${opt.direction}`}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="results-info">
                    <p>{filteredVendors.length} boutique{filteredVendors.length !== 1 ? 's' : ''} trouvée{filteredVendors.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Vendors Grid */}
                {loading ? (
                    <div className="vendors-loading">
                        <div className="spinner"></div>
                        <p>Chargement des boutiques...</p>
                    </div>
                ) : error ? (
                    <div className="vendors-error">
                        <p>Erreur: {error}</p>
                    </div>
                ) : filteredVendors.length > 0 ? (
                    <div className="vendors-grid">
                        {filteredVendors.map(vendor => (
                            <VendorCard key={vendor.id} vendor={vendor} />
                        ))}
                    </div>
                ) : (
                    <div className="no-vendors">
                        <Store size={64} />
                        <h3>Aucune boutique trouvée</h3>
                        <p>Essayez de modifier vos filtres de recherche</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VendorsPage;
