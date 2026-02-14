import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getVendorStats, getWalletTransactions, requestPayout, getPayoutHistory } from '../services/vendorWalletService';
import { getCommissionBreakdown } from '../services/commissionService';
import SEO from '../components/common/SEO';
import './VendorDashboard.css';

export default function VendorDashboard() {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [commissionBreakdown, setCommissionBreakdown] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showPayoutModal, setShowPayoutModal] = useState(false);

    useEffect(() => {
        if (currentUser) {
            loadDashboardData();
        }
    }, [currentUser]);

    async function loadDashboardData() {
        try {
            setLoading(true);
            const [statsData, txData, payoutData, commissionData] = await Promise.all([
                getVendorStats(currentUser.uid),
                getWalletTransactions(currentUser.uid, { limit: 10 }),
                getPayoutHistory(currentUser.uid, { limit: 10 }),
                getCommissionBreakdown(currentUser.uid, 'month')
            ]);

            setStats(statsData);
            setTransactions(txData.transactions);
            setPayouts(payoutData.payouts);
            setCommissionBreakdown(commissionData);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="vendor-dashboard loading">
                <div className="spinner"></div>
                <p>Chargement...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="vendor-dashboard error">
                <p>Erreur de chargement des données</p>
            </div>
        );
    }

    return (
        <div className="vendor-dashboard">
            <SEO title="Dashboard vendeur" description="Suivez vos ventes, commissions et paiements." />
            <header className="dashboard-header">
                <h1>Tableau de Bord Vendeur</h1>
                <div className="verification-badge">
                    {stats.verification.level === 'premium' && <span className="badge premium">⭐ Premium</span>}
                    {stats.verification.level === 'verified' && <span className="badge verified">✅ Vérifié</span>}
                    {stats.verification.level === 'standard' && <span className="badge standard">Standard</span>}
                </div>
            </header>

            {/* Wallet Summary */}
            <section className="wallet-summary">
                <div className="balance-cards">
                    <div className="balance-card available">
                        <div className="card-icon">💰</div>
                        <div className="card-content">
                            <span className="label">Disponible</span>
                            <h2 className="amount">{stats.wallet.availableBalance.toLocaleString()} HTG</h2>
                            <button
                                className="btn-primary"
                                onClick={() => setShowPayoutModal(true)}
                                disabled={stats.wallet.availableBalance < 500}
                            >
                                Retirer
                            </button>
                        </div>
                    </div>

                    <div className="balance-card pending">
                        <div className="card-icon">⏳</div>
                        <div className="card-content">
                            <span className="label">En attente (J+3)</span>
                            <h2 className="amount">{stats.wallet.pendingBalance.toLocaleString()} HTG</h2>
                            <p className="hint">Disponible dans 3 jours</p>
                        </div>
                    </div>

                    <div className="balance-card total">
                        <div className="card-icon">📊</div>
                        <div className="card-content">
                            <span className="label">Revenus totaux</span>
                            <h2 className="amount">{stats.wallet.totalEarnings.toLocaleString()} HTG</h2>
                            <p className="hint">{stats.performance.totalOrders} commandes</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Performance Metrics */}
            <section className="performance-metrics">
                <h3>Performance</h3>
                <div className="metrics-grid">
                    <MetricCard
                        icon="⭐"
                        label="Note moyenne"
                        value={stats.performance.rating.toFixed(1)}
                        max={5}
                    />
                    <MetricCard
                        icon="✅"
                        label="Taux de succès"
                        value={`${stats.performance.successRate}%`}
                    />
                    <MetricCard
                        icon="⏱️"
                        label="Temps de réponse"
                        value={`${stats.performance.responseTime}h`}
                    />
                    <MetricCard
                        icon="📦"
                        label="Commandes"
                        value={stats.performance.totalOrders}
                    />
                </div>
            </section>

            {/* Tabs */}
            <div className="dashboard-tabs">
                <button
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => setActiveTab('overview')}
                >
                    Vue d'ensemble
                </button>
                <button
                    className={activeTab === 'transactions' ? 'active' : ''}
                    onClick={() => setActiveTab('transactions')}
                >
                    Transactions
                </button>
                <button
                    className={activeTab === 'payouts' ? 'active' : ''}
                    onClick={() => setActiveTab('payouts')}
                >
                    Retraits
                </button>
                <button
                    className={activeTab === 'commissions' ? 'active' : ''}
                    onClick={() => setActiveTab('commissions')}
                >
                    Commissions
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'overview' && (
                    <OverviewTab
                        stats={stats}
                        transactions={transactions.slice(0, 5)}
                    />
                )}
                {activeTab === 'transactions' && (
                    <TransactionsTab transactions={transactions} vendorId={currentUser.uid} />
                )}
                {activeTab === 'payouts' && (
                    <PayoutsTab payouts={payouts} vendorId={currentUser.uid} />
                )}
                {activeTab === 'commissions' && (
                    <CommissionsTab breakdown={commissionBreakdown} />
                )}
            </div>

            {/* Payout Modal */}
            {showPayoutModal && (
                <PayoutModal
                    availableBalance={stats.wallet.availableBalance}
                    onClose={() => setShowPayoutModal(false)}
                    onSuccess={loadDashboardData}
                />
            )}
        </div>
    );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MetricCard({ icon, label, value, max }) {
    return (
        <div className="metric-card">
            <div className="metric-icon">{icon}</div>
            <div className="metric-content">
                <span className="metric-label">{label}</span>
                <div className="metric-value">
                    {value}
                    {max && <span className="metric-max">/{max}</span>}
                </div>
            </div>
        </div>
    );
}

function OverviewTab({ stats, transactions }) {
    return (
        <div className="overview-tab">
            <div className="recent-activity">
                <h3>Activité récente</h3>
                {transactions.length > 0 ? (
                    <div className="transactions-list">
                        {transactions.map(tx => (
                            <TransactionItem key={tx.id} transaction={tx} />
                        ))}
                    </div>
                ) : (
                    <p className="empty-state">Aucune transaction récente</p>
                )}
            </div>
        </div>
    );
}

function TransactionsTab({ transactions, vendorId }) {
    const [allTransactions, setAllTransactions] = useState(transactions);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);

    async function loadMore() {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const result = await getWalletTransactions(vendorId, {
                limit: 20,
                startAfter: lastDoc
            });

            setAllTransactions([...allTransactions, ...result.transactions]);
            setHasMore(result.hasMore);
            setLastDoc(result.lastDoc);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="transactions-tab">
            <h3>Historique des transactions</h3>
            <div className="transactions-list">
                {allTransactions.map(tx => (
                    <TransactionItem key={tx.id} transaction={tx} detailed />
                ))}
            </div>
            {hasMore && (
                <button onClick={loadMore} disabled={loading} className="btn-secondary">
                    {loading ? 'Chargement...' : 'Charger plus'}
                </button>
            )}
        </div>
    );
}

function TransactionItem({ transaction, detailed = false }) {
    const getTypeLabel = (type) => {
        const labels = {
            sale: 'Vente',
            commission: 'Commission',
            payout: 'Retrait',
            refund: 'Remboursement',
            release: 'Fonds disponibles',
            hold: 'Fonds bloqués'
        };
        return labels[type] || type;
    };

    const getTypeIcon = (type) => {
        const icons = {
            sale: '💰',
            commission: '💳',
            payout: '🏦',
            refund: '↩️',
            release: '✅',
            hold: '⏸️'
        };
        return icons[type] || '📝';
    };

    return (
        <div className={`transaction-item ${transaction.type}`}>
            <div className="tx-icon">{getTypeIcon(transaction.type)}</div>
            <div className="tx-content">
                <div className="tx-header">
                    <span className="tx-type">{getTypeLabel(transaction.type)}</span>
                    <span className={`tx-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                        {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()} HTG
                    </span>
                </div>
                <p className="tx-description">{transaction.description}</p>
                {detailed && transaction.metadata && (
                    <div className="tx-metadata">
                        {transaction.metadata.commission && (
                            <span>Commission: {transaction.metadata.commission} HTG</span>
                        )}
                        {transaction.metadata.commissionRate && (
                            <span>Taux: {(transaction.metadata.commissionRate * 100).toFixed(1)}%</span>
                        )}
                    </div>
                )}
            </div>
            <div className="tx-date">
                {transaction.createdAt?.toDate?.().toLocaleDateString('fr-HT')}
            </div>
        </div>
    );
}

function PayoutsTab({ payouts, vendorId }) {
    return (
        <div className="payouts-tab">
            <h3>Historique des retraits</h3>
            {payouts.length > 0 ? (
                <div className="payouts-list">
                    {payouts.map(payout => (
                        <PayoutItem key={payout.id} payout={payout} />
                    ))}
                </div>
            ) : (
                <p className="empty-state">Aucun retrait effectué</p>
            )}
        </div>
    );
}

function PayoutItem({ payout }) {
    const getStatusBadge = (status) => {
        const badges = {
            pending: { label: 'En attente', class: 'pending', icon: '⏳' },
            processing: { label: 'En cours', class: 'processing', icon: '⚙️' },
            completed: { label: 'Complété', class: 'completed', icon: '✅' },
            failed: { label: 'Échoué', class: 'failed', icon: '❌' },
            cancelled: { label: 'Annulé', class: 'cancelled', icon: '🚫' }
        };
        return badges[status] || badges.pending;
    };

    const badge = getStatusBadge(payout.status);

    return (
        <div className="payout-item">
            <div className="payout-header">
                <span className={`status-badge ${badge.class}`}>
                    {badge.icon} {badge.label}
                </span>
                <span className="payout-amount">{payout.amount.toLocaleString()} HTG</span>
            </div>
            <div className="payout-details">
                <span>Méthode: {payout.method}</span>
                <span>Frais: {payout.fees} HTG</span>
                <span>Net: {payout.netAmount?.toLocaleString()} HTG</span>
            </div>
            <div className="payout-date">
                Demandé le {payout.requestedAt?.toDate?.().toLocaleDateString('fr-HT')}
            </div>
        </div>
    );
}

function CommissionsTab({ breakdown }) {
    if (!breakdown) return <div>Chargement...</div>;

    return (
        <div className="commissions-tab">
            <h3>Détail des commissions (30 derniers jours)</h3>

            <div className="commission-summary">
                <div className="summary-card">
                    <span className="label">Ventes totales</span>
                    <h3>{breakdown.totalSales.toLocaleString()} HTG</h3>
                </div>
                <div className="summary-card">
                    <span className="label">Commissions</span>
                    <h3>{breakdown.totalCommissions.toLocaleString()} HTG</h3>
                </div>
                <div className="summary-card">
                    <span className="label">Vos revenus</span>
                    <h3>{breakdown.totalEarnings.toLocaleString()} HTG</h3>
                </div>
                <div className="summary-card">
                    <span className="label">Taux moyen</span>
                    <h3>{(breakdown.averageCommissionRate * 100).toFixed(1)}%</h3>
                </div>
            </div>

            <div className="commission-chart">
                <p className="info">
                    💡 Augmentez votre niveau de vérification pour réduire vos commissions !
                </p>
                <ul className="commission-rates">
                    <li>Standard: 10-15%</li>
                    <li>Vérifié ✅: 8-13% (-2%)</li>
                    <li>Premium ⭐: 7-12% (-3%)</li>
                </ul>
            </div>
        </div>
    );
}

function PayoutModal({ availableBalance, onClose, onSuccess }) {
    const { currentUser } = useAuth();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('moncash');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const MINIMUM_PAYOUT = 500;
    const PAYOUT_FEE = 50;

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        const amountNum = parseFloat(amount);

        if (amountNum < MINIMUM_PAYOUT) {
            setError(`Montant minimum: ${MINIMUM_PAYOUT} HTG`);
            return;
        }

        if (amountNum > availableBalance) {
            setError('Solde insuffisant');
            return;
        }

        if (!phoneNumber.match(/^[0-9]{4}-[0-9]{4}$/)) {
            setError('Format téléphone invalide (XXXX-XXXX)');
            return;
        }

        setLoading(true);
        try {
            await requestPayout({
                amount: amountNum,
                currency: 'HTG',
                method,
                destination: { phoneNumber }
            }, currentUser);

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const netAmount = amount ? parseFloat(amount) - PAYOUT_FEE : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Demander un retrait</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Montant (HTG)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            min={MINIMUM_PAYOUT}
                            max={availableBalance}
                            required
                        />
                        <small>Disponible: {availableBalance.toLocaleString()} HTG</small>
                    </div>

                    <div className="form-group">
                        <label>Méthode</label>
                        <select value={method} onChange={e => setMethod(e.target.value)}>
                            <option value="moncash">MonCash</option>
                            <option value="natcash">NatCash</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Numéro de téléphone</label>
                        <input
                            type="text"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            placeholder="XXXX-XXXX"
                            pattern="[0-9]{4}-[0-9]{4}"
                            required
                        />
                    </div>

                    {amount && (
                        <div className="payout-summary">
                            <div className="summary-row">
                                <span>Montant demandé</span>
                                <span>{parseFloat(amount).toLocaleString()} HTG</span>
                            </div>
                            <div className="summary-row">
                                <span>Frais de retrait</span>
                                <span>-{PAYOUT_FEE} HTG</span>
                            </div>
                            <div className="summary-row total">
                                <span>Vous recevrez</span>
                                <span>{netAmount.toLocaleString()} HTG</span>
                            </div>
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Annuler
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Traitement...' : 'Confirmer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
