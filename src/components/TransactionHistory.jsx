import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserTransactions, TRANSACTION_STATUS, TRANSACTION_TYPES } from '../utils/transactionLogger';
import { Clock, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import './TransactionHistory.css';

const TransactionHistory = ({ limit = 10, type = null }) => {
    const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (currentUser) {
            loadTransactions();
        }
    }, [currentUser, filter]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const options = {
                limit,
                type: type || (filter !== 'all' ? filter : null)
            };
            const data = await getUserTransactions(currentUser.uid, options);
            setTransactions(data);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case TRANSACTION_STATUS.COMPLETED:
                return <CheckCircle className="status-icon success" size={20} />;
            case TRANSACTION_STATUS.FAILED:
                return <XCircle className="status-icon error" size={20} />;
            case TRANSACTION_STATUS.PENDING:
            case TRANSACTION_STATUS.PROCESSING:
                return <Clock className="status-icon pending" size={20} />;
            default:
                return <AlertCircle className="status-icon" size={20} />;
        }
    };

    const getTypeLabel = (type) => {
        const labels = {
            [TRANSACTION_TYPES.RECHARGE_MONCASH]: 'Recharge MonCash',
            [TRANSACTION_TYPES.RECHARGE_NATCASH]: 'Recharge NatCash',
            [TRANSACTION_TYPES.TRANSFER]: 'Transfert d\'argent',
            [TRANSACTION_TYPES.PAYMENT_EDH]: 'Paiement EDH',
            [TRANSACTION_TYPES.PAYMENT_CAMEP]: 'Paiement CAMEP'
        };
        return labels[type] || type;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('fr-HT', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (!currentUser) {
        return (
            <div className="transaction-history">
                <p className="no-auth">Connectez-vous pour voir votre historique</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="transaction-history">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="transaction-history">
            <div className="history-header">
                <h2>Historique des transactions</h2>
                <div className="filter-buttons">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        Tout
                    </button>
                    <button
                        className={filter === TRANSACTION_STATUS.COMPLETED ? 'active' : ''}
                        onClick={() => setFilter(TRANSACTION_STATUS.COMPLETED)}
                    >
                        Complétées
                    </button>
                    <button
                        className={filter === TRANSACTION_STATUS.PENDING ? 'active' : ''}
                        onClick={() => setFilter(TRANSACTION_STATUS.PENDING)}
                    >
                        En attente
                    </button>
                </div>
            </div>

            {transactions.length === 0 ? (
                <div className="no-transactions">
                    <AlertCircle size={48} />
                    <p>Aucune transaction trouvée</p>
                </div>
            ) : (
                <div className="transactions-list">
                    {transactions.map((transaction) => (
                        <div key={transaction.id} className="transaction-item">
                            <div className="transaction-icon">
                                {getStatusIcon(transaction.status)}
                            </div>
                            <div className="transaction-details">
                                <div className="transaction-type">
                                    {getTypeLabel(transaction.type)}
                                </div>
                                <div className="transaction-meta">
                                    <span className="transaction-ref">{transaction.referenceId}</span>
                                    <span className="transaction-date">{formatDate(transaction.createdAt)}</span>
                                </div>
                                {transaction.recipient && (
                                    <div className="transaction-recipient">
                                        À: {transaction.recipient}
                                    </div>
                                )}
                            </div>
                            <div className="transaction-amount">
                                <span className="amount">{transaction.amount.toLocaleString()} HTG</span>
                                <span className={`status ${transaction.status}`}>
                                    {transaction.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {transactions.length > 0 && (
                <div className="history-footer">
                    <button className="export-button">
                        <Download size={18} />
                        Exporter
                    </button>
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;
